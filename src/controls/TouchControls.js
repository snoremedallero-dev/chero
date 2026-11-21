/**
 * Sistema de controles táctiles multi-dispositivo (Móvil, Tablet, Pantallas táctiles).
 * Incluye Joystick virtual analógico, botón táctil de salto y rotación de cámara por deslizamiento.
 */
export class TouchControls {
  constructor(cameraController) {
    this.cameraController = cameraController;

    // Estado del joystick
    this.moveVector = { x: 0, y: 0 }; // Normalizado de -1 a 1
    this.isJumping = false;
    this.isSprinting = false;

    // Seguimiento de identificadores de toque para multi-touch independiente
    this.joystickTouchId = null;
    this.cameraTouchId = null;

    this.joystickStartPos = { x: 0, y: 0 };
    this.joystickCurrentPos = { x: 0, y: 0 };
    this.lastCameraTouchPos = { x: 0, y: 0 };

    this.maxJoystickRadius = 50; // Radio máximo en píxeles

    this.initDOM();
    this.initEvents();
  }

  initDOM() {
    // Contenedor principal de controles táctiles (solo visible en pantallas táctiles o móviles)
    this.container = document.createElement('div');
    this.container.id = 'touch-controls-container';
    this.container.innerHTML = `
      <!-- Zona del Joystick Virtual (Izquierda) -->
      <div id="touch-joystick-zone">
        <div id="touch-joystick-base">
          <div id="touch-joystick-knob"></div>
        </div>
      </div>

      <!-- Botones de Acción Táctiles (Derecha) -->
      <div id="touch-action-buttons">
        <button id="touch-interact-btn" class="touch-btn touch-action-btn" aria-label="Recoger o Soltar">
          <span>◇</span>
          <small>RECOGER</small>
        </button>
        <button id="touch-use-btn" class="touch-btn touch-action-btn" aria-label="Usar o Comer" style="display: none;">
          <span>✦</span>
          <small>USAR</small>
        </button>
        <button id="touch-jump-btn" class="touch-btn" aria-label="Saltar">
          <span>▲</span>
          <small>SALTO</small>
        </button>
        <button id="touch-sprint-btn" class="touch-btn touch-sprint-btn" aria-label="Correr">
          <span>≫</span>
          <small>CORRER</small>
        </button>
        <button id="touch-talk-btn" class="touch-btn touch-talk-btn" aria-label="Hablar con leyendas">
          <span>◇</span>
          <small>HABLAR</small>
        </button>
        <button id="touch-skins-btn" class="touch-btn touch-skins-btn" aria-label="Abrir skins">
          <span>◈</span>
          <small>SKINS</small>
        </button>
        <button id="touch-camera-btn" class="touch-btn touch-camera-btn" aria-label="Cambiar cámara">
          <span>▣</span>
          <small>CÁMARA</small>
        </button>
        <button id="touch-fish-btn" class="touch-btn touch-fish-btn" aria-label="Pescar o minar">
          <span>≋</span>
          <small>PESCA</small>
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.joystickBase = document.getElementById('touch-joystick-base');
    this.joystickKnob = document.getElementById('touch-joystick-knob');
    this.jumpButton = document.getElementById('touch-jump-btn');
    this.sprintButton = document.getElementById('touch-sprint-btn');
    this.interactButton = document.getElementById('touch-interact-btn');
    this.useButton = document.getElementById('touch-use-btn');
    this.talkButton = document.getElementById('touch-talk-btn');
    this.skinsButton = document.getElementById('touch-skins-btn');
    this.cameraButton = document.getElementById('touch-camera-btn');
    this.fishButton = document.getElementById('touch-fish-btn');

    this.onInteract = null;
    this.onUse = null;
    this.onTalk = null;
    this.onSkins = null;
    this.onCamera = null;
    this.onFish = null;

    // Detectar si el dispositivo es táctil
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice || window.innerWidth <= 1024) {
      this.container.classList.add('active');
    }
  }

  initEvents() {
    // Escuchar redimensionamiento para activar/desactivar controles táctiles
    window.addEventListener('resize', () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (isTouch || window.innerWidth <= 1024) {
        this.container.classList.add('active');
      }
    });

    // --- GESTIÓN MULTI-TOUCH EN TODA LA PANTALLA ---
    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const halfWidth = window.innerWidth * 0.45;

        // Si el toque es en la mitad izquierda y no hay joystick asignado -> Joystick
        if (touch.clientX < halfWidth && this.joystickTouchId === null) {
          // Si no está pulsando la hotbar
          if (!touch.target.closest('#hotbar-container') && !touch.target.closest('#game-topbar')) {
            this.joystickTouchId = touch.identifier;
            this.joystickStartPos = { x: touch.clientX, y: touch.clientY };
            this.joystickCurrentPos = { x: touch.clientX, y: touch.clientY };

            // Posicionar visualmente la base del joystick donde se tocó
            this.joystickBase.style.display = 'block';
            this.joystickBase.style.left = `${touch.clientX}px`;
            this.joystickBase.style.top = `${touch.clientY}px`;
            this.joystickKnob.style.transform = `translate(-50%, -50%)`;
          }
        }
        // Si el toque es en la mitad derecha y no está tocando botones UI -> Rotación de Cámara
        else if (touch.clientX >= halfWidth && this.cameraTouchId === null) {
          if (!touch.target.closest('#touch-action-buttons') &&
              !touch.target.closest('#hotbar-container') &&
              !touch.target.closest('#game-topbar')) {
            this.cameraTouchId = touch.identifier;
            this.lastCameraTouchPos = { x: touch.clientX, y: touch.clientY };
          }
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // 1. Mover el Joystick
        if (touch.identifier === this.joystickTouchId) {
          const dx = touch.clientX - this.joystickStartPos.x;
          const dy = touch.clientY - this.joystickStartPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, this.maxJoystickRadius);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;

          this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

          // Normalizar el vector de movimiento (-1 a 1)
          this.moveVector.x = knobX / this.maxJoystickRadius;
          this.moveVector.y = knobY / this.maxJoystickRadius;
        }

        // 2. Rotar la Cámara con el dedo derecho
        if (touch.identifier === this.cameraTouchId && this.cameraController) {
          const deltaX = touch.clientX - this.lastCameraTouchPos.x;
          const deltaY = touch.clientY - this.lastCameraTouchPos.y;

          this.lastCameraTouchPos = { x: touch.clientX, y: touch.clientY };

          const touchSensitivity = 0.0055;
          this.cameraController.yaw -= deltaX * touchSensitivity;
          this.cameraController.pitch += deltaY * touchSensitivity;
          this.cameraController.pitch = Math.max(
            this.cameraController.minPitch,
            Math.min(this.cameraController.maxPitch, this.cameraController.pitch)
          );
        }
      }
    }, { passive: false });

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.moveVector = { x: 0, y: 0 };
          this.joystickBase.style.display = 'none';
        }

        if (touch.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // --- BOTONES TÁCTILES DE INTERACCIÓN ---
    if (this.interactButton) {
      this.interactButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onInteract) this.onInteract();
      });
    }

    if (this.useButton) {
      this.useButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onUse) this.onUse();
      });
    }

    // --- BOTONES DE LEYENDAS Y SKINS ---
    if (this.talkButton) {
      this.talkButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onTalk) this.onTalk();
      });
    }

    if (this.skinsButton) {
      this.skinsButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onSkins) this.onSkins();
      });
    }

    // --- BOTONES DE CÁMARA Y PESCA / MINA ---
    if (this.cameraButton) {
      this.cameraButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onCamera) this.onCamera();
      });
    }

    if (this.fishButton) {
      this.fishButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onFish) this.onFish();
      });
    }

    // --- BOTÓN TÁCTIL DE SALTO ---
    if (this.jumpButton) {
      this.jumpButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isJumping = true;
        this.jumpButton.classList.add('pressed');
      });

      const resetJump = (e) => {
        e.preventDefault();
        this.isJumping = false;
        this.jumpButton.classList.remove('pressed');
      };

      this.jumpButton.addEventListener('touchend', resetJump);
      this.jumpButton.addEventListener('touchcancel', resetJump);
    }

    // --- BOTÓN TÁCTIL DE CARRERA ---
    if (this.sprintButton) {
      this.sprintButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isSprinting = true;
        this.sprintButton.classList.add('pressed');
      });

      const resetSprint = (e) => {
        e.preventDefault();
        this.isSprinting = false;
        this.sprintButton.classList.remove('pressed');
      };

      this.sprintButton.addEventListener('touchend', resetSprint);
      this.sprintButton.addEventListener('touchcancel', resetSprint);
    }
  }

  /**
   * Obtiene la dirección analógica de movimiento táctil.
   */
  getMoveVector() {
    return this.moveVector;
  }

  /**
   * Comprueba si el botón táctil de salto está pulsado.
   */
  getJump() {
    return this.isJumping;
  }

  /**
   * Comprueba si el botón táctil de carrera está pulsado.
   */
  getSprint() {
    return this.isSprinting;
  }
}
