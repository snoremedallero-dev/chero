import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';

/**
 * Leyendas salvadoreñas que entregan misiones. Son figuras geométricas
 * facetadas (octógonos, conos e icosaedros), deliberadamente distintas del
 * avatar modular del jugador. No tienen colisionador: no bloquean el paso.
 */

export const NPC_DEFS = [
  {
    id: 'cipitio',
    questId: 'cipitio',
    name: 'Cipitio',
    epithet: 'El travieso del maíz',
    glyph: '△',
    position: { x: 10, y: 0, z: 18 },
    style: 'trickster',
    colors: { body: 0x7A4A2B, head: 0xD9A574, accent: 0xE9A23B, dark: 0x2E4266 }
  },
  {
    id: 'cihuanaba',
    questId: 'cihuanaba',
    name: 'La Cihuanaba',
    epithet: 'La voz junto al río',
    glyph: '◇',
    position: { x: 10, y: 0, z: 118 },
    style: 'spirit',
    colors: { body: 0x2E4266, head: 0xE6C7A5, accent: 0x9C86C7, dark: 0x1C2C44 }
  },
  {
    id: 'sisimite',
    questId: 'sisimite',
    name: 'El Sisimite',
    epithet: 'Guardían de la montaña',
    glyph: '⬡',
    position: { x: 20, y: 0, z: -8 },
    style: 'giant',
    colors: { body: 0x4E5D3A, head: 0x8A6A4B, accent: 0xE9A23B, dark: 0x3B4A2E }
  }
];

function material(color, emissive = 0x000000) {
  return createToonMaterial({
    color,
    emissive,
    emissiveIntensity: emissive ? 0.25 : 0,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true
  });
}

export class LegendNPCs {
  constructor(scene) {
    this.reach = 6;
    this.group = new THREE.Group();
    this.group.name = 'leyendas-salvadorenas';
    this.npcs = [];

    NPC_DEFS.forEach((def) => {
      const npc = this.createNPC(def);
      this.npcs.push(npc);
      this.group.add(npc.group);
    });

    scene.add(this.group);
  }

  createNPC(def) {
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);

    const skin = material(def.colors.head);
    const cloth = material(def.colors.body);
    const accent = material(def.colors.accent, def.colors.accent);
    const dark = material(def.colors.dark);

    // Pedestal octogonal: mismo lenguaje visual que la retícula y el minimapa.
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 0.5, 8), dark);
    pedestal.position.y = 0.25;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.08, 4, 8), accent);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.52;
    group.add(ring);

    let bodyHeight = 2.4;
    let headY = 3.3;

    if (def.style === 'trickster') {
      bodyHeight = 1.7;
      headY = 2.7;
    } else if (def.style === 'giant') {
      bodyHeight = 3.0;
      headY = 3.9;
    }

    const body = new THREE.Mesh(new THREE.ConeGeometry(1.15, bodyHeight, 7), cloth);
    body.position.y = 0.5 + bodyHeight / 2;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), skin);
    head.position.y = headY;
    head.castShadow = true;
    group.add(head);

    // Brazos facetados, simétricos.
    const armGeo = new THREE.BoxGeometry(0.45, def.style === 'giant' ? 2.0 : 1.4, 0.45);
    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(armGeo, skin);
      arm.position.set(side * (def.style === 'giant' ? 1.35 : 0.95), headY - 0.8, 0);
      arm.rotation.z = side * 0.18;
      arm.castShadow = true;
      group.add(arm);
    });

    // Accesorios propios de cada leyenda.
    if (def.style === 'trickster') {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 0.85, 0.17, 8), accent);
      hat.position.y = headY + 0.55;
      hat.castShadow = true;
      group.add(hat);
    } else if (def.style === 'spirit') {
      const veil = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.6, 6), dark);
      veil.position.y = headY - 0.15;
      group.add(veil);
    } else {
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 5), accent);
      crest.position.y = headY + 0.7;
      group.add(crest);
    }

    // Distintivo flotante: rombo giratorio que señala al NPC.
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), accent);
    marker.position.y = headY + 1.5;
    group.add(marker);

    return { ...def, group, marker, baseMarkerY: marker.position.y };
  }

  /** Devuelve la leyenda más cercana dentro del alcance, o null. */
  getClosest(playerPos) {
    let closest = null;
    let best = this.reach;

    this.npcs.forEach((npc) => {
      const distance = Math.hypot(
        playerPos.x - npc.position.x,
        playerPos.y - (npc.position.y + 1.5),
        playerPos.z - npc.position.z
      );
      if (distance < best) {
        best = distance;
        closest = npc;
      }
    });

    return closest;
  }

  /** Igual que getClosest; nombre explícito para el flujo de interacción. */
  tryTalk(playerPos) {
    return this.getClosest(playerPos);
  }

  /** Animación idle: el rombo flota y gira. */
  update(dt, elapsed = 0) {
    this.npcs.forEach((npc, index) => {
      npc.marker.rotation.y += dt * 1.6;
      npc.marker.position.y = npc.baseMarkerY + Math.sin(elapsed * 2 + index) * 0.18;
    });
  }

  /** Marcadores opcionales para el minimapa. */
  getMapLandmarks() {
    return this.npcs.map((npc) => ({
      name: npc.name,
      x: npc.position.x,
      z: npc.position.z,
      color: `#${new THREE.Color(npc.colors.accent).getHexString()}`,
      shape: npc.style === 'spirit' ? 'hex' : 'diamond'
    }));
  }
}
