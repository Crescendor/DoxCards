import React, { useEffect } from 'react';
import TabletopView from './TabletopView';
import GameOverModal from './GameOverModal';
import { sounds } from '../services/soundEffects';

export default function GameView({
  room,
  gameState,
  player,
  onSubmitPerks,
  onSubmitSabotage,
  onSelectWinner,
  onPlayAgain,
  onLeave
}) {
  const {
    phase,
    currentRound,
    targetScore,
    singlePlayerId,
    scores = {},
    stats = {},
    roundWinner,
    roundWinnerName
  } = gameState || {};

  const isHost = room.hostId === player.id;
  const players = room.players || [];

  // Play fanfare on round summary
  useEffect(() => {
    if (phase === 'ROUND_SUMMARY') {
      sounds.playWin();
    }
  }, [phase]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#141414' }}>
      {/* Minimal Top Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 24px',
        background: 'rgba(10, 10, 10, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100
      }}>
        {/* Round & Target Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: '#ff0000',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.8rem',
            padding: '3px 10px',
            borderRadius: '9999px',
            textTransform: 'lowercase'
          }}>
            tur #{currentRound || 1}
          </span>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            hedef: <b style={{ color: '#fff' }}>{targetScore} puan</b>
          </span>
        </div>

        {/* Right Menu Hint */}
        <div style={{
          fontSize: '0.78rem',
          color: 'rgba(255, 255, 255, 0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 600
        }}>
          <span>puanlar & oda menüsü sağ kenarda ❯</span>
        </div>
      </div>

      {/* Main Virtual Tabletop Game Engine */}
      <TabletopView
        room={room}
        gameState={gameState}
        player={player}
        onSubmitPerks={onSubmitPerks}
        onSubmitSabotage={onSubmitSabotage}
        onSelectWinner={onSelectWinner}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={phase === 'GAME_OVER'}
        winnerId={roundWinner}
        winnerName={roundWinnerName}
        players={players}
        scores={scores}
        stats={stats}
        isHost={isHost}
        onPlayAgain={onPlayAgain}
        onLeave={onLeave}
      />
    </div>
  );
}
