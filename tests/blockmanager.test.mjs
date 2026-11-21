import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { installDomStub } from './dom-stub.mjs';
import { BlockManager } from '../src/building/BlockManager.js';

function makeFixture() {
  installDomStub();
  const scene = { add() {}, remove() {} };
  const bodies = [];
  const physics = {
    blockMaterial: new CANNON.Material('block'),
    addBody(body) { bodies.push(body); },
    removeBody(body) {
      const i = bodies.indexOf(body);
      if (i !== -1) bodies.splice(i, 1);
    }
  };
  let placeSounds = 0;
  let destroySounds = 0;
  const audio = {
    playPlace() { placeSounds++; },
    playDestroy() { destroySounds++; }
  };

  return {
    manager: new BlockManager(scene, physics, audio),
    bodies,
    sounds: () => ({ placeSounds, destroySounds })
  };
}

test('serializar y restaurar conserva posición, tamaño y color sin reproducir sonido', () => {
  const { manager, bodies, sounds } = makeFixture();
  let placedEvents = 0;
  manager.onBlockPlaced = () => { placedEvents++; };

  const original = manager.placeBlock(
    new THREE.Vector3(2, 1, 2),
    0xC05342,
    new THREE.Vector3(2, 2, 2)
  );

  const serialized = manager.serialize();
  assert.equal(serialized.length, 1);
  assert.equal(serialized[0].position.x, 2);
  assert.equal(serialized[0].color, 0xC05342);
  assert.equal(placedEvents, 1);
  assert.equal(sounds().placeSounds, 1);

  const restored = manager.restore(serialized);
  assert.equal(restored, 1);
  assert.equal(manager.blocks.length, 2);
  assert.equal(bodies.length, 2);
  assert.equal(placedEvents, 1);
  assert.equal(sounds().placeSounds, 1);
  assert.equal(manager.blocks[1].position.y, original.position.y);
});

test('restore ignora entradas inválidas', () => {
  const { manager } = makeFixture();

  assert.equal(manager.restore(null), 0);
  assert.equal(manager.restore([
    null,
    {},
    { position: { x: NaN, y: 1, z: 1 }, size: { x: 2, y: 2, z: 2 } }
  ]), 0);
});

test('restore limita la cantidad de bloques', () => {
  const { manager } = makeFixture();
  const many = Array.from({ length: 320 }, () => ({
    position: { x: 1, y: 1, z: 1 },
    size: { x: 2, y: 2, z: 2 },
    color: 0x18A999
  }));

  assert.equal(manager.restore(many), 300);
  assert.equal(manager.blocks.length, 300);
});

test('los ids canónicos permiten sincronizar bloques de red sin duplicarlos', () => {
  const { manager } = makeFixture();
  const block = manager.placeBlock(
    new THREE.Vector3(2, 1, 2),
    0x18A999,
    new THREE.Vector3(2, 2, 2),
    true,
    'block_remoto_1'
  );

  assert.equal(block.id, 'block_remoto_1');
  assert.equal(manager.hasBlock('block_remoto_1'), true);
  assert.equal(manager.serialize()[0].id, 'block_remoto_1');
  assert.equal(manager.restore(manager.serialize()), 1);
  assert.equal(manager.hasBlock('block_remoto_1'), true);
  assert.equal(manager.blocks.length, 2);

  assert.equal(manager.removeBlockById('block_remoto_1', true), true);
  assert.equal(manager.hasBlock('block_remoto_1'), false);
});

test('removeBlock notifica a persistencia', () => {
  const { manager, bodies, sounds } = makeFixture();
  let removedEvents = 0;
  manager.onBlockRemoved = () => { removedEvents++; };

  const block = manager.placeBlock(new THREE.Vector3(0, 1, 0));
  assert.equal(manager.removeBlock(block.mesh), true);
  assert.equal(manager.blocks.length, 0);
  assert.equal(bodies.length, 0);
  assert.equal(removedEvents, 1);
  assert.equal(sounds().destroySounds, 1);
});
