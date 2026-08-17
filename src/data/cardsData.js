// Cards Data Manager for DoxCards
import rawCardsData from './defaultDeck.json';

const STORAGE_KEY = 'doxcards_custom_deck_json';

// Standardize any variation of underscores/blanks to clean [boşluk]
export function standardizeBlankTokens(text) {
  if (!text) return '';
  return text
    .replace(/([_\s]*_{2,}[_\s]*)|\[blank\]|\{blank\}/gi, ' [boşluk] ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normalize raw JSON structure into clean card objects
export function parseRawDeck(jsonData) {
  const whiteCards = [];
  const redCards = [];
  let wIndex = 1;
  let rIndex = 1;

  if (!jsonData || typeof jsonData !== 'object') {
    jsonData = rawCardsData;
  }

  const hasInputPerks = jsonData?.Perks || jsonData?.perks || jsonData?.PERKS || jsonData?.whiteCards || jsonData?.white;
  const hasInputRedFlags = jsonData?.['Red Flags'] || jsonData?.red_flags || jsonData?.redFlags || jsonData?.RedFlags || jsonData?.RED_FLAGS || jsonData?.redCards || jsonData?.red;

  const perksObj = hasInputPerks ? (jsonData.Perks || jsonData.perks || jsonData.PERKS || jsonData.whiteCards || jsonData.white) : (rawCardsData?.Perks || {});
  const redFlagsObj = hasInputRedFlags ? (jsonData['Red Flags'] || jsonData.red_flags || jsonData.redFlags || jsonData.RedFlags || jsonData.RED_FLAGS || jsonData.redCards || jsonData.red) : (rawCardsData?.['Red Flags'] || {});
  const deckNotes = jsonData?.deckNotes || jsonData?.DeckNotes || rawCardsData?.deckNotes || {};

  // Standardized raw object
  const normalizedRaw = {
    Perks: perksObj,
    'Red Flags': redFlagsObj,
    deckNotes
  };

  // 1. Perks (White Cards)
  Object.entries(perksObj).forEach(([category, list]) => {
    if (Array.isArray(list)) {
      list.forEach(text => {
        const trimmed = (text || '').trim();
        if (trimmed && trimmed.toLowerCase() !== category.toLowerCase()) {
          const standardized = standardizeBlankTokens(trimmed);
          whiteCards.push({
            id: `w_${String(wIndex++).padStart(4, '0')}`,
            text: standardized,
            type: 'perk',
            category,
            deckName: category,
            deckExtraNote: deckNotes[category] || ''
          });
        }
      });
    }
  });

  // 2. Red Flags
  Object.entries(redFlagsObj).forEach(([category, list]) => {
    if (Array.isArray(list)) {
      list.forEach(text => {
        const trimmed = (text || '').trim();
        if (trimmed && trimmed.toLowerCase() !== category.toLowerCase()) {
          const standardized = standardizeBlankTokens(trimmed);
          redCards.push({
            id: `r_${String(rIndex++).padStart(4, '0')}`,
            text: standardized,
            type: 'redflag',
            category,
            deckName: category,
            deckExtraNote: deckNotes[category] || ''
          });
        }
      });
    }
  });

  return {
    raw: normalizedRaw,
    whiteCards,
    redCards,
    allCards: [...whiteCards, ...redCards]
  };
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3001'
    : 'https://doxcards-server.burakcnaydin.workers.dev'
);

// Get active deck from localStorage cache or fallback
export function getActiveDeck() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parseRawDeck(parsed);
    }
  } catch (e) {
    console.error('Error loading custom stored deck, falling back to default:', e);
  }
  return parseRawDeck(rawCardsData);
}

// Local cache save
export function saveActiveDeckLocal(jsonData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData, null, 2));
}

// Fetch live database deck from Cloudflare backend
export async function syncDeckFromCloudflare() {
  try {
    const res = await fetch(`${SERVER_URL}/api/deck`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.Perks || data.perks || data['Red Flags'] || data.red_flags)) {
        saveActiveDeckLocal(data);
        return parseRawDeck(data);
      }
    }
  } catch (err) {
    console.warn('Could not fetch deck from Cloudflare database, using local fallback:', err);
  }
  return getActiveDeck();
}

// Save customized deck to localStorage and Cloudflare Database
export async function saveActiveDeck(jsonData) {
  saveActiveDeckLocal(jsonData);
  try {
    const res = await fetch(`${SERVER_URL}/api/deck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck: jsonData })
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.error('Failed to sync deck to Cloudflare database:', err);
  }
  return false;
}

// Reset customized deck back to original JSON in Cloudflare Database & localStorage
export async function resetActiveDeck() {
  localStorage.removeItem(STORAGE_KEY);
  try {
    const res = await fetch(`${SERVER_URL}/api/deck/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.error('Failed to reset deck on Cloudflare database:', err);
  }
  return false;
}

export const DEFAULT_RAW_CARDS = rawCardsData;
