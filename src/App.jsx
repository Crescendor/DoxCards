import React, { useState, useEffect } from 'react';
import { socket, getLocalPlayer, saveLocalPlayer } from './services/socket';
import { sounds } from './services/soundEffects';
import LandingPage from './components/LandingPage';
import LobbyView from './components/LobbyView';
import GameView from './components/GameView';
import Navbar from './components/Navbar';
import HowToPlayModal from './components/HowToPlayModal';
import RightSidebarDrawer from './components/RightSidebarDrawer';
import AdminPageView from './components/AdminPageView';
import { getDiscordUser } from './services/discordAuth';

export default function App() {
  const [player, setPlayer] = useState(getLocalPlayer());
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(window.location.search.includes('admin'));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update persistent player
  const handleUpdatePlayer = (updated) => {
    setPlayer(updated);
    saveLocalPlayer(updated);
  };

  // Toggle Mute
  const handleToggleSound = () => {
    const isMuted = sounds.toggleMute();
    setSoundMuted(isMuted);
  };

  // Socket Event Listeners
  useEffect(() => {
    socket.on('room_updated', (roomData) => {
      setCurrentRoom(prev => ({ ...prev, ...roomData }));
    });

    socket.on('game_started', () => {
      sounds.playWin();
    });

    socket.on('game_state_update', ({ room, gameState }) => {
      if (room) setCurrentRoom(room);
      setGameState(gameState);
    });

    socket.on('game_reset_to_lobby', () => {
      setGameState(null);
    });

    socket.on('kicked_from_room', ({ reason }) => {
      alert(reason || 'Oda kurucusu tarafından odadan çıkarıldınız.');
      window.history.pushState({}, '', window.location.pathname);
      window.location.reload();
    });

    return () => {
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('game_state_update');
      socket.off('game_reset_to_lobby');
      socket.off('kicked_from_room');
    };
  }, []);

  // Create Room
  const handleCreateRoom = (settings) => {
    setError(null);
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setError('Sunucuya bağlanılamadı. Lütfen WebSocket sunucusunun aktif olduğunu kontrol edin.');
    }, 6000);

    socket.emit('create_room', { player, settings }, (res) => {
      clearTimeout(timer);
      setIsLoading(false);
      if (!res) {
        setError('Sunucudan yanıt alınamadı.');
      } else if (res.error) {
        setError(res.error);
      } else if (res.room) {
        setCurrentRoom(res.room);
        setGameState(null);
        window.history.pushState({}, '', `?room=${res.room.code.toLowerCase()}`);
      }
    });
  };

  // Join Room
  const handleJoinRoom = (roomCode) => {
    setError(null);
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setError('sunucuya bağlanılamadı. lütfen oda kodunu ve internet bağlantınızı kontrol edin.');
    }, 6000);

    socket.emit('join_room', { roomCode: (roomCode || '').toLowerCase().trim(), player }, (res) => {
      clearTimeout(timer);
      setIsLoading(false);
      if (!res) {
        setError('sunucudan yanıt alınamadı.');
      } else if (res.error) {
        setError(res.error);
      } else if (res.room) {
        setCurrentRoom(res.room);
        setGameState(null);
        window.history.pushState({}, '', `?room=${res.room.code.toLowerCase()}`);
      }
    });
  };

  // Leave Room
  const handleLeaveRoom = () => {
    if (currentRoom) {
      socket.emit('leave_room', { roomCode: currentRoom.code, playerId: player.id });
    }
    window.history.pushState({}, '', window.location.pathname);
    window.location.reload();
  };

  // Start Game (Host)
  const handleStartGame = () => {
    if (!currentRoom) return;
    setIsLoading(true);
    socket.emit('start_game', { roomCode: currentRoom.code, playerId: player.id }, (res) => {
      setIsLoading(false);
      if (res?.error) {
        alert(res.error);
      }
    });
  };

  // Stop Game / Reset to Lobby (Host)
  const handleStopGame = () => {
    if (!currentRoom) return;
    socket.emit('stop_game', { roomCode: currentRoom.code, hostId: player.id });
  };

  // Kick Player (Host)
  const handleKickPlayer = (targetPlayerId) => {
    if (!currentRoom) return;
    socket.emit('kick_player', {
      roomCode: currentRoom.code,
      hostId: player.id,
      targetPlayerId
    });
  };

  // Toggle Ready (Non-host)
  const handleToggleReady = () => {
    if (!currentRoom) return;
    socket.emit('toggle_ready', {
      roomCode: currentRoom.code,
      playerId: player.id
    });
  };

  // Update Settings (Host)
  const handleUpdateSettings = (newSettings) => {
    if (!currentRoom) return;
    socket.emit('update_settings', {
      roomCode: currentRoom.code,
      settings: newSettings
    });
  };

  // Place Single White Card (Instant visibility on table)
  const handlePlaceWhiteCard = (cardId, customText = null) => {
    if (!currentRoom) return;
    socket.emit('place_white_card', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardId,
      customText
    });
  };

  // Submit Perks (Batch fallback)
  const handleSubmitPerks = (cardIds, customTexts = {}) => {
    if (!currentRoom) return;
    socket.emit('submit_perks', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardIds,
      customTexts
    });
  };

  // Submit Sabotage (Matchmaker 1 Red Flag Card)
  const handleSubmitSabotage = (cardId, customText = null) => {
    if (!currentRoom) return;
    socket.emit('submit_sabotage', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardId,
      customText
    });
  };

  // Select Winner (Single Player)
  const handleSelectWinner = (winnerMatchmakerId) => {
    if (!currentRoom) return;
    socket.emit('select_winner', {
      roomCode: currentRoom.code,
      playerId: player.id,
      winnerMatchmakerId
    });
  };

  // Play Again (Host)
  const handlePlayAgain = () => {
    if (!currentRoom) return;
    socket.emit('play_again', { roomCode: currentRoom.code });
  };

  // Full-Screen Dedicated Admin Page View
  if (isAdminView) {
    return (
      <AdminPageView
        onBack={() => {
          setIsAdminView(false);
          window.history.pushState({}, '', window.location.pathname);
        }}
        discordUser={getDiscordUser()}
      />
    );
  }

  const isGameActive = gameState && gameState.phase && gameState.phase !== 'LOBBY';
  const isHost = currentRoom?.hostId === player.id;

  return (
    <div className={`app-container ${isGameActive ? 'in-game-mode' : ''}`}>
      {/* Ambient background glows */}
      {isGameActive && (
        <>
          <div className="ambient-glow ambient-glow-1" />
          <div className="ambient-glow ambient-glow-2" />
        </>
      )}

      {/* Top Navbar */}
      <Navbar
        roomCode={currentRoom?.code}
        isGameActive={isGameActive}
        onLeave={handleLeaveRoom}
        onOpenHelp={() => setIsHelpOpen(true)}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Main View Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!currentRoom ? (
          <LandingPage
            player={player}
            onUpdatePlayer={handleUpdatePlayer}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenAdmin={() => {
              setIsAdminView(true);
              window.history.pushState({}, '', '?admin=true');
            }}
            error={error}
            isLoading={isLoading}
          />
        ) : !isGameActive ? (
          <LobbyView
            room={currentRoom}
            player={player}
            onStartGame={handleStartGame}
            onToggleReady={handleToggleReady}
            onUpdateSettings={handleUpdateSettings}
            onKickPlayer={handleKickPlayer}
            isLoading={isLoading}
          />
        ) : (
          <GameView
            room={currentRoom}
            gameState={gameState}
            player={player}
            onPlaceWhiteCard={handlePlaceWhiteCard}
            onSubmitPerks={handleSubmitPerks}
            onSubmitSabotage={handleSubmitSabotage}
            onSelectWinner={handleSelectWinner}
            onPlayAgain={handlePlayAgain}
            onLeave={handleLeaveRoom}
          />
        )}
      </main>

      {/* Slide-out Right Sidebar Menu (Available in Lobby and In-Game) */}
      {currentRoom && (
        <RightSidebarDrawer
          room={currentRoom}
          player={player}
          isHost={isHost}
          scores={gameState?.scores || {}}
          singlePlayerId={gameState?.singlePlayerId}
          onKickPlayer={handleKickPlayer}
          onStopGame={handleStopGame}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* How to Play Rules Modal */}
      <HowToPlayModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
