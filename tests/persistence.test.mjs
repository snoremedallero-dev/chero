import test from 'node:test';
import assert from 'node:assert/strict';
import { Wallet } from '../src/economy/Wallet.js';
import { SkinCollection } from '../src/economy/SkinCollection.js';
import { LegendQuests } from '../src/quests/LegendQuests.js';

test('el ciclo completo de guardado conserva monedas, skins y misiones', () => {
  const wallet = new Wallet({ colones: 120, bitcoins: 1 });
  wallet.addColones(30);

  const skins = new SkinCollection();
  assert.equal(skins.unlock('cipitio'), true);
  assert.equal(skins.equip('cipitio'), true);

  const quests = new LegendQuests();
  quests.accept('cipitio');
  quests.record('coins', 30);
  assert.equal(quests.talk('cipitio').status, 'lista');

  const saved = {
    coins: wallet.colones,
    bitcoins: wallet.bitcoins,
    skins: skins.serialize(),
    quests: quests.serialize()
  };

  const restoredWallet = new Wallet({ colones: saved.coins, bitcoins: saved.bitcoins });
  const restoredSkins = new SkinCollection(saved.skins?.owned, saved.skins?.equipped);
  const restoredQuests = new LegendQuests(saved.quests);

  assert.deepEqual(restoredWallet.serialize(), { colones: 150, bitcoins: 1 });
  assert.equal(restoredSkins.equipped, 'cipitio');
  assert.equal(restoredSkins.has('cipitio'), true);
  assert.equal(restoredQuests.get('cipitio').claimed, true);
});

test('datos corruptos o incompletos no rompen la restauración', () => {
  const wallet = new Wallet({ colones: 'abc', bitcoins: -4 });
  const skins = new SkinCollection(null, { raro: true });
  const quests = new LegendQuests(null);

  assert.deepEqual(wallet.serialize(), { colones: 0, bitcoins: 0 });
  assert.equal(skins.equipped, 'explorador');
  assert.equal(quests.describe('cipitio').state.progress, 0);
});

test('comprar actualiza cartera e inventario de forma consistente al guardar', () => {
  const wallet = new Wallet({ colones: 300, bitcoins: 2 });
  const skins = new SkinCollection();

  assert.equal(skins.purchase('surfer', wallet, 'colones').ok, true);
  assert.equal(skins.equip('surfer'), true);

  const saved = { coins: wallet.colones, bitcoins: wallet.bitcoins, ...skins.serialize() };
  const restoredWallet = new Wallet({ colones: saved.coins, bitcoins: saved.bitcoins });
  const restoredSkins = new SkinCollection(saved.owned, saved.equipped);

  assert.equal(restoredWallet.colones, 80);
  assert.equal(restoredWallet.bitcoins, 2);
  assert.equal(restoredSkins.equipped, 'surfer');
});
