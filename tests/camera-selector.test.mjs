import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createElement, installDomStub } from './dom-stub.mjs';
import { CAMERA_MODES, DEFAULT_CAMERA_MODE, getCameraMode, nextCameraMode } from '../src/character/CameraModes.js';
import { ThirdPersonCamera } from '../src/character/ThirdPersonCamera.js';
import { HUD } from '../src/ui/HUD.js';

function makeCamera() {
  return {
    fov: 65,
    position: new THREE.Vector3(),
    updateProjectionMatrix() { this.projectionUpdated = true; },
    lookAt() { this.lookedAt = true; }
  };
}

function makeThirdPersonCamera() {
  installDomStub();
  const domElement = { addEventListener() {} };
  return { controller: new ThirdPersonCamera(makeCamera(), domElement), camera: null };
}

test('el catálogo define modos válidos y el ciclo es circular', () => {
  const ids = CAMERA_MODES.map((mode) => mode.id);
  assert.deepEqual(ids, ['tps', 'tps-close', 'fps', 'top']);
  assert.equal(getCameraMode(DEFAULT_CAMERA_MODE).showAvatar, true);
  assert.equal(getCameraMode('fps').showAvatar, false);
  assert.equal(getCameraMode('inexistente'), null);

  ids.forEach((id, index) => {
    assert.equal(nextCameraMode(id), ids[(index + 1) % ids.length]);
  });
  assert.equal(nextCameraMode('inexistente'), DEFAULT_CAMERA_MODE);
});

test('setMode aplica distancia, FOV y límites sin perder el yaw', () => {
  const { controller } = makeThirdPersonCamera();
  controller.yaw = 1.25;

  const mode = controller.setMode('top');
  assert.equal(mode.id, 'top');
  assert.equal(controller.yaw, 1.25);
  assert.equal(controller.distance, 26);
  assert.equal(controller.minDistance, 18);
  assert.equal(controller.camera.fov, 58);
  assert.equal(controller.camera.projectionUpdated, true);

  assert.equal(controller.setMode('no-existe'), null);
  assert.equal(controller.mode.id, 'top');
});

test('el modo FPS coloca la cámara en la cabeza del jugador', () => {
  installDomStub();
  const camera = makeCamera();
  const controller = new ThirdPersonCamera(camera, { addEventListener() {} });
  const target = new THREE.Vector3(4, 3, -2);

  controller.yaw = 0;
  controller.pitch = 0;
  controller.setMode('fps');
  controller.update(target, 1);

  assert.equal(camera.position.x, 4);
  assert.equal(camera.position.z, -2);
  assert.equal(camera.position.y, 3 + controller.mode.eyeHeight);
  assert.equal(camera.lookedAt, true);
});

/** Botón con listeners capturados para simular clics sin navegador. */
function makeCameraButton(mode, label) {
  const button = createElement('button');
  button.dataset.cameraMode = mode;
  button.textContent = label;
  button.listeners = {};
  button.addEventListener = (type, handler) => { button.listeners[type] = handler; };
  return button;
}

function click(element) {
  element.listeners.click({ stopPropagation() {} });
}

test('el selector del HUD emite el modo elegido y marca la opción activa', () => {
  const ids = {};
  ['camera-btn', 'camera-menu', 'fast-travel-btn', 'fast-travel-menu', 'game-toast'].forEach((id) => {
    ids[id] = createElement();
  });
  ids['camera-btn'].listeners = {};
  ids['camera-btn'].addEventListener = (type, handler) => { ids['camera-btn'].listeners[type] = handler; };
  installDomStub({ ids });

  const orbital = makeCameraButton('tps', '◈ TPS · Orbital');
  const fps = makeCameraButton('fps', '▽ FPS · Primera persona');
  ids['camera-menu'].querySelectorAll = () => [orbital, fps];

  const hud = new HUD();
  const selected = [];
  hud.onCameraModeSelected = (mode) => selected.push(mode);

  click(ids['camera-btn']);
  assert.equal(ids['camera-menu'].style.display, 'flex');

  click(fps);
  assert.deepEqual(selected, ['fps']);
  assert.equal(hud.currentCameraMode, 'fps');
  assert.equal(fps.classList.contains('active'), true);
  assert.equal(orbital.classList.contains('active'), false);
  assert.equal(ids['camera-menu'].style.display, 'none');
  assert.match(ids['game-toast'].textContent, /FPS/);

  hud.setCameraMode('tps', 'TPS · Orbital');
  assert.equal(orbital.classList.contains('active'), true);
  assert.equal(fps.classList.contains('active'), false);
});
