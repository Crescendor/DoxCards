import { io } from 'socket.io-client';

// Generate or retrieve persistent player ID
export function getLocalPlayer() {
  const storedId = localStorage.getItem('doxcards_player_id');
  const storedName = localStorage.getItem('doxcards_player_name');
  const storedAvatar = localStorage.getItem('doxcards_player_avatar');
  const storedColor = localStorage.getItem('doxcards_player_color');

  const id = storedId || 'p_' + Math.random().toString(36).substring(2, 9);
  if (!storedId) localStorage.setItem('doxcards_player_id', id);

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return {
    id,
    name: storedName || `oyuncu_${id.substring(2, 6)}`,
    color: storedColor || randomColor
  };
}

export function saveLocalPlayer(player) {
  if (player.name) localStorage.setItem('doxcards_player_name', player.name);
  if (player.color) localStorage.setItem('doxcards_player_color', player.color);
}

// Server URL (supports Cloudflare environment variable VITE_SERVER_URL with local fallback)
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : `${window.location.protocol}//${window.location.hostname}:3001`
);

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
