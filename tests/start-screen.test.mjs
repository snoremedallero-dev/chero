import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, installDomStub } from './dom-stub.mjs';
import { SkinCollection } from '../src/economy/SkinCollection.js';
import { SpriteProgress } from '../src/quests/SpriteProgress.js';
import { StartScreen } from '../src/ui/StartScreen.js';
import { SKINS, STARTER_SPRITE_IDS, TOTAL_SPRITES } from '../src/data/SkinCatalog.js';

function setup() {
  const ids = {};
  [
    'start-screen', 'start-sprite-grid', 'start-counter', 'start-preview-swatch',
    'start-selected-name', 'start-selected-desc', 'start-enter-btn', 'start-close-btn'
  ].forEach((id) => { ids[id] = createElement(); });

  installDomStub({ ids });

  const captureClicks = (element) => {
    element.listeners = {};
    element.addEventListener = (type, handler) => { element.listeners[type] = handler; };
  };
  captureClicks(ids['start-enter-btn']);
  captureClicks(ids['start-close-btn']);

  const cards = [];
  ids['start-sprite-grid'].appendChild = (card) => {
    cards.push(card);
    return card;
  };

  const originalCreateElement = createElement;
  globalThis.document.createElement = (tag = 'div') => {
    const element = originalCreateElement(tag);
    captureClicks(element);
    element.children = [];
    element.appendChild = (child) => {
      element.children.push(child);
      return child;
    };
    return element;
  };

  const collection = new SkinCollection();
  const progress = new SpriteProgress();
  const screen = new StartScreen({ collection, progress });
  return { ids, cards, collection, progress, screen };
}

function click(element) {
  element.listeners.click({ stopPropagation() {} });
}

test('la pantalla inicial muestra los 100 sprites con 95 bloqueados', () => {
  const { ids, cards, screen } = setup();

  screen.open(false);

  assert.equal(ids['start-screen'].style.display, 'flex');
  assert.equal(cards.length, TOTAL_SPRITES);
  assert.equal(cards.filter((card) => card.disabled).length, 95);
  assert.equal(cards.filter((card) => card.className.includes('selected')).length, 1);
  assert.equal(ids['start-close-btn'].hidden, true);
  assert.match(ids['start-counter'].textContent, /5 \/ 100/);
});

test('elegir un sprite disponible actualiza la vista previa y avisa al exterior', () => {
  const { cards, collection, screen, ids } = setup();
  screen.open(false);

  const chosen = STARTER_SPRITE_IDS[1];
  const selected = [];
  screen.onSelect = (id) => {
    selected.push(id);
    collection.equip(id);
  };

  const card = cards.find((item) => item.dataset.spriteId === chosen);
  assert.equal(card.disabled, false);
  click(card);

  assert.deepEqual(selected, [chosen]);
  assert.equal(screen.selectedId, chosen);
  assert.equal(collection.equipped, chosen);
  assert.match(ids['start-selected-name'].textContent, new RegExp(SKINS.find((s) => s.id === chosen).name));

  const refreshed = cards.filter((item) => item.dataset.spriteId === chosen);
  assert.equal(refreshed[refreshed.length - 1].className.includes('selected'), true);
});

test('un sprite recién desbloqueado deja de estar bloqueado en la pantalla', () => {
  const { cards, collection, progress, screen } = setup();
  const [sprite] = progress.record('coins', 50);
  assert.ok(sprite);

  collection.unlock(sprite.id);
  screen.open(false);

  assert.equal(cards.filter((card) => card.disabled).length, 94);
  const card = cards.find((item) => item.dataset.spriteId === sprite.id);
  assert.equal(card.disabled, false);
  assert.match(card.children[3].textContent, /DISPONIBLE|SELECCIONADO/);
});

test('entrar y reabrir el selector cierra el overlay y notifica el inicio', () => {
  const { ids, screen } = setup();
  const starts = [];
  screen.onStart = () => starts.push(true);

  screen.open(false);
  click(ids['start-enter-btn']);
  assert.equal(ids['start-screen'].style.display, 'none');
  assert.equal(starts.length, 1);

  screen.open(true);
  assert.equal(ids['start-close-btn'].hidden, false);
  assert.match(ids['start-enter-btn'].textContent, /VOLVER AL JUEGO/);
  click(ids['start-close-btn']);

  assert.equal(ids['start-screen'].style.display, 'none');
  assert.equal(starts.length, 2);
});
