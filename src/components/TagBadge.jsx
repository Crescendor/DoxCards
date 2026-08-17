import React from 'react';
import {
  ShieldCheck,
  Crown,
  Sparkles,
  Star,
  Flame,
  Zap,
  Award,
  Trophy,
  Heart,
  Ghost,
  Gem,
  Rocket,
  Tag,
  Music
} from 'lucide-react';

const ICON_MAP = {
  ShieldCheck,
  Crown,
  Sparkles,
  Star,
  Flame,
  Zap,
  Award,
  Trophy,
  Heart,
  Ghost,
  Gem,
  Rocket,
  Tag,
  Music
};

export default function TagBadge({
  tag,
  customTags = [],
  size = 'md', // 'sm' | 'md' | 'lg'
  style = {},
  className = '',
  showAnimation = true,
  showGlow = true
}) {
  const tagName = typeof tag === 'string' ? tag : (tag?.name || tag?.id || '');
  const tagObj = typeof tag === 'object' && tag !== null && tag.color
    ? tag
    : customTags.find(t => (t.id && t.id.toLowerCase() === tagName.toLowerCase()) || (t.name && t.name.toLowerCase() === tagName.toLowerCase()));

  // Icon component
  let IconComponent = null;
  if (tagObj?.icon && ICON_MAP[tagObj.icon]) {
    IconComponent = ICON_MAP[tagObj.icon];
  } else if (tagName.toLowerCase() === 'admin') {
    IconComponent = ShieldCheck;
  } else if (tagName.toLowerCase() === 'vip') {
    IconComponent = Crown;
  } else if (tagName.toLowerCase() === 'premium') {
    IconComponent = Sparkles;
  }

  // Fallback defaults
  const color = tagObj?.color || (
    tagName.toLowerCase() === 'admin' ? '#f87171' :
    tagName.toLowerCase() === 'vip' ? '#c084fc' :
    tagName.toLowerCase() === 'premium' ? '#38bdf8' : '#cbd5e1'
  );

  const bgColor = tagObj?.bgColor || (
    tagName.toLowerCase() === 'admin' ? 'rgba(239, 68, 68, 0.18)' :
    tagName.toLowerCase() === 'vip' ? 'rgba(168, 85, 247, 0.18)' :
    tagName.toLowerCase() === 'premium' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.08)'
  );

  const borderColor = tagObj?.borderColor || (
    tagName.toLowerCase() === 'admin' ? 'rgba(239, 68, 68, 0.45)' :
    tagName.toLowerCase() === 'vip' ? 'rgba(168, 85, 247, 0.45)' :
    tagName.toLowerCase() === 'premium' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.2)'
  );

  const glowClass = showGlow && tagObj?.glow ? `glow-${tagObj.glow}` : '';
  const animClass = showAnimation && tagObj?.animation && tagObj.animation !== 'none' ? `anim-${tagObj.animation}` : '';

  const height = size === 'sm' ? '20px' : size === 'lg' ? '26px' : '22px';
  const fontSize = size === 'sm' ? '0.66rem' : size === 'lg' ? '0.78rem' : '0.70rem';
  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 13 : 11;
  const padding = size === 'sm' ? '0 6px' : size === 'lg' ? '0 10px' : '0 8px';

  return (
    <span
      className={`${glowClass} ${animClass} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height,
        lineHeight: 1,
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 800,
        color,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        boxSizing: 'border-box',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
    >
      {IconComponent && <IconComponent size={iconSize} color={color} />}
      {tagName}
    </span>
  );
}
