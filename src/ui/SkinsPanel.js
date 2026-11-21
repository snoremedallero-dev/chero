import { SKINS } from '../data/SkinCatalog.js';
import { COLONES_PER_BITCOIN } from '../economy/Wallet.js';

/**
 * Panel de skins: inventario, tienda (colones o bitcoins) y estado de las
 * misiones de leyendas. Construye sus tarjetas con DOM plano, sin framework.
 */
export class SkinsPanel {
  constructor() {
    this.panel = document.getElementById('skins-panel');
    this.openButton = document.getElementById('skins-btn');
    this.closeButton = document.getElementById('skins-close-btn');
    this.colonesText = document.getElementById('skins-colones');
    this.bitcoinsText = document.getElementById('skins-bitcoins');
    this.grid = document.getElementById('skins-grid');
    this.convertBtcBtn = document.getElementById('convert-btc-btn');
    this.convertColonesBtn = document.getElementById('convert-colones-btn');

    this.onBuy = null;
    this.onEquip = null;
    this.onConvert = null;
    this.onToggle = null;

    // El botón de la barra superior lo gestiona HUD.onSkinsToggle para no
    // duplicar el evento; aquí solo se encarga el cierre del panel.

    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle(false);
      });
    }

    if (this.convertBtcBtn) {
      this.convertBtcBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onConvert) this.onConvert('to-bitcoins');
      });
    }

    if (this.convertColonesBtn) {
      this.convertColonesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onConvert) this.onConvert('to-colones');
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyB') {
        e.preventDefault();
        this.toggle();
      } else if (e.code === 'Escape' && this.isOpen) {
        this.toggle(false);
      }
    });
  }

  get isOpen() {
    return Boolean(this.panel && this.panel.style.display === 'flex');
  }

  toggle(force) {
    if (!this.panel) return;
    const open = force === undefined ? !this.isOpen : Boolean(force);
    this.panel.style.display = open ? 'flex' : 'none';
    if (this.onToggle) this.onToggle(open);
  }

  makeButton(label, className, handler) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      handler();
    });
    return button;
  }

  makeCard(skin, wallet, collection, quests, progress) {
    const owned = collection.has(skin.id);
    const equipped = collection.equipped === skin.id;

    const card = document.createElement('div');
    card.className = `skin-card${equipped ? ' equipped' : owned ? ' owned' : ' locked'}`;

    const swatch = document.createElement('div');
    swatch.className = 'skin-swatch';
    swatch.style.backgroundColor = `#${skin.palette.torso.toString(16).padStart(6, '0')}`;
    swatch.style.borderColor = `#${skin.palette.sash.toString(16).padStart(6, '0')}`;
    card.appendChild(swatch);

    const info = document.createElement('div');
    info.className = 'skin-info';

    const title = document.createElement('div');
    title.className = 'skin-name';
    title.textContent = `${skin.icon} ${skin.name}`;
    info.appendChild(title);

    const description = document.createElement('div');
    description.className = 'skin-description';
    description.textContent = skin.description;
    info.appendChild(description);

    const actions = document.createElement('div');
    actions.className = 'skin-actions';

    if (equipped) {
      const badge = document.createElement('span');
      badge.className = 'skin-badge';
      badge.textContent = '✦ EQUIPADO';
      actions.appendChild(badge);
    } else if (owned) {
      actions.appendChild(this.makeButton('EQUIPAR', 'skin-equip-btn', () => {
        if (this.onEquip) this.onEquip(skin.id);
      }));
    } else if (skin.source === 'quest' && quests) {
      const infoQuest = quests.describe(skin.questId);
      const badge = document.createElement('span');
      badge.className = 'skin-badge quest';
      if (infoQuest) {
        const { def, state } = infoQuest;
        badge.textContent = state.claimed
          ? '◇ RECLAMADA'
          : state.progress >= def.goal.amount
            ? `✦ HABLA CON ${def.npc.toUpperCase()}`
            : `${Math.floor(state.progress)}/${def.goal.amount} · ${def.npc}`;
      } else {
        badge.textContent = '◇ MISIÓN';
      }
      actions.appendChild(badge);
    } else if (skin.source === 'mission') {
      const meta = progress && progress.progressFor(skin);
      const badge = document.createElement('span');
      badge.className = 'skin-badge quest';
      badge.textContent = meta ? `◇ ${meta.current}/${meta.target} · ${meta.label}` : '◇ MISIÓN';
      actions.appendChild(badge);
    } else if (skin.source === 'shop' && skin.price) {
      if (skin.price.colones) {
        actions.appendChild(this.makeButton(
          `◆ ${skin.price.colones}`,
          'skin-buy-btn colones',
          () => { if (this.onBuy) this.onBuy(skin.id, 'colones'); }
        ));
      }
      if (skin.price.bitcoins) {
        actions.appendChild(this.makeButton(
          `₿ ${skin.price.bitcoins}`,
          'skin-buy-btn bitcoins',
          () => { if (this.onBuy) this.onBuy(skin.id, 'bitcoins'); }
        ));
      }
    }

    info.appendChild(actions);
    card.appendChild(info);
    return card;
  }

  /**
   * Redibuja el panel con el estado actual.
   * @param {Wallet} wallet
   * @param {SkinCollection} collection
   * @param {LegendQuests} quests
   * @param {SpriteProgress} [progress] Progreso de los sprites de misión
   */
  refresh(wallet, collection, quests, progress) {
    if (this.colonesText) this.colonesText.textContent = String(wallet.colones);
    if (this.bitcoinsText) this.bitcoinsText.textContent = String(wallet.bitcoins);
    if (!this.grid) return;

    this.grid.innerHTML = '';
    SKINS.forEach((skin) => {
      this.grid.appendChild(this.makeCard(skin, wallet, collection, quests, progress));
    });

    const rate = this.panel?.querySelector('.wallet-rate');
    if (rate) rate.textContent = `1 ₿ = ${COLONES_PER_BITCOIN} ◆`;
  }
}
