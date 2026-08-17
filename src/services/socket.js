import { io } from 'socket.io-client';

// Generate or retrieve persistent player ID
export function getLocalPlayer() {
  const storedId = localStorage.getItem('doxcards_player_id');
  const storedName = localStorage.getItem('doxcards_player_name');
  const storedColor = localStorage.getItem('doxcards_player_color');
  const storedAvatar = localStorage.getItem('doxcards_player_avatar');

  const id = storedId || 'p_' + Math.random().toString(36).substring(2, 9);
  if (!storedId) localStorage.setItem('doxcards_player_id', id);

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    id,
    name: storedName || `oyuncu_${id.substring(2, 6)}`,
    color: storedColor || randomColor,
    avatar: storedAvatar || null
  };
}

export function saveLocalPlayer(player) {
  if (player.name) localStorage.setItem('doxcards_player_name', player.name);
  if (player.color) localStorage.setItem('doxcards_player_color', player.color);
  if (player.avatar) localStorage.setItem('doxcards_player_avatar', player.avatar);
  else localStorage.removeItem('doxcards_player_avatar');
}

// Server URL (can be Cloudflare Worker URL or Socket.io server URL)
const RAW_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://doxcards-server.burakcnaydin.workers.dev'
);

function generateClientRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Robust Universal Socket Adapter with Heartbeat & Auto-Reconnection
class UniversalSocket {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.isWs = baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://') || baseUrl.includes('.workers.dev');
    this.listeners = new Map();
    this.pendingAcks = new Map();
    this.currentRoomCode = null;
    this.lastJoinedRoomCode = null;
    this.lastJoinedPlayerData = null;
    this.messageQueue = [];
    this.pingInterval = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.isIntentionalClose = false;

    if (this.isWs) {
      this.initWs('global');
    } else {
      this.io = io(this.baseUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000
      });
    }
  }

  initWs(roomCode = 'global', onOpenCallback = null) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.close();
      } catch (e) {}
    }

    const normalizedRoom = (roomCode || 'global').toLowerCase().trim();
    this.currentRoomCode = normalizedRoom;
    this.isIntentionalClose = false;

    let wsUrl = this.baseUrl
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://');

    if (!wsUrl.endsWith('/ws')) {
      wsUrl += (wsUrl.includes('?') ? '&' : '?') + `room=${encodeURIComponent(normalizedRoom)}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;

        // Start Keep-Alive Ping every 10 seconds (prevents Cloudflare 1006 idle drop)
        this.startHeartbeat();

        if (onOpenCallback) onOpenCallback();

        // If we were previously in a room, re-join/reconnect to keep state synchronized
        if (this.lastJoinedRoomCode && this.lastJoinedPlayerData && this.lastJoinedRoomCode === this.currentRoomCode) {
          const reconnectPayload = JSON.stringify({
            event: 'join_room',
            data: {
              roomCode: this.lastJoinedRoomCode,
              player: this.lastJoinedPlayerData,
              isReconnect: true
            }
          });
          try {
            this.ws.send(reconnectPayload);
          } catch (e) {}
        }

        // Flush message queue
        while (this.messageQueue.length > 0) {
          const item = this.messageQueue.shift();
          try {
            this.ws.send(item);
          } catch (e) {}
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          // Ignore pong heartbeats
          if (msg.event === 'pong') {
            return;
          }

          if (msg.ackId && this.pendingAcks.has(msg.ackId)) {
            const cb = this.pendingAcks.get(msg.ackId);
            this.pendingAcks.delete(msg.ackId);
            cb(msg.response);
          } else if (msg.event && this.listeners.has(msg.event)) {
            const handlers = this.listeners.get(msg.event);
            handlers.forEach(fn => fn(msg.data));
          }
        } catch (e) {
          console.error('[Worker WS] Message parse error:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.error('[Worker WS Error]:', err);
      };

      this.ws.onclose = (e) => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        console.log('[Worker WS Closed]', e.code, e.reason);

        // Auto-reconnect on unexpected closure (e.g. 1006 idle or temporary edge blip)
        if (!this.isIntentionalClose && this.currentRoomCode && this.currentRoomCode !== 'global') {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('Failed to init WebSocket:', err);
      if (!this.isIntentionalClose && this.currentRoomCode && this.currentRoomCode !== 'global') {
        this.scheduleReconnect();
      }
    }
  }

  startHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ event: 'ping', data: { time: Date.now() } }));
        } catch (e) {}
      }
    }, 10000); // 10 seconds keepalive
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.3, this.reconnectAttempts - 1), 4000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionalClose && this.currentRoomCode) {
        console.log(`[Worker WS] Attempting auto-reconnect (${this.reconnectAttempts})...`);
        this.initWs(this.currentRoomCode);
      }
    }, delay);
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

    const ackId = callback ? 'ack_' + Math.random().toString(36).substring(2, 9) : null;
    if (ackId) this.pendingAcks.set(ackId, callback);

    // 1. Create Room: generate code and connect to that DO room
    if (event === 'create_room') {
      const code = (data.roomCode || generateClientRoomCode()).toLowerCase().trim();
      this.lastJoinedRoomCode = code;
      this.lastJoinedPlayerData = data.player;

      const sendPayload = JSON.stringify({ event, data: { ...data, roomCode: code }, ackId });

      this.initWs(code, () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(sendPayload);
        }
      });
      return;
    }

    // 2. Join Room: connect to that DO room and join
    if (event === 'join_room') {
      const code = (data.roomCode || '').toLowerCase().trim();
      this.lastJoinedRoomCode = code;
      this.lastJoinedPlayerData = data.player;

      const sendPayload = JSON.stringify({ event, data: { ...data, roomCode: code }, ackId });

      this.initWs(code, () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(sendPayload);
        }
      });
      return;
    }

    // 3. Leave Room: intentional exit
    if (event === 'leave_room') {
      this.isIntentionalClose = true;
      this.lastJoinedRoomCode = null;
      this.lastJoinedPlayerData = null;
      const payload = JSON.stringify({ event, data, ackId });
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      }
      return;
    }

    // 4. General Events
    const payload = JSON.stringify({ event, data, ackId });
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(payload);
      } catch (e) {
        this.messageQueue.push(payload);
      }
    } else {
      this.messageQueue.push(payload);
    }
  }
}

export const socket = new UniversalSocket(RAW_URL);
