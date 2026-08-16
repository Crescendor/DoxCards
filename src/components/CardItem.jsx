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
          width: '100%',
          maxWidth: isSmall ? '135px' : '170px',
          aspectRatio: '5 / 7',
          borderRadius: isSmall ? '12px' : '16px',
          overflow: 'hidden',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
          background: isWhite ? '#ffffff' : '#ff0000',
          border: '1px solid rgba(0,0,0,0.15)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
          margin: '0 auto'
        }}
      >
        <img
          src={isWhite ? whiteCardBackImg : redCardBackImg}
          alt="doxcards back"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
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
        width: '100%',
        maxWidth: isSmall ? '135px' : '170px',
        aspectRatio: '5 / 7',
        borderRadius: isSmall ? '12px' : '16px',
        overflow: 'hidden',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        boxShadow: isWhite
          ? '0 6px 18px rgba(0, 0, 0, 0.35)'
          : '0 6px 20px rgba(255, 0, 0, 0.45)',
        userSelect: 'none',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
        transform: isSelected ? 'translateY(-10px)' : 'none',
        outline: isSelected
          ? (isWhite ? '3px solid #38bdf8' : '3px solid #f59e0b')
          : 'none',
        background: isWhite ? '#ffffff' : '#ff0000',
        border: '1px solid rgba(0,0,0,0.12)',
        margin: '0 auto'
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
          objectFit: 'fill',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Card Text on Top-Left */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: isSmall ? '13px 11px' : '16px 14px',
          paddingRight: isSmall ? '18px' : '22px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 700,
          fontSize: isSmall ? '0.84rem' : '0.96rem',
          lineHeight: 1.28,
          textAlign: 'left',
          textTransform: 'lowercase',
          color: isWhite ? '#ff0000' : '#ffffff',
          letterSpacing: '-0.025em',
          wordBreak: 'break-word'
        }}
      >
        {card.filledText ? (
          card.filledText.split(/(\*\*.*?\*\*)/g).map((chunk, idx) => {
            if (chunk.startsWith('**') && chunk.endsWith('**')) {
              const val = chunk.slice(2, -2);
              return (
                <span
                  key={idx}
                  style={{
                    color: isWhite ? '#0284c7' : '#fef08a',
                    textDecoration: 'underline',
                    fontWeight: 900
                  }}
                >
                  {val}
                </span>
              );
            }
            return chunk;
          })
        ) : (
          card.text
        )}
      </div>
    </div>
  );
}
