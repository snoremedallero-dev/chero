import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCKED_SPRITES,
  SKINS,
  SPRITE_REQUIREMENTS,
  STARTER_SPRITE_IDS,
  TOTAL_SPRITES
} from '../src/data/SkinCatalog.js';
import { SpriteProgress, SPRITE_GOAL_TYPES } from '../src/quests/SpriteProgress.js';

test('el catálogo tiene 100 sprites: 5 iniciales y 95 bloqueados', () => {
  assert.equal(SKINS.length, 100);
  assert.equal(TOTAL_SPRITES, 100);
  assert.equal(STARTER_SPRITE_IDS.length, 5);
  assert.equal(LOCKED_SPRITES, 95);
  assert.equal(new Set(SKINS.map((sprite) => sprite.id)).size, 100);
  assert.equal(SPRITE_REQUIREMENTS.reduce((total, group) => total + group.count, 0), 87);
  assert.deepEqual(SPRITE_GOAL_TYPES, ['coins', 'distance', 'checkpoint', 'fish', 'mine', 'build', 'quest']);

  SKINS.forEach((sprite) => {
    assert.ok(sprite.name && sprite.icon && sprite.description, `${sprite.id} carece de metadatos`);
    if (sprite.source === 'mission') {
      assert.ok(sprite.requirement && sprite.requirement.label, `${sprite.id} carece de requisito`);
    }
  });
});

test('los umbrales se cruzan una sola vez y un salto grande desbloquea varios', () => {
  const progress = new SpriteProgress();
  const coinSprites = SKINS
    .filter((sprite) => sprite.requirement?.type === 'coins')
    .sort((a, b) => a.requirement.amount - b.requirement.amount);
  const first = coinSprites[0];

  assert.equal(progress.progressFor(first).current, 0);
  assert.deepEqual(progress.record('coins', first.requirement.amount - 1), []);
  assert.equal(progress.progressFor(first).current, first.requirement.amount - 1);

  const unlocked = progress.record('coins', 1);
  assert.ok(unlocked.some((sprite) => sprite.id === first.id));
  assert.deepEqual(progress.record('coins', 1), []);

  const jump = new SpriteProgress();
  const many = jump.record('coins', 900);
  assert.ok(many.length >= 10);
  assert.equal(new Set(many.map((sprite) => sprite.id)).size, many.length);
});

test('el progreso se guarda y no vuelve a anunciar sprites ya poseídos', () => {
  const progress = new SpriteProgress();
  const unlocked = progress.record('fish', 1);
  assert.equal(unlocked.length, 1);

  const saved = progress.serialize();
  const restored = new SpriteProgress(saved);
  assert.equal(restored.get('fish'), 1);
  assert.deepEqual([...restored.unlocked], [...progress.unlocked]);

  restored.markOwned([...progress.unlocked]);
  restored.markOwned(SKINS.filter((sprite) => sprite.requirement?.type === 'fish').map((sprite) => sprite.id));
  assert.deepEqual(restored.record('fish', 1000), []);
  assert.deepEqual(restored.record('tipo-inexistente', 5), []);
  assert.deepEqual(restored.record('fish', -2), []);
});
