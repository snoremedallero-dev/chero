import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './dom-stub.mjs';
import { MiniMap } from '../src/ui/MiniMap.js';

test('el minimapa convierte coordenadas del mundo al lienzo', () => {
  installDomStub();
  const map = new MiniMap();

  assert.equal(map.canvas.id, 'minimap-canvas');
  assert.deepEqual(map._worldToCanvas(0, 0, 0, 0), { cx: map.size / 2, cy: map.size / 2 });
  assert.deepEqual(map._worldToCanvas(100, -50, 0, 0), {
    cx: map.size / 2 + 100 * (map.size / 2) / map.viewRadius,
    cy: map.size / 2 - 50 * (map.size / 2) / map.viewRadius
  });
});

test('update dibuja zonas, marcadores y puntero sin lanzar errores', () => {
  installDomStub();
  const map = new MiniMap();

  assert.doesNotThrow(() => {
    map.update({ x: 0, y: 4, z: 10 }, { name: 'Parque Central de Santa Ana' }, 0);
    map.update({ x: 130, y: 42, z: 0 }, { name: 'Volcán de Santa Ana' }, Math.PI / 3);
    map.update({ x: -120, y: 22, z: 0 }, null);
  });
});
