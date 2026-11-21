import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture, createStudBumpMap } from '../core/StudTexture.js';

/**
 * Gestor del ciclo de vida de los bloques del mundo (renderizado 3D y colisiones físicas).
 */
export class BlockManager {
  constructor(scene, physicsWorld, audioManager = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.audioManager = audioManager;

    // Almacén de bloques activos
    this.blocks = [];
    this.meshToBlockMap = new Map();

    // Caché de texturas de mosaico reutilizables
    this.studTex = createStudTexture();
    this.studBump = createStudBumpMap();

    // Materiales por color para optimizar memoria
    this.materialCache = new Map();

    // Notificaciones para persistencia / red
    this.onBlockPlaced = null;
    this.onBlockRemoved = null;
  }

  /**
   * Obtiene o genera los materiales para un bloque de un color específico con studs superiores.
   */
  getBlockMaterials(colorHex) {
    if (this.materialCache.has(colorHex)) {
      return this.materialCache.get(colorHex);
    }

    const color = new THREE.Color(colorHex);

    // Cara superior con mosaico tejido propio
    const topMaterial = createToonMaterial({
      color: color,
      map: this.studTex,
      bumpMap: this.studBump,
      bumpScale: 0.08,
      roughness: 0.5,
      metalness: 0.05
    });

    // Caras laterales y fondo lisas
    const sideMaterial = createToonMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.05
    });

    const materials = [
      sideMaterial, // +X
      sideMaterial, // -X
      topMaterial,  // +Y (Studs arriba)
      sideMaterial, // -Y
      sideMaterial, // +Z
      sideMaterial  // -Z
    ];

    this.materialCache.set(colorHex, materials);
    return materials;
  }

  /**
   * Crea y coloca un bloque en las coordenadas especificadas.
   * @param {THREE.Vector3} position Posición centrada del bloque
   * @param {number|string} color Color hexadecimal del bloque
   * @param {THREE.Vector3} size Dimensiones del bloque (por defecto 2x2x2 studs)
   * @param {boolean} silent Suprime sonido y callbacks (bloques remotos/restaurados)
   * @param {string|null} id Identificador canónico cuando viene de la red
   * @returns {Object} Datos del bloque creado
   */
  placeBlock(position, color = 0xC05342, size = new THREE.Vector3(2, 2, 2), silent = false, id = null) {
    // 1. Crear malla visual 3D
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const materials = this.getBlockMaterials(color);
    const mesh = new THREE.Mesh(geometry, materials);

    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // 2. Crear cuerpo físico estático (Anchored) en Cannon-es
    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    const shape = new CANNON.Box(halfExtents);
    const body = new CANNON.Body({
      mass: 0, // Inmóvil / Anclado en el espacio
      material: this.physicsWorld.blockMaterial
    });
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    // 3. Registrar en los mundos gráfico y físico
    this.scene.add(mesh);
    this.physicsWorld.addBody(body);

    const blockData = {
      id: id || `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mesh: mesh,
      body: body,
      position: position.clone(),
      size: size.clone(),
      color: color
    };

    this.blocks.push(blockData);
    this.meshToBlockMap.set(mesh, blockData);

    if (!silent && this.audioManager) {
      this.audioManager.playPlace();
    }

    if (!silent && this.onBlockPlaced) {
      this.onBlockPlaced(blockData);
    }

    return blockData;
  }

  /**
   * Elimina un bloque dado su malla 3D.
   * @param {THREE.Mesh} mesh Malla del bloque a destruir
   * @param {boolean} silent Suprime el sonido (para eliminaciones remotas)
   * @returns {boolean} Si fue eliminado exitosamente
   */
  removeBlock(mesh, silent = false) {
    const blockData = this.meshToBlockMap.get(mesh);
    if (!blockData) return false;

    // Remover de Three.js y liberar geometría
    this.scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();

    // Remover del mundo físico de Cannon-es
    this.physicsWorld.removeBody(blockData.body);

    // Limpiar mapas y referencias
    this.meshToBlockMap.delete(mesh);
    const index = this.blocks.indexOf(blockData);
    if (index !== -1) {
      this.blocks.splice(index, 1);
    }

    if (!silent && this.audioManager) {
      this.audioManager.playDestroy();
    }

    if (this.onBlockRemoved) {
      this.onBlockRemoved(blockData);
    }

    return true;
  }

  /**
   * Devuelve todos los objetos visuales colisionables para el raycast de construcción.
   */
  getInteractableMeshes() {
    return this.blocks.map(b => b.mesh);
  }

  /** True si ya existe un bloque con ese id (evita duplicados de red). */
  hasBlock(id) {
    return typeof id === 'string' && this.blocks.some(b => b.id === id);
  }

  /** Elimina un bloque por su identificador canónico. */
  removeBlockById(id, silent = false) {
    const blockData = this.blocks.find(b => b.id === id);
    return blockData ? this.removeBlock(blockData.mesh, silent) : false;
  }

  /**
   * Restaura bloques previamente serializados. Los datos vienen de
   * localStorage, por lo que se validan antes de crear mallas o cuerpos.
   * @param {Array} blocks Lista producida por `serialize()`
   * @returns {number} Cantidad de bloques restaurados
   */
  restore(blocks) {
    if (!Array.isArray(blocks)) return 0;

    const MAX_BLOCKS = 300;
    let restored = 0;

    const sanitizeVector = (value, min, max, fallback) => {
      if (!value || typeof value !== 'object') return fallback;
      const x = Number(value.x);
      const y = Number(value.y);
      const z = Number(value.z);
      if (![x, y, z].every(Number.isFinite)) return null;
      const clamp = (v) => Math.max(min, Math.min(max, v));
      return new THREE.Vector3(clamp(x), clamp(y), clamp(z));
    };

    for (const entry of blocks) {
      if (restored >= MAX_BLOCKS) break;
      if (!entry || typeof entry !== 'object') continue;

      const position = sanitizeVector(entry.position, -500, 500, null);
      const size = sanitizeVector(entry.size, 0.5, 12, null);
      if (!position || !size) continue;

      const color = (typeof entry.color === 'number' || typeof entry.color === 'string')
        ? entry.color
        : 0xC05342;

      const id = typeof entry.id === 'string' && !this.hasBlock(entry.id) ? entry.id : null;
      this.placeBlock(position, color, size, true, id);
      restored++;
    }

    return restored;
  }

  /**
   * Obtiene la lista de bloques en formato serializable (para guardado o red).
   */
  serialize() {
    return this.blocks.map(b => ({
      id: b.id,
      position: { x: b.position.x, y: b.position.y, z: b.position.z },
      size: { x: b.size.x, y: b.size.y, z: b.size.z },
      color: b.color
    }));
  }
}
