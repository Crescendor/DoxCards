// Cards Data Manager for DoxCards
import rawCardsData from '../../Red_Flags_Turkish_Complete.json';

const STORAGE_KEY = 'doxcards_custom_deck_json';

// Normalize raw JSON structure into clean card objects
export function parseRawDeck(jsonData) {
  const whiteCards = [];
  const redCards = [];
  let wIndex = 1;
  let rIndex = 1;

  // 1. Perks (White Cards)
  if (jsonData.Perks) {
    Object.entries(jsonData.Perks).forEach(([category, list]) => {
      if (Array.isArray(list)) {
        list.forEach(text => {
          const trimmed = (text || '').trim();
          if (trimmed && trimmed.toLowerCase() !== category.toLowerCase()) {
            whiteCards.push({
              id: `w_${String(wIndex++).padStart(4, '0')}`,
              text: trimmed,
              type: 'perk',
              category
            });
          }
        });
      }
    });
  }

  // 2. Red Flags
  if (jsonData['Red Flags']) {
    Object.entries(jsonData['Red Flags']).forEach(([category, list]) => {
      if (Array.isArray(list)) {
        list.forEach(text => {
          const trimmed = (text || '').trim();
          if (trimmed && trimmed.toLowerCase() !== category.toLowerCase()) {
            redCards.push({
              id: `r_${String(rIndex++).padStart(4, '0')}`,
              text: trimmed,
              type: 'redflag',
              category
            });
          }
        });
      }
    });
  }

  return {
    raw: jsonData,
    whiteCards,
    redCards,
    allCards: [...whiteCards, ...redCards]
  };
}

// Get active deck (either stored custom deck or default rawCardsData)
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

// Save customized deck to localStorage
export function saveActiveDeck(jsonData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData, null, 2));
}

// Reset customized deck back to original JSON
export function resetActiveDeck() {
  localStorage.removeItem(STORAGE_KEY);
}

export const DEFAULT_RAW_CARDS = rawCardsData;
