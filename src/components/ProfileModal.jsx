import React, { useState } from 'react';
import { X, ShieldCheck, Crown, Sparkles, Coins, Trophy, Gamepad2, Volume2, VolumeX, LogOut, User } from 'lucide-react';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onLogout
}) {
  const [customMuted, setCustomMuted] = useState(sounds.customMuted);

  if (!isOpen || !userProfile) return null;

  const handleToggleCustomSounds = () => {
    sounds.playClick();
    const newMuted = sounds.toggleCustomMute();
    setCustomMuted(newMuted);
  };

  const isAdmin = userProfile.tags?.includes('admin') || userProfile.id === '269639754675519489';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          background: '#181818',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', textTransform: 'lowercase' }}>
              oyuncu profili
            </h3>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Card Top Row */}
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
              border: '2.5px solid #f59e0b',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', flex: 1 }}>
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

        {/* Roles and Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>
            roller ve etiketler:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {isAdmin && (
              <span className="badge-admin">
                <ShieldCheck size={11} /> admin
              </span>
            )}
            {userProfile.tags?.includes('VIP') && (
              <span className="badge-vip">
                <Crown size={11} /> VIP
              </span>
            )}
            {userProfile.tags?.includes('Premium') && (
              <span className="badge-premium">
                <Sparkles size={11} /> Premium
              </span>
            )}
            {(userProfile.tags || []).filter(t => !['admin', 'VIP', 'Premium'].includes(t)).map(t => (
              <span key={t} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e2e8f0',
                padding: '0 8px',
                height: '22px',
                fontSize: '0.70rem',
                fontWeight: 700,
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {t}
              </span>
            ))}
            {!isAdmin && (!userProfile.tags || userProfile.tags.length === 0) && (
              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                özel bir rol veya etiket bulunmuyor.
              </span>
            )}
          </div>
        </div>

        {/* 2-Metric Stats Grid (NO COIN) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#222222',
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
            background: '#222222',
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

        {/* Custom Sound Settings Toggle Box */}
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
              justifyContent: 'center'
            }}>
              {customMuted ? <VolumeX size={18} color="#f87171" /> : <Volume2 size={18} color="#34d399" />}
            </div>
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                özel oyuncu sesleri
              </div>
              <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
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
              transition: 'background 0.2s'
            }}
          >
            {customMuted ? 'susturuldu' : 'açık'}
          </button>
        </div>

        {/* Footer: Logout */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
            if (onLogout) onLogout();
          }}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            color: '#f87171',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 700
          }}
        >
          <LogOut size={16} /> discord hesabından çıkış yap
        </button>
      </div>
    </div>
  );
}
