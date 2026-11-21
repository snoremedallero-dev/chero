import * as THREE from 'three';

/**
 * Estilo cel-shading compartido por todas las gráficas 3D de Chero World.
 *
 * Una sola rampa de 3 tonos (sombra / luz media / luz) produce transiciones
 * abruptas y el contorno se dibuja desde el renderer. El sombreado plano por
 * cara (flatShading) da el acabado low poly; se activa directamente en la
 * propiedad porque MeshToonMaterial no lo acepta como parámetro del constructor.
 * Mantener la configuración aquí evita tocar la lógica de cada mundo, avatar o bloque.
 */
const TONES = [72, 168, 255];
const OUTLINE_COLOR = [0.05, 0.12, 0.11];
const OUTLINE_THICKNESS = 0.008;
const SUPPORTED_KEYS = [
  'color', 'map', 'emissive', 'emissiveIntensity', 'emissiveMap',
  'normalMap', 'normalScale', 'alphaMap',
  'transparent', 'opacity', 'side', 'depthWrite', 'depthTest',
  'fog', 'name', 'userData'
];

let gradientMap = null;

export function getToonGradientMap() {
  if (!gradientMap) {
    const data = new Uint8Array(TONES.length * 4);
    TONES.forEach((tone, index) => {
      data[index * 4] = tone;
      data[index * 4 + 1] = tone;
      data[index * 4 + 2] = tone;
      data[index * 4 + 3] = 255;
    });

    gradientMap = new THREE.DataTexture(data, TONES.length, 1, THREE.RGBAFormat);
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;
    gradientMap.needsUpdate = true;
  }
  return gradientMap;
}

/**
 * Crea un material toon conservando mapa, color, emisivo y transparencia.
 * Los parámetros de brillo del estilo anterior se ignoran porque
 * MeshToonMaterial no los soporta; el relieve se anula para no suavizar tonos
 * y el sombreado por cara se activa para lograr el acabado low poly.
 */
export function createToonMaterial(parameters = {}) {
  const supported = {};
  SUPPORTED_KEYS.forEach((key) => {
    if (parameters[key] !== undefined) supported[key] = parameters[key];
  });

  const material = new THREE.MeshToonMaterial({
    ...supported,
    gradientMap: getToonGradientMap()
  });

  // El mapa de relieve se descarta; dejar solo el mapa de color evita sombreado suave.
  if (parameters.bumpMap) {
    material.bumpScale = 0;
  }

  // Caras planas visibles en cilindros, esferas y conos: base del estilo low poly.
  material.flatShading = parameters.flatShading !== false;

  return material;
}

/**
 * Contorno oscuro uniforme. Se crea aquí para que Engine no dependa de los
 * valores por defecto del efecto y la paleta siga siendo una sola decisión.
 */
export function createOutlineEffect(renderer, EffectClass) {
  return new EffectClass(renderer, {
    defaultThickness: OUTLINE_THICKNESS,
    defaultColor: OUTLINE_COLOR,
    defaultAlpha: 1,
    defaultKeepAlive: true
  });
}
