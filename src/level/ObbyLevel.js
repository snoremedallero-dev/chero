import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture, createStudBumpMap } from '../core/StudTexture.js';

/**
 * Generador y gestor del nivel "Obby" (pista de obstáculos).
 * Incluye plataformas elevadas, lava mortal (kill bricks), puntos de control (checkpoints)
 * y una plataforma de meta con trofeo de oro.
 */
export class ObbyLevel {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;

    this.group = new THREE.Group();
    this.checkpoints = [];
    this.lavaBlocks = [];
    this.goalData = null;

    this.studTex = createStudTexture();
    this.studBump = createStudBumpMap();

    this.buildLevel();
    this.scene.add(this.group);
  }

  /**
   * Crea una plataforma sólida con textura de studs y su respectivo cuerpo físico en Cannon-es.
   */
  createPlatform(pos, size, colorHex) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const color = new THREE.Color(colorHex);

    const topMat = createToonMaterial({
      color: color,
      map: this.studTex,
      bumpMap: this.studBump,
      bumpScale: 0.08,
      roughness: 0.5
    });

    const sideMat = createToonMaterial({
      color: color,
      roughness: 0.65
    });

    const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // Físicas estáticas
    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    const body = new CANNON.Body({
      mass: 0,
      material: this.physicsWorld.blockMaterial
    });
    body.addShape(new CANNON.Box(halfExtents));
    body.position.set(pos.x, pos.y, pos.z);
    this.physicsWorld.addBody(body);

    return { mesh, body };
  }

  /**
   * Crea un bloque de Lava / Kill Brick con brillo neón emisivo y colisión.
   */
  createLavaBlock(pos, size) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);

    // Material coral encendido para zonas mortales
    const lavaMat = createToonMaterial({
      color: 0xff2200,
      emissive: 0xff1100,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    const mesh = new THREE.Mesh(geometry, lavaMat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.group.add(mesh);

    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    const body = new CANNON.Body({
      mass: 0,
      material: this.physicsWorld.blockMaterial
    });
    body.addShape(new CANNON.Box(halfExtents));
    body.position.set(pos.x, pos.y, pos.z);
    this.physicsWorld.addBody(body);

    const lavaData = {
      mesh,
      body,
      min: new THREE.Vector3(pos.x - size.x / 2 - 0.2, pos.y - size.y / 2 - 0.2, pos.z - size.z / 2 - 0.2),
      max: new THREE.Vector3(pos.x + size.x / 2 + 0.2, pos.y + size.y / 2 + 0.6, pos.z + size.z / 2 + 0.2)
    };

    this.lavaBlocks.push(lavaData);
    return lavaData;
  }

  /**
   * Crea un Checkpoint con indicador luminoso (blanco inactivo / verde activo).
   */
  createCheckpoint(index, pos, size = 6) {
    const geometry = new THREE.BoxGeometry(size, 0.3, size);

    const mat = createToonMaterial({
      color: 0xeeeeee,
      emissive: 0x444444,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.copy(pos);
    mesh.receiveShadow = true;
    this.group.add(mesh);

    const cpData = {
      index,
      mesh,
      material: mat,
      spawnPos: new THREE.Vector3(pos.x, pos.y + 2.5, pos.z),
      bounds: new THREE.Box3().setFromObject(mesh),
      activated: false
    };

    this.checkpoints.push(cpData);
    return cpData;
  }

  /**
   * Crea el trofeo dorado de la plataforma final de victoria.
   */
  createTrophy(pos) {
    const trophyGroup = new THREE.Group();
    trophyGroup.position.copy(pos);

    const goldMat = createToonMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x443300,
      emissiveIntensity: 0.25
    });

    // Base del trofeo
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.6, 0.6, 8);
    const baseMesh = new THREE.Mesh(baseGeo, goldMat);
    baseMesh.position.y = 0.3;
    trophyGroup.add(baseMesh);

    // Copa
    const cupGeo = new THREE.CylinderGeometry(1.4, 0.6, 2.0, 8, 1, true);
    const cupMesh = new THREE.Mesh(cupGeo, goldMat);
    cupMesh.position.y = 1.6;
    trophyGroup.add(cupMesh);

    // Estrella superior
    const starGeo = new THREE.OctahedronGeometry(0.8, 0);
    const starMesh = new THREE.Mesh(starGeo, goldMat);
    starMesh.position.y = 3.2;
    trophyGroup.add(starMesh);

    this.trophyMesh = trophyGroup;
    this.group.add(trophyGroup);
  }

  /**
   * Construye las etapas y obstáculos de la pista Obby.
   */
  buildLevel() {
    // -------------------------------------------------------------
    // ETAPA 1: Rampa de subida y Plataforma de Inicio del Obby
    // -------------------------------------------------------------
    // Peldaños de acceso desde el Baseplate (X = 14 a 22)
    for (let i = 0; i < 4; i++) {
      this.createPlatform(
        new THREE.Vector3(14 + i * 2.5, 1 + i * 1.5, 0),
        new THREE.Vector3(2.5, 1, 6),
        0x0d69ac
      );
    }

    // Isla de inicio (X = 26, Y = 7, Z = 0)
    this.createPlatform(new THREE.Vector3(26, 7, 0), new THREE.Vector3(10, 2, 10), 0x222228);
    this.createCheckpoint(1, new THREE.Vector3(26, 8.15, 0));

    // -------------------------------------------------------------
    // ETAPA 2: Plataformas flotantes (Stepping Stones)
    // -------------------------------------------------------------
    const stepColors = [0x00bcd4, 0xe91e63, 0xffeb3b, 0xff9800, 0x4caf50];
    const stepOffsets = [
      { x: 36, y: 7.5, z: 0 },
      { x: 42, y: 8.5, z: 3.5 },
      { x: 49, y: 9.5, z: -2.5 },
      { x: 56, y: 10.5, z: 2.5 },
      { x: 63, y: 11.5, z: 0 }
    ];

    stepOffsets.forEach((pos, i) => {
      this.createPlatform(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        new THREE.Vector3(3.2, 1.0, 3.2),
        stepColors[i]
      );
    });

    // -------------------------------------------------------------
    // ETAPA 3: Zona de Lava y Barras Mortales (Kill Bricks)
    // -------------------------------------------------------------
    // Isla intermedia con Checkpoint 2 (X = 72, Y = 12)
    this.createPlatform(new THREE.Vector3(72, 12, 0), new THREE.Vector3(10, 2, 10), 0x222228);
    this.createCheckpoint(2, new THREE.Vector3(72, 13.15, 0));

    // Pasarela de lava con barras rojas neón a saltar
    // Suelo de la pasarela
    this.createPlatform(new THREE.Vector3(90, 12, 0), new THREE.Vector3(22, 2, 6), 0x33333e);

    // 3 Barras de lava transversales con espacio para saltar
    this.createLavaBlock(new THREE.Vector3(83, 13.6, 0), new THREE.Vector3(1.4, 1.4, 6));
    this.createLavaBlock(new THREE.Vector3(90, 13.6, 0), new THREE.Vector3(1.4, 1.4, 6));
    this.createLavaBlock(new THREE.Vector3(97, 13.6, 0), new THREE.Vector3(1.4, 1.4, 6));

    // -------------------------------------------------------------
    // ETAPA 4: Viga Estrecha de Equilibrio (Balance Beam)
    // -------------------------------------------------------------
    // Isla con Checkpoint 3 (X = 106, Y = 12)
    this.createPlatform(new THREE.Vector3(106, 12, 0), new THREE.Vector3(8, 2, 8), 0x222228);
    this.createCheckpoint(3, new THREE.Vector3(106, 13.15, 0));

    // Viga muy delgada (ancho 1.2 studs, longitud 24 studs) suspendida en el aire
    this.createPlatform(new THREE.Vector3(122, 12.5, 0), new THREE.Vector3(22, 1.0, 1.4), 0xf5cd30);

    // -------------------------------------------------------------
    // ETAPA 5: Isla de Meta y Victoria con Trofeo de Oro
    // -------------------------------------------------------------
    // Gran plataforma final circular/cuadrada (X = 142, Y = 13)
    this.createPlatform(new THREE.Vector3(142, 13, 0), new THREE.Vector3(14, 2, 14), 0x4b974b);

    // Pad de Victoria dorado
    const goalPadGeo = new THREE.BoxGeometry(8, 0.4, 8);
    const goalPadMat = createToonMaterial({
      color: 0xE9A23B,
      emissive: 0xC4762B,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const goalPadMesh = new THREE.Mesh(goalPadGeo, goalPadMat);
    goalPadMesh.position.set(142, 14.2, 0);
    this.group.add(goalPadMesh);

    this.goalData = {
      mesh: goalPadMesh,
      pos: new THREE.Vector3(142, 14.2, 0),
      radius: 4.5
    };

    // Crear trofeo giratorio
    this.createTrophy(new THREE.Vector3(142, 14.4, 0));
  }

  /**
   * Comprueba interacciones del jugador con la lava, checkpoints y meta.
   * @param {THREE.Vector3} playerPos Posición del cuerpo del jugador
   * @returns {Object} Eventos detectados
   */
  checkPlayer(playerPos) {
    const events = {
      lavaHit: false,
      checkpointActivated: null,
      goalReached: false
    };

    // 1. Detección de contacto con Lava
    for (let i = 0; i < this.lavaBlocks.length; i++) {
      const lava = this.lavaBlocks[i];
      if (
        playerPos.x >= lava.min.x && playerPos.x <= lava.max.x &&
        playerPos.y >= lava.min.y && playerPos.y <= lava.max.y &&
        playerPos.z >= lava.min.z && playerPos.z <= lava.max.z
      ) {
        events.lavaHit = true;
        break;
      }
    }

    // 2. Detección de Checkpoints
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const dist = new THREE.Vector2(playerPos.x - cp.mesh.position.x, playerPos.z - cp.mesh.position.z).length();

      // Si el jugador está sobre el pad
      if (dist < 3.2 && Math.abs(playerPos.y - cp.mesh.position.y) < 2.5) {
        if (!cp.activated) {
          cp.activated = true;
          // Cambiar color a verde agua de Chero World
          cp.material.color.setHex(0x18A999);
          cp.material.emissive.setHex(0x0E7C7B);
          cp.material.emissiveIntensity = 0.8;
          events.checkpointActivated = cp;
        }
      }
    }

    // 3. Detección de Meta final
    if (this.goalData) {
      const distToGoal = new THREE.Vector2(playerPos.x - this.goalData.pos.x, playerPos.z - this.goalData.pos.z).length();
      if (distToGoal < this.goalData.radius && Math.abs(playerPos.y - this.goalData.pos.y) < 3.0) {
        events.goalReached = true;
      }
    }

    return events;
  }

  /**
   * Animación continua de elementos del nivel (rotación del trofeo).
   */
  update(dt) {
    if (this.trophyMesh) {
      this.trophyMesh.rotation.y += dt * 1.5;
    }
  }
}
