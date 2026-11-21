/**
 * Catálogo de sprites de Chero World.
 *
 * Se conservan las API antiguas (`SKINS`, `getSkin`) y se añaden alias
 * semánticos (`SPRITES`, `getSprite`) porque el jugador elige "sprites".
 * Cada sprite define solo una paleta: AvatarR6 recicla materiales, no mallas.
 *
 * Reparto (100 total / 95 bloqueados):
 * - 5 iniciales (source: 'starter')
 * - 3 recompensas de leyenda (source: 'quest')
 * - 87 desbloqueos por requisitos de misión (source: 'mission')
 * - 5 comprables con colones o bitcoins (source: 'shop')
 */

export const DEFAULT_SKIN_ID = 'explorador';
export const DEFAULT_SPRITE_ID = DEFAULT_SKIN_ID;

const BASE_SKINS = [
  {
    id: 'explorador',
    name: 'Explorador Chero',
    icon: '◈',
    source: 'starter',
    description: 'El atuendo inicial del viajero salvadoreño.',
    palette: { head: 0xE8B98C, torso: 0x2E4266, arms: 0xE8B98C, legs: 0xB4553C, hat: 0x1F7A6D, sash: 0xF26A4B, eyes: 0x1F7A6D }
  },
  {
    id: 'cipitio',
    name: 'Cipitio',
    icon: '△',
    source: 'quest',
    questId: 'cipitio',
    description: 'El niño travieso de las leyendas, con su sombrero enorme.',
    palette: { head: 0xD9A574, torso: 0x7A4A2B, arms: 0xD9A574, legs: 0x5C7A3A, hat: 0xE9A23B, sash: 0xF26A4B, eyes: 0x2E4266 }
  },
  {
    id: 'cihuanaba',
    name: 'La Cihuanaba',
    icon: '◇',
    source: 'quest',
    questId: 'cihuanaba',
    description: 'La aparición del río: cabellera oscura y velo azulado.',
    palette: { head: 0xE6C7A5, torso: 0x2E4266, arms: 0xE6C7A5, legs: 0x1C2C44, hat: 0x2E4266, sash: 0x9C86C7, eyes: 0x0E7C7B }
  },
  {
    id: 'sisimite',
    name: 'El Sisimite',
    icon: '⬡',
    source: 'quest',
    questId: 'sisimite',
    description: 'El gigante peludo de las montañas, color musgo y tierra.',
    palette: { head: 0x8A6A4B, torso: 0x4E5D3A, arms: 0x8A6A4B, legs: 0x4E5D3A, hat: 0x3B4A2E, sash: 0xE9A23B, eyes: 0xF26A4B }
  },
  {
    id: 'pupusero',
    name: 'Pupusero',
    icon: '◆',
    source: 'shop',
    price: { colones: 150 },
    description: 'Mandil de la pupusería “El Chivo Feliz”.',
    palette: { head: 0xE8B98C, torso: 0xF6E9CF, arms: 0xE8B98C, legs: 0x3E7CA8, hat: 0xC05342, sash: 0xE9A23B, eyes: 0x0E7C7B }
  },
  {
    id: 'surfer',
    name: 'Surfer del Tunco',
    icon: '▽',
    source: 'shop',
    price: { colones: 220 },
    description: 'Colores del Pacífico para dominar las olas.',
    palette: { head: 0xD9A574, torso: 0x3E7CA8, arms: 0xD9A574, legs: 0xF6E9CF, hat: 0xE9A23B, sash: 0x18A999, eyes: 0x2E4266 }
  },
  {
    id: 'tazumal',
    name: 'Guardián de Tazumal',
    icon: '⬢',
    source: 'shop',
    price: { colones: 300 },
    description: 'Jade y piedra de las ruinas mayas.',
    palette: { head: 0xB98A5E, torso: 0x246B58, arms: 0xB98A5E, legs: 0x7C8794, hat: 0xE9A23B, sash: 0x18A999, eyes: 0xF26A4B }
  },
  {
    id: 'cripto',
    name: 'Chero Cripto',
    icon: '₿',
    source: 'shop',
    price: { bitcoins: 3 },
    description: 'El único atuendo que se paga con bitcoins.',
    palette: { head: 0xE8B98C, torso: 0x12233A, arms: 0xE8B98C, legs: 0x2E4266, hat: 0xE9A23B, sash: 0x18A999, eyes: 0xE9A23B }
  }
];

const STARTER_SKINS = [
  {
    id: 'amanecer',
    name: 'Amanecer Chero',
    icon: '☀',
    source: 'starter',
    description: 'Colores del primer sol sobre el volcán.',
    palette: { head: 0xF0C9A0, torso: 0xF26A4B, arms: 0xF0C9A0, legs: 0xE9A23B, hat: 0xF6E9CF, sash: 0x0E7C7B, eyes: 0x2E4266 }
  },
  {
    id: 'selva',
    name: 'Selva Chero',
    icon: '⬡',
    source: 'starter',
    description: 'Verdes profundos de los bosques salvadoreños.',
    palette: { head: 0xC99A6B, torso: 0x1F7A6D, arms: 0xC99A6B, legs: 0x4E5D3A, hat: 0x246B58, sash: 0xE9A23B, eyes: 0xF6E9CF }
  },
  {
    id: 'costa',
    name: 'Costa Chero',
    icon: '▽',
    source: 'starter',
    description: 'Arena clara y azul del Pacífico.',
    palette: { head: 0xE8B98C, torso: 0x3E7CA8, arms: 0xE8B98C, legs: 0xF6E9CF, hat: 0xE9A23B, sash: 0x18A999, eyes: 0x2E4266 }
  },
  {
    id: 'volcan',
    name: 'Volcán Chero',
    icon: '△',
    source: 'starter',
    description: 'Ceniza, lava y determinación.',
    palette: { head: 0x9C7351, torso: 0x4A3B3A, arms: 0x9C7351, legs: 0x2E2E33, hat: 0xF26A4B, sash: 0xE9A23B, eyes: 0x18A999 }
  }
];

const EXTRA_SHOP_SKIN = {
  id: 'minero',
  name: 'Minero de Oro',
  icon: '◆',
  source: 'shop',
  price: { colones: 400 },
  description: 'Atuendo de la mina con reflejos ámbar.',
  palette: { head: 0xB98A5E, torso: 0x2E4266, arms: 0xB98A5E, legs: 0x4A3B3A, hat: 0xE9A23B, sash: 0xF6E9CF, eyes: 0x0E7C7B }
};

/** Requisitos que desbloquean los 87 sprites de misión. */
export const SPRITE_REQUIREMENTS = [
  { type: 'coins', count: 18, start: 50, step: 50, label: (n) => `Recoge ${n} colones` },
  { type: 'distance', count: 18, start: 300, step: 300, label: (n) => `Camina ${n} metros` },
  { type: 'checkpoint', count: 12, start: 3, step: 1, label: (n) => `Activa ${n} checkpoints` },
  { type: 'fish', count: 12, start: 1, step: 1, label: (n) => `Pesca ${n} veces` },
  { type: 'mine', count: 12, start: 1, step: 1, label: (n) => `Extrae ${n} vetas` },
  { type: 'build', count: 12, start: 2, step: 1, label: (n) => `Coloca ${n} bloques` },
  { type: 'quest', count: 3, start: 1, step: 1, label: (n) => `Completa ${n} misiones de leyenda` }
];

const ADJETIVOS = ['Cromo', 'Solar', 'Lunar', 'Bruma', 'Roca', 'Miel', 'Menta', 'Cobalto', 'Ámbar', 'Coral'];
const FORMAS = ['Explorador', 'Guardián', 'Nómada', 'Artesano', 'Pescador', 'Minero', 'Sabio', 'Veloz'];
const ICONOS = ['◈', '◇', '△', '▽', '⬡', '⬢', '◆', '✦', '₿', '≋'];
const TONOS = [
  { torso: 0x2E4266, legs: 0x1F7A6D, hat: 0xE9A23B, sash: 0xF26A4B },
  { torso: 0x0E7C7B, legs: 0x246B58, hat: 0xF6E9CF, sash: 0xE9A23B },
  { torso: 0xF26A4B, legs: 0x7C8794, hat: 0x2E4266, sash: 0x18A999 },
  { torso: 0x9C86C7, legs: 0x4E5D3A, hat: 0xF26A4B, sash: 0xF6E9CF },
  { torso: 0x246B58, legs: 0xB4553C, hat: 0x18A999, sash: 0xE9A23B },
  { torso: 0x3E7CA8, legs: 0x2E4266, hat: 0xE9A23B, sash: 0xF6E9CF }
];

function buildMissionSprites() {
  const sprites = [];
  let index = 0;

  SPRITE_REQUIREMENTS.forEach((group) => {
    for (let step = 0; step < group.count; step++) {
      const amount = group.start + step * group.step;
      const tone = TONOS[index % TONOS.length];
      sprites.push({
        id: `meta_${String(index + 1).padStart(2, '0')}`,
        name: `${ADJETIVOS[index % ADJETIVOS.length]} ${FORMAS[Math.floor(index / ADJETIVOS.length) % FORMAS.length]} ${index + 1}`,
        icon: ICONOS[index % ICONOS.length],
        source: 'mission',
        requirement: { type: group.type, amount, label: group.label(amount) },
        description: `Se desbloquea al cumplir: ${group.label(amount)}.`,
        palette: {
          head: 0xE8B98C,
          torso: tone.torso,
          arms: 0xD9A574,
          legs: tone.legs,
          hat: tone.hat,
          sash: tone.sash,
          eyes: tone.torso
        }
      });
      index++;
    }
  });

  return sprites;
}

export const SKINS = [
  ...BASE_SKINS,
  ...STARTER_SKINS,
  ...buildMissionSprites(),
  EXTRA_SHOP_SKIN
];

/** Alias semántico usado por la pantalla de inicio y el progreso de sprites. */
export const SPRITES = SKINS;

export const STARTER_SPRITE_IDS = SKINS
  .filter((sprite) => sprite.source === 'starter')
  .map((sprite) => sprite.id);

export const TOTAL_SPRITES = SKINS.length;
export const LOCKED_SPRITES = SKINS.filter((sprite) => sprite.source !== 'starter').length;

/** Busca un sprite por id. Devuelve null si no existe. */
export function getSkin(id) {
  return SKINS.find((skin) => skin.id === id) || null;
}

export const getSprite = getSkin;
