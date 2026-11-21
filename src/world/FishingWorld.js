import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture } from '../core/StudTexture.js';

/**
 * Mundos de pesca de Chero World. Cada lago/río es una isla construida con el
 * mismo lenguaje visual facetado del resto del juego; la acción de pescar se
 * resuelve por proximidad con [G] o el botón táctil, sin duplicar el inventario.
 */
export const FISHING_SPOTS = [
  {
    id: 'guija',
    name: 'Lago de Güija',
    position: { x: -150, y: 0, z: 110 },
    water: 0x18A999,
    accent: 0xE9A23B,
    reward: { colones: 25 },
    reach: 7
  },
  {
    id: 'coatepeque',
    name: 'Lago de Coatepeque',
    position: { x: 150, y: 0, z: 110 },
    water: 0x3E7CA8,
    accent: 0xF26A4B,
    reward: { colones: 30 },
    reach: 7
  },
  {
    id: 'lempa',
    name: 'Río Lempa',
    position: { x: 0, y: 0, z: -120 },
    water: 0x2E4266,
    accent: 0x18A999,
    reward: { colones: 20 },
    reach: 7
  }
];

const CATCH_COOLDOWN_MS = 1500;

export class FishingWorld {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.group.name = 'mundos-de-pesca';
    this.spots = [];
    this.studTex = createStudTexture();
    this.studTex.repeat.set(18, 18);

    this.materials = {
      ground: createToonMaterial({
        color: 0x2F8F76,
        map: this.studTex,
        roughness: 0.55,
        metalness: 0.05
      }),
      dock: createToonMaterial({ color: 0x8A5B2E, roughness: 0.75, flatShading: true })
    };

    FISHING_SPOTS.forEach((def) => this.spots.push(this.buildSpot(def)));
    this.scene.add(this.group);
  }

  buildSpot(def) {
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);

    const ground = new THREE.Mesh(new THREE.BoxGeometry(36, 1, 36), this.materials.ground);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    group.add(ground);

    if (this.physicsWorld) {
      const body = new CANNON.Body({ mass: 0, material: this.physicsWorld.groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(18, 0.5, 18)));
      body.position.set(def.position.x, def.position.y - 0.5, def.position.z);
      this.physicsWorld.addBody(body);
    }

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 0.5, 8),
      createToonMaterial({
        color: def.water,
        roughness: 0.15,
        metalness: 0.15,
        transparent: true,
        opacity: 0.82,
        flatShading: true
      })
    );
    water.position.y = 0.25;
    group.add(water);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(13.2, 0.18, 4, 8),
      createToonMaterial({ color: def.accent, roughness: 0.5, flatShading: true })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.55;
    group.add(ring);

    // Muelle octogonal que sirve de punto de interacción.
    for (let i = 0; i < 3; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(5, 0.35, 3), this.materials.dock);
      plank.position.set(0, 0.75, 12 - i * 3);
      plank.receiveShadow = true;
      group.add(plank);
    }

    const accent = createToonMaterial({
      color: def.accent,
      emissive: def.accent,
      emissiveIntensity: 0.25,
      roughness: 0.5,
      flatShading: true
    });

    const fish = [];
    [-5, 0, 5].forEach((x, index) => {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), accent);
      mesh.position.set(x, 1.1, 2 + (index % 2) * 3);
      mesh.scale.set(1.4, 0.6, 0.8);
      group.add(mesh);
      fish.push({ mesh, baseY: mesh.position.y });
    });

    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), accent);
    marker.position.y = 4;
    group.add(marker);

    const totem = new THREE.Mesh(
      new THREE.ConeGeometry(1.1, 2.4, 6),
      createToonMaterial({ color: 0x17393A, roughness: 0.7, flatShading: true })
    );
    totem.position.set(0, 1.2, 15);
    group.add(totem);

    this.group.add(group);
    return { ...def, group, ground, fish, marker, baseMarkerY: marker.position.y, lastCatch: 0 };
  }

  /** Devuelve el punto de pesca más cercano dentro del alcance, o null. */
  getClosest(playerPos) {
    let closest = null;
    let best = Infinity;

    this.spots.forEach((spot) => {
      const distance = Math.hypot(
        playerPos.x - spot.position.x,
        playerPos.y - (spot.position.y + 1.5),
        playerPos.z - spot.position.z
      );
      if (distance < spot.reach && distance < best) {
        best = distance;
        closest = spot;
      }
    });

    return closest;
  }

  /**
   * Intenta pescar en un punto. Devuelve la recompensa o el motivo del fallo.
   */
  catchFish(spotOrId) {
    const spot = typeof spotOrId === 'string'
      ? this.spots.find((item) => item.id === spotOrId)
      : spotOrId;
    if (!spot) return { ok: false, reason: 'sin-punto' };

    const now = Date.now();
    if (now - spot.lastCatch < CATCH_COOLDOWN_MS) {
      return { ok: false, reason: 'cooldown' };
    }

    spot.lastCatch = now;
    return { ok: true, spot, reward: { ...spot.reward } };
  }

  getZone(playerPos) {
    const spot = this.spots.find((item) => (
      Math.abs(playerPos.x - item.position.x) < 20
      && Math.abs(playerPos.z - item.position.z) < 20
    ));
    return spot ? { name: spot.name, tag: '≋ Zona de pesca' } : null;
  }

  /** Suelos disponibles como superficie de construcción. */
  getBuildSurfaces() {
    return this.spots.map((spot) => spot.ground);
  }

  getMapLandmarks() {
    return this.spots.map((spot) => ({
      name: spot.name,
      x: spot.position.x,
      z: spot.position.z,
      color: `#${new THREE.Color(spot.accent).getHexString()}`,
      shape: 'square'
    }));
  }

  update(dt, elapsed = 0) {
    this.spots.forEach((spot, index) => {
      spot.marker.rotation.y += dt * 1.4;
      spot.marker.position.y = spot.baseMarkerY + Math.sin(elapsed * 2 + index) * 0.2;
      spot.fish.forEach((item, fishIndex) => {
        item.mesh.position.y = item.baseY + Math.sin(elapsed * 3 + fishIndex + index) * 0.18;
        item.mesh.rotation.y += dt * 0.8;
      });
    });
  }
}
