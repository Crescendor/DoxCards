import React, { useState, useEffect } from 'react';
import {
  Store,
  ArrowLeft,
  Coins,
  Layers,
  Volume2,
  Check,
  ShoppingBag,
  Play,
  Square,
  Sparkles,
  Info,
  Sliders,
  Flame,
  Tag
} from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { buyMarketItem, equipTheme, getUserUnlockedThemes, getUserUnlockedSounds, fetchAppConfig, DEFAULT_CONFIG } from '../services/userService';
import { getDiscordUser } from '../services/discordAuth';

export default function MarketPageView({
  onBack,
  userProfile,
  onUserUpdated
}) {
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'themes' | 'sounds'
  const [buyingId, setBuyingId] = useState(null);
  const [equippingId, setEquippingId] = useState(null);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const discordUser = getDiscordUser();

  useEffect(() => {
    fetchAppConfig().then(cfg => {
      if (cfg) setAppConfig(cfg);
    });
  }, []);

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
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Top Navbar */}
      <header style={{
        height: '64px',
        background: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Back Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowLeft size={16} />
          <span>ana menüye dön</span>
        </button>

        {/* Center: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(245, 158, 11, 0.25))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Store size={18} color="#ef4444" />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            doxcards market
          </span>
        </div>

        {/* Right: Coins Balance Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          padding: '7px 16px',
          borderRadius: '9999px'
        }}>
          <Coins size={16} color="#fbbf24" />
          <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#fbbf24' }}>
            {currentCoins.toLocaleString('tr-TR')}
          </span>
          <span style={{ fontSize: '0.74rem', color: '#fde68a', fontWeight: 700 }}>coin</span>
        </div>
      </header>

      {/* Notification Toast */}
      {message && (
        <div style={{
          padding: '12px 24px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          borderBottom: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '0.86rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          {message.type === 'success' ? <Check size={16} /> : <Info size={16} />}
          {message.text}
        </div>
      )}

      {/* Page Container */}
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        flex: 1
      }}>
        {/* Filter Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#161616',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('all'); }}
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'all' ? '#ef4444' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={15} />
            tüm ürünler
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('themes'); }}
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'themes' ? '#ef4444' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={15} />
            kart temaları ({themesList.length})
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('sounds'); }}
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'sounds' ? '#ef4444' : 'transparent',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Volume2 size={15} />
            özel ses efektleri ({soundsList.length})
          </button>
        </div>

        {/* 1. Themes Grid */}
        {(activeTab === 'all' || activeTab === 'themes') && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={20} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                kart temaları
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {themesList.map(theme => {
                const isOwned = ownedThemes.includes(theme.id) || theme.isDefault;
                const isEquipped = equippedTheme === theme.id;
                const canAfford = currentCoins >= theme.price;

                return (
                  <div
                    key={theme.id}
                    style={{
                      background: '#161616',
                      border: isEquipped
                        ? '2px solid #10b981'
                        : (isOwned ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
                      borderRadius: '18px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: isEquipped ? '0 0 24px rgba(16, 185, 129, 0.15)' : '0 6px 20px rgba(0,0,0,0.4)',
                      position: 'relative'
                    }}
                  >
                    {/* Status Badge */}
                    {isEquipped && (
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} /> aktif tema
                      </div>
                    )}

                    {/* Theme Title & Description */}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#ffffff' }}>
                        {theme.name}
                      </h4>
                      <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                        {theme.description}
                      </p>
                    </div>

                    {/* 4 Card Mini Previews */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      background: '#0d0d0d',
                      padding: '10px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      {/* 1. Red Back */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '100%',
                          aspectRatio: '0.68',
                          borderRadius: '8px',
                          backgroundImage: `url(${theme.images?.redBack || '/themes/stocks/1.png'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid rgba(239, 68, 68, 0.35)'
                        }} />
                        <span style={{ fontSize: '0.64rem', color: '#ef4444', fontWeight: 700 }}>kırmızı arka</span>
                      </div>

                      {/* 2. White Back */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '100%',
                          aspectRatio: '0.68',
                          borderRadius: '8px',
                          backgroundImage: `url(${theme.images?.whiteBack || '/themes/stocks/2.png'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.25)'
                        }} />
                        <span style={{ fontSize: '0.64rem', color: '#e2e8f0', fontWeight: 700 }}>beyaz arka</span>
                      </div>

                      {/* 3. Red Front */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '100%',
                          aspectRatio: '0.68',
                          borderRadius: '8px',
                          backgroundImage: `url(${theme.images?.redFront || '/themes/stocks/3.png'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid rgba(239, 68, 68, 0.35)'
                        }} />
                        <span style={{ fontSize: '0.64rem', color: '#ef4444', fontWeight: 700 }}>kırmızı ön</span>
                      </div>

                      {/* 4. White Front */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '100%',
                          aspectRatio: '0.68',
                          borderRadius: '8px',
                          backgroundImage: `url(${theme.images?.whiteFront || '/themes/stocks/4.png'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.25)'
                        }} />
                        <span style={{ fontSize: '0.64rem', color: '#e2e8f0', fontWeight: 700 }}>beyaz ön</span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Coins size={16} color="#fbbf24" />
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: (Number(theme.price) || 0) === 0 ? '#34d399' : '#fbbf24' }}>
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
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'default'
                          }}
                        >
                          <Check size={14} /> kullanılıyor
                        </button>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleEquip(theme.id)}
                          disabled={equippingId === theme.id}
                          style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8',
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
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
                            padding: '8px 16px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            boxShadow: canAfford ? '0 4px 14px rgba(239, 68, 68, 0.4)' : 'none'
                          }}
                        >
                          <ShoppingBag size={14} />
                          {buyingId === theme.id ? 'alınıyor...' : (canAfford ? 'satın al' : 'yetersiz coin')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Sounds Grid */}
        {(activeTab === 'all' || activeTab === 'sounds') && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Volume2 size={20} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                özel ses efektleri
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {soundsList.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.9rem' }}>
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
                        background: '#161616',
                        border: isOwned ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        {sound.coverImage ? (
                          <img
                            src={sound.coverImage}
                            alt={sound.name}
                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.12)', flexShrink: 0 }}
                          />
                        ) : null}

                        <button
                          onClick={() => handlePlaySound(sound)}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: isPlaying ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                            border: isPlaying ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isPlaying ? '#ef4444' : '#e2e8f0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            flexShrink: 0
                          }}
                        >
                          {isPlaying ? <Square size={16} /> : <Play size={16} />}
                        </button>

                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sound.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Coins size={13} color="#fbbf24" />
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
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          padding: '6px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}>
                          <Check size={13} /> sahipsin
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuy('sound', sound)}
                          disabled={!canAfford || buyingId === sound.id}
                          style={{
                            background: canAfford ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255, 255, 255, 0.05)',
                            border: canAfford ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: canAfford ? '#ffffff' : '#64748b',
                            padding: '8px 14px',
                            borderRadius: '10px',
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ShoppingBag size={13} />
                          {buyingId === sound.id ? '...' : (canAfford ? 'satın al' : 'yetersiz')}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
