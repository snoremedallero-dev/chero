import { SKINS } from '../data/SkinCatalog.js';

/**
 * Progreso que desbloquea los sprites de misión.
 *
 * Es deliberadamente independiente de LegendQuests: esas misiones son tres
 * historias concretas, mientras que aquí hay 87 metas escalonadas (colones,
 * distancia, checkpoints, pesca, mina, construcción y misiones de leyenda).
 * `record()` devuelve solo los sprites cuyo umbral se acaba de cruzar, para
 * que main.js pueda avisar una vez y guardar.
 */

export const SPRITE_GOAL_TYPES = ['coins', 'distance', 'checkpoint', 'fish', 'mine', 'build', 'quest'];

const REQUIREMENTS = SKINS
  .filter((sprite) => sprite.requirement && SPRITE_GOAL_TYPES.includes(sprite.requirement.type))
  .map((sprite) => ({
    id: sprite.id,
    type: sprite.requirement.type,
    amount: Math.max(1, Math.floor(Number(sprite.requirement.amount) || 1)),
    sprite
  }));

function clampCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

export class SpriteProgress {
  constructor(state = {}) {
    const saved = state && typeof state === 'object' ? state : {};
    const counters = saved.counters && typeof saved.counters === 'object' ? saved.counters : saved;

    this.counters = {};
    SPRITE_GOAL_TYPES.forEach((type) => {
      this.counters[type] = clampCount(counters[type]);
    });

    this.unlocked = new Set(
      Array.isArray(saved.unlocked)
        ? saved.unlocked.filter((id) => typeof id === 'string')
        : []
    );
  }

  get(type) {
    return this.counters[type] || 0;
  }

  /** Evita volver a anunciar sprites que ya están en el inventario guardado. */
  markOwned(ids = []) {
    if (!Array.isArray(ids)) return;
    const known = new Set(REQUIREMENTS.map((requirement) => requirement.id));
    ids.forEach((id) => {
      if (known.has(id)) this.unlocked.add(id);
    });
  }

  /** Progreso legible para una tarjeta de sprite bloqueado. */
  progressFor(spriteOrId) {
    const sprite = typeof spriteOrId === 'string'
      ? SKINS.find((item) => item.id === spriteOrId)
      : spriteOrId;
    if (!sprite || !sprite.requirement) return null;

    const target = Math.max(1, Math.floor(Number(sprite.requirement.amount) || 1));
    const current = Math.min(Math.floor(this.get(sprite.requirement.type)), target);
    return {
      current,
      target,
      label: sprite.requirement.label,
      met: current >= target
    };
  }

  /**
   * Suma avance a un tipo de meta.
   * @returns {object[]} definiciones de sprites recién desbloqueados
   */
  record(type, amount = 1) {
    if (!SPRITE_GOAL_TYPES.includes(type)) return [];
    const increment = Number(amount);
    if (!Number.isFinite(increment) || increment <= 0) return [];

    const before = this.counters[type];
    this.counters[type] = before + increment;

    const unlockedNow = [];
    REQUIREMENTS.forEach((requirement) => {
      if (requirement.type !== type || this.unlocked.has(requirement.id)) return;
      if (before < requirement.amount && this.counters[type] >= requirement.amount) {
        this.unlocked.add(requirement.id);
        unlockedNow.push(requirement.sprite);
      }
    });
    return unlockedNow;
  }

  serialize() {
    return {
      counters: { ...this.counters },
      unlocked: [...this.unlocked]
    };
  }
}
