const fs = require('fs');

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
    if (cardNorm && selNorm && (cardNorm.includes(selNorm) || selNorm.includes(cardNorm))) return true;
    if (cardLow.includes(selLow) || selLow.includes(cardLow)) return true;
  }
  return false;
}

const rawDeckJson = JSON.parse(fs.readFileSync('worker/defaultDeck.json', 'utf8'));
const parsed = buildCardsFromRaw(rawDeckJson);

console.log('Total white cards:', parsed.whiteCards.length);
console.log('Total red cards:', parsed.redCards.length);

const testSelections = [
  ['Nerd Paket'],
  ['Kara Paket'],
  ['Sekso Paket'],
  ['Nerd Paket', 'Fenasal Nerd Paket'],
  ['Ana Deste', 'Kara Paket'],
  ['Kara Paket', 'Zifiri Paket']
];

testSelections.forEach(sel => {
  const w = parsed.whiteCards.filter(c => isCardInSelectedDecks(c, sel));
  const r = parsed.redCards.filter(c => isCardInSelectedDecks(c, sel));
  console.log(`\nSelection [${sel.join(', ')}]:`);
  console.log(`  White matching: ${w.length} cards (Categories: ${[...new Set(w.map(c=>c.category))].join(', ')})`);
  console.log(`  Red matching: ${r.length} cards (Categories: ${[...new Set(r.map(c=>c.category))].join(', ')})`);
});
