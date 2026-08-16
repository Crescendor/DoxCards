// Room Manager for Red Flags (DoxCards)
import { GameEngine, PHASES } from './gameEngine.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_PLAYERS = 6;

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
  }

  generateRoomCode() {
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostPlayer, settings = {}) {
    const roomCode = this.generateRoomCode();
    const defaultSettings = {
      targetScore: settings.targetScore || 3,
      roundTimerDuration: settings.roundTimerDuration !== undefined ? settings.roundTimerDuration : 45,
      deckType: settings.deckType || 'all'
    };

    const host = {
      id: hostPlayer.id,
      socketId: hostPlayer.socketId,
      name: hostPlayer.name.trim() || 'Oyuncu 1',
      avatar: hostPlayer.avatar || '👑',
      color: hostPlayer.color || '#ef4444',
      isHost: true,
      isReady: true,
      connected: true
    };

    const room = {
      code: roomCode,
      hostId: host.id,
      players: [host],
      settings: defaultSettings,
      game: null,
      messages: [],
      createdAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  joinRoom(roomCode, playerInfo) {
    const formattedCode = (roomCode || '').toUpperCase().trim();
    const room = this.getRoom(formattedCode);

    if (!room) {
      return { error: 'Oda bulunamadı! Lütfen 5 haneli kodu kontrol edin.' };
    }

    // Check if player is reconnecting
    const existingPlayer = room.players.find(p => p.id === playerInfo.id);
    if (existingPlayer) {
      existingPlayer.socketId = playerInfo.socketId;
      existingPlayer.connected = true;
      if (playerInfo.name) existingPlayer.name = playerInfo.name.trim();
      if (playerInfo.avatar) existingPlayer.avatar = playerInfo.avatar;
      return { room, player: existingPlayer, reconnected: true };
    }

    // New player joining
    if (room.players.length >= MAX_PLAYERS) {
      return { error: 'Bu oda maksimum 6 kişilik kapasitesine ulaşmış!' };
    }

    if (room.game && room.game.phase !== PHASES.LOBBY && room.game.phase !== PHASES.GAME_OVER) {
      return { error: 'Oyun şu an devam ediyor. Yeni tur veya lobi durumunda katılabilirsiniz.' };
    }

    const newPlayer = {
      id: playerInfo.id,
      socketId: playerInfo.socketId,
      name: playerInfo.name.trim() || `Oyuncu ${room.players.length + 1}`,
      avatar: playerInfo.avatar || '😎',
      color: playerInfo.color || '#3b82f6',
      isHost: room.players.length === 0,
      isReady: false,
      connected: true
    };

    room.players.push(newPlayer);
    return { room, player: newPlayer, reconnected: false };
  }

  leaveRoom(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socketId);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        
        // If in lobby, remove player
        if (!room.game || room.game.phase === PHASES.LOBBY) {
          room.players.splice(playerIndex, 1);
          // If room is empty, delete it
          if (room.players.length === 0) {
            this.rooms.delete(code);
            return { roomCode: code, deleted: true };
          }
          // If host left, assign new host
          if (player.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
          }
        } else {
          // If game is in progress, mark disconnected
          player.connected = false;
        }

        return { roomCode: code, player, room };
      }
    }
    return null;
  }

  updateSettings(roomCode, settings) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    room.settings = { ...room.settings, ...settings };
    if (room.game) {
      if (settings.targetScore !== undefined) room.game.targetScore = settings.targetScore;
      if (settings.roundTimerDuration !== undefined) room.game.roundTimerDuration = settings.roundTimerDuration;
    }
    return true;
  }

  toggleReady(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    player.isReady = !player.isReady;
    return player;
  }

  startGame(roomCode, playerId) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Oda bulunamadı.' };
    if (room.hostId !== playerId) return { error: 'Sadece oda kurucusu oyunu başlatabilir.' };
    if (room.players.length < 2) return { error: 'Oyunu başlatmak için en az 2 oyuncu gerekli.' };

    room.game = new GameEngine(roomCode, room.settings);
    room.game.startGame(room.players);
    return { success: true, room };
  }

  addMessage(roomCode, message) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      ...message,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    room.messages.push(msg);
    if (room.messages.length > 100) room.messages.shift();
    return msg;
  }
}
