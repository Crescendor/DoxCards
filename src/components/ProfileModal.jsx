import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  LogOut,
  User,
  Sliders,
  Palette,
  Play,
  Square,
  Save,
  Check,
  Lock,
  Music
} from 'lucide-react';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';
import { fetchAppConfig, updateUser, saveLocalUserProfile, DEFAULT_CONFIG } from '../services/userService';
import { socket } from '../services/socket';
import TagBadge from './TagBadge';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'audio_theme'
  const [customMuted, setCustomMuted] = useState(sounds.customMuted);
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);

  // Custom sounds configuration for VIP / Premium users
  const [appSounds, setAppSounds] = useState([]);
  const [selectedWhiteSound, setSelectedWhiteSound] = useState(userProfile?.customSounds?.whiteCardSoundId || '');
  const [selectedRedSound, setSelectedRedSound] = useState(userProfile?.customSounds?.redCardSoundId || '');
  const [selectedWinSound, setSelectedWinSound] = useState(userProfile?.customSounds?.gameWinSoundId || '');
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [isSavingSounds, setIsSavingSounds] = useState(false);
  const [soundSaveSuccess, setSoundSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomMuted(sounds.customMuted);
      fetchAppConfig().then(cfg => {
        if (cfg) {
          setAppConfig(cfg);
          if (Array.isArray(cfg.customSounds)) {
            setAppSounds(cfg.customSounds);
            sounds.setCustomSounds(cfg.customSounds);
          }
        }
      });
      setSelectedWhiteSound(userProfile?.customSounds?.whiteCardSoundId || '');
      setSelectedRedSound(userProfile?.customSounds?.redCardSoundId || '');
      setSelectedWinSound(userProfile?.customSounds?.gameWinSoundId || '');
    }
  }, [isOpen, userProfile]);

  if (!isOpen || !userProfile) return null;

  const handleToggleCustomSounds = () => {
    sounds.playClick();
    const newMuted = sounds.toggleCustomMute();
    setCustomMuted(newMuted);
  };

  const isAdmin = userProfile.tags?.some(t => String(t || '').toLowerCase() === 'admin') || userProfile.id === '269639754675519489';
  const isVipOrPremium = userProfile.tags?.some(t => ['vip', 'premium', 'admin'].includes(String(t || '').toLowerCase())) ||
                         userProfile.id === '269639754675519489';

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

  const handleSaveCustomSounds = async () => {
    if (!userProfile?.id || !isVipOrPremium) return;
    setIsSavingSounds(true);
    sounds.playClick();

    const customSoundsPayload = {
      whiteCardSoundId: selectedWhiteSound || null,
      redCardSoundId: selectedRedSound || null,
      gameWinSoundId: selectedWinSound || null
    };

    const optimisticUser = {
      ...userProfile,
      customSounds: customSoundsPayload
    };
    saveLocalUserProfile(optimisticUser);
    if (onUpdateProfile) onUpdateProfile(optimisticUser);

    if (socket) {
      socket.emit('update_player_profile', {
        playerId: userProfile.id,
        customSounds: customSoundsPayload
      });
    }

    const updated = await updateUser(userProfile.id, {
      customSounds: customSoundsPayload
    });

    setIsSavingSounds(false);
    if (updated) {
      saveLocalUserProfile(updated);
      if (onUpdateProfile) onUpdateProfile(updated);
    }
    setSoundSaveSuccess(true);
    setTimeout(() => {
      setSoundSaveSuccess(false);
    }, 2000);
  };

  const whiteOptions = appSounds.filter(s => s.category === 'white_card' || s.category === 'general');
  const redOptions = appSounds.filter(s => s.category === 'red_card' || s.category === 'general');
  const winOptions = appSounds.filter(s => s.category === 'game_win' || s.category === 'general');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          padding: 0,
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          minHeight: '440px',
          maxHeight: '85vh'
        }}
      >
        {/* Left Sidebar Navbar */}
        <div style={{
          width: '185px',
          background: '#121212',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px 12px',
          flexShrink: 0
        }}>
          {/* Top Nav Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              padding: '0 8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'lowercase',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '8px'
            }}>
              <Sliders size={14} color="#ef4444" />
              ayarlar menüsü
            </div>

            {/* Tab: Profil */}
            <button
              onClick={() => { sounds.playClick(); setActiveTab('profile'); }}
              style={{
                background: activeTab === 'profile' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'profile' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderLeft: activeTab === 'profile' ? '3px solid #ef4444' : '3px solid transparent',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={16} color={activeTab === 'profile' ? '#ef4444' : '#94a3b8'} />
              profil
            </button>

            {/* Tab: Ses ve Tema */}
            <button
              onClick={() => { sounds.playClick(); setActiveTab('audio_theme'); }}
              style={{
                background: activeTab === 'audio_theme' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'audio_theme' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderLeft: activeTab === 'audio_theme' ? '3px solid #ef4444' : '3px solid transparent',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.84rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Volume2 size={16} color={activeTab === 'audio_theme' ? '#ef4444' : '#94a3b8'} />
              ses ve tema
            </button>
          </div>

          {/* Logout Button in Sidebar */}
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
              if (onLogout) onLogout();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '9px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={14} /> çıkış yap
          </button>
        </div>

        {/* Right Content Area */}
        <div style={{
          flex: 1,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          overflowY: 'auto'
        }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeTab === 'profile' ? (
                <User size={18} color="#ef4444" />
              ) : (
                <Palette size={18} color="#ef4444" />
              )}
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', textTransform: 'lowercase' }}>
                {activeTab === 'profile' ? 'oyuncu profili' : 'ses ve tema ayarları'}
              </h3>
            </div>

            <button
              onClick={() => { sounds.playClick(); onClose(); }}
              className="btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="kapat"
            >
              <X size={16} />
            </button>
          </div>

          {/* TAB 1: PROFIL */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* User Identity Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: '#202020',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <img
                  src={userProfile.avatar || defaultAvatarImg}
                  alt={userProfile.displayName || userProfile.username}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid #ef4444',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
                    flexShrink: 0
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                      {userProfile.displayName || userProfile.username}
                    </span>
                    {userProfile.username && userProfile.username !== userProfile.displayName && (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        @{userProfile.username}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    discord id: <b style={{ color: '#cbd5e1' }}>{userProfile.id}</b>
                  </span>
                </div>
              </div>

              {/* Roles and Tags (Max 4 per row, deduplicated) */}
              {(() => {
                const profileTags = Array.from(new Set([
                  ...(isAdmin ? ['admin'] : []),
                  ...(userProfile.tags || [])
                ]));

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>
                      roller ve etiketler:
                    </span>
                    {profileTags.length > 0 ? (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, max-content)',
                        gap: '6px 8px',
                        alignItems: 'center'
                      }}>
                        {profileTags.map(t => (
                          <TagBadge key={t} tag={t} size="md" customTags={appConfig?.customTags} />
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        özel bir rol veya etiket bulunmuyor.
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* 2-Metric Stats Grid (NO COIN) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  background: '#202020',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px 10px',
                  borderRadius: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'lowercase', marginBottom: '4px' }}>
                    toplam oyun
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                    {userProfile.totalGames || 0}
                  </div>
                </div>

                <div style={{
                  background: '#202020',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '14px 10px',
                  borderRadius: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'lowercase', marginBottom: '4px' }}>
                    toplam puan
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>
                    {userProfile.totalScore || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SES VE TEMA */}
          {activeTab === 'audio_theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 1. Other Players' Custom Sound Mute Toggle */}
              <div style={{
                background: '#202020',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: customMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {customMuted ? <VolumeX size={18} color="#f87171" /> : <Volume2 size={18} color="#34d399" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                      özel oyuncu sesleri
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {customMuted ? 'diğer oyuncuların özel sesleri susturuldu' : 'diğer oyuncuların özel ses efektleri çalıyor'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleCustomSounds}
                  style={{
                    background: customMuted ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0
                  }}
                >
                  {customMuted ? 'susturuldu' : 'açık'}
                </button>
              </div>

              {/* 2. Custom Player Sound Triggers (VIP / Premium Exclusive) */}
              <div style={{ position: 'relative' }}>
                {/* Sound Dropdowns Container */}
                <div style={{
                  background: '#202020',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  textAlign: 'left',
                  filter: isVipOrPremium ? 'none' : 'blur(4px)',
                  opacity: isVipOrPremium ? 1 : 0.4,
                  pointerEvents: isVipOrPremium ? 'auto' : 'none',
                  userSelect: isVipOrPremium ? 'auto' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Music size={16} color="#fbbf24" />
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                        özel kart ve kazanma seslerin
                      </span>
                    </div>

                    {isVipOrPremium && (
                      <button
                        onClick={handleSaveCustomSounds}
                        disabled={isSavingSounds}
                        className="btn-primary"
                        style={{
                          height: '32px',
                          minHeight: '32px',
                          padding: '0 12px',
                          fontSize: '0.76rem',
                          borderRadius: '8px'
                        }}
                      >
                        {soundSaveSuccess ? <Check size={14} /> : <Save size={14} />}
                        {soundSaveSuccess ? 'kaydedildi!' : isSavingSounds ? 'kaydediliyor...' : 'kaydet'}
                      </button>
                    )}
                  </div>

                  {/* White Card Sound */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                      beyaz kart sesi:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={selectedWhiteSound}
                        onChange={(e) => setSelectedWhiteSound(e.target.value)}
                        className="select-box"
                        style={{ padding: '8px 10px', fontSize: '0.80rem', borderRadius: '8px' }}
                      >
                        <option value="">(varsayılan sistem sesi)</option>
                        {whiteOptions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedWhiteSound && (
                        <button
                          type="button"
                          onClick={() => handleTestPlay(selectedWhiteSound)}
                          className="btn-icon"
                          style={{ width: '32px', height: '32px', flexShrink: 0 }}
                          title="dinle"
                        >
                          {playingSoundId === selectedWhiteSound ? <Square size={13} color="#ef4444" /> : <Play size={13} color="#ffffff" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Red Card Sound */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                      kırmızı kart (sabotaj) sesi:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={selectedRedSound}
                        onChange={(e) => setSelectedRedSound(e.target.value)}
                        className="select-box"
                        style={{ padding: '8px 10px', fontSize: '0.80rem', borderRadius: '8px' }}
                      >
                        <option value="">(varsayılan sistem sesi)</option>
                        {redOptions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedRedSound && (
                        <button
                          type="button"
                          onClick={() => handleTestPlay(selectedRedSound)}
                          className="btn-icon"
                          style={{ width: '32px', height: '32px', flexShrink: 0 }}
                          title="dinle"
                        >
                          {playingSoundId === selectedRedSound ? <Square size={13} color="#ef4444" /> : <Play size={13} color="#ffffff" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Game Win Sound */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                      kazanma sesi:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        value={selectedWinSound}
                        onChange={(e) => setSelectedWinSound(e.target.value)}
                        className="select-box"
                        style={{ padding: '8px 10px', fontSize: '0.80rem', borderRadius: '8px' }}
                      >
                        <option value="">(varsayılan sistem sesi)</option>
                        {winOptions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {selectedWinSound && (
                        <button
                          type="button"
                          onClick={() => handleTestPlay(selectedWinSound)}
                          className="btn-icon"
                          style={{ width: '32px', height: '32px', flexShrink: 0 }}
                          title="dinle"
                        >
                          {playingSoundId === selectedWinSound ? <Square size={13} color="#ef4444" /> : <Play size={13} color="#ffffff" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Locked VIP / Premium Overlay if Not Eligible */}
                {!isVipOrPremium && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(3px)',
                    borderRadius: '14px',
                    border: '1px dashed rgba(245, 158, 11, 0.45)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    textAlign: 'center',
                    gap: '6px',
                    zIndex: 10
                  }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.18)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Crown size={20} color="#fbbf24" />
                    </div>
                    <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.86rem' }}>
                      özel sesler vip ve premium ayrıcalığıdır
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.74rem', maxWidth: '340px' }}>
                      oyundaki kart ve kazanma ses efektlerinizi özelleştirebilmek için VIP veya Premium role sahip olmanız gerekmektedir.
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Theme Display Indicator */}
              <div style={{
                background: '#202020',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'radial-gradient(circle, #ff0000 0%, #1c1c1c 90%)',
                    border: '1px solid rgba(255, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Palette size={18} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                      tema görünümü
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      karanlık kırmızı (doxcards koyu teması)
                    </div>
                  </div>
                </div>

                <span style={{
                  background: 'rgba(255, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 0, 0, 0.35)',
                  color: '#fca5a5',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  aktif tema
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
