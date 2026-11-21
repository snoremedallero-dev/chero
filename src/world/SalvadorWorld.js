import * as THREE from 'three';
import { createToonMaterial } from '../core/ToonStyle.js';
import * as CANNON from 'cannon-es';
import { createStudTexture, createStudBumpMap } from '../core/StudTexture.js';
import { CityProps } from './CityProps.js';

/**
 * Escenarios tropicalizados de El Salvador en Chero World:
 * 1. Parque Central de Santa Ana & Pupusería "El Chivo Feliz" + Microbús Ruta 202.
 * 2. Volcán de Santa Ana (Ilamatepec) con cráter, laguna de azufre y lava volcánica.
 * 3. Playa El Tunco (Surf City): Océano Pacífico, arena, palmeras de coco, ranchos y tablas de surf.
 * 4. Ruinas Mayas de Tazumal: Pirámide ceremonial escalonada y reliquias secretas.
 * 5. Red de carreteras y senderos conectores (Ruta de las Flores).
 */
export class SalvadorWorld {
  constructor(scene, physicsWorld, pickupManager = null) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.pickupManager = pickupManager;

    this.group = new THREE.Group();
    this.studTex = createStudTexture();
    this.studBump = createStudBumpMap();

    // Materiales reutilizables
    this.materials = this.initMaterials();

    // Zonas de ubicación para el HUD
    this.zones = [];
    this.collectibleCoins = [];
    this.lavaHazards = [];

    // Construcción de los 4 grandes escenarios salvadoreños
    this.buildBaseTerrain();
    this.buildCentralPlazaAndPupuseria();
    this.cityProps = new CityProps(this.group);
    this.cityProps.buildAll();
    this.buildSantaAnaVolcano();
    this.buildElTuncoBeach();
    this.buildTazumalPyramid();
    this.buildConnectingRoads();
    this.spawnSalvadoranCoins();

    this.scene.add(this.group);
  }

  initMaterials() {
    const makeStudMaterial = (colorHex, roughness = 0.5) => {
      const col = new THREE.Color(colorHex);
      const top = createToonMaterial({
        color: col,
        map: this.studTex,
        bumpMap: this.studBump,
        bumpScale: 0.08,
        roughness: roughness
      });
      const side = createToonMaterial({ color: col, roughness: roughness + 0.1 });
      return [side, side, top, side, side, side];
    };

    return {
      grass: makeStudMaterial(0x2F8F76),
      sand: makeStudMaterial(0xe8c872, 0.7),
      volcanic: makeStudMaterial(0x2d2b2a, 0.8),
      stone: makeStudMaterial(0x6e6e72, 0.6),
      ancientStone: makeStudMaterial(0x5c584f, 0.75),
      asphalt: makeStudMaterial(0x222226, 0.85),
      wood: createToonMaterial({ color: 0x8a5229, roughness: 0.7 }),
      thatch: createToonMaterial({ color: 0xa88434, roughness: 0.9 }),
      palmLeaves: createToonMaterial({ color: 0x228b22, roughness: 0.5 }),
      volcanoLava: createToonMaterial({
        color: 0xff3300,
        emissive: 0xff2200,
        emissiveIntensity: 0.9,
        roughness: 0.2
      }),
      sulfurLagoon: createToonMaterial({
        color: 0x1ad1b5,
        emissive: 0x0fa892,
        emissiveIntensity: 0.45,
        roughness: 0.1,
        metalness: 0.2
      }),
      oceanWater: createToonMaterial({
        color: 0x1a8fd1,
        roughness: 0.1,
        metalness: 0.15,
        transparent: true,
        opacity: 0.85
      }),
      busWhite: createToonMaterial({ color: 0xf5f5f5, roughness: 0.3 }),
      busBlue: createToonMaterial({ color: 0x0055b3, roughness: 0.4 }),
      busRed: createToonMaterial({ color: 0xd62828, roughness: 0.4 }),
      goldCoin: createToonMaterial({
        color: 0xE9A23B,
        metalness: 0.7,
        roughness: 0.25,
        emissive: 0x8A5B2E,
        emissiveIntensity: 0.3
      })
    };
  }

  /**
   * Helper para generar partes físicas y visuales en una sola llamada.
   */
  addPart(pos, size, materials, mass = 0) {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mesh = new THREE.Mesh(geo, materials);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    if (this.physicsWorld) {
      const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
      const body = new CANNON.Body({
        mass: mass,
        material: this.physicsWorld.blockMaterial
      });
      body.addShape(new CANNON.Box(halfExtents));
      body.position.set(pos.x, pos.y, pos.z);
      this.physicsWorld.addBody(body);
      return { mesh, body };
    }

    return { mesh };
  }

  /**
   * 1. TERRENO BASE EXPANDIDO DE EL SALVADOR
   */
  buildBaseTerrain() {
    // Terreno central verde fértil (Santa Ana)
    this.addPart(new THREE.Vector3(0, -1, 0), new THREE.Vector3(140, 2, 140), this.materials.grass);

    // Registro de zona
    this.zones.push({
      name: 'Parque Central de Santa Ana',
      tag: '⬡ Centro Histórico',
      bounds: new THREE.Box3(new THREE.Vector3(-60, 0, -60), new THREE.Vector3(60, 30, 60))
    });
  }

  /**
   * 2. PARQUE CENTRAL DE SANTA ANA & PUPUSERÍA "EL CHIVO FELIZ"
   */
  buildCentralPlazaAndPupuseria() {
    // Kiosco central del parque
    this.addPart(new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(14, 1.2, 14), this.materials.stone);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * 5;
      const z = Math.sin(angle) * 5;
      this.addPart(new THREE.Vector3(x, 3.5, z), new THREE.Vector3(1, 5, 1), this.materials.stone);
    }
    // Techo del kiosco
    this.addPart(new THREE.Vector3(0, 6.5, 0), new THREE.Vector3(16, 1, 16), this.materials.stone);

    // --- PUPUSERÍA TRADICIONAL "EL CHIVO FELIZ" (X: -26, Z: 18) ---
    const pupuPos = new THREE.Vector3(-26, 0, 18);
    // Suelo de la pupusería
    this.addPart(new THREE.Vector3(pupuPos.x, 0.4, pupuPos.y), new THREE.Vector3(20, 0.8, 16), this.materials.stone);
    // Pared trasera
    this.addPart(new THREE.Vector3(pupuPos.x, 3.5, pupuPos.y - 7.5), new THREE.Vector3(20, 6, 1), this.materials.wood);
    // Mostrador de atención
    this.addPart(new THREE.Vector3(pupuPos.x, 2.0, pupuPos.y + 4), new THREE.Vector3(16, 2.5, 2), this.materials.wood);

    // Comal grande de pupusas sobre el mostrador
    const comalGeo = new THREE.CylinderGeometry(2.5, 2.8, 0.4, 8);
    const comalMat = createToonMaterial({ color: 0x1f1f1f, roughness: 0.4 });
    const comal = new THREE.Mesh(comalGeo, comalMat);
    comal.position.set(pupuPos.x - 3, 3.4, pupuPos.y + 4);
    this.group.add(comal);

    // Pupusas doradas en el comal (recogibles y comestibles)
    const pupusaGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 8);
    const pupusaMat = createToonMaterial({ color: 0xf5d061, roughness: 0.6 });
    for (let p = 0; p < 3; p++) {
      const px = pupuPos.x - 3 + Math.cos(p * 2.0) * 1.0;
      const pz = pupuPos.y + 4 + Math.sin(p * 2.0) * 1.0;
      const pupuMesh = new THREE.Mesh(pupusaGeo, pupusaMat);
      pupuMesh.position.set(px, 3.65, pz);
      pupuMesh.castShadow = true;
      this.group.add(pupuMesh);

      if (this.pickupManager && this.physicsWorld) {
        const shape = new CANNON.Cylinder(0.7, 0.7, 0.2, 8);
        const body = new CANNON.Body({ mass: 0.5, material: this.physicsWorld.blockMaterial });
        body.addShape(shape);
        body.position.set(px, 3.65, pz);
        this.physicsWorld.addBody(body);

        this.pickupManager.registerItem(pupuMesh, body, {
          name: 'Pupusa de Queso con Loroco',
          icon: '◇',
          isEdible: true,
          healAmount: 50
        });
      }
    }

    // Rótulo de la Pupusería
    this.createSignboard(
      new THREE.Vector3(pupuPos.x, 7.5, pupuPos.y + 4),
      'PUPUSERÍA "EL CHIVO FELIZ"',
      'Revueltas • Queso con Loroco • Chicharrón'
    );

    // --- MICROBÚS "RUTA 202 SANTA ANA" ESTACIONADO ---
    this.buildSalvadoreanBus(new THREE.Vector3(-28, 0, -18));
  }

  /**
   * Genera un autobús Coaster típico de El Salvador (blanco con franja azul y roja).
   */
  buildSalvadoreanBus(pos) {
    const busGroup = new THREE.Group();
    busGroup.position.copy(pos);

    // Carrocería principal (largo 14, alto 4.5, ancho 5.5 studs)
    const bodyGeo = new THREE.BoxGeometry(14, 3.8, 5.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.busWhite);
    bodyMesh.position.y = 3.2;
    bodyMesh.castShadow = true;
    busGroup.add(bodyMesh);

    // Franja azul salvadoreña inferior
    const stripeGeo = new THREE.BoxGeometry(14.05, 0.8, 5.55);
    const stripeMesh = new THREE.Mesh(stripeGeo, this.materials.busBlue);
    stripeMesh.position.y = 2.4;
    busGroup.add(stripeMesh);

    // Franja roja estilizada
    const redStripeGeo = new THREE.BoxGeometry(14.05, 0.4, 5.55);
    const redStripeMesh = new THREE.Mesh(redStripeGeo, this.materials.busRed);
    redStripeMesh.position.y = 3.1;
    busGroup.add(redStripeMesh);

    // Ventanas tintadas
    const windowGeo = new THREE.BoxGeometry(12, 1.2, 5.6);
    const windowMat = createToonMaterial({ color: 0x1a2530, roughness: 0.1 });
    const windowMesh = new THREE.Mesh(windowGeo, windowMat);
    windowMesh.position.y = 4.2;
    busGroup.add(windowMesh);

    // 4 Ruedas de goma negra
    const wheelGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.8, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = createToonMaterial({ color: 0x111111, roughness: 0.8 });
    const wheelPositions = [
      [-4.5, 1.0, -2.8],
      [4.5, 1.0, -2.8],
      [-4.5, 1.0, 2.8],
      [4.5, 1.0, 2.8]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, wy, wz);
      busGroup.add(wheel);
    });

    this.group.add(busGroup);

    // Colisionador físico del bus
    if (this.physicsWorld) {
      const halfExtents = new CANNON.Vec3(7, 2.2, 2.8);
      const busBody = new CANNON.Body({
        mass: 0,
        material: this.physicsWorld.blockMaterial
      });
      busBody.addShape(new CANNON.Box(halfExtents));
      busBody.position.set(pos.x, 2.8, pos.z);
      this.physicsWorld.addBody(busBody);
    }

    // Letrero del parabrisas
    this.createSignboard(
      new THREE.Vector3(pos.x + 8.5, 4.8, pos.z),
      'RUTA 202 SANTA ANA',
      'Directo por Los Chorros'
    );
  }

  /**
   * 3. VOLCÁN DE SANTA ANA (ILAMATEPEC) CON CRÁTER Y LAGUNA DE AZUFRE
   */
  buildSantaAnaVolcano() {
    const volcanoCenter = new THREE.Vector3(130, 0, 0);

    // Base del volcán
    this.addPart(volcanoCenter, new THREE.Vector3(120, 4, 120), this.materials.volcanic);

    // 6 Niveles escalonados ascendentes de roca volcánica
    const layers = [
      { width: 100, height: 6, y: 5 },
      { width: 80, height: 7, y: 11.5 },
      { width: 65, height: 8, y: 19 },
      { width: 50, height: 8, y: 27 },
      { width: 40, height: 8, y: 35 }
    ];

    layers.forEach(layer => {
      this.addPart(
        new THREE.Vector3(volcanoCenter.x, layer.y, volcanoCenter.z),
        new THREE.Vector3(layer.width, layer.height, layer.width),
        this.materials.volcanic
      );
    });

    // Sendero en espiral y escalones para subir a la cima del volcán
    for (let s = 0; s < 18; s++) {
      const angle = (s / 18) * Math.PI * 2.2;
      const radius = 56 - s * 1.8;
      const stepX = volcanoCenter.x + Math.cos(angle) * radius;
      const stepZ = volcanoCenter.z + Math.sin(angle) * radius;
      const stepY = 2 + s * 2.1;

      this.addPart(
        new THREE.Vector3(stepX, stepY, stepZ),
        new THREE.Vector3(4, 1.2, 4),
        this.materials.volcanic
      );
    }

    // --- CRÁTER ACTIVO (Y = 39) ---
    // Corona del cráter (borde perimetral)
    this.addPart(new THREE.Vector3(volcanoCenter.x, 39, volcanoCenter.z), new THREE.Vector3(38, 2, 38), this.materials.volcanic);

    // Laguna Esmeralda / Cráter de Azufre (Turquesa brillante en el centro)
    const lagoonMesh = this.addPart(
      new THREE.Vector3(volcanoCenter.x, 39.5, volcanoCenter.z),
      new THREE.Vector3(22, 1.2, 22),
      this.materials.sulfurLagoon
    );

    // Rocas de lava caliente alrededor del cráter
    for (let l = 0; l < 4; l++) {
      const angle = (l * Math.PI) / 2;
      const lx = volcanoCenter.x + Math.cos(angle) * 14;
      const lz = volcanoCenter.z + Math.sin(angle) * 14;
      const lavaPart = this.addPart(
        new THREE.Vector3(lx, 40.5, lz),
        new THREE.Vector3(3, 1.5, 3),
        this.materials.volcanoLava
      );
      this.lavaHazards.push(lavaPart);
    }

    // Mirador de la Cumbre con Rótulo Informativo
    this.createSignboard(
      new THREE.Vector3(volcanoCenter.x, 42.5, volcanoCenter.z - 16),
      'VOLCÁN ILAMATEPEC (SANTA ANA)',
      'Altitud: 2,381 msnm • Laguna Sulfúrica'
    );

    this.zones.push({
      name: 'Volcán de Santa Ana (Ilamatepec)',
      tag: '△ Cima del Cráter',
      bounds: new THREE.Box3(new THREE.Vector3(70, 0, -60), new THREE.Vector3(190, 60, 60))
    });
  }

  /**
   * 4. PLAYA EL TUNCO (SURF CITY) & OCÉANO PACÍFICO
   */
  buildElTuncoBeach() {
    const beachPos = new THREE.Vector3(0, 0, 140);

    // Playa de arena dorada
    this.addPart(beachPos, new THREE.Vector3(140, 2, 100), this.materials.sand);

    // Océano Pacífico (Plano azul translúcido infinito)
    const oceanMesh = this.addPart(
      new THREE.Vector3(beachPos.x, -0.2, beachPos.z + 70),
      new THREE.Vector3(160, 1.8, 60),
      this.materials.oceanWater
    );

    // La emblemática "Roca de El Tunco" sobresaliendo del mar
    const rockPos = new THREE.Vector3(beachPos.x + 12, 5, beachPos.z + 55);
    this.addPart(rockPos, new THREE.Vector3(16, 12, 14), this.materials.volcanic);
    this.addPart(new THREE.Vector3(rockPos.x + 2, 11, rockPos.z), new THREE.Vector3(10, 6, 8), this.materials.volcanic);

    // Palmeras de coco tropicales
    const palmPositions = [
      [-35, 120], [-18, 115], [22, 118], [42, 122], [5, 110]
    ];
    palmPositions.forEach(([px, pz]) => {
      this.buildPalmTree(new THREE.Vector3(px, 0.8, pz));
    });

    // Rancho playero con techo de paja tradicional
    this.buildBeachRancho(new THREE.Vector3(-25, 0, 130));

    // Cartel "SURF CITY EL SALVADOR"
    this.createSignboard(
      new THREE.Vector3(0, 6.0, 105),
      'SURF CITY - PLAYA EL TUNCO',
      'Olas de clase mundial • La Roca'
    );

    this.zones.push({
      name: 'Playa El Tunco (Surf City)',
      tag: '▽ Costa del Pacífico',
      bounds: new THREE.Box3(new THREE.Vector3(-70, 0, 80), new THREE.Vector3(70, 40, 210))
    });
  }

  /**
   * Construye una palmera de coco en bloques.
   */
  buildPalmTree(pos) {
    const palmGroup = new THREE.Group();
    palmGroup.position.copy(pos);

    // Tronco curvado en segmentos
    for (let t = 0; t < 7; t++) {
      const curveX = Math.sin(t * 0.3) * 0.7;
      const trunkMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.2), this.materials.wood);
      trunkMesh.position.set(curveX, t * 1.3, 0);
      trunkMesh.castShadow = true;
      palmGroup.add(trunkMesh);
    }

    // Copa de hojas verdes de palma
    const leavesGeo = new THREE.BoxGeometry(7, 0.4, 7);
    const leaves = new THREE.Mesh(leavesGeo, this.materials.palmLeaves);
    leaves.position.set(1.5, 9.2, 0);
    leaves.castShadow = true;
    palmGroup.add(leaves);

    // Hojas cruzadas en diagonal
    const leaves2 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 6), this.materials.palmLeaves);
    leaves2.position.set(1.5, 9.4, 0);
    leaves2.rotation.y = Math.PI / 4;
    leaves2.castShadow = true;
    palmGroup.add(leaves2);

    this.group.add(palmGroup);

    if (this.physicsWorld) {
      const body = new CANNON.Body({
        mass: 0,
        material: this.physicsWorld.blockMaterial
      });
      body.addShape(new CANNON.Box(new CANNON.Vec3(0.6, 4.5, 0.6)));
      body.position.set(pos.x, 4.5, pos.z);
      this.physicsWorld.addBody(body);
    }
  }

  /**
   * Construye un rancho playero con techo de palma.
   */
  buildBeachRancho(pos) {
    // 4 Postes de madera
    const posts = [
      [-5, -4], [5, -4], [-5, 4], [5, 4]
    ];
    posts.forEach(([dx, dz]) => {
      this.addPart(new THREE.Vector3(pos.x + dx, 3.0, pos.z + dz), new THREE.Vector3(0.8, 6, 0.8), this.materials.wood);
    });

    // Techo piramidal de paja
    this.addPart(new THREE.Vector3(pos.x, 6.5, pos.z), new THREE.Vector3(13, 1.2, 11), this.materials.thatch);
    this.addPart(new THREE.Vector3(pos.x, 7.5, pos.z), new THREE.Vector3(9, 1.0, 7), this.materials.thatch);

    // Tablas de surf apoyadas en el rancho (recogibles)
    const boardColors = [0x00bcd4, 0xff5722, 0x8bc34a];
    boardColors.forEach((col, i) => {
      const boardGeo = new THREE.BoxGeometry(1.0, 5.0, 0.25);
      const boardMat = createToonMaterial({ color: col, roughness: 0.2 });
      const board = new THREE.Mesh(boardGeo, boardMat);
      const bX = pos.x - 4 + i * 1.5;
      const bY = 2.5;
      const bZ = pos.z + 4.2;
      board.position.set(bX, bY, bZ);
      board.rotation.z = -0.15;
      board.castShadow = true;
      this.group.add(board);

      if (this.pickupManager && this.physicsWorld) {
        const body = new CANNON.Body({ mass: 3, material: this.physicsWorld.blockMaterial });
        body.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 2.5, 0.15)));
        body.position.set(bX, bY, bZ);
        this.physicsWorld.addBody(body);

        this.pickupManager.registerItem(board, body, {
          name: 'Tabla de Surf Salvadoreña',
          icon: '▽'
        });
      }
    });

    // Cocos caídos bajo las palmeras
    if (this.pickupManager && this.physicsWorld) {
      const coconutGeo = new THREE.IcosahedronGeometry(0.5, 0);
      const coconutMat = createToonMaterial({ color: 0x4a2e18, roughness: 0.9 });
      const coconutSpots = [
        [pos.x + 8, 1.0, pos.z - 6],
        [pos.x - 10, 1.0, pos.z + 2]
      ];
      coconutSpots.forEach(([cx, cy, cz]) => {
        const cocoMesh = new THREE.Mesh(coconutGeo, coconutMat);
        cocoMesh.position.set(cx, cy, cz);
        cocoMesh.castShadow = true;
        this.group.add(cocoMesh);

        const cocoBody = new CANNON.Body({ mass: 1, material: this.physicsWorld.blockMaterial });
        cocoBody.addShape(new CANNON.Sphere(0.5));
        cocoBody.position.set(cx, cy, cz);
        this.physicsWorld.addBody(cocoBody);

        this.pickupManager.registerItem(cocoMesh, cocoBody, {
          name: 'Coco Fresco de Palmera',
          icon: '⬡',
          isEdible: true,
          healAmount: 30
        });
      });
    }
  }

  /**
   * 5. RUINAS MAYAS DE TAZUMAL (CHALCHUAPA)
   */
  buildTazumalPyramid() {
    const mayaPos = new THREE.Vector3(-120, 0, 0);

    // Base del parque arqueológico
    this.addPart(mayaPos, new THREE.Vector3(90, 2, 90), this.materials.grass);

    // 4 Terrazas escalonadas de la pirámide de Tazumal
    const terraces = [
      { w: 54, h: 4, y: 3 },
      { w: 42, h: 4, y: 7 },
      { w: 30, h: 4, y: 11 },
      { w: 18, h: 4, y: 15 }
    ];

    terraces.forEach(t => {
      this.addPart(
        new THREE.Vector3(mayaPos.x, t.y, mayaPos.z),
        new THREE.Vector3(t.w, t.h, t.w),
        this.materials.ancientStone
      );
    });

    // Escalera ceremonial frontal (hacia el este)
    for (let step = 0; step < 16; step++) {
      this.addPart(
        new THREE.Vector3(mayaPos.x + 28 - step * 1.2, 1 + step * 1.0, mayaPos.z),
        new THREE.Vector3(1.4, 0.9, 10),
        this.materials.ancientStone
      );
    }

    // Templo superior de la pirámide
    this.addPart(new THREE.Vector3(mayaPos.x, 18.5, mayaPos.z), new THREE.Vector3(12, 3, 12), this.materials.ancientStone);

    // Reliquia sagrada del Jaguar de Jade en la cima de Tazumal
    const relicGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const jadeMat = createToonMaterial({
      color: 0x00e676,
      emissive: 0x00a854,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.4
    });
    const relic = new THREE.Mesh(relicGeo, jadeMat);
    relic.position.set(mayaPos.x, 21.2, mayaPos.z);
    this.tazumalRelic = relic;
    this.group.add(relic);

    if (this.pickupManager && this.physicsWorld) {
      const relicBody = new CANNON.Body({ mass: 4, material: this.physicsWorld.blockMaterial });
      relicBody.addShape(new CANNON.Sphere(1.0));
      relicBody.position.set(mayaPos.x, 21.2, mayaPos.z);
      this.physicsWorld.addBody(relicBody);

      this.pickupManager.registerItem(relic, relicBody, {
        name: 'Reliquia Maya del Jaguar de Jade',
        icon: '◆'
      });
    }

    // Cartel Informativo Tazumal
    this.createSignboard(
      new THREE.Vector3(mayaPos.x + 36, 4.0, mayaPos.z + 10),
      'SITIO ARQUEOLÓGICO TAZUMAL',
      'Cultura Maya • Chalchuapa'
    );

    this.zones.push({
      name: 'Ruinas Mayas de Tazumal',
      tag: '⬡ Patrimonio Ancestral',
      bounds: new THREE.Box3(new THREE.Vector3(-170, 0, -50), new THREE.Vector3(-70, 35, 50))
    });
  }

  /**
   * 6. CARRETERAS Y CONECTORES (Ruta Panamericana / Ruta de las Flores)
   */
  buildConnectingRoads() {
    // Carretera Este (Hacia el Volcán de Santa Ana)
    this.addPart(new THREE.Vector3(65, 0.05, 0), new THREE.Vector3(60, 0.3, 10), this.materials.asphalt);

    // Carretera Sur (Hacia la Playa El Tunco / Surf City)
    this.addPart(new THREE.Vector3(0, 0.05, 70), new THREE.Vector3(10, 0.3, 60), this.materials.asphalt);

    // Carretera Oeste (Hacia las Ruinas de Tazumal)
    this.addPart(new THREE.Vector3(-65, 0.05, 0), new THREE.Vector3(60, 0.3, 10), this.materials.asphalt);
  }

  /**
   * Crea un cartel o rótulo informativo en el mundo 3D.
   */
  createSignboard(pos, title, subtitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Cartel turístico Chero: pizarra verde agua con esquinas recortadas.
    ctx.fillStyle = '#102A2B';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#0E7C7B';
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(484, 0);
    ctx.lineTo(512, 28);
    ctx.lineTo(512, 228);
    ctx.lineTo(484, 256);
    ctx.lineTo(28, 256);
    ctx.lineTo(0, 228);
    ctx.lineTo(0, 28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#E9A23B';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(246, 233, 207, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, 476, 220);

    // Título
    ctx.fillStyle = '#F6E9CF';
    ctx.font = 'bold 30px "Avenir Next", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 104, 470);

    // Subtítulo
    ctx.fillStyle = '#F2A56B';
    ctx.font = '21px "Avenir Next", "Segoe UI", sans-serif';
    ctx.fillText(subtitle, 256, 162, 470);

    // Marca de diamante lateral.
    ctx.fillStyle = '#F26A4B';
    ctx.beginPath();
    ctx.moveTo(256, 206);
    ctx.lineTo(266, 216);
    ctx.lineTo(256, 226);
    ctx.lineTo(246, 216);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const signMat = createToonMaterial({ map: texture, roughness: 0.4 });

    const signGeo = new THREE.BoxGeometry(8, 4, 0.4);
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.copy(pos);
    signMesh.castShadow = true;
    this.group.add(signMesh);

    // Postes del cartel
    const postMat = this.materials.wood;
    const postGeo = new THREE.BoxGeometry(0.5, pos.y, 0.5);
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(pos.x - 3.2, pos.y / 2, pos.z);
    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(pos.x + 3.2, pos.y / 2, pos.z);

    this.group.add(post1);
    this.group.add(post2);
  }

  /**
   * Genera "Colones Salvadoreños" o "Chivo Coins" coleccionables giratorias por el mapa.
   */
  spawnSalvadoranCoins() {
    const coinPositions = [
      new THREE.Vector3(0, 7.5, 0),         // Kiosco Santa Ana
      new THREE.Vector3(-26, 4.5, 18),      // Pupusería
      new THREE.Vector3(130, 42.0, 0),      // Cumbre del Volcán Ilamatepec
      new THREE.Vector3(12, 14.0, 195),     // Roca de El Tunco
      new THREE.Vector3(-120, 23.0, 0),     // Cima de Pirámide Tazumal
      new THREE.Vector3(65, 2.0, 0),        // Carretera al Volcán
      new THREE.Vector3(0, 2.0, 70),        // Carretera a la Playa
      new THREE.Vector3(-65, 2.0, 0)        // Carretera a Tazumal
    ];

    const coinGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.25, 8);
    coinGeo.rotateX(Math.PI / 2);

    coinPositions.forEach((pos, idx) => {
      const coinMesh = new THREE.Mesh(coinGeo, this.materials.goldCoin);
      coinMesh.position.copy(pos);
      this.group.add(coinMesh);

      this.collectibleCoins.push({
        id: `coin_${idx}`,
        mesh: coinMesh,
        pos: pos.clone(),
        collected: false
      });
    });
  }

  /**
   * Identifica la zona salvadoreña actual en la que se encuentra el jugador.
   */
  getCurrentZone(playerPos) {
    for (let i = 0; i < this.zones.length; i++) {
      if (this.zones[i].bounds.containsPoint(playerPos)) {
        return this.zones[i];
      }
    }
    return { name: 'Tierras Salvadoreñas', tag: '◈ El Salvador' };
  }

  /**
   * Comprueba si el jugador recoge monedas o toca lava volcánica.
   */
  checkPlayer(playerPos) {
    const events = {
      coinCollected: null,
      volcanoLavaHit: false
    };

    // 1. Recogida de Colones
    for (let i = 0; i < this.collectibleCoins.length; i++) {
      const coin = this.collectibleCoins[i];
      if (!coin.collected && playerPos.distanceTo(coin.mesh.position) < 2.5) {
        coin.collected = true;
        coin.mesh.visible = false;
        events.coinCollected = coin;
      }
    }

    // 2. Lava volcánica
    for (let i = 0; i < this.lavaHazards.length; i++) {
      const lava = this.lavaHazards[i];
      if (playerPos.distanceTo(lava.mesh.position) < 3.0) {
        events.volcanoLavaHit = true;
        break;
      }
    }

    return events;
  }

  /**
   * Bucle de animación para las monedas y la reliquia maya.
   */
  update(dt) {
    // Girar monedas
    this.collectibleCoins.forEach(coin => {
      if (!coin.collected) {
        coin.mesh.rotation.z += dt * 2.5;
        coin.mesh.position.y = coin.pos.y + Math.sin(Date.now() * 0.003) * 0.25;
      }
    });

    // Girar y hacer flotar la reliquia de Jade en Tazumal
    if (this.tazumalRelic) {
      this.tazumalRelic.rotation.y += dt * 1.8;
      this.tazumalRelic.rotation.x += dt * 0.9;
    }
  }
}
