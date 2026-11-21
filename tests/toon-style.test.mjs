import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { createOutlineEffect, createToonMaterial, getToonGradientMap } from '../src/core/ToonStyle.js';
import { createStudTexture } from '../src/core/StudTexture.js';
import { FishingWorld } from '../src/world/FishingWorld.js';
import { CoinMineWorld } from '../src/world/CoinMineWorld.js';
import { CityProps } from '../src/world/CityProps.js';
import { installDomStub } from './dom-stub.mjs';

installDomStub();

test('la rampa toon es única, de tres tonos y sin interpolación', () => {
  const ramp = getToonGradientMap();
  assert.equal(ramp.isDataTexture, true);
  assert.equal(ramp.image.width, 3);
  assert.equal(ramp.image.height, 1);
  assert.equal(ramp.magFilter, THREE.NearestFilter);
  assert.equal(ramp.minFilter, THREE.NearestFilter);
  assert.equal(ramp.generateMipmaps, false);
  assert.equal(getToonGradientMap(), ramp);

  const tones = [];
  for (let i = 0; i < ramp.image.width; i++) tones.push(ramp.image.data[i * 4]);
  assert.deepEqual(tones, [72, 168, 255]);
});

test('los materiales toon conservan color, mapa y transparencia sin parámetros suaves', () => {
  const map = new THREE.Texture();
  const bumpMap = new THREE.Texture();
  const material = createToonMaterial({
    color: 0x18A999,
    map,
    bumpMap,
    bumpScale: 0.6,
    emissive: 0x0E7C7B,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.8,
    roughness: 0.9,
    metalness: 1,
    flatShading: true
  });

  assert.equal(material.isMeshToonMaterial, true);
  assert.equal(material.gradientMap, getToonGradientMap());
  assert.deepEqual(material.color.getHex(), 0x18A999);
  assert.equal(material.map, map);
  assert.equal(material.emissive.getHex(), 0x0E7C7B);
  assert.equal(material.emissiveIntensity, 0.4);
  assert.equal(material.transparent, true);
  assert.equal(material.opacity, 0.8);
  assert.equal(material.bumpMap, null);
  assert.equal(material.bumpScale, 0);
  assert.equal(material.roughness, undefined);
  assert.equal(material.metalness, undefined);
  assert.equal(material.flatShading, true);
});

test('el contorno global se configura con un renderer cualquiera', () => {
  const renderer = {
    autoClear: true,
    domElement: {},
    shadowMap: {},
    setSize() {},
    setPixelRatio() {},
    getSize() {},
    setViewport() {},
    setScissor() {},
    clear() {},
    render() {}
  };

  const effect = createOutlineEffect(renderer, OutlineEffect);
  assert.equal(typeof effect.render, 'function');
  assert.equal(typeof effect.renderOutline, 'function');
});

test('los mundos nuevos usan materiales toon y la textura de studs es plana', () => {
  const scene = { add() {} };
  const fishing = new FishingWorld(scene);
  const mine = new CoinMineWorld(scene);

  assert.equal(fishing.materials.ground.isMeshToonMaterial, true);
  assert.equal(fishing.materials.dock.isMeshToonMaterial, true);
  assert.equal(fishing.spots[0].fish[0].mesh.material.isMeshToonMaterial, true);
  assert.equal(mine.goldMat.isMeshToonMaterial, true);
  assert.equal(createStudTexture().magFilter, THREE.NearestFilter);
});

test('el mobiliario urbano low poly usa materiales toon de caras planas', () => {
  const parent = new THREE.Group();
  const group = new CityProps(parent).buildAll();
  const meshes = [];
  group.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });

  assert.ok(meshes.length > 20);
  assert.equal(meshes.every((object) => object.material.isMeshToonMaterial), true);
  assert.equal(meshes.every((object) => object.material.flatShading), true);

  const label = meshes.find((object) => object.material.map?.isCanvasTexture);
  assert.ok(label);
  assert.equal(label.material.map.magFilter, THREE.NearestFilter);
});

test('la interfaz no usa degradados ni desenfoques suaves', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /linear-gradient|radial-gradient|backdrop-filter|blur\(/i);
  assert.match(css, /box-shadow: 4px 4px 0/);
});

test('las instrucciones de controles empiezan ocultas en el documento', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="controls-help-btn"/);
  assert.match(html, /id="controls-hint"[^>]*hidden/);
});
