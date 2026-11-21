/**
 * Mini-mapa de Chero World: brújula octogonal con trama, marcadores
 * diamantados y puntero direccional. Mantiene la API existente
 * `update(playerPos, currentZone)` y acepta un tercer argumento opcional con
 * el ángulo de la cámara para orientar la flecha del jugador.
 */
export class MiniMap {
  constructor() {
    this.size = 132;
    this.viewRadius = 200;

    this.landmarks = [
      { name: 'Parque',   x:    0, z:  10, color: '#18A999', shape: 'diamond' },
      { name: 'Volcán',   x:  130, z:   0, color: '#F26A4B', shape: 'triangle' },
      { name: 'Playa',    x:    0, z: 140, color: '#5FA8D3', shape: 'square' },
      { name: 'Tazumal',  x: -120, z:   0, color: '#E9A23B', shape: 'hex' },
      { name: 'Pupusería',x:  -26, z:  18, color: '#D7B98E', shape: 'diamond' },
      { name: 'Obby',     x:   26, z:   0, color: '#9C86C7', shape: 'triangle' }
    ];

    this._createCanvas();
  }

  _createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'minimap-canvas';
    this.canvas.width = this.size;
    this.canvas.height = this.size;

    Object.assign(this.canvas.style, {
      position: 'absolute',
      bottom: '70px',
      right: '12px',
      width: `${this.size}px`,
      height: `${this.size}px`,
      zIndex: '25',
      pointerEvents: 'none'
    });

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  _worldToCanvas(worldX, worldZ, playerX, playerZ) {
    const halfSize = this.size / 2;
    const scale = halfSize / this.viewRadius;
    return {
      cx: halfSize + (worldX - playerX) * scale,
      cy: halfSize + (worldZ - playerZ) * scale
    };
  }

  _octagonPath(ctx, cx, cy, radius) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI / 8 + i * Math.PI / 4;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  _markerPath(ctx, cx, cy, shape) {
    const r = 5;
    ctx.beginPath();
    if (shape === 'triangle') {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r * 0.8);
      ctx.lineTo(cx - r, cy + r * 0.8);
      ctx.closePath();
    } else if (shape === 'square') {
      ctx.rect(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
    } else if (shape === 'hex') {
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
    }
  }

  update(playerPos, currentZone, heading = 0) {
    const ctx = this.ctx;
    const half = this.size / 2;

    ctx.clearRect(0, 0, this.size, this.size);
    ctx.save();
    this._octagonPath(ctx, half, half, half - 1);
    ctx.clip();

    // Fondo y trama de navegación.
    ctx.fillStyle = '#0C2224';
    ctx.fillRect(0, 0, this.size, this.size);

    ctx.strokeStyle = '#17393A';
    ctx.lineWidth = 1;
    for (let p = 1; p < 4; p++) {
      const offset = (this.size / 4) * p;
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, this.size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(this.size, offset);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0E7C7B';
    ctx.beginPath();
    ctx.arc(half, half, half * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    // Puntos cardinales.
    ctx.font = '700 8px "Avenir Next", "Segoe UI", sans-serif';
    ctx.fillStyle = '#E9A23B';
    ctx.textAlign = 'center';
    ctx.fillText('N', half, 13);
    ctx.fillText('S', half, this.size - 26);
    ctx.fillText('E', this.size - 11, half + 3);
    ctx.fillText('O', 11, half + 3);

    // Puntos de interés.
    for (const lm of this.landmarks) {
      const { cx, cy } = this._worldToCanvas(lm.x, lm.z, playerPos.x, playerPos.z);
      const dist = Math.hypot(cx - half, cy - half);
      if (dist > half - 10) continue;

      this._markerPath(ctx, cx, cy, lm.shape);
      ctx.fillStyle = lm.color;
      ctx.fill();
      ctx.strokeStyle = '#F6E9CF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '700 7px "Avenir Next", "Segoe UI", sans-serif';
      ctx.fillStyle = '#F6E9CF';
      ctx.fillText(lm.name, cx, cy - 9);
    }

    // Puntero del jugador, orientado según la cámara.
    const forwardX = -Math.sin(heading);
    const forwardZ = -Math.cos(heading);
    const rotation = Math.atan2(forwardZ, forwardX) + Math.PI / 2;
    ctx.save();
    ctx.translate(half, half);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fillStyle = '#F6E9CF';
    ctx.fill();
    ctx.strokeStyle = '#0E7C7B';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Cinta de zona actual.
    if (currentZone && currentZone.name) {
      ctx.fillStyle = '#08181A';
      ctx.beginPath();
      ctx.moveTo(14, this.size - 24);
      ctx.lineTo(this.size - 14, this.size - 24);
      ctx.lineTo(this.size - 8, this.size - 4);
      ctx.lineTo(8, this.size - 4);
      ctx.closePath();
      ctx.fill();

      ctx.font = '700 8px "Avenir Next", "Segoe UI", sans-serif';
      ctx.fillStyle = '#E9A23B';
      ctx.fillText(currentZone.name, half, this.size - 11, this.size - 28);
    }

    ctx.restore();

    // Doble borde octogonal: verde agua + ámbar interior.
    this._octagonPath(ctx, half, half, half - 1);
    ctx.strokeStyle = '#18A999';
    ctx.lineWidth = 3;
    ctx.stroke();
    this._octagonPath(ctx, half, half, half - 5);
    ctx.strokeStyle = '#E9A23B';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
