import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { World } from './world/World.js';
import { ThirdPersonCamera } from './character/ThirdPersonCamera.js';
import { PlayerController } from './character/PlayerController.js';
import { TouchControls } from './controls/TouchControls.js';
import { AudioManager } from './audio/AudioManager.js';
import { PickupManager } from './interact/PickupManager.js';
import { BlockManager } from './building/BlockManager.js';
import { BuildingController } from './building/BuildingController.js';
import { ObbyLevel } from './level/ObbyLevel.js';
import { SalvadorWorld } from './world/SalvadorWorld.js';
import { FishingWorld } from './world/FishingWorld.js';
import { CoinMineWorld } from './world/CoinMineWorld.js';
import { DayNightCycle } from './world/DayNightCycle.js';
import { DEFAULT_CAMERA_MODE, getCameraMode } from './character/CameraModes.js';
import { HUD } from './ui/HUD.js';
import { MiniMap } from './ui/MiniMap.js';
import { DataStore } from './data/DataStore.js';
import { Wallet } from './economy/Wallet.js';
import { SkinCollection } from './economy/SkinCollection.js';
import { getSkin } from './data/SkinCatalog.js';
import { LegendQuests } from './quests/LegendQuests.js';
import { LegendNPCs } from './world/LegendNPCs.js';
import { SkinsPanel } from './ui/SkinsPanel.js';
import { SpriteProgress } from './quests/SpriteProgress.js';
import { StartScreen } from './ui/StartScreen.js';
import { NetworkClient } from './net/NetworkClient.js';
import { RemotePlayers } from './net/RemotePlayers.js';
import { sanitizeBlock } from './net/protocol.js';
import { CipitioController } from './cipitio/CipitioController.js';

// 1. Inicializar motor gráfico Three.js
const engine = new Engine('game-canvas');

// 2. Inicializar motor de físicas Cannon-es
const physicsWorld = new PhysicsWorld();

// 3. Inicializar mundo 3D base
const world = new World(engine.scene, physicsWorld);

// 4. Inicializar motor de Audio procedural (SFX y música tropical)
const audioManager = new AudioManager();

// 5. Persistencia base: se necesita antes de elegir el modo de cámara
const dataStore = new DataStore();
const savedData = dataStore.load();
const savedCameraMode = getCameraMode(savedData.cameraMode);
let currentWorldId = savedData.worldId || 'central';
let controlsHelpVisible = savedData.controlsHelpVisible === true;
let gameStarted = false;
let networkClient = null;
let applyingRemoteBlock = false;
let cipitio = null;

// El estado de audio también forma parte de la partida guardada.
if (savedData.audioMuted) {
  audioManager.isMuted = true;
  audioManager.stopBGM();
}
let startScreen = null;

// 6. Inicializar sistema de cámara (TPS, FPS y cenital desde CameraModes)
const cameraController = new ThirdPersonCamera(
  engine.camera,
  engine.canvas,
  savedCameraMode ? savedCameraMode.id : DEFAULT_CAMERA_MODE
);

// 6. Inicializar controles táctiles multi-dispositivo
const touchControls = new TouchControls(cameraController);

// 7. Inicializar gestor de Recoger y Soltar objetos
const pickupManager = new PickupManager(world.scene, physicsWorld, audioManager);

// 8. Inicializar controlador del jugador
const player = new PlayerController(physicsWorld, cameraController, touchControls, audioManager, pickupManager);
world.add(player.avatar.group);

// 9. Generar los escenarios salvadoreños con objetos recogibles
const salvadorWorld = new SalvadorWorld(world.scene, physicsWorld, pickupManager);

// 10. Mantener la pista de obstáculos integrada
const obbyLevel = new ObbyLevel(world.scene, physicsWorld);

// 10b. Mundos aditivos: pesca (Güija, Coatepeque, Lempa) y mina de monedas
const fishingWorld = new FishingWorld(world.scene, physicsWorld);
const coinMineWorld = new CoinMineWorld(world.scene, physicsWorld);

// 11. Ciclo día/noche conectado a la iluminación existente
const dayNight = new DayNightCycle(engine.scene, world.lighting.sunLight, world.lighting.hemiLight);
dayNight.timeElapsed = savedData.dayTime;
dayNight.update(0);

// 12. Estado guardado e HUD
let currentStage = savedData.stage || 1;
let deathCount = savedData.deaths || 0;
let coins = savedData.coins ?? 50;
const savedPosition = savedData.position;
player.body.position.set(savedPosition.x, savedPosition.y, savedPosition.z);
player.body.velocity.set(0, 0, 0);
player.body.angularVelocity.set(0, 0, 0);
player.lastTrackedPosition.set(savedPosition.x, savedPosition.y, savedPosition.z);
player.health = savedData.health > 0 ? savedData.health : player.maxHealth;
player.staminaSystem.current = savedData.stamina;
player.staminaSystem.exhausted = player.stamina < player.staminaSystem.minToSprint;
player.distanceTraveled = Number.isFinite(savedData.distance) ? Math.max(0, savedData.distance) : 0;
player.resetDistanceAnchor();

let saveTimer = null;

const hud = new HUD();
hud.updateHealth(player.health, player.maxHealth);
hud.updateStamina(player.stamina, player.maxStamina);
hud.updateStats(coins, deathCount);
hud.updateDistance(player.distanceTraveled);
hud.updateTime(dayNight.getTimeOfDay());
dayNight.onPeriodChanged = (period) => hud.updateTime(period);
hud.onControlsHelpVisibilityChanged = (visible) => {
  controlsHelpVisible = visible;
  scheduleSave();
};
hud.setControlsHelpVisible(controlsHelpVisible, false);
if (hud.audioToggleBtn) {
  hud.audioToggleBtn.textContent = savedData.audioMuted ? '♪ Silencio' : '♫ Música';
}

// 12b. Economía, misiones de leyendas, skins e inventario
const wallet = new Wallet({ colones: coins, bitcoins: savedData.bitcoins ?? 0 });
const skins = new SkinCollection(savedData.skins?.owned, savedData.skins?.equipped);
const quests = new LegendQuests(savedData.quests);
const spriteProgress = new SpriteProgress(savedData.spriteProgress);
spriteProgress.markOwned(skins.owned);
const legendNpcs = new LegendNPCs(world.scene);
player.avatar.setSkin(getSkin(skins.equipped));
hud.updateWallet(wallet.colones, wallet.bitcoins);

// Minimapa conectado al bucle principal
const miniMap = new MiniMap();
legendNpcs.getMapLandmarks().forEach((landmark) => miniMap.landmarks.push(landmark));
fishingWorld.getMapLandmarks().forEach((landmark) => miniMap.landmarks.push(landmark));
coinMineWorld.getMapLandmarks().forEach((landmark) => miniMap.landmarks.push(landmark));
miniMap.update(player.body.position, salvadorWorld.getCurrentZone(player.body.position), cameraController.yaw);

// Guardado centralizado: incluye progreso, distancia y bloques construidos.
function saveProgress() {
  dataStore.save({
    stage: currentStage,
    deaths: deathCount,
    coins: wallet.colones,
    bitcoins: wallet.bitcoins,
    distance: Math.round(player.distanceTraveled),
    blocks: blockManager.serialize(),
    skins: skins.serialize(),
    quests: quests.serialize(),
    spriteProgress: spriteProgress.serialize(),
    cameraMode: cameraController.mode.id,
    worldId: currentWorldId,
    position: {
      x: player.body.position.x,
      y: player.body.position.y,
      z: player.body.position.z
    },
    health: player.health,
    stamina: player.stamina,
    dayTime: dayNight.timeElapsed,
    audioMuted: audioManager.isMuted,
    controlsHelpVisible,
    hotbarIndex: buildingController.activeToolIndex,
    cipitio: cipitio?.serialize() ?? null,
    savedAt: Date.now()
  });
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveProgress();
  }, 300);
}

window.addEventListener('beforeunload', () => {
  saveProgress();
  networkClient?.disconnect();
});

// Actualiza HUD y panel con el estado económico vigente.
function refreshEconomyUI() {
  hud.updateStats(wallet.colones, deathCount);
  hud.updateWallet(wallet.colones, wallet.bitcoins);
  skinsPanel.refresh(wallet, skins, quests, spriteProgress);
}

// Un sprite puede cruzar varios umbrales con una sola recompensa grande.
function announceSpriteUnlocks(unlockedSprites) {
  if (!unlockedSprites.length) return;
  unlockedSprites.forEach((sprite) => {
    if (!skins.unlock(sprite.id)) return;
    hud.showToast(`✦ Sprite desbloqueado: ${sprite.name}`, 'victory');
    audioManager.playVictory();
  });
  refreshEconomyUI();
  if (startScreen) startScreen.render();
  scheduleSave();
}

function recordSpriteProgress(type, amount = 1) {
  announceSpriteUnlocks(spriteProgress.record(type, amount));
}

function notifyCompletedQuests(ids) {
  ids.forEach((id) => {
    const info = quests.describe(id);
    if (info) hud.showToast(`◇ Misión completada: habla con ${info.def.npc}`, 'quest');
  });
}

function equipSkin(id) {
  const skin = getSkin(id);
  if (!skin || !skins.equip(id)) return false;
  player.avatar.setSkin(skin);
  return true;
}

// Aplica un modo del catálogo sin tocar la referencia engine.camera.
function applyCameraMode(id, announce = false) {
  const mode = cameraController.setMode(id);
  if (!mode) return false;

  player.avatar.group.visible = mode.showAvatar;
  hud.setCameraMode(mode.id, mode.label);
  if (announce) hud.showToast(`▣ Cámara: ${mode.label}`, 'info');
  scheduleSave();
  return true;
}

applyCameraMode(cameraController.mode.id);

function cycleCameraMode() {
  const mode = cameraController.cycleMode();
  applyCameraMode(mode.id, true);
}

// Entrega la recompensa de una veta ya consumida por CoinMineWorld.
function awardMineVein(vein, toastType = 'info') {
  const reward = vein.reward;
  let message = '◆ ¡Veta de oro extraída!';
  if (reward.colones) {
    wallet.addColones(reward.colones);
    message += ` +${reward.colones} colones`;
    notifyCompletedQuests(quests.record('coins', reward.colones));
    recordSpriteProgress('coins', reward.colones);
  }
  if (reward.bitcoins) {
    wallet.addBitcoins(reward.bitcoins);
    message += ` +${reward.bitcoins} BTC`;
  }
  recordSpriteProgress('mine', 1);
  audioManager.playCoin();
  hud.showToast(message, toastType);
  refreshEconomyUI();
  scheduleSave();
}

// Pescar en lagos/ríos o extraer una veta de la mina, según cercanía.
function harvestNearbyResource() {
  const spot = fishingWorld.getClosest(player.body.position);
  if (spot) {
    const result = fishingWorld.catchFish(spot);
    if (!result.ok) {
      hud.showToast('≋ El agua aún se está calmando, intenta de nuevo en un momento', 'warning');
      return;
    }

    const amount = result.reward.colones;
    wallet.addColones(amount);
    audioManager.playCoin();
    hud.showToast(`≋ ¡Pescaste en ${spot.name}! +${amount} colones`, 'info');
    notifyCompletedQuests(quests.record('coins', amount));
    recordSpriteProgress('fish', 1);
    recordSpriteProgress('coins', amount);
    refreshEconomyUI();
    scheduleSave();
    return;
  }

  const mineEvent = coinMineWorld.checkPlayer(player.body.position);
  if (mineEvent.vein) {
    awardMineVein(mineEvent.vein, 'victory');
    return;
  }

  hud.showToast('≋ Acércate al agua o a una veta de la mina para recolectar', 'info');
}

// Hablar con una leyenda: aceptar misión / reclamar recompensa.
function talkToLegend() {
  const npc = legendNpcs.tryTalk(player.body.position);
  if (!npc) {
    hud.showToast('◇ Acércate a una leyenda para hablar', 'info');
    return;
  }

  const result = quests.talk(npc.questId);
  if (result.status === 'aceptada') {
    hud.showToast(`◇ ${npc.name}: ${result.quest.description}`, 'quest');
  } else if (result.status === 'en-curso') {
    hud.showToast(`◇ ${npc.name}: ${Math.floor(result.progress)} / ${result.quest.goal.amount}`, 'quest');
  } else if (result.status === 'reclamada') {
    hud.showToast(`◇ ${npc.name}: recompensa ya reclamada`, 'info');
  } else if (result.status === 'lista') {
    const reward = result.reward;
    let message = `✦ ${npc.name} te entregó`;
    if (reward.skin) {
      const skin = getSkin(reward.skin);
      if (skins.unlock(reward.skin)) equipSkin(reward.skin);
      message += ` la skin ${skin.name}`;
    }
    if (reward.colones) {
      wallet.addColones(reward.colones);
      recordSpriteProgress('coins', reward.colones);
    }
    if (reward.bitcoins) {
      wallet.addBitcoins(reward.bitcoins);
      message += ` y ${reward.bitcoins} BTC`;
    }
    recordSpriteProgress('quest', 1);
    hud.showToast(message, 'victory');
    audioManager.playVictory();
    refreshEconomyUI();
    saveProgress();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.repeat || !gameStarted) return;
  if (e.code === 'KeyQ') talkToLegend();
  if (e.code === 'KeyC') cycleCameraMode();
  if (e.code === 'KeyG') harvestNearbyResource();

  // Combate del Cipitío: el propio controlador ignora las teclas fuera del sector.
  const accionesCipitio = {
    KeyV: 'parry',
    KeyX: 'disco',
    KeyZ: 'huella',
    KeyR: 'esquiva',
    KeyT: 'tonico',
    KeyJ: 'forma:duende',
    KeyK: 'forma:jaguar',
    KeyM: 'forma:torogoz'
  };
  const accion = accionesCipitio[e.code];
  if (accion && cipitio?.activo && cipitio.ejecutarAccion(accion)) e.preventDefault();
});

// Enlaces del HUD: audio y selector de cámara
hud.onAudioToggle = () => audioManager.toggleMute();
hud.onCameraModeSelected = (id) => applyCameraMode(id);

// Panel de skins: inventario, tienda y progreso de misiones
const skinsPanel = new SkinsPanel();
skinsPanel.refresh(wallet, skins, quests);
hud.onSkinsToggle = () => skinsPanel.toggle();

skinsPanel.onEquip = (id) => {
  const skin = getSkin(id);
  if (!equipSkin(id)) return;
  hud.showToast(`◈ Skin equipado: ${skin.name}`, 'info');
  refreshEconomyUI();
  saveProgress();
};

skinsPanel.onBuy = (id, currency) => {
  const result = skins.purchase(id, wallet, currency);
  if (!result.ok) {
    const message = result.reason === 'fondos-insuficientes'
      ? 'No tienes suficientes fondos para esa skin'
      : 'No se pudo completar la compra';
    hud.showToast(message, 'warning');
    return;
  }
  equipSkin(id);
  hud.showToast(`✦ Compraste ${result.skin.name}`, 'victory');
  audioManager.playPickup();
  refreshEconomyUI();
  saveProgress();
};

skinsPanel.onConvert = (direction) => {
  const ok = direction === 'to-bitcoins'
    ? wallet.convertToBitcoins(1)
    : wallet.convertToColones(1);
  if (!ok) {
    hud.showToast('◇ Fondos insuficientes para el cambio', 'warning');
    return;
  }
  hud.showToast(direction === 'to-bitcoins'
    ? '₿ Cambiaste 100 colones por 1 bitcoin'
    : '◆ Cambiaste 1 bitcoin por 100 colones', 'info');
  refreshEconomyUI();
  saveProgress();
};

// Pantalla de inicio: elegir entre los 100 sprites y reabrir el selector cuando se quiera
startScreen = new StartScreen({ collection: skins, progress: spriteProgress });
startScreen.onSelect = (id) => {
  const sprite = getSkin(id);
  if (!equipSkin(id)) return;
  hud.showToast(`✦ Sprite elegido: ${sprite.name}`, 'info');
  refreshEconomyUI();
  scheduleSave();
};
startScreen.onStart = () => {
  if (gameStarted) return;
  gameStarted = true;
  hud.showToast('◈ Chero World listo. ¡A explorar!', 'info');
};
hud.onSpritesOpen = () => startScreen.open(true);
startScreen.open(false);

// Enlaces de eventos de Recoger, Soltar y Usar
pickupManager.onItemPickup = (item) => {
  hud.showToast(`◇ Has recogido: ${item.name}`, 'info');
  hud.setHeldItem(item);
  if (touchControls.useButton && item.isEdible) {
    touchControls.useButton.style.display = 'flex';
  }
};

pickupManager.onItemDrop = (item) => {
  hud.showToast(`◇ Has soltado: ${item.name}`, 'info');
  hud.setHeldItem(null);
  if (touchControls.useButton) {
    touchControls.useButton.style.display = 'none';
  }
};

pickupManager.onItemUsed = (item) => {
  hud.showToast(`✦ Te comiste una deliciosa ${item.name} (+Salud)`, 'info');
  hud.setHeldItem(null);
  if (touchControls.useButton) {
    touchControls.useButton.style.display = 'none';
  }
};

// Botones táctiles móviles de interacción (inactivos hasta elegir sprite)
if (touchControls) {
  const whenPlaying = (callback) => (...args) => {
    if (!gameStarted) return;
    callback(...args);
  };

  touchControls.onInteract = whenPlaying(() => {
    const forward = cameraController.getHorizontalForward();
    pickupManager.togglePickup(player.body.position, player.avatar.torsoMesh, forward);
  });

  touchControls.onUse = whenPlaying(() => {
    pickupManager.useHeldItem(player);
  });

  touchControls.onTalk = whenPlaying(() => talkToLegend());
  touchControls.onSkins = whenPlaying(() => skinsPanel.toggle());
  touchControls.onCamera = whenPlaying(() => cycleCameraMode());
  touchControls.onFish = whenPlaying(() => harvestNearbyResource());
}

// Sistema de teletransporte / viaje rápido
hud.onTeleportRequested = ({ x, y, z, worldId }) => {
  player.body.position.set(x, y, z);
  player.body.velocity.set(0, 0, 0);
  player.body.angularVelocity.set(0, 0, 0);
  player.resetDistanceAnchor();
  if (worldId) currentWorldId = worldId;
  if (worldId === 'izalco') cipitio?.activar();
  else if (cipitio?.activo) cipitio.desactivar();
  audioManager.playPickup();
  scheduleSave();
};

// Callbacks de salud y muerte del jugador
player.onHealthChanged = (health, max) => {
  hud.updateHealth(health, max);
};

player.onDeath = () => {
  deathCount++;
  hud.updateStats(wallet.colones, deathCount);
  saveProgress();
};

const resetBtn = document.getElementById('reset-char-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    player.die();
  });
}

// 13. Gestor de construcción con bloques
const blockManager = new BlockManager(world.scene, physicsWorld, audioManager);
blockManager.restore(savedData.blocks);
blockManager.onBlockPlaced = (block) => {
  recordSpriteProgress('build', 1);
  scheduleSave();
  if (!applyingRemoteBlock) networkClient?.sendBlockPlaced(block);
};
blockManager.onBlockRemoved = (block) => {
  scheduleSave();
  if (!applyingRemoteBlock && block?.id) networkClient?.sendBlockRemoved(block.id);
};

const buildingController = new BuildingController(
  engine.camera,
  world.scene,
  world.baseplate.mesh,
  blockManager,
  () => player.body.position,
  [...fishingWorld.getBuildSurfaces(), ...coinMineWorld.getBuildSurfaces()]
);

// Sincronizar UI de la Hotbar
const hotbarSlots = document.querySelectorAll('.hotbar-slot');
function updateHotbarUI(activeIndex) {
  hotbarSlots.forEach((slot, idx) => {
    slot.classList.toggle('active', idx === activeIndex);
  });
}

hotbarSlots.forEach((slot) => {
  slot.addEventListener('click', () => {
    const idx = parseInt(slot.getAttribute('data-index'), 10);
    buildingController.selectTool(idx);
    updateHotbarUI(idx);
  });
});

buildingController.onToolChanged = (idx) => {
  updateHotbarUI(idx);
};

if (Number.isInteger(savedData.hotbarIndex)) {
  buildingController.selectTool(savedData.hotbarIndex);
  updateHotbarUI(savedData.hotbarIndex);
}

// 13b. Sesión compartida: avatares remotos y bloques sincronizados.
// Si la página no la sirve el servidor Socket.io, NetworkClient queda inactivo.
const remotePlayers = new RemotePlayers(world.scene);

function applyRemoteBlocks(blocks) {
  if (!Array.isArray(blocks)) return;
  applyingRemoteBlock = true;
  try {
    blocks.forEach((raw) => {
      const block = sanitizeBlock(raw);
      if (!block || blockManager.hasBlock(block.id)) return;
      blockManager.placeBlock(
        new THREE.Vector3(block.position.x, block.position.y, block.position.z),
        block.color,
        new THREE.Vector3(block.size.x, block.size.y, block.size.z),
        true,
        block.id
      );
    });
  } finally {
    applyingRemoteBlock = false;
  }
}

networkClient = new NetworkClient();
let networkAnnounced = false;
networkClient.onStatus = (connected, reason) => {
  if (!connected || reason !== 'conectado' || networkAnnounced) return;
  networkAnnounced = true;
  hud.showToast('◈ Sesión compartida activa', 'info');
  // Comparte los bloques que el jugador ya tenía guardados en local.
  blockManager.serialize().forEach((block) => networkClient.sendBlockPlaced(block));
};
networkClient.onWorldState = (state) => {
  applyRemoteBlocks(state?.blocks);
  remotePlayers.clear();
  (state?.players || []).forEach(({ id, state: playerState }) => {
    remotePlayers.applyState(id, playerState);
  });
};
networkClient.onPlayerState = (id, state) => remotePlayers.applyState(id, state);
networkClient.onPlayerLeave = (id) => remotePlayers.remove(id);
networkClient.onBlockPlaced = (block) => applyRemoteBlocks([block]);
networkClient.onBlockRemoved = (id) => {
  applyingRemoteBlock = true;
  try {
    blockManager.removeBlockById(id, true);
  } finally {
    applyingRemoteBlock = false;
  }
};
networkClient.connect();

// 13c. Prototipo jugable del Capítulo 1: Cipitío en Las Cenizas de Izalco.
// El sector es autocontenido y solo se activa al viajar allí desde el mapa.
cipitio = new CipitioController({
  scene: world.scene,
  physicsWorld,
  origen: { x: 300, y: 0, z: 300 },
  obtenerPosicion: () => player.body.position,
  obtenerOrientacion: () => player.avatar.group.rotation.y,
  estaMoviendose: () => Math.hypot(player.body.velocity.x, player.body.velocity.z) > 0.2,
  sincronizarVida: (vida) => {
    player.health = vida;
    hud.updateHealth(vida, player.maxHealth);
  },
  teletransportar: ({ x, y, z }) => {
    player.body.position.set(x, y, z);
    player.body.velocity.set(0, 0, 0);
    player.body.angularVelocity.set(0, 0, 0);
    player.resetDistanceAnchor();
  },
  reproducirSonido: (tipo) => {
    if (tipo === 'parry:exito') audioManager.playPickup();
    else if (tipo === 'danio') audioManager.playHurt();
    else if (tipo === 'huella:salto') audioManager.playJump();
    else if (tipo === 'disco:impacto') audioManager.playDestroy();
    else if (tipo === 'prototipo:victoria') audioManager.playVictory();
  },
  onEvento: (tipo) => {
    if (tipo === 'muerte') {
      setTimeout(() => {
        if (cipitio?.activo) cipitio.respawn();
      }, 1600);
    }
    if (tipo === 'jefe:derrotado') scheduleSave();
  },
  onVictoria: () => {
    wallet.addColones(150);
    recordSpriteProgress('quest', 1);
    hud.showToast('✦ Hebra de la cabellera obtenida · +150 colones', 'victory');
    refreshEconomyUI();
    saveProgress();
  }
});
cipitio.restore(savedData.cipitio);
if (currentWorldId === 'izalco') cipitio.activar();

// 14. Bucle continuo de actualización por cada frame
let hasWon = false;
let elapsedTime = 0;
let autosaveElapsed = 0;
let networkElapsed = 0;
let questDistanceAnchor = player.distanceTraveled;

engine.onUpdate((dt) => {
  // La escena se sigue dibujando detrás del selector, pero no avanza nada.
  if (!gameStarted) return;

  // Simulación física
  physicsWorld.step(dt);

  // Jugador y cámara
  player.update(dt);

  // Combate del Capítulo 1 (inactivo fuera de Las Cenizas de Izalco).
  cipitio.update(dt);

  // Difusión del transform a 20 Hz e interpolación de los avatares ajenos.
  networkElapsed += dt;
  if (networkElapsed >= 0.05) {
    networkElapsed = 0;
    networkClient.sendPlayerState({
      position: {
        x: player.body.position.x,
        y: player.body.position.y,
        z: player.body.position.z
      },
      rotationY: player.avatar.group.rotation.y,
      moving: Math.hypot(player.body.velocity.x, player.body.velocity.z) > 0.2,
      grounded: player.isGrounded,
      speed: (player.isSprinting ? player.sprintSpeed : player.walkSpeed) / player.walkSpeed,
      skin: skins.equipped
    });
  }
  remotePlayers.update(dt);

  // Sistema de objetos interactivos
  pickupManager.update();

  // Progreso de la misión de distancia recorrida
  const distanceDelta = player.distanceTraveled - questDistanceAnchor;
  if (distanceDelta > 0) {
    notifyCompletedQuests(quests.record('distance', distanceDelta));
    recordSpriteProgress('distance', distanceDelta);
    questDistanceAnchor = player.distanceTraveled;
  }

  // Prioridad: leyenda cercana antes que objeto recogible
  const nearbyLegend = legendNpcs.getClosest(player.body.position);
  const nearbyFishingSpot = fishingWorld.getClosest(player.body.position);
  const nearbyVein = coinMineWorld.getClosestAvailable(player.body.position);

  if (nearbyLegend) {
    hud.setInteractionPrompt(
      { icon: nearbyLegend.glyph, name: nearbyLegend.name },
      'hablar',
      '<b>[Q]</b> o <b>◇ HABLAR</b>'
    );
  } else if (nearbyFishingSpot) {
    hud.setInteractionPrompt(
      { icon: '≋', name: `Pescar en ${nearbyFishingSpot.name}` },
      'pescar',
      '<b>[G]</b> o <b>≋ PESCA</b>'
    );
  } else if (nearbyVein) {
    hud.setInteractionPrompt(
      { icon: '◆', name: 'Extraer veta de oro' },
      'minar',
      '<b>[G]</b> o <b>≋ PESCA</b>'
    );
  } else {
    hud.setInteractionPrompt(pickupManager.getClosestItem(player.body.position));
  }

  // Raycasting de construcción
  buildingController.update();

  // Animaciones del mundo y ciclo día/noche
  salvadorWorld.update(dt);
  obbyLevel.update(dt);
  fishingWorld.update(dt, elapsedTime);
  coinMineWorld.update(dt, elapsedTime);
  dayNight.update(dt);
  elapsedTime += dt;
  legendNpcs.update(dt, elapsedTime);

  // Zona actual: los mundos nuevos tienen prioridad sobre el mapa base
  const currentZone = fishingWorld.getZone(player.body.position)
    || coinMineWorld.getZone(player.body.position)
    || salvadorWorld.getCurrentZone(player.body.position);
  hud.updateLocation(currentZone.name);
  hud.updateStamina(player.stamina, player.maxStamina);
  hud.updateDistance(player.distanceTraveled);
  hud.updateBuildStatus(buildingController.tools[buildingController.activeToolIndex].name, buildingController.canPlace);
  miniMap.update(player.body.position, currentZone, cameraController.yaw);

  // Eventos salvadoreños (monedas y lava volcánica)
  const salvadorEvents = salvadorWorld.checkPlayer(player.body.position);
  if (salvadorEvents.coinCollected) {
    wallet.addColones(10);
    coins = wallet.colones;
    refreshEconomyUI();
    const completedByCoins = quests.record('coins', 10);
    saveProgress();
    audioManager.playCoin();
    hud.showToast('◆ ¡+10 Colones Salvadoreños recolectados!', 'info');
    notifyCompletedQuests(completedByCoins);
    recordSpriteProgress('coins', 10);
  }

  if (salvadorEvents.volcanoLavaHit) {
    player.takeDamage(100);
    hud.showToast('△ ¡Caíste en la lava del Volcán Ilamatepec!', 'warning');
  }

  // Vetas de la mina: se reponen solas y alimentan colones/bitcoins
  const mineEvents = coinMineWorld.checkPlayer(player.body.position);
  if (mineEvents.vein) awardMineVein(mineEvents.vein);

  // Eventos del circuito Obby
  const obbyEvents = obbyLevel.checkPlayer(player.body.position);
  if (obbyEvents.lavaHit) {
    player.takeDamage(100);
  }

  if (obbyEvents.checkpointActivated) {
    const cpIndex = obbyEvents.checkpointActivated.index;
    if (cpIndex + 1 > currentStage) {
      currentStage = cpIndex + 1;
      player.setCheckpoint(obbyEvents.checkpointActivated.spawnPos);
      audioManager.playPickup();
      hud.showToast(`◇ Punto de Control ${cpIndex} guardado`, 'info');
      notifyCompletedQuests(quests.record('checkpoint', 1));
      recordSpriteProgress('checkpoint', 1);
      saveProgress();
    }
  }

  if (obbyEvents.goalReached && !hasWon) {
    hasWon = true;
    audioManager.playVictory();
    hud.showToast('✦ ¡QUÉ CHIVO! Has completado el circuito', 'victory');
    hud.showVictory(() => {
      hasWon = false;
      player.setCheckpoint(new THREE.Vector3(0, 4, 10));
      player.die();
    });
  }

  // Guardado automático cada 10 s: conserva posición, recursos y preferencias.
  autosaveElapsed += dt;
  if (autosaveElapsed >= 10) {
    autosaveElapsed = 0;
    saveProgress();
  }
});

// Iniciar bucle de renderizado
engine.start();

console.log('◈ Chero World — 100 sprites, cámaras, pesca, mina, leyendas y construcción listos.');
