import { DEFAULT_ROOM, sanitizeBlock, sanitizeId, sanitizePlayerState, sanitizeRoom } from './protocol.js';

/**
 * Cliente de red del juego. Detecta si la página la sirve nuestro servidor
 * Socket.io; si no (por ejemplo, en `npm run dev`), queda inactivo y el juego
 * sigue funcionando en solitario sin lanzar errores visibles.
 */
export class NetworkClient {
  constructor({
    socketFactory = null,
    fetchImpl = globalThis.fetch,
    probeUrl = '/health',
    room = DEFAULT_ROOM,
    timeout = 2500
  } = {}) {
    this.socketFactory = socketFactory;
    this.fetchImpl = fetchImpl;
    this.probeUrl = probeUrl;
    this.room = sanitizeRoom(room);
    this.timeout = timeout;
    this.socket = null;
    this.connected = false;
    this.connecting = false;

    this.onStatus = null;
    this.onWorldState = null;
    this.onPlayerJoin = null;
    this.onPlayerState = null;
    this.onPlayerLeave = null;
    this.onBlockPlaced = null;
    this.onBlockRemoved = null;
  }

  /** Comprueba `/health` para no intentar Socket.io contra Vite u otro host. */
  async detectServer() {
    if (typeof this.fetchImpl !== 'function') return false;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), this.timeout) : null;
    try {
      const response = await this.fetchImpl(this.probeUrl, controller ? { signal: controller.signal } : {});
      if (!response.ok) return false;
      const contentType = response.headers?.get?.('content-type') || '';
      if (!contentType.includes('application/json')) return false;
      const info = await response.json();
      return info?.ok === true && info.server === 'chero-world';
    } catch {
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async connect() {
    if (this.connected || this.connecting) return this.connected;
    this.connecting = true;
    try {
      if (!(await this.detectServer())) {
        this.onStatus?.(false, 'sin-servidor');
        return false;
      }
      const io = this.socketFactory || (await import('socket.io-client')).io;
      this.socket = io({
        transports: ['websocket', 'polling'],
        timeout: this.timeout,
        reconnectionAttempts: 1
      });
      this.bindSocket();
      return true;
    } catch {
      this.onStatus?.(false, 'sin-servidor');
      return false;
    } finally {
      this.connecting = false;
    }
  }

  bindSocket() {
    this.socket.on('connect', () => {
      this.connected = true;
      this.socket.emit('world:join', { room: this.room });
      this.onStatus?.(true, 'conectado');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.onStatus?.(false, 'desconectado');
    });

    this.socket.on('connect_error', () => {
      this.connected = false;
      this.onStatus?.(false, 'sin-servidor');
    });

    this.socket.on('world:state', (state) => this.onWorldState?.(state));

    this.socket.on('player:join', ({ id }) => this.onPlayerJoin?.(id));

    this.socket.on('player:state', ({ id, state }) => {
      const clean = sanitizePlayerState(state);
      if (clean) this.onPlayerState?.(id, clean);
    });

    this.socket.on('player:leave', ({ id }) => this.onPlayerLeave?.(id));

    this.socket.on('block:place', (block) => {
      const clean = sanitizeBlock(block);
      if (clean) this.onBlockPlaced?.(clean);
    });

    this.socket.on('block:remove', ({ id }) => {
      const clean = sanitizeId(id);
      if (clean) this.onBlockRemoved?.(clean);
    });
  }

  setRoom(room) {
    this.room = sanitizeRoom(room);
    if (this.connected) this.socket.emit('world:join', { room: this.room });
  }

  sendPlayerState(state) {
    if (!this.connected) return;
    const clean = sanitizePlayerState(state);
    if (clean) this.socket.emit('player:state', clean);
  }

  sendBlockPlaced(block) {
    if (!this.connected) return;
    const clean = sanitizeBlock(block);
    if (clean) this.socket.emit('block:place', clean);
  }

  sendBlockRemoved(id) {
    if (!this.connected) return;
    const clean = sanitizeId(id);
    if (clean) this.socket.emit('block:remove', { id: clean });
  }

  disconnect() {
    this.connected = false;
    this.socket?.disconnect?.();
    this.socket = null;
  }
}
