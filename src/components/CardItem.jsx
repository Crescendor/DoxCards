import React from 'react';
import { DEFAULT_CONFIG } from '../services/userService';

export default function CardItem({
  card,
  type = 'perk', // 'perk' (white) or 'redflag' (red)
  isSelected = false,
  onClick = null,
  disabled = false,
  isSmall = false,
  theme = null,
  appConfig = null
}) {
  if (!card) return null;

  const isWhite = type === 'perk' || card.type === 'perk';

  // Resolve theme object
  const resolvedTheme = (() => {
    if (theme && typeof theme === 'object') return theme;
    const themeId = (typeof theme === 'string' && theme) || card.theme || card.equippedTheme || 'stocks';
    const themes = (appConfig?.market?.themes && appConfig.market.themes.length > 0)
      ? appConfig.market.themes
      : (DEFAULT_CONFIG?.market?.themes || []);
    return themes.find(t => t.id === themeId) || null;
  })();

  const redBackUrl = resolvedTheme?.redBack || resolvedTheme?.images?.redBack || '/themes/stocks/1.png';
  const whiteBackUrl = resolvedTheme?.whiteBack || resolvedTheme?.images?.whiteBack || '/themes/stocks/2.png';
  const redFrontUrl = resolvedTheme?.redFront || resolvedTheme?.images?.redFront || '/themes/stocks/3.png';
  const whiteFrontUrl = resolvedTheme?.whiteFront || resolvedTheme?.images?.whiteFront || '/themes/stocks/4.png';

  const fontColor = isWhite
    ? (resolvedTheme?.fontColorWhite || '#000000')
    : (resolvedTheme?.fontColorRed || '#ffffff');

  const animationClass = resolvedTheme?.animation && resolvedTheme.animation !== 'none'
    ? `tag-anim-${resolvedTheme.animation}`
    : '';

  const glowShadow = (() => {
    if (!resolvedTheme?.glow || resolvedTheme.glow === 'none') return '';
    if (resolvedTheme.glow === 'golden') return '0 0 18px rgba(251, 191, 36, 0.6)';
    if (resolvedTheme.glow === 'neon_purple') return '0 0 18px rgba(168, 85, 247, 0.6)';
    if (resolvedTheme.glow === 'neon_blue') return '0 0 18px rgba(56, 189, 248, 0.6)';
    if (resolvedTheme.glow === 'crimson') return '0 0 18px rgba(239, 68, 68, 0.6)';
    if (resolvedTheme.glow === 'emerald') return '0 0 18px rgba(16, 185, 129, 0.6)';
    if (resolvedTheme.glow === 'radioactive') return '0 0 18px rgba(34, 197, 94, 0.6)';
    return '';
  })();

  // Face-down Hidden Card
  if (card.hidden) {
    return (
      <div
        className={animationClass}
        onClick={disabled ? undefined : onClick}
        onDragStart={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: isSmall ? '154px' : '180px',
          aspectRatio: '5 / 7',
          borderRadius: isSmall ? '14px' : '16px',
          overflow: 'hidden',
          cursor: onClick && !disabled ? 'pointer' : 'default',
          boxShadow: glowShadow ? `${glowShadow}, 0 4px 14px rgba(0, 0, 0, 0.4)` : '0 4px 14px rgba(0, 0, 0, 0.4)',
          background: isWhite ? '#ffffff' : '#ff0000',
          border: '1px solid rgba(0,0,0,0.15)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease',
          margin: '0 auto',
          userSelect: 'none',
          WebkitUserDrag: 'none'
        }}
      >
        <img
          src={isWhite ? whiteBackUrl : redBackUrl}
          alt="doxcards back"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserDrag: 'none'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={animationClass}
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
          : (glowShadow
              ? `${glowShadow}, 0 6px 18px rgba(0, 0, 0, 0.4)`
              : (isWhite ? '0 6px 18px rgba(0, 0, 0, 0.4)' : '0 6px 20px rgba(217, 4, 41, 0.45)')),
        userSelect: 'none',
        WebkitUserDrag: 'none',
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
        src={isWhite ? whiteFrontUrl : redFrontUrl}
        alt={isWhite ? 'white card' : 'red card'}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 1,
          userSelect: 'none',
          WebkitUserDrag: 'none'
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
          color: fontColor,
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
          (typeof card.text === 'string' ? card.text : (card.filledText || '')).split(/(?:\[boşluk\]|[_\s]*_{2,}[_\s]*|\[blank\]|\{blank\})/i).map((chunk, idx, arr) => (
            <React.Fragment key={idx}>
              {chunk}
              {idx < arr.length - 1 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '28px',
                    height: '2px',
                    background: fontColor,
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
