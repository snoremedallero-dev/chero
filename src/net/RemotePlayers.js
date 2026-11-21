import * as THREE from 'three';
import { AvatarR6 } from '../character/AvatarR6.js';
import { getSkin } from '../data/SkinCatalog.js';
import { sanitizePlayerState } from './protocol.js';

const BODY_TO_AVATAR_Y = 2.1;

/** Interpolación angular por el camino corto, útil para giros del avatar. */
export function lerpAngle(current, target, t) {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return target || 0;
  let diff = target - current;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * Math.min(1, Math.max(0, t));
}

/**
 * Mantiene un AvatarR6 por jugador remoto y suaviza sus transformaciones entre
 * paquetes. No crea cuerpos físicos: solo representa a los otros jugadores.
 */
export class RemotePlayers {
  constructor(scene, { avatarFactory = () => new AvatarR6() } = {}) {
    this.scene = scene;
    this.avatarFactory = avatarFactory;
    this.players = new Map();
  }

  applyState(id, rawState) {
    const state = sanitizePlayerState(rawState);
    if (!state || typeof id !== 'string') return;

    let entry = this.players.get(id);
    if (!entry) {
      const avatar = this.avatarFactory();
      avatar.group.position.set(
        state.position.x,
        state.position.y - BODY_TO_AVATAR_Y,
        state.position.z
      );
      avatar.group.rotation.y = state.rotationY;
      this.scene.add(avatar.group);
      entry = {
        avatar,
        target: new THREE.Vector3(
          state.position.x,
          state.position.y - BODY_TO_AVATAR_Y,
          state.position.z
        ),
        targetYaw: state.rotationY,
        moving: false,
        grounded: true,
        speed: 1,
        skin: null
      };
      this.players.set(id, entry);
    }

    entry.target.set(
      state.position.x,
      state.position.y - BODY_TO_AVATAR_Y,
      state.position.z
    );
    entry.targetYaw = state.rotationY;
    entry.moving = state.moving;
    entry.grounded = state.grounded;
    entry.speed = state.speed;

    if (state.skin && state.skin !== entry.skin) {
      const skin = getSkin(state.skin);
      if (skin) entry.avatar.setSkin(skin);
      entry.skin = state.skin;
    }
  }

  remove(id) {
    const entry = this.players.get(id);
    if (!entry) return false;
    this.scene.remove(entry.avatar.group);
    entry.avatar.materials?.face?.map?.dispose?.();
    entry.avatar.group.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose?.());
    });
    this.players.delete(id);
    return true;
  }

  clear() {
    [...this.players.keys()].forEach((id) => this.remove(id));
  }

  update(dt) {
    const factor = 1 - Math.exp(-Math.max(0, dt) * 12);
    this.players.forEach((entry) => {
      entry.avatar.group.position.lerp(entry.target, factor);
      entry.avatar.group.rotation.y = lerpAngle(
        entry.avatar.group.rotation.y,
        entry.targetYaw,
        factor
      );
      entry.avatar.updateAnimation(dt, entry.moving, entry.grounded, entry.speed);
    });
  }
}
