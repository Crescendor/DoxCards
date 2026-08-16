// Turkish Cards Database for Red Flags (DoxCards) - Complete 800+ Cards Edition
import rawDeckJson from './Red_Flags_Turkish_Complete.json';

function buildCardsFromRaw(jsonData) {
  const whiteCards = [];
  const redCards = [];
  let wIndex = 1;
  let rIndex = 1;

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

  return { whiteCards, redCards };
}

const { whiteCards, redCards } = buildCardsFromRaw(rawDeckJson);

export const WHITE_CARDS = whiteCards;
export const RED_CARDS = redCards;

// Shuffle helper
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get shuffled full match deck
export function getDeck(deckType = 'all') {
  let selectedWhite = [...WHITE_CARDS];
  let selectedRed = [...RED_CARDS];

  if (deckType !== 'all') {
    const filteredWhite = selectedWhite.filter(c => c.category?.toLowerCase().includes(deckType.toLowerCase()));
    const filteredRed = selectedRed.filter(c => c.category?.toLowerCase().includes(deckType.toLowerCase()));
    if (filteredWhite.length >= 20) selectedWhite = filteredWhite;
    if (filteredRed.length >= 20) selectedRed = filteredRed;
  }

  return {
    white: shuffleArray(selectedWhite),
    red: shuffleArray(selectedRed)
  };
}
