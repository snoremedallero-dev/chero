import test from 'node:test';
import assert from 'node:assert/strict';
import { Stamina } from '../src/character/Stamina.js';

test('la carrera consume energía y respeta la espera antes de regenerar', () => {
  const stamina = new Stamina({ max: 100, drainRate: 20, regenRate: 10, regenDelay: 0.5 });

  assert.equal(stamina.update(0.1, true, true), true);
  assert.equal(stamina.current, 98);

  // Con cooldown activo no regenera aunque se suelte la entrada.
  assert.equal(stamina.update(0.2, false, true), false);
  assert.equal(stamina.current, 98);

  // Terminado el cooldown, regenera.
  assert.equal(stamina.update(0.5, false, true), false);
  assert.equal(stamina.current, 100);
});

test('al agotarse exige recuperar un mínimo antes de volver a correr', () => {
  const stamina = new Stamina({ max: 100, drainRate: 100, regenRate: 20, minToSprint: 15 });

  assert.equal(stamina.update(1, true, true), false);
  assert.equal(stamina.current, 0);
  assert.equal(stamina.exhausted, true);

  assert.equal(stamina.update(0.1, true, true), false);
  assert.equal(stamina.current, 0);

  assert.equal(stamina.update(1, false, false), false);
  assert.ok(stamina.current >= 15);
  assert.equal(stamina.exhausted, false);

  assert.equal(stamina.update(0.1, true, true), true);
});

test('reset repone la energía tras reaparecer', () => {
  const stamina = new Stamina();
  stamina.update(1, true, true);
  stamina.reset();
  assert.equal(stamina.current, stamina.max);
  assert.equal(stamina.sprinting, false);
  assert.equal(stamina.exhausted, false);
});
