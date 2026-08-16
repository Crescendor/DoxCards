// Discord OAuth2 Implicit Grant Client Service for DoxCards

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || '';

export function getDiscordUser() {
  try {
    const raw = localStorage.getItem('doxcards_discord_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveDiscordUser(user) {
  if (user) {
    localStorage.setItem('doxcards_discord_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('doxcards_discord_user');
  }
}

export function initiateDiscordLogin() {
  const clientId = DISCORD_CLIENT_ID || window.prompt(
    'Discord Client ID giriniz (Discord Developer Portal > Application > General Information > Application ID):'
  );

  if (!clientId) return;

  const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&scope=identify&redirect_uri=${redirectUri}`;

  window.location.href = authUrl;
}

export async function checkDiscordAuthCallback() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return null;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');

  if (!token) return null;

  try {
    const res = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Discord auth failed');

    const data = await res.json();
    const avatarUrl = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : null;

    const user = {
      id: data.id,
      username: data.username,
      displayName: data.global_name || data.username,
      avatarUrl
    };

    saveDiscordUser(user);

    // Clean hash from URL
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return user;
  } catch (err) {
    console.error('Error fetching Discord user profile:', err);
    return null;
  }
}

export function logoutDiscord() {
  saveDiscordUser(null);
}
