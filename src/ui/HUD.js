/**
 * Gestor del HUD de Chero World. Conserva la API pública usada por main.js y
 * añade energía, distancia, estado de construcción y fase del ciclo día/noche.
 */
export class HUD {
  constructor() {
    this.healthContainer = document.querySelector('.health-container');
    this.staminaContainer = document.querySelector('.stamina-container');
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.healthText = document.getElementById('health-text');
    this.staminaBarFill = document.getElementById('stamina-bar-fill');
    this.staminaText = document.getElementById('stamina-text');
    this.coinsDisplay = document.getElementById('coins-display');
    this.bitcoinsDisplay = document.getElementById('bitcoins-display');
    this.deathsDisplay = document.getElementById('deaths-display');
    this.distanceDisplay = document.getElementById('distance-display');
    this.locationTag = document.getElementById('location-tag');
    this.toastElement = document.getElementById('game-toast');
    this.victoryModal = document.getElementById('victory-modal');
    this.fastTravelBtn = document.getElementById('fast-travel-btn');
    this.fastTravelMenu = document.getElementById('fast-travel-menu');
    this.cameraBtn = document.getElementById('camera-btn');
    this.cameraMenu = document.getElementById('camera-menu');
    this.audioToggleBtn = document.getElementById('audio-toggle-btn');
    this.controlsHelpBtn = document.getElementById('controls-help-btn');
    this.controlsHint = document.getElementById('controls-hint');
    this.skinsBtn = document.getElementById('skins-btn');
    this.spritesBtn = document.getElementById('sprites-btn');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.heldItemBar = document.getElementById('held-item-bar');
    this.buildStatus = document.getElementById('build-status');
    this.buildStatusText = document.getElementById('build-status-text');
    this.buildCrosshair = document.getElementById('build-crosshair');
    this.timeChip = document.querySelector('.time-chip');
    this.timeIcon = document.getElementById('time-icon');
    this.timePeriod = document.getElementById('time-period');

    this.toastTimeout = null;
    this.onTeleportRequested = null;
    this.onCameraModeSelected = null;
    this.onAudioToggle = null;
    this.onControlsHelpVisibilityChanged = null;
    this.onSkinsToggle = null;
    this.onSpritesOpen = null;
    this.currentWorldId = 'central';
    this.currentCameraMode = 'tps';
    this.lastDistance = -1;
    this.lastBuildLabel = null;
    this.lastBuildBlocked = null;
    this.lastPeriod = null;

    this.initFastTravel();
    this.initCameraMenu();
    this.initAudioToggle();
    this.initControlsHelp();
    this.initSkinsToggle();
    this.initSpritesButton();
  }

  initSpritesButton() {
    if (!this.spritesBtn) return;
    this.spritesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onSpritesOpen) this.onSpritesOpen();
    });
  }

  initSkinsToggle() {
    if (!this.skinsBtn) return;
    this.skinsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.onSkinsToggle) this.onSkinsToggle();
    });
  }

  initAudioToggle() {
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onAudioToggle) {
          const isMuted = this.onAudioToggle();
          this.audioToggleBtn.textContent = isMuted ? '♪ Silencio' : '♫ Música';
          this.showToast(isMuted ? '♪ Audio silenciado' : '♫ Música tropical activada', 'info');
        }
      });
    }
  }

  /** Las instrucciones solo aparecen cuando el jugador lo pide. */
  initControlsHelp() {
    if (!this.controlsHelpBtn || !this.controlsHint) return;

    this.controlsHelpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setControlsHelpVisible(this.controlsHint.hidden);
    });

    this.controlsHint.addEventListener('click', (e) => e.stopPropagation());

    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.code !== 'KeyH') return;
      this.setControlsHelpVisible(this.controlsHint.hidden);
    });

    window.addEventListener('click', () => this.setControlsHelpVisible(false));
  }

  /** Aplica y notifica la visibilidad del panel de controles. */
  setControlsHelpVisible(visible, notify = true) {
    if (!this.controlsHint || !this.controlsHelpBtn) return;
    const shouldShow = Boolean(visible);
    this.controlsHint.hidden = !shouldShow;
    this.controlsHelpBtn.setAttribute('aria-expanded', String(shouldShow));
    this.controlsHelpBtn.textContent = shouldShow ? '▣ Ocultar controles' : '▣ Controles';
    if (notify && this.onControlsHelpVisibilityChanged) {
      this.onControlsHelpVisibilityChanged(shouldShow);
    }
  }

  /**
   * @param {object} item Objeto con `icon` y `name`
   * @param {string} verb Acción a mostrar (`recoger` o `hablar`)
   * @param {string} keys Pista de teclas en HTML
   */
  setInteractionPrompt(item, verb = 'recoger', keys = '<b>[E]</b> o <b>◇</b>') {
    if (!this.interactionPrompt) return;
    if (item) {
      this.interactionPrompt.style.display = 'block';
      this.interactionPrompt.classList.toggle('talk', verb === 'hablar');
      this.interactionPrompt.innerHTML = `Pulsa ${keys} para ${verb}: <b>${item.icon} ${item.name}</b>`;
    } else {
      this.interactionPrompt.style.display = 'none';
      this.interactionPrompt.classList.toggle('talk', false);
    }
  }

  setHeldItem(item) {
    if (!this.heldItemBar) return;
    if (item) {
      this.heldItemBar.style.display = 'flex';
      const actionText = item.isEdible ? '<b>[F]</b> o <b>✦</b> Comer' : '<b>[E]</b> o <b>◇</b> Soltar';
      this.heldItemBar.innerHTML = `<span>${item.icon} Llevas: <b>${item.name}</b> (${actionText})</span>`;
    } else {
      this.heldItemBar.style.display = 'none';
    }
  }

  /** Marca un botón como activo dentro de un grupo de opciones. */
  markActive(items, activeItem) {
    items.forEach((item) => item.classList.toggle('active', item === activeItem));
  }

  initFastTravel() {
    if (this.fastTravelBtn && this.fastTravelMenu) {
      this.fastTravelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = this.fastTravelMenu.style.display === 'flex';
        this.fastTravelMenu.style.display = isVisible ? 'none' : 'flex';
        if (this.cameraMenu) this.cameraMenu.style.display = 'none';
      });

      window.addEventListener('click', () => {
        this.fastTravelMenu.style.display = 'none';
      });

      const items = this.fastTravelMenu.querySelectorAll('.travel-item');
      items.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const posStr = btn.getAttribute('data-pos');
          if (posStr && this.onTeleportRequested) {
            const [x, y, z] = posStr.split(',').map(Number);
            const worldId = btn.dataset?.world || btn.getAttribute('data-world') || null;
            this.currentWorldId = worldId || 'central';
            this.markActive(items, btn);
            this.onTeleportRequested({ x, y, z, worldId });
            this.showToast(`⌖ Viajando a: ${btn.textContent.trim()}`, 'info');
          }
          this.fastTravelMenu.style.display = 'none';
        });
      });
    }
  }

  /** Selector declarativo de cámaras, espejo del menú de viaje rápido. */
  initCameraMenu() {
    if (!this.cameraBtn || !this.cameraMenu) return;

    this.cameraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = this.cameraMenu.style.display === 'flex';
      this.cameraMenu.style.display = isVisible ? 'none' : 'flex';
      if (this.fastTravelMenu) this.fastTravelMenu.style.display = 'none';
    });

    window.addEventListener('click', () => {
      this.cameraMenu.style.display = 'none';
    });

    const items = this.cameraMenu.querySelectorAll('.camera-item');
    items.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.dataset?.cameraMode || btn.getAttribute('data-camera-mode');
        if (mode && this.onCameraModeSelected) {
          this.currentCameraMode = mode;
          this.markActive(items, btn);
          this.onCameraModeSelected(mode);
          const label = btn.textContent.trim();
          this.showToast(`▣ Cámara: ${label}`, 'info');
        }
        this.cameraMenu.style.display = 'none';
      });
    });
  }

  /** Refleja el modo aplicado desde teclado o controles táctiles. */
  setCameraMode(modeId, label) {
    this.currentCameraMode = modeId;
    const items = Array.from(this.cameraMenu?.querySelectorAll('.camera-item') || []);
    const active = items.find((item) => (
      item.dataset?.cameraMode === modeId
      || item.getAttribute('data-camera-mode') === modeId
    ));
    if (active) this.markActive(items, active);
    if (label) this.cameraBtn.title = `Cambiar modo de cámara (C) · ${label}`;
  }

  updateHealth(current, max) {
    const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    if (this.healthBarFill) this.healthBarFill.style.width = `${percent}%`;

    if (this.healthContainer) {
      const level = percent > 50 ? 'high' : (percent > 20 ? 'mid' : 'low');
      this.healthContainer.dataset.level = level;
    }

    if (this.healthText) this.healthText.textContent = `${Math.round(current)} / ${max}`;
  }

  updateStamina(current, max) {
    const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
    if (this.staminaBarFill) this.staminaBarFill.style.width = `${percent}%`;

    if (this.staminaContainer) {
      this.staminaContainer.dataset.level = percent < 18 ? 'low' : 'normal';
    }

    if (this.staminaText) this.staminaText.textContent = `${Math.round(current)} / ${max}`;
  }

  updateStats(coins, deaths) {
    if (this.coinsDisplay) this.coinsDisplay.textContent = `Colones: ${coins}`;
    if (this.deathsDisplay) this.deathsDisplay.textContent = `${deaths}`;
  }

  /** Muestra ambas monedas en la barra superior. */
  updateWallet(coins, bitcoins) {
    if (this.coinsDisplay) this.coinsDisplay.textContent = `Colones: ${coins}`;
    if (this.bitcoinsDisplay) this.bitcoinsDisplay.textContent = `${bitcoins} BTC`;
  }

  updateDistance(meters) {
    const rounded = Math.round(meters);
    if (this.distanceDisplay && rounded !== this.lastDistance) {
      this.lastDistance = rounded;
      this.distanceDisplay.textContent = `${rounded} m`;
    }
  }

  updateBuildStatus(toolName, canPlace) {
    if (this.buildStatusText && toolName !== this.lastBuildLabel) {
      this.lastBuildLabel = toolName;
      this.buildStatusText.textContent = toolName;
    }

    const blocked = !canPlace;
    if (this.buildStatus && blocked !== this.lastBuildBlocked) {
      this.lastBuildBlocked = blocked;
      this.buildStatus.classList.toggle('blocked', blocked);
      this.buildCrosshair?.classList.toggle('can-place', !blocked);
    }
  }

  updateTime(period) {
    const labels = { mañana: 'Mañana', día: 'Día', tarde: 'Tarde', noche: 'Noche' };
    const icons = { mañana: '◐', día: '☀', tarde: '◑', noche: '☾' };

    if (this.timePeriod) this.timePeriod.textContent = labels[period] || period;
    if (this.timeIcon) this.timeIcon.textContent = icons[period] || '◈';
    this.timeChip?.classList.toggle('night', period === 'noche');
    this.lastPeriod = period;
  }

  updateLocation(locationName) {
    if (this.locationTag && this.currentLocation !== locationName) {
      this.currentLocation = locationName;
      this.locationTag.textContent = `⌖ ${locationName}`;
    }
  }

  showToast(message, type = 'info') {
    if (!this.toastElement) return;

    this.toastElement.textContent = message;
    this.toastElement.className = `toast-visible toast-${type}`;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastElement.className = `toast-hidden toast-${type}`;
    }, 2500);
  }

  showVictory(onRestart) {
    if (!this.victoryModal) return;

    this.victoryModal.style.display = 'flex';

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        this.victoryModal.style.display = 'none';
        if (onRestart) onRestart();
      };
    }
  }
}
