import React from 'react';
import { Crown, ShieldAlert, Sparkles, Check, Flame } from 'lucide-react';
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
      {/* Header with Matchmaker Info */}
      <div className="candidate-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
            {matchmakerName}
          </span>

          {isMyCandidate && (
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700
            }}>
              senin adayın
            </span>
          )}

          {isMySabotageTarget && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              fontSize: '0.68rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <ShieldAlert size={11} /> sabotaj hedefin
            </span>
          )}
        </div>

        {isWinner && (
          <div style={{
            background: '#10b981',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.74rem',
            padding: '4px 10px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
          }}>
            <Crown size={13} /> tur kazananı
          </div>
        )}
      </div>

      {/* 3-Card Trio Table Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        alignItems: 'stretch',
        marginTop: '6px'
      }}>
        {/* Perk 1 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {whiteCards[0] ? (
            <CardItem card={whiteCards[0]} type="perk" isSmall={true} />
          ) : (
            <CardItem card={{ hidden: true, type: 'perk' }} type="perk" isSmall={true} />
          )}
        </div>

        {/* Perk 2 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {whiteCards[1] ? (
            <CardItem card={whiteCards[1]} type="perk" isSmall={true} />
          ) : (
            <CardItem card={{ hidden: true, type: 'perk' }} type="perk" isSmall={true} />
          )}
        </div>

        {/* Red Flag Sabotage */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {redFlag ? (
            <CardItem card={redFlag} type="redflag" isSmall={true} />
          ) : (
            <CardItem card={{ hidden: true, type: 'redflag' }} type="redflag" isSmall={true} />
          )}
        </div>
      </div>

      {/* Saboteur info footer */}
      {sabotagedByName && (
        <div style={{
          fontSize: '0.72rem',
          color: '#fca5a5',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Flame size={12} color="#ef4444" />
          <span>sabote eden: <b>{sabotagedByName}</b></span>
        </div>
      )}

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
            marginTop: '10px',
            padding: '10px 14px',
            fontSize: '0.88rem',
            background: '#f59e0b',
            color: '#000000',
            fontWeight: 800
          }}
        >
          <Check size={16} /> bu adayı seç
        </button>
      )}
    </div>
  );
}
