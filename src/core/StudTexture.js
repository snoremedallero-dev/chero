import * as THREE from 'three';

/**
 * Generador procedural de la textura de "mosaico tejido" usada en las caras
 * superiores de bloques y terrenos. Sustituye los remaches cilíndricos por un
 * diamante grabado y tramas diagonales, conservando la API de la que dependen
 * Baseplate, BlockManager, ObbyLevel y SalvadorWorld.
 */
function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function finishTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  return texture;
}

function diamondPath(ctx, cx, cy, radius) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();
}

export function createStudTexture() {
  const size = 128;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Fondo claro: los materiales coloreados siguen controlando el tono final.
  ctx.fillStyle = '#f2f2ee';
  ctx.fillRect(0, 0, size, size);

  // Trama de tejido en diagonales suaves.
  ctx.strokeStyle = 'rgba(40, 60, 55, 0.10)';
  ctx.lineWidth = 2;
  for (let offset = -size; offset < size * 2; offset += 16) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }

  // Diamante central con sombra inferior para dar relieve sin imitar un stud.
  ctx.save();
  ctx.translate(2, 3);
  diamondPath(ctx, cx, cy, size * 0.27);
  ctx.fillStyle = 'rgba(20, 40, 38, 0.16)';
  ctx.fill();
  ctx.restore();

  // Dos caras planas en lugar de un degradado radial: corte toon nítido.
  diamondPath(ctx, cx, cy, size * 0.27);
  ctx.fillStyle = '#f8faf7';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.27);
  ctx.lineTo(cx + size * 0.27, cy);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fillStyle = '#d3ded8';
  ctx.fill();

  diamondPath(ctx, cx, cy, size * 0.27);
  ctx.strokeStyle = 'rgba(24, 56, 52, 0.42)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inscripción interior: rombo pequeño en tonos más oscuros.
  diamondPath(ctx, cx, cy, size * 0.11);
  ctx.strokeStyle = 'rgba(24, 56, 52, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Esquinas recortadas visualmente para reforzar la forma del mosaico.
  ctx.fillStyle = 'rgba(24, 56, 52, 0.10)';
  [[0, 0], [size, 0], [0, size], [size, size]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 12);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();
  });

  return finishTexture(canvas);
}

/**
 * Mapa de relieve en escala de grises correspondiente al mosaico diamantado.
 */
export function createStudBumpMap() {
  const size = 128;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#6f6f6f';
  ctx.lineWidth = 2;
  for (let offset = -size; offset < size * 2; offset += 16) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }

  diamondPath(ctx, cx, cy, size * 0.28);
  ctx.fillStyle = '#dcdcdc';
  ctx.fill();

  diamondPath(ctx, cx, cy, size * 0.11);
  ctx.fillStyle = '#9a9a9a';
  ctx.fill();

  return finishTexture(canvas);
}
