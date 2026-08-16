import React, { useEffect } from 'react';
import { Crown } from 'lucide-react';
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
    timeLeft,
    singlePlayerId,
    scores = {},
    stats = {},
    roundWinner,
    roundWinnerName
  } = gameState || {};

  const isHost = room.hostId === player.id;
  const players = room.players || [];

  // Play tick sound when timer < 6s
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 5) {
      sounds.playTick();
    }
  }, [timeLeft]);

  // Play fanfare on round summary
  useEffect(() => {
    if (phase === 'ROUND_SUMMARY') {
      sounds.playWin();
    }
  }, [phase]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#121212' }}>
      {/* Top Header Bar Scoreboard */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 24px',
        background: 'rgba(10, 10, 10, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100
      }}>
        {/* Round Badge */}
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

        {/* Players Scoreboard Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {players.map((p) => {
            const isSinglePlayer = p.id === singlePlayerId;
            const isMe = p.id === player.id;

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isSinglePlayer ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  border: isSinglePlayer
                    ? '1px solid #f59e0b'
                    : (isMe ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)'),
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'lowercase'
                }}
              >
                <span>{p.name}</span>
                {isSinglePlayer && <Crown size={13} color="#fbbf24" />}
                <span style={{
                  background: '#ff0000',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 900
                }}>
                  {scores[p.id] || 0}
                </span>
              </div>
            );
          })}
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
