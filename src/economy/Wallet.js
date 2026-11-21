/**
 * Cartera de Chero World. Gestiona las dos monedas del juego con un tipo de
 * cambio fijo y sencillo: 1 bitcoin = 100 colones salvadoreños.
 *
 * Decisión de diseño: la conversión solo se hace en bloques enteros de 1 BTC
 * para evitar fracciones y mantener los números legibles en el HUD.
 */

export const COLONES_PER_BITCOIN = 100;

function sanitizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
}

export class Wallet {
  constructor({ colones = 0, bitcoins = 0 } = {}) {
    this.colones = sanitizeAmount(colones);
    this.bitcoins = sanitizeAmount(bitcoins);
  }

  /** Añade colones. Devuelve la cantidad realmente añadida. */
  addColones(amount) {
    const gained = sanitizeAmount(amount);
    this.colones += gained;
    return gained;
  }

  /** Añade bitcoins. Devuelve la cantidad realmente añadida. */
  addBitcoins(amount) {
    const gained = sanitizeAmount(amount);
    this.bitcoins += gained;
    return gained;
  }

  /**
   * Comprueba si la cartera cubre un precio expresado como
   * `{ colones, bitcoins }`. Un precio vacío es gratuito.
   */
  canAfford(price = {}) {
    return this.colones >= sanitizeAmount(price.colones)
      && this.bitcoins >= sanitizeAmount(price.bitcoins);
  }

  /**
   * Gasta un precio de forma atómica: si no alcanza, no cambia nada.
   * @returns {boolean} true si el pago se realizó
   */
  spend(price = {}) {
    if (!this.canAfford(price)) return false;
    this.colones -= sanitizeAmount(price.colones);
    this.bitcoins -= sanitizeAmount(price.bitcoins);
    return true;
  }

  /** Cambia `amount` colones a `amount` bitcoins usando la tasa fija. */
  convertToBitcoins(amount = 1) {
    const blocks = sanitizeAmount(amount);
    const cost = blocks * COLONES_PER_BITCOIN;
    if (blocks === 0 || this.colones < cost) return false;
    this.colones -= cost;
    this.bitcoins += blocks;
    return true;
  }

  /** Cambia `amount` bitcoins a colones usando la tasa fija. */
  convertToColones(amount = 1) {
    const blocks = sanitizeAmount(amount);
    if (blocks === 0 || this.bitcoins < blocks) return false;
    this.bitcoins -= blocks;
    this.colones += blocks * COLONES_PER_BITCOIN;
    return true;
  }

  serialize() {
    return { colones: this.colones, bitcoins: this.bitcoins };
  }
}
