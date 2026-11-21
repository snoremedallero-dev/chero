import * as THREE from 'three';
import { DEFAULT_CAMERA_MODE, getCameraMode, nextCameraMode } from './CameraModes.js';

/**
 * Cámara seguidora del jugador. Conserva la API usada por PlayerController,
 * TouchControls, MiniMap y BuildingController, pero el modo (orbital, FPS,
 * cenital...) se toma del catálogo de CameraModes.
 */
export class ThirdPersonCamera {
  constructor(camera, domElement, modeId = DEFAULT_CAMERA_MODE) {
    this.camera = camera;
    this.domElement = domElement;

    // Ángulos esféricos
    this.yaw = 0;       // Rotación horizontal (radianes)
    this.pitch = 0.35;  // Rotación vertical (radianes)
    this.distance = 14; // Distancia en studs al personaje

    this.minDistance = 4;
    this.maxDistance = 28;
    this.minPitch = -0.3; // Límite inferior (para no ver desde abajo del suelo)
    this.maxPitch = 1.3;  // Límite superior

    this.isDragging = false;
    this.targetPosition = new THREE.Vector3(0, 2.5, 0);

    this.mode = getCameraMode(DEFAULT_CAMERA_MODE);
    this.setMode(modeId);
    this.initEvents();
  }

  /**
   * Aplica un modo del catálogo. No altera yaw ni la referencia a la cámara.
   * @returns {object|null} configuración aplicada, o null si el id no existe
   */
  setMode(id) {
    const mode = getCameraMode(id);
    if (!mode) return null;

    this.mode = mode;
    this.distance = mode.distance;
    this.minDistance = mode.minDistance;
    this.maxDistance = mode.maxDistance;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, mode.pitch));

    if (this.camera) {
      this.camera.fov = mode.fov;
      if (typeof this.camera.updateProjectionMatrix === 'function') {
        this.camera.updateProjectionMatrix();
      }
    }

    return mode;
  }

  /** Avanza al siguiente modo del catálogo y devuelve su configuración. */
  cycleMode() {
    return this.setMode(nextCameraMode(this.mode.id));
  }

  initEvents() {
    // 1. Arrastre con clic derecho en escritorio
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Clic derecho
        this.isDragging = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isDragging = false;
      }
    });

    window.addEventListener('mousemove', (e) => {
      // Si está arrastrando con clic derecho o si el puntero está bloqueado
      if (this.isDragging || document.pointerLockElement === this.domElement) {
        const sensitivity = 0.003;
        this.yaw -= e.movementX * sensitivity;
        this.pitch += e.movementY * sensitivity;

        // Limitar la inclinación vertical para no invertir la cámara
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      }
    });

    // 2. Zoom con rueda del ratón
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.01;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + zoomFactor));
    }, { passive: false });

    // Evitar menú contextual con clic derecho
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Obtiene el vector hacia adelante proyectado en el plano horizontal (XZ).
   */
  getHorizontalForward() {
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw)
    );
    return forward.normalize();
  }

  /**
   * Obtiene el vector hacia la derecha proyectado en el plano horizontal (XZ).
   */
  getHorizontalRight() {
    const right = new THREE.Vector3(
      Math.cos(this.yaw),
      0,
      -Math.sin(this.yaw)
    );
    return right.normalize();
  }

  /**
   * Actualiza la posición y orientación de la cámara para seguir al jugador suavemente.
   * @param {THREE.Vector3} targetPoint Punto de mira (centro del torso del jugador)
   * @param {number} dt Delta time
   */
  update(targetPoint, dt) {
    // Interpolación de posición objetivo (suavizado configurable por modo)
    this.targetPosition.lerp(targetPoint, Math.min(dt * this.mode.smoothing, 1.0));

    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);

    if (this.mode.firstPerson) {
      // En FPS la cámara queda en la cabeza y mira según yaw/pitch.
      const eyeY = this.targetPosition.y + this.mode.eyeHeight;
      this.camera.position.set(this.targetPosition.x, eyeY, this.targetPosition.z);
      this.camera.lookAt(
        this.targetPosition.x - Math.sin(this.yaw) * cosPitch,
        eyeY + sinPitch,
        this.targetPosition.z - Math.cos(this.yaw) * cosPitch
      );
      return;
    }

    // Cálculo esférico de posición de cámara
    const x = this.targetPosition.x + Math.sin(this.yaw) * cosPitch * this.distance;
    const y = this.targetPosition.y + sinPitch * this.distance;
    const z = this.targetPosition.z + Math.cos(this.yaw) * cosPitch * this.distance;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.targetPosition.x, this.targetPosition.y + 0.8, this.targetPosition.z);
  }
}
