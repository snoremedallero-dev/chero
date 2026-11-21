import { DEFAULT_SKIN_ID, STARTER_SPRITE_IDS, SKINS, getSkin } from '../data/SkinCatalog.js';

/**
 * Inventario de skins. Separa tres responsabilidades: desbloquear (misiones),
 * comprar (cartera) y equipar (avatar). No conoce Three.js ni el DOM.
 */
export class SkinCollection {
  /**
   * @param {string[]} owned IDs guardados (se filtran contra el catálogo)
   * @param {string} equipped ID equipado guardado
   */
  constructor(owned = [], equipped = DEFAULT_SKIN_ID) {
    const validIds = new Set(SKINS.map((skin) => skin.id));
    this.owned = new Set(STARTER_SPRITE_IDS);

    if (Array.isArray(owned)) {
      owned.forEach((id) => {
        if (validIds.has(id)) this.owned.add(id);
      });
    }

    this.equipped = this.owned.has(equipped) ? equipped : DEFAULT_SKIN_ID;
  }

  has(id) {
    return this.owned.has(id);
  }

  /** Desbloquea un skin por recompensa. Devuelve true si era nuevo. */
  unlock(id) {
    if (!getSkin(id) || this.owned.has(id)) return false;
    this.owned.add(id);
    return true;
  }

  /** Equipa un skin ya desbloqueado. */
  equip(id) {
    if (!this.owned.has(id)) return false;
    this.equipped = id;
    return true;
  }

  /**
   * Compra un skin con la moneda indicada.
   * @param {string} id ID del skin
   * @param {Wallet} wallet Cartera a la que se cobra
   * @param {'colones'|'bitcoins'} currency Moneda elegida
   * @returns {{ok:boolean, reason?:string, skin?:object}}
   */
  purchase(id, wallet, currency) {
    const skin = getSkin(id);
    if (!skin) return { ok: false, reason: 'skin-desconocido' };
    if (this.owned.has(id)) return { ok: false, reason: 'ya-obtenido' };
    if (skin.source !== 'shop' || !skin.price) {
      return { ok: false, reason: 'no-comprable' };
    }
    if (currency !== 'colones' && currency !== 'bitcoins') {
      return { ok: false, reason: 'moneda-invalida' };
    }
    if (!skin.price[currency]) {
      return { ok: false, reason: 'moneda-no-disponible' };
    }

    const price = { [currency]: skin.price[currency] };
    if (!wallet.spend(price)) return { ok: false, reason: 'fondos-insuficientes' };

    this.owned.add(id);
    return { ok: true, skin };
  }

  serialize() {
    return { owned: [...this.owned], equipped: this.equipped };
  }
}
