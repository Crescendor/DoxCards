const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://doxcards-server.burakcnaydin.workers.dev'
);

export const DEFAULT_CARD_THEMES = [
  {
    id: 'stocks',
    name: 'Klasik Stok Tema',
    description: 'DoxCards orijinal klasik kart teması.',
    price: 0,
    isDefault: true,
    isEnabled: true,
    fontColorRed: '#ffffff',
    fontColorWhite: '#000000',
    glow: 'none',
    animation: 'none',
    images: {
      redBack: '/themes/stocks/1.png',
      whiteBack: '/themes/stocks/2.png',
      redFront: '/themes/stocks/3.png',
      whiteFront: '/themes/stocks/4.png'
    }
  },
  {
    id: 'doxcards',
    name: 'DoxCards Özel Tema',
    description: 'Özel DoxCards tasarım hatlarına sahip parlak kart teması.',
    price: 350,
    isDefault: false,
    isEnabled: true,
    fontColorRed: '#ffffff',
    fontColorWhite: '#1e293b',
    glow: 'golden',
    animation: 'gold_radiance',
    images: {
      redBack: '/themes/doxcards/1.png',
      whiteBack: '/themes/doxcards/2.png',
      redFront: '/themes/doxcards/3.png',
      whiteFront: '/themes/doxcards/4.png'
    }
  },
  {
    id: 'gc',
    name: 'Galaksi Siber Tema (GC)',
    description: 'Derin uzay, altın ve siber enerji tonlarında fütüristik tema.',
    price: 600,
    isDefault: false,
    isEnabled: true,
    fontColorRed: '#ffffff',
    fontColorWhite: '#0f172a',
    glow: 'neon_purple',
    animation: 'cosmic_pulse',
    images: {
      redBack: '/themes/gc/1.png',
      whiteBack: '/themes/gc/2.png',
      redFront: '/themes/gc/3.png',
      whiteFront: '/themes/gc/4.png'
    }
  },
  {
    id: 'gul',
    name: 'Kızıl Gül Aşkı (GÜL)',
    description: 'Romantik yakut kırmızısı ve zarafet detaylı özel kart teması.',
    price: 750,
    isDefault: false,
    isEnabled: true,
    fontColorRed: '#ffe4e6',
    fontColorWhite: '#881337',
    glow: 'crimson',
    animation: 'crimson_flare',
    images: {
      redBack: '/themes/gul/1.png',
      whiteBack: '/themes/gul/2.png',
      redFront: '/themes/gul/3.png',
      whiteFront: '/themes/gul/4.png'
    }
  },
  {
    id: 'hl',
    name: 'Holografik Neon (HL)',
    description: 'Yüksek voltajlı neon ışıkları ve siber lazer dalgaları teması.',
    price: 1000,
    isDefault: false,
    isEnabled: true,
    fontColorRed: '#ffffff',
    fontColorWhite: '#0284c7',
    glow: 'neon_blue',
    animation: 'cyber_scan',
    images: {
      redBack: '/themes/hl/1.png',
      whiteBack: '/themes/hl/2.png',
      redFront: '/themes/hl/3.png',
      whiteFront: '/themes/hl/4.png'
    }
  }
];

export const DEFAULT_MARKET_SOUNDS = [
  {
    id: 'sound_cyber_deal',
    name: 'Siber Kart Dağıtımı',
    category: 'white_card',
    price: 200,
    type: 'synth',
    url: '',
    isEnabled: true
  },
  {
    id: 'sound_thunder_sabotage',
    name: 'Şimşekli Sabotaj',
    category: 'red_card',
    price: 300,
    type: 'synth',
    url: '',
    isEnabled: true
  },
  {
    id: 'sound_epic_win',
    name: 'Destansı Zafer Trompeti',
    category: 'game_win',
    price: 500,
    type: 'synth',
    url: '',
    isEnabled: true
  }
];

export const DEFAULT_CONFIG = {
  guestDecks: ['Ana Deste'],
  discordDecks: ['Ana Deste', 'Ek Paket'],
  allDecks: [
    'Ana Deste',
    'Ek Paket',
    'Nerd Paket',
    'Fenasal Nerd Paket',
    'Sekso Paket',
    'Kara Paket',
    'Zifiri Paket',
    'Aktanfell Paket'
  ],
  deckMetadata: {
    'Ana Deste': { isSecret: false, lockDescription: 'Temel oyun destesi. Herkese açıktır.' },
    'Ek Paket': { isSecret: false, lockDescription: 'Discord ile giriş yapan tüm kullanıcılara açıktır.' },
    'Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Fenasal Nerd Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için VIP yetkisi gereklidir.' },
    'Sekso Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium veya VIP yetkisi gereklidir.' },
    'Kara Paket': { isSecret: false, lockDescription: 'Bu desteye erişmek için Premium yetkisi gereklidir.' },
    'Zifiri Paket': { isSecret: true, lockDescription: 'Gizli özel paket. Yalnızca özel davetli kullanıcılara açıktır.' },
    'Aktanfell Paket': { isSecret: false, lockDescription: 'Aktanfell özel topluluk paketi.' }
  },
  customSounds: [
    {
      id: 'sound_default_deal',
      name: 'Klasik Kart Kayma Sesi',
      category: 'white_card',
      type: 'synth',
      url: '',
      startSec: 0,
      endSec: 1,
      isDefault: true
    },
    {
      id: 'sound_default_sabotage',
      name: 'Dramatik Sabotaj Sesi',
      category: 'red_card',
      type: 'synth',
      url: '',
      startSec: 0,
      endSec: 1,
      isDefault: true
    },
    {
      id: 'sound_default_victory',
      name: 'Kutlama Fanfarı',
      category: 'game_win',
      type: 'synth',
      url: '',
      startSec: 0,
      endSec: 3,
      isDefault: true
    }
  ],
  coinMultipliers: {
    default: 10,
    premium: 20,
    vip: 30
  },
  customTags: [
    {
      id: 'admin',
      name: 'admin',
      icon: 'ShieldCheck',
      color: '#f87171',
      bgColor: 'rgba(239, 68, 68, 0.18)',
      borderColor: 'rgba(239, 68, 68, 0.45)',
      glow: 'crimson',
      animation: 'crimson_flare',
      permissions: {
        customSounds: true,
        allDecks: true,
        unlockedDecks: ['all'],
        adminAccess: true,
        multiplier: 30
      }
    },
    {
      id: 'vip',
      name: 'VIP',
      icon: 'Crown',
      color: '#c084fc',
      bgColor: 'rgba(168, 85, 247, 0.18)',
      borderColor: 'rgba(168, 85, 247, 0.45)',
      glow: 'neon_purple',
      animation: 'neon_pulse',
      permissions: {
        customSounds: true,
        allDecks: true,
        unlockedDecks: ['all'],
        adminAccess: false,
        multiplier: 30
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: 'Sparkles',
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.18)',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      glow: 'neon_blue',
      animation: 'cyber_scan',
      permissions: {
        customSounds: true,
        allDecks: false,
        unlockedDecks: ['Ana Deste', 'Ek Paket', 'Nerd Paket'],
        adminAccess: false,
        multiplier: 20
      }
    }
  ],
  market: {
    themes: DEFAULT_CARD_THEMES,
    sounds: DEFAULT_MARKET_SOUNDS
  }
};

// Get locally cached user profile
export function getLocalUserProfile() {
  try {
    const raw = localStorage.getItem('doxcards_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveLocalUserProfile(profile) {
  if (profile) {
    // Ensure ownedThemes contains at least 'stocks'
    if (!Array.isArray(profile.ownedThemes)) {
      profile.ownedThemes = ['stocks'];
    } else if (!profile.ownedThemes.includes('stocks')) {
      profile.ownedThemes.unshift('stocks');
    }
    if (!profile.equippedTheme) {
      profile.equippedTheme = 'stocks';
    }
    localStorage.setItem('doxcards_user_profile', JSON.stringify(profile));
  } else {
    localStorage.removeItem('doxcards_user_profile');
  }
}

// ----------------- App Config API -----------------
export async function fetchAppConfig() {
  try {
    const res = await fetch(`${SERVER_URL}/api/config`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...DEFAULT_CONFIG,
        ...data,
        market: {
          themes: (data?.market?.themes && data.market.themes.length > 0) ? data.market.themes : DEFAULT_CARD_THEMES,
          sounds: (data?.market?.sounds && data.market.sounds.length > 0) ? data.market.sounds : DEFAULT_MARKET_SOUNDS
        }
      };
    }
  } catch (err) {
    console.warn('Could not fetch app config from server, using default:', err);
  }
  return DEFAULT_CONFIG;
}

export async function updateAppConfig(newConfig) {
  try {
    const res = await fetch(`${SERVER_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (res.ok) {
      const data = await res.json();
      return data.config;
    }
  } catch (err) {
    console.error('Failed to update app config:', err);
  }
  return null;
}

// ----------------- Users API -----------------
export async function fetchAllUsers() {
  try {
    const res = await fetch(`${SERVER_URL}/api/users`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch users list:', err);
  }
  return [];
}

export async function syncUserOnLogin(discordUser) {
  if (!discordUser?.id) return null;
  try {
    const res = await fetch(`${SERVER_URL}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: discordUser.id,
        username: discordUser.username,
        displayName: discordUser.displayName || discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        saveLocalUserProfile(data.user);
        return data.user;
      }
    }
  } catch (err) {
    console.error('Failed to sync user on login:', err);
  }
  return null;
}

export const syncUserProfile = syncUserOnLogin;

export async function updateUser(userId, updateData) {
  try {
    const res = await fetch(`${SERVER_URL}/api/users/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updateData })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const local = getLocalUserProfile();
        if (local && local.id === userId) {
          saveLocalUserProfile(data.user);
        }
        return data.user;
      }
    }
  } catch (err) {
    console.error('Failed to update user:', err);
  }
  return null;
}

// ----------------- Market API -----------------
export async function buyMarketItem(userId, { itemType, itemId, price }) {
  try {
    const res = await fetch(`${SERVER_URL}/api/market/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemType, itemId, price })
    });
    const data = await res.json();
    if (data.user) {
      saveLocalUserProfile(data.user);
    }
    return data;
  } catch (err) {
    console.error('Failed to buy market item:', err);
    return { error: 'Satın alma işlemi gerçekleştirilemedi.' };
  }
}

export async function equipTheme(userId, themeId) {
  try {
    const res = await fetch(`${SERVER_URL}/api/market/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, themeId })
    });
    const data = await res.json();
    if (data.user) {
      saveLocalUserProfile(data.user);
    }
    return data;
  } catch (err) {
    console.error('Failed to equip theme:', err);
    return { error: 'Tema aktif edilemedi.' };
  }
}

// ----------------- Suggestions API -----------------
export async function fetchSuggestions(discordId = '') {
  try {
    const res = await fetch(`${SERVER_URL}/api/suggestions?discordId=${encodeURIComponent(discordId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch suggestions:', err);
  }
  return [];
}

export async function createSuggestion(suggestionData) {
  try {
    const res = await fetch(`${SERVER_URL}/api/suggestions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(suggestionData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to create suggestion:', err);
    return { error: 'Öneri kaydedilemedi.' };
  }
}

export async function updateSuggestion(suggestionId, updateData) {
  try {
    const res = await fetch(`${SERVER_URL}/api/suggestions/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId, ...updateData })
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to update suggestion:', err);
    return { error: 'Öneri güncellenemedi.' };
  }
}

export async function deleteSuggestion(suggestionId) {
  try {
    const res = await fetch(`${SERVER_URL}/api/suggestions/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId })
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to delete suggestion:', err);
    return { error: 'Öneri silinemedi.' };
  }
}

export async function reviewSuggestion(reviewData) {
  try {
    const res = await fetch(`${SERVER_URL}/api/suggestions/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to review suggestion:', err);
    return { error: 'Öneri incelenemedi.' };
  }
}
