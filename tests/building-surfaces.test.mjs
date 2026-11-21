import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { installDomStub } from './dom-stub.mjs';
import { BuildingController } from '../src/building/BuildingController.js';

function makeController(extraSurfaces = []) {
  installDomStub();
  const baseplate = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
  const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
  const blockManager = {
    getInteractableMeshes() { return [blockMesh]; }
  };
  const scene = { add() {} };
  const controller = new BuildingController(
    {},
    scene,
    baseplate,
    blockManager,
    () => new THREE.Vector3(0, 4, 0),
    extraSurfaces
  );
  return { controller, baseplate, blockMesh };
}

function hitOn(object) {
  return [{
    object,
    point: new THREE.Vector3(0, 1, 0),
    face: { normal: new THREE.Vector3(0, 1, 0) }
  }];
}

test('los suelos de pesca y mina entran en el raycast de construcción', () => {
  const extra = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 36), new THREE.MeshBasicMaterial());
  const { controller, baseplate, blockMesh } = makeController([extra]);
  let targets = [];

  controller.raycaster = {
    setFromCamera() {},
    intersectObjects(list) {
      targets = list;
      return [];
    }
  };
  controller.update();

  assert.equal(targets.includes(baseplate), true);
  assert.equal(targets.includes(extra), true);
  assert.equal(targets.includes(blockMesh), true);
});

test('demoler ignora los suelos y solo afecta a bloques construidos', () => {
  const extra = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 36), new THREE.MeshBasicMaterial());
  const { controller, baseplate, blockMesh } = makeController([extra]);
  controller.selectTool(5);

  controller.raycaster = {
    setFromCamera() {},
    intersectObjects: () => hitOn(extra)
  };
  controller.update();
  assert.equal(controller.canPlace, false);
  assert.equal(controller.hoveredBlockMesh, null);

  controller.raycaster.intersectObjects = () => hitOn(baseplate);
  controller.update();
  assert.equal(controller.canPlace, false);

  controller.raycaster.intersectObjects = () => hitOn(blockMesh);
  controller.update();
  assert.equal(controller.canPlace, true);
  assert.equal(controller.hoveredBlockMesh, blockMesh);
});
