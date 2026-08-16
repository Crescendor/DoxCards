// Automated End-to-End Simulation Test for Red Flags (DoxCards)
import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function runTest() {
  console.log('🚀 Starting Red Flags Simulation Test with 3 Players...');

  // Create 3 player socket connections
  const p1 = io(SERVER_URL);
  const p2 = io(SERVER_URL);
  const p3 = io(SERVER_URL);

  const player1 = { id: 'p1_id', name: 'Burak (Host)', avatar: '👑', color: '#ef4444' };
  const player2 = { id: 'p2_id', name: 'Ahmet (Çöpçatan 1)', avatar: '🤠', color: '#3b82f6' };
  const player3 = { id: 'p3_id', name: 'Zeynep (Çöpçatan 2)', avatar: '🦄', color: '#10b981' };

  await new Promise(r => setTimeout(r, 500));

  let roomCode = null;

  // 1. Host creates room
  await new Promise((resolve) => {
    p1.emit('create_room', { player: player1, settings: { targetScore: 3, roundTimerDuration: 0 } }, (res) => {
      console.log('✅ Room created:', res);
      roomCode = res.roomCode;
      resolve();
    });
  });

  if (!roomCode || roomCode.length !== 5) {
    throw new Error(`Invalid room code generated: ${roomCode}`);
  }
  console.log(`✅ 5-digit room code verified: ${roomCode}`);

  // 2. Player 2 joins room
  await new Promise((resolve) => {
    p2.emit('join_room', { roomCode, player: player2 }, (res) => {
      console.log('✅ Player 2 joined room:', res.player.name);
      resolve();
    });
  });

  // 3. Player 3 joins room
  await new Promise((resolve) => {
    p3.emit('join_room', { roomCode, player: player3 }, (res) => {
      console.log('✅ Player 3 joined room:', res.player.name);
      resolve();
    });
  });

  // 4. Start Game
  let p1State = null;
  let p2State = null;
  let p3State = null;

  p1.on('game_state_update', (d) => { p1State = d.gameState; });
  p2.on('game_state_update', (d) => { p2State = d.gameState; });
  p3.on('game_state_update', (d) => { p3State = d.gameState; });

  await new Promise((resolve) => {
    p1.emit('start_game', { roomCode, playerId: player1.id }, (res) => {
      console.log('✅ Game started by host:', res);
      resolve();
    });
  });

  await new Promise(r => setTimeout(r, 500));

  console.log(`✅ Round #${p1State.currentRound} Phase: ${p1State.phase}`);
  console.log(`👑 Single (Bekâr): ${p1State.singlePlayerName}`);

  // 5. Matchmakers submit 2 white cards
  const matchmakers = [
    { sock: p2, player: player2, state: () => p2State },
    { sock: p3, player: player3, state: () => p3State }
  ];

  for (const mm of matchmakers) {
    const s = mm.state();
    if (!s.isSingle) {
      const cardsToPlay = s.hand.whiteCards.slice(0, 2).map(c => c.id);
      console.log(`🃏 ${mm.player.name} submitting 2 White Cards:`, cardsToPlay);
      await new Promise((resolve) => {
        mm.sock.emit('submit_perks', { roomCode, playerId: mm.player.id, cardIds: cardsToPlay }, (res) => {
          console.log(`✅ ${mm.player.name} Perks submitted!`);
          resolve();
        });
      });
    }
  }

  await new Promise(r => setTimeout(r, 500));

  console.log(`✅ Moved to Phase: ${p1State.phase}`);
  if (p1State.phase !== 'SABOTAGE') {
    throw new Error(`Expected SABOTAGE phase, got ${p1State.phase}`);
  }

  // 6. Matchmakers submit 1 Red Flag sabotage
  for (const mm of matchmakers) {
    const s = mm.state();
    if (!s.isSingle) {
      const cardToPlay = s.hand.redCards[0].id;
      console.log(`🚩 ${mm.player.name} sabotaging ${s.mySabotageTarget.targetPlayerName} with card: ${cardToPlay}`);
      await new Promise((resolve) => {
        mm.sock.emit('submit_sabotage', { roomCode, playerId: mm.player.id, cardId: cardToPlay }, (res) => {
          console.log(`✅ ${mm.player.name} Red Flag submitted!`);
          resolve();
        });
      });
    }
  }

  await new Promise(r => setTimeout(r, 500));

  console.log(`✅ Moved to Phase: ${p1State.phase}`);

  // 7. Single selects winner
  console.log(`👑 Bekâr (${player1.name}) selecting candidate of ${player2.name}...`);
  await new Promise((resolve) => {
    p1.emit('bekar_select_winner', {
      roomCode,
      singlePlayerId: player1.id,
      winningMatchmakerId: player2.id
    }, (res) => {
      console.log('✅ Winner selected result:', res);
      resolve();
    });
  });

  await new Promise(r => setTimeout(r, 500));

  console.log(`🎉 Round Winner: ${p1State.roundWinnerName}`);
  console.log(`🏆 Updated Scores:`, p1State.scores);

  if (p1State.scores[player2.id] !== 1) {
    throw new Error(`Expected Player 2 to have 1 point, got ${p1State.scores[player2.id]}`);
  }

  console.log('🌟 ALL MULTIPLAYER GAME LOOP TESTS PASSED PERFECTLY!');

  p1.disconnect();
  p2.disconnect();
  p3.disconnect();
  process.exit(0);
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
