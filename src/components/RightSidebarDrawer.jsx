import React, { useState } from 'react';
import { Copy, Check, Crown, UserX, ChevronLeft, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';
import { ADMIN_DISCORD_ID } from './AdminPageView';
import { getDiscordUser } from '../services/discordAuth';

export default function RightSidebarDrawer({
  room,
  player,
  isHost,
  scores = {},
  singlePlayerId,
  onKickPlayer,
  onStopGame,
  onLeaveRoom
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const discordUser = getDiscordUser();

  const roomCode = room?.code || '';
  const players = room?.players || [];

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = (targetId, targetName) => {
    if (window.confirm(`${targetName} adlı oyuncuyu odadan atmak istediğinize emin misiniz?`)) {
      sounds.playClick();
      onKickPlayer(targetId);
    }
  };

  return (
    <>
      {/* Right Edge Red Vertical Bar Handle */}
      <div
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '16px',
          background: '#FF0000',
          cursor: 'pointer',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '-4px 0 15px rgba(255, 0, 0, 0.5)',
          transition: 'background 0.2s ease, width 0.2s ease'
        }}
        title="Oda Menüsünü Aç"
      >
        <ChevronLeft size={16} color="#ffffff" style={{ marginLeft: '-2px' }} />
      </div>

      {/* Slide-out Red Sidebar Panel */}
      <div
        onMouseLeave={() => setIsOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '320px',
          maxWidth: '85vw',
          background: '#c1121f',
          color: '#ffffff',
          zIndex: 950,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 20px',
          letterSpacing: '-0.015em'
        }}
      >
        {/* Top Header: Player info & Close */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={player.avatar || defaultAvatarImg}
              alt="avatar"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                background: '#000'
              }}
            />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', textTransform: 'lowercase' }}>
              {player.name}
            </span>
          </div>

          <span style={{
            background: 'rgba(0, 0, 0, 0.25)',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '9999px',
            textTransform: 'lowercase'
          }}>
            türkçe
          </span>
        </div>

        {/* Room Code Share Section */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <p style={{
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.85)',
            marginBottom: '10px',
            fontWeight: 500,
            lineHeight: 1.3
          }}>
            bu kodu arkadaşlarına vererek odaya katılmalarını sağla!
          </p>

          <div
            onClick={handleCopyCode}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: 'rgba(0, 0, 0, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              userSelect: 'none'
            }}
            title="Kodu Kopyala"
          >
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.65rem',
              fontWeight: 900,
              letterSpacing: '0.22em'
            }}>
              {roomCode}
            </span>
            {copied ? <Check size={20} color="#22c55e" /> : <Copy size={20} />}
          </div>

          {copied && (
            <div style={{ fontSize: '0.72rem', color: '#86efac', marginTop: '4px', fontWeight: 700 }}>
              kopyalandı!
            </div>
          )}
        </div>

        {/* Players List Section */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '8px',
            textTransform: 'lowercase',
            letterSpacing: '0.02em'
          }}>
            oyuncular ({players.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {players.map((p) => {
              const isMe = p.id === player.id;
              const isSingle = p.id === singlePlayerId;
              const pScore = scores[p.id] || 0;

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: isMe ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.18)',
                    border: isMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={p.avatar || defaultAvatarImg}
                      alt={p.name}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        background: '#000'
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', textTransform: 'lowercase' }}>
                      {p.name} {isMe ? '(sen)' : ''}
                    </span>
                    {(p.discordId === ADMIN_DISCORD_ID || p.id === ADMIN_DISCORD_ID || (isMe && discordUser?.id === ADMIN_DISCORD_ID)) && (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#f87171',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <ShieldCheck size={9} /> admin
                      </span>
                    )}
                    {p.isHost && <Crown size={14} color="#fbbf24" title="Oda Kurucusu" />}
                    {isSingle && !p.isHost && <Crown size={13} color="#f59e0b" title="Bekâr" />}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: '#ffffff',
                      color: '#c1121f',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      padding: '1px 8px',
                      borderRadius: '9999px'
                    }}>
                      {pScore}p
                    </span>

                    {/* Kick Button (Host only, cannot kick self) */}
                    {isHost && !isMe && (
                      <button
                        onClick={() => handleKick(p.id, p.name)}
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s ease'
                        }}
                        title={`${p.name} adlı oyuncuyu oyundan at`}
                      >
                        <UserX size={15} color="#fca5a5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isHost && (
            <button
              onClick={() => {
                if (window.confirm('Oyunu durdurup lobiye dönmek istediğinize emin misiniz?')) {
                  sounds.playClick();
                  onStopGame();
                }
              }}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#c1121f',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textTransform: 'lowercase',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.15s ease'
              }}
            >
              <RotateCcw size={16} /> oyunu durdur (lobi)
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Odadan ayrılmak istediğinize emin misiniz?')) {
                sounds.playClick();
                onLeaveRoom();
              }
            }}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'lowercase',
              transition: 'background 0.2s ease'
            }}
          >
            <LogOut size={16} /> odadan ayrıl
          </button>
        </div>
      </div>
    </>
  );
}
