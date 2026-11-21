import { DEFAULT_SKIN_ID, SPRITES, TOTAL_SPRITES } from '../data/SkinCatalog.js';

/** Pantalla de inicio: elige un sprite entre 100 y consulta los requisitos. */
export class StartScreen {
  constructor({ collection, progress } = {}) {
    this.collection = collection;
    this.progress = progress;

    this.root = document.getElementById('start-screen');
    this.grid = document.getElementById('start-sprite-grid');
    this.counter = document.getElementById('start-counter');
    this.previewSwatch = document.getElementById('start-preview-swatch');
    this.previewName = document.getElementById('start-selected-name');
    this.previewDesc = document.getElementById('start-selected-desc');
    this.enterBtn = document.getElementById('start-enter-btn');
    this.closeBtn = document.getElementById('start-close-btn');

    this.selectedId = collection?.equipped || DEFAULT_SKIN_ID;
    this.canClose = false;
    this.onSelect = null;
    this.onStart = null;

    if (this.enterBtn) {
      this.enterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.finish();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });
    }
  }

  get isOpen() {
    return Boolean(this.root && this.root.style.display !== 'none');
  }

  open(canClose = false) {
    this.canClose = Boolean(canClose);
    if (this.root) this.root.style.display = 'flex';
    if (this.closeBtn) this.closeBtn.hidden = !this.canClose;
    if (this.enterBtn) {
      this.enterBtn.textContent = this.canClose ? '◈ VOLVER AL JUEGO' : '◈ ENTRAR AL MUNDO';
    }
    this.render();
  }

  close() {
    if (!this.canClose) return;
    if (this.root) this.root.style.display = 'none';
    this.canClose = false;
    if (this.onStart) this.onStart();
  }

  finish() {
    if (this.root) this.root.style.display = 'none';
    this.canClose = false;
    if (this.onSelect) this.onSelect(this.selectedId);
    if (this.onStart) this.onStart();
  }

  select(id) {
    if (!this.collection || !this.collection.has(id)) return false;
    this.selectedId = id;
    if (this.onSelect) this.onSelect(id);
    this.render();
    return true;
  }

  makeCard(sprite) {
    const unlocked = Boolean(this.collection && this.collection.has(sprite.id));
    const selected = sprite.id === this.selectedId;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `start-sprite-card${unlocked ? '' : ' locked'}${selected ? ' selected' : ''}`;
    card.dataset.spriteId = sprite.id;
    card.disabled = !unlocked;

    const swatch = document.createElement('span');
    swatch.className = 'start-sprite-swatch';
    swatch.style.backgroundColor = hexColor(sprite.palette.torso);
    swatch.style.borderColor = hexColor(sprite.palette.sash);
    card.appendChild(swatch);

    const glyph = document.createElement('span');
    glyph.className = 'start-sprite-glyph';
    glyph.textContent = sprite.icon;
    card.appendChild(glyph);

    const name = document.createElement('span');
    name.className = 'start-sprite-name';
    name.textContent = sprite.name;
    card.appendChild(name);

    const status = document.createElement('span');
    status.className = 'start-sprite-status';
    status.textContent = this.statusFor(sprite, unlocked, selected);
    card.appendChild(status);

    if (unlocked) {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select(sprite.id);
      });
    }
    return card;
  }

  statusFor(sprite, unlocked, selected) {
    if (!unlocked) {
      const progress = this.progress && this.progress.progressFor(sprite);
      if (progress) return `◇ ${progress.current}/${progress.target} · ${progress.label}`;
      if (sprite.source === 'quest') return `◇ MISIÓN: ${sprite.description}`;
      return `◆ ${sprite.description}`;
    }
    if (selected) return '✦ SELECCIONADO';
    if (sprite.source === 'starter') return '◈ INICIAL';
    return '◈ DISPONIBLE';
  }

  render() {
    if (!this.collection || !this.progress) return;

    const ownedCount = SPRITES.filter((sprite) => this.collection.has(sprite.id)).length;
    if (this.counter) {
      this.counter.textContent = `${ownedCount} / ${TOTAL_SPRITES} sprites desbloqueados`;
    }

    if (this.grid) {
      this.grid.innerHTML = '';
      SPRITES.forEach((sprite) => {
        this.grid.appendChild(this.makeCard(sprite));
      });
    }

    this.renderPreview();
  }

  renderPreview() {
    const activeId = this.collection.has(this.selectedId) ? this.selectedId : DEFAULT_SKIN_ID;
    const selected = SPRITES.find((item) => item.id === activeId);

    if (!selected) return;
    if (this.previewSwatch) {
      this.previewSwatch.style.backgroundColor = hexColor(selected.palette.torso);
      this.previewSwatch.style.borderColor = hexColor(selected.palette.sash);
    }
    if (this.previewName) this.previewName.textContent = `${selected.icon} ${selected.name}`;
    if (this.previewDesc) this.previewDesc.textContent = selected.description;
  }
}

function hexColor(value) {
  return `#${Number(value).toString(16).padStart(6, '0')}`;
}
