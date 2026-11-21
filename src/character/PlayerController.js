import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { AvatarR6 } from './AvatarR6.js';
import { Stamina } from './Stamina.js';

/**
 * Controlador de movimiento del jugador multi-dispositivo con físicas de Cannon-es.
 * Soporta simultáneamente teclado (WASD/flechas) y controles táctiles (Joystick y botón de salto).
 */
export class PlayerController {
  constructor(physicsWorld, cameraController, touchControls = null, audioManager = null, pickupManager = null) {
    this.physicsWorld = physicsWorld;
    this.cameraController = cameraController;
    this.touchControls = touchControls;
    this.audioManager = audioManager;
    this.pickupManager = pickupManager;

    // Parámetros de movimiento
    this.walkSpeed = 16.0;
    this.sprintSpeed = 24.0;
    this.jumpForce = 15.5;
    this.isGrounded = false;

    // Sistema de energía / carrera
    this.staminaSystem = new Stamina();
    this.isSprinting = false;

    // Estadísticas de distancia recorrida (en unidades del mundo)
    this.distanceTraveled = 0;
    this.lastTrackedPosition = new THREE.Vector3(0, 4.0, 10);

    // Sistema de salud y checkpoints
    this.maxHealth = 100;
    this.health = 100;
    // Posición inicial de spawn frente al kiosco del Parque de Santa Ana
    this.checkpointPosition = new THREE.Vector3(0, 4.0, 10);
    this.isInvulnerable = false;

    // Callbacks para eventos de juego
    this.onHealthChanged = null;
    this.onDeath = null;

    // Estado de teclas del teclado
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false
    };

    // Crear avatar visual R6
    this.avatar = new AvatarR6();

    // Crear cuerpo físico en Cannon-es
    this.initPhysicsBody();

    // Inicializar escuchadores de teclado
    this.initInput();
  }

  /** Energía actual (compatibilidad con código que lee `player.stamina`). */
  get stamina() {
    return this.staminaSystem.current;
  }

  get maxStamina() {
    return this.staminaSystem.max;
  }

  /** Reinicia la referencia de distancia tras un teletransporte. */
  resetDistanceAnchor() {
    this.lastTrackedPosition.copy(this.body.position);
  }

  initPhysicsBody() {
    const halfExtents = new CANNON.Vec3(0.9, 1.8, 0.5);
    const boxShape = new CANNON.Box(halfExtents);
    const sphereShape = new CANNON.Sphere(0.4);

    this.body = new CANNON.Body({
      mass: 60,
      material: this.physicsWorld.playerMaterial,
      fixedRotation: true
    });

    this.body.addShape(boxShape, new CANNON.Vec3(0, 0.2, 0));
    this.body.addShape(sphereShape, new CANNON.Vec3(0, -1.7, 0));

    this.body.position.set(0, 4.0, 10);

    // CRÍTICO: Deshabilitar sleep en el cuerpo del jugador
    this.body.allowSleep = false;
    this.body.sleepSpeedLimit = -1; // Nunca duerme
    this.body.sleepTimeLimit = 9999;

    // Damping bajo para no frenar el movimiento, angularDamping alto para no rotar
    this.body.linearDamping = 0.05;
    this.body.angularDamping = 1.0;

    this.physicsWorld.addBody(this.body);

    // Detectar contacto con suelo vía eventos de colisión (más fiable que raycast en Cannon-es)
    this._groundContactCount = 0;
    this.body.addEventListener('collide', (e) => {
      const contact = e.contact;
      // Revisar que el contacto tenga una normal apuntando hacia arriba
      const ni = contact.ni;
      // ni apunta del body A al body B; ajustar según cuál es nuestro cuerpo
      let ny = (contact.bi === this.body) ? -ni.y : ni.y;
      if (ny > 0.5) {
        this._groundContactCount++;
        // Resetear después de un frame para evitar quedarse stuck
        setTimeout(() => { this._groundContactCount = Math.max(0, this._groundContactCount - 1); }, 100);
      }
    });
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKey(e.code, false);
    });
  }

  handleKey(code, isPressed) {
    switch (code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = isPressed;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = isPressed;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = isPressed;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = isPressed;
        break;
      case 'Space':
        this.keys.jump = isPressed;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = isPressed;
        break;
      case 'KeyE':
        if (isPressed && this.pickupManager) {
          const forward = this.cameraController.getHorizontalForward();
          this.pickupManager.togglePickup(this.body.position, this.avatar.torsoMesh, forward);
        }
        break;
      case 'KeyF':
        if (isPressed && this.pickupManager) {
          this.pickupManager.useHeldItem(this);
        }
        break;
    }
  }

  checkGrounded() {
    // Método 1: Contador de contactos con superficie inferior (evento collide)
    if (this._groundContactCount > 0) return true;

    // Método 2: Raycast de respaldo — desde el centro hacia abajo
    const from = new CANNON.Vec3(this.body.position.x, this.body.position.y - 1.5, this.body.position.z);
    const to   = new CANNON.Vec3(this.body.position.x, this.body.position.y - 2.4, this.body.position.z);
    const result = new CANNON.RaycastResult();
    this.physicsWorld.world.raycastClosest(from, to, { skipBackfaces: true }, result);
    return result.hasHit && result.body !== this.body;
  }

  setCheckpoint(position) {
    this.checkpointPosition.copy(position);
  }

  takeDamage(amount) {
    if (this.isInvulnerable) return;

    if (this.audioManager) {
      this.audioManager.playHurt();
    }

    this.health = Math.max(0, this.health - amount);
    if (this.onHealthChanged) {
      this.onHealthChanged(this.health, this.maxHealth);
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (this.onDeath) {
      this.onDeath();
    }

    this.health = this.maxHealth;
    if (this.onHealthChanged) {
      this.onHealthChanged(this.health, this.maxHealth);
    }

    this.isInvulnerable = true;
    setTimeout(() => {
      this.isInvulnerable = false;
    }, 600);

    this.body.position.set(
      this.checkpointPosition.x,
      this.checkpointPosition.y,
      this.checkpointPosition.z
    );
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.staminaSystem.reset();
    this.isSprinting = false;
    this.resetDistanceAnchor();
  }

  update(dt) {
    // CRÍTICO: Forzar que el cuerpo esté despierto cada frame para que las velocidades se apliquen
    this.body.wakeUp();

    this.isGrounded = this.checkGrounded();

    const forward = this.cameraController.getHorizontalForward();
    const right = this.cameraController.getHorizontalRight();

    const moveDir = new THREE.Vector3(0, 0, 0);

    // 1. Entrada de Teclado
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    // 2. Entrada de Joystick Táctil (Móvil / Tablet)
    if (this.touchControls) {
      const touchVec = this.touchControls.getMoveVector();
      if (Math.abs(touchVec.x) > 0.05 || Math.abs(touchVec.y) > 0.05) {
        moveDir.addScaledVector(forward, -touchVec.y);
        moveDir.addScaledVector(right, touchVec.x);
      }
    }

    const isMoving = moveDir.lengthSq() > 0.001;

    // 2b. Carrera: Shift en PC o botón táctil, consumiendo energía.
    const wantsSprint = this.keys.sprint || (this.touchControls && this.touchControls.getSprint());
    this.isSprinting = this.staminaSystem.update(dt, Boolean(wantsSprint), isMoving);
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (isMoving) {
      // Normalizar para velocidad diagonal uniforme
      if (moveDir.length() > 1) moveDir.normalize();

      // Aplicar velocidad directamente (control kinematic para X/Z)
      this.body.velocity.x = moveDir.x * currentSpeed;
      this.body.velocity.z = moveDir.z * currentSpeed;

      // Rotar el avatar hacia la dirección de movimiento
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetRotationY - this.avatar.group.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.avatar.group.rotation.y += diff * Math.min(dt * 16, 1.0);
    } else {
      // Desacelerar suavemente cuando no hay entrada
      this.body.velocity.x *= 0.6;
      this.body.velocity.z *= 0.6;
      if (Math.abs(this.body.velocity.x) < 0.1) this.body.velocity.x = 0;
      if (Math.abs(this.body.velocity.z) < 0.1) this.body.velocity.z = 0;
    }

    // 3. Salto (Espacio en teclado O botón táctil de salto en móvil)
    const wantsJump = this.keys.jump || (this.touchControls && this.touchControls.getJump());
    if (wantsJump && this.isGrounded) {
      this.body.velocity.y = this.jumpForce;
      this.isGrounded = false;
      if (this.audioManager) {
        this.audioManager.playJump();
      }
    }

    // 4. Sincronización visual
    this.avatar.group.position.set(
      this.body.position.x,
      this.body.position.y - 2.1,
      this.body.position.z
    );

    this.avatar.updateAnimation(dt, isMoving, this.isGrounded, currentSpeed / this.walkSpeed);

    const lookTarget = new THREE.Vector3(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.cameraController.update(lookTarget, dt);

    // Distancia recorrida: se ignoran saltos de posición (teletransportes).
    let step = Math.hypot(
      this.body.position.x - this.lastTrackedPosition.x,
      this.body.position.z - this.lastTrackedPosition.z
    );
    if (Number.isFinite(step) && step < 5) {
      this.distanceTraveled += step;
    }
    this.lastTrackedPosition.copy(this.body.position);

    // Muerte por caída al vacío
    if (this.body.position.y < -35) {
      this.takeDamage(100);
    }
  }

  respawn() {
    this.body.position.set(
      this.checkpointPosition.x,
      this.checkpointPosition.y,
      this.checkpointPosition.z
    );
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.staminaSystem.reset();
    this.resetDistanceAnchor();
  }
}
