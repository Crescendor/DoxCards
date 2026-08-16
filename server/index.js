// Red Flags (DoxCards) - Realtime Game Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager.js';
import { PHASES } from './gameEngine.js';

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck endpoint for Cloudflare / cloud hosting
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'doxcards-server', time: new Date().toISOString() });
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
  console.log(`🚀 Red Flags DoxCards Server running on http://localhost:${PORT}`);
});
