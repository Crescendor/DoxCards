import React, { useState, useEffect } from 'react';
import {
  X,
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
  Music,
  Check,
  Sliders,
  Palette,
  Eye,
  Trash2,
  Lock,
  Volume2,
  Layers,
  Coins
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import TagBadge from './TagBadge';

const AVAILABLE_ICONS = [
  { name: 'Crown', label: 'Taç', Icon: Crown },
  { name: 'Sparkles', label: 'Işıltı', Icon: Sparkles },
  { name: 'ShieldCheck', label: 'Kalkan', Icon: ShieldCheck },
  { name: 'Star', label: 'Yıldız', Icon: Star },
  { name: 'Flame', label: 'Alev', Icon: Flame },
  { name: 'Zap', label: 'Şimşek', Icon: Zap },
  { name: 'Award', label: 'Madalya', Icon: Award },
  { name: 'Trophy', label: 'Kupa', Icon: Trophy },
  { name: 'Gem', label: 'Elmas', Icon: Gem },
  { name: 'Rocket', label: 'Roket', Icon: Rocket },
  { name: 'Heart', label: 'Kalp', Icon: Heart },
  { name: 'Ghost', label: 'Hayalet', Icon: Ghost },
  { name: 'Music', label: 'Müzik', Icon: Music },
  { name: 'Tag', label: 'Etiket', Icon: Tag }
];

const COLOR_PRESETS = [
  { name: 'Altın Sarısı', color: '#fbbf24', bgColor: 'rgba(245, 158, 11, 0.18)', borderColor: 'rgba(245, 158, 11, 0.45)', glow: 'golden' },
  { name: 'Neon Mor (VIP)', color: '#c084fc', bgColor: 'rgba(168, 85, 247, 0.18)', borderColor: 'rgba(168, 85, 247, 0.45)', glow: 'neon_purple' },
  { name: 'Gökyüzü Mavisi (Premium)', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.18)', borderColor: 'rgba(56, 189, 248, 0.45)', glow: 'neon_blue' },
  { name: 'Kızıl / Kırmızı (Admin)', color: '#f87171', bgColor: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.45)', glow: 'crimson' },
  { name: 'Zümrüt Yeşili', color: '#34d399', bgColor: 'rgba(16, 185, 129, 0.18)', borderColor: 'rgba(16, 185, 129, 0.45)', glow: 'emerald' },
  { name: 'Gül Pembesi', color: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.18)', borderColor: 'rgba(244, 63, 94, 0.45)', glow: 'crimson' },
  { name: 'Siber Turkuaz', color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.18)', borderColor: 'rgba(34, 211, 238, 0.45)', glow: 'neon_blue' },
  { name: 'Alev Turuncusu', color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.18)', borderColor: 'rgba(251, 146, 60, 0.45)', glow: 'golden' }
];

const GLOW_OPTIONS = [
  { id: 'none', label: 'Yok (Sade)' },
  { id: 'golden', label: 'Altın Işıltısı' },
  { id: 'neon_purple', label: 'Neon Mor' },
  { id: 'neon_blue', label: 'Neon Mavi' },
  { id: 'crimson', label: 'Kızıl Alev' },
  { id: 'emerald', label: 'Zümrüt Yeşili' }
];

const ANIMATION_OPTIONS = [
  { id: 'none', label: 'Yok (Sabit)' },
  { id: 'pulse', label: 'Nabız (Pulse)' },
  { id: 'shimmer', label: 'Işıltı Dalgası (Shimmer)' },
  { id: 'bounce', label: 'Süzülme (Float)' }
];

export default function TagEditModal({
  isOpen,
  onClose,
  tag,
  isNew = false,
  onSave
}) {
  const [name, setName] = useState('');
  const [tagId, setTagId] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#fbbf24');
  const [bgColor, setBgColor] = useState('rgba(245, 158, 11, 0.18)');
  const [borderColor, setBorderColor] = useState('rgba(245, 158, 11, 0.45)');
  const [glow, setGlow] = useState('golden');
  const [animation, setAnimation] = useState('none');

  // Permissions
  const [permCustomSounds, setPermCustomSounds] = useState(false);
  const [permAllDecks, setPermAllDecks] = useState(false);
  const [permAdminAccess, setPermAdminAccess] = useState(false);
  const [permMultiplier, setPermMultiplier] = useState(10);

  useEffect(() => {
    if (tag) {
      setName(tag.name || '');
      setTagId(tag.id || '');
      setIcon(tag.icon || 'Tag');
      setColor(tag.color || '#fbbf24');
      setBgColor(tag.bgColor || 'rgba(245, 158, 11, 0.18)');
      setBorderColor(tag.borderColor || 'rgba(245, 158, 11, 0.45)');
      setGlow(tag.glow || 'none');
      setAnimation(tag.animation || 'none');

      const perms = tag.permissions || {};
      setPermCustomSounds(!!perms.customSounds);
      setPermAllDecks(!!perms.allDecks);
      setPermAdminAccess(!!perms.adminAccess);
      setPermMultiplier(Number(perms.multiplier) || 10);
    } else {
      setName('');
      setTagId('');
      setIcon('Tag');
      setColor('#fbbf24');
      setBgColor('rgba(245, 158, 11, 0.18)');
      setBorderColor('rgba(245, 158, 11, 0.45)');
      setGlow('golden');
      setAnimation('none');
      setPermCustomSounds(false);
      setPermAllDecks(false);
      setPermAdminAccess(false);
      setPermMultiplier(10);
    }
  }, [tag, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    sounds.playClick();
    setColor(preset.color);
    setBgColor(preset.bgColor);
    setBorderColor(preset.borderColor);
    setGlow(preset.glow);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Lütfen bir etiket adı girin.');
      return;
    }

    const finalId = tagId.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const updatedTag = {
      id: finalId,
      name: name.trim(),
      icon,
      color,
      bgColor,
      borderColor,
      glow,
      animation,
      permissions: {
        customSounds: permCustomSounds,
        allDecks: permAllDecks,
        adminAccess: permAdminAccess,
        multiplier: Number(permMultiplier) || 10
      }
    };

    sounds.playClick();
    if (onSave) onSave(updatedTag);
    onClose();
  };

  // Preview Object
  const previewTag = {
    id: tagId || 'preview',
    name: name || 'Önizleme',
    icon,
    color,
    bgColor,
    borderColor,
    glow,
    animation
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '100%',
          padding: '26px',
          background: '#181818',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '22px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#FF0000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 0, 0, 0.5)'
            }}>
              <Tag size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                {isNew ? 'yeni etiket & rol oluştur' : `etiketi düzenle: ${tag?.name || tag?.id}`}
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                etiketin rengini, parlamasını, ikonunu ve yetkilerini özelleştirin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { sounds.playClick(); onClose(); }}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div style={{
          background: '#222222',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
              canlı etiket önizlemesi:
            </span>
            <span style={{ fontSize: '0.70rem', color: '#64748b' }}>
              kartlarda ve profilde böyle görünecek
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TagBadge tag={previewTag} size="lg" />
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 1. Name & ID */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">etiket adı:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: VIP, Yayıncı, Şampiyon"
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">etiket ID (slug):</label>
              <input
                type="text"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                placeholder="Örn: yayinci, sampiyon"
                className="form-input"
                disabled={!isNew && ['admin', 'vip', 'premium'].includes(tag?.id)}
              />
            </div>
          </div>

          {/* 2. Icon Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label className="form-label">ikon seçimi:</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '6px'
            }}>
              {AVAILABLE_ICONS.map(({ name: iconName, label, Icon: IconComp }) => {
                const isSelected = icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => { sounds.playClick(); setIcon(iconName); }}
                    style={{
                      background: isSelected ? 'rgba(239, 68, 68, 0.2)' : '#222222',
                      border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      transition: 'all 0.15s ease'
                    }}
                    title={label}
                  >
                    <IconComp size={16} color={isSelected ? '#ef4444' : '#ffffff'} />
                    <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Color Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            <label className="form-label">hazır renk paleti:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    background: preset.bgColor,
                    border: `1px solid ${preset.borderColor}`,
                    color: preset.color,
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: preset.color }} />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Glow & Animation Selection */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div className="form-group" style={{ margin: 0, textAlign: 'left' }}>
              <label className="form-label">parlama efekti (glow):</label>
              <select
                value={glow}
                onChange={(e) => setGlow(e.target.value)}
                className="select-box"
              >
                {GLOW_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, textAlign: 'left' }}>
              <label className="form-label">animasyon (efekt):</label>
              <select
                value={animation}
                onChange={(e) => setAnimation(e.target.value)}
                className="select-box"
              >
                {ANIMATION_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Permissions (Yetkiler) */}
          <div style={{
            background: '#222222',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} color="#ef4444" />
              etiket yetkileri & ayrıcalıkları
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={permCustomSounds}
                  onChange={(e) => setPermCustomSounds(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                />
                özel sesleri kullanabilir
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={permAllDecks}
                  onChange={(e) => setPermAllDecks(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                />
                tüm destelere erişebilir
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={permAdminAccess}
                  onChange={(e) => setPermAdminAccess(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                />
                admin paneline erişebilir
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>coin katsayısı:</span>
                <input
                  type="number"
                  value={permMultiplier}
                  onChange={(e) => setPermMultiplier(e.target.value)}
                  min="0"
                  max="100"
                  style={{
                    width: '60px',
                    background: '#181818',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fbbf24',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 18px', fontSize: '0.84rem' }}
            >
              iptal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.84rem' }}
            >
              <Check size={16} /> {isNew ? 'etiketi oluştur' : 'değişiklikleri kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
