import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';

/**
 * Avatar humanoide modular de Chero World. Mantiene la estructura R6
 * (cabeza, torso, brazos y piernas con pivotes) y la animación procedimental,
 * pero usa una silueta y paleta propias: explorador con sombrero de palma,
 * chaleco añil y faja coral.
 */
export class AvatarR6 {
  constructor() {
    this.group = new THREE.Group();

    this.colors = {
      head: 0xE8B98C,   // arena cálida
      torso: 0x2E4266,  // añil
      arms: 0xE8B98C,
      legs: 0xB4553C,   // terracota
      hat: 0x1F7A6D,
      sash: 0xF26A4B
    };

    this.walkCycle = 0;
    this.initAvatar();
  }

  createFaceTexture(palette = this.colors) {
    const hex = (value) => `#${value.toString(16).padStart(6, '0')}`;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = hex(palette.head);
    ctx.fillRect(0, 0, 128, 128);

    // Ojos romboidales, distintos de los óvalos clásicos.
    ctx.fillStyle = hex(palette.eyes ?? palette.hat);
    [[42, 52], [86, 52]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 9);
      ctx.lineTo(x - 6, y);
      ctx.closePath();
      ctx.fill();
    });

    // Rasgos faciales laterales en coral.
    ctx.strokeStyle = hex(palette.sash);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    [30, 98].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 72);
      ctx.lineTo(x + (x < 64 ? 6 : -6), 84);
      ctx.stroke();
    });

    // Sonrisa ancha y sencilla.
    ctx.beginPath();
    ctx.arc(64, 76, 20, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6A382B';
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  initAvatar() {
    const plasticMaterial = (color) => createToonMaterial({
      color: color,
      roughness: 0.55,
      metalness: 0.03
    });

    // Referencias centralizadas para poder aplicar skins sin recrear mallas.
    this.materials = {};

    // Torso
    this.materials.torso = plasticMaterial(this.colors.torso);
    this.torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 1.0), this.materials.torso);
    this.torsoMesh.position.set(0, 2.0, 0);
    this.torsoMesh.castShadow = true;
    this.torsoMesh.receiveShadow = true;
    this.group.add(this.torsoMesh);

    // Faja cruzada sobre el pecho.
    this.materials.sash = plasticMaterial(this.colors.sash);
    const sash = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.26, 1.06), this.materials.sash);
    sash.position.set(0, 0.05, 0);
    sash.rotation.z = 0.42;
    sash.castShadow = true;
    this.torsoMesh.add(sash);

    // Cabeza con rostro propio.
    const headFaceTex = this.createFaceTexture();
    const headMatNormal = plasticMaterial(this.colors.head);
    const headMatFace = createToonMaterial({ map: headFaceTex, roughness: 0.55 });
    this.materials.head = headMatNormal;
    this.materials.face = headMatFace;
    const headMaterials = [
      headMatNormal, headMatNormal, headMatNormal, headMatNormal,
      headMatFace, headMatNormal
    ];

    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.25, 1.25), headMaterials);
    this.headMesh.position.set(0, 1.625, 0);
    this.headMesh.castShadow = true;
    this.torsoMesh.add(this.headMesh);
    this.addHat(headMatNormal);

    // Brazos con pivote de hombro.
    this.materials.arms = plasticMaterial(this.colors.arms);
    const armGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-1.5, 0.9, 0);
    this.leftArmMesh = new THREE.Mesh(armGeo, this.materials.arms);
    this.leftArmMesh.position.set(0, -0.9, 0);
    this.leftArmMesh.castShadow = true;
    this.leftArmPivot.add(this.leftArmMesh);
    this.torsoMesh.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(1.5, 0.9, 0);
    this.rightArmMesh = new THREE.Mesh(armGeo, this.materials.arms);
    this.rightArmMesh.position.set(0, -0.9, 0);
    this.rightArmMesh.castShadow = true;
    this.rightArmPivot.add(this.rightArmMesh);
    this.torsoMesh.add(this.rightArmPivot);

    // Piernas con pivote de cadera.
    this.materials.legs = plasticMaterial(this.colors.legs);
    const legGeo = new THREE.BoxGeometry(1.0, 2.0, 1.0);
    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.5, -1.0, 0);
    this.leftLegMesh = new THREE.Mesh(legGeo, this.materials.legs);
    this.leftLegMesh.position.set(0, -1.0, 0);
    this.leftLegMesh.castShadow = true;
    this.leftLegPivot.add(this.leftLegMesh);
    this.torsoMesh.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.5, -1.0, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, this.materials.legs);
    this.rightLegMesh.position.set(0, -1.0, 0);
    this.rightLegMesh.castShadow = true;
    this.rightLegPivot.add(this.rightLegMesh);
    this.torsoMesh.add(this.rightLegPivot);
  }

  /**
   * Sombrero de ala ancha y copa baja, colocado como hijo de la cabeza.
   */
  addHat(headMaterial) {
    const hatMaterial = createToonMaterial({ color: this.colors.hat, roughness: 0.65 });
    const bandMaterial = createToonMaterial({ color: this.colors.sash, roughness: 0.6 });
    this.materials.hat = hatMaterial;
    this.materials.band = bandMaterial;

    const brim = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.7), hatMaterial);
    brim.position.y = 0.66;
    brim.castShadow = true;
    this.headMesh.add(brim);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.38, 1.05), hatMaterial);
    crown.position.y = 0.88;
    crown.castShadow = true;
    this.headMesh.add(crown);

    const band = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.1, 1.08), bandMaterial);
    band.position.y = 0.74;
    this.headMesh.add(band);

    // El material de la cabeza se conserva por si se necesita en el futuro.
    this.headBaseMaterial = headMaterial;
  }

  /**
   * Aplica una skin reciclando los materiales existentes: no se crean ni
   * destruyen mallas, por lo que la animación no se ve afectada.
   * @param {object} skin Entrada del catálogo con `palette`
   * @returns {boolean} false si la skin no es válida
   */
  setSkin(skin) {
    if (!skin || !skin.palette || !this.materials) return false;

    const palette = { ...this.colors, ...skin.palette };
    this.colors = palette;

    this.materials.torso.color.setHex(palette.torso);
    this.materials.sash.color.setHex(palette.sash);
    this.materials.head.color.setHex(palette.head);
    this.materials.arms.color.setHex(palette.arms);
    this.materials.legs.color.setHex(palette.legs);
    this.materials.hat.color.setHex(palette.hat);
    this.materials.band.color.setHex(palette.sash);

    const oldTexture = this.materials.face.map;
    this.materials.face.map = this.createFaceTexture(palette);
    this.materials.face.needsUpdate = true;
    if (oldTexture) oldTexture.dispose();

    return true;
  }

  /**
   * Actualiza la animación procedimental del avatar.
   */
  updateAnimation(dt, isMoving, isGrounded, moveSpeed = 1) {
    if (!isGrounded) {
      const targetArmAngle = -Math.PI * 0.45;
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, targetArmAngle, dt * 10);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, targetArmAngle, dt * 10);
      this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, -0.2, dt * 10);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0.2, dt * 10);

      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, -0.3, dt * 10);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0.2, dt * 10);
      return;
    }

    if (isMoving) {
      this.walkCycle += dt * 11 * Math.min(moveSpeed, 1.6);
      const swing = Math.sin(this.walkCycle);

      this.leftArmPivot.rotation.x = swing * 0.75;
      this.rightArmPivot.rotation.x = -swing * 0.75;
      this.leftArmPivot.rotation.z = 0;
      this.rightArmPivot.rotation.z = 0;

      this.leftLegPivot.rotation.x = -swing * 0.7;
      this.rightLegPivot.rotation.x = swing * 0.7;
      this.torsoMesh.position.y = 2.0 + Math.abs(Math.cos(this.walkCycle)) * 0.12;
    } else {
      this.walkCycle = 0;
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, dt * 8);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, dt * 8);
      this.leftArmPivot.rotation.z = THREE.MathUtils.lerp(this.leftArmPivot.rotation.z, 0, dt * 8);
      this.rightArmPivot.rotation.z = THREE.MathUtils.lerp(this.rightArmPivot.rotation.z, 0, dt * 8);
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, dt * 8);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, dt * 8);
      this.torsoMesh.position.y = THREE.MathUtils.lerp(this.torsoMesh.position.y, 2.0, dt * 8);
    }
  }
}
