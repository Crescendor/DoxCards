// Game Engine for Red Flags (DoxCards) - Turn-Based Sequential Tabletop Engine
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
    this.targetScore = settings.targetScore || 3;
    this.roundTimerDuration = settings.roundTimerDuration || 45; // seconds (0 for no limit)
    this.deckType = settings.deckType || 'all';

    this.phase = PHASES.LOBBY;
    this.currentRound = 0;
    this.singleIndex = 0; // Bekâr indexi
    this.singlePlayerId = null;

    this.deck = { white: [], red: [] };
    this.discardPile = { white: [], red: [] };

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
    this.timeLeft = 0;
    this.onStateChange = null;
  }

  initDecks() {
    this.deck = getDeck(this.deckType);
    this.discardPile = { white: [], red: [] };
  }

  drawCards(type, count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      if (this.deck[type].length === 0) {
        if (this.discardPile[type].length > 0) {
          this.deck[type] = [...this.discardPile[type]].sort(() => Math.random() - 0.5);
          this.discardPile[type] = [];
        }
      }
      if (this.deck[type].length > 0) {
        cards.push(this.deck[type].pop());
      }
    }
    return cards;
  }

  startGame(players) {
    if (players.length < 2) {
      throw new Error('Oyunu başlatmak için en az 2 oyuncu gerekli!');
    }

    this.initDecks();
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

    // Replenish hands to 4 white, 3 red
    matchmakers.forEach(m => {
      const hand = this.hands[m.id];
      if (hand) {
        while (hand.whiteCards.length < 4) {
          const newCard = this.drawCards('white', 1);
          if (newCard.length) hand.whiteCards.push(newCard[0]);
          else break;
        }
        while (hand.redCards.length < 3) {
          const newCard = this.drawCards('red', 1);
          if (newCard.length) hand.redCards.push(newCard[0]);
          else break;
        }
      }
    });

    this.phase = PHASES.PERKS;
    this.startTimer(this.roundTimerDuration, () => {
      this.autoSubmitPerks(matchmakers);
    });
  }

  submitPerks(playerId, cardIds) {
    if (this.phase !== PHASES.PERKS) return false;
    if (playerId !== this.turnPlayerId) return false; // Strictly enforce turn order!
    if (!this.candidates[playerId]) return false;
    if (!Array.isArray(cardIds) || cardIds.length !== 2) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    const selectedCards = hand.whiteCards.filter(c => cardIds.includes(c.id));
    if (selectedCards.length !== 2) return false;

    // Remove from hand and save to candidate
    hand.whiteCards = hand.whiteCards.filter(c => !cardIds.includes(c.id));
    this.discardPile.white.push(...selectedCards);
    this.candidates[playerId].whiteCards = selectedCards;

    // Advance turn to next matchmaker in sequence
    this.turnIndex++;
    if (this.turnIndex < this.turnOrder.length) {
      this.turnPlayerId = this.turnOrder[this.turnIndex];
      this.startTimer(this.roundTimerDuration, () => {
        this.autoSubmitCurrentPerks();
      });
    } else {
      // All matchmakers placed perks -> Advance to SABOTAGE phase
      this.clearTimer();
      this.phase = PHASES.SABOTAGE;
      this.turnIndex = 0;
      this.turnPlayerId = this.turnOrder[0] || null;
      this.startTimer(this.roundTimerDuration, () => {
        this.autoSubmitCurrentSabotage();
      });
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  autoSubmitCurrentPerks() {
    const pId = this.turnPlayerId;
    if (pId && this.candidates[pId] && this.candidates[pId].whiteCards.length < 2) {
      const hand = this.hands[pId];
      if (hand && hand.whiteCards.length >= 2) {
        this.submitPerks(pId, hand.whiteCards.slice(0, 2).map(c => c.id));
      }
    }
  }

  autoSubmitPerks(matchmakers) {
    this.autoSubmitCurrentPerks();
  }

  submitSabotage(playerId, cardId, players) {
    if (this.phase !== PHASES.SABOTAGE) return false;
    if (playerId !== this.turnPlayerId) return false; // Strictly enforce turn order!

    const targetId = this.sabotageAssignments[playerId];
    if (!targetId || !this.candidates[targetId]) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    const cardIndex = hand.redCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const redCard = hand.redCards.splice(cardIndex, 1)[0];
    this.discardPile.red.push(redCard);

    const player = players.find(p => p.id === playerId);
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
      this.startTimer(this.roundTimerDuration, () => {
        this.autoSubmitCurrentSabotage();
      });
    } else {
      // All sabotages placed -> Advance to VOTING
      this.clearTimer();
      this.phase = PHASES.VOTING;
      this.turnPlayerId = this.singlePlayerId; // Turn passes to the Bekâr!
      this.startTimer(this.roundTimerDuration || 60, () => {
        this.autoSelectWinner(this.turnOrder);
      });
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  autoSubmitCurrentSabotage() {
    const pId = this.turnPlayerId;
    if (pId) {
      const targetId = this.sabotageAssignments[pId];
      if (this.candidates[targetId] && !this.candidates[targetId].redFlag) {
        const hand = this.hands[pId];
        if (hand && hand.redCards.length > 0) {
          this.submitSabotage(pId, hand.redCards[0].id, []);
        }
      }
    }
  }

  bekarSelectWinner(singlePlayerId, winningMatchmakerId, players) {
    if (this.phase !== PHASES.VOTING && this.phase !== PHASES.REVEAL) return false;
    if (singlePlayerId !== this.singlePlayerId) return false;
    if (!this.candidates[winningMatchmakerId]) return false;

    this.clearTimer();
    this.roundWinner = winningMatchmakerId;
    this.winningCandidate = this.candidates[winningMatchmakerId];

    this.scores[winningMatchmakerId] = (this.scores[winningMatchmakerId] || 0) + 1;
    if (this.stats[winningMatchmakerId]) {
      this.stats[winningMatchmakerId].wins++;
    }

    const wonGame = this.scores[winningMatchmakerId] >= this.targetScore;
    if (wonGame) {
      this.phase = PHASES.GAME_OVER;
    } else {
      this.phase = PHASES.ROUND_SUMMARY;
      this.startTimer(7, () => {
        this.singleIndex++;
        this.startRound(players);
        if (this.onStateChange) this.onStateChange();
      });
    }

    if (this.onStateChange) this.onStateChange();
    return true;
  }

  autoSelectWinner(matchmakerIds) {
    if (matchmakerIds.length > 0) {
      const randomWinner = matchmakerIds[Math.floor(Math.random() * matchmakerIds.length)];
      this.bekarSelectWinner(this.singlePlayerId, randomWinner, []);
    }
  }

  startTimer(seconds, onExpire) {
    this.clearTimer();
    if (!seconds || seconds <= 0) return;
    this.timeLeft = seconds;

    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        if (onExpire) onExpire();
      }
      if (this.onStateChange) this.onStateChange();
    }, 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
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

    return {
      phase: this.phase,
      currentRound: this.currentRound,
      targetScore: this.targetScore,
      timeLeft: this.timeLeft,
      singlePlayerId: this.singlePlayerId,
      singlePlayerName: singlePlayer ? singlePlayer.name : '',
      isSingle: forPlayerId === this.singlePlayerId,
      turnPlayerId: this.turnPlayerId,
      turnPlayerName: turnPlayer ? turnPlayer.name : '',
      isMyTurn: forPlayerId === this.turnPlayerId,
      scores: this.scores,
      stats: this.stats,
      hand: myHand,
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
}
