import React, { useState, useEffect } from 'react';
import { socket, getLocalPlayer, saveLocalPlayer } from './services/socket';
import { sounds } from './services/soundEffects';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import LobbyView from './components/LobbyView';
import GameView from './components/GameView';
import ChatDrawer from './components/ChatDrawer';
import HowToPlayModal from './components/HowToPlayModal';

import './styles/index.css';
import './styles/lobby.css';
import './styles/game.css';

export default function App() {
  const [player, setPlayer] = useState(getLocalPlayer());
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [soundMuted, setSoundMuted] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-check URL for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl && !currentRoom) {
      // Prompt join or auto fill
    }
  }, []);

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

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('reaction_received', ({ reaction, senderName, id }) => {
      sounds.playReaction();
      const x = Math.random() * 60 + 20; // 20% to 80% of screen width
      setFloatingReactions(prev => [...prev, { id, emoji: reaction, x }]);

      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    });

    return () => {
      socket.off('room_updated');
      socket.off('game_started');
      socket.off('game_state_update');
      socket.off('game_reset_to_lobby');
      socket.off('new_message');
      socket.off('reaction_received');
    };
  }, []);

  // Create Room
  const handleCreateRoom = (settings) => {
    setError(null);
    setIsLoading(true);
    socket.emit('create_room', { player, settings }, (res) => {
      setIsLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setCurrentRoom(res.room);
        setGameState(null);
      }
    });
  };

  // Join Room
  const handleJoinRoom = (roomCode) => {
    setError(null);
    setIsLoading(true);
    socket.emit('join_room', { roomCode, player }, (res) => {
      setIsLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setCurrentRoom(res.room);
        setGameState(null);
      }
    });
  };

  // Leave Room
  const handleLeaveRoom = () => {
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

  // Toggle Ready
  const handleToggleReady = () => {
    if (!currentRoom) return;
    socket.emit('toggle_ready', { roomCode: currentRoom.code, playerId: player.id });
  };

  // Update Settings (Host)
  const handleUpdateSettings = (settings) => {
    if (!currentRoom) return;
    socket.emit('update_settings', { roomCode: currentRoom.code, settings });
  };

  // Submit Perks (Matchmaker 2 White Cards)
  const handleSubmitPerks = (cardIds) => {
    if (!currentRoom) return;
    socket.emit('submit_perks', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardIds
    });
  };

  // Submit Sabotage (Matchmaker 1 Red Flag Card)
  const handleSubmitSabotage = (cardId) => {
    if (!currentRoom) return;
    socket.emit('submit_sabotage', {
      roomCode: currentRoom.code,
      playerId: player.id,
      cardId
    });
  };

  // Select Winner (Single)
  const handleSelectWinner = (winningMatchmakerId) => {
    if (!currentRoom) return;
    socket.emit('bekar_select_winner', {
      roomCode: currentRoom.code,
      singlePlayerId: player.id,
      winningMatchmakerId
    });
  };

  // Play Again (Host)
  const handlePlayAgain = () => {
    if (!currentRoom) return;
    socket.emit('play_again', { roomCode: currentRoom.code });
  };

  // Send Chat Message
  const handleSendMessage = (message) => {
    if (!currentRoom) return;
    socket.emit('send_message', { roomCode: currentRoom.code, message });
  };

  // Send Reaction
  const handleSendReaction = (reaction) => {
    if (!currentRoom) return;
    socket.emit('send_reaction', {
      roomCode: currentRoom.code,
      reaction,
      senderName: player.name
    });
  };

  const isGameActive = gameState && gameState.phase && gameState.phase !== 'LOBBY';

  return (
    <div className={`app-container ${isGameActive ? 'in-game-mode' : ''}`}>
      {/* Ambient background glows (shown in game mode) */}
      {isGameActive && (
        <>
          <div className="ambient-glow ambient-glow-1" />
          <div className="ambient-glow ambient-glow-2" />
        </>
      )}

      {/* Floating Reactions on Screen */}
      {floatingReactions.map((r) => (
        <div
          key={r.id}
          className="floating-reaction"
          style={{ left: `${r.x}%`, bottom: '150px' }}
        >
          {r.emoji}
        </div>
      ))}

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
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
            isLoading={isLoading}
          />
        ) : (
          <GameView
            room={currentRoom}
            gameState={gameState}
            player={player}
            onSubmitPerks={handleSubmitPerks}
            onSubmitSabotage={handleSubmitSabotage}
            onSelectWinner={handleSelectWinner}
            onPlayAgain={handlePlayAgain}
            onLeave={handleLeaveRoom}
          />
        )}
      </main>

      {/* In-Game Live Chat & Reactions Drawer */}
      {currentRoom && isGameActive && (
        <ChatDrawer
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
          player={player}
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
