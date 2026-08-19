import fs from 'fs';

function standardizeBlankTokens(text) {
  if (!text) return '';
  return text
    .replace(/([_\s]*_{2,}[_\s]*)|\[blank\]|\{blank\}/gi, ' [boşluk] ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCardsFromRaw(jsonData) {
  const whiteCards = [];
  const redCards = [];
  let wIndex = 1;
  let rIndex = 1;

  const hasInputPerks = jsonData?.Perks || jsonData?.perks;
  const hasInputRedFlags = jsonData?.['Red Flags'] || jsonData?.red_flags || jsonData?.redFlags;

  const perks = hasInputPerks ? (jsonData.Perks || jsonData.perks) : {};
  const redFlags = hasInputRedFlags ? (jsonData['Red Flags'] || jsonData.red_flags || jsonData.redFlags) : {};
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

function shuffleArray(array) {
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

function normalizeDeckName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[\s_\-]+(deste|paket|deck|pack|eklentisi)$/i, '')
    .replace(/[^a-z0-9ğüşıöç]/gi, '')
    .trim();
}

function isCardInSelectedDecks(card, selectedDecks) {
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
  }
  return false;
}

function fairStratifiedDeckShuffle(cards) {
  if (!Array.isArray(cards) || cards.length <= 1) return cards ? [...cards] : [];

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

  groupKeys.forEach(k => {
    groups[k] = shuffleArray(groups[k]);
  });

  const totalCards = cards.length;
  const slots = new Array(totalCards);

  groupKeys.forEach(k => {
    const catCards = groups[k];
    const n = catCards.length;
    const step = totalCards / n;

    catCards.forEach((c, idx) => {
      const idealPos = (idx + Math.random() * 0.95) * step;
      let targetIdx = Math.floor(idealPos) % totalCards;

      let offset = 0;
      while (offset < totalCards) {
        const checkPlus = (targetIdx + offset) % totalCards;
        if (slots[checkPlus] === undefined) {
          slots[checkPlus] = c;
          break;
        }
        const checkMinus = (targetIdx - offset + totalCards) % totalCards;
        if (slots[checkMinus] === undefined) {
          slots[checkMinus] = c;
          break;
        }
        offset++;
      }
    });
  });

  return slots.filter(Boolean);
}

function getDeck(rawDeck, selectedDecks = null) {
  const parsed = buildCardsFromRaw(rawDeck);
  const allWhite = [...parsed.whiteCards];
  const allRed = [...parsed.redCards];

  let selectedWhite = [];
  let selectedRed = [];

  if (Array.isArray(selectedDecks) && selectedDecks.length > 0) {
    selectedWhite = allWhite.filter(c => isCardInSelectedDecks(c, selectedDecks));
    selectedRed = allRed.filter(c => isCardInSelectedDecks(c, selectedDecks));
  }

  if (selectedWhite.length === 0) {
    const coreWhite = allWhite.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedWhite = coreWhite.length > 0 ? coreWhite : allWhite;
  }

  if (selectedRed.length === 0) {
    const coreRed = allRed.filter(c => (c.category || '').toLowerCase().includes('ana'));
    selectedRed = coreRed.length > 0 ? coreRed : allRed;
  }

  return {
    white: fairStratifiedDeckShuffle(selectedWhite),
    red: fairStratifiedDeckShuffle(selectedRed)
  };
}

const rawDeck = JSON.parse(fs.readFileSync('worker/defaultDeck.json', 'utf8'));
const deck = getDeck(rawDeck, ['Ana Deste', 'Sekso Paket', 'Nerd Paket', 'Kara Paket']);

console.log('White cards pool size:', deck.white.length);
console.log('Red cards pool size:', deck.red.length);

console.log('\n--- SIMULATING 5 PLAYERS DRAWING PERKS (4 cards each on round 1, 2 cards in later rounds) ---');
for (let r = 1; r <= 6; r++) {
  const count = r === 1 ? 20 : 10;
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.white.length > 0) drawn.push(deck.white.pop());
  }
  const counts = {};
  drawn.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  console.log(`Round ${r} (${count} cards):`, counts);
}

console.log('\n--- SIMULATING 5 PLAYERS DRAWING RED FLAGS (3 cards each on round 1, 1 card in later rounds) ---');
for (let r = 1; r <= 6; r++) {
  const count = r === 1 ? 15 : 5;
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (deck.red.length > 0) drawn.push(deck.red.pop());
  }
  const counts = {};
  drawn.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  console.log(`Round ${r} (${count} cards):`, counts);
}
