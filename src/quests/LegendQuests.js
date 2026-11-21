/**
 * Misiones encomendadas por leyendas salvadoreñas.
 *
 * Decisión de diseño: las misiones se aceptan al hablar con la leyenda y solo
 * progresan mientras están aceptadas. La recompensa se entrega también al
 * hablar con ella cuando el objetivo se ha completado, para que el NPC tenga
 * un papel activo y no sea solo decoración.
 */

export const QUESTS = [
  {
    id: 'cipitio',
    npc: 'Cipitio',
    title: 'Travesura de Cipitio',
    description: 'Recoge 30 colones repartidos por el país.',
    goal: { type: 'coins', amount: 30 },
    reward: { skin: 'cipitio', bitcoins: 1 }
  },
  {
    id: 'cihuanaba',
    npc: 'La Cihuanaba',
    title: 'El río de la Cihuanaba',
    description: 'Camina 200 metros por las tierras salvadoreñas.',
    goal: { type: 'distance', amount: 200 },
    reward: { skin: 'cihuanaba', bitcoins: 2 }
  },
  {
    id: 'sisimite',
    npc: 'El Sisimite',
    title: 'La montaña del Sisimite',
    description: 'Activa 2 puntos de control de la pista Obby.',
    goal: { type: 'checkpoint', amount: 2 },
    reward: { skin: 'sisimite', bitcoins: 3 }
  }
];

function clampProgress(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.min(number, max);
}

export class LegendQuests {
  constructor(state = {}) {
    this.quests = new Map();

    QUESTS.forEach((def) => {
      const saved = (state && typeof state === 'object' && state[def.id]) || {};
      this.quests.set(def.id, {
        // Solo `true` cuenta como afirmativo: evita que cadenas como 'no'
        // procedentes de un guardado manipulado activen una misión.
        accepted: saved.accepted === true,
        progress: clampProgress(saved.progress, def.goal.amount),
        claimed: saved.claimed === true
      });
    });
  }

  get(id) {
    return this.quests.get(id) || null;
  }

  /** Devuelve la definición y el estado de una misión. */
  describe(id) {
    const def = QUESTS.find((quest) => quest.id === id);
    const state = this.get(id);
    if (!def || !state) return null;
    return { def, state };
  }

  isComplete(id) {
    const info = this.describe(id);
    return Boolean(info && info.state.progress >= info.def.goal.amount);
  }

  /** Acepta una misión. Devuelve false si ya estaba aceptada. */
  accept(id) {
    const state = this.get(id);
    if (!state || state.accepted) return false;
    state.accepted = true;
    return true;
  }

  /**
   * Registra avance en todas las misiones aceptadas de un tipo.
   * @param {'coins'|'distance'|'checkpoint'} type
   * @param {number} amount
   * @returns {string[]} IDs de misiones que se completaron en este momento
   */
  record(type, amount = 1) {
    const increment = Number(amount);
    if (!Number.isFinite(increment) || increment <= 0) return [];

    const justCompleted = [];
    QUESTS.forEach((def) => {
      if (def.goal.type !== type) return;
      const state = this.quests.get(def.id);
      if (!state.accepted || state.claimed) return;

      const before = state.progress;
      state.progress = Math.min(def.goal.amount, before + increment);
      if (before < def.goal.amount && state.progress >= def.goal.amount) {
        justCompleted.push(def.id);
      }
    });

    return justCompleted;
  }

  /**
   * Hablar con una leyenda: acepta la misión si hace falta y reclama la
   * recompensa si ya está completa.
   * @returns {{status:'desconocida'|'aceptada'|'en-curso'|'reclamada'|'lista',
   *            quest?:object, reward?:object, progress?:number}}
   */
  talk(id) {
    const info = this.describe(id);
    if (!info) return { status: 'desconocida' };

    const { def, state } = info;
    if (!state.accepted) {
      state.accepted = true;
      return { status: 'aceptada', quest: def, progress: state.progress };
    }

    if (state.claimed) {
      return { status: 'reclamada', quest: def, progress: state.progress };
    }

    if (!this.isComplete(id)) {
      return { status: 'en-curso', quest: def, progress: state.progress };
    }

    state.claimed = true;
    return { status: 'lista', quest: def, reward: { ...def.reward }, progress: state.progress };
  }

  serialize() {
    const result = {};
    this.quests.forEach((state, id) => {
      result[id] = { ...state };
    });
    return result;
  }
}
