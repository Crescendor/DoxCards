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
          maxWidth: isSmall ? '154px' : '180px',
          aspectRatio: '5 / 7',
          borderRadius: isSmall ? '14px' : '16px',
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
        width: isSmall ? '100%' : '180px',
        maxWidth: isSmall ? '100%' : '180px',
        height: isSmall ? '100%' : '252px',
        maxHeight: isSmall ? '100%' : '252px',
        aspectRatio: '5 / 7',
        borderRadius: isSmall ? '10px' : '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        boxShadow: isSelected
          ? (isWhite ? '0 0 24px rgba(255, 255, 255, 0.9)' : '0 0 24px rgba(217, 4, 41, 0.95)')
          : (isWhite
              ? '0 6px 18px rgba(0, 0, 0, 0.4)'
              : '0 6px 20px rgba(217, 4, 41, 0.45)'),
        userSelect: 'none',
        flexShrink: 0,
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
        transform: isSelected ? 'translateY(-12px)' : 'none',
        outline: isSelected
          ? (isWhite ? '3px solid #ffffff' : '3px solid #FF0000')
          : 'none',
        background: isWhite ? '#ffffff' : '#FF0000',
        border: '1px solid rgba(0,0,0,0.12)',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
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
          padding: isSmall ? '10px 8px 4px 8px' : '16px 14px',
          paddingRight: isSmall ? '10px' : '20px',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontWeight: 800,
          fontSize: isSmall ? 'clamp(0.62rem, 0.74vw, 0.82rem)' : '0.82rem',
          lineHeight: 1.2,
          textAlign: 'left',
          textTransform: 'lowercase',
          color: isWhite ? '#ff0000' : '#ffffff',
          letterSpacing: '-0.02em',
          wordBreak: 'break-word',
          overflow: 'hidden'
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
                    color: '#000000',
                    background: isWhite ? 'rgba(0, 0, 0, 0.08)' : '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    textDecoration: 'underline',
                    fontWeight: 900,
                    margin: '0 2px',
                    display: 'inline-block'
                  }}
                >
                  {val}
                </span>
              );
            }
            return chunk;
          })
        ) : (
          card.text.split(/(?:\[boşluk\]|[_\s]*_{2,}[_\s]*|\[blank\]|\{blank\})/i).map((chunk, idx, arr) => (
            <React.Fragment key={idx}>
              {chunk}
              {idx < arr.length - 1 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '28px',
                    height: '2px',
                    background: isWhite ? '#FF0000' : '#ffffff',
                    margin: '0 2px',
                    verticalAlign: 'middle',
                    borderRadius: '1px',
                    opacity: 0.95
                  }}
                />
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* Subtle Deck Name & Extra Note on Bottom-Left (Multi-line if extra note exists) */}
      {(() => {
        const deckLabel = card.deckName || card.deckTitle || card.category || card.deck || '';
        const extraNote = card.deckExtraNote || card.extraNote || '';
        if (!deckLabel && !extraNote) return null;

        return (
          <div
            style={{
              position: 'absolute',
              bottom: isSmall ? '6px' : '10px',
              left: isSmall ? '8px' : '12px',
              zIndex: 3,
              fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              textTransform: 'lowercase',
              color: isWhite ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.7)',
              pointerEvents: 'none',
              maxWidth: isSmall ? '64%' : '70%',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px'
            }}
            title={extraNote ? `${deckLabel} - "${extraNote}"` : deckLabel}
          >
            {deckLabel && (
              <span style={{
                fontSize: isSmall ? '0.58rem' : '0.66rem',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {deckLabel}
              </span>
            )}
            {extraNote && (
              <span style={{
                fontSize: isSmall ? '0.52rem' : '0.60rem',
                fontWeight: 500,
                opacity: 0.85,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                "{extraNote}"
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}
