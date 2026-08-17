// User & Deck Permission Service for DoxCards Cloudflare Backend

const SERVER_URL = 'https://doxcards-server.burakcnaydin.workers.dev';

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
  ]
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
    localStorage.setItem('doxcards_user_profile', JSON.stringify(profile));
  } else {
    localStorage.removeItem('doxcards_user_profile');
  }
}

// Sync user on Discord login
export async function syncUserProfile(discordUser) {
  if (!discordUser?.id) return null;

  try {
    const res = await fetch(`${SERVER_URL}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: discordUser.id,
        username: discordUser.username || discordUser.displayName,
        displayName: discordUser.displayName || discordUser.username,
        avatar: discordUser.avatarUrl || discordUser.avatar
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
    console.warn('Could not sync user profile to Cloudflare, using local fallback:', err);
  }

  // Fallback profile
  const cached = getLocalUserProfile();
  if (cached && cached.id === discordUser.id) return cached;

  const fallback = {
    id: discordUser.id,
    username: discordUser.username || discordUser.displayName,
    displayName: discordUser.displayName || discordUser.username,
    avatar: discordUser.avatarUrl || discordUser.avatar,
    totalScore: 0,
    tags: discordUser.id === '269639754675519489' ? ['admin'] : [],
    unlockedDecks: discordUser.id === '269639754675519489' ? [...DEFAULT_CONFIG.allDecks] : [...DEFAULT_CONFIG.discordDecks]
  };
  saveLocalUserProfile(fallback);
  return fallback;
}

// Fetch all registered users (Admin only)
export async function fetchAllUsers() {
  try {
    const res = await fetch(`${SERVER_URL}/api/users`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch users from Cloudflare:', err);
  }
  return [];
}

// Admin / User update profile
export async function updateUser(userId, updates) {
  try {
    const res = await fetch(`${SERVER_URL}/api/users/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...updates })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const cached = getLocalUserProfile();
        if (cached && cached.id === userId) {
          saveLocalUserProfile(data.user);
        }
        return data.user;
      }
    }
  } catch (err) {
    console.error('Failed to update user in Cloudflare:', err);
  }
  return null;
}

// Fetch global deck permission config
export async function fetchAppConfig() {
  try {
    const res = await fetch(`${SERVER_URL}/api/config`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch app config from Cloudflare:', err);
  }
  return DEFAULT_CONFIG;
}

// Admin update app config
export async function updateAppConfig(config) {
  try {
    const res = await fetch(`${SERVER_URL}/api/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      const data = await res.json();
      return data.config;
    }
  } catch (err) {
    console.error('Failed to update app config in Cloudflare:', err);
  }
  return null;
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
