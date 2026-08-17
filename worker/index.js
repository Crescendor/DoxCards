import { getDeck, updateGlobalDeck, getActiveRawDeck } from './cards.js';
import rawDeckJson from './defaultDeck.json';
import { GameEngine, PHASES } from './gameEngine.js';
import { generateRoomOgPng } from './ogRenderer.js';

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

export const ADMIN_DISCORD_ID = '269639754675519489';

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
    'Zifiri Paket',
    'Aktanfell Paket'
  ],
  deckMetadata: {
    'Ana Deste': { isSecret: false, lockDescription: 'Temel oyun destesi. Herkese açıktır.' },
    'Ek Paket': { isSecret: false, lockDescription: 'Discord ile giriş yapan tüm kullanıcılara açıktır.' },
    'Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Fenasal Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Sekso Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium veya VIP yetkisi gereklidir.' },
    'Kara Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium yetkisi gereklidir.' },
    'Zifiri Paket': { isSecret: true, lockDescription: 'Gizli özel paket. Yalnızca özel davetli kullanıcılara açıktır.' },
    'Aktanfell Paket': { isSecret: false, lockDescription: 'Aktanfell özel topluluk paketi.' }
  },
  coinMultipliers: {
    default: 10,
    premium: 20,
    vip: 30
  },
  customTags: [
    {
      id: 'admin',
      name: 'admin',
      icon: 'ShieldCheck',
      color: '#f87171',
      bgColor: 'rgba(239, 68, 68, 0.18)',
      borderColor: 'rgba(239, 68, 68, 0.45)',
      glow: 'crimson',
      animation: 'none',
      permissions: {
        customSounds: true,
        allDecks: true,
        adminAccess: true,
        multiplier: 30
      }
    },
    {
      id: 'vip',
      name: 'VIP',
      icon: 'Crown',
      color: '#c084fc',
      bgColor: 'rgba(168, 85, 247, 0.18)',
      borderColor: 'rgba(168, 85, 247, 0.45)',
      glow: 'neon_purple',
      animation: 'pulse',
      permissions: {
        customSounds: true,
        allDecks: false,
        adminAccess: false,
        multiplier: 30
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: 'Sparkles',
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.18)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      glow: 'neon_blue',
      animation: 'shimmer',
      permissions: {
        customSounds: true,
        allDecks: false,
        adminAccess: false,
        multiplier: 20
      }
    }
  ]
};

// Durable Object class for 100% synchronized stateful multiplayer rooms
export class GameRoomDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.room = null;
    this.sessions = new Map(); // serverWs -> playerId
  }

  async alarm() {
    if (this.room && this.room.game && this.room.game.phase === PHASES.ROUND_SUMMARY) {
      try {
        this.room.game.nextRound(this.room.players);
        this.broadcastGameState();
        this.checkAndTriggerBotTurn();
      } catch (err) {
        console.error('DO Alarm nextRound error:', err);
      }
    }
  }

  async getLatestGlobalDeck() {
    if (this.env && this.env.GAME_ROOMS) {
      try {
        const id = this.env.GAME_ROOMS.idFromName('GLOBAL_CARDS_STORAGE');
        const storageObj = this.env.GAME_ROOMS.get(id);
        const res = await storageObj.fetch(new Request('http://internal/api/deck'));
        if (res.ok) {
          const deck = await res.json();
          if (deck && (deck.Perks || deck.perks || deck['Red Flags'] || deck.red_flags)) {
            return deck;
          }
        }
      } catch (err) {
        console.error('Error fetching global deck from DO storage:', err);
      }
    }
    return getActiveRawDeck();
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
          if (user.coins === undefined) user.coins = 0;
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
            coins: 0,
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
        const { userId, tags, unlockedDecks, totalScore, coins, customSounds, ...rest } = body;
        if (!userId || !usersMap[userId]) {
          return Response.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
        }

        const user = usersMap[userId];
        if (Array.isArray(tags)) user.tags = tags;
        if (Array.isArray(unlockedDecks)) user.unlockedDecks = unlockedDecks;
        if (typeof totalScore === 'number') user.totalScore = totalScore;
        if (typeof coins === 'number') user.coins = coins;
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

    // Suggestions API Endpoints in Cloudflare DO Storage
    if (url.pathname.startsWith('/api/suggestions')) {
      let suggestionsList = [];
      if (this.state?.storage) {
        suggestionsList = (await this.state.storage.get('suggestions_list')) || [];
      }

      // 1. Get Suggestions List
      if ((url.pathname === '/api/suggestions' || url.pathname === '/api/suggestions/') && request.method === 'GET') {
        const discordId = url.searchParams.get('discordId');
        const isMainAdmin = !discordId || discordId === ADMIN_DISCORD_ID || discordId === 'admin' || url.searchParams.get('admin') === 'true';

        if (isMainAdmin) {
          // Admin sees all suggestions with full author details
          return Response.json(suggestionsList, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // Normal user only sees their own suggestions
          const mySuggestions = suggestionsList.filter(s => s.author?.id === discordId);
          return Response.json(mySuggestions, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // 2. Create Suggestion (User)
      if (url.pathname === '/api/suggestions/create' && request.method === 'POST') {
        const body = await request.json();
        const { type, author, cardData, deckData } = body;

        if (type === 'deck') {
          if (!deckData?.title?.trim()) {
            return Response.json({ error: 'deste adı zorunludur.' }, { status: 400, headers: corsHeaders });
          }
          const whiteCount = Array.isArray(deckData.whiteCards) ? deckData.whiteCards.filter(t => t && t.trim()).length : 0;
          const redCount = Array.isArray(deckData.redCards) ? deckData.redCards.filter(t => t && t.trim()).length : 0;

          if (whiteCount < 10 || redCount < 10) {
            return Response.json({
              error: `deste önermek için en az 10 beyaz ve 10 kırmızı kart eklemelisiniz. (şu an: ${whiteCount} beyaz, ${redCount} kırmızı)`
            }, { status: 400, headers: corsHeaders });
          }
        } else if (type === 'card') {
          if (!cardData?.text?.trim()) {
            return Response.json({ error: 'kart metni zorunludur.' }, { status: 400, headers: corsHeaders });
          }
        }

        const newSuggestion = {
          id: 'sug_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          type: type || 'card',
          author: {
            id: author?.id || 'anon',
            name: author?.name || 'anonim oyuncu',
            username: author?.username || '',
            avatar: author?.avatar || null,
            isAnonymous: !!author?.isAnonymous
          },
          cardData: cardData || null,
          deckData: deckData || null,
          status: 'pending', // 'pending' | 'approved' | 'rejected'
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        suggestionsList.unshift(newSuggestion);
        if (this.state?.storage) {
          await this.state.storage.put('suggestions_list', suggestionsList);
        }

        return Response.json({ success: true, suggestion: newSuggestion }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 3. Update Suggestion (User or Admin)
      if (url.pathname === '/api/suggestions/update' && request.method === 'POST') {
        const body = await request.json();
        const { suggestionId, cardData, deckData, isAnonymous } = body;
        const targetIdx = suggestionsList.findIndex(s => s.id === suggestionId);

        if (targetIdx === -1) {
          return Response.json({ error: 'öneri bulunamadı.' }, { status: 404, headers: corsHeaders });
        }

        const sug = suggestionsList[targetIdx];
        if (cardData) sug.cardData = cardData;
        if (deckData) sug.deckData = deckData;
        if (typeof isAnonymous === 'boolean' && sug.author) sug.author.isAnonymous = isAnonymous;
        sug.updatedAt = Date.now();

        if (this.state?.storage) {
          await this.state.storage.put('suggestions_list', suggestionsList);
        }

        return Response.json({ success: true, suggestion: sug }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 4. Delete Suggestion (User or Admin)
      if (url.pathname === '/api/suggestions/delete' && request.method === 'POST') {
        const body = await request.json();
        const { suggestionId } = body;
        suggestionsList = suggestionsList.filter(s => s.id !== suggestionId);

        if (this.state?.storage) {
          await this.state.storage.put('suggestions_list', suggestionsList);
        }

        return Response.json({ success: true }, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 5. Review / Approve / Reject (Admin)
      if (url.pathname === '/api/suggestions/review' && request.method === 'POST') {
        const body = await request.json();
        const { suggestionId, status, targetDeckName, extraNote } = body;
        const targetIdx = suggestionsList.findIndex(s => s.id === suggestionId);

        if (targetIdx === -1) {
          return Response.json({ error: 'öneri bulunamadı.' }, { status: 404, headers: corsHeaders });
        }

        const sug = suggestionsList[targetIdx];
        sug.status = status; // 'approved' | 'rejected' | 'pending'
        sug.reviewedAt = Date.now();

        if (status === 'approved') {
          let savedDeck = null;
          if (this.state?.storage) {
            savedDeck = (await this.state.storage.get('active_deck')) || rawDeckJson;
          } else {
            savedDeck = getActiveRawDeck();
          }

          savedDeck.Perks = savedDeck.Perks || {};
          savedDeck['Red Flags'] = savedDeck['Red Flags'] || {};
          savedDeck.deckNotes = savedDeck.deckNotes || {};

          if (sug.type === 'card' && sug.cardData) {
            const destName = targetDeckName || sug.cardData.targetDeck || 'Ana Deste';
            const finalText = (body.cardText || sug.cardData.text || '').trim();
            const finalType = body.cardType || sug.cardData.type;
            if (body.cardText) sug.cardData.text = finalText;
            if (body.cardType) sug.cardData.type = finalType;
            if (destName) sug.cardData.targetDeck = destName;

            if (finalType === 'perk') {
              savedDeck.Perks[destName] = savedDeck.Perks[destName] || [];
              savedDeck.Perks[destName].push(finalText);
            } else {
              savedDeck['Red Flags'][destName] = savedDeck['Red Flags'][destName] || [];
              savedDeck['Red Flags'][destName].push(finalText);
            }
            if (extraNote) {
              savedDeck.deckNotes[destName] = extraNote;
            }
          } else if (sug.type === 'deck' && sug.deckData) {
            const deckName = sug.deckData.title.trim();
            const cleanWhite = (sug.deckData.whiteCards || []).map(t => t.trim()).filter(Boolean);
            const cleanRed = (sug.deckData.redCards || []).map(t => t.trim()).filter(Boolean);

            savedDeck.Perks[deckName] = cleanWhite;
            savedDeck['Red Flags'][deckName] = cleanRed;
            if (sug.deckData.extraNote || extraNote) {
              savedDeck.deckNotes[deckName] = extraNote || sug.deckData.extraNote;
            }
          }

          if (this.state?.storage) {
            await this.state.storage.put('active_deck', savedDeck);
          }
          updateGlobalDeck(savedDeck);
        }

        if (this.state?.storage) {
          await this.state.storage.put('suggestions_list', suggestionsList);
        }

        return Response.json({ success: true, suggestion: sug }, {
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

          const cleanPlayerName = (player.name || 'oyuncu').slice(0, 19);

          this.room = {
            code,
            hostId: player.id,
            players: [{ ...player, name: cleanPlayerName, isHost: true, isReady: true, score: 0 }],
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

          const cleanPlayerName = (player.name || 'oyuncu').slice(0, 19);

          const existingIdx = this.room.players.findIndex(p => p.id === player.id);
          if (existingIdx !== -1) {
            this.room.players[existingIdx].name = cleanPlayerName;
            this.room.players[existingIdx].color = player.color;
            if (player.avatar) this.room.players[existingIdx].avatar = player.avatar;
          } else {
            this.room.players.push({
              ...player,
              name: cleanPlayerName,
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

          const liveDeck = await this.getLatestGlobalDeck();
          this.room.game = new GameEngine(this.room.code, this.room.settings);
          this.room.game.startGame(this.room.players, liveDeck);

          this.broadcast('game_started', {});
          this.broadcastRoomUpdate();
          this.broadcastGameState();
          this.checkAndTriggerBotTurn();
          sendAck({ success: true });
        }

        // Add Bot Player (Admin / Host)
        else if (evt === 'add_bot_player') {
          const { hostId } = data;
          if (!this.room) return;

          if (this.room.hostId !== hostId) {
            sendAck({ error: 'sadece oda kurucusu bot ekleyebilir.' });
            return;
          }

          if (this.room.players.length >= 6) {
            sendAck({ error: 'oda maksimum 6 kişilik kapasiteye ulaştı.' });
            return;
          }

          const botNames = ['ahmet', 'ayşe', 'can', 'elif', 'mert', 'zeynep', 'deniz', 'burak', 'selin', 'bora', 'efe', 'melis'];
          const existingNames = new Set(this.room.players.map(p => (p.name || '').toLowerCase()));
          const availableNames = botNames.filter(n => !existingNames.has(n));
          const chosenName = availableNames[Math.floor(Math.random() * availableNames.length)] || `bot_${this.room.players.length + 1}`;

          const botPlayer = {
            id: 'bot_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: chosenName,
            avatar: null,
            isBot: true,
            isReady: true,
            connected: true
          };

          this.room.players.push(botPlayer);
          this.broadcastRoomUpdate();
          sendAck({ success: true, bot: botPlayer });
        }

        // Remove Bot Player (Admin / Host)
        else if (evt === 'remove_bot_player') {
          const { hostId, botId } = data;
          if (!this.room) return;

          if (this.room.hostId !== hostId) {
            sendAck({ error: 'sadece oda kurucusu bot çıkarabilir.' });
            return;
          }

          const botIdx = this.room.players.findIndex(p => p.id === botId && p.isBot);
          if (botIdx !== -1) {
            this.room.players.splice(botIdx, 1);
            if (this.room.game) {
              this.room.game.removePlayer(botId, this.room.players);
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

        // Update Player Profile (e.g. Custom Sounds, Avatar, Name)
        else if (evt === 'update_player_profile') {
          const { playerId: pId, customSounds, avatar, name } = data;
          if (!this.room) return;
          const p = this.room.players.find(pl => pl.id === pId);
          if (p) {
            if (customSounds !== undefined) p.customSounds = customSounds;
            if (avatar !== undefined) p.avatar = avatar;
            if (name) p.name = (name || '').slice(0, 19);
            this.broadcastRoomUpdate();
          }
        }

        // 6. Place Single White Card (Immediate visibility on table for all players)
        else if (evt === 'place_white_card') {
          const { playerId: pId, cardId, customText, customSounds } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.placeSingleWhiteCard(pId, cardId, customText);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          const actingPlayer = this.room.players.find(p => p.id === pId);
          if (customSounds && actingPlayer) {
            actingPlayer.customSounds = customSounds;
          }
          const finalSounds = customSounds || actingPlayer?.customSounds || null;

          this.broadcast('play_sound_event', {
            type: 'white_card',
            playerId: pId,
            playerName: actingPlayer?.name || 'oyuncu',
            customSounds: finalSounds
          });

          this.broadcastGameState();
          this.checkAndTriggerBotTurn();
          sendAck({ success: true });
        }

        // Submit Perks (Batch 2 White Cards fallback)
        else if (evt === 'submit_perks') {
          const { playerId: pId, cardIds, customTexts, customSounds } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.submitPerks(pId, cardIds, customTexts);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          const actingPlayer = this.room.players.find(p => p.id === pId);
          if (customSounds && actingPlayer) {
            actingPlayer.customSounds = customSounds;
          }
          const finalSounds = customSounds || actingPlayer?.customSounds || null;

          this.broadcast('play_sound_event', {
            type: 'white_card',
            playerId: pId,
            playerName: actingPlayer?.name || 'oyuncu',
            customSounds: finalSounds
          });

          this.broadcastGameState();
          this.checkAndTriggerBotTurn();
          sendAck({ success: true });
        }

        // 7. Submit Sabotage (Matchmaker 1 Red Flag Card)
        else if (evt === 'submit_sabotage') {
          const { playerId: pId, cardId, customText, customSounds } = data;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.submitSabotage(pId, cardId, this.room.players, customText);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          const actingPlayer = this.room.players.find(p => p.id === pId);
          if (customSounds && actingPlayer) {
            actingPlayer.customSounds = customSounds;
          }
          const finalSounds = customSounds || actingPlayer?.customSounds || null;

          this.broadcast('play_sound_event', {
            type: 'red_card',
            playerId: pId,
            playerName: actingPlayer?.name || 'oyuncu',
            customSounds: finalSounds
          });

          this.broadcastGameState();
          this.checkAndTriggerBotTurn();
          sendAck({ success: true });
        }

        // 8. Select Winner (Single)
        else if (evt === 'bekar_select_winner' || evt === 'select_winner') {
          const singlePlayerId = data.singlePlayerId || data.playerId;
          const winningMatchmakerId = data.winningMatchmakerId || data.winnerMatchmakerId || data.matchmakerId;
          const winnerCustomSounds = data.winnerCustomSounds || null;
          if (!this.room || !this.room.game) return;

          const res = this.room.game.selectWinner(singlePlayerId, winningMatchmakerId, this.room.players);
          if (res?.error) {
            sendAck({ error: res.error });
            return;
          }

          const winnerPlayer = this.room.players.find(p => p.id === winningMatchmakerId);
          if (winnerCustomSounds && winnerPlayer) {
            winnerPlayer.customSounds = winnerCustomSounds;
          }
          const finalSounds = winnerCustomSounds || winnerPlayer?.customSounds || null;

          this.broadcast('play_sound_event', {
            type: 'game_win',
            playerId: winningMatchmakerId,
            playerName: winnerPlayer?.name || 'kazanan',
            customSounds: finalSounds
          });

          this.broadcastGameState();

          if (this.room.game.phase === PHASES.GAME_OVER) {
            await this.handleGameOverCoins();
          } else if (this.room.game.phase === PHASES.ROUND_SUMMARY) {
            if (this.state?.storage?.setAlarm) {
              try {
                await this.state.storage.setAlarm(Date.now() + 3500);
              } catch (e) {}
            }
            setTimeout(() => {
              try {
                if (this.room && this.room.game && this.room.game.phase === PHASES.ROUND_SUMMARY) {
                  this.room.game.nextRound(this.room.players);
                  this.broadcastGameState();
                  this.checkAndTriggerBotTurn();
                }
              } catch (err) {
                console.error('Auto nextRound error:', err);
              }
            }, 3500);
          }

          sendAck({ success: true });
        }

        // 8.5 Next Round Trigger (Client or Host initiated backup)
        else if (evt === 'next_round') {
          if (!this.room || !this.room.game) return;
          if (this.room.game.phase === PHASES.ROUND_SUMMARY) {
            try {
              this.room.game.nextRound(this.room.players);
              this.broadcastGameState();
              this.checkAndTriggerBotTurn();
              sendAck({ success: true });
            } catch (err) {
              console.error('Manual nextRound error:', err);
              sendAck({ error: err.message });
            }
          } else {
            sendAck({ success: true });
          }
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
          const liveDeck = await this.getLatestGlobalDeck();
          this.room.game = new GameEngine(this.room.code, this.room.settings);
          this.room.game.startGame(this.room.players, liveDeck);

          this.broadcast('game_started', {});
          this.broadcastRoomUpdate();
          this.broadcastGameState();
          sendAck({ success: true });
        }

        // 12. Live Card Drag Motion Synchronization
        else if (evt === 'card_drag_motion') {
          const payload = JSON.stringify({ event: 'player_card_drag_motion', data });
          this.sessions.forEach((pId, ws) => {
            if (pId !== data?.playerId && ws.readyState === 1) {
              try {
                ws.send(payload);
              } catch (e) {}
            }
          });
        }
      } catch (err) {
        console.error('DO message error:', err);
      }
    });

    serverWs.addEventListener('close', () => {
      try {
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
      } catch (err) {
        console.error('Error handling WebSocket close:', err);
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

  checkAndTriggerBotTurn() {
    if (!this.room || !this.room.game) return;
    const game = this.room.game;
    const phase = game.phase;

    if (phase === PHASES.GAME_OVER || phase === PHASES.LOBBY) return;

    let activeBotId = null;
    if (phase === PHASES.PERKS || phase === PHASES.SABOTAGE) {
      const currentTurnPlayer = this.room.players.find(p => p.id === game.turnPlayerId);
      if (currentTurnPlayer && currentTurnPlayer.isBot) {
        activeBotId = currentTurnPlayer.id;
      }
    } else if (phase === PHASES.VOTING || phase === PHASES.REVEAL) {
      const singlePlayer = this.room.players.find(p => p.id === game.singlePlayerId);
      if (singlePlayer && singlePlayer.isBot) {
        activeBotId = singlePlayer.id;
      }
    }

    if (!activeBotId) return;

    // Schedule bot action with realistic human-like delay (1.2s - 1.5s)
    setTimeout(() => {
      if (!this.room || !this.room.game) return;
      const move = this.room.game.getBotMove(activeBotId);
      if (!move) return;

      if (move.type === 'place_white_card') {
        this.room.game.placeSingleWhiteCard(activeBotId, move.cardId, move.customText);
        const botObj = this.room.players.find(p => p.id === activeBotId);
        this.broadcast('play_sound_event', { type: 'white_card', playerId: activeBotId, playerName: botObj?.name || 'bot' });
        this.broadcastGameState();
        this.checkAndTriggerBotTurn();
      } else if (move.type === 'submit_sabotage') {
        this.room.game.submitSabotage(activeBotId, move.cardId, this.room.players, move.customText);
        const botObj = this.room.players.find(p => p.id === activeBotId);
        this.broadcast('play_sound_event', { type: 'red_card', playerId: activeBotId, playerName: botObj?.name || 'bot' });
        this.broadcastGameState();
        this.checkAndTriggerBotTurn();
      } else if (move.type === 'select_winner') {
        this.room.game.selectWinner(activeBotId, move.winningMatchmakerId, this.room.players);
        const winner = this.room.players.find(p => p.id === move.winningMatchmakerId);
        this.broadcast('play_sound_event', { type: 'game_win', playerId: move.winningMatchmakerId, playerName: winner?.name || 'kazanan' });
        this.broadcastGameState();

        if (this.room.game.phase === PHASES.GAME_OVER) {
          this.handleGameOverCoins();
        } else if (this.room.game.phase === PHASES.ROUND_SUMMARY) {
          if (this.state?.storage?.setAlarm) {
            try {
              this.state.storage.setAlarm(Date.now() + 3500);
            } catch (e) {}
          }
          setTimeout(() => {
            try {
              if (this.room && this.room.game && this.room.game.phase === PHASES.ROUND_SUMMARY) {
                this.room.game.nextRound(this.room.players);
                this.broadcastGameState();
                this.checkAndTriggerBotTurn();
              }
            } catch (err) {
              console.error('Bot auto nextRound error:', err);
            }
          }, 3500);
        }
      }
    }, 1350);
  }

  async handleGameOverCoins() {
    if (!this.room || !this.room.game || this.room.game.phase !== PHASES.GAME_OVER) return;
    try {
      let storageObj = null;
      if (this.env && this.env.GAME_ROOMS) {
        const id = this.env.GAME_ROOMS.idFromName('GLOBAL_CARDS_STORAGE');
        storageObj = this.env.GAME_ROOMS.get(id);
      }

      let config = DEFAULT_CONFIG;
      let usersList = [];

      if (storageObj) {
        const [cfgRes, usersRes] = await Promise.all([
          storageObj.fetch(new Request('http://internal/api/config')).catch(() => null),
          storageObj.fetch(new Request('http://internal/api/users')).catch(() => null)
        ]);
        if (cfgRes && cfgRes.ok) config = await cfgRes.json();
        if (usersRes && usersRes.ok) usersList = await usersRes.json();
      } else if (this.state?.storage) {
        config = (await this.state.storage.get('app_config')) || DEFAULT_CONFIG;
        const map = (await this.state.storage.get('users_map')) || {};
        usersList = Object.values(map);
      }

      const multipliers = config.coinMultipliers || { default: 10, premium: 20, vip: 30 };
      const usersMap = {};
      usersList.forEach(u => { if (u && u.id) usersMap[u.id] = u; });

      const playerCount = (this.room.players || []).length || 1;
      const earnedCoinsMap = {};

      for (const p of this.room.players) {
        const dId = p.discordId || p.id;
        const pScore = Number(this.room.game.scores[p.id]) || 0;
        const userRec = usersMap[dId];

        if (userRec) {
          const tags = (userRec.tags || []).map(t => String(t || '').toLowerCase());
          let mult = Number(multipliers.default) || 10;
          if (tags.includes('admin') || tags.includes('vip')) {
            mult = Number(multipliers.vip) || 30;
          } else if (tags.includes('premium')) {
            mult = Number(multipliers.premium) || 20;
          }

          const earned = Math.max(0, Math.floor(((pScore + 1) * mult) * playerCount));
          earnedCoinsMap[p.id] = earned;

          const newCoins = (Number(userRec.coins) || 0) + earned;
          const newTotalScore = (Number(userRec.totalScore) || 0) + pScore;
          const newTotalGames = (Number(userRec.totalGames) || 0) + 1;

          if (storageObj) {
            await storageObj.fetch(new Request('http://internal/api/users/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: dId,
                coins: newCoins,
                totalScore: newTotalScore,
                totalGames: newTotalGames
              })
            })).catch(() => {});
          } else if (this.state?.storage) {
            userRec.coins = newCoins;
            userRec.totalScore = newTotalScore;
            userRec.totalGames = newTotalGames;
            userRec.updatedAt = Date.now();
          }
        }
      }

      if (!storageObj && this.state?.storage) {
        await this.state.storage.put('users_map', usersMap);
      }

      this.room.game.earnedCoins = earnedCoinsMap;
      this.broadcastGameState();
    } catch (err) {
      console.error('Error awarding game over coins:', err);
    }
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

    // 2. Dynamic OG Image API (/api/og, /og)
    if (url.pathname === '/api/og' || url.pathname === '/og') {
      const roomCode = url.searchParams.get('room') || url.searchParams.get('join') || url.searchParams.get('r') || '';
      try {
        const png = await generateRoomOgPng(roomCode);
        return new Response(png, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } catch (err) {
        return new Response('Error generating image: ' + err.message, { status: 500, headers: corsHeaders });
      }
    }

    // 3. Database API Routing (/api/deck, /api/users, /api/config, /api/suggestions)
    if (url.pathname.startsWith('/api/deck') || url.pathname.startsWith('/api/users') || url.pathname.startsWith('/api/config') || url.pathname.startsWith('/api/suggestions')) {
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
