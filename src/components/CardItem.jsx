import React from 'react';
import whiteCardFrontImg from '../assets/cards/card_white_front.png';
import redCardFrontImg from '../assets/cards/card_red_front.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';
import redCardBackImg from '../assets/cards/card_red_back.png';

export default function CardItem({
  card,
  type = 'perk', // 'perk' (white) or 'redflag' (red)
  isSelected = false,
  onClick = null,
  disabled = false,
  isSmall = false
}) {
  if (!card) return null;

  const isWhite = type === 'perk' || card.type === 'perk';

  // Face-down Hidden Card
  if (card.hidden) {
    return (
      <div
        onClick={disabled ? undefined : onClick}
        style={{
          position: 'relative',
          aspectRatio: '3 / 4.2',
          width: '100%',
          minWidth: isSmall ? '130px' : '170px',
          borderRadius: '18px',
          overflow: 'hidden',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
          background: isWhite ? '#ffffff' : '#ff0000',
          border: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <img
          src={isWhite ? whiteCardBackImg : redCardBackImg}
          alt="doxcards back"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        position: 'relative',
        aspectRatio: '3 / 4.2',
        width: '100%',
        minWidth: isSmall ? '130px' : '170px',
        borderRadius: '18px',
        overflow: 'hidden',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        boxShadow: isWhite
          ? '0 6px 20px rgba(0, 0, 0, 0.25)'
          : '0 6px 22px rgba(255, 0, 0, 0.45)',
        userSelect: 'none',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
        transform: isSelected ? 'translateY(-12px)' : 'none',
        outline: isSelected
          ? (isWhite ? '3px solid #38bdf8' : '3px solid #f59e0b')
          : 'none',
        background: isWhite ? '#ffffff' : '#ff0000',
        border: '1px solid rgba(0,0,0,0.12)'
      }}
    >
      {/* Exact PNG Card Base Asset */}
      <img
        src={isWhite ? whiteCardFrontImg : redCardFrontImg}
        alt={isWhite ? 'white card' : 'red card'}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Card Text on Top-Left */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: isSmall ? '16px 14px' : '22px 18px',
          paddingRight: isSmall ? '24px' : '32px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontSize: isSmall ? '0.88rem' : '1.02rem',
          lineHeight: 1.32,
          textAlign: 'left',
          textTransform: 'lowercase',
          color: isWhite ? '#ff0000' : '#ffffff',
          letterSpacing: '-0.02em',
          wordBreak: 'break-word'
        }}
      >
        {card.text}
      </div>
    </div>
  );
}
