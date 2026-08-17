const fs = require('fs');

const rawDeck = JSON.parse(fs.readFileSync('src/data/defaultDeck.json', 'utf8'));

console.log('--- RAW DECK CHECK ---');
console.log('Perks in rawDeck:', Object.keys(rawDeck.Perks || {}));
console.log('Red Flags in rawDeck:', Object.keys(rawDeck['Red Flags'] || {}));

function buildCardsFromRaw(jsonData) {
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
          whiteCards.push({
            id: `w_${String(wIndex++).padStart(4, '0')}`,
            text: trimmed,
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
          redCards.push({
            id: `r_${String(rIndex++).padStart(4, '0')}`,
            text: trimmed,
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
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeDeckName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/gi, '')
    .replace(/(deste|paket|deck|pack)$/i, '')
    .trim();
}

function getDeck(deckType = 'all', customRawDeck = null, selectedDecks = null) {
  const parsed = buildCardsFromRaw(customRawDeck || rawDeck);
  let selectedWhite = [...parsed.whiteCards];
  let selectedRed = [...parsed.redCards];

  if (Array.isArray(selectedDecks) && selectedDecks.length > 0) {
    const lowerDecks = selectedDecks.map(d => (d || '').toLowerCase().trim());
    const normDecks = selectedDecks.map(d => normalizeDeckName(d)).filter(Boolean);

    const filteredWhite = selectedWhite.filter(c => {
      const cLow = (c.category || '').toLowerCase().trim();
      const cNorm = normalizeDeckName(c.category);
      return lowerDecks.includes(cLow) || normDecks.includes(cNorm);
    });

    const filteredRed = selectedRed.filter(c => {
      const cLow = (c.category || '').toLowerCase().trim();
      const cNorm = normalizeDeckName(c.category);
      return lowerDecks.includes(cLow) || normDecks.includes(cNorm);
    });

    if (filteredWhite.length > 0) {
      selectedWhite = filteredWhite;
    } else {
      const coreWhite = selectedWhite.filter(c => (c.category || '').toLowerCase().includes('ana'));
      selectedWhite = coreWhite.length > 0 ? coreWhite : selectedWhite;
    }

    if (filteredRed.length > 0) {
      selectedRed = filteredRed;
    } else {
      const coreRed = selectedRed.filter(c => (c.category || '').toLowerCase().includes('ana'));
      selectedRed = coreRed.length > 0 ? coreRed : selectedRed;
    }
  }

  return {
    white: shuffleArray(selectedWhite),
    red: shuffleArray(selectedRed)
  };
}

const PHASES = {
  LOBBY: 'LOBBY',
  PERKS: 'PERKS',
  SABOTAGE: 'SABOTAGE',
  REVEAL: 'REVEAL',
  VOTING: 'VOTING',
  ROUND_SUMMARY: 'ROUND_SUMMARY',
  GAME_OVER: 'GAME_OVER'
};

class GameEngine {
  constructor(roomCode, settings = {}) {
    this.roomCode = roomCode;
    this.roundLimit = Number(settings.roundLimit) || 6;
    this.targetScore = this.roundLimit;
    this.deckType = settings.deckType || 'all';
    this.selectedDecks = settings.selectedDecks || null;

    this.phase = PHASES.LOBBY;
    this.currentRound = 0;
    this.singleIndex = 0;
    this.singlePlayerId = null;

    this.deck = { white: [], red: [] };
    this.usedCardIds = new Set();

    this.hands = {};
    this.scores = {};
    this.stats = {};
    this.candidates = {};
    this.sabotageAssignments = {};
    this.turnOrder = [];
    this.turnIndex = 0;
    this.turnPlayerId = null;
    this.roundWinner = null;
    this.winningCandidate = null;
    this.timer = null;
    this.onStateChange = null;
  }

  initDecks(customRawDeck = null) {
    if (customRawDeck) this.customRawDeck = customRawDeck;
    this.deck = getDeck(this.deckType, this.customRawDeck, this.selectedDecks);
    this.usedCardIds = new Set();
  }

  drawCards(type, count) {
    const cards = [];
    let attempts = 0;
    while (cards.length < count && attempts < 200) {
      attempts++;
      if (!this.deck[type] || this.deck[type].length === 0) {
        const fresh = getDeck(this.deckType, this.customRawDeck, this.selectedDecks);
        this.deck[type] = shuffleArray(fresh[type] || []);
        this.usedCardIds.clear();
      }

      if (this.deck[type] && this.deck[type].length > 0) {
        const candidate = this.deck[type].pop();
        if (candidate) {
          this.usedCardIds.add(candidate.id);
          cards.push(candidate);
        }
      } else {
        break;
      }
    }
    return cards;
  }

  startGame(players, customRawDeck = null) {
    if (players.length < 2) {
      throw new Error('Oyunu başlatmak için en az 2 oyuncu gerekli!');
    }

    if (!this.deck?.white?.length || customRawDeck) {
      this.initDecks(customRawDeck);
    }
    this.currentRound = 0;
    this.singleIndex = 0;
    this.hands = {};
    this.scores = {};
    this.stats = {};

    players.forEach(p => {
      this.scores[p.id] = 0;
      this.stats[p.id] = { wins: 0, sabotagesGiven: 0, sabotagesWon: 0 };
      this.hands[p.id] = {
        whiteCards: this.drawCards('white', 4),
        redCards: this.drawCards('red', 3)
      };
    });

    this.startRound(players);
  }

  startRound(players) {
    this.currentRound++;
    this.candidates = {};
    this.sabotageAssignments = {};
    this.roundWinner = null;
    this.winningCandidate = null;

    const activePlayers = players.filter(p => p.connected !== false);
    if (this.singleIndex >= activePlayers.length) {
      this.singleIndex = 0;
    }
    const single = activePlayers[this.singleIndex];
    this.singlePlayerId = single.id;

    const matchmakers = activePlayers.filter(p => p.id !== this.singlePlayerId);
    this.turnOrder = matchmakers.map(m => m.id);
    this.turnIndex = 0;
    this.turnPlayerId = this.turnOrder[0] || null;

    matchmakers.forEach((m, idx) => {
      const target = matchmakers[(idx + 1) % matchmakers.length];
      this.sabotageAssignments[m.id] = target.id;
      this.candidates[m.id] = {
        matchmakerId: m.id,
        matchmakerName: m.name,
        whiteCards: [],
        redFlag: null,
        sabotagedBy: null,
        sabotagedByName: null
      };
    });

    activePlayers.forEach(p => {
      if (!this.hands[p.id]) {
        this.hands[p.id] = { whiteCards: [], redCards: [] };
      }
      const hand = this.hands[p.id];
      const neededWhite = 4 - hand.whiteCards.length;
      if (neededWhite > 0) {
        const freshWhite = this.drawCards('white', neededWhite);
        hand.whiteCards.push(...freshWhite);
      }
      const neededRed = 3 - hand.redCards.length;
      if (neededRed > 0) {
        const freshRed = this.drawCards('red', neededRed);
        hand.redCards.push(...freshRed);
      }
    });

    this.phase = PHASES.PERKS;
  }

  getGameState(forPlayerId, players) {
    return {
      phase: this.phase,
      currentRound: this.currentRound,
      singlePlayerId: this.singlePlayerId,
      turnPlayerId: this.turnPlayerId,
      handsCount: Object.keys(this.hands).length,
      myHand: this.hands[forPlayerId]
    };
  }
}

const players = [
  { id: 'p1', name: 'Burak', isHost: true, isReady: true, connected: true },
  { id: 'p2', name: 'Ayşe', isHost: false, isReady: true, connected: true }
];

console.log('\n--- SIMULATING GAME START WITH selectedDecks = ["Aktanfell Paket"] ---');
const engine = new GameEngine('TEST1', { selectedDecks: ['Aktanfell Paket'] });
engine.startGame(players);

console.log('Phase:', engine.phase);
console.log('Player 1 hand:', engine.hands['p1']);
console.log('Player 2 hand:', engine.hands['p2']);
console.log('Game state for P1:', engine.getGameState('p1', players));
