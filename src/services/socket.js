import { io } from 'socket.io-client';

// Generate or retrieve persistent player ID
export function getLocalPlayer() {
  const storedId = localStorage.getItem('doxcards_player_id');
  const storedName = localStorage.getItem('doxcards_player_name');
  const storedColor = localStorage.getItem('doxcards_player_color');

  const id = storedId || 'p_' + Math.random().toString(36).substring(2, 9);
  if (!storedId) localStorage.setItem('doxcards_player_id', id);

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    id,
    name: storedName || `oyuncu_${id.substring(2, 6)}`,
    color: storedColor || randomColor
  };
}

export function saveLocalPlayer(player) {
  if (player.name) localStorage.setItem('doxcards_player_name', player.name);
  if (player.color) localStorage.setItem('doxcards_player_color', player.color);
}

// Server URL (can be Cloudflare Worker URL or Socket.io server URL)
const RAW_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://doxcards-server.burakcnaydin.workers.dev'
);

function generateClientRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Hybrid Socket Adapter supporting Cloudflare Worker Durable Object WebSockets and Socket.IO
class UniversalSocket {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.isWs = baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://') || baseUrl.includes('.workers.dev');
    this.listeners = new Map();
    this.pendingAcks = new Map();
    this.currentRoomCode = null;

    if (this.isWs) {
      this.initWs('GLOBAL');
    } else {
      this.io = io(this.baseUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
    }
  }

  initWs(roomCode = 'GLOBAL', onOpenCallback = null) {
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {}
    }

    this.currentRoomCode = roomCode;
    let wsUrl = this.baseUrl;
    if (wsUrl.startsWith('http://')) wsUrl = wsUrl.replace('http://', 'ws://');
    if (wsUrl.startsWith('https://')) wsUrl = wsUrl.replace('https://', 'wss://');
    wsUrl = wsUrl.replace(/\/$/, '') + `/ws?room=${encodeURIComponent(roomCode)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`[Worker WS Connected to room ${roomCode}]`);
        if (onOpenCallback) onOpenCallback();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ackId && this.pendingAcks.has(msg.ackId)) {
            const cb = this.pendingAcks.get(msg.ackId);
            this.pendingAcks.delete(msg.ackId);
            cb(msg.response);
          } else if (msg.event) {
            const handlers = this.listeners.get(msg.event) || [];
            handlers.forEach(fn => fn(msg.data));
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Worker WS Error]:', err);
      };

      this.ws.onclose = () => {
        setTimeout(() => {
          if (this.currentRoomCode === roomCode) {
            this.initWs(roomCode);
          }
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to init WebSocket:', err);
    }
  }

  on(event, callback) {
    if (this.io) {
      this.io.on(event, callback);
    } else {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.io) {
      this.io.off(event, callback);
    } else {
      if (!callback) {
        this.listeners.delete(event);
      } else {
        const handlers = this.listeners.get(event) || [];
        this.listeners.set(event, handlers.filter(fn => fn !== callback));
      }
    }
  }

  emit(event, data, callback) {
    if (this.io) {
      this.io.emit(event, data, callback);
      return;
    }

    // When creating a room on Cloudflare Worker:
    if (event === 'create_room') {
      const code = generateClientRoomCode();
      const sendCreate = () => {
        const ackId = callback ? 'ack_' + Math.random().toString(36).substring(2, 9) : null;
        if (ackId) this.pendingAcks.set(ackId, callback);
        this.ws.send(JSON.stringify({ event, data: { ...data, roomCode: code }, ackId }));
      };

      this.initWs(code, sendCreate);
      return;
    }

    // When joining a room on Cloudflare Worker:
    if (event === 'join_room') {
      const code = (data.roomCode || '').toUpperCase().trim();
      const sendJoin = () => {
        const ackId = callback ? 'ack_' + Math.random().toString(36).substring(2, 9) : null;
        if (ackId) this.pendingAcks.set(ackId, callback);
        this.ws.send(JSON.stringify({ event, data, ackId }));
      };

      this.initWs(code, sendJoin);
      return;
    }

    // General game events:
    const ackId = callback ? 'ack_' + Math.random().toString(36).substring(2, 9) : null;
    if (ackId) this.pendingAcks.set(ackId, callback);

    const payload = JSON.stringify({ event, data, ackId });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      if (callback) {
        setTimeout(() => callback({ error: 'Sunucu bağlantısı bekleniyor...' }), 1000);
      }
    }
  }
}

export const socket = new UniversalSocket(RAW_URL);
