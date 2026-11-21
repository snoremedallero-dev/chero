import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/**
 * Gestor del sistema de Recoger, Llevar, Soltar, Lanzar y Comer objetos en el mundo.
 * Maneja objetos físicos interactivos como Pupusas, Cocos, Tablas de Surf y Reliquias Mayas.
 */
export class PickupManager {
  constructor(scene, physicsWorld, audioManager) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.audioManager = audioManager;

    this.items = [];
    this.heldItem = null;
    this.interactionReach = 4.5; // Distancia máxima en studs para recoger

    this.onItemPickup = null;
    this.onItemDrop = null;
    this.onItemUsed = null;
  }

  /**
   * Registra un objeto interactivo que puede ser recogido del suelo o superficies.
   */
  registerItem(mesh, body, options = {}) {
    const itemData = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      mesh: mesh,
      body: body,
      name: options.name || 'Objeto',
      icon: options.icon || '◇',
      isEdible: Boolean(options.isEdible),
      healAmount: options.healAmount || 40,
      originalScale: mesh.scale.clone(),
      isHeld: false
    };

    this.items.push(itemData);
    return itemData;
  }

  /**
   * Encuentra el objeto interactivo más cercano a la posición del jugador.
   */
  getClosestItem(playerPos) {
    if (this.heldItem) return null;

    let closest = null;
    let minDistance = this.interactionReach;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (item.isHeld) continue;

      const dist = playerPos.distanceTo(item.mesh.position);
      if (dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    }

    return closest;
  }

  /**
   * Recoge el objeto más cercano o suelta el que ya tiene en las manos.
   * @param {THREE.Vector3} playerPos Posición del cuerpo del jugador
   * @param {THREE.Group} avatarTorso Malla del torso del avatar
   * @param {THREE.Vector3} forward Dirección hacia donde mira el jugador
   */
  togglePickup(playerPos, avatarTorso, forward) {
    if (this.heldItem) {
      // Si ya tiene un objeto en manos -> Soltarlo / Lanzarlo
      this.dropHeldItem(playerPos, forward);
    } else {
      // Si no tiene nada -> Recoger el más cercano
      const item = this.getClosestItem(playerPos);
      if (item) {
        this.pickupItem(item, avatarTorso);
      }
    }
  }

  /**
   * Toma un objeto específico y lo ancla a las manos del avatar.
   */
  pickupItem(item, avatarTorso) {
    this.heldItem = item;
    item.isHeld = true;

    // Desactivar temporalmente del mundo físico mientras está cargado
    if (item.body) {
      this.physicsWorld.removeBody(item.body);
    }

    // Anclar la malla visual al frente del torso del avatar
    this.scene.remove(item.mesh);
    avatarTorso.add(item.mesh);

    // Posición ergonómica sostenido con ambas manos frente al pecho
    item.mesh.position.set(0, -0.2, 1.2);
    item.mesh.rotation.set(0, 0, 0);

    // Sonido
    if (this.audioManager) {
      this.audioManager.playPickup();
    }

    if (this.onItemPickup) {
      this.onItemPickup(item);
    }
  }

  /**
   * Suelta o lanza hacia adelante el objeto cargado.
   */
  dropHeldItem(playerPos, forward) {
    if (!this.heldItem) return;

    const item = this.heldItem;
    item.isHeld = false;
    this.heldItem = null;

    // Desanclar del torso y reinsertar en la escena principal
    item.mesh.parent.remove(item.mesh);
    this.scene.add(item.mesh);

    // Ubicar 2.5 studs al frente del jugador
    const dropPos = playerPos.clone().add(forward.clone().multiplyScalar(2.2)).add(new THREE.Vector3(0, 0.5, 0));
    item.mesh.position.copy(dropPos);

    // Reactivar cuerpo físico dinámico con masa real para que ruede o caiga
    if (item.body) {
      item.body.mass = 4;
      item.body.updateMassProperties();
      item.body.position.set(dropPos.x, dropPos.y, dropPos.z);

      // Impulso hacia adelante (lanzamiento)
      item.body.velocity.set(
        forward.x * 7,
        3.5, // Leve arco hacia arriba
        forward.z * 7
      );
      item.body.angularVelocity.set(Math.random() * 4, Math.random() * 4, 0);

      this.physicsWorld.addBody(item.body);
    }

    if (this.audioManager) {
      this.audioManager.playDrop();
    }

    if (this.onItemDrop) {
      this.onItemDrop(item);
    }
  }

  /**
   * Usa o come el objeto en manos (ejemplo: comerse la pupusa para curarse).
   */
  useHeldItem(playerController) {
    if (!this.heldItem) return false;

    const item = this.heldItem;

    if (item.isEdible) {
      // Comer alimento: Restaurar salud
      playerController.health = Math.min(playerController.maxHealth, playerController.health + item.healAmount);
      if (playerController.onHealthChanged) {
        playerController.onHealthChanged(playerController.health, playerController.maxHealth);
      }

      if (this.audioManager) {
        this.audioManager.playEat();
      }

      // Desanclar y destruir el alimento consumido
      if (item.mesh.parent) {
        item.mesh.parent.remove(item.mesh);
      }
      this.items = this.items.filter(i => i !== item);
      this.heldItem = null;

      if (this.onItemUsed) {
        this.onItemUsed(item, 'ate');
      }

      return true;
    }

    return false;
  }

  /**
   * Sincroniza la posición visual de los objetos con sus cuerpos físicos en el suelo.
   */
  update() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      if (!item.isHeld && item.body) {
        item.mesh.position.copy(item.body.position);
        item.mesh.quaternion.copy(item.body.quaternion);
      }
    }
  }
}
