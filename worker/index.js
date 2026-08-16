// Cloudflare Worker Multiplayer Game Server with Durable Objects for DoxCards (Red Flags)
import { getDeck } from './cards.js';
import { GameEngine, PHASES } from './gameEngine.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Global In-Memory Fallback Map (for non-DO environments)
const globalRooms = new Map();

// Durable Object class for 100% synchronized stateful multiplayer rooms
export class GameRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null;
    this.sessions = new Map(); // serverWs -> playerId
  }

  async fetch(request) {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade') || request.headers.get('upgrade');

    if (upgradeHeader?.toLowerCase() === 'websocket' || url.pathname.startsWith('/ws')) {
      const pair = new WebSocketPair();
      const [clientWs, serverWs] = Object.values(pair);

      serverWs.accept();
      this.setupSocket(serverWs);

      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return new Response(JSON.stringify({
      status: 'ok',
      room: this.room ? this.room.code : null,
      playersCount: this.room ? this.room.players.length : 0
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  setupSocket(serverWs) {
    let playerId = null;

    serverWs.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { event: evt, data, ackId } = msg;

        const sendAck = (response) => {
          if (ackId) {
            serverWs.send(JSON.stringify({ ackId, response }));
          }
        };

        // 1. Create Room
        if (evt === 'create_room') {
          const { player, settings, roomCode } = data;
          const code = (roomCode || generateRoomCode()).toUpperCase();

          const initialSettings = {
            targetScore: settings?.targetScore || 3,
            turnTimeSeconds: settings?.turnTimeSeconds || 45,
            allowCustomCards: false,
            isPrivate: true,
            deckType: 'all',
            maxPlayers: 6
          };

          this.room = {
            code,
            hostId: player.id,
            players: [{ ...player, isHost: true, isReady: true, score: 0 }],
            settings: initialSettings,
            game: null,
            messages: []
          };

          playerId = player.id;
          this.sessions.set(serverWs, player.id);

          sendAck({
            success: true,
            roomCode: code,
            room: {
              code,
              hostId: this.room.hostId,
              players: this.room.players,
              settings: this.room.settings
            },
            player: this.room.players[0]
          });

          this.broadcastRoomUpdate();
        }

        // 2. Join Room
        else if (evt === 'join_room') {
          const { player, roomCode } = data;

          if (!this.room) {
            // Auto-create room placeholder if directly connecting with room code
            const code = (roomCode || 'ROOM').toUpperCase();
            this.room = {
              code,
              hostId: player.id,
              players: [{ ...player, isHost: true, isReady: true, score: 0 }],
              settings: { targetScore: 3, turnTimeSeconds: 45, maxPlayers: 6 },
              game: null,
              messages: []
            };
          } else {
            if (this.room.players.length >= (this.room.settings?.maxPlayers || 6)) {
              sendAck({ error: 'Oda dolu (Maksimum 6 oyuncu).' });
              return;
            }

            const existingIdx = this.room.players.findIndex(p => p.id === player.id);
            if (existingIdx !== -1) {
              this.room.players[existingIdx].name = player.name;
              this.room.players[existingIdx].color = player.color;
            } else {
              this.room.players.push({
                ...player,
                isHost: false,
                isReady: false,
                score: 0
              });
            }
          }

          playerId = player.id;
          this.sessions.set(serverWs, player.id);

          const joinedPlayer = this.room.players.find(p => p.id === player.id);

          sendAck({
            success: true,
            roomCode: this.room.code,
            room: {
              code: this.room.code,
              hostId: this.room.hostId,
              players: this.room.players,
              settings: this.room.settings
            },
            player: joinedPlayer
          });

          this.broadcastRoomUpdate();
          if (this.room.game) this.broadcastGameState();
        }

        // 3. Start Game
        else if (evt === 'start_game') {
          const { playerId: pId } = data;
          if (!this.room) return;

          if (this.room.hostId !== pId) {
            sendAck({ error: 'Sadece oda kurucusu oyunu başlatabilir.' });
            return;
          }

          if (this.room.players.length < 3) {
            sendAck({ error: 'Red Flags oynamak için en az 3 oyuncu gereklidir.' });
            return;
          }

          this.room.game = new GameEngine(this.room.players, this.room.settings);
          this.room.game.onStateChange = () => {
            this.broadcastGameState();
          };

          this.broadcast('game_started', {});
          this.broadcastGameState();
          sendAck({ success: true });
        }

        // 4. Submit Perks
        else if (evt === 'submit_perks') {
          const { playerId: pId, cardIds } = data;
          if (!this.room || !this.room.game) return;

          const ok = this.room.game.submitPerks(pId, cardIds);
          if (ok) {
            this.broadcastGameState();
            sendAck({ success: true });
          } else {
            sendAck({ error: 'Kartlar seçilemedi.' });
          }
        }

        // 5. Submit Sabotage
        else if (evt === 'submit_sabotage') {
          const { playerId: pId, cardId } = data;
          if (!this.room || !this.room.game) return;

          const ok = this.room.game.submitSabotage(pId, cardId, this.room.players);
          if (ok) {
            this.broadcastGameState();
            sendAck({ success: true });
          } else {
            sendAck({ error: 'Sabotaj kartı gönderilemedi.' });
          }
        }

        // 6. Select Winner
        else if (evt === 'bekar_select_winner') {
          const { singlePlayerId, winningMatchmakerId } = data;
          if (!this.room || !this.room.game) return;

          const ok = this.room.game.bekarSelectWinner(singlePlayerId, winningMatchmakerId, this.room.players);
          if (ok) {
            this.broadcastGameState();
            sendAck({ success: true });
          }
        }

        // 7. Toggle Ready
        else if (evt === 'toggle_ready') {
          const { playerId: pId } = data;
          if (!this.room) return;
          const p = this.room.players.find(x => x.id === pId);
          if (p) {
            p.isReady = !p.isReady;
            this.broadcastRoomUpdate();
          }
        }

        // 8. Update Settings
        else if (evt === 'update_settings') {
          const { settings } = data;
          if (!this.room) return;
          this.room.settings = { ...this.room.settings, ...settings };
          this.broadcastRoomUpdate();
        }

        // 9. Play Again
        else if (evt === 'play_again') {
          if (!this.room) return;
          if (this.room.game) {
            this.room.game.clearTimer();
            this.room.game = null;
          }
          this.room.players.forEach(p => { p.isReady = false; });
          this.broadcast('game_reset_to_lobby', {});
          this.broadcastRoomUpdate();
        }

        // 10. Send Chat Message
        else if (evt === 'send_message') {
          const { message } = data;
          if (!this.room) return;

          const fullMsg = {
            id: 'msg_' + Math.random().toString(36).substring(2, 9),
            senderId: message.senderId,
            senderName: message.senderName,
            senderColor: message.senderColor || '#ffffff',
            text: message.text,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            isSystem: !!message.isSystem
          };

          this.room.messages.push(fullMsg);
          this.broadcast('new_message', fullMsg);
        }

        // 11. Send Reaction
        else if (evt === 'send_reaction') {
          const { reaction, senderName } = data;
          this.broadcast('reaction_received', {
            reaction,
            senderName,
            id: Math.random().toString(36).substring(2, 7)
          });
        }
      } catch (err) {
        console.error('DO message error:', err);
      }
    });

    serverWs.addEventListener('close', () => {
      this.sessions.delete(serverWs);
      if (playerId && this.room) {
        this.room.players = this.room.players.filter(p => p.id !== playerId);
        if (this.room.players.length === 0) {
          if (this.room.game) this.room.game.clearTimer();
          this.room = null;
        } else {
          if (this.room.hostId === playerId) {
            this.room.hostId = this.room.players[0].id;
            this.room.players[0].isHost = true;
          }
          this.broadcastRoomUpdate();
        }
      }
    });
  }

  broadcast(event, data) {
    const payload = JSON.stringify({ event, data });
    this.sessions.forEach((pId, ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(payload);
        } catch (e) {}
      }
    });
  }

  broadcastRoomUpdate() {
    if (!this.room) return;
    this.broadcast('room_updated', {
      code: this.room.code,
      hostId: this.room.hostId,
      players: this.room.players,
      settings: this.room.settings,
      isGameActive: !!(this.room.game && this.room.game.phase !== PHASES.LOBBY)
    });
  }

  broadcastGameState() {
    if (!this.room || !this.room.game) return;
    this.sessions.forEach((pId, ws) => {
      if (ws.readyState === 1) {
        try {
          const state = this.room.game.getGameState(pId, this.room.players);
          ws.send(JSON.stringify({
            event: 'game_state_update',
            data: {
              room: {
                code: this.room.code,
                hostId: this.room.hostId,
                players: this.room.players,
                settings: this.room.settings
              },
              gameState: state
            }
          }));
        } catch (e) {}
      }
    });
  }
}

// Main Cloudflare Worker fetch router
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'doxcards-durable-game-server',
        time: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // WebSocket Upgrade
    const upgradeHeader = request.headers.get('Upgrade') || request.headers.get('upgrade');
    if (upgradeHeader?.toLowerCase() === 'websocket' || url.pathname.startsWith('/ws')) {
      const roomCode = (url.searchParams.get('room') || 'GLOBAL').toUpperCase().trim();

      // If Durable Objects binding exists, route to dedicated DO instance for this room code
      if (env && env.GAME_ROOMS) {
        const id = env.GAME_ROOMS.idFromName(roomCode);
        const roomObj = env.GAME_ROOMS.get(id);
        return roomObj.fetch(request);
      }

      // In-Memory fallback
      const pair = new WebSocketPair();
      const [clientWs, serverWs] = Object.values(pair);
      serverWs.accept();

      let room = globalRooms.get(roomCode);
      if (!room) {
        room = new GameRoomDO({ id: roomCode }, env);
        globalRooms.set(roomCode, room);
      }
      room.setupSocket(serverWs);

      return new Response(null, { status: 101, webSocket: clientWs });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
