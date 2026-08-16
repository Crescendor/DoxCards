import React, { useState } from 'react';
import { Users, Crown, Copy, Check, Play, Settings2, ShieldCheck, Share2, UserX } from 'lucide-react';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';

const MAX_SLOTS = 6;

export default function LobbyView({
  room,
  player,
  onStartGame,
  onToggleReady,
  onUpdateSettings,
  onKickPlayer,
  isLoading
}) {
  const [copied, setCopied] = useState(false);
  const [isReadyHovered, setIsReadyHovered] = useState(false);
  const isHost = room.hostId === player.id;
  const players = room.players || [];

  const handleCopyLink = () => {
    sounds.playClick();
    const url = `${window.location.origin}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = (targetId, targetName) => {
    if (window.confirm(`${targetName} adlı oyuncuyu lobiden atmak istediğinize emin misiniz?`)) {
      sounds.playClick();
      onKickPlayer(targetId);
    }
  };

  const slots = Array.from({ length: MAX_SLOTS }, (_, index) => {
    return players[index] || null;
  });

  return (
    <div className="lobby-wrapper animate-pop" style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
      <div className="lobby-main-card" style={{ width: '100%' }}>
        {/* Lobby Top Header */}
        <div className="lobby-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>oyun lobisi</h1>
              <span style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {players.length}/{MAX_SLOTS} oyuncu
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              oyunun başlaması için en az 2 oyuncu gereklidir.
            </p>
          </div>

          {/* Room Code Badge */}
          <div className="room-code-badge-card">
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                oda kodu
              </div>
              <div className="room-code-display">{room.code}</div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleCopyCode}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                title="kodu kopyala"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'kopyalandı' : 'kodu kopyala'}
              </button>

              <button
                onClick={handleCopyLink}
                className="btn-primary"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
                title="davet linkini kopyala"
              >
                <Share2 size={14} /> davet linki
              </button>
            </div>
          </div>
        </div>

        {/* 6 Players Slots Grid */}
        <div className="players-grid">
          {slots.map((slotPlayer, index) => {
            if (slotPlayer) {
              const isMe = slotPlayer.id === player.id;
              return (
                <div
                  key={slotPlayer.id}
                  className={`player-slot-card ${isMe ? 'is-me' : ''}`}
                >
                  <div className="player-info-wrap">
                    <img
                      src={slotPlayer.avatar || defaultAvatarImg}
                      alt={slotPlayer.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                        background: '#000'
                      }}
                    />
                    <div>
                      <div className="player-name-text">
                        {slotPlayer.name} {isMe && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>(sen)</span>}
                      </div>

                      {slotPlayer.isHost ? (
                        <span className="badge-host">
                          <Crown size={11} /> oda kurucusu
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          çöpçatan
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {slotPlayer.isReady ? (
                      <span className="badge-ready">
                        <ShieldCheck size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        hazır
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        bekleniyor
                      </span>
                    )}

                    {/* Kick Button (Host only, cannot kick self) */}
                    {isHost && !isMe && (
                      <button
                        onClick={() => handleKick(slotPlayer.id, slotPlayer.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          cursor: 'pointer',
                          padding: '5px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}
                        title={`${slotPlayer.name} adlı oyuncuyu at`}
                      >
                        <UserX size={12} /> at
                      </button>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={index} className="player-slot-card empty">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} opacity={0.35} />
                    <span>#{index + 1} boş yuva</span>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Room Settings */}
        <div className="settings-panel">
          <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Settings2 size={15} color="#ef4444" /> oda ayarları
          </h3>

          <div>
            <label className="form-label">hedef puan</label>
            <select
              value={room.settings?.targetScore || 3}
              onChange={(e) => isHost && onUpdateSettings({ targetScore: Number(e.target.value) })}
              disabled={!isHost}
              className="select-box"
            >
              <option value={3}>3 puan (hızlı)</option>
              <option value={5}>5 puan (standart)</option>
              <option value={7}>7 puan (uzun)</option>
            </select>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="lobby-footer">
          {!isHost && (
            <button
              onClick={() => {
                sounds.playClick();
                onToggleReady();
              }}
              onMouseEnter={() => setIsReadyHovered(true)}
              onMouseLeave={() => setIsReadyHovered(false)}
              style={{
                padding: '12px 26px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: player.isReady
                  ? (isReadyHovered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                  : (isReadyHovered ? '#d90429' : '#262626'),
                color: player.isReady
                  ? (isReadyHovered ? '#f87171' : '#34d399')
                  : (isReadyHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'),
                border: player.isReady
                  ? (isReadyHovered ? '1px solid #ef4444' : '1px solid #10b981')
                  : (isReadyHovered ? '1px solid #ef233c' : '1px solid rgba(255, 255, 255, 0.12)'),
                boxShadow: (!player.isReady && isReadyHovered) ? '0 4px 16px rgba(217, 4, 41, 0.4)' : 'none'
              }}
            >
              {player.isReady
                ? (isReadyHovered ? 'hazır değilim' : 'hazır')
                : (isReadyHovered ? 'hazırım' : 'hazır değil')}
            </button>
          )}

          {isHost && (
            <button
              onClick={() => {
                sounds.playClick();
                onStartGame();
              }}
              disabled={players.length < 2 || isLoading}
              className="btn-primary"
              style={{ padding: '12px 28px' }}
            >
              <Play size={15} fill="#fff" />
              {players.length < 2 ? 'en az 2 oyuncu gerekli' : 'oyunu başlat'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
