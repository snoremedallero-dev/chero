import { SIGUANABA } from './constants.js';

const ATAQUES_POR_FASE = {
  1: ['barrido', 'talon', 'llanto'],
  2: ['embestida', 'pisotón', 'mordisco']
};

const esNumero = (value) => typeof value === 'number' && Number.isFinite(value);
// El alcance de combate es horizontal: el centro del cuerpo del jugador va
// siempre ~4 unidades por encima del suelo y no debe reducir el rango.
const distancia = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/**
 * IA de La Siguanaba, La Madre Traicionada.
 * Solo resuelve lógica: avisos, fases y alcance. La malla, las partículas y el
 * audio se suscriben a onEvent(tipo, datos) desde la escena.
 */
export class Siguanaba {
  constructor({ onEvent = () => {}, datos = SIGUANABA } = {}) {
    this.onEvent = onEvent;
    this.datos = datos;
    this.reset();
  }

  reset() {
    this.vida = this.datos.vida;
    this.faseActual = 1;
    this.estado = 'dormida';
    this.temporizador = 0;
    this.ataqueActual = null;
    this.golpeAplicado = false;
    this.desarmada = 0;
    this.cambioFaseHecho = false;
    this.posicion = { x: 0, y: 0, z: 0 };
    this.indiceAtaque = 0;
  }

  get fase() {
    return this.faseActual;
  }

  get fraccionVida() {
    return Math.max(0, this.vida / this.datos.vida);
  }

  get derrotada() {
    return this.estado === 'derrotada';
  }

  get ataque() {
    return this.ataqueActual ? this.datos.ataques[this.ataqueActual] : null;
  }

  /** Datos del aviso actual para la interfaz y las señales visuales. */
  get telegrafo() {
    if (this.estado !== 'aviso' || !this.ataque) return null;
    return {
      id: this.ataqueActual,
      nombre: this.ataque.nombre,
      fase: this.faseActual,
      parryable: this.ataque.parryable,
      progreso: Math.min(1, 1 - this.temporizador / this.ataque.aviso)
    };
  }

  iniciar(posicion = this.posicion) {
    if (esNumero(posicion?.x) && esNumero(posicion?.y) && esNumero(posicion?.z)) {
      this.posicion = { ...posicion };
    }
    if (this.estado === 'dormida') {
      this.estado = 'buscar';
      this.onEvent('jefe:despertar', { fase: this.faseActual });
    }
  }

  /** Desarma al jefe tras un parry: cancela el ataque en curso. */
  desarmar(duracion = 1) {
    if (this.derrotada || this.estado === 'cambioFase') return false;
    this.desarmada = duracion;
    if (this.estado === 'aviso' || this.estado === 'golpe') {
      this.estado = 'recuperacion';
      this.temporizador = 0.6;
    }
    this.onEvent('jefe:desarmado', { duracion });
    return true;
  }

  elegirAtaque() {
    const lista = ATAQUES_POR_FASE[this.faseActual];
    const id = lista[this.indiceAtaque % lista.length];
    this.indiceAtaque += 1;
    return id;
  }

  /**
   * @returns {Object|null} ataque que alcanza al jugador en este instante.
   */
  update(dt, jugador) {
    if (!esNumero(dt) || dt <= 0 || this.estado === 'dormida' || this.derrotada) return null;

    if (this.desarmada > 0) {
      this.desarmada = Math.max(0, this.desarmada - dt);
      if (this.desarmada > 0) return null;
    }

    const objetivo = jugador?.posicion || jugador;
    if (objetivo && esNumero(objetivo.x) && esNumero(objetivo.z)) {
      if (this.estado === 'buscar' || this.estado === 'recuperacion') {
        this.acercar(objetivo, dt);
      }
    }

    this.temporizador = Math.max(0, this.temporizador - dt);
    if (this.temporizador > 0) return null;

    switch (this.estado) {
      case 'buscar':
        return this.entrarAviso(objetivo);
      case 'aviso':
        this.estado = 'golpe';
        this.golpeAplicado = false;
        this.temporizador = this.ataque.activo;
        this.onEvent('jefe:golpe', { id: this.ataqueActual, fase: this.faseActual });
        return null;
      case 'golpe': {
        if (!objetivo || this.golpeAplicado) return this.finalizarGolpe();
        const alcance = this.datos.distanciaAtaque;
        if (distancia(this.posicion, objetivo) > alcance) return this.finalizarGolpe();
        this.golpeAplicado = true;
        return {
          id: this.ataqueActual,
          nombre: this.ataque.nombre,
          danio: this.ataque.danio,
          parryable: this.ataque.parryable,
          fase: this.faseActual,
          origen: { ...this.posicion }
        };
      }
      case 'recuperacion':
        this.estado = 'buscar';
        return null;
      case 'cambioFase':
        this.faseActual = 2;
        this.cambioFaseHecho = true;
        this.estado = 'buscar';
        this.onEvent('jefe:fase2', { fase: 2 });
        return null;
      default:
        return null;
    }
  }

  entrarAviso(objetivo) {
    if (objetivo && distancia(this.posicion, objetivo) > this.datos.distanciaAtaque) return null;
    this.ataqueActual = this.elegirAtaque();
    this.estado = 'aviso';
    this.temporizador = this.ataque.aviso;
    this.onEvent('jefe:aviso', {
      id: this.ataqueActual,
      nombre: this.ataque.nombre,
      parryable: this.ataque.parryable,
      aviso: this.ataque.aviso,
      fase: this.faseActual
    });
    return null;
  }

  finalizarGolpe() {
    this.estado = 'recuperacion';
    this.temporizador = this.ataque.recuperacion;
    return null;
  }

  acercar(objetivo, dt) {
    const dx = objetivo.x - this.posicion.x;
    const dz = objetivo.z - this.posicion.z;
    const longitud = Math.hypot(dx, dz);
    if (longitud < 0.01) return;
    const paso = Math.min(longitud, this.datos.velocidad * dt);
    this.posicion.x += (dx / longitud) * paso;
    this.posicion.z += (dz / longitud) * paso;
  }

  /** @returns {{danio:number, cambioFase:boolean, derrotado:boolean, interrumpido:boolean}} */
  golpear(danio, { rompePostura = false } = {}) {
    if (this.derrotada || !esNumero(danio) || danio <= 0) {
      return { danio: 0, cambioFase: false, derrotado: this.derrotada, interrumpido: false };
    }
    const aplicado = Math.min(this.vida, danio);
    this.vida = Math.max(0, this.vida - aplicado);
    this.onEvent('jefe:herido', { danio: aplicado, vida: this.vida });

    let interrumpido = false;
    if (rompePostura) interrumpido = this.desarmar(0.9);

    let cambioFase = false;
    if (this.faseActual === 1 && !this.cambioFaseHecho && this.fraccionVida <= this.datos.umbralFase && this.vida > 0) {
      this.estado = 'cambioFase';
      this.temporizador = this.datos.duracionCambioFase;
      this.ataqueActual = null;
      // La segunda fase abre con la embestida ecuestre, su movimiento insignia.
      this.indiceAtaque = 0;
      this.desarmada = 0;
      cambioFase = true;
      this.onEvent('jefe:cambioFase', { duracion: this.datos.duracionCambioFase });
    }

    let derrotado = false;
    if (this.vida === 0) {
      this.estado = 'derrotada';
      this.ataqueActual = null;
      derrotado = true;
      this.onEvent('jefe:derrotado');
    }
    return { danio: aplicado, cambioFase, derrotado, interrumpido };
  }
}
