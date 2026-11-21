import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDomStub } from './dom-stub.mjs';
import { FISHING_SPOTS, FishingWorld } from '../src/world/FishingWorld.js';
import { CoinMineWorld, MINE_CENTER } from '../src/world/CoinMineWorld.js';

function makeScene() {
  const added = [];
  return { added, add(object) { added.push(object); } };
}

test('los tres puntos de pesca existen y entregan colones una sola vez por cooldown', () => {
  installDomStub();
  const scene = makeScene();
  const world = new FishingWorld(scene, null);

  assert.equal(world.spots.length, 3);
  assert.deepEqual(world.spots.map((spot) => spot.id), FISHING_SPOTS.map((spot) => spot.id));
  assert.equal(scene.added.length, 1);

  const position = { x: -150, y: 1.5, z: 110 };
  const spot = world.getClosest(position);
  assert.equal(spot.id, 'guija');
  assert.equal(world.getZone(position).name, 'Lago de Güija');

  const first = world.catchFish(spot);
  assert.equal(first.ok, true);
  assert.equal(first.reward.colones, 25);

  const second = world.catchFish('guija');
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'cooldown');
  assert.equal(world.catchFish('inexistente').reason, 'sin-punto');
  assert.equal(world.getMapLandmarks().length, 3);
});

test('la mina consume vetas, alterna recompensas y las repone', () => {
  installDomStub();
  const scene = makeScene();
  const world = new CoinMineWorld(scene, null);

  assert.equal(world.veins.length, 6);
  assert.deepEqual(world.veins[0].reward, { bitcoins: 1 });
  assert.deepEqual(world.veins[1].reward, { colones: 20 });
  assert.equal(world.getZone({ x: MINE_CENTER.x, y: 2, z: MINE_CENTER.z }).name, 'Mina de Monedas');

  const firstPosition = {
    x: MINE_CENTER.x - 9,
    y: 1.5,
    z: MINE_CENTER.z - 7
  };
  const event = world.checkPlayer(firstPosition);
  assert.equal(event.vein.id, 'veta_0');
  assert.equal(world.checkPlayer(firstPosition).vein, null);
  assert.equal(world.getClosestAvailable(firstPosition), null);

  event.vein.respawnAt = 0;
  world.update(0.016, 1);
  assert.equal(event.vein.available, true);
  assert.equal(event.vein.mesh.visible, true);
  assert.equal(world.getMapLandmarks()[0].name, 'Mina');
});

test('los recursos nuevos usan glifos, no emojis, en textos visibles', () => {
  const files = [
    'src/world/FishingWorld.js',
    'src/world/CoinMineWorld.js',
    'src/world/SalvadorWorld.js',
    'index.html'
  ];

  files.forEach((file) => {
    const content = readFileSync(file, 'utf8');
    assert.doesNotMatch(content, /🫓|🟢|🏛️|🌋|🇸🇻/, `${file} contiene emojis heredados`);
  });
});
