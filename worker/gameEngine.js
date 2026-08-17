// Game Engine for Red Flags (DoxCards) - Turn-Based Tabletop Engine with Instant Card Visibility & No Time Limit
import { getDeck } from './cards.js';

export const PHASES = {
  LOBBY: 'LOBBY',
  PERKS: 'PERKS',                 // Çöpçatanlar sırayla 2 Beyaz Kart koyuyor (Masada anında görünür)
  SABOTAGE: 'SABOTAGE',           // Çöpçatanlar sırayla rakip masaya 1 Kırmızı Kart koyuyor
  REVEAL: 'REVEAL',               // Masada tüm adaylar açıldı & tartışma
  VOTING: 'VOTING',               // Bekâr karar veriyor
  ROUND_SUMMARY: 'ROUND_SUMMARY', // Tur kazananı ve puanlar
  GAME_OVER: 'GAME_OVER'          // Oyun bitti, podyum
};

export class GameEngine {
  constructor(roomCode, settings = {}) {
    this.roomCode = roomCode;
    this.roundLimit = Number(settings.roundLimit) || (settings.targetScore && settings.targetScore > 7 ? Number(settings.targetScore) : (settings.targetScore <= 3 ? 6 : settings.targetScore <= 5 ? 12 : 18)) || 6;
    this.targetScore = this.roundLimit;
    this.deckType = settings.deckType || 'all';
    this.selectedDecks = settings.selectedDecks || null;

    this.phase = PHASES.LOBBY;
    this.currentRound = 0;
    this.singleIndex = 0; // Bekâr indexi
    this.singlePlayerId = null;

    // Global match decks & unique card tracking
    this.deck = { white: [], red: [] };
    this.usedCardIds = new Set();

    // Persistent player hands throughout the entire match!
    this.hands = {};
    this.scores = {};
    this.stats = {};

    this.candidates = {};
    this.sabotageAssignments = {};

    // Turn order state
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

  // Draws only fresh cards, reshuffling strictly within selected decks if pile is exhausted
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

    // Initial card distribution (4 white, 3 red)
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

  startMatch(players) {
    return this.startGame(players);
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

    // Matchmakers (all players except single)
    const matchmakers = activePlayers.filter(p => p.id !== this.singlePlayerId);

    // Set turn order for matchmakers
    this.turnOrder = matchmakers.map(m => m.id);
    this.turnIndex = 0;
    this.turnPlayerId = this.turnOrder[0] || null;

    // Circular sabotage assignments
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

    // Persistent hands: Replenish discarded cards with fresh unique cards
    activePlayers.forEach(p => {
      if (!this.hands[p.id]) {
        this.hands[p.id] = { whiteCards: [], redCards: [] };
      }
      const hand = this.hands[p.id];

      // Draw only the missing white cards (up to 4)
      const neededWhite = 4 - hand.whiteCards.length;
      if (neededWhite > 0) {
        const freshWhite = this.drawCards('white', neededWhite);
        hand.whiteCards.push(...freshWhite);
      }

      // Draw only the missing red cards (up to 3)
      const neededRed = 3 - hand.redCards.length;
      if (neededRed > 0) {
        const freshRed = this.drawCards('red', neededRed);
        hand.redCards.push(...freshRed);
      }
    });

    this.phase = PHASES.PERKS;
    if (this.onStateChange) this.onStateChange();
  }

  placeSingleWhiteCard(playerId, cardId, customText = null) {
    if (this.phase !== PHASES.PERKS) return false;
    if (playerId !== this.turnPlayerId) return false; // Strictly enforce turn order!
    if (!this.candidates[playerId]) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    const cardIndex = hand.whiteCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    let card = hand.whiteCards.splice(cardIndex, 1)[0];
    if (customText && typeof customText === 'string' && customText.trim()) {
      const filled = card.text.replace(/(?:\[boşluk\]|[_\s]*_{2,}[_\s]*|\[blank\]|\{blank\})/i, `**${customText.trim()}**`);
      card = { ...card, filledText: filled, customValue: customText.trim() };
    }

    if (!this.candidates[playerId].whiteCards) {
      this.candidates[playerId].whiteCards = [];
    }
    this.candidates[playerId].whiteCards.push(card);

    // If 2 white cards are placed by this matchmaker, advance turn
    if (this.candidates[playerId].whiteCards.length >= 2) {
      this.turnIndex++;
      if (this.turnIndex < this.turnOrder.length) {
        this.turnPlayerId = this.turnOrder[this.turnIndex];
      } else {
        // All matchmakers placed perks -> Advance to SABOTAGE phase
        this.phase = PHASES.SABOTAGE;
        this.turnIndex = 0;
        this.turnPlayerId = this.turnOrder[0] || null;
      }
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  submitPerks(playerId, cardIds, customTexts = {}) {
    if (this.phase !== PHASES.PERKS) return false;
    if (playerId !== this.turnPlayerId) return false; // Strictly enforce turn order!
    if (!this.candidates[playerId]) return false;
    if (!Array.isArray(cardIds) || cardIds.length !== 2) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    const selectedCards = hand.whiteCards.filter(c => cardIds.includes(c.id));
    if (selectedCards.length !== 2) return false;

    // Process customTexts for fill-in-the-blank cards (single substitution)
    const processedCards = selectedCards.map(c => {
      const customVal = customTexts ? customTexts[c.id] : null;
      if (customVal && typeof customVal === 'string' && customVal.trim()) {
        const filled = c.text.replace(/([_\s]*_{2,}[_\s]*)|\[boşluk\]|\{blank\}/i, `**${customVal.trim()}**`);
        return { ...c, filledText: filled, customValue: customVal.trim() };
      }
      return c;
    });

    // Remove played cards from hand (remaining 2 cards stay in hand for next rounds!)
    hand.whiteCards = hand.whiteCards.filter(c => !cardIds.includes(c.id));
    this.candidates[playerId].whiteCards = processedCards;

    // Advance turn to next matchmaker in sequence
    this.turnIndex++;
    if (this.turnIndex < this.turnOrder.length) {
      this.turnPlayerId = this.turnOrder[this.turnIndex];
    } else {
      // All matchmakers placed perks -> Advance to SABOTAGE phase
      this.phase = PHASES.SABOTAGE;
      this.turnIndex = 0;
      this.turnPlayerId = this.turnOrder[0] || null;
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  submitSabotage(playerId, cardId, players, customText = null) {
    if (this.phase !== PHASES.SABOTAGE) return false;
    if (playerId !== this.turnPlayerId) return false; // Strictly enforce turn order!

    const targetId = this.sabotageAssignments[playerId];
    if (!targetId || !this.candidates[targetId]) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    const cardIndex = hand.redCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    // Remove played red card from hand (remaining 2 red cards stay in hand for next rounds!)
    let redCard = hand.redCards.splice(cardIndex, 1)[0];
    if (customText && typeof customText === 'string' && customText.trim()) {
      const filled = redCard.text.replace(/(?:\[boşluk\]|[_\s]*_{2,}[_\s]*|\[blank\]|\{blank\})/i, `**${customText.trim()}**`);
      redCard = { ...redCard, filledText: filled, customValue: customText.trim() };
    }

    const player = players ? players.find(p => p.id === playerId) : null;
    this.candidates[targetId].redFlag = redCard;
    this.candidates[targetId].sabotagedBy = playerId;
    this.candidates[targetId].sabotagedByName = player ? player.name : (this.candidates[playerId]?.matchmakerName || 'Rakip');

    if (this.stats[playerId]) {
      this.stats[playerId].sabotagesGiven++;
    }

    // Advance turn to next saboteur
    this.turnIndex++;
    if (this.turnIndex < this.turnOrder.length) {
      this.turnPlayerId = this.turnOrder[this.turnIndex];
    } else {
      // All sabotages placed -> Advance to VOTING
      this.phase = PHASES.VOTING;
      this.turnPlayerId = this.singlePlayerId; // Turn passes to the Bekâr!
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  removePlayer(leavingPlayerId, players = []) {
    // Delete disconnected player from candidate table, hands, and scores
    delete this.candidates[leavingPlayerId];
    delete this.hands[leavingPlayerId];
    delete this.scores[leavingPlayerId];
    delete this.stats[leavingPlayerId];

    // Remove from turn order
    const turnIdx = this.turnOrder.indexOf(leavingPlayerId);
    if (turnIdx !== -1) {
      this.turnOrder.splice(turnIdx, 1);
    }

    const activePlayers = players.filter(p => p.id !== leavingPlayerId);

    // If leaving player was the single player (bekâr), reassign bekâr and restart round
    if (this.singlePlayerId === leavingPlayerId) {
      if (activePlayers.length >= 2) {
        this.singleIndex = 0;
        this.startRound(activePlayers);
        if (this.onStateChange) this.onStateChange();
        return;
      }
    }

    // If it was the leaving player's turn, advance turn to next player
    if (this.turnPlayerId === leavingPlayerId) {
      if (this.turnOrder.length > 0) {
        if (this.turnIndex >= this.turnOrder.length) {
          this.turnIndex = 0;
        }
        this.turnPlayerId = this.turnOrder[this.turnIndex];
      } else {
        this.turnPlayerId = this.singlePlayerId;
      }
    }

    // Re-link sabotage targets
    const matchmakers = activePlayers.filter(p => p.id !== this.singlePlayerId);
    if (matchmakers.length > 0) {
      this.sabotageAssignments = {};
      matchmakers.forEach((m, idx) => {
        const target = matchmakers[(idx + 1) % matchmakers.length];
        this.sabotageAssignments[m.id] = target.id;
      });
    }

    if (this.onStateChange) this.onStateChange();
  }

  bekarSelectWinner(singlePlayerId, winningMatchmakerId, players) {
    if (this.phase !== PHASES.VOTING && this.phase !== PHASES.REVEAL) {
      return { error: 'henüz oy verme aşaması değil.' };
    }
    if (singlePlayerId !== this.singlePlayerId) {
      return { error: 'sadece bekâr kazananı seçebilir.' };
    }
    if (!this.candidates[winningMatchmakerId]) {
      return { error: 'seçilen aday bulunamadı.' };
    }

    this.roundWinner = winningMatchmakerId;
    this.winningCandidate = this.candidates[winningMatchmakerId];

    this.scores[winningMatchmakerId] = (this.scores[winningMatchmakerId] || 0) + 1;
    if (this.stats[winningMatchmakerId]) {
      this.stats[winningMatchmakerId].wins++;
    }

    const wonGame = this.currentRound >= this.roundLimit;
    if (wonGame) {
      this.phase = PHASES.GAME_OVER;
    } else {
      this.phase = PHASES.ROUND_SUMMARY;
    }

    if (this.onStateChange) this.onStateChange();
    return { success: true, wonGame };
  }

  selectWinner(singlePlayerId, winningMatchmakerId, players) {
    return this.bekarSelectWinner(singlePlayerId, winningMatchmakerId, players);
  }

  nextRound(players) {
    this.singleIndex++;
    this.startRound(players);
    if (this.onStateChange) this.onStateChange();
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Get sanitized state for client with PUBLIC cards on table
  getGameState(forPlayerId, players) {
    const singlePlayer = players.find(p => p.id === this.singlePlayerId);
    const turnPlayer = players.find(p => p.id === this.turnPlayerId);
    const myHand = this.hands[forPlayerId] || { whiteCards: [], redCards: [] };
    const myTargetId = this.sabotageAssignments[forPlayerId] || null;
    const myTargetCandidate = myTargetId ? this.candidates[myTargetId] : null;

    // All placed cards on table are 100% PUBLIC to everyone in real-time!
    const publicCandidates = {};
    Object.keys(this.candidates).forEach(mId => {
      const c = this.candidates[mId];
      publicCandidates[mId] = {
        matchmakerId: c.matchmakerId,
        matchmakerName: c.matchmakerName,
        whiteCards: c.whiteCards || [],
        whiteCardsSubmitted: (c.whiteCards || []).length === 2,
        redFlag: c.redFlag || null,
        redFlagSubmitted: c.redFlag !== null,
        sabotagedBy: c.sabotagedBy,
        sabotagedByName: c.sabotagedByName
      };
    });

    // Dynamic hand card counts for all active players
    const handCardCounts = {};
    players.forEach(p => {
      const h = this.hands[p.id] || { whiteCards: [], redCards: [] };
      handCardCounts[p.id] = {
        white: h.whiteCards?.length || 0,
        red: h.redCards?.length || 0,
        total: (h.whiteCards?.length || 0) + (h.redCards?.length || 0)
      };
    });

    return {
      phase: this.phase,
      currentRound: this.currentRound,
      roundLimit: this.roundLimit,
      targetScore: this.roundLimit,
      singlePlayerId: this.singlePlayerId,
      singlePlayerName: singlePlayer ? singlePlayer.name : '',
      isSingle: forPlayerId === this.singlePlayerId,
      turnPlayerId: this.turnPlayerId,
      turnPlayerName: turnPlayer ? turnPlayer.name : '',
      isMyTurn: forPlayerId === this.turnPlayerId,
      scores: this.scores,
      stats: this.stats,
      hand: myHand,
      handCardCounts,
      candidates: publicCandidates,
      mySabotageTarget: myTargetId ? {
        targetPlayerId: myTargetId,
        targetPlayerName: myTargetCandidate ? myTargetCandidate.matchmakerName : '',
        targetCandidate: myTargetCandidate ? {
          whiteCards: myTargetCandidate.whiteCards,
          hasRedFlag: myTargetCandidate.redFlag !== null
        } : null
      } : null,
      roundWinner: this.roundWinner,
      roundWinnerName: this.roundWinner && this.candidates[this.roundWinner] ? this.candidates[this.roundWinner].matchmakerName : null,
      winningCandidate: this.winningCandidate
    };
  }

  // Automated bot move generator
  getBotMove(botId) {
    if (this.phase === PHASES.PERKS && this.turnPlayerId === botId) {
      const hand = this.hands[botId];
      if (hand && hand.whiteCards && hand.whiteCards.length > 0) {
        const candidate = this.candidates[botId];
        const placedCount = candidate?.whiteCards?.length || 0;
        if (placedCount < 2) {
          const randomCard = hand.whiteCards[0];
          return {
            type: 'place_white_card',
            cardId: randomCard.id,
            customText: randomCard.text.includes('_') ? 'efsanevi' : null
          };
        }
      }
    } else if (this.phase === PHASES.SABOTAGE && this.turnPlayerId === botId) {
      const hand = this.hands[botId];
      if (hand && hand.redCards && hand.redCards.length > 0) {
        const randomCard = hand.redCards[0];
        return {
          type: 'submit_sabotage',
          cardId: randomCard.id,
          customText: randomCard.text.includes('_') ? 'rezil' : null
        };
      }
    } else if (this.phase === PHASES.VOTING && this.singlePlayerId === botId) {
      const candidateIds = Object.keys(this.candidates);
      if (candidateIds.length > 0) {
        const randomTarget = candidateIds[Math.floor(Math.random() * candidateIds.length)];
        return {
          type: 'select_winner',
          winningMatchmakerId: randomTarget
        };
      }
    }
    return null;
  }
}
