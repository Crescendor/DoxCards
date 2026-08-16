import React, { useEffect } from 'react';
import { Target, Hourglass, ArrowRight, ChevronRight } from 'lucide-react';
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

  const {
    isSingle,
    turnPlayerId,
    turnPlayerName,
    isMyTurn,
    singlePlayerName,
    mySabotageTarget
  } = gameState || {};

  const getPhaseText = () => {
    if (phase === 'PERKS') return '1. aşama: aday hazırlama';
    if (phase === 'SABOTAGE') return '2. aşama: sabotaj';
    if (phase === 'REVEAL' || phase === 'VOTING') return '3. aşama: bekârın kararı';
    if (phase === 'ROUND_SUMMARY') return 'tur tamamlandı';
    return '';
  };

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
      {/* Single Unified Sleek Dark Grey Top Header Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        background: '#1e1e1e',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 100,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Left: Round, Target Score & Phase */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: '#d90429',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.78rem',
            padding: '3px 10px',
            borderRadius: '9999px',
            textTransform: 'lowercase'
          }}>
            tur #{currentRound || 1}
          </span>

          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            hedef: <b style={{ color: '#ffffff' }}>{targetScore} puan</b>
          </span>

          <span style={{
            background: '#282828',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '9999px'
          }}>
            {getPhaseText()}
          </span>
        </div>

        {/* Center: Turn Status Banner in Sleek Dark Grey */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#262626',
          border: isMyTurn ? '1px solid rgba(217, 4, 41, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4px 16px',
          borderRadius: '9999px',
          boxShadow: isMyTurn ? '0 0 12px rgba(217, 4, 41, 0.25)' : 'none'
        }}>
          {isMyTurn ? (
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={15} color="#ef4444" />
              <span>senin sıran! <span style={{ color: '#f87171', fontWeight: 600 }}>{phase === 'PERKS' ? '(2 beyaz kartını masana sürükle)' : `(kırmızı kartını ${mySabotageTarget?.targetPlayerName || 'rakibin'} masasına sürükle)`}</span></span>
            </span>
          ) : (
            <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {phase === 'VOTING' ? (
                isSingle ? (
                  <>
                    <ArrowRight size={14} color="#f59e0b" />
                    <span>tüm adayları incele ve kazanana tıkla!</span>
                  </>
                ) : (
                  <>
                    <Hourglass size={14} color="#f59e0b" />
                    <span>bekâr ({singlePlayerName}) karar veriyor...</span>
                  </>
                )
              ) : (
                <>
                  <Hourglass size={14} color="#94a3b8" />
                  <span>sıra: {turnPlayerName} (kart koyuyor...)</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Right Menu Hint */}
        <div style={{
          fontSize: '0.76rem',
          color: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
          <span>puanlar & oda menüsü sağ kenarda</span>
          <ChevronRight size={14} />
        </div>
      </div>

      {/* Main Virtual Tabletop Game Engine */}
      <div style={{
        paddingTop: '50px',
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
