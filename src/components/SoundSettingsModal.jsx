import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Save, X, Sparkles, Crown, ShieldCheck } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { fetchAppConfig, updateUser, saveLocalUserProfile } from '../services/userService';

export default function SoundSettingsModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile
}) {
  const [appSounds, setAppSounds] = useState([]);
  const [selectedWhiteSound, setSelectedWhiteSound] = useState(userProfile?.customSounds?.whiteCardSoundId || '');
  const [selectedRedSound, setSelectedRedSound] = useState(userProfile?.customSounds?.redCardSoundId || '');
  const [selectedWinSound, setSelectedWinSound] = useState(userProfile?.customSounds?.gameWinSoundId || '');
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppConfig().then(cfg => {
        if (cfg && Array.isArray(cfg.customSounds)) {
          setAppSounds(cfg.customSounds);
        }
      });
      setSelectedWhiteSound(userProfile?.customSounds?.whiteCardSoundId || '');
      setSelectedRedSound(userProfile?.customSounds?.redCardSoundId || '');
      setSelectedWinSound(userProfile?.customSounds?.gameWinSoundId || '');
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const isEligible = userProfile?.tags?.some(t => ['premium', 'vip', 'admin'].includes(t.toLowerCase())) || userProfile?.tags?.length > 0;

  const handleTestPlay = (soundId) => {
    sounds.playClick();
    const soundItem = appSounds.find(s => s.id === soundId);
    if (!soundItem) return;

    setPlayingSoundId(soundId);
    sounds.playCustomAudio(soundItem);
    const duration = ((Number(soundItem.endSec) || 3) - (Number(soundItem.startSec) || 0)) * 1000;
    setTimeout(() => {
      setPlayingSoundId(null);
    }, Math.max(1000, duration));
  };

  const handleSave = async () => {
    if (!userProfile?.id) return;
    setIsSaving(true);
    sounds.playClick();

    const customSounds = {
      whiteCardSoundId: selectedWhiteSound || null,
      redCardSoundId: selectedRedSound || null,
      gameWinSoundId: selectedWinSound || null
    };

    const optimisticUser = {
      ...userProfile,
      customSounds: customSounds
    };
    saveLocalUserProfile(optimisticUser);
    if (onUpdateProfile) onUpdateProfile(optimisticUser);

    const updated = await updateUser(userProfile.id, {
      customSounds: customSounds
    });

    setIsSaving(false);
    if (updated) {
      saveLocalUserProfile(updated);
      if (onUpdateProfile) onUpdateProfile(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  const whiteOptions = appSounds.filter(s => s.category === 'white_card' || s.category === 'general');
  const redOptions = appSounds.filter(s => s.category === 'red_card' || s.category === 'general');
  const winOptions = appSounds.filter(s => s.category === 'game_win' || s.category === 'general');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(255, 0, 0, 0.4)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '520px',
        padding: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#FF0000',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(255, 0, 0, 0.5)'
            }}>
              <Volume2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                özel ses efektleri
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                kart attığınızda ve oyunu kazandığınızda herkesin duyacağı sesleri seçin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { sounds.playClick(); onClose(); }}
            style={{
              background: '#262626',
              border: 'none',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Eligibility Check Banner */}
        {!isEligible && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.8rem',
            color: '#fef08a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} />
            <span>özel ses efektlerini kullanabilmek için <b>Premium</b>, <b>VIP</b> veya <b>Admin</b> yetkisine sahip olmanız gerekmektedir.</span>
          </div>
        )}

        {/* Selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: isEligible ? 1 : 0.6 }}>
          {/* 1. White Card Sound */}
          <div style={{ background: '#242424', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚪ beyaz kart atma sesi
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                masaya beyaz kart bıraktığınızda çalar
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedWhiteSound}
                onChange={(e) => setSelectedWhiteSound(e.target.value)}
                disabled={!isEligible}
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="">(varsayılan sistem sesi)</option>
                {whiteOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.isDefault ? '⭐' : ''}</option>
                ))}
              </select>

              {selectedWhiteSound && (
                <button
                  type="button"
                  onClick={() => handleTestPlay(selectedWhiteSound)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: playingSoundId === selectedWhiteSound ? '#FF0000' : '#333333',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title="Test Et"
                >
                  {playingSoundId === selectedWhiteSound ? <Square size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                </button>
              )}
            </div>
          </div>

          {/* 2. Red Flag Sound */}
          <div style={{ background: '#242424', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ff6666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔴 kırmızı kart (sabotaj) sesi
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                rakibe kırmızı kart koyduğunuzda çalar
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedRedSound}
                onChange={(e) => setSelectedRedSound(e.target.value)}
                disabled={!isEligible}
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="">(varsayılan sistem sesi)</option>
                {redOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.isDefault ? '⭐' : ''}</option>
                ))}
              </select>

              {selectedRedSound && (
                <button
                  type="button"
                  onClick={() => handleTestPlay(selectedRedSound)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: playingSoundId === selectedRedSound ? '#FF0000' : '#333333',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title="Test Et"
                >
                  {playingSoundId === selectedRedSound ? <Square size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                </button>
              )}
            </div>
          </div>

          {/* 3. Game Win Sound */}
          <div style={{ background: '#242424', padding: '14px', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏆 oyunu kazanma (zafer) sesi
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                hedef puana ulaşıp kazandığınızda çalar
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={selectedWinSound}
                onChange={(e) => setSelectedWinSound(e.target.value)}
                disabled={!isEligible}
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="">(varsayılan sistem sesi)</option>
                {winOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.isDefault ? '⭐' : ''}</option>
                ))}
              </select>

              {selectedWinSound && (
                <button
                  type="button"
                  onClick={() => handleTestPlay(selectedWinSound)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    background: playingSoundId === selectedWinSound ? '#FF0000' : '#333333',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title="Test Et"
                >
                  {playingSoundId === selectedWinSound ? <Square size={12} fill="#ffffff" /> : <Play size={12} fill="#ffffff" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => { sounds.playClick(); onClose(); }}
            className="btn-secondary"
            style={{ padding: '0 18px', height: '42px', fontSize: '0.85rem' }}
          >
            kapat
          </button>

          {isEligible && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '0 24px', height: '42px', fontSize: '0.85rem' }}
            >
              <Save size={15} /> {isSaving ? 'kaydediliyor...' : (saveSuccess ? 'kaydedildi!' : 'sesleri kaydet')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
