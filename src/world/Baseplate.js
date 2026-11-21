import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture, createStudBumpMap } from '../core/StudTexture.js';

/**
 * Representa la plataforma base de Chero World con mosaico en la cara superior,
 * punto de aparición ("SpawnLocation") y cuerpo físico colisionador en Cannon-es.
 */
export class Baseplate {
  constructor(physicsWorld, size = 120, height = 2) {
    this.physicsWorld = physicsWorld;
    this.size = size;
    this.height = height;
    this.mesh = null;
    this.spawnMesh = null;
    this.group = new THREE.Group();

    this.createBaseplateMesh();
    this.createSpawnLocation();
    this.createPhysicsBody();
  }

  createBaseplateMesh() {
    const geometry = new THREE.BoxGeometry(this.size, this.height, this.size);

    // Textura y mapa de relieve de studs para la cara superior
    const studTex = createStudTexture();
    studTex.repeat.set(this.size, this.size);

    const studBump = createStudBumpMap();
    studBump.repeat.set(this.size, this.size);

    // Verde tropical propio, menos saturado que el césped clásico.
    const baseGreen = new THREE.Color(0x2F8F76);

    const topMaterial = createToonMaterial({
      color: baseGreen,
      map: studTex,
      bumpMap: studBump,
      bumpScale: 0.08,
      roughness: 0.55,
      metalness: 0.05
    });

    const sideMaterial = createToonMaterial({
      color: 0x246B58,
      roughness: 0.7,
      metalness: 0.05
    });

    const materials = [
      sideMaterial, // +X
      sideMaterial, // -X
      topMaterial,  // +Y (Cara superior con studs)
      sideMaterial, // -Y
      sideMaterial, // +Z
      sideMaterial  // -Z
    ];

    this.mesh = new THREE.Mesh(geometry, materials);
    this.mesh.position.set(0, -this.height / 2, 0);
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);
  }

  createSpawnLocation() {
    const spawnSize = 8;
    const spawnHeight = 0.2;
    const geometry = new THREE.BoxGeometry(spawnSize, spawnHeight, spawnSize);

    // Textura procedimental para el decal de SpawnLocation
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fondo pizarra y marco de mosaico.
    ctx.fillStyle = '#17393A';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#E9A23B';
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);

    // Brújula de aparición: rombo concéntrico con aguja coral.
    const cx = 128;
    const cy = 128;
    ctx.fillStyle = '#18A999';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 76);
    ctx.lineTo(cx + 76, cy);
    ctx.lineTo(cx, cy + 76);
    ctx.lineTo(cx - 76, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F6E9CF';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 46);
    ctx.lineTo(cx + 46, cy);
    ctx.lineTo(cx, cy + 46);
    ctx.lineTo(cx - 46, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F26A4B';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 38);
    ctx.lineTo(cx + 14, cy);
    ctx.lineTo(cx, cy + 38);
    ctx.lineTo(cx - 14, cy);
    ctx.closePath();
    ctx.fill();

    const spawnTex = new THREE.CanvasTexture(canvas);

    const topMat = createToonMaterial({
      map: spawnTex,
      roughness: 0.4
    });
    const sideMat = createToonMaterial({
      color: 0x888888,
      roughness: 0.6
    });

    const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    this.spawnMesh = new THREE.Mesh(geometry, materials);
    this.spawnMesh.position.set(0, spawnHeight / 2, 0);
    this.spawnMesh.receiveShadow = true;
    this.spawnMesh.castShadow = true;

    this.group.add(this.spawnMesh);
  }

  createPhysicsBody() {
    if (!this.physicsWorld) return;

    // Colisionador estático (masa 0 = objeto anclado) para el Baseplate
    const halfExtents = new CANNON.Vec3(this.size / 2, this.height / 2, this.size / 2);
    const shape = new CANNON.Box(halfExtents);

    this.body = new CANNON.Body({
      mass: 0, // Inmóvil / Anclado
      material: this.physicsWorld.groundMaterial
    });

    this.body.addShape(shape);
    this.body.position.set(0, -this.height / 2, 0);

    this.physicsWorld.addBody(this.body);
  }
}
