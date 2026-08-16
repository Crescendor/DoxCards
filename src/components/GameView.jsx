import React, { useEffect } from 'react';
import { Crown, Clock, Heart, Flag, Sparkles, Trophy, Users, ShieldAlert } from 'lucide-react';
import CandidateSlot from './CandidateSlot';
import PlayerHand from './PlayerHand';
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
    singlePlayerName,
    isSingle,
    scores = {},
    stats = {},
    hand = { whiteCards: [], redCards: [] },
    candidates = {},
    mySabotageTarget,
    roundWinner,
    roundWinnerName,
    winningCandidate
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

  // Phase Display Meta
  const getPhaseInfo = () => {
    switch (phase) {
      case 'PERKS':
        return {
          tag: '1. Aşama: Aday Hazırlama',
          title: `Bekâr: ${singlePlayerName} 👑`,
          desc: isSingle
            ? 'Çöpçatanların senin için en iyi sevgili adaylarını hazırlamasını bekle...'
            : `Elindeki 4 Beyaz Kart arasından ${singlePlayerName} için en muhteşem 2 kartı seç!`
        };
      case 'SABOTAGE':
        return {
          tag: '2. Aşama: Kırmızı Bayrak Dikme',
          title: 'Adayları Sabote Etme Zamanı! 🚩',
          desc: isSingle
            ? 'Çöpçatanlar rakiplerinin adaylarına korkunç kırmızı bayraklar ekliyor...'
            : `Hedefin: ${mySabotageTarget?.targetPlayerName || 'Rakibin'}! Adayına 1 Kırmızı Kart koyarak adayı mahvet!`
        };
      case 'REVEAL':
      case 'VOTING':
        return {
          tag: '3. Aşama: Bekârın Kararı',
          title: `${singlePlayerName} Adayını Seçiyor 💘`,
          desc: isSingle
            ? 'Tüm adayları ve kırmızı bayrakları incele, en beğendiğin adaya tıkla ve seç!'
            : 'Adaylar açıldı! Kendi adayını savun, diğerlerinin kırmızı bayraklarını vurgula!'
        };
      case 'ROUND_SUMMARY':
        return {
          tag: 'Tur Tamamlandı',
          title: `🎉 Kazanan: ${roundWinnerName}!`,
          desc: `${roundWinnerName} bu turu kazanarak hanesine 1 puan ekledi! Yeni tur başlıyor...`
        };
      default:
        return {
          tag: 'Oyun Devam Ediyor',
          title: 'Red Flags',
          desc: ''
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="game-container">
      {/* Top Bar Scoreboard */}
      <div className="game-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'var(--red-primary)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.85rem',
            padding: '4px 12px',
            borderRadius: '9999px'
          }}>
            Tur #{currentRound}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hedef: <b>{targetScore} Puan</b>
          </div>
        </div>

        {/* Players Scores Strip */}
        <div className="scoreboard-strip">
          {players.map((p) => {
            const isSinglePlayer = p.id === singlePlayerId;
            const isMe = p.id === player.id;
            return (
              <div
                key={p.id}
                className={`player-score-pill ${isSinglePlayer ? 'is-single' : ''} ${isMe ? 'is-me' : ''}`}
              >
                <span>{p.name}</span>
                {isSinglePlayer && <Crown size={14} color="#fbbf24" />}
                <span className="score-badge">{scores[p.id] || 0}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Announcement Banner */}
      <div className="phase-banner">
        <span className={`phase-tag ${phase === 'VOTING' ? 'voting' : ''}`}>
          {phaseInfo.tag}
        </span>
        <h2 className="phase-title">{phaseInfo.title}</h2>
        <p className="phase-desc">{phaseInfo.desc}</p>

        {/* Countdown Timer */}
        {timeLeft > 0 && (
          <div className={`timer-pill ${timeLeft <= 10 ? 'urgent' : ''}`}>
            <Clock size={16} />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        )}
      </div>

      {/* Main Game Table (Candidate Slots) */}
      <div className="game-table">
        <div className="table-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#f59e0b" /> Aday Masası ({Object.keys(candidates).length} Aday)
          </h3>

          {phase === 'VOTING' && isSingle && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              👇 Beğendiğin adayı seçmek için üzerine tıkla!
            </div>
          )}
        </div>

        {/* Candidates Grid */}
        <div className="candidates-grid">
          {Object.keys(candidates).map((matchmakerId) => {
            const candidate = candidates[matchmakerId];
            const isMyCandidate = matchmakerId === player.id;
            const isWinnerCandidate = matchmakerId === roundWinner;
            const isTarget = mySabotageTarget?.targetPlayerId === matchmakerId;
            const canVote = isSingle && (phase === 'VOTING' || phase === 'REVEAL');

            return (
              <CandidateSlot
                key={matchmakerId}
                candidate={candidate}
                isMyCandidate={isMyCandidate}
                isSingle={isSingle}
                canVote={canVote}
                isWinner={isWinnerCandidate}
                isMySabotageTarget={isTarget}
                onSelectWinner={onSelectWinner}
              />
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Player Hand Tray */}
      <PlayerHand
        hand={hand}
        phase={phase}
        isSingle={isSingle}
        mySabotageTarget={mySabotageTarget}
        onSubmitPerks={onSubmitPerks}
        onSubmitSabotage={onSubmitSabotage}
        candidates={candidates}
        myPlayerId={player.id}
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
