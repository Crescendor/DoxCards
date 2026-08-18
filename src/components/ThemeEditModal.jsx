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
  const [coverImage, setCoverImage] = useState('');
  const [fontColorRed, setFontColorRed] = useState('#ffffff');
  const [fontColorWhite, setFontColorWhite] = useState('#000000');
  const [glow, setGlow] = useState('none');
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
      setCoverImage(theme.coverImage || '');
      setFontColorRed(theme.fontColorRed || '#ffffff');
      setFontColorWhite(theme.fontColorWhite || '#000000');
      setGlow(theme.glow || 'none');
      setIsEnabled(theme.isEnabled !== false);

      setRedBack(theme.redBack || theme.images?.redBack || '/themes/stocks/1.png');
      setWhiteBack(theme.whiteBack || theme.images?.whiteBack || '/themes/stocks/2.png');
      setRedFront(theme.redFront || theme.images?.redFront || '/themes/stocks/3.png');
      setWhiteFront(theme.whiteFront || theme.images?.whiteFront || '/themes/stocks/4.png');
    } else {
      setName('');
      setThemeId('');
      setDescription('');
      setPrice(500);
      setCoverImage('');
      setFontColorRed('#ffffff');
      setFontColorWhite('#000000');
      setGlow('none');
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
      coverImage: coverImage.trim(),
      fontColorRed,
      fontColorWhite,
      glow,
      animation: 'none',
      isEnabled,
      redBack,
      whiteBack,
      redFront,
      whiteFront,
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '720px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="#ef4444" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                {isNew ? 'yeni kart teması oluştur' : `kart temasını düzenle: ${theme?.name || ''}`}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                temayı kişiselleştirin, parlama ve yazı renklerini belirleyin
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

        {/* Compact Live Card Preview Box */}
        <div style={{
          background: '#101010',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={13} color="#ef4444" /> canlı kart simülasyonu
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              4 yüzün anlık görünümü
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', justifyItems: 'center' }}>
            {/* 1. Red Back */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', maxWidth: '84px' }}>
              <div
                style={{
                  width: '100%',
                  height: '82px',
                  aspectRatio: '5 / 7',
                  borderRadius: '6px',
                  backgroundImage: `url(${redBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: glow === 'crimson' ? '0 0 12px rgba(239, 68, 68, 0.5)' : (glow === 'golden' ? '0 0 12px rgba(251, 191, 36, 0.5)' : 'none')
                }}
              />
              <span style={{ fontSize: '0.64rem', color: '#ef4444', fontWeight: 700 }}>1. kırmızı arka</span>
            </div>

            {/* 2. White Back */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', maxWidth: '84px' }}>
              <div
                style={{
                  width: '100%',
                  height: '82px',
                  aspectRatio: '5 / 7',
                  borderRadius: '6px',
                  backgroundImage: `url(${whiteBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: glow === 'neon_purple' ? '0 0 12px rgba(168, 85, 247, 0.5)' : (glow === 'neon_blue' ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none')
                }}
              />
              <span style={{ fontSize: '0.64rem', color: '#e2e8f0', fontWeight: 700 }}>2. beyaz arka</span>
            </div>

            {/* 3. Red Front */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', maxWidth: '84px' }}>
              <div
                style={{
                  width: '100%',
                  height: '82px',
                  aspectRatio: '5 / 7',
                  borderRadius: '6px',
                  backgroundImage: `url(${redFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  boxShadow: glow === 'crimson' ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.56rem', color: fontColorRed, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>
                  her şeye maydanoz
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', color: '#ef4444', fontWeight: 700 }}>3. kırmızı ön</span>
            </div>

            {/* 4. White Front */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', maxWidth: '84px' }}>
              <div
                style={{
                  width: '100%',
                  height: '82px',
                  aspectRatio: '5 / 7',
                  borderRadius: '6px',
                  backgroundImage: `url(${whiteFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  boxShadow: glow === 'golden' ? '0 0 12px rgba(251, 191, 36, 0.5)' : 'none'
                }}
              >
                <span style={{ fontSize: '0.56rem', color: fontColorWhite, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>
                  harika aşçı
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', color: '#e2e8f0', fontWeight: 700 }}>4. beyaz ön</span>
            </div>
          </div>
        </div>

        {/* Compact Form Inputs */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '3px', display: 'block' }}>tema adı:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Örn: Galaksi Siber Tema"
                className="input-box"
                style={{ padding: '7px 10px', fontSize: '0.8rem', width: '100%' }}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '3px', display: 'block' }}>coin fiyatı:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  min="0"
                  max="100000"
                  className="input-box"
                  style={{ padding: '7px 10px', fontSize: '0.8rem', flex: 1 }}
                />
                <Coins size={15} color="#fbbf24" />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '3px', display: 'block' }}>açıklama:</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Örn: Derin uzay ve siber enerji tonlarında tema"
              className="input-box"
              style={{ padding: '7px 10px', fontSize: '0.8rem', width: '100%' }}
            />
          </div>

          {/* Cover Image */}
          <div style={{
            background: '#1c1c1c',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.72rem' }}>
                kare kapak / vitrin görseli (opsiyonel):
              </label>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                link girin veya bilgisayarınızdan yükleyin
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {coverImage && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundImage: `url(${coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  flexShrink: 0
                }} />
              )}
              <input
                type="text"
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder="Örn: https://...kare.png veya /themes/gc/cover.png"
                className="input-box"
                style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem' }}
              />
              <label style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: '#2c2c2c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}>
                dosya seç
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setCoverImage(ev.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Color Customization & Glow */}
          <div style={{
            background: '#1c1c1c',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Red Card Font Color */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', marginBottom: '4px' }}>
                <Palette size={12} color="#ef4444" /> kırmızı font rengi:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={fontColorRed}
                  onChange={e => setFontColorRed(e.target.value)}
                  style={{ width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={fontColorRed}
                  onChange={e => setFontColorRed(e.target.value)}
                  className="input-box"
                  style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem' }}
                />
              </div>
            </div>

            {/* White Card Font Color */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', marginBottom: '4px' }}>
                <Palette size={12} color="#e2e8f0" /> beyaz font rengi:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="color"
                  value={fontColorWhite}
                  onChange={e => setFontColorWhite(e.target.value)}
                  style={{ width: '30px', height: '30px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  value={fontColorWhite}
                  onChange={e => setFontColorWhite(e.target.value)}
                  className="input-box"
                  style={{ flex: 1, padding: '5px 8px', fontSize: '0.74rem' }}
                />
              </div>
            </div>

            {/* Glow Selection */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: '4px', display: 'block' }}>
                parlama efekti (glow):
              </label>
              <select
                value={glow}
                onChange={e => setGlow(e.target.value)}
                className="select-box"
                style={{ padding: '6px 8px', fontSize: '0.76rem', width: '100%' }}
              >
                {GLOW_OPTIONS.map(g => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URLs / Uploads (Compact) */}
          <div style={{
            background: '#191919',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e2e8f0' }}>
                kartın 4 yüzü (link girin veya görsel yükleyin):
              </span>
              <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                1: Kırmızı Arka, 2: Beyaz Arka, 3: Kırmızı Ön, 4: Beyaz Ön
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* 1. Kırmızı Arka */}
              <div>
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#ef4444', marginBottom: '2px', display: 'block' }}>1. kırmızı arka:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={redBack}
                    onChange={e => setRedBack(e.target.value)}
                    placeholder="Link veya dosya yolu"
                    className="input-box"
                    style={{ fontSize: '0.72rem', padding: '5px 8px', flex: 1 }}
                  />
                  <label style={{ padding: '5px 8px', borderRadius: '5px', background: '#2c2c2c', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>
                    seç
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setRedBack(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* 2. Beyaz Arka */}
              <div>
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#cbd5e1', marginBottom: '2px', display: 'block' }}>2. beyaz arka:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={whiteBack}
                    onChange={e => setWhiteBack(e.target.value)}
                    placeholder="Link veya dosya yolu"
                    className="input-box"
                    style={{ fontSize: '0.72rem', padding: '5px 8px', flex: 1 }}
                  />
                  <label style={{ padding: '5px 8px', borderRadius: '5px', background: '#2c2c2c', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>
                    seç
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setWhiteBack(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* 3. Kırmızı Ön */}
              <div>
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#ef4444', marginBottom: '2px', display: 'block' }}>3. kırmızı ön (kart yüzü):</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={redFront}
                    onChange={e => setRedFront(e.target.value)}
                    placeholder="Link veya dosya yolu"
                    className="input-box"
                    style={{ fontSize: '0.72rem', padding: '5px 8px', flex: 1 }}
                  />
                  <label style={{ padding: '5px 8px', borderRadius: '5px', background: '#2c2c2c', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>
                    seç
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setRedFront(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* 4. Beyaz Ön */}
              <div>
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#cbd5e1', marginBottom: '2px', display: 'block' }}>4. beyaz ön (kart yüzü):</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={whiteFront}
                    onChange={e => setWhiteFront(e.target.value)}
                    placeholder="Link veya dosya yolu"
                    className="input-box"
                    style={{ fontSize: '0.72rem', padding: '5px 8px', flex: 1 }}
                  />
                  <label style={{ padding: '5px 8px', borderRadius: '5px', background: '#2c2c2c', color: '#fff', fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0 }}>
                    seç
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setWhiteFront(ev.target.result);
                        reader.readAsDataURL(file);
                      }
                    }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Status Checkbox & Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#e2e8f0' }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={e => setIsEnabled(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#ef4444' }}
              />
              markette satışta olsun (aktif)
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                iptal
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.8rem' }}
              >
                <Check size={15} /> kaydet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
