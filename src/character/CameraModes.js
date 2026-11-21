/**
 * Catálogo de modos de cámara de Chero World.
 *
 * Decisión de diseño: cada modo es solo una configuración declarativa. Para
 * añadir uno nuevo basta con agregar una entrada aquí y un botón en el
 * selector; ThirdPersonCamera y el resto de sistemas no necesitan cambios.
 */
export const CAMERA_MODES = [
  {
    id: 'tps',
    label: 'TPS · Orbital',
    icon: '◈',
    distance: 14,
    pitch: 0.35,
    fov: 65,
    minDistance: 4,
    maxDistance: 28,
    smoothing: 15,
    firstPerson: false,
    showAvatar: true,
    description: 'Vista orbital amplia, ideal para construir.'
  },
  {
    id: 'tps-close',
    label: 'TPS · Cercana',
    icon: '◇',
    distance: 8,
    pitch: 0.22,
    fov: 70,
    minDistance: 5,
    maxDistance: 12,
    smoothing: 18,
    firstPerson: false,
    showAvatar: true,
    description: 'Seguimiento próximo para explorar senderos.'
  },
  {
    id: 'fps',
    label: 'FPS · Primera persona',
    icon: '▽',
    distance: 0,
    pitch: 0,
    fov: 78,
    minDistance: 0,
    maxDistance: 0,
    smoothing: 25,
    firstPerson: true,
    eyeHeight: 1.1,
    showAvatar: false,
    description: 'La cámara se coloca en la mirada del Chero.'
  },
  {
    id: 'top',
    label: 'Cenital · Mapa',
    icon: '⬡',
    distance: 26,
    pitch: 1.25,
    fov: 58,
    minDistance: 18,
    maxDistance: 34,
    smoothing: 10,
    firstPerson: false,
    showAvatar: true,
    description: 'Vista alta para leer el terreno y los mundos.'
  }
];

export const DEFAULT_CAMERA_MODE = 'tps';

/** Devuelve la configuración de un modo o null si no existe. */
export function getCameraMode(id) {
  return CAMERA_MODES.find((mode) => mode.id === id) || null;
}

/** Devuelve el id del siguiente modo en el catálogo (ciclo circular). */
export function nextCameraMode(id) {
  const index = CAMERA_MODES.findIndex((mode) => mode.id === id);
  if (index === -1) return DEFAULT_CAMERA_MODE;
  return CAMERA_MODES[(index + 1) % CAMERA_MODES.length].id;
}
