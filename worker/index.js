// Cloudflare Worker Multiplayer Game Server for DoxCards (Red Flags)
import { getDeck } from './cards.js';
import { GameEngine, PHASES } from './gameEngine.js';

// In-Memory Room Map for Worker instance / Durable Object
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(roomCode, eventName, payload) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.sockets.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify({ event: eventName, data: payload }));
    }
  });
}

function broadcastGameState(room) {
  if (!room || !room.game) return;

  room.players.forEach(player => {
    const ws = room.playerSockets.get(player.id);
    if (ws && ws.readyState === 1) {
      const state = room.game.getGameState(player.id, room.players);
      ws.send(JSON.stringify({
        event: 'game_state_update',
        data: {
          room: {
            code: room.code,
            hostId: room.hostId,
            players: room.players,
            settings: room.settings
          },
          gameState: state
        }
      }));
    }
  });
}

function broadcastRoomUpdate(room) {
  if (!room) return;
  broadcastToRoom(room.code, 'room_updated', {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    settings: room.settings,
    isGameActive: !!(room.game && room.game.phase !== PHASES.LOBBY)
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers
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
        service: 'doxcards-cloudflare-worker',
        activeRooms: rooms.size,
        time: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // WebSocket Upgrade Request
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [clientWs, serverWs] = Object.values(pair);

      serverWs.accept();

      let currentRoomCode = null;
      let currentPlayerId = null;

      serverWs.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: evt, data, ackId } = message;

          const sendAck = (response) => {
            if (ackId) {
              serverWs.send(JSON.stringify({ ackId, response }));
            }
          };

          // 1. Create Room
          if (evt === 'create_room') {
            const { player, settings } = data;
            const code = generateRoomCode();

            const initialSettings = {
              targetScore: settings?.targetScore || 3,
              turnTimeSeconds: settings?.turnTimeSeconds || 45,
              allowCustomCards: false,
              isPrivate: true,
              deckType: 'all',
              maxPlayers: 6
            };

            const room = {
              code,
              hostId: player.id,
              players: [{ ...player, isHost: true, isReady: true, score: 0 }],
              settings: initialSettings,
              game: null,
              sockets: new Set([serverWs]),
              playerSockets: new Map([[player.id, serverWs]]),
              messages: []
            };

            rooms.set(code, room);
            currentRoomCode = code;
            currentPlayerId = player.id;

            sendAck({
              success: true,
              roomCode: code,
              room: {
                code,
                hostId: room.hostId,
                players: room.players,
                settings: room.settings
              },
              player: room.players[0]
            });
            broadcastRoomUpdate(room);
          }

          // 2. Join Room
          else if (evt === 'join_room') {
            const { roomCode, player } = data;
            const code = (roomCode || '').toUpperCase().trim();
            const room = rooms.get(code);

            if (!room) {
              sendAck({ error: 'Oda bulunamadı. Lütfen 5 haneli kodu kontrol edin.' });
              return;
            }

            if (room.players.length >= (room.settings?.maxPlayers || 6)) {
              sendAck({ error: 'Oda dolu (Maksimum 6 oyuncu).' });
              return;
            }

            const existingIdx = room.players.findIndex(p => p.id === player.id);
            if (existingIdx !== -1) {
              room.players[existingIdx].name = player.name;
              room.players[existingIdx].color = player.color;
            } else {
              room.players.push({
                ...player,
                isHost: false,
                isReady: false,
                score: 0
              });
            }

            room.sockets.add(serverWs);
            room.playerSockets.set(player.id, serverWs);
            currentRoomCode = code;
            currentPlayerId = player.id;

            const joinedPlayer = room.players.find(p => p.id === player.id);

            sendAck({
              success: true,
              roomCode: code,
              room: {
                code,
                hostId: room.hostId,
                players: room.players,
                settings: room.settings
              },
              player: joinedPlayer
            });

            broadcastRoomUpdate(room);
            if (room.game) broadcastGameState(room);
          }

          // 3. Start Game
          else if (evt === 'start_game') {
            const { roomCode, playerId } = data;
            const room = rooms.get(roomCode);
            if (!room) return;

            if (room.hostId !== playerId) {
              sendAck({ error: 'Sadece oda kurucusu oyunu başlatabilir.' });
              return;
            }

            if (room.players.length < 3) {
              sendAck({ error: 'Red Flags oynamak için en az 3 oyuncu gereklidir.' });
              return;
            }

            room.game = new GameEngine(room.players, room.settings);
            room.game.onStateChange = () => {
              broadcastGameState(room);
            };

            broadcastToRoom(room.code, 'game_started', {});
            broadcastGameState(room);
            sendAck({ success: true });
          }

          // 4. Submit Perks
          else if (evt === 'submit_perks') {
            const { roomCode, playerId, cardIds } = data;
            const room = rooms.get(roomCode);
            if (!room || !room.game) return;

            const ok = room.game.submitPerks(playerId, cardIds);
            if (ok) {
              broadcastGameState(room);
              sendAck({ success: true });
            } else {
              sendAck({ error: 'Kartlar seçilemedi.' });
            }
          }

          // 5. Submit Sabotage
          else if (evt === 'submit_sabotage') {
            const { roomCode, playerId, cardId } = data;
            const room = rooms.get(roomCode);
            if (!room || !room.game) return;

            const ok = room.game.submitSabotage(playerId, cardId, room.players);
            if (ok) {
              broadcastGameState(room);
              sendAck({ success: true });
            } else {
              sendAck({ error: 'Sabotaj kartı gönderilemedi.' });
            }
          }

          // 6. Select Winner
          else if (evt === 'bekar_select_winner') {
            const { roomCode, singlePlayerId, winningMatchmakerId } = data;
            const room = rooms.get(roomCode);
            if (!room || !room.game) return;

            const ok = room.game.bekarSelectWinner(singlePlayerId, winningMatchmakerId, room.players);
            if (ok) {
              broadcastGameState(room);
              sendAck({ success: true });
            }
          }

          // 7. Toggle Ready
          else if (evt === 'toggle_ready') {
            const { roomCode, playerId } = data;
            const room = rooms.get(roomCode);
            if (!room) return;

            const player = room.players.find(p => p.id === playerId);
            if (player) {
              player.isReady = !player.isReady;
              broadcastRoomUpdate(room);
            }
          }

          // 8. Update Settings
          else if (evt === 'update_settings') {
            const { roomCode, settings } = data;
            const room = rooms.get(roomCode);
            if (!room) return;
            room.settings = { ...room.settings, ...settings };
            broadcastRoomUpdate(room);
          }

          // 9. Play Again
          else if (evt === 'play_again') {
            const { roomCode } = data;
            const room = rooms.get(roomCode);
            if (!room) return;
            if (room.game) {
              room.game.clearTimer();
              room.game = null;
            }
            room.players.forEach(p => { p.isReady = false; });
            broadcastToRoom(room.code, 'game_reset_to_lobby', {});
            broadcastRoomUpdate(room);
          }

          // 10. Send Chat Message
          else if (evt === 'send_message') {
            const { roomCode, message } = data;
            const room = rooms.get(roomCode);
            if (!room) return;

            const fullMsg = {
              id: 'msg_' + Math.random().toString(36).substring(2, 9),
              senderId: message.senderId,
              senderName: message.senderName,
              senderColor: message.senderColor || '#ffffff',
              text: message.text,
              time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              isSystem: !!message.isSystem
            };

            room.messages.push(fullMsg);
            broadcastToRoom(room.code, 'new_message', fullMsg);
          }

          // 11. Send Reaction
          else if (evt === 'send_reaction') {
            const { roomCode, reaction, senderName } = data;
            broadcastToRoom(roomCode, 'reaction_received', {
              reaction,
              senderName,
              id: Math.random().toString(36).substring(2, 7)
            });
          }

        } catch (err) {
          console.error('Worker WebSocket error:', err);
        }
      });

      serverWs.addEventListener('close', () => {
        if (currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (room) {
            room.sockets.delete(serverWs);
            room.playerSockets.delete(currentPlayerId);
            room.players = room.players.filter(p => p.id !== currentPlayerId);

            if (room.players.length === 0) {
              if (room.game) room.game.clearTimer();
              rooms.delete(currentRoomCode);
            } else {
              if (room.hostId === currentPlayerId) {
                room.hostId = room.players[0].id;
                room.players[0].isHost = true;
              }
              broadcastRoomUpdate(room);
            }
          }
        }
      });

      return new Response(null, {
        status: 101,
        webSocket: clientWs
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
