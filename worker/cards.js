// Turkish Cards Database for Red Flags (DoxCards) - Complete 800+ Cards Edition
import rawDeckJson from './Red_Flags_Turkish_Complete.json';

export function standardizeBlankTokens(text) {
  if (!text) return '';
  return text
    .replace(/([_\s]*_{2,}[_\s]*)|\[blank\]|\{blank\}/gi, ' [boşluk] ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCardsFromRaw(jsonData) {
  const whiteCards = [];
  const redCards = [];
  let wIndex = 1;
  let rIndex = 1;

  const perks = jsonData?.Perks || jsonData?.perks || {};
  const redFlags = jsonData?.['Red Flags'] || jsonData?.red_flags || jsonData?.redFlags || {};
  const deckNotes = jsonData?.deckNotes || jsonData?.DeckNotes || {};

  Object.entries(perks).forEach(([category, list]) => {
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

  Object.entries(redFlags).forEach(([category, list]) => {
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

  return { whiteCards, redCards };
}

let activeRawDeck = rawDeckJson;
let activeParsed = buildCardsFromRaw(rawDeckJson);

export function getActiveRawDeck() {
  return activeRawDeck;
}

export function updateGlobalDeck(newRawDeck) {
  if (!newRawDeck) return;
  activeRawDeck = newRawDeck;
  activeParsed = buildCardsFromRaw(newRawDeck);
}

export const WHITE_CARDS = () => activeParsed.whiteCards;
export const RED_CARDS = () => activeParsed.redCards;

// Shuffle helper
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizeDeckName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/gi, '')
    .replace(/(deste|paket|deck|pack)$/i, '')
    .trim();
}

export function getDeck(deckType = 'all', customRawDeck = null, selectedDecks = null) {
  const parsed = customRawDeck ? buildCardsFromRaw(customRawDeck) : activeParsed;
  const allWhite = [...parsed.whiteCards];
  const allRed = [...parsed.redCards];

  let selectedWhite = [];
  let selectedRed = [];

  if (Array.isArray(selectedDecks) && selectedDecks.length > 0) {
    const lowerDecks = selectedDecks.map(d => (d || '').toLowerCase().trim());
    const normDecks = selectedDecks.map(d => normalizeDeckName(d)).filter(Boolean);

    selectedWhite = allWhite.filter(c => {
      const cLow = (c.category || '').toLowerCase().trim();
      const cNorm = normalizeDeckName(c.category);
      return lowerDecks.includes(cLow) ||
             normDecks.includes(cNorm) ||
             normDecks.some(nd => cNorm.includes(nd) || nd.includes(cNorm));
    });

    selectedRed = allRed.filter(c => {
      const cLow = (c.category || '').toLowerCase().trim();
      const cNorm = normalizeDeckName(c.category);
      return lowerDecks.includes(cLow) ||
             normDecks.includes(cNorm) ||
             normDecks.some(nd => cNorm.includes(nd) || nd.includes(cNorm));
    });
  } else if (deckType && deckType !== 'all') {
    selectedWhite = allWhite.filter(c => (c.category || '').toLowerCase().includes(deckType.toLowerCase()));
    selectedRed = allRed.filter(c => (c.category || '').toLowerCase().includes(deckType.toLowerCase()));
  }

  // Fallbacks: If no cards match, fall back to core Ana Deste, or all available cards
  if (selectedWhite.length === 0) {
    const coreWhite = allWhite.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedWhite = coreWhite.length > 0 ? coreWhite : allWhite;
  }

  if (selectedRed.length === 0) {
    const coreRed = allRed.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedRed = coreRed.length > 0 ? coreRed : allRed;
  }

  return {
    white: shuffleArray(selectedWhite),
    red: shuffleArray(selectedRed)
  };
}


