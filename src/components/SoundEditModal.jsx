import React, { useState, useEffect } from 'react';
import { X, Volume2, Play, Square, Coins, Image, Youtube, Upload, Save, Sparkles } from 'lucide-react';
import { extractYouTubeId } from '../services/soundEffects';

export default function SoundEditModal({
  isOpen,
  sound,
  onClose,
  onSave,
  onTestPlay,
  isPlaying = false
}) {
  if (!isOpen) return null;

  const isNew = !sound?.id;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('white_card');
  const [type, setType] = useState('youtube');
  const [url, setUrl] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(3);
  const [price, setPrice] = useState(200);
  const [coverImage, setCoverImage] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (sound) {
      setName(sound.name || sound.title || '');
      setCategory(sound.category || 'white_card');
      setType(sound.type || (sound.ytId || sound.ytUrl ? 'youtube' : 'file'));
      setUrl(sound.url || '');
      setYtUrl(sound.ytUrl || (sound.ytId ? `https://www.youtube.com/watch?v=${sound.ytId}` : ''));
      setStartSec(sound.startSec ?? 0);
      setEndSec(sound.endSec ?? 3);
      setPrice(sound.price ?? 200);
      setCoverImage(sound.coverImage || '');
      setIsDefault(Boolean(sound.isDefault));
      setIsEnabled(sound.isEnabled !== false);
    } else {
      setName('');
      setCategory('white_card');
      setType('youtube');
      setUrl('');
      setYtUrl('');
      setStartSec(0);
      setEndSec(3);
      setPrice(200);
      setCoverImage('');
      setIsDefault(false);
      setIsEnabled(true);
    }
  }, [sound, isOpen]);

  // Handle Cover Image File Upload
  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle MP3/Audio File Upload
  const handleAudioFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setUrl(event.target.result);
      setType('file');
    };
    reader.readAsDataURL(file);
  };

  const handleTest = () => {
    if (onTestPlay) {
      onTestPlay({
        id: sound?.id || 'preview',
        name: name || 'Önizleme',
        type,
        url,
        ytUrl,
        ytId: type === 'youtube' ? extractYouTubeId(ytUrl) : null,
        startSec: Number(startSec) || 0,
        endSec: Number(endSec) || 3
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ytId = type === 'youtube' ? extractYouTubeId(ytUrl) : null;

    const updatedSound = {
      id: sound?.id || `sound_${Date.now()}`,
      name: name.trim(),
      category,
      type,
      url: type === 'youtube' ? '' : url.trim(),
      ytUrl: type === 'youtube' ? ytUrl.trim() : '',
      ytId: ytId || '',
      startSec: Number(startSec) || 0,
      endSec: Number(endSec) || 3,
      price: Math.max(0, Number(price) || 0),
      coverImage: coverImage.trim(),
      isDefault: Boolean(isDefault),
      isEnabled: Boolean(isEnabled)
    };

    onSave(updatedSound);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#181818',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#1f1f1f'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Volume2 size={22} color="#ef4444" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#ffffff' }}>
                {isNew ? 'yeni ses efekti oluştur' : `ses efektini düzenle: ${sound?.name || ''}`}
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                ses kaynağını, süresini, youtube linkini, fiyatını ve kapak görselini belirleyin
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}
        >
          {/* Row 1: Ses Adı & Kategori & Fiyat */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: '12px' }}>
            {/* Ses Adı */}
            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '6px', display: 'block', color: '#cbd5e1' }}>
                ses adı / başlığı:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: faaah!, naneyi yedin..."
                className="form-input"
                style={{ width: '100%', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '9px 12px', fontSize: '0.84rem' }}
                required
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '6px', display: 'block', color: '#cbd5e1' }}>
                kategori:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
                style={{ width: '100%', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '9px 12px', fontSize: '0.84rem' }}
              >
                <option value="white_card">Beyaz Kart Dağıtımı</option>
                <option value="red_card">Kırmızı Kart Sabotajı</option>
                <option value="game_win">Zafer / Skorbord</option>
              </select>
            </div>

            {/* Coin Fiyatı */}
            <div>
              <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '6px', display: 'block', color: '#cbd5e1' }}>
                fiyat (coin):
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', background: '#121212', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '9px 28px 9px 10px', fontSize: '0.84rem' }}
                />
                <Coins size={14} color="#fbbf24" style={{ position: 'absolute', right: '10px', top: '12px' }} />
              </div>
            </div>
          </div>

          {/* Row 2: Ses Kaynağı Seçimi */}
          <div style={{
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setType('youtube')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: type === 'youtube' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: type === 'youtube' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: type === 'youtube' ? '#fca5a5' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Youtube size={16} color={type === 'youtube' ? '#ef4444' : '#94a3b8'} /> YouTube Linki
              </button>

              <button
                type="button"
                onClick={() => setType('file')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: type === 'file' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: type === 'file' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: type === 'file' ? '#fca5a5' : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={16} color={type === 'file' ? '#ef4444' : '#94a3b8'} /> Dosya Yolu / MP3 Web Linki
              </button>
            </div>

            {type === 'youtube' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 800 }}>
                  youtube video linki / URL:
                </label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=... veya https://youtu.be/..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', background: '#1c1c1c', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ffffff', borderRadius: '10px', padding: '9px 12px', fontSize: '0.84rem' }}
                  required={type === 'youtube'}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                  ses url'si veya yerel dosya yolu:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Örn: /sounds/deal.mp3 veya https://...mp3"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="form-input"
                    style={{ flex: 1, background: '#1c1c1c', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '9px 12px', fontSize: '0.84rem' }}
                  />
                  <label style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#242424',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Upload size={14} /> Dosya Seç
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Saniye Aralığı ve Dinleme Testi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'flex-end', marginTop: '6px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '4px', display: 'block', color: '#cbd5e1' }}>
                  başlangıç (sn):
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={startSec}
                  onChange={(e) => setStartSec(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', background: '#1c1c1c', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '4px', display: 'block', color: '#cbd5e1' }}>
                  bitiş (sn):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={endSec}
                  onChange={(e) => setEndSec(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', background: '#1c1c1c', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '8px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <button
                type="button"
                onClick={handleTest}
                className="btn-secondary"
                style={{
                  height: '38px',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
              >
                {isPlaying ? <Square size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" />}
                <span>{isPlaying ? 'durdur' : 'önizle / dinle'}</span>
              </button>
            </div>
          </div>

          {/* Row 3: Kare Kapak Görseli (Link veya Yükleme) */}
          <div style={{
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Image size={14} color="#ef4444" /> kare kapak / vitrin görseli (opsiyonel):
              </label>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                link girerek veya bilgisayarınızdan yükleyerek ekleyebilirsiniz
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Thumbnail Preview */}
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '10px',
                background: '#242424',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {coverImage ? (
                  <img src={coverImage} alt="Kapak" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Volume2 size={20} color="#64748b" />
                )}
              </div>

              {/* Link Input */}
              <input
                type="text"
                placeholder="Örn: https://i.imgur.com/...png veya /themes/sound.png"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="form-input"
                style={{ flex: 1, background: '#1c1c1c', border: '1px solid rgba(255, 255, 255, 0.14)', color: '#ffffff', borderRadius: '10px', padding: '9px 12px', fontSize: '0.82rem' }}
              />

              {/* File Upload Button */}
              <label style={{
                padding: '9px 14px',
                borderRadius: '10px',
                background: '#242424',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}>
                <Upload size={14} /> Dosya Seç
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {coverImage && (
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }}
                  title="Görseli Kaldır"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Status & Defaults */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#ffffff', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <span>bu kategorideki herkes için varsayılan sistem sesi yap</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#ffffff', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
              <span>markette satışta olsun (aktif)</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            marginTop: '6px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.84rem', borderRadius: '10px' }}
            >
              iptal
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '10px 26px',
                fontSize: '0.86rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px'
              }}
            >
              <Save size={16} /> {isNew ? 'sesi ekle ve kaydet' : 'değişiklikleri kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
