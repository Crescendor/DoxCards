import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, LogOut, ShieldCheck, Crown, Sparkles, Star, User, ChevronDown, Music, Lightbulb, Link2, Coins } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import defaultAvatarImg from '../assets/default_avatar.png';
import ProfileModal from './ProfileModal';
import TagBadge from './TagBadge';
import { fetchAppConfig, DEFAULT_CONFIG } from '../services/userService';

export default function Navbar({
  roomCode,
  isGameActive,
  onLeave,
  onOpenHelp,
  soundMuted,
  onToggleSound,
  userProfile,
  onUpdateProfile,
  onLogout
}) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    fetchAppConfig().then(cfg => {
      if (cfg) setAppConfig(cfg);
    });
  }, []);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const shareUrl = `${window.location.origin}/?room=${roomCode.toLowerCase()}`;
    navigator.clipboard.writeText(shareUrl);
    sounds.playClick();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '16px',
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 100
      }}>
        {/* Discord Profile Pill (Opens Profile Modal) */}
        {userProfile && (
          <div>
            <button
              onClick={() => {
                sounds.playClick();
                setProfileModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#1c1c1c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '9999px',
                height: '38px',
                padding: '0 12px 0 5px',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
                verticalAlign: 'middle',
                boxSizing: 'border-box'
              }}
            >
              <img
                src={userProfile.avatar || defaultAvatarImg}
                alt={userProfile.displayName || userProfile.username}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                  flexShrink: 0
                }}
              />

              <span style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                textTransform: 'lowercase',
                color: '#ffffff',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                {userProfile.displayName || userProfile.username}
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                height: '22px',
                padding: '0 8px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                lineHeight: 1,
                boxSizing: 'border-box'
              }}>
                <Coins size={11} color="#fbbf24" />
                {(userProfile.coins || 0).toLocaleString('tr-TR')}
              </span>

              {(userProfile.tags || []).map(t => (
                <TagBadge key={t} tag={t} size="sm" customTags={appConfig?.customTags} />
              ))}
            </button>
          </div>
        )}

        {/* Room Code Badge (only when inside a room) */}
        {roomCode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isGameActive ? 'rgba(239, 68, 68, 0.25)' : '#ffffff',
            border: isGameActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #000000',
            padding: '6px 14px',
            borderRadius: '9999px',
            boxShadow: isGameActive ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.06)'
          }}>
            <span style={{ fontSize: '0.8rem', color: isGameActive ? '#fca5a5' : '#000000', fontWeight: 800 }}>
              oda:
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: '1.05rem',
              color: isGameActive ? '#ffffff' : '#ef4444',
              letterSpacing: '0.08em'
            }}>
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="oda kodunu kopyala"
              style={{
                background: 'transparent',
                color: copied ? '#10b981' : isGameActive ? '#fff' : '#000000',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleCopyLink}
              title="oda davet linkini kopyala"
              style={{
                background: 'transparent',
                color: copiedLink ? '#10b981' : isGameActive ? '#fff' : '#000000',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                cursor: 'pointer'
              }}
            >
              {copiedLink ? <Check size={16} /> : <Link2 size={16} />}
            </button>
          </div>
        )}

        {/* Sound Mute Toggle */}
        <button
          onClick={onToggleSound}
          className="btn-icon"
          title={soundMuted ? "sesi aç" : "sesi kapat"}
          style={{
            background: isGameActive ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
            border: isGameActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #000000',
            color: isGameActive ? '#ffffff' : '#000000',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}
        >
          {soundMuted ? <VolumeX size={18} color={isGameActive ? "#fca5a5" : "#94a3b8"} /> : <Volume2 size={18} color="#ef4444" />}
        </button>

        {/* How To Play */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenHelp();
          }}
          className="btn-icon"
          title="nasıl oynanır?"
          style={{
            background: isGameActive ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
            border: isGameActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #000000',
            color: isGameActive ? '#ffffff' : '#000000',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}
        >
          <HelpCircle size={18} />
        </button>

        {/* Leave Room (if inside room) */}
        {roomCode && (
          <button
            onClick={() => {
              sounds.playClick();
              if (window.confirm('odadan ayrılmak istediğinize emin misiniz?')) {
                onLeave();
              }
            }}
            className="btn-icon"
            title="odadan ayrıl"
            style={{
              background: isGameActive ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
              border: isGameActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1.5px solid #ef4444',
              color: '#ef4444',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
        onLogout={onLogout}
      />
    </>
  );
}
