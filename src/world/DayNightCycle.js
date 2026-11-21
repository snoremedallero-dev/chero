import * as THREE from 'three';

/**
 * Sistema de Ciclo Día/Noche para el mundo salvadoreño.
 * Un ciclo completo dura 120 segundos en tiempo real = 1 día completo en juego.
 */
export class DayNightCycle {
  /**
   * @param {THREE.Scene} scene       - Escena principal de Three.js
   * @param {THREE.DirectionalLight} sunLight     - Luz solar direccional
   * @param {THREE.HemisphereLight}  hemiLight    - Luz hemisférica del cielo
   */
  constructor(scene, sunLight, hemiLight) {
    this.scene    = scene;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;

    // Duración total de un ciclo en segundos (120s = 1 día de juego)
    this.cycleDuration = 120;

    // Tiempo acumulado en el ciclo (comienza al amanecer: 25% del día)
    this.timeElapsed = this.cycleDuration * 0.25;

    // Período anterior para detectar cambios y emitir toasts
    this.previousPeriod = '';

    // Callback que se invoca cuando cambia el período del día
    // Recibe (nuevoPeriodo: string)
    this.onPeriodChanged = null;

    // Colores del cielo para cada fase del día
    this._colorDia       = new THREE.Color(0xA9D8CE); // Turquesa pálido
    this._colorAmanecer  = new THREE.Color(0xF2A56B); // Arena encendida
    this._colorAtardecer = new THREE.Color(0xE97451); // Coral
    this._colorNoche     = new THREE.Color(0x12233A); // Azul noche

    // Color temporal para interpolación
    this._tmpColor = new THREE.Color();
  }

  /**
   * Avanza el ciclo día/noche cada frame.
   * @param {number} dt - Delta de tiempo en segundos
   */
  update(dt) {
    // Avanzar el tiempo acumulado
    this.timeElapsed = (this.timeElapsed + dt) % this.cycleDuration;

    // Fracción normalizada del ciclo [0, 1)
    const t = this.timeElapsed / this.cycleDuration;

    // Actualizar posición del sol en arco semicircular
    this._updateSunPosition(t);

    // Actualizar intensidades de luz
    this._updateLightIntensity(t);

    // Actualizar color del cielo
    this._updateSkyColor(t);

    // Detectar cambio de período y disparar callback
    const currentPeriod = this.getTimeOfDay();
    if (currentPeriod !== this.previousPeriod) {
      this.previousPeriod = currentPeriod;
      if (this.onPeriodChanged) {
        this.onPeriodChanged(currentPeriod);
      }
    }
  }

  /**
   * Mueve el sol en un arco de 180° a lo largo del cielo.
   * t=0: horizonte este (amanecer), t=0.5: cénit (mediodía), t=1: horizonte oeste (ocaso)
   * @param {number} t - Fracción del ciclo [0, 1)
   */
  _updateSunPosition(t) {
    // Ángulo en radianes: 0 = este (horizonte), π = oeste (horizonte)
    const angle = t * Math.PI;
    const radius = 100;

    this.sunLight.position.set(
      Math.cos(angle - Math.PI / 2) * radius, // X: de este a oeste
      Math.sin(angle) * radius,               // Y: arco hacia arriba
      35                                       // Z: fijo, ligera inclinación
    );
  }

  /**
   * Ajusta la intensidad del sol y del hemisferio según la hora del día.
   * @param {number} t - Fracción del ciclo [0, 1)
   */
  _updateLightIntensity(t) {
    // Definición de zonas horarias (fracción del ciclo):
    // 0.00 - 0.10 : madrugada/noche → intensidad muy baja
    // 0.10 - 0.20 : amanecer → rampa de subida
    // 0.20 - 0.75 : día pleno → intensidad máxima
    // 0.75 - 0.85 : atardecer → rampa de bajada
    // 0.85 - 1.00 : noche → intensidad muy baja

    let sunIntensity;
    let hemiIntensity;

    if (t < 0.10) {
      // Noche final / madrugada
      sunIntensity  = 0.08;
      hemiIntensity = 0.12;
    } else if (t < 0.20) {
      // Amanecer: interpolación hacia la luz toon de día
      const factor = (t - 0.10) / 0.10;
      sunIntensity  = THREE.MathUtils.lerp(0.08, 1.25, factor);
      hemiIntensity = THREE.MathUtils.lerp(0.12, 0.55, factor);
    } else if (t < 0.75) {
      // Día pleno
      sunIntensity  = 1.25;
      hemiIntensity = 0.55;
    } else if (t < 0.85) {
      // Atardecer: interpolación 1.25 → 0.55
      const factor = (t - 0.75) / 0.10;
      sunIntensity  = THREE.MathUtils.lerp(1.25, 0.55, factor);
      hemiIntensity = THREE.MathUtils.lerp(0.55, 0.25, factor);
    } else {
      // Noche: intensidad mínima
      sunIntensity  = 0.08;
      hemiIntensity = 0.12;
    }

    this.sunLight.intensity  = sunIntensity;
    this.hemiLight.intensity = hemiIntensity;
  }

  /**
   * Cambia el color del cielo (scene.background) según la hora del día.
   * @param {number} t - Fracción del ciclo [0, 1)
   */
  _updateSkyColor(t) {
    let skyColor;

    if (t < 0.10) {
      // Noche
      skyColor = this._colorNoche;
    } else if (t < 0.20) {
      // Amanecer: de negro a naranja
      const factor = (t - 0.10) / 0.10;
      this._tmpColor.lerpColors(this._colorNoche, this._colorAmanecer, factor);
      skyColor = this._tmpColor;
    } else if (t < 0.25) {
      // Transición amanecer → día
      const factor = (t - 0.20) / 0.05;
      this._tmpColor.lerpColors(this._colorAmanecer, this._colorDia, factor);
      skyColor = this._tmpColor;
    } else if (t < 0.75) {
      // Día pleno: azul cielo
      skyColor = this._colorDia;
    } else if (t < 0.85) {
      // Atardecer: de azul a naranja
      const factor = (t - 0.75) / 0.10;
      this._tmpColor.lerpColors(this._colorDia, this._colorAtardecer, factor);
      skyColor = this._tmpColor;
    } else if (t < 0.90) {
      // Transición atardecer → noche
      const factor = (t - 0.85) / 0.05;
      this._tmpColor.lerpColors(this._colorAtardecer, this._colorNoche, factor);
      skyColor = this._tmpColor;
    } else {
      // Noche
      skyColor = this._colorNoche;
    }

    // Actualizar el fondo de la escena
    this.scene.background.set(skyColor);

    // Sincronizar color de la niebla con el cielo para coherencia visual
    if (this.scene.fog) {
      this.scene.fog.color.set(skyColor);
    }
  }

  /**
   * Devuelve el período actual del día como cadena legible.
   * @returns {'mañana'|'día'|'tarde'|'noche'}
   */
  getTimeOfDay() {
    const t = this.timeElapsed / this.cycleDuration;

    if (t < 0.10 || t >= 0.90) {
      return 'noche';
    } else if (t < 0.25) {
      return 'mañana'; // amanecer / mañana temprana
    } else if (t < 0.70) {
      return 'día';
    } else {
      return 'tarde'; // atardecer / tarde
    }
  }

  /**
   * Indica si es de día (suficiente luz para ver con claridad).
   * @returns {boolean}
   */
  isDaytime() {
    const period = this.getTimeOfDay();
    return period === 'día' || period === 'mañana';
  }
}
