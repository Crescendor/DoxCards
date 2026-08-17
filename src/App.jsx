import React, { useState, useEffect, useRef } from 'react';
import { socket, getLocalPlayer, saveLocalPlayer } from './services/socket';
import { sounds } from './services/soundEffects';
import LandingPage from './components/LandingPage';
import LobbyView from './components/LobbyView';
import GameView from './components/GameView';
import Navbar from './components/Navbar';
import HowToPlayModal from './components/HowToPlayModal';
import RightSidebarDrawer from './components/RightSidebarDrawer';
import AdminPageView from './components/AdminPageView';
import { getDiscordUser, logoutDiscord } from './services/discordAuth';
import { syncUserProfile, getLocalUserProfile, fetchAppConfig } from './services/userService';

export default function App() {
  const [player, setPlayer] = useState(getLocalPlayer());
  const [userProfile, setUserProfile] = useState(getLocalUserProfile());
  const [appConfig, setAppConfig] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(window.location.search.includes('admin'));
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync Discord user profile & App Config on mount
  useEffect(() => {
    fetchAppConfig().then(cfg => {
      if (cfg) {
        setAppConfig(cfg);
        if (cfg.customSounds) sounds.setCustomSounds(cfg.customSounds);
      }
    });

    const dUser = getDiscordUser();
    if (dUser) {
      syncUserProfile(dUser).then(profile => {
        if (profile) setUserProfile(profile);
      });
    }
  }, []);

  // Update persistent player
  const handleUpdatePlayer = (updated) => {
    setPlayer(updated);
    saveLocalPlayer(updated);
  };

  const handleLogout = () => {
    logoutDiscord();
    setUserProfile(null);
    handleUpdatePlayer({
      ...player,
      avatar: null,
      discordId: null
    });
    window.location.replace(window.location.origin + window.location.pathname);
  };

  // Toggle Mute
  const handleToggleSound = () => {
    const isMuted = sounds.toggleMute();
    setSoundMuted(isMuted);
  };

  const currentRoomRef = useRef(currentRoom);
  const appConfigRef = useRef(appConfig);
  useEffect(() => {
    currentRoomRef.current = currentRoom;
    appConfigRef.current = appConfig;
  }, [currentRoom, appConfig]);

  // Socket Event Listeners (Registered once, stable throughout lifecycle)
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

      if (gameState?.phase === 'GAME_OVER' && gameState?.earnedCoins) {
        const cached = getLocalUserProfile();
        if (cached?.id) {
          const myEarned = gameState.earnedCoins[player.id] || gameState.earnedCoins[cached.id];
          if (myEarned && myEarned > 0) {
            const updated = {
              ...cached,
              coins: (cached.coins || 0) + myEarned
            };
            saveLocalUserProfile(updated);
            setUserProfile(updated);
          }
        }
      }
    });

    socket.on('play_sound_event', (soundEvt) => {
      if (!soundEvt) return;
      const { type, playerId, customSounds: playerCustomSounds } = soundEvt;
      const actorPlayer = currentRoomRef.current?.players?.find(p => p.id === playerId);
      const playerWithSounds = {
        ...(actorPlayer || {}),
        customSounds: playerCustomSounds || actorPlayer?.customSounds || null
      };
      sounds.playTriggerSound(type, playerWithSounds, appConfigRef.current?.customSounds || []);
    });

    socket.on('game_reset_to_lobby', () => {
      setGameState(null);
    });

    socket.on('kicked_from_room', ({ reason }) => {
      alert(reason || 'Oda kurucusu tarafından odadan çıkarıldınız.');
      window.location.replace(window.location.origin + window.location.pathname);
    });

    return () => {
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('game_state_update');
      socket.off('play_sound_event');
      socket.off('game_reset_to_lobby');
      socket.off('kicked_from_room');
    };
  }, []);

  // Auto-advance round when phase is ROUND_SUMMARY
  useEffect(() => {
    if (gameState?.phase === 'ROUND_SUMMARY' && currentRoom?.code) {
      const timer = setTimeout(() => {
        socket.emit('next_round', { roomCode: currentRoom.code });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, currentRoom?.code]);

  // Get enriched player with live profile data & tags
  const getEnrichedPlayer = () => ({
    ...player,
    tags: userProfile?.tags || (userProfile?.id === '269639754675519489' ? ['admin'] : (player.tags || [])),
    discordId: userProfile?.id || player.discordId,
    avatar: userProfile?.avatar || player.avatar,
    customSounds: userProfile?.customSounds || player.customSounds || null
  });

  // Create Room
  const handleCreateRoom = (settings) => {
    setError(null);
    setIsLoading(true);

    const activePlayer = getEnrichedPlayer();

    const timer = setTimeout(() => {
      setIsLoading(false);
      setError('Sunucuya bağlanılamadı. Lütfen WebSocket sunucusunun aktif olduğunu kontrol edin.');
    }, 6000);

    socket.emit('create_room', { player: activePlayer, settings }, (res) => {
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

    const activePlayer = getEnrichedPlayer();

    const timer = setTimeout(() => {
      setIsLoading(false);
      setError('sunucuya bağlanılamadı. lütfen oda kodunu ve internet bağlantınızı kontrol edin.');
    }, 6000);

    socket.emit('join_room', { roomCode: (roomCode || '').toLowerCase().trim(), player: activePlayer }, (res) => {
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
    setCurrentRoom(null);
    setGameState(null);
    window.location.replace(window.location.origin + window.location.pathname);
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

  // Add Bot Player (Admin Host)
  const handleAddBot = () => {
    if (!currentRoom) return;
    socket.emit('add_bot_player', {
      roomCode: currentRoom.code,
      hostId: player.id
    }, (res) => {
      if (res?.error) alert(res.error);
    });
  };

  // Remove Bot Player (Admin Host)
  const handleRemoveBot = (botId) => {
    if (!currentRoom) return;
    socket.emit('remove_bot_player', {
      roomCode: currentRoom.code,
      hostId: player.id,
      botId
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
    const activeCustomSounds = userProfile?.customSounds || player?.customSounds || null;
    sounds.playTriggerSound('white_card', { customSounds: activeCustomSounds }, appConfig?.customSounds || []);
    socket.emit('place_white_card', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardId,
      customText,
      customSounds: activeCustomSounds
    });
  };

  // Submit Perks (Batch fallback)
  const handleSubmitPerks = (cardIds, customTexts = {}) => {
    if (!currentRoom) return;
    const activeCustomSounds = userProfile?.customSounds || player?.customSounds || null;
    sounds.playTriggerSound('white_card', { customSounds: activeCustomSounds }, appConfig?.customSounds || []);
    socket.emit('submit_perks', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardIds,
      customTexts,
      customSounds: activeCustomSounds
    });
  };

  // Submit Sabotage (Matchmaker 1 Red Flag Card)
  const handleSubmitSabotage = (cardId, customText = null) => {
    if (!currentRoom) return;
    const activeCustomSounds = userProfile?.customSounds || player?.customSounds || null;
    sounds.playTriggerSound('red_card', { customSounds: activeCustomSounds }, appConfig?.customSounds || []);
    socket.emit('submit_sabotage', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardId,
      customText,
      customSounds: activeCustomSounds
    });
  };

  // Select Winner (Single Player)
  const handleSelectWinner = (winnerMatchmakerId) => {
    if (!currentRoom) return;
    const winningPlayer = currentRoom?.players?.find(p => p.id === winnerMatchmakerId);
    const winCustomSounds = winningPlayer?.customSounds || null;
    sounds.playTriggerSound('game_win', { customSounds: winCustomSounds }, appConfig?.customSounds || []);
    socket.emit('select_winner', {
      roomCode: currentRoom.code,
      playerId: player.id,
      singlePlayerId: player.id,
      winningMatchmakerId: winnerMatchmakerId,
      winnerCustomSounds: winCustomSounds
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

      {/* Top Navbar (Only outside of active game) */}
      {!isGameActive && (
        <Navbar
          roomCode={currentRoom?.code}
          isGameActive={isGameActive}
          onLeave={handleLeaveRoom}
          onOpenHelp={() => setIsHelpOpen(true)}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          userProfile={userProfile}
          onUpdateProfile={(updated) => setUserProfile(updated)}
          onLogout={handleLogout}
        />
      )}

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
            onAddBot={handleAddBot}
            onRemoveBot={handleRemoveBot}
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
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
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
