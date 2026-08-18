import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowLeft,
  Save,
  Eye,
  Palette,
  Sparkles,
  Coins,
  Check,
  Upload,
  Link2,
  Info,
  Sliders,
  RotateCw,
  Image as ImageIcon
} from 'lucide-react';
import { sounds } from '../services/soundEffects';

const GLOW_OPTIONS = [
  { id: 'none', label: 'Yok (Standart)', color: '#94a3b8' },
  { id: 'crimson', label: 'Kızıl Yakut (Crimson)', color: '#ef4444' },
  { id: 'neon_blue', label: 'Mavi Neon (Cyan)', color: '#38bdf8' },
  { id: 'neon_purple', label: 'Mor Neon (Purple)', color: '#c084fc' },
  { id: 'golden', label: 'Altın Parıltı (Golden)', color: '#fbbf24' },
  { id: 'emerald', label: 'Zümrüt Yeşili (Emerald)', color: '#10b981' },
  { id: 'neon_pink', label: 'Pembe Neon (Pink)', color: '#f472b6' },
  { id: 'radioactive', label: 'Radyoaktif Yeşil', color: '#22c55e' }
];

export default function ThemeEditorPageView({
  theme = null,
  isNew = false,
  onBack,
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

  // 4 Faces Images (Exact 610x864 px ratio)
  const [redBack, setRedBack] = useState('/themes/stocks/1.png');
  const [whiteBack, setWhiteBack] = useState('/themes/stocks/2.png');
  const [redFront, setRedFront] = useState('/themes/stocks/3.png');
  const [whiteFront, setWhiteFront] = useState('/themes/stocks/4.png');

  // Simulation preview active tab
  const [previewTab, setPreviewTab] = useState('all'); // 'all' | 'red' | 'white'
  const [sampleRedText, setSampleRedText] = useState('her şeye maydanoz');
  const [sampleWhiteText, setSampleWhiteText] = useState('harika aşçı');

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
  }, [theme]);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setter(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
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
      redBack: redBack.trim(),
      whiteBack: whiteBack.trim(),
      redFront: redFront.trim(),
      whiteFront: whiteFront.trim(),
      images: {
        redBack: redBack.trim(),
        whiteBack: whiteBack.trim(),
        redFront: redFront.trim(),
        whiteFront: whiteFront.trim()
      }
    };

    sounds.playClick();
    if (onSave) onSave(updated);
  };

  const getGlowStyle = (glowType) => {
    if (glowType === 'crimson') return '0 0 24px rgba(239, 68, 68, 0.7)';
    if (glowType === 'neon_blue') return '0 0 24px rgba(56, 189, 248, 0.7)';
    if (glowType === 'neon_purple') return '0 0 24px rgba(168, 85, 247, 0.7)';
    if (glowType === 'golden') return '0 0 24px rgba(251, 191, 36, 0.7)';
    if (glowType === 'emerald') return '0 0 24px rgba(16, 185, 129, 0.7)';
    if (glowType === 'neon_pink') return '0 0 24px rgba(244, 114, 182, 0.7)';
    if (glowType === 'radioactive') return '0 0 24px rgba(34, 197, 94, 0.7)';
    return 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Sticky Header */}
      <header style={{
        height: '64px',
        background: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Back */}
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>temalara dön</span>
        </button>

        {/* Center: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={18} color="#ef4444" />
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {isNew ? 'yeni kart teması oluştur' : `kart temasını düzenle: ${name || theme?.name || ''}`}
          </span>
        </div>

        {/* Right: Save Button */}
        <button
          onClick={handleSubmit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            color: '#ffffff',
            padding: '9px 22px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <Save size={16} />
          <span>temayı kaydet</span>
        </button>
      </header>

      {/* Main Container: 2-Column Responsive Layout */}
      <div style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '28px',
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 1fr) minmax(500px, 1.25fr)',
        gap: '32px',
        boxSizing: 'border-box',
        alignItems: 'start'
      }}>
        {/* ========================================================================= */}
        {/* LEFT COLUMN: REAL-TIME 4-CARD SIMULATION (610 x 864 px ratio) */}
        {/* ========================================================================= */}
        <div style={{
          background: '#141414',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'sticky',
          top: '88px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
                canlı kart simülasyonu
              </h3>
            </div>

            <span style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#ef4444',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              610 × 864 px (5:7)
            </span>
          </div>

          {/* Simulation Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#0a0a0a', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setPreviewTab('all')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: previewTab === 'all' ? '#ef4444' : 'transparent',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              4 yüz bir arada
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('red')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: previewTab === 'red' ? '#ef4444' : 'transparent',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              kırmızı kart (ön & arka)
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab('white')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                border: 'none',
                background: previewTab === 'white' ? '#ef4444' : 'transparent',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              beyaz kart (ön & arka)
            </button>
          </div>

          {/* Live Card Previews Container */}
          <div style={{
            background: '#0a0a0a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: previewTab === 'all' ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap: '16px',
            justifyItems: 'center'
          }}>
            {/* 1. Kırmızı Arka */}
            {(previewTab === 'all' || previewTab === 'red') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '170px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '610 / 864',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundImage: `url(${redBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  boxShadow: getGlowStyle(glow),
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', color: '#ff6666', fontWeight: 800 }}>
                    arka
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 800 }}>1. kırmızı arka</span>
              </div>
            )}

            {/* 2. Kırmızı Ön (Kart Yüzü) */}
            {(previewTab === 'all' || previewTab === 'red') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '170px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '610 / 864',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundImage: `url(${redFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1.5px solid rgba(239, 68, 68, 0.5)',
                  boxShadow: getGlowStyle(glow),
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 12px',
                  boxSizing: 'border-box',
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    color: fontColorRed,
                    fontWeight: 900,
                    lineHeight: 1.25,
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                  }}>
                    {sampleRedText}
                  </div>

                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', opacity: 0.85 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M4 2v20M4 4h14l-2 5 2 5H4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 800 }}>3. kırmızı ön (yüz)</span>
              </div>
            )}

            {/* 3. Beyaz Arka */}
            {(previewTab === 'all' || previewTab === 'white') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '170px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '610 / 864',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundImage: `url(${whiteBack})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: getGlowStyle(glow),
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.62rem', color: '#e2e8f0', fontWeight: 800 }}>
                    arka
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 800 }}>2. beyaz arka</span>
              </div>
            )}

            {/* 4. Beyaz Ön (Kart Yüzü) */}
            {(previewTab === 'all' || previewTab === 'white') && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '170px' }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '610 / 864',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  backgroundImage: `url(${whiteFront})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: getGlowStyle(glow),
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 12px',
                  boxSizing: 'border-box',
                  transition: 'box-shadow 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '0.88rem',
                    color: fontColorWhite,
                    fontWeight: 900,
                    lineHeight: 1.25,
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    textShadow: '0 1px 3px rgba(255,255,255,0.4)'
                  }}>
                    {sampleWhiteText}
                  </div>

                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', opacity: 0.85 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000">
                      <path d="M4 2v20M4 4h14l-2 5 2 5H4" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#e2e8f0', fontWeight: 800 }}>4. beyaz ön (yüz)</span>
              </div>
            )}
          </div>

          {/* Sample Text Inputs for Simulation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>
              Simülasyon test metinleri:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={sampleRedText}
                onChange={e => setSampleRedText(e.target.value)}
                placeholder="Kırmızı test metni"
                className="input-box"
                style={{ padding: '6px 10px', fontSize: '0.76rem', color: '#ff6666' }}
              />
              <input
                type="text"
                value={sampleWhiteText}
                onChange={e => setSampleWhiteText(e.target.value)}
                placeholder="Beyaz test metni"
                className="input-box"
                style={{ padding: '6px 10px', fontSize: '0.76rem', color: '#ffffff' }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: THEME CONTROLS & 610x864 URL / FILE INPUTS */}
        {/* ========================================================================= */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Section 1: Basic Information */}
          <div style={{
            background: '#141414',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <Sliders size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                temel tema bilgileri
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  tema adı:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: Aşkokuşko Teması"
                  className="input-box"
                  style={{ padding: '10px 14px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  coin fiyatı:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    min="0"
                    max="1000000"
                    className="input-box"
                    style={{ padding: '10px 14px', fontSize: '0.88rem', flex: 1 }}
                  />
                  <Coins size={18} color="#fbbf24" />
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                tema açıklaması:
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Örn: Romantik yakut kırmızısı ve zarafet detaylı özel kart teması."
                className="input-box"
                style={{ padding: '10px 14px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Vitrin / Kare Kapak Görseli */}
            <div style={{
              background: '#0d0d0d',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.76rem', fontWeight: 700 }}>
                  kare vitrin görseli (opsiyonel):
                </label>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  internet linki yapıştırın veya dosya seçin
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {coverImage && (
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
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
                  placeholder="https://...kare.png veya /themes/gc/cover.png"
                  className="input-box"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                />
                <label style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#242424',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Upload size={14} />
                  <span>dosya seç</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setCoverImage)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: 4 Card Faces (610 x 864 px) */}
          <div style={{
            background: '#141414',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                  kartın 4 yüzü (610 × 864 px)
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                internet linki veya dosya yükleme
              </span>
            </div>

            <div style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.76rem',
              color: '#bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Info size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span>
                Kart görselleri standart <b>610 × 864 px</b> (5:7 en-boy oranı) olmalıdır. İnternetteki herhangi bir doğrudan resim linkini (https://...) yapıştırabilir veya cihazınızdan yükleyebilirsiniz.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 1. Kırmızı Arka */}
              <div style={{ background: '#0d0d0d', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>
                    1. kırmızı arka (610 × 864):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>kırmızı kartların arka yüzü</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {redBack && (
                    <div style={{
                      width: '32px',
                      height: '45px',
                      borderRadius: '6px',
                      backgroundImage: `url(${redBack})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      flexShrink: 0
                    }} />
                  )}
                  <input
                    type="text"
                    value={redBack}
                    onChange={e => setRedBack(e.target.value)}
                    placeholder="https://.../red_back.png veya /themes/stocks/1.png"
                    className="input-box"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  />
                  <label style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#242424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}>
                    seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setRedBack)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* 2. Beyaz Arka */}
              <div style={{ background: '#0d0d0d', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e2e8f0' }}>
                    2. beyaz arka (610 × 864):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>beyaz kartların arka yüzü</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {whiteBack && (
                    <div style={{
                      width: '32px',
                      height: '45px',
                      borderRadius: '6px',
                      backgroundImage: `url(${whiteBack})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      flexShrink: 0
                    }} />
                  )}
                  <input
                    type="text"
                    value={whiteBack}
                    onChange={e => setWhiteBack(e.target.value)}
                    placeholder="https://.../white_back.png veya /themes/stocks/2.png"
                    className="input-box"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  />
                  <label style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#242424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}>
                    seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setWhiteBack)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* 3. Kırmızı Ön (Kart Yüzü) */}
              <div style={{ background: '#0d0d0d', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444' }}>
                    3. kırmızı ön (kart yüzü) (610 × 864):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>kırmızı kartların metin yazılan ön yüzü</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {redFront && (
                    <div style={{
                      width: '32px',
                      height: '45px',
                      borderRadius: '6px',
                      backgroundImage: `url(${redFront})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      flexShrink: 0
                    }} />
                  )}
                  <input
                    type="text"
                    value={redFront}
                    onChange={e => setRedFront(e.target.value)}
                    placeholder="https://.../red_front.png veya /themes/stocks/3.png"
                    className="input-box"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  />
                  <label style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#242424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}>
                    seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setRedFront)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* 4. Beyaz Ön (Kart Yüzü) */}
              <div style={{ background: '#0d0d0d', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#e2e8f0' }}>
                    4. beyaz ön (kart yüzü) (610 × 864):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>beyaz kartların metin yazılan ön yüzü</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {whiteFront && (
                    <div style={{
                      width: '32px',
                      height: '45px',
                      borderRadius: '6px',
                      backgroundImage: `url(${whiteFront})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      flexShrink: 0
                    }} />
                  )}
                  <input
                    type="text"
                    value={whiteFront}
                    onChange={e => setWhiteFront(e.target.value)}
                    placeholder="https://.../white_front.png veya /themes/stocks/4.png"
                    className="input-box"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                  />
                  <label style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#242424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}>
                    seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setWhiteFront)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Font Colors & Glow Effect */}
          <div style={{
            background: '#141414',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
              <Palette size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                yazı renkleri ve parlama efektleri
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '16px', alignItems: 'center' }}>
              {/* Red Font Color */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', marginBottom: '6px', fontWeight: 700 }}>
                  <Palette size={14} color="#ef4444" /> kırmızı font rengi:
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
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* White Font Color */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', marginBottom: '6px', fontWeight: 700 }}>
                  <Palette size={14} color="#e2e8f0" /> beyaz font rengi:
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
                    style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Glow Selection */}
              <div>
                <label className="form-label" style={{ fontSize: '0.76rem', marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  parlama efekti (glow):
                </label>
                <select
                  value={glow}
                  onChange={e => setGlow(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {GLOW_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active in market checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginTop: '8px',
              background: '#0d0d0d',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={e => setIsEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff' }}>
                markette satışta olsun (aktif)
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
