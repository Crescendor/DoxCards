import crypto from 'crypto';

function randomFloat() {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0xffffffff;
}

function shuffleArray(array) {
  if (!Array.isArray(array) || array.length <= 1) return array ? [...array] : [];
  const arr = [...array];
  for (let pass = 0; pass < 4; pass++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(randomFloat() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  return arr;
}

// Truly uniform, proportional, and stratified distribution:
// Spreads cards from all selected categories uniformly throughout the entire draw pile,
// so that from the very first draw to the last, every selected deck appears with true randomness and fair proportion!
export function fairStratifiedDeckShuffle(cards) {
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

  // Shuffle each group internally
  groupKeys.forEach(k => {
    groups[k] = shuffleArray(groups[k]);
  });

  // Target slots array
  const totalCards = cards.length;
  const slots = new Array(totalCards);

  // For each category, distribute cards uniformly across indices [0 .. totalCards - 1]
  groupKeys.forEach(k => {
    const catCards = groups[k];
    const n = catCards.length;
    const step = totalCards / n;

    catCards.forEach((c, idx) => {
      // Calculate ideal center position with random jitter
      const idealPos = (idx + randomFloat() * 0.9) * step;
      let targetIdx = Math.floor(idealPos) % totalCards;

      // Find nearest empty slot
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

  // Filter and return (guaranteed to contain all cards)
  const result = slots.filter(Boolean);
  return result;
}

// Test with Ana Deste (160) + Nerd Paket (30) + Sekso Paket (30)
const sampleCards = [
  ...Array.from({length: 160}, (_, i) => ({ id: `ana_${i}`, category: 'Ana Deste' })),
  ...Array.from({length: 30}, (_, i) => ({ id: `nerd_${i}`, category: 'Nerd Paket' })),
  ...Array.from({length: 30}, (_, i) => ({ id: `sekso_${i}`, category: 'Sekso Paket' })),
];

const deck = fairStratifiedDeckShuffle(sampleCards);

console.log('Total in deck:', deck.length);

// Draw batches of 20 cards (simulating 5 players drawing 4 cards in round 1, round 2, round 3...)
for (let round = 1; round <= 5; round++) {
  const drawn = Array.from({length: 20}, () => deck.pop());
  const counts = {};
  drawn.forEach(c => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });
  console.log(`Round ${round} drawn (20 cards):`, counts);
}
