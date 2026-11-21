import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';

const COLORES = {
  lava: 0x8C2F22,
  roca: 0x3B2E2A,
  ceniza: 0x6B625C,
  caña: 0x4E6B3A,
  bahareque: 0x9A7350,
  obsidiana: 0x211C28,
  brasa: 0xE38B32
};

function malla(geometria, color, opciones = {}) {
  return new THREE.Mesh(geometria, createToonMaterial({ color, ...opciones }));
}

/**
 * Arena del Capítulo 1: Las Cenizas de Izalco.
 * Es un grupo autocontenido; el mundo que lo integre decide dónde ubicarlo.
 */
export class CipitioArena {
  constructor() {
    this.grupo = new THREE.Group();
    this.grupo.name = 'cipitio-izalco';
    this.tiempo = 0;
    this.brasas = [];

    this.construirSuelo();
    this.construirCanares();
    this.construirPueblo();
    this.construirObsidiana();
  }

  construirSuelo() {
    const suelo = malla(new THREE.CylinderGeometry(26, 26, 1, 12), COLORES.roca);
    suelo.position.y = -0.5;
    suelo.receiveShadow = true;
    this.grupo.add(suelo);

    const centro = malla(new THREE.CylinderGeometry(14, 14, 0.12, 12), COLORES.ceniza);
    centro.position.y = 0.02;
    centro.receiveShadow = true;
    this.grupo.add(centro);

    for (let i = 0; i < 8; i += 1) {
      const angulo = (i / 8) * Math.PI * 2;
      const grieta = malla(new THREE.BoxGeometry(0.5, 0.08, 9), COLORES.lava, {
        emissive: COLORES.brasa,
        emissiveIntensity: 0.4
      });
      grieta.position.set(Math.cos(angulo) * 8, 0.1, Math.sin(angulo) * 8);
      grieta.rotation.y = angulo;
      this.grupo.add(grieta);
      this.brasas.push(grieta);
    }
  }

  construirCanares() {
    for (let i = 0; i < 14; i += 1) {
      const angulo = (i / 14) * Math.PI * 2;
      const radio = 21 + (i % 3);
      const tallo = malla(new THREE.CylinderGeometry(0.12, 0.16, 3.2, 5), COLORES.caña);
      tallo.position.set(Math.cos(angulo) * radio, 1.6, Math.sin(angulo) * radio);
      tallo.rotation.z = Math.sin(i) * 0.09;
      const punta = malla(new THREE.ConeGeometry(0.2, 0.9, 5), COLORES.brasa);
      punta.position.set(tallo.position.x, 3.4, tallo.position.z);
      this.grupo.add(tallo, punta);
    }
  }

  construirPueblo() {
    const posiciones = [[-19, -12], [-22, -6], [18, 14]];
    posiciones.forEach(([x, z], indice) => {
      const casa = new THREE.Group();
      const pared = malla(new THREE.BoxGeometry(4, 2.6, 3.4), COLORES.bahareque);
      pared.position.y = 1.3;
      const techo = malla(new THREE.ConeGeometry(3.2, 1.6, 4), COLORES.roca);
      techo.position.y = 3.4;
      techo.rotation.y = Math.PI / 4;
      casa.add(pared, techo);
      casa.position.set(x, 0, z);
      casa.rotation.y = indice * 0.7;
      this.grupo.add(casa);
    });
  }

  construirObsidiana() {
    for (let i = 0; i < 7; i += 1) {
      const angulo = (i / 7) * Math.PI * 2 + 0.3;
      const punta = malla(new THREE.ConeGeometry(0.8, 3 + (i % 3), 5), COLORES.obsidiana);
      punta.position.set(Math.cos(angulo) * 16, 1.6, Math.sin(angulo) * 16);
      punta.rotation.z = Math.cos(angulo) * 0.12;
      this.grupo.add(punta);
    }
  }

  update(dt) {
    this.tiempo += Math.max(0, dt || 0);
    this.brasas.forEach((grieta, indice) => {
      grieta.material.emissiveIntensity = 0.3 + Math.abs(Math.sin(this.tiempo * 2 + indice)) * 0.35;
    });
  }

  /** Punto de aparición del jugador dentro del grupo. */
  getPuntoEntrada() {
    // Y del centro del cuerpo de PlayerController, no del avatar.
    return { x: 0, y: 4, z: 14 };
  }

  /** Punto de aparición de la Siguanaba. */
  getPuntoJefa() {
    return { x: 0, y: 0, z: -8 };
  }

  dispose() {
    this.grupo.traverse((objeto) => {
      if (!objeto.isMesh) return;
      objeto.geometry.dispose();
      const materiales = Array.isArray(objeto.material) ? objeto.material : [objeto.material];
      materiales.forEach((material) => material.dispose());
    });
    this.grupo.removeFromParent();
  }
}
