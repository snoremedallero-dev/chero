import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { createOutlineEffect } from './ToonStyle.js';

/**
 * Motor principal de inicialización y bucle de renderizado para Three.js.
 */
export class Engine {
  constructor(canvasId = 'game-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`No se encontró el elemento canvas con id "${canvasId}"`);
    }

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.updateCallbacks = [];

    this.initRenderer();
    this.initCamera();
    this.initEvents();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Sombras duras y sin mapeo tonal: colores planos, sin degradados.
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Un único pase de contorno para todas las mallas de la escena.
    this.outlineEffect = createOutlineEffect(this.renderer, OutlineEffect);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 10, 15);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  /**
   * Registra una función callback que se ejecutará en cada tick del bucle de juego.
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Inicia el bucle continuo de renderizado.
   */
  start() {
    const loop = () => {
      requestAnimationFrame(loop);

      const delta = Math.min(this.clock.getDelta(), 0.1);

      // Ejecutar callbacks registrados (físicas, controles, lógica)
      for (let i = 0; i < this.updateCallbacks.length; i++) {
        this.updateCallbacks[i](delta);
      }

      this.outlineEffect.render(this.scene, this.camera);
    };

    loop();
  }
}
