import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture } from '../core/StudTexture.js';

/**
 * Mina de monedas del norte. Las vetas se recogen por proximidad, como las
 * monedas de SalvadorWorld, y se reponen solas. La recompensa la decide
 * main.js para que el oro alimente directamente Wallet.
 */
export const MINE_CENTER = { x: -150, y: 0, z: -120 };
const VEIN_POSITIONS = [
  { x: -9, z: -7 }, { x: 0, z: -10 }, { x: 9, z: -6 },
  { x: -10, z: 5 }, { x: 1, z: 7 }, { x: 10, z: 6 }
];
const RESPAWN_MS = 8000;

export class CoinMineWorld {
  constructor(scene, physicsWorld = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.group = new THREE.Group();
    this.group.name = 'mina-de-monederas';
    this.veins = [];

    const studTex = createStudTexture();
    studTex.repeat.set(20, 20);

    const groundMat = createToonMaterial({
      color: 0x2E4266,
      map: studTex,
      roughness: 0.6,
      metalness: 0.05
    });
    const rockMat = createToonMaterial({
      color: 0x1B2B3A,
      roughness: 0.85,
      flatShading: true
    });
    this.goldMat = createToonMaterial({
      color: 0xE9A23B,
      emissive: 0x8A5B2E,
      emissiveIntensity: 0.35,
      metalness: 0.6,
      roughness: 0.25,
      flatShading: true
    });

    const ground = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40), groundMat);
    ground.position.set(MINE_CENTER.x, MINE_CENTER.y - 0.5, MINE_CENTER.z);
    ground.receiveShadow = true;
    this.ground = ground;
    this.group.add(ground);

    if (this.physicsWorld) {
      const body = new CANNON.Body({ mass: 0, material: this.physicsWorld.groundMaterial });
      body.addShape(new CANNON.Box(new CANNON.Vec3(20, 0.5, 20)));
      body.position.set(MINE_CENTER.x, MINE_CENTER.y - 0.5, MINE_CENTER.z);
      this.physicsWorld.addBody(body);
    }

    // Arcos facetados que enmarcan la caverna.
    [-14, 14].forEach((offset) => {
      const arch = new THREE.Mesh(new THREE.ConeGeometry(5, 12, 5), rockMat);
      arch.position.set(MINE_CENTER.x + offset, MINE_CENTER.y + 6, MINE_CENTER.z);
      arch.castShadow = true;
      this.group.add(arch);
    });

    VEIN_POSITIONS.forEach((offset, index) => {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), this.goldMat);
      mesh.position.set(MINE_CENTER.x + offset.x, MINE_CENTER.y + 1.5, MINE_CENTER.z + offset.z);
      mesh.castShadow = true;
      this.group.add(mesh);
      const reward = index % 3 === 0
        ? { bitcoins: 1 }
        : { colones: 20 };
      this.veins.push({
        id: `veta_${index}`,
        mesh,
        reward,
        available: true,
        respawnAt: 0,
        baseY: mesh.position.y
      });
    });

    this.marker = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), this.goldMat);
    this.marker.position.set(MINE_CENTER.x, MINE_CENTER.y + 8, MINE_CENTER.z);
    this.group.add(this.marker);

    this.scene.add(this.group);
  }

  /** Veta disponible más cercana, sin consumirla (para el prompt del HUD). */
  getClosestAvailable(playerPos) {
    let closest = null;
    let best = 2.6;

    this.veins.forEach((vein) => {
      if (!vein.available) return;
      const distance = Math.hypot(
        playerPos.x - vein.mesh.position.x,
        playerPos.y - vein.mesh.position.y,
        playerPos.z - vein.mesh.position.z
      );
      if (distance < best) {
        best = distance;
        closest = vein;
      }
    });

    return closest;
  }

  /**
   * Evento de proximidad. Devuelve `{ vein }` si hay una veta disponible.
   */
  checkPlayer(playerPos) {
    const vein = this.getClosestAvailable(playerPos);
    if (!vein) return { vein: null };

    vein.available = false;
    vein.mesh.visible = false;
    vein.respawnAt = Date.now() + RESPAWN_MS;
    return { vein };
  }

  getZone(playerPos) {
    const inside = Math.abs(playerPos.x - MINE_CENTER.x) < 22
      && Math.abs(playerPos.z - MINE_CENTER.z) < 22;
    return inside ? { name: 'Mina de Monedas', tag: '◆ Vetas de oro' } : null;
  }

  /** Suelo de la caverna disponible como superficie de construcción. */
  getBuildSurfaces() {
    return this.ground ? [this.ground] : [];
  }

  getMapLandmarks() {
    return [{
      name: 'Mina',
      x: MINE_CENTER.x,
      z: MINE_CENTER.z,
      color: '#E9A23B',
      shape: 'hex'
    }];
  }

  update(dt, elapsed = 0) {
    this.marker.rotation.y += dt * 1.2;
    this.marker.rotation.x += dt * 0.6;

    const now = Date.now();
    this.veins.forEach((vein, index) => {
      if (!vein.available && now >= vein.respawnAt) {
        vein.available = true;
        vein.mesh.visible = true;
      }
      if (vein.available) {
        vein.mesh.position.y = vein.baseY + Math.sin(elapsed * 2.5 + index) * 0.16;
        vein.mesh.rotation.y += dt * 1.5;
      }
    });
  }
}
