import React, { useState, useEffect } from 'react';
import { Users, Crown, Copy, Check, Play, Settings2, ShieldCheck, Share2, UserX, Plus, Layers, Lock, Hourglass, Sparkles } from 'lucide-react';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';
import { ADMIN_DISCORD_ID } from './AdminPageView';
import { getDiscordUser } from '../services/discordAuth';
import { getLocalUserProfile, fetchAppConfig, DEFAULT_CONFIG } from '../services/userService';
import { DEFAULT_RAW_CARDS } from '../data/cardsData';

const MAX_SLOTS = 6;

export default function LobbyView({
  room,
  player,
  onStartGame,
  onToggleReady,
  onUpdateSettings,
  onKickPlayer,
  onAddBot,
  onRemoveBot,
  isLoading
}) {
  const [copied, setCopied] = useState(false);
  const [isReadyHovered, setIsReadyHovered] = useState(false);
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);
  const [hoveredLockedDeck, setHoveredLockedDeck] = useState(null);

  const players = room.players || [];
  const isHost = room.hostId === player.id;
  const discordUser = getDiscordUser();
  const userProfile = getLocalUserProfile();

  useEffect(() => {
    fetchAppConfig().then(cfg => {
      if (cfg) setAppConfig(cfg);
    });
  }, []);

  const liveDeckKeys = Array.from(new Set([
    ...Object.keys(DEFAULT_RAW_CARDS?.Perks || {}),
    ...Object.keys(DEFAULT_RAW_CARDS?.['Red Flags'] || {})
  ]));
  const allDecksList = Array.from(new Set([
    ...(appConfig.allDecks || DEFAULT_CONFIG.allDecks),
    ...liveDeckKeys
  ]));

  const isMainAdmin = discordUser?.id === ADMIN_DISCORD_ID;
  const availableDecksForHost = isMainAdmin
    ? allDecksList
    : (discordUser ? (userProfile?.unlockedDecks || appConfig.discordDecks || DEFAULT_CONFIG.discordDecks) : (appConfig.guestDecks || DEFAULT_CONFIG.guestDecks));

  const selectedDecks = room.settings?.selectedDecks || ['Ana Deste'];

  const nonHostPlayers = players.filter(p => p.id !== room.hostId);
  const allNonHostsReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
  const canStart = isHost && players.length >= 2 && allNonHostsReady;
  const canChangeDecks = isHost && (nonHostPlayers.length === 0 || allNonHostsReady);

  const handleToggleDeck = (deckName) => {
    if (!isHost) return;
    sounds.playClick();
    let updated;
    if (selectedDecks.includes(deckName)) {
      if (selectedDecks.length === 1) {
        alert('En az bir deste seçili olmalıdır!');
        return;
      }
      updated = selectedDecks.filter(d => d !== deckName);
    } else {
      updated = [...selectedDecks, deckName];
    }
    onUpdateSettings({ selectedDecks: updated });
  };

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
              const isBot = slotPlayer.isBot;
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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {isBot && (
                          <span style={{
                            background: 'rgba(234, 179, 8, 0.15)',
                            border: '1px solid rgba(234, 179, 8, 0.45)',
                            color: '#fde047',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            height: '22px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxSizing: 'border-box'
                          }}>
                            bot
                          </span>
                        )}

                        {/* Render all custom & predefined tags */}
                        {Array.isArray(slotPlayer.tags) && slotPlayer.tags.map(t => {
                          if (t === 'admin') {
                            return (
                              <span key={t} className="badge-admin" style={{ height: '22px', padding: '0 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <ShieldCheck size={11} /> admin
                              </span>
                            );
                          }
                          if (t === 'VIP') {
                            return (
                              <span key={t} className="badge-vip" style={{ height: '22px', padding: '0 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Crown size={11} /> VIP
                              </span>
                            );
                          }
                          if (t === 'Premium') {
                            return (
                              <span key={t} className="badge-premium" style={{ height: '22px', padding: '0 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={11} /> Premium
                              </span>
                            );
                          }
                          return (
                            <span key={t} style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#e2e8f0',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              height: '22px',
                              padding: '0 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {t}
                            </span>
                          );
                        })}

                        {/* Admin fallback badge if ID matches and tag not already mapped */}
                        {!slotPlayer.tags?.includes('admin') && (slotPlayer.discordId === ADMIN_DISCORD_ID || slotPlayer.id === ADMIN_DISCORD_ID || (isMe && discordUser?.id === ADMIN_DISCORD_ID)) && !isBot && (
                          <span className="badge-admin" style={{ height: '22px', padding: '0 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={11} /> admin
                          </span>
                        )}

                        {slotPlayer.isHost ? (
                          <span style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#fbbf24',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            height: '22px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxSizing: 'border-box'
                          }}>
                            <Crown size={11} /> oda kurucusu
                          </span>
                        ) : !isBot ? (
                          <span style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            height: '22px',
                            padding: '0 8px',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            boxSizing: 'border-box'
                          }}>
                            çöpçatan
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {slotPlayer.isReady ? (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        height: '26px',
                        padding: '0 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxSizing: 'border-box'
                      }}>
                        <ShieldCheck size={12} /> hazır
                      </span>
                    ) : (
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#64748b',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        height: '26px',
                        padding: '0 10px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        boxSizing: 'border-box'
                      }}>
                        bekleniyor
                      </span>
                    )}

                    {/* Kick / Remove Bot Button (Host only) */}
                    {isHost && !isMe && (
                      <button
                        onClick={() => {
                          if (isBot && onRemoveBot) {
                            sounds.playClick();
                            onRemoveBot(slotPlayer.id);
                          } else {
                            handleKick(slotPlayer.id, slotPlayer.name);
                          }
                        }}
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
                        title={isBot ? 'botu kaldır' : `${slotPlayer.name} adlı oyuncuyu at`}
                      >
                        <UserX size={12} /> {isBot ? 'kaldır' : 'at'}
                      </button>
                    )}
                  </div>
                </div>
              );
            } else {
              const canAddBotToSlot = isHost && (isMainAdmin || userProfile?.tags?.includes('admin')) && onAddBot;
              return (
                <div
                  key={index}
                  className="player-slot-card empty"
                  onClick={canAddBotToSlot ? () => { sounds.playClick(); onAddBot(); } : undefined}
                  style={canAddBotToSlot ? { cursor: 'pointer', borderStyle: 'dashed', borderColor: 'rgba(234, 179, 8, 0.35)' } : {}}
                  title={canAddBotToSlot ? 'tıkla ve bot ekle' : ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} opacity={0.35} />
                    <span>#{index + 1} boş yuva</span>
                    {canAddBotToSlot && (
                      <span style={{ fontSize: '0.75rem', color: '#fde047', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                        <Plus size={13} /> bot ekle
                      </span>
                    )}
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
            <label className="form-label">tur limiti</label>
            <select
              value={room.settings?.roundLimit || (room.settings?.targetScore ? (room.settings.targetScore <= 3 ? 6 : room.settings.targetScore <= 5 ? 12 : 18) : 6)}
              onChange={(e) => isHost && onUpdateSettings({ roundLimit: Number(e.target.value), targetScore: Number(e.target.value) })}
              disabled={!isHost}
              className="select-box"
            >
              <option value={6}>6 tur (hızlı)</option>
              <option value={12}>12 tur (standart)</option>
              <option value={18}>18 tur (uzun)</option>
            </select>
          </div>

          {/* Clickable Deck Selector by Room Host */}
          <div style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={13} color="#ef4444" /> oyun desteleri {
                  isHost
                    ? (!canChangeDecks ? '(deste seçimi için tüm oyuncular hazır olmalı)' : '(ekle/çıkar)')
                    : ''
                }
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {selectedDecks.length} aktif deste
              </span>
            </label>

            <div className="deck-tags-container">
              {allDecksList.map(deckName => {
                const isSelected = selectedDecks.includes(deckName);
                const isUnlocked = isHost ? availableDecksForHost.includes(deckName) : true;
                const meta = appConfig.deckMetadata?.[deckName] || { isSecret: false, lockDescription: '' };

                // 1. If secret and not selected / not accessible, hide completely
                if (meta.isSecret && !isSelected && (isHost ? !availableDecksForHost.includes(deckName) : true)) {
                  return null;
                }

                // 2. If host and deck is not unlocked: render as locked (silik) with hover tooltip
                if (isHost && !isUnlocked) {
                  return (
                    <div
                      key={deckName}
                      className="deck-tooltip-wrapper"
                      onMouseEnter={() => setHoveredLockedDeck(deckName)}
                      onMouseLeave={() => setHoveredLockedDeck(null)}
                    >
                      <button
                        type="button"
                        disabled
                        className="deck-tag-btn locked"
                      >
                        <Lock size={12} /> {deckName}
                      </button>

                      {hoveredLockedDeck === deckName && (
                        <div className="deck-tooltip-box">
                          {meta.lockDescription || 'Bu deste kilitlidir.'}
                        </div>
                      )}
                    </div>
                  );
                }

                // 3. If non-host player: display exact mirror of host (active if selected, silik if not selected)
                if (!isHost) {
                  return (
                    <div
                      key={deckName}
                      className="deck-tooltip-wrapper"
                      onMouseEnter={() => meta.lockDescription ? setHoveredLockedDeck(deckName) : null}
                      onMouseLeave={() => setHoveredLockedDeck(null)}
                    >
                      <button
                        type="button"
                        disabled
                        className={`deck-tag-btn readonly ${isSelected ? 'active' : ''}`}
                        title={`${deckName} (${isSelected ? 'oda kurucusu tarafından seçildi' : 'seçilmedi'})`}
                      >
                        {isSelected ? <Check size={13} /> : <Plus size={13} />}
                        {deckName}
                      </button>

                      {!isSelected && hoveredLockedDeck === deckName && meta.lockDescription && (
                        <div className="deck-tooltip-box">
                          {meta.lockDescription}
                        </div>
                      )}
                    </div>
                  );
                }

                // 4. Host player: interactive toggleable pill (only if canChangeDecks)
                return (
                  <button
                    key={deckName}
                    type="button"
                    disabled={!canChangeDecks}
                    onClick={() => canChangeDecks && handleToggleDeck(deckName)}
                    className={`deck-tag-btn ${isSelected ? 'active' : ''} ${!canChangeDecks ? 'disabled' : ''}`}
                    title={!canChangeDecks ? 'Deste seçimi için tüm oyuncuların hazır olması gerekir' : `${deckName} destesini aç/kapat`}
                  >
                    {isSelected ? <Check size={13} /> : <Plus size={13} />}
                    {deckName}
                  </button>
                );
              })}
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
              onMouseEnter={() => setIsReadyHovered(true)}
              onMouseLeave={() => setIsReadyHovered(false)}
              style={{
                padding: '12px 28px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: !player.isReady
                  ? (isReadyHovered ? '#ff2222' : '#FF0000')
                  : (isReadyHovered ? 'rgba(255, 0, 0, 0.25)' : '#262626'),
                color: !player.isReady
                  ? '#ffffff'
                  : (isReadyHovered ? '#ff6666' : '#a3a3a3'),
                border: !player.isReady
                  ? '1px solid #ff3333'
                  : (isReadyHovered ? '1px solid #FF0000' : '1px solid rgba(255, 255, 255, 0.15)'),
                boxShadow: !player.isReady ? '0 4px 18px rgba(255, 0, 0, 0.5)' : 'none'
              }}
            >
              {!player.isReady ? 'hazırım' : 'hazır değilim'}
            </button>
          )}

          {isHost && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button
                onClick={() => {
                  if (!canStart) return;
                  sounds.playClick();
                  onStartGame();
                }}
                disabled={!canStart || isLoading}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  opacity: canStart ? 1 : 0.45,
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  boxShadow: canStart ? '0 4px 18px rgba(217, 4, 41, 0.5)' : 'none'
                }}
                title={
                  players.length < 2
                    ? 'En az 2 oyuncu gereklidir'
                    : (!allNonHostsReady ? 'Tüm oyuncuların hazır olması gerekiyor' : 'Oyunu Başlat')
                }
              >
                <Play size={15} fill="#fff" />
                {players.length < 2
                  ? 'en az 2 oyuncu gerekli'
                  : (!allNonHostsReady ? 'oyuncular bekleniyor' : 'oyunu başlat')}
              </button>

              {!allNonHostsReady && players.length >= 2 && (
                <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Hourglass size={12} /> tüm oyuncuların hazır olması bekleniyor
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
