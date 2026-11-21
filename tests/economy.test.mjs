import test from 'node:test';
import assert from 'node:assert/strict';
import { Wallet, COLONES_PER_BITCOIN } from '../src/economy/Wallet.js';
import { SkinCollection } from '../src/economy/SkinCollection.js';
import { getSkin, SKINS, STARTER_SPRITE_IDS } from '../src/data/SkinCatalog.js';

test('la cartera convierte colones y bitcoins con la tasa fija', () => {
  const wallet = new Wallet({ colones: 250, bitcoins: 1 });

  assert.equal(wallet.convertToBitcoins(2), true);
  assert.equal(wallet.colones, 250 - 2 * COLONES_PER_BITCOIN);
  assert.equal(wallet.bitcoins, 3);

  assert.equal(wallet.convertToBitcoins(1), false);
  assert.equal(wallet.convertToColones(1), true);
  assert.equal(wallet.colones, 150);
  assert.equal(wallet.bitcoins, 2);
});

test('gastar es atómico y rechaza montos negativos o no numéricos', () => {
  const wallet = new Wallet({ colones: 50, bitcoins: 2 });

  assert.equal(wallet.spend({ colones: 40, bitcoins: 3 }), false);
  assert.deepEqual(wallet.serialize(), { colones: 50, bitcoins: 2 });

  assert.equal(wallet.spend({ colones: 20, bitcoins: 1 }), true);
  assert.deepEqual(wallet.serialize(), { colones: 30, bitcoins: 1 });

  assert.equal(wallet.addColones(-100), 0);
  assert.equal(wallet.addBitcoins('abc'), 0);
  assert.equal(wallet.colones, 30);
});

test('el inventario solo incluye skins válidos y respeta el equipado guardado', () => {
  const collection = new SkinCollection(['cipitio', 'inexistente'], 'inexistente');

  assert.equal(collection.has('explorador'), true);
  assert.equal(collection.has('cipitio'), true);
  assert.equal(collection.has('inexistente'), false);
  assert.equal(collection.equipped, 'explorador');
  assert.equal(collection.equip('cipitio'), true);
  assert.equal(collection.equip('surfer'), false);
  assert.equal(collection.equipped, 'cipitio');
});

test('desbloquear por misión no puede duplicar recompensas', () => {
  const collection = new SkinCollection();

  assert.equal(collection.unlock('cipitio'), true);
  assert.equal(collection.unlock('cipitio'), false);
  assert.equal(collection.unlock('no-existe'), false);
  assert.deepEqual(
    collection.serialize().owned.sort(),
    [...STARTER_SPRITE_IDS, 'cipitio'].sort()
  );
});

test('comprar con colones descuenta el precio y desbloquea la skin', () => {
  const wallet = new Wallet({ colones: 200 });
  const collection = new SkinCollection();

  const result = collection.purchase('pupusero', wallet, 'colones');
  assert.equal(result.ok, true);
  assert.equal(wallet.colones, 50);
  assert.equal(collection.has('pupusero'), true);

  assert.deepEqual(collection.purchase('pupusero', wallet, 'colones').reason, 'ya-obtenido');
  assert.deepEqual(collection.purchase('surfer', wallet, 'colones').reason, 'fondos-insuficientes');
});

test('comprar con bitcoins usa el precio de esa moneda y no el de colones', () => {
  const wallet = new Wallet({ colones: 0, bitcoins: 3 });
  const collection = new SkinCollection();

  assert.equal(collection.purchase('cripto', wallet, 'colones').reason, 'moneda-no-disponible');
  assert.equal(collection.purchase('cripto', wallet, 'bitcoins').ok, true);
  assert.equal(wallet.bitcoins, 0);
  assert.equal(collection.has('cripto'), true);
});

test('las skins de misión no se pueden comprar y todas tienen paleta', () => {
  const wallet = new Wallet({ colones: 9999, bitcoins: 99 });
  const collection = new SkinCollection();

  assert.equal(collection.purchase('cipitio', wallet, 'colones').reason, 'no-comprable');
  SKINS.forEach((id) => {
    const skin = getSkin(id.id);
    assert.ok(skin.palette.torso >= 0 && skin.palette.torso <= 0xFFFFFF);
    assert.ok(skin.icon && skin.name && skin.description);
  });
});
