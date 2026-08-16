import React, { useEffect } from 'react';
import TabletopView from './TabletopView';
import GameOverModal from './GameOverModal';
import { sounds } from '../services/soundEffects';

export default function GameView({
  room,
  gameState,
  player,
  onPlaceWhiteCard,
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
    <div style={{
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#141414',
      position: 'relative'
    }}>
      {/* Minimal Top Header Bar (Fixed at Top) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '46px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        background: 'rgba(10, 10, 10, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
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
      <div style={{
        paddingTop: '46px',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <TabletopView
          room={room}
          gameState={gameState}
          player={player}
          onPlaceWhiteCard={onPlaceWhiteCard}
          onSubmitPerks={onSubmitPerks}
          onSubmitSabotage={onSubmitSabotage}
          onSelectWinner={onSelectWinner}
        />
      </div>

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
