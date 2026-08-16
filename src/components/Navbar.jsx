import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, LogOut, ShieldCheck, Crown, Sparkles, Star, User, ChevronDown } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import defaultAvatarImg from '../assets/default_avatar.png';

export default function Navbar({
  roomCode,
  isGameActive,
  onLeave,
  onOpenHelp,
  soundMuted,
  onToggleSound,
  userProfile,
  onLogout
}) {
  const [copied, setCopied] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 100
    }}>
      {/* Discord Profile Pill (if logged in) */}
      {userProfile && (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => {
              sounds.playClick();
              setProfileMenuOpen(prev => !prev);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '9999px',
              padding: '4px 12px 4px 5px',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <img
              src={userProfile.avatar || defaultAvatarImg}
              alt={userProfile.displayName || userProfile.username}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid rgba(255, 255, 255, 0.3)'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'lowercase' }}>
                  {userProfile.displayName || userProfile.username}
                </span>

                {userProfile.tags?.includes('admin') && (
                  <span className="badge-admin" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                    <ShieldCheck size={9} /> admin
                  </span>
                )}
                {userProfile.tags?.includes('VIP') && (
                  <span className="badge-vip" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                    <Crown size={9} /> VIP
                  </span>
                )}
                {userProfile.tags?.includes('Premium') && (
                  <span className="badge-premium" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>
                    <Sparkles size={9} /> Premium
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <Star size={10} fill="#fbbf24" color="#fbbf24" /> {userProfile.totalScore || 0} p
                </span>
              </div>
            </div>

            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '260px',
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={userProfile.avatar || defaultAvatarImg}
                  alt={userProfile.displayName}
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', textTransform: 'lowercase' }}>
                    {userProfile.displayName || userProfile.username}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    discord id: {userProfile.id}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#242424',
                padding: '10px 12px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>toplam kazanılan puan:</span>
                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fbbf24' }}>
                  ⭐ {userProfile.totalScore || 0} p
                </span>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                  açık destelerin ({userProfile.unlockedDecks?.length || 0}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(userProfile.unlockedDecks || ['Ana Deste']).map(deck => (
                    <span key={deck} style={{
                      background: 'rgba(217, 4, 41, 0.15)',
                      border: '1px solid rgba(217, 4, 41, 0.3)',
                      color: '#f87171',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '9999px'
                    }}>
                      {deck}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  width: '100%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '10px',
                  padding: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                <LogOut size={14} /> çıkış yap
              </button>
            </div>
          )}
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
  );
}
