import React from 'react';
import { Crown, Flame, ShieldAlert, Sparkles, Check } from 'lucide-react';
import CardItem from './CardItem';
import { sounds } from '../services/soundEffects';

export default function CandidateSlot({
  candidate,
  isMyCandidate,
  isSingle,
  canVote,
  isWinner,
  isMySabotageTarget,
  onSelectWinner
}) {
  if (!candidate) return null;

  const {
    matchmakerName,
    whiteCards = [],
    whiteCardsSubmitted,
    redFlag,
    redFlagSubmitted,
    sabotagedByName
  } = candidate;

  let slotClass = 'candidate-card-slot';
  if (isWinner) slotClass += ' selected-winner';
  if (canVote) slotClass += ' selectable';
  if (isMySabotageTarget) slotClass += ' is-my-target';

  const handleSlotClick = () => {
    if (canVote && onSelectWinner) {
      sounds.playClick();
      onSelectWinner(candidate.matchmakerId);
    }
  };

  return (
    <div className={slotClass} onClick={handleSlotClick}>
      {/* Header with Matchmaker Info (No Avatars) */}
      <div className="candidate-header">
        <div className="candidate-owner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{matchmakerName}</span>
              {isMyCandidate && (
                <span style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#22d3ee',
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontWeight: 600
                }}>
                  senin adayın
                </span>
              )}
              {isMySabotageTarget && (
                <span style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <ShieldAlert size={10} /> sabotaj hedefin
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              aday sahibi
            </div>
          </div>
        </div>

        {isWinner && (
          <div style={{
            background: '#10b981',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.72rem',
            padding: '3px 8px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Crown size={12} /> tur kazananı
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div className="cards-container-in-slot">
        {/* Row of 2 White Cards (Perks) */}
        <div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={11} color="#f59e0b" /> iyi özellikler (beyaz kartlar)
          </div>

          <div className="perks-row">
            {whiteCards.length === 2 ? (
              whiteCards.map((card, idx) => (
                <CardItem key={idx} card={card} type="perk" isSmall={true} />
              ))
            ) : (
              <>
                <CardItem card={{ hidden: true, text: whiteCardsSubmitted ? 'hazırlandı' : 'seçiliyor...' }} isSmall={true} />
                <CardItem card={{ hidden: true, text: whiteCardsSubmitted ? 'hazırlandı' : 'seçiliyor...' }} isSmall={true} />
              </>
            )}
          </div>
        </div>

        {/* Red Flag Sabotage Card */}
        <div style={{ marginTop: '4px' }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#f87171',
            marginBottom: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={11} color="#ef4444" /> kırmızı bayrak (sabotaj)
            </span>
            {sabotagedByName && (
              <span style={{ fontSize: '0.68rem', color: '#fca5a5' }}>
                sabote eden: <b>{sabotagedByName}</b>
              </span>
            )}
          </div>

          {redFlag ? (
            <CardItem card={redFlag} type="redflag" isSmall={true} />
          ) : (
            <CardItem
              card={{
                hidden: true,
                text: redFlagSubmitted ? 'kırmızı bayrak eklendi' : 'sabotaj bekleniyor...'
              }}
              isSmall={true}
            />
          )}
        </div>
      </div>

      {/* Bekâr Voting Button */}
      {canVote && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSlotClick();
          }}
          className="btn-primary"
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px 14px',
            fontSize: '0.88rem',
            background: '#f59e0b'
          }}
        >
          <Check size={15} /> bu adayı seç
        </button>
      )}
    </div>
  );
}
