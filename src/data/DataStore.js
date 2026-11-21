/**
 * Sistema de persistencia DataStore para guardar el progreso del jugador en el navegador.
 */
const DEFAULT_POSITION = { x: 0, y: 4, z: 10 };

function boundedNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function readPosition(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_POSITION };
  return {
    x: boundedNumber(value.x, DEFAULT_POSITION.x, -500, 500),
    y: boundedNumber(value.y, DEFAULT_POSITION.y, -50, 300),
    z: boundedNumber(value.z, DEFAULT_POSITION.z, -500, 500)
  };
}

export class DataStore {
  constructor(storageKey = 'chero_world_save') {
    this.storageKey = storageKey;
    this.defaults = {
      stage: 1,
      deaths: 0,
      coins: 50,
      bitcoins: 0,
      distance: 0,
      blocks: [],
      skins: null,
      quests: null,
      spriteProgress: null,
      cameraMode: 'tps',
      worldId: 'central',
      position: { ...DEFAULT_POSITION },
      health: 100,
      stamina: 100,
      dayTime: 30,
      audioMuted: false,
      controlsHelpVisible: false,
      hotbarIndex: 0,
      cipitio: null
    };
  }

  /**
   * Carga los datos guardados del jugador.
   */
  load() {
    try {
      let raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        // Migración desde la clave usada por versiones anteriores.
        raw = localStorage.getItem('antigravity_chero_save');
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...this.defaults,
          ...parsed,
          blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [],
          position: readPosition(parsed.position),
          health: boundedNumber(parsed.health, this.defaults.health, 0, 100),
          stamina: boundedNumber(parsed.stamina, this.defaults.stamina, 0, 100),
          dayTime: boundedNumber(parsed.dayTime, this.defaults.dayTime, 0, 120),
          audioMuted: parsed.audioMuted === true,
          controlsHelpVisible: parsed.controlsHelpVisible === true,
          hotbarIndex: Math.floor(boundedNumber(parsed.hotbarIndex, this.defaults.hotbarIndex, 0, 5)),
          cipitio: parsed.cipitio && typeof parsed.cipitio === 'object' && !Array.isArray(parsed.cipitio)
            ? parsed.cipitio
            : null
        };
      }
    } catch (e) {
      console.warn('No se pudo acceder a localStorage:', e);
    }

    return { ...this.defaults, blocks: [], position: { ...DEFAULT_POSITION } };
  }

  /**
   * Guarda el estado actual del jugador.
   */
  save(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Error al guardar en DataStore:', e);
    }
  }

  /**
   * Reinicia los datos guardados.
   */
  reset() {
    try {
      localStorage.removeItem(this.storageKey);
      // La migración de la clave anterior también debe desaparecer al
      // reiniciar, o el siguiente load() restauraría un progreso fantasma.
      localStorage.removeItem('antigravity_chero_save');
    } catch (e) {
      console.warn('Error al reiniciar DataStore:', e);
    }
  }
}
