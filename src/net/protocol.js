/**
 * Protocolo compartido entre cliente y servidor.
 * Toda entrada que llega por red se sanea aquí antes de tocar la escena o el
 * estado canónico, igual que DataStore sanea localStorage.
 */
export const DEFAULT_ROOM = 'chero-world';
export const BLOCK_LIMIT = 300;
export const PLAYER_LIMIT = 32;

const ROOM_PATTERN = /^[\w-]{1,32}$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SKIN_PATTERN = /^[A-Za-z0-9_-]{1,48}$/;

export function clampFinite(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function sanitizeRoom(value) {
  return typeof value === 'string' && ROOM_PATTERN.test(value) ? value : DEFAULT_ROOM;
}

export function sanitizeId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value) ? value : null;
}

export function createBlockId() {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeCoordinateVector(value, { min, max, yMin, yMax }, fallback) {
  if (!value || typeof value !== 'object') return null;
  const x = Number(value.x);
  const y = Number(value.y);
  const z = Number(value.z);
  if (![x, y, z].every(Number.isFinite)) return null;
  return {
    x: Math.min(max, Math.max(min, x)),
    y: Math.min(yMax, Math.max(yMin, y)),
    z: Math.min(max, Math.max(min, z))
  };
}

const WORLD_LIMITS = { min: -500, max: 500, yMin: -50, yMax: 300 };
const SIZE_LIMITS = { min: 0.5, max: 12, yMin: 0.5, yMax: 12 };

/** Bloque listo para guardar o difundir; devuelve null si no es válido. */
export function sanitizeBlock(raw, generateId = false) {
  if (!raw || typeof raw !== 'object') return null;

  const position = sanitizeCoordinateVector(raw.position, WORLD_LIMITS, null);
  const size = sanitizeCoordinateVector(raw.size, SIZE_LIMITS, null);
  if (!position || !size) return null;

  let id = sanitizeId(raw.id);
  if (!id) {
    if (!generateId) return null;
    id = createBlockId();
  }

  const color = typeof raw.color === 'number' && Number.isFinite(raw.color)
    ? Math.floor(Math.min(0xFFFFFF, Math.max(0, raw.color)))
    : (typeof raw.color === 'string' && /^#[\da-f]{3,8}$/i.test(raw.color) ? raw.color : 0xC05342);

  return { id, position, size, color };
}

/** Transformación de jugador acotada; devuelve null si no es válida. */
export function sanitizePlayerState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const position = sanitizeCoordinateVector(raw.position, WORLD_LIMITS, null);
  if (!position) return null;

  let rotationY = Number(raw.rotationY);
  if (!Number.isFinite(rotationY)) rotationY = 0;
  while (rotationY <= -Math.PI) rotationY += Math.PI * 2;
  while (rotationY > Math.PI) rotationY -= Math.PI * 2;

  const skin = typeof raw.skin === 'string' && SKIN_PATTERN.test(raw.skin) ? raw.skin : null;
  return {
    position,
    rotationY,
    moving: raw.moving === true,
    grounded: raw.grounded !== false,
    speed: clampFinite(raw.speed, 1, 0, 3),
    skin
  };
}
