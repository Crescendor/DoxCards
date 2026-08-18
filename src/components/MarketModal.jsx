import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  Layers,
  Volume2,
  Sparkles,
  Coins,
  Check,
  Play,
  Square,
  ShieldCheck,
  X,
  Tag,
  ArrowRight,
  Info,
  Sliders,
  Flame
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { buyMarketItem, equipTheme, getUserUnlockedThemes, getUserUnlockedSounds } from '../services/userService';

export default function MarketModal({
  isOpen,
  onClose,
  discordUser,
  userProfile,
  appConfig,
  onUserUpdated
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'themes' | 'sounds'
  const [buyingId, setBuyingId] = useState(null);
  const [equippingId, setEquippingId] = useState(null);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  if (!isOpen) return null;

  const currentCoins = userProfile?.coins || 0;
  const themesList = appConfig?.market?.themes || [];
  const soundsList = Array.isArray(appConfig?.customSounds)
    ? appConfig.customSounds
    : (Array.isArray(appConfig?.market?.sounds) ? appConfig.market.sounds : []);

  const ownedThemes = getUserUnlockedThemes(userProfile, appConfig?.customTags);
  const equippedTheme = userProfile?.equippedTheme || 'stocks';
  const ownedSounds = getUserUnlockedSounds(userProfile, appConfig?.customTags);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleBuy = async (itemType, item) => {
    if (!discordUser?.id) {
      alert('Marketten alışveriş yapabilmek için Discord ile giriş yapmalısınız.');
      return;
    }

    if (currentCoins < item.price) {
      showNotification('error', 'Yetersiz coin bakiyesi.');
      return;
    }

    sounds.playClick();
    setBuyingId(item.id);

    try {
      const res = await buyMarketItem(discordUser.id, {
        itemType,
        itemId: item.id,
        price: item.price
      });

      if (res?.success && res.user) {
        sounds.playWin();
        showNotification('success', `"${item.name}" başarıyla satın alındı!`);
        if (onUserUpdated) onUserUpdated(res.user);
      } else {
        showNotification('error', res?.error || 'Satın alma başarısız oldu.');
      }
    } catch (err) {
      showNotification('error', 'Satın alma sırasında bir hata oluştu.');
    } finally {
      setBuyingId(null);
    }
  };

  const handleEquip = async (themeId) => {
    if (!discordUser?.id) return;
    sounds.playClick();
    setEquippingId(themeId);

    try {
      const res = await equipTheme(discordUser.id, themeId);
      if (res?.success && res.user) {
        showNotification('success', 'Tema başarıyla aktif edildi!');
        if (onUserUpdated) onUserUpdated(res.user);
      } else {
        showNotification('error', res?.error || 'Tema aktif edilemedi.');
      }
    } catch (err) {
      showNotification('error', 'Tema aktif edilirken bir hata oluştu.');
    } finally {
      setEquippingId(null);
    }
  };

  const handlePlaySound = (sound) => {
    if (playingSoundId === sound.id) {
      setPlayingSoundId(null);
      return;
    }

    sounds.playClick();
    setPlayingSoundId(sound.id);
    sounds.playCustomAudio(sound);

    const duration = ((Number(sound.endSec) || 3) - (Number(sound.startSec) || 0)) * 1000;
    setTimeout(() => {
      setPlayingSoundId(null);
    }, Math.max(1200, duration));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '980px',
          maxWidth: '94vw',
          height: '82vh',
          maxHeight: '700px',
          minHeight: '540px',
          background: '#141414',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(239, 68, 68, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '18px 24px',
          background: '#1a1a1a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={20} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                doxcards market
              </h2>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                oyun içi puanlarınla temalar ve özel sesler satın al
              </span>
            </div>
          </div>

          {/* User Coins & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              padding: '6px 14px',
              borderRadius: '12px'
            }}>
              <Coins size={16} color="#fbbf24" />
              <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fbbf24' }}>
                {currentCoins.toLocaleString('tr-TR')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600 }}>coin</span>
            </div>

            <button
              onClick={onClose}
              className="btn-icon"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div style={{
            padding: '10px 20px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
            borderBottom: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: message.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0
          }}>
            {message.type === 'success' ? <Check size={16} /> : <Info size={16} />}
            {message.text}
          </div>
        )}

        {/* Main Body (Sidebar + Content) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
          {/* Left Navigation Sidebar */}
          <div style={{
            width: '210px',
            minWidth: '210px',
            flexShrink: 0,
            background: '#171717',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('all'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'all' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'all' ? '#ef4444' : '#94a3b8',
                fontWeight: activeTab === 'all' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Store size={16} />
              tüm ürünler
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('themes'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'themes' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'themes' ? '#ef4444' : '#94a3b8',
                fontWeight: activeTab === 'themes' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Layers size={16} />
              kart temaları
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {themesList.length}
              </span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('sounds'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'sounds' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === 'sounds' ? '#ef4444' : '#94a3b8',
                fontWeight: activeTab === 'sounds' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Volume2 size={16} />
              özel sesler
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.7rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 6px',
                borderRadius: '8px'
              }}>
                {soundsList.length}
              </span>
            </button>
          </div>

          {/* Right Product Grid */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* 1. Themes Section */}
            {(activeTab === 'all' || activeTab === 'themes') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Layers size={18} color="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    kart temaları
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {themesList.map(theme => {
                    const isOwned = ownedThemes.includes(theme.id) || theme.isDefault;
                    const isEquipped = equippedTheme === theme.id;
                    const canAfford = currentCoins >= theme.price;

                    return (
                      <div
                        key={theme.id}
                        style={{
                          background: '#1a1a1a',
                          border: isEquipped
                            ? '2px solid #10b981'
                            : (isOwned ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          boxShadow: isEquipped ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none',
                          position: 'relative'
                        }}
                      >
                        {/* Status Badge */}
                        {isEquipped && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid #10b981',
                            color: '#34d399',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check size={11} /> aktif tema
                          </div>
                        )}

                        {/* Theme Title & Info */}
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                            {theme.name}
                          </h4>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                            {theme.description}
                          </p>
                        </div>

                        {/* 4 Card Mini Previews */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          background: '#111111',
                          padding: '8px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.04)'
                        }}>
                          {/* 1. Red Back */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '100%',
                              aspectRatio: '0.68',
                              borderRadius: '6px',
                              backgroundImage: `url(${theme.images?.redBack || '/themes/stocks/1.png'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }} />
                            <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 700 }}>kırmızı arka</span>
                          </div>

                          {/* 2. White Back */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '100%',
                              aspectRatio: '0.68',
                              borderRadius: '6px',
                              backgroundImage: `url(${theme.images?.whiteBack || '/themes/stocks/2.png'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }} />
                            <span style={{ fontSize: '0.62rem', color: '#e2e8f0', fontWeight: 700 }}>beyaz arka</span>
                          </div>

                          {/* 3. Red Front */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '100%',
                              aspectRatio: '0.68',
                              borderRadius: '6px',
                              backgroundImage: `url(${theme.images?.redFront || '/themes/stocks/3.png'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px'
                            }}>
                              <span style={{ fontSize: '0.52rem', color: theme.fontColorRed || '#ffffff', fontWeight: 800, textAlign: 'center' }}>
                                red flag
                              </span>
                            </div>
                            <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 700 }}>kırmızı ön</span>
                          </div>

                          {/* 4. White Front */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{
                              width: '100%',
                              aspectRatio: '0.68',
                              borderRadius: '6px',
                              backgroundImage: `url(${theme.images?.whiteFront || '/themes/stocks/4.png'})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '3px'
                            }}>
                              <span style={{ fontSize: '0.52rem', color: theme.fontColorWhite || '#000000', fontWeight: 800, textAlign: 'center' }}>
                                perk
                              </span>
                            </div>
                            <span style={{ fontSize: '0.62rem', color: '#e2e8f0', fontWeight: 700 }}>beyaz ön</span>
                          </div>
                        </div>

                        {/* Price & Action Button */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 'auto',
                          paddingTop: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Coins size={15} color="#fbbf24" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: (Number(theme.price) || 0) === 0 ? '#34d399' : '#fbbf24' }}>
                              {(Number(theme.price) || 0) === 0 ? 'ücretsiz' : `${(Number(theme.price) || 0).toLocaleString('tr-TR')} coin`}
                            </span>
                          </div>

                          {isEquipped ? (
                            <button
                              disabled
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid #10b981',
                                color: '#34d399',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'default'
                              }}
                            >
                              <Check size={13} /> kullanılıyor
                            </button>
                          ) : isOwned ? (
                            <button
                              onClick={() => handleEquip(theme.id)}
                              disabled={equippingId === theme.id}
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid #38bdf8',
                                color: '#38bdf8',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {equippingId === theme.id ? 'aktif ediliyor...' : 'temayı aktif et'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuy('theme', theme)}
                              disabled={!canAfford || buyingId === theme.id}
                              style={{
                                background: canAfford ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.05)',
                                border: canAfford ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                color: canAfford ? '#ffffff' : '#64748b',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <ShoppingBag size={13} />
                              {buyingId === theme.id ? 'alınıyor...' : (canAfford ? 'satın al' : 'yetersiz coin')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Sounds Section */}
            {(activeTab === 'all' || activeTab === 'sounds') && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Volume2 size={18} color="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    özel sesler
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px'
                }}>
                  {soundsList.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.86rem' }}>
                      Henüz markete ses efekti eklenmedi.
                    </div>
                  ) : (
                    soundsList.map(sound => {
                    const isOwned = ownedSounds.includes(sound.id);
                    const canAfford = currentCoins >= sound.price;
                    const isPlaying = playingSoundId === sound.id;

                    return (
                      <div
                        key={sound.id}
                        style={{
                          background: '#1a1a1a',
                          border: isOwned ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {sound.coverImage ? (
                            <img
                              src={sound.coverImage}
                              alt={sound.name}
                              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                            />
                          ) : null}

                          <button
                            onClick={() => handlePlaySound(sound)}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isPlaying ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                              border: isPlaying ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: isPlaying ? '#ef4444' : '#e2e8f0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isPlaying ? <Square size={14} /> : <Play size={14} />}
                          </button>

                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                              {sound.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Coins size={12} color="#fbbf24" />
                              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                                {(Number(sound.price) || 0).toLocaleString('tr-TR')} coin
                              </span>
                            </div>
                          </div>
                        </div>

                        {isOwned ? (
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '5px 10px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Check size={12} /> sahipsin
                          </div>
                        ) : (
                          <button
                            onClick={() => handleBuy('sound', sound)}
                            disabled={!canAfford || buyingId === sound.id}
                            style={{
                              background: canAfford ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.05)',
                              border: canAfford ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: canAfford ? '#ffffff' : '#64748b',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <ShoppingBag size={12} />
                            {buyingId === sound.id ? '...' : (canAfford ? 'satın al' : 'yetersiz')}
                          </button>
                        )}
                      </div>
                    );
                  }))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
