import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  DEFAULT_ROOM,
  sanitizeBlock,
  sanitizeId,
  sanitizePlayerState,
  sanitizeRoom
} from '../src/net/protocol.js';
import { NetworkClient } from '../src/net/NetworkClient.js';
import { RemotePlayers, lerpAngle } from '../src/net/RemotePlayers.js';
import { createApp, startServer } from '../server/index.js';

function fakeSocket() {
  const handlers = new Map();
  const emitted = [];
  return {
    handlers,
    emitted,
    on(event, handler) {
      handlers.set(event, handler);
      return this;
    },
    emit(event, payload) {
      emitted.push({ event, payload });
      return this;
    },
    disconnect() {
      emitted.push({ event: 'disconnect' });
    },
    trigger(event, payload) {
      handlers.get(event)?.(payload);
    }
  };
}

function healthyFetch() {
  return async () => ({
    ok: true,
    headers: { get: () => 'application/json; charset=utf-8' },
    json: async () => ({ ok: true, server: 'chero-world' })
  });
}

function fakeAvatar() {
  return {
    group: new THREE.Group(),
    materials: { face: { map: { dispose() {} } } },
    skins: [],
    animations: [],
    setSkin(skin) {
      this.skins.push(skin.id);
    },
    updateAnimation(dt, moving, grounded, speed) {
      this.animations.push({ dt, moving, grounded, speed });
    }
  };
}

test('el protocolo acota bloques y transformaciones antes de difundirlos', () => {
  const block = sanitizeBlock({
    id: 'block_1',
    position: { x: 9999, y: -999, z: 2 },
    size: { x: 99, y: 2, z: 2 },
    color: 0xFF0000
  });

  assert.deepEqual(block, {
    id: 'block_1',
    position: { x: 500, y: -50, z: 2 },
    size: { x: 12, y: 2, z: 2 },
    color: 0xFF0000
  });
  assert.equal(sanitizeBlock({ position: block.position, size: block.size }), null);
  assert.match(sanitizeBlock({ position: block.position, size: block.size }, true).id, /^block_/);
  assert.equal(sanitizeId('../ruta'), null);
  assert.equal(sanitizeRoom('sala sprites'), DEFAULT_ROOM);

  const state = sanitizePlayerState({
    position: { x: 1, y: 999, z: -1 },
    rotationY: 4,
    moving: true,
    grounded: false,
    speed: 99,
    skin: 'explorador'
  });
  assert.deepEqual(state.position, { x: 1, y: 300, z: -1 });
  assert.ok(state.rotationY > -Math.PI && state.rotationY <= Math.PI);
  assert.equal(state.speed, 3);
  assert.equal(state.grounded, false);
  assert.equal(sanitizePlayerState({ position: { x: NaN, y: 1, z: 1 } }), null);
});

test('NetworkClient permanece inactivo si la página no la sirve el servidor', async () => {
  const socket = fakeSocket();
  const client = new NetworkClient({
    fetchImpl: async () => ({ ok: false }),
    socketFactory: () => { throw new Error('no debería conectarse'); }
  });

  assert.equal(await client.connect(), false);
  assert.equal(client.connected, false);
  client.sendPlayerState({ position: { x: 0, y: 4, z: 0 } });
  assert.equal(socket.emitted.length, 0);
});

test('NetworkClient detecta el servidor, difunde estado y sanea lo recibido', async () => {
  const socket = fakeSocket();
  const client = new NetworkClient({ fetchImpl: healthyFetch(), socketFactory: () => socket });

  assert.equal(await client.connect(), true);
  socket.trigger('connect');
  assert.equal(client.connected, true);
  assert.deepEqual(socket.emitted[0], { event: 'world:join', payload: { room: DEFAULT_ROOM } });

  client.sendPlayerState({
    position: { x: 3, y: 4, z: 5 },
    rotationY: 1,
    moving: true,
    grounded: true,
    speed: 1,
    skin: 'explorador'
  });
  assert.equal(socket.emitted.at(-1).event, 'player:state');

  client.sendBlockPlaced({
    id: 'block_a',
    position: { x: 2, y: 1, z: 2 },
    size: { x: 2, y: 2, z: 2 },
    color: 0xC05342
  });
  assert.equal(socket.emitted.at(-1).event, 'block:place');

  const received = [];
  client.onWorldState = (state) => received.push(['world', state]);
  client.onPlayerState = (id, state) => received.push(['player', id, state]);
  client.onBlockPlaced = (block) => received.push(['block', block]);
  client.onBlockRemoved = (id) => received.push(['remove', id]);

  socket.trigger('world:state', { blocks: [], players: [] });
  socket.trigger('player:state', { id: 'otro', state: { position: { x: 1, y: 4, z: 1 } } });
  socket.trigger('player:state', { id: 'invalido', state: { position: {} } });
  socket.trigger('block:place', { id: 'block_b', position: { x: 0, y: 1, z: 0 }, size: { x: 2, y: 2, z: 2 } });
  socket.trigger('block:remove', { id: 'block_b' });

  assert.deepEqual(received.map((entry) => entry[0]), ['world', 'player', 'block', 'remove']);
  assert.equal(received[1][1], 'otro');
  assert.equal(received[3][1], 'block_b');
});

test('los avatares remotos se interpolan y se retiran limpiamente', () => {
  const scene = new THREE.Group();
  const avatar = fakeAvatar();
  const players = new RemotePlayers(scene, { avatarFactory: () => avatar });

  players.applyState('p1', {
    position: { x: 5, y: 4, z: 6 },
    rotationY: 0,
    moving: true,
    grounded: true,
    speed: 1.4,
    skin: 'explorador'
  });
  assert.equal(players.players.size, 1);
  assert.equal(avatar.group.position.y, 1.9);
  assert.deepEqual(avatar.skins, ['explorador']);

  players.applyState('p1', {
    position: { x: 7, y: 4, z: 6 },
    rotationY: 1,
    moving: false,
    grounded: true,
    speed: 1
  });
  players.update(0.5);
  assert.ok(avatar.group.position.x > 5 && avatar.group.position.x < 7);
  assert.ok(avatar.group.rotation.y > 0 && avatar.group.rotation.y < 1);
  assert.equal(avatar.animations.at(-1).moving, false);

  assert.equal(players.remove('p1'), true);
  assert.equal(players.players.size, 0);
  assert.equal(scene.children.length, 0);
  assert.ok(Math.abs(lerpAngle(3, -3, 0.5) - Math.PI) < 0.01);
});

test('el servidor expone health y sanea el estado canónico por sala', async () => {
  const server = startServer({ port: 0 });
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await fetch(`${base}/health`);
    const info = await response.json();
    assert.equal(response.status, 200);
    assert.equal(info.ok, true);
    assert.equal(info.server, 'chero-world');
    assert.equal(info.rooms, 0);

    const rooms = server.cheroNetwork.rooms;
    assert.equal(rooms.size, 0);
    assert.equal(typeof createApp, 'function');
  } finally {
    server.cheroNetwork.io.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
