// Turkish Cards Database for Red Flags (DoxCards) - Complete Cards Edition
import rawDeckJson from './defaultDeck.json';

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

  const hasInputPerks = jsonData?.Perks || jsonData?.perks;
  const hasInputRedFlags = jsonData?.['Red Flags'] || jsonData?.red_flags || jsonData?.redFlags;

  const perks = hasInputPerks ? (jsonData.Perks || jsonData.perks) : (rawDeckJson?.Perks || {});
  const redFlags = hasInputRedFlags ? (jsonData['Red Flags'] || jsonData.red_flags || jsonData.redFlags) : (rawDeckJson?.['Red Flags'] || {});
  const deckNotes = jsonData?.deckNotes || jsonData?.DeckNotes || rawDeckJson?.deckNotes || {};

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

// Multi-pass Fisher-Yates shuffle for maximum entropy and truly uniform distribution
export function shuffleArray(array) {
  if (!Array.isArray(array) || array.length <= 1) return array ? [...array] : [];
  const arr = [...array];
  for (let pass = 0; pass < 4; pass++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  return arr;
}

export function normalizeDeckName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[\s_\-]+(deste|paket|deck|pack|eklentisi)$/i, '')
    .replace(/[^a-z0-9ğüşıöç]/gi, '')
    .trim();
}

export function isCardInSelectedDecks(card, selectedDecks) {
  if (!Array.isArray(selectedDecks) || selectedDecks.length === 0) return true;
  const cardCat = (card.category || card.deckName || '').trim();
  const cardNorm = normalizeDeckName(cardCat);
  const cardLow = cardCat.toLocaleLowerCase('tr-TR');

  for (const sel of selectedDecks) {
    const selStr = (sel || '').toString().trim();
    if (!selStr) continue;
    const selNorm = normalizeDeckName(selStr);
    const selLow = selStr.toLocaleLowerCase('tr-TR');

    if (cardLow === selLow) return true;
    if (cardNorm && selNorm && cardNorm === selNorm) return true;
    if (cardNorm && selNorm && (cardNorm.includes(selNorm) || selNorm.includes(cardNorm))) return true;
    if (cardLow.includes(selLow) || selLow.includes(cardLow)) return true;
  }
  return false;
}

// Stratified Fair Shuffle: Groups cards by their pack, shuffles each pack independently,
// and interleaves cards evenly so cards from ALL selected packs appear equally in dealt hands
export function stratifiedDeckShuffle(cards) {
  if (!Array.isArray(cards) || cards.length <= 1) return cards ? [...cards] : [];

  // 1. Group cards by deck/category
  const groups = {};
  cards.forEach(card => {
    const key = (card.category || card.deckName || 'Genel').trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  const groupKeys = Object.keys(groups);
  if (groupKeys.length <= 1) {
    return shuffleArray(cards);
  }

  // 2. Shuffle each group's cards deeply
  groupKeys.forEach(k => {
    groups[k] = shuffleArray(groups[k]);
  });

  // 3. Interleave cards evenly from each deck group
  const interleaved = [];
  let remainingTotal = cards.length;

  while (remainingTotal > 0) {
    // Randomize the order of categories in each dealing slice
    const shuffledKeys = shuffleArray(groupKeys.filter(k => groups[k].length > 0));
    if (shuffledKeys.length === 0) break;

    for (const key of shuffledKeys) {
      if (groups[key].length > 0) {
        interleaved.push(groups[key].pop());
        remainingTotal--;
      }
    }
  }

  // 4. Return the fair stratified interleaved deck
  return interleaved;
}

export function getDeck(deckType = 'all', customRawDeck = null, selectedDecks = null) {
  const parsed = customRawDeck ? buildCardsFromRaw(customRawDeck) : activeParsed;
  const allWhite = [...parsed.whiteCards];
  const allRed = [...parsed.redCards];

  let selectedWhite = [];
  let selectedRed = [];

  if (Array.isArray(selectedDecks) && selectedDecks.length > 0) {
    selectedWhite = allWhite.filter(c => isCardInSelectedDecks(c, selectedDecks));
    selectedRed = allRed.filter(c => isCardInSelectedDecks(c, selectedDecks));
  } else if (deckType && deckType !== 'all') {
    selectedWhite = allWhite.filter(c => (c.category || '').toLowerCase().includes(deckType.toLowerCase()));
    selectedRed = allRed.filter(c => (c.category || '').toLowerCase().includes(deckType.toLowerCase()));
  }

  // Fallbacks: If a pool is empty (e.g. selected deck only has perks or only has red flags)
  if (selectedWhite.length === 0) {
    const coreWhite = allWhite.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedWhite = coreWhite.length > 0 ? coreWhite : allWhite;
  }

  if (selectedRed.length === 0) {
    const coreRed = allRed.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedRed = coreRed.length > 0 ? coreRed : allRed;
  }

  return {
    white: stratifiedDeckShuffle(selectedWhite),
    red: stratifiedDeckShuffle(selectedRed)
  };
}


