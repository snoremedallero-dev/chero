import * as THREE from 'three';

/**
 * Controlador de construcción por bloques.
 * Administra el raycasting, alineación matemática a la cuadrícula de studs,
 * previsualización de bloque fantasma (ghost block) y modos de herramienta.
 */
export class BuildingController {
  constructor(camera, scene, baseplateMesh, blockManager, getPlayerPosition, extraSurfaces = []) {
    this.camera = camera;
    this.scene = scene;
    this.baseplateMesh = baseplateMesh;
    // Los suelos de pesca y mina también son superficies válidas de construcción.
    this.baseSurfaces = [baseplateMesh, ...extraSurfaces];
    this.blockManager = blockManager;
    this.getPlayerPosition = getPlayerPosition;

    // Configuración de cuadrícula
    this.blockSize = new THREE.Vector3(2, 2, 2);
    this.buildReach = 28; // Rango máximo de construcción en studs

    // Herramientas y colores de la Hotbar
    this.tools = [
      { id: 1, type: 'build', name: 'Bloque Rojo', color: 0xC05342, label: '◆' },
      { id: 2, type: 'build', name: 'Bloque Azul', color: 0x3E7CA8, label: '◇' },
      { id: 3, type: 'build', name: 'Bloque Ámbar', color: 0xE9A23B, label: '△' },
      { id: 4, type: 'build', name: 'Bloque Verde', color: 0x4E9A78, label: '▽' },
      { id: 5, type: 'build', name: 'Bloque Piedra', color: 0x7C8794, label: '⬡' },
      { id: 6, type: 'delete', name: 'Demoler', color: 0xF26A4B, label: '✕' }
    ];

    this.activeToolIndex = 0; // Por defecto: Bloque Rojo

    // Raycasting y coordenadas de mouse
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.targetFaceNormal = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.hoveredBlockMesh = null;
    this.canPlace = false;

    // Crear bloque fantasma translúcido de previsualización
    this.initGhostBlock();

    // Registrar eventos de interacción
    this.initEvents();
  }

  initGhostBlock() {
    const geometry = new THREE.BoxGeometry(this.blockSize.x, this.blockSize.y, this.blockSize.z);

    this.ghostMaterial = new THREE.MeshBasicMaterial({
      color: this.tools[this.activeToolIndex].color,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      // La vista previa ya tiene aristas propias; el contorno global la ensuciaría.
      userData: { outlineParameters: { visible: false } }
    });

    this.ghostMesh = new THREE.Mesh(geometry, this.ghostMaterial);
    this.ghostMesh.visible = false;

    // Contorno de aristas para precisión visual sobre la cuadrícula
    const edges = new THREE.EdgesGeometry(geometry);
    this.ghostOutline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    );
    this.ghostMesh.add(this.ghostOutline);

    this.scene.add(this.ghostMesh);
  }

  initEvents() {
    // 1. Seguimiento del puntero del mouse
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // 2. Colocar o destruir bloque con Clic Izquierdo (botón 0)
    window.addEventListener('mousedown', (e) => {
      // Ignorar si se hace clic sobre elementos de la interfaz de usuario
      const uiSelectors = [
        '#game-topbar', '#fast-travel-menu', '#camera-menu', '#hotbar-container', '#build-status',
        '#interaction-prompt', '#held-item-bar', '#skins-panel', '#start-screen', '#victory-modal',
        '#ui-overlay', '#touch-controls-container', '#cipitio-overlay'
      ];
      if (uiSelectors.some((selector) => e.target.closest(selector))) return;

      if (e.button === 0 && this.canPlace) {
        const currentTool = this.tools[this.activeToolIndex];

        if (currentTool.type === 'build') {
          // Colocar nuevo bloque en la posición alineada
          this.blockManager.placeBlock(this.targetPosition, currentTool.color, this.blockSize);
        } else if (currentTool.type === 'delete' && this.hoveredBlockMesh) {
          // Destruir el bloque apuntado
          this.blockManager.removeBlock(this.hoveredBlockMesh);
          this.hoveredBlockMesh = null;
          this.canPlace = false;
          this.ghostMesh.visible = false;
        }
      }
    });

    // 3. Selección de herramientas con teclas numéricas 1 al 6
    window.addEventListener('keydown', (e) => {
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].includes(e.code)) {
        const index = parseInt(e.code.replace('Digit', '')) - 1;
        this.selectTool(index);
      }
    });
  }

  /**
   * Cambia la herramienta activa de la Hotbar.
   */
  selectTool(index) {
    if (index >= 0 && index < this.tools.length) {
      this.activeToolIndex = index;
      const tool = this.tools[index];

      // Actualizar color del bloque fantasma
      if (tool.type === 'build') {
        this.ghostMaterial.color.setHex(tool.color);
        this.ghostMaterial.opacity = 0.5;
        this.ghostOutline.material.color.setHex(0xffffff);
      } else {
        // Modo demoler: coral de alerta
        this.ghostMaterial.color.setHex(0xF26A4B);
        this.ghostMaterial.opacity = 0.6;
        this.ghostOutline.material.color.setHex(0xFFD9CF);
      }

      // Notificar cambio de UI
      if (this.onToolChanged) {
        this.onToolChanged(this.activeToolIndex);
      }
    }
  }

  /**
   * Alinea una coordenada a la cuadrícula fija de studs.
   */
  snapToGrid(position, normal) {
    // Desplazamiento desde la superficie hacia afuera usando la normal de la cara
    const offsetPos = position.clone().add(
      normal.clone().multiplyScalar(this.blockSize.y / 2)
    );

    // X y Z centrados en números pares (... -4, -2, 0, 2, 4 ...)
    const snappedX = Math.round(offsetPos.x / this.blockSize.x) * this.blockSize.x;
    const snappedZ = Math.round(offsetPos.z / this.blockSize.z) * this.blockSize.z;

    // Y centrado en impares (1, 3, 5...) ya que el suelo está en Y = 0
    const snappedY = Math.round((offsetPos.y - 1) / this.blockSize.y) * this.blockSize.y + 1;

    return new THREE.Vector3(snappedX, snappedY, snappedZ);
  }

  /**
   * Bucle de actualización por frame para el raycast y la guía fantasma.
   */
  update() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Objetos colisionables: suelos base + todos los bloques construidos
    const blockMeshes = this.blockManager.getInteractableMeshes();
    const interactables = [...this.baseSurfaces, ...blockMeshes];
    const intersects = this.raycaster.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const playerPos = this.getPlayerPosition();

      // Verificar distancia máxima de alcance del jugador
      const distanceToHit = playerPos.distanceTo(hit.point);

      if (distanceToHit <= this.buildReach && hit.face) {
        const currentTool = this.tools[this.activeToolIndex];

        if (currentTool.type === 'build') {
          // Modo Colocar: Calcular posición en cuadrícula
          this.targetPosition = this.snapToGrid(hit.point, hit.face.normal);
          this.ghostMesh.position.copy(this.targetPosition);
          this.ghostMesh.visible = true;
          this.canPlace = true;
          this.hoveredBlockMesh = null;
        } else if (currentTool.type === 'delete') {
          // Modo Demoler: solo bloques construidos, nunca los suelos base
          if (blockMeshes.includes(hit.object)) {
            this.hoveredBlockMesh = hit.object;
            this.ghostMesh.position.copy(hit.object.position);
            this.ghostMesh.visible = true;
            this.canPlace = true;
          } else {
            this.ghostMesh.visible = false;
            this.canPlace = false;
            this.hoveredBlockMesh = null;
          }
        }
      } else {
        this.ghostMesh.visible = false;
        this.canPlace = false;
      }
    } else {
      this.ghostMesh.visible = false;
      this.canPlace = false;
    }
  }
}
