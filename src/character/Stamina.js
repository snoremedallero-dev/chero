/**
 * Gestor puro de la energía usada al correr. Se mantiene separado del
 * controlador del jugador para poder validar su lógica sin WebGL ni DOM.
 *
 * Decisión de diseño: al agotarse la energía se exige recuperar un 15% antes
 * de volver a correr, evitando el parpadeo de velocidad al soltar/tomar Shift.
 */
export class Stamina {
  constructor(options = {}) {
    this.max = options.max ?? 100;
    this.current = this.max;
    this.drainRate = options.drainRate ?? 26;     // puntos por segundo corriendo
    this.regenRate = options.regenRate ?? 18;     // puntos por segundo recuperando
    this.regenDelay = options.regenDelay ?? 0.6;  // espera tras dejar de correr
    this.minToSprint = options.minToSprint ?? 15;

    this.sprinting = false;
    this.exhausted = false;
    this.cooldown = 0;
  }

  get ratio() {
    return this.max > 0 ? this.current / this.max : 0;
  }

  /**
   * Avanza la energía un frame y devuelve si el jugador puede correr.
   * @param {number} dt Delta de tiempo en segundos
   * @param {boolean} wantsSprint Entrada de Shift / botón táctil
   * @param {boolean} isMoving Si hay movimiento horizontal real
   */
  update(dt, wantsSprint, isMoving) {
    if (!Number.isFinite(dt) || dt <= 0) return this.sprinting;

    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }

    const canSprint = wantsSprint && isMoving && !this.exhausted && this.current > 0;

    if (canSprint) {
      this.current = Math.max(0, this.current - this.drainRate * dt);
      this.sprinting = true;
      this.cooldown = this.regenDelay;

      if (this.current <= 0) {
        this.exhausted = true;
        this.sprinting = false;
      }
    } else {
      this.sprinting = false;
      if (this.cooldown <= 0) {
        this.current = Math.min(this.max, this.current + this.regenRate * dt);
      }
    }

    if (this.exhausted && this.current >= this.minToSprint) {
      this.exhausted = false;
    }

    return this.sprinting;
  }

  /** Repone la energía tras una muerte o reaparición. */
  reset() {
    this.current = this.max;
    this.sprinting = false;
    this.exhausted = false;
    this.cooldown = 0;
  }
}
