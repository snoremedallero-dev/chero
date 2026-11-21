import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, installDomStub } from './dom-stub.mjs';
import { HUD } from '../src/ui/HUD.js';

function setup() {
  const ids = {};
  const selectors = {};
  ['health-bar-fill', 'health-text', 'stamina-bar-fill', 'stamina-text', 'coins-display',
   'bitcoins-display', 'skins-btn', 'sprites-btn', 'deaths-display', 'distance-display', 'location-tag', 'game-toast', 'victory-modal',
   'fast-travel-btn', 'fast-travel-menu', 'camera-btn', 'camera-menu', 'audio-toggle-btn',
   'controls-help-btn', 'controls-hint', 'interaction-prompt',
   'held-item-bar', 'build-status', 'build-status-text', 'build-crosshair',
   'time-icon', 'time-period'].forEach((id) => { ids[id] = createElement(); });

  selectors['.health-container'] = createElement();
  selectors['.stamina-container'] = createElement();
  selectors['.time-chip'] = createElement();

  installDomStub({ ids, selectors });
  ids['sprites-btn'].listeners = {};
  ids['sprites-btn'].addEventListener = (type, handler) => {
    ids['sprites-btn'].listeners[type] = handler;
  };
  ids['controls-help-btn'].listeners = {};
  ids['controls-help-btn'].addEventListener = (type, handler) => {
    ids['controls-help-btn'].listeners[type] = handler;
  };
  return { ids, selectors, hud: new HUD() };
}

test('updateHealth cambia el nivel visual sin escribir colores en línea', () => {
  const { ids, selectors, hud } = setup();

  hud.updateHealth(100, 100);
  assert.equal(selectors['.health-container'].dataset.level, 'high');
  assert.equal(ids['health-bar-fill'].style.width, '100%');

  hud.updateHealth(40, 100);
  assert.equal(selectors['.health-container'].dataset.level, 'mid');
  assert.equal(ids['health-text'].textContent, '40 / 100');

  hud.updateHealth(10, 100);
  assert.equal(selectors['.health-container'].dataset.level, 'low');
  assert.equal(ids['health-bar-fill'].style.backgroundColor, undefined);
});

test('updateStamina, distancia y estado de construcción reflejan el estado del juego', () => {
  const { ids, selectors, hud } = setup();

  hud.updateStamina(12, 100);
  assert.equal(ids['stamina-bar-fill'].style.width, '12%');
  assert.equal(selectors['.stamina-container'].dataset.level, 'low');

  hud.updateDistance(123.6);
  assert.equal(ids['distance-display'].textContent, '124 m');

  hud.updateBuildStatus('Demoler', false);
  assert.equal(ids['build-status'].classList.contains('blocked'), true);
  hud.updateBuildStatus('Demoler', true);
  assert.equal(ids['build-status'].classList.contains('blocked'), false);
  assert.equal(ids['build-crosshair'].classList.contains('can-place'), true);
});

test('updateWallet muestra colones y bitcoins del mismo estado', () => {
  const { ids, hud } = setup();

  hud.updateWallet(150, 3);
  assert.equal(ids['coins-display'].textContent, 'Colones: 150');
  assert.equal(ids['bitcoins-display'].textContent, '3 BTC');

  hud.updateStats(80, 2);
  assert.equal(ids['coins-display'].textContent, 'Colones: 80');
  assert.equal(ids['deaths-display'].textContent, '2');
});

test('showToast conserva el tipo de aviso al ocultarse', () => {
  const { ids, hud } = setup();

  hud.showToast('Misión completada', 'quest');
  assert.equal(ids['game-toast'].className, 'toast-visible toast-quest');

  hud.showToast('Cámara cambiada', 'info');
  assert.equal(ids['game-toast'].className, 'toast-visible toast-info');
});

test('setInteractionPrompt distingue hablar de recoger', () => {
  const { ids, hud } = setup();

  hud.setInteractionPrompt({ icon: '△', name: 'Cipitio' }, 'hablar', '<b>[Q]</b>');
  assert.equal(ids['interaction-prompt'].style.display, 'block');
  assert.equal(ids['interaction-prompt'].classList.contains('talk'), true);
  assert.match(ids['interaction-prompt'].innerHTML, /Cipitio/);

  hud.setInteractionPrompt(null);
  assert.equal(ids['interaction-prompt'].style.display, 'none');
  assert.equal(ids['interaction-prompt'].classList.contains('talk'), false);
});

test('updateTime usa etiquetas e iconos del ciclo propio', () => {
  const { ids, selectors, hud } = setup();

  hud.updateTime('noche');
  assert.equal(ids['time-period'].textContent, 'Noche');
  assert.equal(ids['time-icon'].textContent, '☾');
  assert.equal(selectors['.time-chip'].classList.contains('night'), true);

  hud.updateTime('día');
  assert.equal(ids['time-period'].textContent, 'Día');
  assert.equal(selectors['.time-chip'].classList.contains('night'), false);
});

test('el botón Sprites abre el selector desde el HUD', () => {
  const { ids, hud } = setup();
  let opened = 0;
  hud.onSpritesOpen = () => { opened++; };

  ids['sprites-btn'].listeners.click({ stopPropagation() {} });

  assert.equal(opened, 1);
});

test('las instrucciones de controles permanecen ocultas hasta que se piden', () => {
  const { ids, hud } = setup();
  let changes = 0;
  hud.onControlsHelpVisibilityChanged = () => { changes++; };

  assert.equal(ids['controls-hint'].hidden, undefined);
  hud.setControlsHelpVisible(true, false);
  assert.equal(ids['controls-hint'].hidden, false);
  assert.equal(ids['controls-help-btn'].getAttribute('aria-expanded'), 'true');
  assert.match(ids['controls-help-btn'].textContent, /Ocultar/);
  assert.equal(changes, 0);

  ids['controls-help-btn'].listeners.click({ stopPropagation() {} });
  assert.equal(ids['controls-hint'].hidden, true);
  assert.equal(ids['controls-help-btn'].getAttribute('aria-expanded'), 'false');
  assert.match(ids['controls-help-btn'].textContent, /Controles/);
  assert.equal(changes, 1);
});
