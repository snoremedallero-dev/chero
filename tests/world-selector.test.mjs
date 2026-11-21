import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, installDomStub } from './dom-stub.mjs';
import { HUD } from '../src/ui/HUD.js';

function makeTravelButton(label, pos, worldId) {
  const button = createElement('button');
  button.textContent = label;
  button.dataset.world = worldId;
  button.getAttribute = (name) => (name === 'data-pos' ? pos : null);
  button.listeners = {};
  button.addEventListener = (type, handler) => { button.listeners[type] = handler; };
  return button;
}

test('el viaje rápido envía la posición y el mundo elegidos', () => {
  const ids = {};
  [
    'health-bar-fill', 'health-text', 'stamina-bar-fill', 'stamina-text', 'coins-display',
    'bitcoins-display', 'skins-btn', 'deaths-display', 'distance-display', 'location-tag',
    'game-toast', 'victory-modal', 'fast-travel-btn', 'fast-travel-menu', 'camera-btn',
    'camera-menu', 'audio-toggle-btn', 'interaction-prompt', 'held-item-bar', 'build-status',
    'build-status-text', 'build-crosshair', 'time-icon', 'time-period'
  ].forEach((id) => { ids[id] = createElement(); });
  ids['fast-travel-btn'].listeners = {};
  ids['fast-travel-btn'].addEventListener = (type, handler) => {
    ids['fast-travel-btn'].listeners[type] = handler;
  };

  const central = makeTravelButton('◈ Parque Central', '0,4,10', 'central');
  const guija = makeTravelButton('≋ Lago de Güija · Pesca', '-150,4,110', 'guija');
  ids['fast-travel-menu'].querySelectorAll = () => [central, guija];

  installDomStub({ ids, selectors: {} });
  const hud = new HUD();
  const requested = [];
  hud.onTeleportRequested = (destination) => requested.push(destination);

  ids['fast-travel-btn'].listeners.click({ stopPropagation() {} });
  assert.equal(ids['fast-travel-menu'].style.display, 'flex');

  guija.listeners.click({ stopPropagation() {} });
  assert.deepEqual(requested, [{ x: -150, y: 4, z: 110, worldId: 'guija' }]);
  assert.equal(hud.currentWorldId, 'guija');
  assert.equal(guija.classList.contains('active'), true);
  assert.equal(central.classList.contains('active'), false);
  assert.match(ids['game-toast'].textContent, /Güija/);
  assert.equal(ids['fast-travel-menu'].style.display, 'none');
});
