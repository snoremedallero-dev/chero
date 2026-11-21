import test from 'node:test';
import assert from 'node:assert/strict';
import { LegendQuests, QUESTS } from '../src/quests/LegendQuests.js';

test('hablar con una leyenda acepta la misión y luego informa el progreso', () => {
  const quests = new LegendQuests();

  const accepted = quests.talk('cipitio');
  assert.equal(accepted.status, 'aceptada');
  assert.equal(quests.get('cipitio').accepted, true);

  const inProgress = quests.talk('cipitio');
  assert.equal(inProgress.status, 'en-curso');
  assert.equal(inProgress.progress, 0);

  assert.deepEqual(quests.talk('inexistente'), { status: 'desconocida' });
});

test('solo progresan las misiones aceptadas y se acota el avance al objetivo', () => {
  const quests = new LegendQuests();

  assert.deepEqual(quests.record('coins', 10), []);
  quests.accept('cipitio');
  assert.deepEqual(quests.record('coins', 10), []);
  assert.deepEqual(quests.record('coins', 25), ['cipitio']);
  assert.equal(quests.get('cipitio').progress, 30);
  assert.deepEqual(quests.record('coins', 50), []);
  assert.equal(quests.get('cipitio').progress, 30);
});

test('la recompensa se entrega una sola vez', () => {
  const quests = new LegendQuests();
  quests.accept('cipitio');
  quests.record('coins', 30);

  const claimed = quests.talk('cipitio');
  assert.equal(claimed.status, 'lista');
  assert.deepEqual(claimed.reward.skin, 'cipitio');
  assert.equal(quests.talk('cipitio').status, 'reclamada');
  assert.deepEqual(quests.record('coins', 10), []);
});

test('cada objetivo usa su propio tipo de progreso', () => {
  const quests = new LegendQuests();
  quests.accept('cihuanaba');
  quests.accept('sisimite');

  assert.deepEqual(quests.record('distance', 100), []);
  assert.deepEqual(quests.record('checkpoint', 1), []);
  assert.deepEqual(quests.record('distance', 100), ['cihuanaba']);
  assert.deepEqual(quests.record('checkpoint', 1), ['sisimite']);
});

test('el estado guardado se restaura y se sanea', () => {
  const saved = {
    cipitio: { accepted: true, progress: 9999, claimed: false },
    cihuanaba: { accepted: 'no', progress: -50, claimed: true },
    sisimite: { accepted: true, progress: 'abc', claimed: false },
    extra: { accepted: true, progress: 1, claimed: false }
  };
  const quests = new LegendQuests(saved);

  assert.equal(quests.get('cipitio').progress, 30);
  assert.equal(quests.get('cihuanaba').accepted, false);
  assert.equal(quests.get('cihuanaba').progress, 0);
  assert.equal(quests.get('sisimite').progress, 0);
  assert.equal(quests.get('extra'), null);

  const serialized = quests.serialize();
  assert.deepEqual(Object.keys(serialized), QUESTS.map((quest) => quest.id));
  assert.equal(serialized.cipitio.progress, 30);
});
