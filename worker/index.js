// Cloudflare Worker Multiplayer Game Server with Durable Objects for DoxCards (Red Flags)
import { getDeck, updateGlobalDeck, getActiveRawDeck } from './cards.js';
import rawDeckJson from './Red_Flags_Turkish_Complete.json';
import { GameEngine, PHASES } from './gameEngine.js';

function generateRoomCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Global In-Memory Fallback Map (for non-DO environments)
const globalRooms = new Map();

const DEFAULT_CONFIG = {
  guestDecks: ['Ana Deste'],
  discordDecks: ['Ana Deste', 'Ek Paket'],
  allDecks: [
    'Ana Deste',
    'Ek Paket',
    'Nerd Paket',
    'Fenasal Nerd Paket',
    'Sekso Paket',
    'Kara Paket',
    'Zifiri Paket'
  ],
  deckMetadata: {
    'Ana Deste': { isSecret: false, lockDescription: 'Temel oyun destesi. Herkese açıktır.' },
    'Ek Paket': { isSecret: false, lockDescription: 'Discord ile giriş yapan tüm kullanıcılara açıktır.' },
    'Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Fenasal Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Sekso Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium veya VIP yetkisi gereklidir.' },
    'Kara Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium yetkisi gereklidir.' },
    'Zifiri Paket': { isSecret: true, lockDescription: 'Gizli özel paket. Yalnızca özel davetli kullanıcılara açıktır.' }
  }
};

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

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Config API (/api/config)
    if (url.pathname === '/api/config' || url.pathname === '/api/config/') {
      if (request.method === 'GET') {
        let config = null;
        if (this.state?.storage) {
          config = await this.state.storage.get('app_config');
        }
        return Response.json(config || DEFAULT_CONFIG, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        const currentConfig = (this.state?.storage ? await this.state.storage.get('app_config') : null) || DEFAULT_CONFIG;
        const newConfig = { ...currentConfig, ...body };
        if (this.state?.storage) {
          await this.state.storage.put('app_config', newConfig);
        }
        return Response.json({ success: true, config: newConfig }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Users Database API (/api/users)
    if (url.pathname.startsWith('/api/users')) {
      let usersMap = {};
      if (this.state?.storage) {
        usersMap = (await this.state.storage.get('users_map')) || {};
      }

      // 1. Get all users
      if (url.pathname === '/api/users' || url.pathname === '/api/users/') {
        return Response.json(Object.values(usersMap), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. Sync user on login
      if (url.pathname === '/api/users/sync' && request.method === 'POST') {
        const data = await request.json();
        const { id, username, displayName, avatar } = data;
        if (!id) return Response.json({ error: 'ID required' }, { status: 400, headers: corsHeaders });

        let config = DEFAULT_CONFIG;
        if (this.state?.storage) {
          config = (await this.state.storage.get('app_config')) || DEFAULT_CONFIG;
        }

        const isMainAdmin = id === '269639754675519489';
        let user = usersMap[id];

        if (user) {
          user.username = username || user.username;
          user.displayName = displayName || user.displayName;
          if (avatar) user.avatar = avatar;
          if (isMainAdmin && !user.tags.includes('admin')) {
            user.tags = ['admin', ...user.tags];
          }
          user.updatedAt = Date.now();
        } else {
          user = {
            id,
            username: username || displayName || 'oyuncu',
            displayName: displayName || username || 'oyuncu',
            avatar: avatar || null,
            totalScore: 0,
            tags: isMainAdmin ? ['admin'] : [],
            unlockedDecks: isMainAdmin ? [...config.allDecks] : [...config.discordDecks],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
        }

        usersMap[id] = user;
        if (this.state?.storage) {
          await this.state.storage.put('users_map', usersMap);
        }

        return Response.json({ success: true, user }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 3. Update user profile by Admin or User
      if (url.pathname === '/api/users/update' && request.method === 'POST') {
        const body = await request.json();
        const { userId, tags, unlockedDecks, totalScore, customSounds, ...rest } = body;
        if (!userId || !usersMap[userId]) {
          return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
        }

        const user = usersMap[userId];
        if (Array.isArray(tags)) user.tags = tags;
        if (Array.isArray(unlockedDecks)) user.unlockedDecks = unlockedDecks;
        if (typeof totalScore === 'number') user.totalScore = totalScore;
        if (customSounds !== undefined) user.customSounds = customSounds;
        Object.assign(user, rest);
        user.updatedAt = Date.now();

        usersMap[userId] = user;
        if (this.state?.storage) {
          await this.state.storage.put('users_map', usersMap);
        }

        return Response.json({ success: true, user }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. Add score after game
      if (url.pathname === '/api/users/add-score' && request.method === 'POST') {
        const body = await request.json();
        const { scores } = body; // { [discordId]: points }
        if (scores && typeof scores === 'object') {
          Object.entries(scores).forEach(([dId, pts]) => {
            if (usersMap[dId]) {
              usersMap[dId].totalScore = (usersMap[dId].totalScore || 0) + (Number(pts) || 0);
              usersMap[dId].updatedAt = Date.now();
            }
          });
          if (this.state?.storage) {
            await this.state.storage.put('users_map', usersMap);
          }
        }
        return Response.json({ success: true }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Deck Database API Endpoints in Cloudflare DO Storage
    if (url.pathname === '/api/deck' || url.pathname === '/api/deck/') {
      if (request.method === 'GET') {
        let savedDeck = null;
        if (this.state?.storage) {
          savedDeck = await this.state.storage.get('active_deck');
        }
        return Response.json(savedDeck || getActiveRawDeck(), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'POST') {
        const body = await request.json();
        const newDeck = body.deck || body;
        if (this.state?.storage) {
          await this.state.storage.put('active_deck', newDeck);
        }
        updateGlobalDeck(newDeck);
        return Response.json({
          success: true,
          message: 'Kartlar Cloudflare veritabanına başarıyla kaydedildi!'
        }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/api/deck/reset') {
      if (this.state?.storage) {
        await this.state.storage.delete('active_deck');
      }
      updateGlobalDeck(rawDeckJson);
      return Response.json({
        success: true,
        message: 'Cloudflare veritabanı orijinal haline sıfırlandı!'
      }, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
          const code = (roomCode || generateRoomCode()).toLowerCase().trim();

          const initialSettings = {
            targetScore: settings?.targetScore || 3,
            turnTimeSeconds: 0,
            allowCustomCards: false,
            isPrivate: true,
            deckType: 'all',
            maxPlayers: 6,
            selectedDecks: (Array.isArray(settings?.selectedDecks) && settings.selectedDecks.length > 0)
              ? settings.selectedDecks
              : ['Ana Deste']
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

        // 2. Join Room (Only existing active rooms allowed)
        else if (evt === 'join_room') {
          const { player, roomCode } = data;
          const code = (roomCode || '').toLowerCase().trim();

          // Reject if room does not exist or has no active players
          if (!this.room || !this.room.players || this.room.players.length === 0) {
            sendAck({ error: 'böyle bir oda bulunamadı veya oda kapatılmış.' });
            return;
          }

          if (this.room.players.length >= (this.room.settings?.maxPlayers || 6)) {
            sendAck({ error: 'oda dolu (maksimum 6 oyuncu).' });
            return;
          }

          const existingIdx = this.room.players.findIndex(p => p.id === player.id);
          if (existingIdx !== -1) {
            this.room.players[existingIdx].name = player.name;
            this.room.players[existingIdx].color = player.color;
            if (player.avatar) this.room.players[existingIdx].avatar = player.avatar;
          } else {
            this.room.players.push({
              ...player,
              isHost: false,
              isReady: false,
              score: 0
            });
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

        // 3. Toggle Ready
        else if (evt === 'toggle_ready') {
          const { playerId: pId } = data;
          if (!this.room) return;

          const p = this.room.players.find(pl => pl.id === pId);
          if (p) {
            p.isReady = !p.isReady;
            this.broadcastRoomUpdate();
          }
        }

        // 4. Update Settings (Host only)
        else if (evt === 'update_settings') {
          const { settings } = data;
          if (!this.room) return;
          this.room.settings = { ...this.room.settings, ...settings };
          this.broadcastRoomUpdate();
        }

        // 5. Start Game (Host only)
        else if (evt === 'start_game') {
          const { playerId: hostId } = data;
          if (!this.room) return;

          if (this.room.hostId !== hostId) {
            sendAck({ error: 'sadece oda kurucusu oyunu başlatabilir.' });
            return;
          }

          if (this.room.players.length < 2) {
            sendAck({ error: 'oyunun başlaması için en az 2 oyuncu gereklidir.' });
            return;
          }

          this.room.game = new GameEngine(this.room.code, this.room.settings);
          this.room.game.startGame(this.room.players);

          this.broadcast('game_started', {});
          this.broadcastRoomUpdate();
          this.broadcastGameState();
          sendAck({ success: true });
        }

        // 6. Place Single White Card (Immediate visibility on table for all players)
        else if (evt === 'place_white_card') {
          const { playerId: pId, cardId, customText } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.placeSingleWhiteCard(pId, cardId, customText);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          this.broadcastGameState();
          sendAck({ success: true });
        }

        // Submit Perks (Batch 2 White Cards fallback)
        else if (evt === 'submit_perks') {
          const { playerId: pId, cardIds, customTexts } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.submitPerks(pId, cardIds, customTexts);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          this.broadcastGameState();
          sendAck({ success: true });
        }

        // 7. Submit Sabotage (Matchmaker 1 Red Flag Card)
        else if (evt === 'submit_sabotage') {
          const { playerId: pId, cardId, customText } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.submitSabotage(pId, cardId, this.room.players, customText);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          this.broadcastGameState();
          sendAck({ success: true });
        }

        // 8. Select Winner (Single)
        else if (evt === 'bekar_select_winner' || evt === 'select_winner') {
          const singlePlayerId = data.singlePlayerId || data.playerId;
          const winningMatchmakerId = data.winningMatchmakerId || data.winnerMatchmakerId || data.matchmakerId;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.selectWinner(singlePlayerId, winningMatchmakerId, this.room.players);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          this.broadcastGameState();

          if (this.room.game.phase === PHASES.GAME_OVER) {
            // Persist scores to registered users in Cloudflare DB
            if (this.state?.storage && this.room.players) {
              this.state.storage.get('users_map').then(usersMap => {
                if (usersMap) {
                  this.room.players.forEach(p => {
                    const dId = p.discordId || p.id;
                    const pScore = this.room.game.scores[p.id] || 0;
                    if (usersMap[dId] && pScore > 0) {
                      usersMap[dId].totalScore = (usersMap[dId].totalScore || 0) + pScore;
                      usersMap[dId].updatedAt = Date.now();
                    }
                  });
                  this.state.storage.put('users_map', usersMap);
                }
              }).catch(() => {});
            }
          } else if (this.room.game.phase === PHASES.ROUND_SUMMARY) {
            setTimeout(() => {
              if (this.room && this.room.game && this.room.game.phase === PHASES.ROUND_SUMMARY) {
                this.room.game.nextRound(this.room.players);
                this.broadcastGameState();
              }
            }, 5500);
          }

          sendAck({ success: true });
        }

        // 9. Kick Player (Host only)
        else if (evt === 'kick_player') {
          const { hostId, targetPlayerId } = data;
          if (!this.room) return;

          if (this.room.hostId !== hostId) {
            sendAck({ error: 'sadece oda kurucusu oyuncu atabilir.' });
            return;
          }

          if (hostId === targetPlayerId) {
            sendAck({ error: 'kendinizi odadan atamazsınız.' });
            return;
          }

          const targetIdx = this.room.players.findIndex(p => p.id === targetPlayerId);
          if (targetIdx !== -1) {
            this.room.players.splice(targetIdx, 1);

            // Notify kicked player specifically
            this.sessions.forEach((pId, ws) => {
              if (pId === targetPlayerId && ws.readyState === 1) {
                try {
                  ws.send(JSON.stringify({
                    event: 'kicked_from_room',
                    data: { reason: 'oda kurucusu tarafından odadan çıkarıldınız.' }
                  }));
                } catch (e) {}
              }
            });

            if (this.room.game) {
              this.room.game.removePlayer(targetPlayerId, this.room.players);
              if (this.room.players.length < 2) {
                this.room.game.clearTimer();
                this.room.game = null;
                this.broadcast('game_reset_to_lobby', {});
              } else {
                this.broadcastGameState();
              }
            }

            this.broadcastRoomUpdate();
            sendAck({ success: true });
          }
        }

        // Leave Room
        else if (evt === 'leave_room') {
          const { playerId: pId } = data;
          if (!this.room) return;

          this.room.players = this.room.players.filter(p => p.id !== pId);
          if (this.room.players.length === 0) {
            if (this.room.game) this.room.game.clearTimer();
            this.room = null;
          } else {
            if (this.room.hostId === pId) {
              this.room.hostId = this.room.players[0].id;
              this.room.players[0].isHost = true;
            }

            if (this.room.game) {
              this.room.game.removePlayer(pId, this.room.players);
              if (this.room.players.length < 2) {
                this.room.game.clearTimer();
                this.room.game = null;
                this.broadcast('game_reset_to_lobby', {});
              } else {
                this.broadcastGameState();
              }
            }

            this.broadcastRoomUpdate();
          }
          sendAck({ success: true });
        }

        // 10. Stop Game / Reset to Lobby (Host only)
        else if (evt === 'stop_game') {
          const { hostId } = data;
          if (!this.room) return;

          if (this.room.hostId !== hostId) {
            sendAck({ error: 'sadece oda kurucusu oyunu durdurabilir.' });
            return;
          }

          if (this.room.game) {
            this.room.game.clearTimer();
            this.room.game = null;
          }

          this.broadcast('game_reset_to_lobby', {});
          this.broadcastRoomUpdate();
          sendAck({ success: true });
        }

        // 11. Play Again (Host only)
        else if (evt === 'play_again') {
          if (!this.room) return;
          this.room.game = new GameEngine(this.room.code, this.room.settings);
          this.room.game.startGame(this.room.players);

          this.broadcast('game_started', {});
          this.broadcastRoomUpdate();
          this.broadcastGameState();
          sendAck({ success: true });
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

          if (this.room.game) {
            this.room.game.removePlayer(playerId, this.room.players);
            if (this.room.players.length < 2) {
              this.room.game.clearTimer();
              this.room.game = null;
              this.broadcast('game_reset_to_lobby', {});
            } else {
              this.broadcastGameState();
            }
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

    // 1. WebSocket Upgrade (Must be checked before HTTP health check)
    const upgradeHeader = request.headers.get('Upgrade') || request.headers.get('upgrade');
    if (upgradeHeader?.toLowerCase() === 'websocket' || url.pathname.startsWith('/ws')) {
      const roomCode = (url.searchParams.get('room') || 'global').toLowerCase().trim();

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

    // 2. Database API Routing (/api/deck, /api/users, /api/config)
    if (url.pathname.startsWith('/api/deck') || url.pathname.startsWith('/api/users') || url.pathname.startsWith('/api/config')) {
      if (env && env.GAME_ROOMS) {
        const id = env.GAME_ROOMS.idFromName('GLOBAL_CARDS_STORAGE');
        const storageObj = env.GAME_ROOMS.get(id);
        return storageObj.fetch(request);
      }

      // In-Memory Fallback for decks
      if (url.pathname === '/api/deck/reset') {
        updateGlobalDeck(rawDeckJson);
        return Response.json({ success: true, message: 'Veritabanı sıfırlandı!' }, { headers: corsHeaders });
      }
      if (url.pathname.startsWith('/api/deck') && request.method === 'POST') {
        const body = await request.json();
        const newDeck = body.deck || body;
        updateGlobalDeck(newDeck);
        return Response.json({ success: true, message: 'Veritabanına kaydedildi!' }, { headers: corsHeaders });
      }
      if (url.pathname.startsWith('/api/config')) {
        return Response.json(DEFAULT_CONFIG, { headers: corsHeaders });
      }
      if (url.pathname.startsWith('/api/users')) {
        return Response.json([], { headers: corsHeaders });
      }
      return Response.json(getActiveRawDeck(), { headers: corsHeaders });
    }

    // 3. HTTP Health check / Root info
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'doxcards-durable-game-server',
        time: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
