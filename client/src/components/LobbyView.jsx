import React, { useState } from 'react';
import { Users, Crown, Copy, Check, Play, Settings2, ShieldCheck, Share2 } from 'lucide-react';
import LobbyChat from './LobbyChat';
import { sounds } from '../services/soundEffects';

const MAX_SLOTS = 6;

export default function LobbyView({
  room,
  player,
  onStartGame,
  onToggleReady,
  onUpdateSettings,
  messages,
  onSendMessage,
  onSendReaction,
  isLoading
}) {
  const [copied, setCopied] = useState(false);
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

  const slots = Array.from({ length: MAX_SLOTS }, (_, index) => {
    return players[index] || null;
  });

  return (
    <div className="lobby-wrapper animate-pop">
      <div className="lobby-layout-grid">
        {/* Left Column: Lobby & Players & Settings */}
        <div className="lobby-main-card">
          {/* Lobby Top Header */}
          <div className="lobby-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>oyun lobisi</h1>
                <span style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  {players.length}/{MAX_SLOTS} oyuncu
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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

                    <div>
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
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Settings2 size={15} color="#ef4444" /> oda ayarları
            </h3>

            <div className="settings-grid">
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

              <div>
                <label className="form-label">tur süresi</label>
                <select
                  value={room.settings?.roundTimerDuration ?? 45}
                  onChange={(e) => isHost && onUpdateSettings({ roundTimerDuration: Number(e.target.value) })}
                  disabled={!isHost}
                  className="select-box"
                >
                  <option value={30}>30 saniye</option>
                  <option value={45}>45 saniye</option>
                  <option value={60}>60 saniye</option>
                  <option value={0}>süresiz</option>
                </select>
              </div>
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
                className={player.isReady ? "btn-secondary" : "btn-primary"}
                style={{ padding: '11px 22px' }}
              >
                {player.isReady ? 'hazır değilim' : 'hazırım'}
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

        {/* Right Column: Always Open Real-Time Chat Screen */}
        <div className="lobby-chat-column">
          <LobbyChat
            messages={messages}
            onSendMessage={onSendMessage}
            onSendReaction={onSendReaction}
            player={player}
          />
        </div>
      </div>
    </div>
  );
}
