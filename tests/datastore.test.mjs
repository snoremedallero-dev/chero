import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './dom-stub.mjs';
import { DataStore } from '../src/data/DataStore.js';

test('DataStore devuelve valores por defecto cuando no hay partida', () => {
  installDomStub();
  const store = new DataStore('chero_test');
  const data = store.load();

  assert.equal(data.stage, 1);
  assert.equal(data.deaths, 0);
  assert.equal(data.coins, 50);
  assert.equal(data.bitcoins, 0);
  assert.equal(data.distance, 0);
  assert.deepEqual(data.blocks, []);
  assert.equal(data.skins, null);
  assert.equal(data.quests, null);
  assert.equal(data.cameraMode, 'tps');
  assert.equal(data.worldId, 'central');
  assert.deepEqual(data.position, { x: 0, y: 4, z: 10 });
  assert.equal(data.health, 100);
  assert.equal(data.stamina, 100);
  assert.equal(data.dayTime, 30);
  assert.equal(data.audioMuted, false);
  assert.equal(data.controlsHelpVisible, false);
  assert.equal(data.hotbarIndex, 0);
});

test('DataStore guarda bloques y distancia y fusiona datos incompletos', () => {
  const { storage } = installDomStub();
  const store = new DataStore('chero_test');

  const saved = {
    coins: 120,
    bitcoins: 2,
    skins: { owned: ['cipitio'], equipped: 'cipitio' },
    quests: { cipitio: { accepted: true, progress: 30, claimed: true } },
    blocks: [{ position: { x: 2, y: 1, z: 2 } }],
    cameraMode: 'fps',
    worldId: 'guija'
  };
  store.save(saved);
  storage.set('chero_test', JSON.stringify(saved));

  const data = store.load();
  assert.equal(data.coins, 120);
  assert.equal(data.bitcoins, 2);
  assert.equal(data.stage, 1);
  assert.equal(data.distance, 0);
  assert.equal(data.blocks.length, 1);
  assert.deepEqual(data.skins, saved.skins);
  assert.deepEqual(data.quests, saved.quests);
  assert.equal(data.cameraMode, 'fps');
  assert.equal(data.worldId, 'guija');
});

test('DataStore migró la clave anterior y puede reiniciarse', () => {
  const { storage } = installDomStub();
  storage.set('antigravity_chero_save', JSON.stringify({ coins: 77 }));

  const store = new DataStore('chero_test');
  assert.equal(store.load().coins, 77);

  store.reset();
  assert.equal(storage.has('chero_test'), false);
  assert.equal(storage.has('antigravity_chero_save'), false);
  assert.equal(store.load().coins, 50);
});

test('DataStore valida posición, recursos y preferencias restauradas', () => {
  const { storage } = installDomStub();
  storage.set('chero_test', JSON.stringify({
    position: { x: 9999, y: 'malo', z: -9999 },
    health: 500,
    stamina: -20,
    dayTime: 999,
    audioMuted: true,
    controlsHelpVisible: true,
    hotbarIndex: 42
  }));

  const data = new DataStore('chero_test').load();
  assert.deepEqual(data.position, { x: 500, y: 4, z: -500 });
  assert.equal(data.health, 100);
  assert.equal(data.stamina, 0);
  assert.equal(data.dayTime, 120);
  assert.equal(data.audioMuted, true);
  assert.equal(data.controlsHelpVisible, true);
  assert.equal(data.hotbarIndex, 5);
});
