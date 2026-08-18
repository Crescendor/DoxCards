import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Sliders,
  Check,
  X,
  Palette,
  Eye,
  Flame,
  Coins
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

const GLOW_OPTIONS = [
  { id: 'none', label: 'Yok (Standart)' },
  { id: 'golden', label: 'Altın Parıltı (Golden)' },
  { id: 'neon_purple', label: 'Mor Neon (Purple)' },
  { id: 'neon_blue', label: 'Mavi Neon (Cyan)' },
  { id: 'crimson', label: 'Kızıl Yakut (Crimson)' },
  { id: 'emerald', label: 'Zümrüt Yeşili (Emerald)' },
  { id: 'neon_pink', label: 'Pembe Neon (Pink)' },
  { id: 'radioactive', label: 'Radyoaktif Yeşil' }
];

const ANIMATION_OPTIONS = [
  { id: 'none', label: 'Animasyonsuz (Statik)' },
  { id: 'rgb_outline', label: 'RGB Işık Çerçevesi (RGB Spectrum)' },
  { id: 'neon_pulse', label: 'Neon Işık Nabzı (Neon Pulse)' },
  { id: 'cyber_scan', label: 'Siber Işık Taraması (Cyber Scan)' },
  { id: 'cosmic_pulse', label: 'Kozmik Işıma (Cosmic Pulse)' },
  { id: 'gold_radiance', label: 'Altın Radyans (Golden Radiance)' },
  { id: 'crimson_flare', label: 'Kızıl Parlama (Crimson Flare)' },
  { id: 'ice_shimmer', label: 'Buzul Işıltısı (Glacier Ice)' },
  { id: 'matrix_glow', label: 'Matrix Işıltısı (Matrix Glow)' },
  { id: 'aurora', label: 'Kuzey Işıkları (Aurora Borealis)' },
  { id: 'plasma_wave', label: 'Plazma Dalgası (Plasma Energy)' },
  { id: 'starlight', label: 'Yıldız Tozu (Starlight Twinkle)' },
  { id: 'sunset_flow', label: 'Gün Batımı Akışı (Sunset Flow)' },
  { id: 'hologram', label: 'Hologram Efekti (Holographic)' }
];

export default function ThemeEditModal({
  isOpen,
  onClose,
  theme,
  isNew = false,
  onSave
}) {
  const [name, setName] = useState('');
  const [themeId, setThemeId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(500);
  const [fontColorRed, setFontColorRed] = useState('#ffffff');
  const [fontColorWhite, setFontColorWhite] = useState('#000000');
  const [glow, setGlow] = useState('none');
  const [animation, setAnimation] = useState('none');
  const [isEnabled, setIsEnabled] = useState(true);

  // Images
  const [redBack, setRedBack] = useState('/themes/stocks/1.png');
  const [whiteBack, setWhiteBack] = useState('/themes/stocks/2.png');
  const [redFront, setRedFront] = useState('/themes/stocks/3.png');
  const [whiteFront, setWhiteFront] = useState('/themes/stocks/4.png');

  useEffect(() => {
    if (theme) {
      setName(theme.name || '');
      setThemeId(theme.id || '');
      setDescription(theme.description || '');
      setPrice(Number(theme.price) || 0);
      setFontColorRed(theme.fontColorRed || '#ffffff');
      setFontColorWhite(theme.fontColorWhite || '#000000');
      setGlow(theme.glow || 'none');
      setAnimation(theme.animation || 'none');
      setIsEnabled(theme.isEnabled !== false);

      setRedBack(theme.images?.redBack || '/themes/stocks/1.png');
      setWhiteBack(theme.images?.whiteBack || '/themes/stocks/2.png');
      setRedFront(theme.images?.redFront || '/themes/stocks/3.png');
      setWhiteFront(theme.images?.whiteFront || '/themes/stocks/4.png');
    } else {
      setName('');
      setThemeId('');
      setDescription('');
      setPrice(500);
      setFontColorRed('#ffffff');
      setFontColorWhite('#000000');
      setGlow('none');
      setAnimation('none');
      setIsEnabled(true);
      setRedBack('/themes/stocks/1.png');
      setWhiteBack('/themes/stocks/2.png');
      setRedFront('/themes/stocks/3.png');
      setWhiteFront('/themes/stocks/4.png');
    }
  }, [theme, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Lütfen tema adı girin.');
      return;
    }

    const finalId = themeId.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const updated = {
      id: finalId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price) || 0,
      fontColorRed,
      fontColorWhite,
      glow,
      animation,
      isEnabled,
      images: {
        redBack,
        whiteBack,
        redFront,
        whiteFront
      }
    };

    sounds.playClick();
    if (onSave) onSave(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '780px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#ef4444" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                {isNew ? 'yeni kart teması oluştur' : `kart temasını düzenle: ${theme?.name || ''}`}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                temayı kişiselleştirin, animasyon, parlama ve yazı renklerini belirleyin
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Card Preview Box */}
        <div style={{
          background: '#111111',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="#ef4444" /> canlı kart simülasyonu
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              4 yüzün anlık görünümü
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {/* 1. Red Back */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                className={`tag-anim-${animation}`}
                style={{
                  width: '100%',
                  aspectRatio: '0.68',
                  borderRadius: '8px',
                  backgroundImage: `url(${redBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: glow === 'crimson' ? '0 0 15px rgba(239, 68, 68, 0.5)' : (glow === 'golden' ? '0 0 15px rgba(251, 191, 36, 0.5)' : 'none')
                }}
              />
              <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700 }}>1. kırmızı arka</span>
            </div>

            {/* 2. White Back */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                className={`tag-anim-${animation}`}
                style={{
                  width: '100%',
                  aspectRatio: '0.68',
                  borderRadius: '8px',
                  backgroundImage: `url(${whiteBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: glow === 'neon_purple' ? '0 0 15px rgba(168, 85, 247, 0.5)' : (glow === 'neon_blue' ? '0 0 15px rgba(56, 189, 248, 0.5)' : 'none')
                }}
              />
              <span style={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 700 }}>2. beyaz arka</span>
            </div>

            {/* 3. Red Front */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                className={`tag-anim-${animation}`}
                style={{
                  width: '100%',
                  aspectRatio: '0.68',
                  borderRadius: '8px',
                  backgroundImage: `url(${redFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  boxShadow: glow === 'crimson' ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.66rem', color: fontColorRed, fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
                  her şeye maydanoz oluyor
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700 }}>3. kırmızı ön</span>
            </div>

            {/* 4. White Front */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div
                className={`tag-anim-${animation}`}
                style={{
                  width: '100%',
                  aspectRatio: '0.68',
                  borderRadius: '8px',
                  backgroundImage: `url(${whiteFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  boxShadow: glow === 'golden' ? '0 0 15px rgba(251, 191, 36, 0.5)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.66rem', color: fontColorWhite, fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
                  harika bir aşçı
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#e2e8f0', fontWeight: 700 }}>4. beyaz ön</span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">tema adı:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Galaksi Siber Tema"
                className="input-box"
                required
              />
            </div>

            <div>
              <label className="form-label">coin fiyatı:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                  max="100000"
                  className="input-box"
                />
                <Coins size={16} color="#fbbf24" />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">açıklama:</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Örn: Derin uzay ve siber enerji tonlarında tema"
              className="input-box"
            />
          </div>

          {/* Color & Typography Customization */}
          <div style={{
            background: '#202020',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px'
          }}>
            {/* Red Card Font Color */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={13} color="#ef4444" /> kırmızı kart yazı font rengi (hex):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={fontColorRed}
                  onChange={e => setFontColorRed(e.target.value)}
                  style={{ width: '38px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={fontColorRed}
                  onChange={e => setFontColorRed(e.target.value)}
                  className="input-box"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* White Card Font Color */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={13} color="#e2e8f0" /> beyaz kart yazı font rengi (hex):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={fontColorWhite}
                  onChange={e => setFontColorWhite(e.target.value)}
                  style={{ width: '38px', height: '38px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={fontColorWhite}
                  onChange={e => setFontColorWhite(e.target.value)}
                  className="input-box"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Glow & Animation Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">parlama efekti (glow):</label>
              <select
                value={glow}
                onChange={e => setGlow(e.target.value)}
                className="select-box"
              >
                {GLOW_OPTIONS.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">optik animasyon:</label>
              <select
                value={animation}
                onChange={e => setAnimation(e.target.value)}
                className="select-box"
              >
                {ANIMATION_OPTIONS.map(a => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URLs / Paths */}
          <div style={{
            background: '#191919',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8' }}>
              kart görsel dosya yolları (1: Kırmızı Arka, 2: Beyaz Arka, 3: Kırmızı Ön, 4: Beyaz Ön):
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={redBack}
                onChange={e => setRedBack(e.target.value)}
                placeholder="1. Kırmızı Arka Yolu"
                className="input-box"
                style={{ fontSize: '0.74rem' }}
              />
              <input
                type="text"
                value={whiteBack}
                onChange={e => setWhiteBack(e.target.value)}
                placeholder="2. Beyaz Arka Yolu"
                className="input-box"
                style={{ fontSize: '0.74rem' }}
              />
              <input
                type="text"
                value={redFront}
                onChange={e => setRedFront(e.target.value)}
                placeholder="3. Kırmızı Ön Yolu"
                className="input-box"
                style={{ fontSize: '0.74rem' }}
              />
              <input
                type="text"
                value={whiteFront}
                onChange={e => setWhiteFront(e.target.value)}
                placeholder="4. Beyaz Ön Yolu"
                className="input-box"
                style={{ fontSize: '0.74rem' }}
              />
            </div>
          </div>

          {/* Status Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#e2e8f0' }}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={e => setIsEnabled(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
            />
            markette satışta olsun (aktif)
          </label>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              iptal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} /> kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
