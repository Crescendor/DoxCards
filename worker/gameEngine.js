// Game Engine for Red Flags (DoxCards)
import { getDeck } from './cards.js';

export const PHASES = {
  LOBBY: 'LOBBY',
  PERKS: 'PERKS',                 // Çöpçatanlar 2 Beyaz Kart seçiyor
  SABOTAGE: 'SABOTAGE',           // Çöpçatanlar rakip adaya 1 Kırmızı Kart koyuyor
  REVEAL: 'REVEAL',               // Masada tüm adaylar açılıyor & tartışma
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

    // Player hands: { [playerId]: { whiteCards: [], redCards: [] } }
    this.hands = {};
    // Player scores: { [playerId]: number }
    this.scores = {};
    // Sabotages made & received stats
    this.stats = {};

    // Candidates in current round:
    // { [matchmakerId]: {
    //     matchmakerId,
    //     matchmakerName,
    //     whiteCards: [card1, card2],
    //     redFlag: card | null,
    //     sabotagedBy: playerId | null,
    //     sabotagedByName: string | null
    //   }
    // }
    this.candidates = {};

    // Sabotage assignments: { [saboteurId]: targetMatchmakerId }
    this.sabotageAssignments = {};

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
        // Reshuffle discard pile if empty
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

    // Determine Bekâr (Single)
    const activePlayers = players.filter(p => p.connected !== false);
    if (this.singleIndex >= activePlayers.length) {
      this.singleIndex = 0;
    }
    const single = activePlayers[this.singleIndex];
    this.singlePlayerId = single.id;

    // Get matchmakers (all active players except single)
    const matchmakers = activePlayers.filter(p => p.id !== this.singlePlayerId);

    // If 2 players, single + 1 matchmaker, matchmaker sabotages their own candidate or system red card
    // For 3+ players, circular sabotage assignment:
    // matchmaker[i] sabotages matchmaker[(i + 1) % matchmakers.length]
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

    // Make sure all matchmakers have full hands (4 white, 3 red)
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
    if (playerId === this.singlePlayerId) return false;
    if (!this.candidates[playerId]) return false;
    if (!Array.isArray(cardIds) || cardIds.length !== 2) return false;

    const hand = this.hands[playerId];
    if (!hand) return false;

    // Find cards in hand
    const selectedCards = hand.whiteCards.filter(c => cardIds.includes(c.id));
    if (selectedCards.length !== 2) return false;

    // Remove from hand
    hand.whiteCards = hand.whiteCards.filter(c => !cardIds.includes(c.id));
    this.discardPile.white.push(...selectedCards);

    // Assign to candidate
    this.candidates[playerId].whiteCards = selectedCards;

    // Check if all matchmakers submitted
    const matchmakerIds = Object.keys(this.candidates);
    const allSubmitted = matchmakerIds.every(id => this.candidates[id].whiteCards.length === 2);

    if (allSubmitted) {
      this.clearTimer();
      this.phase = PHASES.SABOTAGE;
      this.startTimer(this.roundTimerDuration, () => {
        this.autoSubmitSabotage(matchmakerIds);
      });
    }

    return true;
  }

  autoSubmitPerks(matchmakers) {
    matchmakers.forEach(m => {
      if (this.candidates[m.id] && this.candidates[m.id].whiteCards.length < 2) {
        const hand = this.hands[m.id];
        if (hand && hand.whiteCards.length >= 2) {
          const chosen = hand.whiteCards.slice(0, 2);
          this.submitPerks(m.id, chosen.map(c => c.id));
        }
      }
    });
  }

  submitSabotage(playerId, cardId, players) {
    if (this.phase !== PHASES.SABOTAGE) return false;
    if (playerId === this.singlePlayerId) return false;

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
    this.candidates[targetId].sabotagedByName = player ? player.name : 'Bilinmeyen';

    if (this.stats[playerId]) {
      this.stats[playerId].sabotagesGiven++;
    }

    // Check if all candidates received a red flag
    const matchmakerIds = Object.keys(this.candidates);
    const allSabotaged = matchmakerIds.every(id => this.candidates[id].redFlag !== null);

    if (allSabotaged) {
      this.clearTimer();
      this.phase = PHASES.REVEAL;
      // Reveal & pitch phase: give 10 seconds or allow Bekâr to move to voting
      this.startTimer(15, () => {
        this.phase = PHASES.VOTING;
        this.startTimer(this.roundTimerDuration, () => {
          this.autoSelectWinner(matchmakerIds);
        });
        if (this.onStateChange) this.onStateChange();
      });
    }

    return true;
  }

  autoSubmitSabotage(matchmakerIds) {
    matchmakerIds.forEach(mId => {
      const targetId = this.sabotageAssignments[mId];
      if (this.candidates[targetId] && !this.candidates[targetId].redFlag) {
        const hand = this.hands[mId];
        if (hand && hand.redCards.length > 0) {
          const card = hand.redCards[0];
          this.submitSabotage(mId, card.id, []);
        }
      }
    });
  }

  bekarSelectWinner(singlePlayerId, winningMatchmakerId, players) {
    if (this.phase !== PHASES.VOTING && this.phase !== PHASES.REVEAL) return false;
    if (singlePlayerId !== this.singlePlayerId) return false;
    if (!this.candidates[winningMatchmakerId]) return false;

    this.clearTimer();
    this.roundWinner = winningMatchmakerId;
    this.winningCandidate = this.candidates[winningMatchmakerId];

    // Award point
    this.scores[winningMatchmakerId] = (this.scores[winningMatchmakerId] || 0) + 1;
    if (this.stats[winningMatchmakerId]) {
      this.stats[winningMatchmakerId].wins++;
    }

    // Check if game over
    const wonGame = this.scores[winningMatchmakerId] >= this.targetScore;
    if (wonGame) {
      this.phase = PHASES.GAME_OVER;
    } else {
      this.phase = PHASES.ROUND_SUMMARY;
      // Auto start next round after 7 seconds
      this.startTimer(7, () => {
        this.singleIndex++;
        this.startRound(players);
        if (this.onStateChange) this.onStateChange();
      });
    }

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

  // Get sanitized state for client
  getGameState(forPlayerId, players) {
    const singlePlayer = players.find(p => p.id === this.singlePlayerId);
    const myHand = this.hands[forPlayerId] || { whiteCards: [], redCards: [] };
    const myTargetId = this.sabotageAssignments[forPlayerId] || null;
    const myTargetCandidate = myTargetId ? this.candidates[myTargetId] : null;

    // Filter candidates depending on phase to keep white cards secret until Reveal (or show for maker)
    const publicCandidates = {};
    Object.keys(this.candidates).forEach(mId => {
      const c = this.candidates[mId];
      const isMe = (mId === forPlayerId);
      const isRevealed = (this.phase === PHASES.REVEAL || this.phase === PHASES.VOTING || this.phase === PHASES.ROUND_SUMMARY || this.phase === PHASES.GAME_OVER);

      publicCandidates[mId] = {
        matchmakerId: c.matchmakerId,
        matchmakerName: c.matchmakerName,
        // In PERKS or SABOTAGE phase, hide cards unless it's the owner or revealed
        whiteCards: (isRevealed || isMe) ? c.whiteCards : c.whiteCards.map(() => ({ id: 'hidden', text: 'Gizli Beyaz Kart', hidden: true })),
        whiteCardsSubmitted: c.whiteCards.length === 2,
        redFlag: isRevealed ? c.redFlag : (c.redFlag ? { id: 'hidden', text: 'Kırmızı Bayrak Eklendi!', hidden: true } : null),
        redFlagSubmitted: c.redFlag !== null,
        sabotagedBy: isRevealed ? c.sabotagedBy : null,
        sabotagedByName: isRevealed ? c.sabotagedByName : null
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
