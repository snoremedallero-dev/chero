import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';

const PALETA = {
  ceniza: 0xD9A441,
  palma: 0xB98A45,
  obsidiana: 0x211C28,
  cabellera: 0x0D0B12,
  violeta: 0x8E5BD0,
  turquesa: 0x3FBFA8,
  sangre: 0xB03A2E,
  tierra: 0x6E4A32,
  hueso: 0xD8C9A8
};

/** Malla cónica de pocos lados: mantiene el acabado low poly del resto del juego. */
function cono(radio, altura, color, lados = 7) {
  return new THREE.Mesh(
    new THREE.ConeGeometry(radio, altura, lados),
    createToonMaterial({ color })
  );
}

function caja(ancho, alto, profundo, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(ancho, alto, profundo),
    createToonMaterial({ color })
  );
}

/**
 * Representación visual del prototipo: jefa, sombrero, disco y huella invertida.
 * No contiene lógica de combate; lee el estado y refleja los avisos en escena.
 */
export class CipitioVisuals {
  constructor(parent) {
    this.grupo = new THREE.Group();
    this.grupo.name = 'cipitio-prototipo';
    parent.add(this.grupo);
    this.tiempo = 0;
    this.vidaAnterior = null;
    this.flash = 0;

    this.construirJefa();
    this.construirSombrero();
    this.construirDisco();
    this.construirHuella();
  }

  construirJefa() {
    this.jefa = new THREE.Group();
    this.jefa.name = 'siguanaba';

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.4, 2.6, 7),
      createToonMaterial({ color: PALETA.hueso })
    );
    torso.position.y = 2.3;
    this.jefa.add(torso);

    const cabeza = cono(0.65, 1.1, PALETA.obsidiana, 6);
    cabeza.position.y = 4.1;
    this.jefa.add(cabeza);

    this.cabellera = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const mechon = cono(0.28, 2.4, PALETA.cabellera, 5);
      const angulo = (i / 6) * Math.PI * 2;
      mechon.position.set(Math.cos(angulo) * 0.5, 3.2, Math.sin(angulo) * 0.5);
      mechon.rotation.z = Math.cos(angulo) * 0.18;
      this.cabellera.add(mechon);
    }
    this.jefa.add(this.cabellera);

    for (const lado of [-1, 1]) {
      const pierna = caja(0.55, 1.8, 0.55, PALETA.tierra);
      pierna.position.set(lado * 0.55, 0.9, 0);
      this.jefa.add(pierna);
    }

    // Segunda fase: pesadilla ecuestre con mandíbula descoyuntada.
    this.caballo = new THREE.Group();
    const lomo = caja(1.3, 1, 2.8, PALETA.obsidiana);
    lomo.position.y = 1.7;
    this.caballo.add(lomo);
    const hocico = cono(0.55, 1.6, PALETA.sangre, 6);
    hocico.rotation.x = Math.PI / 2;
    hocico.position.set(0, 2, -1.9);
    this.caballo.add(hocico);
    const mandibula = caja(0.7, 0.25, 1.2, PALETA.hueso);
    mandibula.position.set(0, 1.5, -2.1);
    this.caballo.add(mandibula);
    this.caballo.visible = false;
    this.jefa.add(this.caballo);

    this.aviso = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 3.4, 16),
      createToonMaterial({ color: PALETA.ceniza, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    this.aviso.rotation.x = -Math.PI / 2;
    this.aviso.position.y = 0.06;
    this.aviso.visible = false;
    this.grupo.add(this.aviso);

    this.grupo.add(this.jefa);
  }

  construirSombrero() {
    this.sombrero = new THREE.Group();
    const ala = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.1, 9),
      createToonMaterial({ color: PALETA.palma })
    );
    const copa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.5, 0.55, 9),
      createToonMaterial({ color: PALETA.ceniza })
    );
    copa.position.y = 0.32;
    this.sombrero.add(ala, copa);
    this.grupo.add(this.sombrero);
  }

  construirDisco() {
    this.disco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.08, 10),
      createToonMaterial({ color: PALETA.ceniza })
    );
    this.disco.rotation.x = Math.PI / 2;
    this.disco.visible = false;
    this.grupo.add(this.disco);
  }

  construirHuella() {
    this.huellaGrupo = new THREE.Group();
    for (const lado of [-1, 1]) {
      const marca = caja(0.35, 0.04, 0.7, PALETA.ceniza);
      marca.position.set(lado * 0.28, 0.05, 0);
      this.huellaGrupo.add(marca);
    }
    this.huellaGrupo.visible = false;
    this.grupo.add(this.huellaGrupo);
  }

  setJefaVisible(visible) {
    this.jefa.visible = visible;
    if (!visible) this.aviso.visible = false;
  }

  actualizar(dt, { estado, jefe, posicionJugador, activo = true } = {}) {
    this.tiempo += Math.max(0, dt || 0);
    this.grupo.visible = activo;
    if (!activo) return;

    if (jefe) {
      this.jefa.position.set(jefe.posicion.x, jefe.posicion.y, jefe.posicion.z);
      if (posicionJugador) {
        const dx = posicionJugador.x - jefe.posicion.x;
        const dz = posicionJugador.z - jefe.posicion.z;
        if (Math.hypot(dx, dz) > 0.01) this.jefa.rotation.y = Math.atan2(dx, dz);
      }
      this.caballo.visible = jefe.fase === 2;
      this.cabellera.rotation.z = Math.sin(this.tiempo * 1.8) * 0.08;

      const telegrafo = jefe.telegrafo;
      this.aviso.visible = Boolean(telegrafo);
      if (telegrafo) {
        this.aviso.position.set(jefe.posicion.x, jefe.posicion.y + 0.06, jefe.posicion.z);
        this.aviso.material.color.setHex(telegrafo.parryable ? PALETA.ceniza : PALETA.violeta);
        this.aviso.material.opacity = 0.25 + telegrafo.progreso * 0.55;
        const escala = 1.25 - telegrafo.progreso * 0.35;
        this.aviso.scale.set(escala, escala, escala);
      }

      if (this.vidaAnterior !== null && jefe.vida < this.vidaAnterior) this.flash = 0.16;
      this.vidaAnterior = jefe.vida;
      this.flash = Math.max(0, this.flash - Math.max(0, dt || 0));
      this.jefa.scale.setScalar(this.flash > 0 ? 1.05 : 1);
    }

    if (estado && posicionJugador) {
      this.sombrero.position.set(
        posicionJugador.x,
        posicionJugador.y + 0.9 + Math.sin(this.tiempo * 2) * 0.04,
        posicionJugador.z
      );
      this.sombrero.rotation.z = estado.puedeParry ? 0.7 : Math.sin(this.tiempo * 1.4) * 0.08;
      this.sombrero.visible = !estado.derrotado;

      this.disco.visible = estado.discoEnVuelo;
      if (estado.discoEnVuelo && jefe) {
        const total = 0.6;
        const progreso = 1 - estado.discoRestante / total;
        const ida = Math.min(1, progreso / 0.5);
        const vuelta = Math.max(0, (progreso - 0.5) / 0.5);
        const t = ida - vuelta;
        this.disco.position.set(
          THREE.MathUtils.lerp(posicionJugador.x, jefe.posicion.x, t),
          posicionJugador.y + 0.3,
          THREE.MathUtils.lerp(posicionJugador.z, jefe.posicion.z, t)
        );
        this.disco.rotation.y = this.tiempo * 18;
      }

      this.huellaGrupo.visible = Boolean(estado.huella);
      if (estado.huella) {
        this.huellaGrupo.position.set(estado.huella.x, 0, estado.huella.z);
        this.huellaGrupo.rotation.y = estado.huella.yaw;
      }
    }
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
