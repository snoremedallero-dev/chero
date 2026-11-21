import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, installDomStub } from './dom-stub.mjs';
import { SkinsPanel } from '../src/ui/SkinsPanel.js';
import { Wallet } from '../src/economy/Wallet.js';
import { SkinCollection } from '../src/economy/SkinCollection.js';
import { LegendQuests } from '../src/quests/LegendQuests.js';
import { SKINS } from '../src/data/SkinCatalog.js';

function setup() {
  const ids = {};
  ['skins-panel', 'skins-close-btn', 'skins-colones', 'skins-bitcoins', 'skins-grid',
   'skins-btn'].forEach((id) => { ids[id] = createElement(); });

  const appended = [];
  const originalAppend = ids['skins-grid'].appendChild;
  ids['skins-grid'].appendChild = (child) => {
    appended.push(child);
    return originalAppend.call(ids['skins-grid'], child);
  };

  const rate = createElement();
  ids['skins-panel'].querySelector = (selector) => (selector === '.wallet-rate' ? rate : null);

  installDomStub({ ids });
  return { ids, appended, rate, panel: new SkinsPanel() };
}

test('el panel muestra la billetera y una tarjeta por skin', () => {
  const { ids, appended, rate, panel } = setup();
  const wallet = new Wallet({ colones: 150, bitcoins: 2 });
  const collection = new SkinCollection();
  const quests = new LegendQuests();

  panel.refresh(wallet, collection, quests);

  assert.equal(ids['skins-colones'].textContent, '150');
  assert.equal(ids['skins-bitcoins'].textContent, '2');
  assert.equal(appended.length, SKINS.length);
  assert.equal(rate.textContent, '1 ₿ = 100 ◆');
  assert.equal(appended[0].className.includes('equipped'), true);
});

test('el panel refleja skins desbloqueados y tolera misiones en curso', () => {
  const { appended, panel } = setup();
  const wallet = new Wallet();
  const collection = new SkinCollection(['cipitio'], 'cipitio');
  const quests = new LegendQuests();
  quests.accept('cihuanaba');
  quests.record('distance', 100);

  panel.refresh(wallet, collection, quests);

  assert.equal(appended[0].className.includes('owned'), true);
  assert.equal(appended[1].className.includes('equipped'), true);
  assert.equal(appended.filter((card) => card.className.includes('equipped')).length, 1);
  assert.ok(appended.some((card) => card.className.includes('locked')));
});

test('toggle cambia la visibilidad del panel', () => {
  const { ids, panel } = setup();

  assert.equal(panel.isOpen, false);
  panel.toggle(true);
  assert.equal(panel.isOpen, true);
  assert.equal(ids['skins-panel'].style.display, 'flex');

  panel.toggle(false);
  assert.equal(panel.isOpen, false);
  assert.equal(ids['skins-panel'].style.display, 'none');
});
