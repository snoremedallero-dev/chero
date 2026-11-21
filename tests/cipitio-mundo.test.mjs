import test from 'node:test';
import assert from 'node:assert/strict';
import { CipitioController } from '../src/cipitio/CipitioController.js';
import { SOMBRERO } from '../src/cipitio/constants.js';

function crearEscena() {
  const agregados = [];
  return {
    agregados,
    add(objeto) { agregados.push(objeto); },
    remove(objeto) {
      const indice = agregados.indexOf(objeto);
      if (indice >= 0) agregados.splice(indice, 1);
    }
  };
}

function crearFisica() {
  const cuerpos = [];
  return {
    groundMaterial: {},
    addBody(cuerpo) { cuerpos.push(cuerpo); },
    removeBody(cuerpo) {
      const indice = cuerpos.indexOf(cuerpo);
      if (indice >= 0) cuerpos.splice(indice, 1);
    },
    cuerpos
  };
}

function crearControlador({ origen = { x: 300, y: 0, z: 300 } } = {}) {
  const scene = crearEscena();
  const physics = crearFisica();
  // Cerca del punto de la jefa para que el aviso aparezca en el primer tick.
  const posicion = { x: origen.x + 2, y: 4, z: origen.z - 6 };
  const vidas = [];
  const destinos = [];
  const eventos = [];
  const controlador = new CipitioController({
    scene,
    physicsWorld: physics,
    origen,
    crearHUD: false,
    obtenerPosicion: () => posicion,
    obtenerOrientacion: () => 0,
    estaMoviendose: () => false,
    sincronizarVida: (vida) => vidas.push(vida),
    teletransportar: (destino) => destinos.push(destino),
    onEvento: (tipo, datos) => eventos.push({ tipo, datos }),
    onVictoria: () => eventos.push({ tipo: 'victoria' })
  });
  return { controlador, scene, physics, posicion, vidas, destinos, eventos };
}

test('activar el sector adds arena y suelo físico, y despierta a la Siguanaba', () => {
  const { controlador, scene, physics, destinos } = crearControlador();

  assert.equal(scene.agregados.length, 0);
  assert.equal(controlador.activar(), true);
  assert.equal(scene.agregados.includes(controlador.arena.grupo), true);
  assert.equal(physics.cuerpos.length, 1);
  assert.notEqual(controlador.jefe.estado, 'dormida');
  assert.equal(controlador.visuals.jefa.visible, true);
  assert.equal(destinos[0].x, 300);
  assert.equal(destinos[0].z, 314);

  assert.equal(controlador.desactivar(), true);
  assert.equal(scene.agregados.length, 0);
  assert.equal(physics.cuerpos.length, 0);
  assert.equal(controlador.visuals.jefa.visible, false);
});

test('un parry correcto evita el daño y desarma al jefe', () => {
  const ctx = crearControlador();
  ctx.controlador.activar();

  ctx.controlador.update(0.01);
  assert.equal(ctx.controlador.jefe.estado, 'aviso');
  ctx.controlador.update(0.9);
  assert.equal(ctx.controlador.jefe.estado, 'golpe');

  assert.equal(ctx.controlador.parry(), true);
  ctx.controlador.update(0.3);

  assert.equal(ctx.vidas.at(-1), 100);
  assert.ok(ctx.controlador.jefe.desarmada > 0);
  assert.equal(ctx.eventos.some((evento) => evento.tipo === 'parry:exito'), true);
});

test('sin parry el golpe del jefe reduce la vida sincronizada', () => {
  const ctx = crearControlador();
  ctx.controlador.activar();

  ctx.controlador.update(0.01);
  ctx.controlador.update(0.9);
  ctx.controlador.update(0.3);

  assert.equal(ctx.vidas.at(-1), 100 - 22);
  assert.equal(ctx.eventos.some((evento) => evento.tipo === 'danio'), true);
});

test('el disco impacta una sola vez y la huella mueve al jugador', () => {
  const ctx = crearControlador();
  ctx.controlador.activar();
  const vidaInicial = ctx.controlador.jefe.vida;

  assert.equal(ctx.controlador.lanzarDisco(), true);
  ctx.controlador.update(SOMBRERO.idaDisco + 0.01);
  assert.equal(ctx.controlador.jefe.vida, vidaInicial - SOMBRERO.danioDisco);
  ctx.controlador.update(SOMBRERO.vueltaDisco + 0.01);
  assert.equal(ctx.controlador.jefe.vida, vidaInicial - SOMBRERO.danioDisco);

  ctx.posicion.x = 305;
  ctx.posicion.z = 320;
  ctx.controlador.estaMoviendose = () => true;
  ctx.controlador.update(1.3);
  const destinosAntes = ctx.destinos.length;
  assert.equal(ctx.controlador.saltarHuella(), true);
  assert.equal(ctx.destinos.length, destinosAntes + 1);
  assert.equal(ctx.destinos.at(-1).x, 305);
  assert.equal(ctx.destinos.at(-1).z, 320);
});

test('el progreso del prototipo se guarda y restaura', () => {
  const ctx = crearControlador();
  ctx.controlador.activar();
  ctx.controlador.jefe.golpear(999);
  ctx.controlador.update(0.01);

  const guardado = ctx.controlador.serialize();
  assert.equal(guardado.vencido, true);
  assert.equal(ctx.eventos.some((evento) => evento.tipo === 'prototipo:victoria'), true);

  const otro = crearControlador();
  otro.controlador.restore(guardado);
  assert.equal(otro.controlador.jefe.derrotada, true);
  assert.equal(otro.controlador.recompensaEntregada, true);
});

test('reentrar al sector conserva a la Siguanaba ya vencida', () => {
  const ctx = crearControlador();
  ctx.controlador.jefe.golpear(999);
  ctx.controlador.update(0.01);
  const guardado = ctx.controlador.serialize();
  ctx.controlador.desactivar();

  ctx.controlador.restore(guardado);
  assert.equal(ctx.controlador.activar(), true);
  assert.equal(ctx.controlador.jefe.derrotada, true);
  assert.equal(ctx.controlador.recompensaEntregada, true);
  assert.equal(ctx.controlador.visuals.jefa.visible, false);
});

test('reentrar tras una muerte restaura la vida antes de activar', () => {
  const ctx = crearControlador();
  ctx.controlador.restore({
    estado: { vida: 0, aliento: 0, ceniza: 0, tonico: 0, huella: null },
    vencido: false
  });
  assert.equal(ctx.controlador.estado.derrotado, true);

  ctx.controlador.activar();
  assert.equal(ctx.controlador.estado.vida, 100);
  assert.equal(ctx.controlador.estado.derrotado, false);
  assert.equal(ctx.vidas.at(-1), 100);
});
