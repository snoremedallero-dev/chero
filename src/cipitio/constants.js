/**
 * Ajustes del prototipo jugable de Cipitío.
 * Toda la lógica numérica vive aquí para poder balancear el combate sin tocar
 * los sistemas de render, físicos ni de interfaz.
 */

export const RECURSOS = {
  vida: 100,
  aliento: 100,
  ceniza: 100,
  tonico: 3,
  curacionTonico: 40,
  regeneracionAlientoQuieto: 18,
  regeneracionAlientoMoviendose: 8,
  regeneracionCeniza: 4,
  costePlaneoPorSegundo: 22,
  costeEsquiva: 25
};

export const SOMBRERO = {
  ventanaParry: 0.18,
  ventanaParryDuende: 0.24,
  ventanaParryJaguar: 0.12,
  enfriamientoParry: 0.4,
  costeDisco: 18,
  idaDisco: 0.3,
  vueltaDisco: 0.3,
  danioDisco: 22,
  cenizaPorParry: 12,
  extensionTransformacionPorParry: 2
};

export const HUELLAS = {
  intervalo: 1.2,
  distanciaMinima: 1.5,
  costeSalto: 25,
  enfriamientoSalto: 0.8,
  desorientacion: 0.5,
  radioDuende: 2.5
};

export const TRANSFORMACIONES = {
  duende: { nombre: 'Duende Saltarín', duracion: 20, coste: 35, drenaje: 3 },
  jaguar: { nombre: 'Nahual del Jaguar', duracion: 20, coste: 35, drenaje: 3 },
  torogoz: { nombre: 'Espíritu del Torogoz', duracion: 20, coste: 35, drenaje: 3 }
};

export const SIGUANABA = {
  vida: 420,
  umbralFase: 0.5,
  velocidad: 2.2,
  duracionCambioFase: 1.6,
  distanciaAtaque: 4.5,
  ataques: {
    barrido: { fase: 1, aviso: 0.9, activo: 0.3, recuperacion: 0.9, danio: 22, parryable: true, nombre: 'Barrido de cabellera' },
    talon: { fase: 1, aviso: 0.8, activo: 0.25, recuperacion: 0.8, danio: 18, parryable: true, nombre: 'Zancada de talón' },
    llanto: { fase: 1, aviso: 1.1, activo: 0.4, recuperacion: 1, danio: 16, parryable: true, nombre: 'Lamento en ondas' },
    embestida: { fase: 2, aviso: 1, activo: 0.35, recuperacion: 0.7, danio: 28, parryable: true, nombre: 'Embestida ecuestre' },
    pisotón: { fase: 2, aviso: 0.85, activo: 0.3, recuperacion: 0.9, danio: 24, parryable: true, nombre: 'Pisotón con onda' },
    mordisco: { fase: 2, aviso: 0.7, activo: 0.25, recuperacion: 1.1, danio: 34, parryable: false, nombre: 'Mandíbula descoyuntada' }
  }
};

/** Glifos geométricos: se conserva la identidad visual del proyecto, sin emojis. */
export const GLIFOS = {
  ceniza: '✦',
  aliento: '≋',
  vida: '◆',
  centro: '◈',
  huella: '◇',
  jefe: '⬢',
  cambio: '△'
};
