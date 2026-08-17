// Red Flags (DoxCards) - Realtime Game Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager.js';
import { PHASES } from './gameEngine.js';

import rawDeckJson from '../src/data/defaultDeck.json' with { type: 'json' };

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let localActiveDeck = rawDeckJson;
let localUsersMap = {};
let localSuggestions = [];
let localConfig = {
  guestDecks: ['Ana Deste'],
  discordDecks: ['Ana Deste', 'Ek Paket'],
  allDecks: [
    'Ana Deste',
    'Ek Paket',
    'Nerd Paket',
    'Fenasal Nerd Paket',
    'Sekso Paket',
    'Kara Paket'
  ],
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
      animation: 'crimson_flare',
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
      animation: 'neon_pulse',
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
      animation: 'cyber_scan',
      permissions: {
        customSounds: true,
        allDecks: false,
        adminAccess: false,
        multiplier: 20
      }
    }
  ]
};

// Healthcheck endpoint for Cloudflare / cloud hosting
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'doxcards-server', time: new Date().toISOString() });
});

// Deck API
app.get('/api/deck', (req, res) => {
  res.json(localActiveDeck);
});

app.post('/api/deck', (req, res) => {
  const newDeck = req.body.deck || req.body;
  if (newDeck) {
    localActiveDeck = newDeck;
  }
  res.json({ success: true, message: 'Deste yerel sunucuya kaydedildi.' });
});

app.post('/api/deck/reset', (req, res) => {
  localActiveDeck = rawDeckJson;
  res.json({ success: true, message: 'Deste sıfırlandı.' });
});

// Config API
app.get('/api/config', (req, res) => {
  res.json(localConfig);
});

app.post('/api/config', (req, res) => {
  localConfig = { ...localConfig, ...req.body };
  res.json({ success: true, config: localConfig });
});

// Users API
app.get('/api/users', (req, res) => {
  res.json(Object.values(localUsersMap));
});

app.post('/api/users/sync', (req, res) => {
  const { id, username, displayName, avatar } = req.body;
  if (!id) return res.status(400).json({ error: 'ID required' });
  let user = localUsersMap[id];
  if (user) {
    user.username = username || user.username;
    user.displayName = displayName || user.displayName;
    if (avatar) user.avatar = avatar;
    if (user.coins === undefined) user.coins = 0;
    user.updatedAt = Date.now();
  } else {
    user = {
      id,
      username: username || displayName || 'oyuncu',
      displayName: displayName || username || 'oyuncu',
      avatar: avatar || null,
      coins: 0,
      totalScore: 0,
      tags: id === '269639754675519489' ? ['admin'] : [],
      unlockedDecks: id === '269639754675519489' ? [...localConfig.allDecks] : [...localConfig.discordDecks],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    localUsersMap[id] = user;
  }
  res.json({ success: true, user });
});

app.post('/api/users/update', (req, res) => {
  const { userId, coins, totalScore, ...rest } = req.body;
  if (!userId || !localUsersMap[userId]) return res.status(404).json({ error: 'User not found' });
  if (typeof coins === 'number') localUsersMap[userId].coins = coins;
  if (typeof totalScore === 'number') localUsersMap[userId].totalScore = totalScore;
  Object.assign(localUsersMap[userId], rest, { updatedAt: Date.now() });
  res.json({ success: true, user: localUsersMap[userId] });
});

// Suggestions API
app.get('/api/suggestions', (req, res) => {
  const discordId = req.query.discordId;
  const isMainAdmin = !discordId || discordId === '269639754675519489' || req.query.admin === 'true';
  if (isMainAdmin) {
    res.json(localSuggestions);
  } else {
    res.json(localSuggestions.filter(s => s.author?.id === discordId));
  }
});

app.post('/api/suggestions/create', (req, res) => {
  const newSug = {
    id: 'sug_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    ...req.body,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  localSuggestions.unshift(newSug);
  res.json({ success: true, suggestion: newSug });
});

app.post('/api/suggestions/update', (req, res) => {
  const { suggestionId, ...rest } = req.body;
  const target = localSuggestions.find(s => s.id === suggestionId);
  if (!target) return res.status(404).json({ error: 'Suggestion not found' });
  Object.assign(target, rest, { updatedAt: Date.now() });
  res.json({ success: true, suggestion: target });
});

app.post('/api/suggestions/delete', (req, res) => {
  const { suggestionId } = req.body;
  localSuggestions = localSuggestions.filter(s => s.id !== suggestionId);
  res.json({ success: true });
});

app.post('/api/suggestions/review', (req, res) => {
  const { suggestionId, status } = req.body;
  const target = localSuggestions.find(s => s.id === suggestionId);
  if (!target) return res.status(404).json({ error: 'Suggestion not found' });
  target.status = status;
  target.reviewedAt = Date.now();
  res.json({ success: true, suggestion: target });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Broadcast game state specifically tailored for each player in room
function broadcastGameState(room) {
  if (!room || !room.game) return;

  room.players.forEach(player => {
    if (player.connected && player.socketId) {
      const state = room.game.getGameState(player.id, room.players);
      io.to(player.socketId).emit('game_state_update', {
        room: {
          code: room.code,
          hostId: room.hostId,
          players: room.players,
          settings: room.settings
        },
        gameState: state
      });
    }
  });
}

function broadcastRoomUpdate(room) {
  if (!room) return;
  io.to(room.code).emit('room_updated', {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    settings: room.settings,
    isGameActive: !!(room.game && room.game.phase !== PHASES.LOBBY)
  });
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  socket.on('ping', () => {
    socket.emit('pong', { time: Date.now() });
  });

  // Create Room
  socket.on('create_room', ({ player, settings }, callback) => {
    try {
      const room = roomManager.createRoom({ ...player, socketId: socket.id }, settings);
      socket.join(room.code);
      socket.roomCode = room.code;
      socket.playerId = player.id;

      console.log(`[Room Created] Code: ${room.code} by ${player.name}`);
      if (callback) {
        callback({
          success: true,
          roomCode: room.code,
          room: {
            code: room.code,
            hostId: room.hostId,
            players: room.players,
            settings: room.settings
          },
          player: room.players[0]
        });
      }
      broadcastRoomUpdate(room);
    } catch (err) {
      console.error('Error creating room:', err);
      if (callback) callback({ error: 'Oda oluşturulurken bir hata oluştu.' });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, player }, callback) => {
    try {
      const result = roomManager.joinRoom(roomCode, { ...player, socketId: socket.id });
      if (result.error) {
        if (callback) callback({ error: result.error });
        return;
      }

      const { room, player: joinedPlayer } = result;
      socket.join(room.code);
      socket.roomCode = room.code;
      socket.playerId = joinedPlayer.id;

      console.log(`[Player Joined] ${joinedPlayer.name} joined ${room.code}`);
      if (callback) {
        callback({
          success: true,
          roomCode: room.code,
          room: {
            code: room.code,
            hostId: room.hostId,
            players: room.players,
            settings: room.settings
          },
          player: joinedPlayer
        });
      }

      // Add system message
      const sysMsg = roomManager.addMessage(room.code, {
        senderName: 'Sistem',
        senderColor: '#10b981',
        text: `${joinedPlayer.name} odaya katıldı!`,
        isSystem: true
      });
      if (sysMsg) io.to(room.code).emit('new_message', sysMsg);

      broadcastRoomUpdate(room);
      if (room.game) {
        broadcastGameState(room);
      }
    } catch (err) {
      console.error('Error joining room:', err);
      if (callback) callback({ error: 'Odaya katılırken bir hata oluştu.' });
    }
  });

  // Update Room Settings
  socket.on('update_settings', ({ roomCode, settings }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    roomManager.updateSettings(roomCode, settings);
    broadcastRoomUpdate(room);
    if (room.game) broadcastGameState(room);
  });

  // Toggle Ready Status
  socket.on('toggle_ready', ({ roomCode, playerId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    roomManager.toggleReady(roomCode, playerId);
    broadcastRoomUpdate(room);
  });

  // Start Game
  socket.on('start_game', ({ roomCode, playerId }, callback) => {
    const result = roomManager.startGame(roomCode, playerId);
    if (result.error) {
      if (callback) callback({ error: result.error });
      return;
    }

    const { room } = result;
    room.game.onStateChange = () => {
      broadcastGameState(room);
    };

    console.log(`[Game Started] Room: ${room.code}`);
    io.to(room.code).emit('game_started');
    broadcastGameState(room);
    if (callback) callback({ success: true });
  });

  // Matchmaker Submits 2 Perks (White Cards)
  socket.on('submit_perks', ({ roomCode, playerId, cardIds }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return;

    const ok = room.game.submitPerks(playerId, cardIds);
    if (ok) {
      broadcastGameState(room);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ error: 'Kartlar seçilemedi.' });
    }
  });

  // Matchmaker Submits 1 Red Flag (Sabotage)
  socket.on('submit_sabotage', ({ roomCode, playerId, cardId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return;

    const ok = room.game.submitSabotage(playerId, cardId, room.players);
    if (ok) {
      broadcastGameState(room);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ error: 'Sabotaj kartı gönderilemedi.' });
    }
  });

  // Single selects winning candidate
  socket.on('bekar_select_winner', ({ roomCode, singlePlayerId, winningMatchmakerId }, callback) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.game) return;

    const ok = room.game.bekarSelectWinner(singlePlayerId, winningMatchmakerId, room.players);
    if (ok) {
      if (room.game.phase === PHASES.GAME_OVER) {
        const multipliers = localConfig.coinMultipliers || { default: 10, premium: 20, vip: 30 };
        const playerCount = (room.players || []).length || 1;
        const earnedCoinsMap = {};

        room.players.forEach(p => {
          const dId = p.discordId || p.id;
          const user = localUsersMap[dId];
          const pScore = Number(room.game.scores[p.id]) || 0;

          if (user) {
            const tags = (user.tags || []).map(t => String(t || '').toLowerCase());
            let mult = Number(multipliers.default) || 10;
            if (tags.includes('admin') || tags.includes('vip')) {
              mult = Number(multipliers.vip) || 30;
            } else if (tags.includes('premium')) {
              mult = Number(multipliers.premium) || 20;
            }

            const earned = Math.max(0, Math.floor(((pScore + 1) * mult) * playerCount));
            earnedCoinsMap[p.id] = earned;

            user.coins = (Number(user.coins) || 0) + earned;
            user.totalScore = (Number(user.totalScore) || 0) + pScore;
            user.updatedAt = Date.now();
          }
        });

        room.game.earnedCoins = earnedCoinsMap;
      }

      broadcastGameState(room);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ error: 'Seçim onaylanamadı.' });
    }
  });

  // Play Again (Reset to Lobby)
  socket.on('play_again', ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    if (room.game) {
      room.game.clearTimer();
      room.game = null;
    }
    room.players.forEach(p => { p.isReady = false; });
    io.to(room.code).emit('game_reset_to_lobby');
    broadcastRoomUpdate(room);
  });

  // Chat message
  socket.on('send_message', ({ roomCode, message }) => {
    const msg = roomManager.addMessage(roomCode, message);
    if (msg) {
      io.to(roomCode).emit('new_message', msg);
    }
  });

  // Live reaction / emoji / sound
  socket.on('send_reaction', ({ roomCode, reaction, senderName }) => {
    io.to(roomCode).emit('reaction_received', {
      reaction,
      senderName,
      id: Math.random().toString(36).substring(2, 7)
    });
  });

  // Live Card Drag Motion Synchronization
  socket.on('card_drag_motion', (data) => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit('player_card_drag_motion', data);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const res = roomManager.leaveRoom(socket.id);
    if (res && res.room) {
      console.log(`[Player Left] ${res.player?.name} from room ${res.roomCode}`);
      broadcastRoomUpdate(res.room);
      if (res.room.game) {
        broadcastGameState(res.room);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[DoxCards Server] Running on http://localhost:${PORT}`);
});
