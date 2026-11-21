import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';

/**
 * Mobiliario urbano low poly inspirado en POLYGON City Pack: caras planas,
 * colores saturados, formas modulares y letreros nítidos. Se añade al entorno
 * central sin colisionadores nuevos para no cambiar la jugabilidad.
 */
function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function createLabelTexture(text, background, foreground) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = foreground;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = foreground;
  ctx.font = '900 34px "Avenir Next", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 34, 226);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export class CityProps {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.name = 'low-poly-city-props';
    this.group.userData.style = 'low-poly';
    parent.add(this.group);
    this.materials = this.initMaterials();
  }

  initMaterials() {
    const make = (color, extra = {}) => createToonMaterial({ color, ...extra });
    return {
      taxi: make(0xF2C23B),
      policeWhite: make(0xF3F0E6),
      policeBlue: make(0x2E5AA8),
      glass: make(0x17323C),
      tire: make(0x15191A),
      chrome: make(0xB9C4C2),
      red: make(0xD9473B, { emissive: 0x5A0E0A, emissiveIntensity: 0.4 }),
      blue: make(0x3E7FD8, { emissive: 0x0A2C6B, emissiveIntensity: 0.5 }),
      amber: make(0xE9A23B),
      hydrant: make(0xD6453C),
      pole: make(0x3A4A4A),
      trunk: make(0x7A4A2B),
      leaves: make(0x2E9B6A),
      leavesDark: make(0x1F7D57),
      green: make(0x39C07B, { emissive: 0x0E5C35, emissiveIntensity: 0.35 })
    };
  }

  buildCar({ x, z, rotation, body, accent, label, background, foreground, policeLights = false }) {
    const car = new THREE.Group();
    car.position.set(x, 0, z);
    car.rotation.y = rotation;

    car.add(mesh(new THREE.BoxGeometry(6.4, 1.5, 3), body, 0, 1.25, 0));
    car.add(mesh(new THREE.BoxGeometry(3.4, 1.4, 2.7), body, -0.5, 2.55, 0));
    car.add(mesh(new THREE.BoxGeometry(2.9, 0.8, 2.74), this.materials.glass, -0.5, 2.65, 0));
    car.add(mesh(new THREE.BoxGeometry(0.25, 1.4, 2.9), accent, 2.15, 1.35, 0));

    const wheelGeometry = new THREE.CylinderGeometry(0.72, 0.72, 0.42, 8);
    wheelGeometry.rotateX(Math.PI / 2);
    [-2.1, 2.1].forEach((wx) => {
      [-1.5, 1.5].forEach((wz) => {
        car.add(mesh(wheelGeometry, this.materials.tire, wx, 0.75, wz));
      });
    });

    [-1.05, 1.05].forEach((hz) => {
      car.add(mesh(new THREE.BoxGeometry(0.18, 0.35, 0.45), this.materials.amber, 3.25, 1.5, hz));
    });

    const labelMaterial = createToonMaterial({
      map: createLabelTexture(label, background, foreground)
    });
    const labelGeometry = policeLights
      ? new THREE.BoxGeometry(2.2, 0.12, 1.3)
      : new THREE.BoxGeometry(2.2, 0.7, 1.4);
    car.add(mesh(labelGeometry, labelMaterial, policeLights ? 2.2 : -0.5, policeLights ? 2.05 : 3.45, 0));

    if (policeLights) {
      car.add(mesh(new THREE.BoxGeometry(1.3, 0.35, 0.45), this.materials.red, -1.3, 3.42, -0.35));
      car.add(mesh(new THREE.BoxGeometry(1.3, 0.35, 0.45), this.materials.blue, -1.3, 3.42, 0.35));
    }

    this.group.add(car);
    return car;
  }

  buildHydrant(x, z) {
    const hydrant = new THREE.Group();
    hydrant.position.set(x, 0, z);
    hydrant.add(mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.3, 6), this.materials.pole, 0, 0.15, 0));
    hydrant.add(mesh(new THREE.CylinderGeometry(0.42, 0.46, 1.2, 6), this.materials.hydrant, 0, 0.9, 0));
    hydrant.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 6), this.materials.hydrant, 0, 1.6, 0));
    hydrant.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), this.materials.hydrant, 0.5, 1.15, 0));
    hydrant.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), this.materials.hydrant, -0.5, 1.15, 0));
    this.group.add(hydrant);
  }

  buildTrafficLight(x, z) {
    const signal = new THREE.Group();
    signal.position.set(x, 0, z);
    signal.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 6), this.materials.pole, 0, 1.6, 0));
    signal.add(mesh(new THREE.BoxGeometry(0.75, 1.8, 0.55), this.materials.pole, 0, 3.55, 0));
    [this.materials.red, this.materials.amber, this.materials.green].forEach((material, index) => {
      signal.add(mesh(new THREE.OctahedronGeometry(0.22, 0), material, 0, 4.15 - index * 0.6, 0.32));
    });
    this.group.add(signal);
  }

  buildAngularTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.add(mesh(new THREE.BoxGeometry(0.55, 2, 0.55), this.materials.trunk, 0, 1, 0));
    tree.add(mesh(new THREE.OctahedronGeometry(1.55, 0), this.materials.leaves, 0, 2.8, 0));
    tree.add(mesh(new THREE.OctahedronGeometry(0.95, 0), this.materials.leavesDark, 0.2, 3.9, 0));
    this.group.add(tree);
  }

  buildBench(x, z) {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.add(mesh(new THREE.BoxGeometry(2.6, 0.22, 1), this.materials.chrome, 0, 0.9, 0));
    bench.add(mesh(new THREE.BoxGeometry(2.6, 0.9, 0.2), this.materials.chrome, 0, 1.45, -0.42));
    [-1, 1].forEach((lx) => {
      bench.add(mesh(new THREE.BoxGeometry(0.18, 0.9, 0.8), this.materials.pole, lx, 0.45, 0));
    });
    this.group.add(bench);
  }

  buildAll() {
    this.buildCar({
      x: 14, z: 16, rotation: -0.35,
      body: this.materials.taxi, accent: this.materials.policeWhite,
      label: 'TAXI', background: '#E9A23B', foreground: '#102A2B'
    });
    this.buildCar({
      x: 16, z: -14, rotation: 0.6,
      body: this.materials.policeWhite, accent: this.materials.policeBlue,
      label: 'POLICE', background: '#F3F0E6', foreground: '#102A2B',
      policeLights: true
    });
    this.buildHydrant(10, 9);
    this.buildHydrant(-12, -9);
    this.buildTrafficLight(11, -8);
    this.buildTrafficLight(-10, 10);
    this.buildAngularTree(20, 8);
    this.buildAngularTree(-18, -8);
    this.buildBench(7, 13);
    this.buildBench(-9, 12);
    return this.group;
  }
}
