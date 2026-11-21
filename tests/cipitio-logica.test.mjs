import test from 'node:test';
import assert from 'node:assert/strict';
import { CipitioState } from '../src/cipitio/CipitioState.js';
import { Siguanaba } from '../src/cipitio/Siguanaba.js';
import { SOMBRERO } from '../src/cipitio/constants.js';

function crearEstado() {
  const eventos = [];
  const estado = new CipitioState({ onEvent: (tipo, datos) => eventos.push({ tipo, datos }) });
  return { estado, eventos };
}

const jugadorCerca = { posicion: { x: 2, y: 0, z: 0 } };

test('el parry del sombrero anula el daño solo dentro de la ventana', () => {
  const { estado, eventos } = crearEstado();

  assert.equal(estado.puedeParry, false);
  assert.equal(estado.startParry(), true);
  assert.equal(estado.puedeParry, true);

  estado.ceniza = 50;
  const resultado = estado.recibirAtaque({ danio: 22, parryable: true });
  assert.deepEqual(resultado, { parried: true, danio: 0, desarmado: true });
  assert.equal(estado.vida, 100);
  assert.equal(estado.ceniza, 50 + SOMBRERO.cenizaPorParry);
  assert.equal(eventos.some((evento) => evento.tipo === 'parry:exito'), true);

  // Fuera de la ventana el mismo golpe hace daño completo.
  estado.startParry();
  estado.update(SOMBRERO.ventanaParry + 0.01, { posicion: { x: 0, y: 0, z: 0 } });
  const fallido = estado.recibirAtaque({ danio: 22, parryable: true });
  assert.equal(fallido.parried, false);
  assert.equal(estado.vida, 78);

  // Los ataques no parryables tampoco se desvían.
  estado.startParry();
  estado.recibirAtaque({ danio: 34, parryable: false });
  assert.equal(estado.vida, 44);
});

test('el disco consume ceniza, bloquea el parry y solo impacta una vez', () => {
  const { estado, eventos } = crearEstado();

  assert.equal(estado.throwDisc(), true);
  assert.equal(estado.ceniza, 100 - SOMBRERO.costeDisco);
  assert.equal(estado.discoEnVuelo, true);
  assert.equal(estado.startParry(), false);
  assert.equal(estado.puedeParry, false);

  estado.update(SOMBRERO.idaDisco + 0.01, { posicion: { x: 0, y: 0, z: 0 } });
  assert.equal(estado.consumirImpactoDisco(), true);
  assert.equal(estado.consumirImpactoDisco(), false);

  estado.update(SOMBRERO.vueltaDisco + 0.01, { posicion: { x: 0, y: 0, z: 0 } });
  assert.equal(estado.discoEnVuelo, false);
  assert.equal(eventos.some((evento) => evento.tipo === 'disco:regreso'), true);
  assert.equal(estado.throwDisc(), true);
});

test('las huellas invertidas permiten teletransporte con coste y enfriamiento', () => {
  const { estado, eventos } = crearEstado();

  estado.update(1.3, { posicion: { x: 0, y: 0, z: 0 }, orientacion: 0, moviendose: true });
  assert.ok(estado.huella);
  assert.ok(Math.abs(estado.huella.yaw - Math.PI) < 0.001);

  estado.update(1.3, { posicion: { x: 5, y: 0, z: 0 }, orientacion: 1, moviendose: true });
  assert.equal(estado.huella.x, 5);
  assert.ok(Math.abs(estado.huella.yaw - (1 + Math.PI)) < 0.001);

  const destino = estado.blink();
  assert.deepEqual(destino, estado.huella);
  assert.equal(estado.ceniza, 75);
  assert.equal(estado.desorientacion > 0, true);
  assert.equal(estado.blink(), null);
  assert.equal(eventos.some((evento) => evento.tipo === 'huella:salto'), true);
});

test('las transformaciones cambian la ventana de parry, drenan ceniza y no se acumulan', () => {
  const { estado } = crearEstado();

  assert.equal(estado.activarTransformacion('duende'), true);
  assert.equal(estado.transformacionActiva, 'Duende Saltarín');
  assert.equal(estado.ventanaParry, SOMBRERO.ventanaParryDuende);
  assert.equal(estado.activarTransformacion('duende'), false);

  estado.update(1, { posicion: { x: 0, y: 0, z: 0 } });
  assert.ok(estado.ceniza < 67);
  const restante = estado.transformacionRestante;

  estado.startParry();
  estado.recibirAtaque({ danio: 20, parryable: true });
  assert.ok(estado.transformacionRestante > restante);

  assert.equal(estado.activarTransformacion('jaguar'), true);
  assert.equal(estado.transformacion, 'jaguar');
  assert.equal(estado.ventanaParry, SOMBRERO.ventanaParryJaguar);
});

test('la persistencia sanea valores fuera de rango del estado del Cipitío', () => {
  const { estado } = crearEstado();
  estado.restore({ vida: 9999, aliento: -5, ceniza: 'mucho', tonico: 99, huella: { x: 1, y: 2, z: 3, yaw: 0.5 } });

  assert.equal(estado.vida, 100);
  assert.equal(estado.aliento, 0);
  assert.equal(estado.ceniza, 100);
  assert.equal(estado.tonico, 3);
  assert.deepEqual(estado.huella, { x: 1, y: 2, z: 3, yaw: 0.5 });
  assert.equal(estado.serialize().vida, 100);
});

test('La Siguanaba avisa, ataca, cambia de fase y cae', () => {
  const eventos = [];
  const jefe = new Siguanaba({ onEvent: (tipo, datos) => eventos.push({ tipo, datos }) });

  jefe.iniciar({ x: 0, y: 0, z: 0 });
  assert.equal(jefe.fase, 1);
  assert.equal(jefe.estado, 'buscar');

  jefe.update(0.01, jugadorCerca);
  assert.equal(jefe.estado, 'aviso');
  assert.equal(jefe.telegrafo.id, 'barrido');
  assert.equal(jefe.telegrafo.parryable, true);

  jefe.update(0.9, jugadorCerca);
  assert.equal(jefe.estado, 'golpe');
  const golpe = jefe.update(0.3, jugadorCerca);
  assert.equal(golpe.parryable, true);
  assert.equal(golpe.danio, 22);

  const resultado = jefe.golpear(220);
  assert.equal(resultado.cambioFase, true);
  assert.equal(jefe.estado, 'cambioFase');
  jefe.update(1.6, jugadorCerca);
  assert.equal(jefe.fase, 2);

  jefe.update(0.01, jugadorCerca);
  assert.equal(jefe.estado, 'aviso');
  assert.equal(jefe.telegrafo.id, 'embestida');

  const final = jefe.golpear(1000);
  assert.equal(final.derrotado, true);
  assert.equal(jefe.derrotada, true);
  assert.equal(jefe.update(0.01, jugadorCerca), null);
  assert.equal(eventos.some((evento) => evento.tipo === 'jefe:fase2'), true);
  assert.equal(eventos.some((evento) => evento.tipo === 'jefe:derrotado'), true);
});

test('un parry desarma a la Siguanaba y cancela el ataque en curso', () => {
  const jefe = new Siguanaba();
  jefe.iniciar({ x: 0, y: 0, z: 0 });
  jefe.update(0.01, jugadorCerca);
  assert.equal(jefe.estado, 'aviso');

  assert.equal(jefe.desarmar(1), true);
  assert.equal(jefe.estado, 'recuperacion');
  assert.equal(jefe.telegrafo, null);
  assert.equal(jefe.update(0.1, jugadorCerca), null);

  const resultado = jefe.golpear(30, { rompePostura: true });
  assert.equal(resultado.interrumpido, true);
});
