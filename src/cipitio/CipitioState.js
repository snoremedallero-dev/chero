import { HUELLAS, RECURSOS, SOMBRERO, TRANSFORMACIONES } from './constants.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const esNumero = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Estado del combate del Cipitío, sin dependencias de Three.js ni del DOM.
 * emite eventos con onEvent(tipo, datos) para que audio, HUD y escena reaccionen.
 */
export class CipitioState {
  constructor({ onEvent = () => {}, recursos = RECURSOS } = {}) {
    this.onEvent = onEvent;
    this.recursos = recursos;
    this.reset();
  }

  reset() {
    this.vida = this.recursos.vida;
    this.aliento = this.recursos.aliento;
    this.ceniza = this.recursos.ceniza;
    this.tonico = this.recursos.tonico;
    this.parryRestante = 0;
    this.parryEnfriamiento = 0;
    this.discoEnVuelo = false;
    this.discoRestante = 0;
    this.discoImpactoPendiente = false;
    this.huella = null;
    this.huellaTemporizador = 0;
    this.saltoEnfriamiento = 0;
    this.desorientacion = 0;
    this.transformacion = null;
    this.transformacionRestante = 0;
    this.moviendose = false;
    this.posicion = { x: 0, y: 0, z: 0 };
    this.orientacion = 0;
    this.derrotado = false;
  }

  get puedeParry() {
    return this.parryRestante > 0 && !this.discoEnVuelo && !this.derrotado;
  }

  get ventanaParry() {
    if (this.transformacion === 'duende') return SOMBRERO.ventanaParryDuende;
    if (this.transformacion === 'jaguar') return SOMBRERO.ventanaParryJaguar;
    return SOMBRERO.ventanaParry;
  }

  get transformacionActiva() {
    return this.transformacion ? TRANSFORMACIONES[this.transformacion].nombre : null;
  }

  /** Avanza temporizadores, recursos y el rastro de huellas. */
  update(dt, { posicion, orientacion = 0, moviendose = false, planeando = false } = {}) {
    if (!esNumero(dt) || dt <= 0 || this.derrotado) return;

    this.moviendose = moviendose;
    if (posicion && esNumero(posicion.x) && esNumero(posicion.y) && esNumero(posicion.z)) {
      this.posicion = { x: posicion.x, y: posicion.y, z: posicion.z };
    }
    if (esNumero(orientacion)) this.orientacion = orientacion;

    const regeneracion = moviendose
      ? this.recursos.regeneracionAlientoMoviendose
      : this.recursos.regeneracionAlientoQuieto;
    this.aliento = clamp(this.aliento + regeneracion * dt, 0, this.recursos.aliento);
    this.ceniza = clamp(this.ceniza + this.recursos.regeneracionCeniza * dt, 0, this.recursos.ceniza);

    if (planeando && this.aliento > 0) {
      this.aliento = Math.max(0, this.aliento - this.recursos.costePlaneoPorSegundo * dt);
    }

    this.parryRestante = Math.max(0, this.parryRestante - dt);
    this.parryEnfriamiento = Math.max(0, this.parryEnfriamiento - dt);
    this.saltoEnfriamiento = Math.max(0, this.saltoEnfriamiento - dt);
    this.desorientacion = Math.max(0, this.desorientacion - dt);

    if (this.discoEnVuelo) {
      const anterior = this.discoRestante;
      this.discoRestante = Math.max(0, this.discoRestante - dt);
      const vueloTotal = SOMBRERO.idaDisco + SOMBRERO.vueltaDisco;
      const instanteIda = vueloTotal - SOMBRERO.idaDisco;
      if (anterior > instanteIda && this.discoRestante <= instanteIda) {
        this.discoImpactoPendiente = true;
        this.onEvent('disco:impacto');
      }
      if (this.discoRestante === 0) {
        this.discoEnVuelo = false;
        this.onEvent('disco:regreso');
      }
    }

    if (this.transformacion) {
      this.transformacionRestante = Math.max(0, this.transformacionRestante - dt);
      this.ceniza = Math.max(0, this.ceniza - TRANSFORMACIONES[this.transformacion].drenaje * dt);
      if (this.transformacionRestante === 0) {
        this.transformacion = null;
        this.onEvent('transformacion:fin');
      }
    }

    this.actualizarHuella(dt);
  }

  actualizarHuella(dt) {
    if (!this.moviendose) return;
    this.huellaTemporizador += dt;
    if (this.huellaTemporizador < HUELLAS.intervalo) return;
    if (this.huella) {
      const lejos = Math.hypot(
        this.posicion.x - this.huella.x,
        this.posicion.y - this.huella.y,
        this.posicion.z - this.huella.z
      );
      if (lejos < HUELLAS.distanciaMinima) return;
    }
    this.huella = {
      x: this.posicion.x,
      y: this.posicion.y,
      z: this.posicion.z,
      // La huella mira al revés: engaña la línea de ataque del enemigo.
      yaw: this.orientacion + Math.PI
    };
    this.huellaTemporizador = 0;
    this.onEvent('huella:nueva', this.huella);
  }

  startParry() {
    if (this.derrotado || this.discoEnVuelo || this.parryEnfriamiento > 0) return false;
    this.parryRestante = this.ventanaParry;
    this.parryEnfriamiento = SOMBRERO.enfriamientoParry;
    this.onEvent('sombrero:parry');
    return true;
  }

  throwDisc() {
    if (this.derrotado || this.discoEnVuelo || this.ceniza < SOMBRERO.costeDisco) return false;
    this.ceniza -= SOMBRERO.costeDisco;
    this.discoEnVuelo = true;
    this.discoRestante = SOMBRERO.idaDisco + SOMBRERO.vueltaDisco;
    this.discoImpactoPendiente = false;
    this.parryRestante = 0;
    this.onEvent('disco:lanzamiento');
    return true;
  }

  consumirImpactoDisco() {
    if (!this.discoImpactoPendiente) return false;
    this.discoImpactoPendiente = false;
    return true;
  }

  /** Devuelve la posición destino o null si no se pudo realizar el salto. */
  blink() {
    if (this.derrotado || !this.huella || this.saltoEnfriamiento > 0 || this.ceniza < HUELLAS.costeSalto) {
      return null;
    }
    this.ceniza -= HUELLAS.costeSalto;
    this.saltoEnfriamiento = HUELLAS.enfriamientoSalto;
    this.desorientacion = HUELLAS.desorientacion;
    const destino = { ...this.huella };
    this.posicion = { x: destino.x, y: destino.y, z: destino.z };
    this.orientacion = destino.yaw;
    this.onEvent('huella:salto', destino);
    return destino;
  }

  activarTransformacion(id) {
    if (this.derrotado || !TRANSFORMACIONES[id] || this.transformacion === id) return false;
    if (this.ceniza < TRANSFORMACIONES[id].coste) return false;
    this.ceniza -= TRANSFORMACIONES[id].coste;
    this.transformacion = id;
    this.transformacionRestante = TRANSFORMACIONES[id].duracion;
    this.onEvent('transformacion:inicio', id);
    return true;
  }

  esquivar() {
    if (this.derrotado || this.aliento < this.recursos.costeEsquiva) return false;
    this.aliento -= this.recursos.costeEsquiva;
    const radio = this.transformacion === 'duende' ? HUELLAS.radioDuende : 0;
    this.desorientacion = Math.max(this.desorientacion, HUELLAS.desorientacion + radio * 0.04);
    this.onEvent('esquiva');
    return true;
  }

  /** Resuelve un ataque entrante. Un parry correcto anula el daño y desarma al enemigo. */
  recibirAtaque({ danio = 0, parryable = true } = {}) {
    if (this.derrotado) return { parried: false, danio: 0, desarmado: false };

    if (parryable && this.puedeParry) {
      this.parryRestante = 0;
      this.ceniza = clamp(this.ceniza + SOMBRERO.cenizaPorParry, 0, this.recursos.ceniza);
      if (this.transformacion) {
        this.transformacionRestante += SOMBRERO.extensionTransformacionPorParry;
      }
      this.onEvent('parry:exito');
      return { parried: true, danio: 0, desarmado: true };
    }

    const recibido = Math.max(0, danio - (this.transformacion === 'jaguar' ? 4 : 0));
    this.vida = Math.max(0, this.vida - recibido);
    this.onEvent('danio', recibido);
    if (this.vida === 0) {
      this.derrotado = true;
      this.onEvent('muerte');
    }
    return { parried: false, danio: recibido, desarmado: false };
  }

  usarTonico() {
    if (this.derrotado || this.tonico <= 0 || this.vida >= this.recursos.vida) return false;
    this.tonico -= 1;
    this.vida = Math.min(this.recursos.vida, this.vida + this.recursos.curacionTonico);
    this.onEvent('tonico');
    return true;
  }

  descansar() {
    this.vida = this.recursos.vida;
    this.aliento = this.recursos.aliento;
    this.ceniza = this.recursos.ceniza;
    this.tonico = this.recursos.tonico;
    this.derrotado = false;
    this.onEvent('descanso');
  }

  serialize() {
    return {
      vida: this.vida,
      aliento: this.aliento,
      ceniza: this.ceniza,
      tonico: this.tonico,
      huella: this.huella ? { ...this.huella } : null
    };
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    if (esNumero(data.vida)) this.vida = clamp(data.vida, 0, this.recursos.vida);
    if (esNumero(data.aliento)) this.aliento = clamp(data.aliento, 0, this.recursos.aliento);
    if (esNumero(data.ceniza)) this.ceniza = clamp(data.ceniza, 0, this.recursos.ceniza);
    if (esNumero(data.tonico)) this.tonico = clamp(Math.floor(data.tonico), 0, this.recursos.tonico);
    const h = data.huella;
    if (h && [h.x, h.y, h.z, h.yaw].every(esNumero)) {
      this.huella = { x: h.x, y: h.y, z: h.z, yaw: h.yaw };
    }
    this.derrotado = this.vida === 0;
  }
}
