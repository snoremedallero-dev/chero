import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import {
  BLOCK_LIMIT,
  DEFAULT_ROOM,
  sanitizeBlock,
  sanitizeId,
  sanitizePlayerState,
  sanitizeRoom
} from '../src/net/protocol.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STATIC_DIR = path.resolve(HERE, '..', 'dist');
const PLAYER_STATE_INTERVAL_MS = 50;

/**
 * Aplica Socket.io sobre un servidor HTTP existente y mantiene el estado
 * canónico por sala. Se puede probar sin abrir un puerto real.
 */
export function attachNetwork(server, { playerInterval = PLAYER_STATE_INTERVAL_MS } = {}) {
  const io = new Server(server, {
    cors: { origin: true, credentials: true }
  });
  const rooms = new Map();

  const getRoom = (name) => {
    if (!rooms.has(name)) rooms.set(name, { blocks: new Map(), players: new Map() });
    return rooms.get(name);
  };

  const snapshot = (room) => ({
    blocks: [...room.blocks.values()],
    players: [...room.players.entries()]
      .filter(([, player]) => player.state)
      .map(([id, player]) => ({ id, state: player.state }))
  });

  const joinRoom = (socket, requested, room) => {
    const name = sanitizeRoom(requested);
    if (socket.data.roomName && socket.data.roomName !== name) {
      const previous = getRoom(socket.data.roomName);
      previous.players.delete(socket.id);
      socket.to(socket.data.roomName).emit('player:leave', { id: socket.id });
      socket.leave(socket.data.roomName);
    }

    socket.data.roomName = name;
    socket.join(name);
    room.players.set(socket.id, { state: null, lastStateAt: 0 });
    socket.emit('world:state', snapshot(room));
    socket.to(name).emit('player:join', { id: socket.id });
    return name;
  };

  io.on('connection', (socket) => {
    const name = joinRoom(socket, DEFAULT_ROOM, getRoom(DEFAULT_ROOM));

    socket.on('world:join', (payload, ack) => {
      const target = sanitizeRoom(payload?.room);
      joinRoom(socket, target, getRoom(target));
      if (typeof ack === 'function') ack({ ok: true, room: target });
    });

    socket.on('player:state', (payload) => {
      const state = sanitizePlayerState(payload);
      if (!state) return;
      const room = getRoom(socket.data.roomName || name);
      const player = room.players.get(socket.id);
      if (!player) return;

      const now = Date.now();
      if (now - player.lastStateAt < playerInterval) return;
      player.lastStateAt = now;
      player.state = state;
      socket.to(socket.data.roomName || name).emit('player:state', { id: socket.id, state });
    });

    socket.on('block:place', (payload, ack) => {
      const block = sanitizeBlock(payload, true);
      const room = getRoom(socket.data.roomName || name);
      if (!block || room.blocks.has(block.id) || room.blocks.size >= BLOCK_LIMIT) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      room.blocks.set(block.id, block);
      socket.to(socket.data.roomName || name).emit('block:place', block);
      if (typeof ack === 'function') ack({ ok: true, id: block.id });
    });

    socket.on('block:remove', (payload, ack) => {
      const id = sanitizeId(typeof payload === 'string' ? payload : payload?.id);
      const room = getRoom(socket.data.roomName || name);
      const removed = id ? room.blocks.delete(id) : false;
      if (removed) socket.to(socket.data.roomName || name).emit('block:remove', { id });
      if (typeof ack === 'function') ack({ ok: removed });
    });

    socket.on('disconnect', () => {
      const roomName = socket.data.roomName || name;
      const room = rooms.get(roomName);
      if (room) {
        room.players.delete(socket.id);
        if (room.players.size === 0 && room.blocks.size === 0) rooms.delete(roomName);
      }
      socket.to(roomName).emit('player:leave', { id: socket.id });
    });
  });

  io.cheroRooms = rooms;
  return { io, rooms };
}

export function createApp(staticDir = DEFAULT_STATIC_DIR, getStats = () => ({ rooms: 0, players: 0 })) {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ ok: true, server: 'chero-world', ...getStats() });
  });

  app.use(express.static(staticDir));
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  return app;
}

/** Arranca HTTP + Socket.io. Solo se llama al ejecutar este archivo directamente. */
export function startServer({ port = Number(process.env.PORT) || 3001, staticDir = DEFAULT_STATIC_DIR } = {}) {
  let network = { rooms: new Map() };
  const app = createApp(staticDir, () => ({
    rooms: network.rooms.size,
    players: [...network.rooms.values()].reduce((sum, room) => sum + room.players.size, 0)
  }));
  const server = http.createServer(app);
  network = attachNetwork(server);
  server.cheroNetwork = network;

  server.listen(port, () => {
    console.log(`◈ Chero World servidor listo en http://localhost:${port}`);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
