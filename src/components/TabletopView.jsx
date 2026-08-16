import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock } from 'lucide-react';
import CardItem from './CardItem';
import { sounds } from '../services/soundEffects';
import redCardBackImg from '../assets/cards/card_red_back.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';

// Fanned Card Backs for Opponents
function OpponentHandFanned({ count = 7 }) {
  const cards = Array.from({ length: Math.min(count, 8) });
  const mid = (cards.length - 1) / 2;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '90px',
      position: 'relative',
      width: `${cards.length * 20 + 70}px`,
      margin: '0 auto 10px auto'
    }}>
      {cards.map((_, i) => {
        const offset = i - mid;
        const rot = offset * 4.5;
        const translateY = Math.abs(offset) * 3;
        const isWhiteBack = i >= 4;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${i * 20}px`,
              width: '65px',
              aspectRatio: '5 / 7',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              border: '1px solid rgba(0,0,0,0.2)'
            }}
          >
            <img
              src={isWhiteBack ? whiteCardBackImg : redCardBackImg}
              alt="card back"
              style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Single Player Deck Stack on Table
function SingleDeckStack() {
  return (
    <div style={{
      position: 'relative',
      width: '90px',
      aspectRatio: '5 / 7',
      margin: '0 auto'
    }}>
      {/* 3D stacked shadow card layers */}
      <div style={{
        position: 'absolute',
        inset: '6px -6px -6px 6px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      <div style={{
        position: 'absolute',
        inset: '3px -3px -3px 3px',
        background: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      {/* Top Deck Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
        border: '1px solid rgba(0,0,0,0.2)',
        zIndex: 3
      }}>
        <img
          src={redCardBackImg}
          alt="deck"
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
        />
      </div>
    </div>
  );
}

// 3 Dashed Table Drop Slots for each matchmaker candidate
function TableSlotsRow({
  candidate,
  isMySlots,
  isTarget,
  phase,
  canDropWhite,
  canDropRed,
  onDropCard,
  onSelectWinner,
  isSingle,
  isWinner
}) {
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const white1 = candidate?.whiteCards?.[0];
  const white2 = candidate?.whiteCards?.[1];
  const redFlag = candidate?.redFlag;

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (isMySlots && (index === 0 || index === 1) && canDropWhite) {
      setDragOverIndex(index);
    } else if (isTarget && index === 2 && canDropRed) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);
    const cardId = e.dataTransfer.getData('cardId');
    const cardType = e.dataTransfer.getData('cardType');

    if (!cardId) return;

    if (isMySlots && (index === 0 || index === 1) && cardType === 'perk') {
      onDropCard('white', cardId, index);
    } else if (isTarget && index === 2 && cardType === 'redflag') {
      onDropCard('red', cardId, 2);
    }
  };

  const isVoting = (phase === 'VOTING' || phase === 'REVEAL') && isSingle;

  return (
    <div
      onClick={() => isVoting && onSelectWinner && onSelectWinner(candidate?.matchmakerId)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        maxWidth: '380px',
        margin: '0 auto',
        padding: '10px',
        borderRadius: '16px',
        background: isWinner
          ? 'rgba(16, 185, 129, 0.15)'
          : (isTarget ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 0, 0, 0.25)'),
        border: isWinner
          ? '2px solid #10b981'
          : (isVoting ? '2px dashed #f59e0b' : '1px solid rgba(255,255,255,0.08)'),
        cursor: isVoting ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isWinner ? '0 0 25px rgba(16, 185, 129, 0.4)' : 'none'
      }}
    >
      {/* Slot 1: White Perk 1 */}
      <div
        onDragOver={(e) => handleDragOver(e, 0)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 0)}
        style={{
          aspectRatio: '5 / 7',
          borderRadius: '12px',
          border: white1 ? 'none' : (dragOverIndex === 0 ? '2px dashed #38bdf8' : '2px dashed rgba(255,255,255,0.22)'),
          background: dragOverIndex === 0 ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {white1 ? (
          <CardItem card={white1} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            {isMySlots ? '1. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 2: White Perk 2 */}
      <div
        onDragOver={(e) => handleDragOver(e, 1)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 1)}
        style={{
          aspectRatio: '5 / 7',
          borderRadius: '12px',
          border: white2 ? 'none' : (dragOverIndex === 1 ? '2px dashed #38bdf8' : '2px dashed rgba(255,255,255,0.22)'),
          background: dragOverIndex === 1 ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {white2 ? (
          <CardItem card={white2} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            {isMySlots ? '2. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 3: Red Flag Sabotage */}
      <div
        onDragOver={(e) => handleDragOver(e, 2)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 2)}
        style={{
          aspectRatio: '5 / 7',
          borderRadius: '12px',
          border: redFlag ? 'none' : (dragOverIndex === 2 ? '2px dashed #ef4444' : (isTarget && canDropRed ? '2px dashed #ef4444' : '2px dashed rgba(255,255,255,0.22)')),
          background: dragOverIndex === 2 ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {redFlag ? (
          <CardItem card={redFlag} type="redflag" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.68rem', color: isTarget && canDropRed ? '#f87171' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            {isTarget && canDropRed ? 'kırmızı koy' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TabletopView({
  room,
  gameState,
  player,
  onSubmitPerks,
  onSubmitSabotage,
  onSelectWinner
}) {
  const {
    phase,
    singlePlayerId,
    singlePlayerName,
    isSingle,
    candidates = {},
    mySabotageTarget,
    hand = { whiteCards: [], redCards: [] },
    roundWinner,
    roundWinnerName,
    timeLeft
  } = gameState || {};

  const players = room.players || [];
  const myCandidate = candidates[player.id];

  // Local pending placed white cards (for instant drag & drop feedback)
  const [localWhitePlaced, setLocalWhitePlaced] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  useEffect(() => {
    setLocalWhitePlaced([]);
  }, [phase]);

  // Handle Dragging from hand
  const handleCardDragStart = (e, card, type) => {
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardType', type);
    setDraggedCard({ card, type });
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  // Drop card into table slot
  const handleDropCard = (type, cardId, slotIndex) => {
    sounds.playCardDeal();

    if (type === 'white' && phase === 'PERKS') {
      const current = localWhitePlaced.filter(id => id !== cardId);
      const updated = [...current, cardId];
      setLocalWhitePlaced(updated);

      // When 2 white cards are placed, submit Perks automatically
      if (updated.length === 2) {
        onSubmitPerks(updated);
      }
    } else if (type === 'red' && phase === 'SABOTAGE') {
      onSubmitSabotage(cardId);
    }
  };

  // Card click (alternative to drag & drop for touch or easy click)
  const handleCardClick = (card, type) => {
    sounds.playClick();
    if (type === 'perk' && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted) {
      if (localWhitePlaced.includes(card.id)) {
        setLocalWhitePlaced(localWhitePlaced.filter(id => id !== card.id));
      } else {
        const next = localWhitePlaced.length < 2 ? [...localWhitePlaced, card.id] : [localWhitePlaced[0], card.id];
        setLocalWhitePlaced(next);
        if (next.length === 2) {
          sounds.playCardDeal();
          onSubmitPerks(next);
        }
      }
    } else if (type === 'redflag' && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag) {
      sounds.playSabotage();
      onSubmitSabotage(card.id);
    }
  };

  // Available cards in hand (excluding already placed ones)
  const availableWhiteCards = (hand.whiteCards || []).filter(c => !localWhitePlaced.includes(c.id));
  const availableRedCards = hand.redCards || [];

  // Identify Opponents & Bekâr
  const singlePlayer = players.find(p => p.id === singlePlayerId);
  const opponentMatchmakers = players.filter(p => p.id !== singlePlayerId && p.id !== player.id);

  // Merge placed cards into local candidate view
  const myRenderCandidate = {
    ...myCandidate,
    whiteCards: myCandidate?.whiteCards?.length === 2
      ? myCandidate.whiteCards
      : localWhitePlaced.map(id => (hand.whiteCards || []).find(c => c.id === id)).filter(Boolean)
  };

  const canDropWhite = phase === 'PERKS' && !isSingle && !myCandidate?.whiteCardsSubmitted;
  const canDropRed = phase === 'SABOTAGE' && !isSingle && !mySabotageTarget?.targetCandidate?.hasRedFlag;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 35%, #242424 0%, #171717 60%, #0d0d0d 100%)',
      color: '#ffffff',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Top Floating Status Info */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* Phase Announcement */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: phase === 'VOTING' ? '#f59e0b' : '#ff0000',
            color: phase === 'VOTING' ? '#000' : '#fff',
            fontSize: '0.74rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '9999px',
            textTransform: 'lowercase'
          }}>
            {phase === 'PERKS' && '1. aşama: aday hazırlama'}
            {phase === 'SABOTAGE' && '2. aşama: sabotaj / kırmızı bayrak'}
            {(phase === 'REVEAL' || phase === 'VOTING') && '3. aşama: bekârın kararı'}
            {phase === 'ROUND_SUMMARY' && 'tur tamamlandı'}
          </span>

          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'lowercase' }}>
            {phase === 'PERKS' && (isSingle ? 'çöpçatanlar senin için aday hazırlıyor...' : '2 beyaz kartı masadaki yuvana sürükle')}
            {phase === 'SABOTAGE' && (isSingle ? 'çöpçatanlar kırmızı bayrak koyuyor...' : `kırmızı kartı ${mySabotageTarget?.targetPlayerName || 'rakibin'} masasına sürükle`)}
            {phase === 'VOTING' && (isSingle ? 'adayları incele ve kazanana tıkla!' : 'bekâr kararını veriyor...')}
            {phase === 'ROUND_SUMMARY' && `kazanan: ${roundWinnerName}!`}
          </span>
        </div>

        {/* Timer Pill */}
        {timeLeft > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: timeLeft <= 10 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
            color: timeLeft <= 10 ? '#ef4444' : '#fff',
            padding: '4px 12px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: '0.95rem'
          }}>
            <Clock size={14} />
            <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>
        )}
      </div>

      {/* Virtual Table Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 20px 240px 20px',
        maxWidth: '1350px',
        margin: '0 auto',
        width: '100%'
      }}>

        {/* TOP ROW: Opponents & Bekâr Seated Around Table */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Bekâr Player Zone (if opponent) */}
          {!isSingle && singlePlayer && (
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'lowercase'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                <span>{singlePlayer.name}</span>
                <span title="bekâr">👑</span>
              </div>
              <SingleDeckStack />
            </div>
          )}

          {/* Opponent Matchmakers */}
          {opponentMatchmakers.map((opp) => {
            const oppCandidate = candidates[opp.id];
            const isTarget = mySabotageTarget?.targetPlayerId === opp.id;
            const isWinner = roundWinner === opp.id;

            return (
              <div key={opp.id} style={{ textAlign: 'center', minWidth: '320px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'lowercase'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: opp.color || '#a855f7' }} />
                  <span>{opp.name}</span>
                  {isTarget && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 700
                    }}>
                      sabotaj hedefin
                    </span>
                  )}
                  {isWinner && <Crown size={14} color="#10b981" />}
                </div>

                {/* Opponent's Fanned Hand Backs */}
                <OpponentHandFanned count={7} />

                {/* Opponent's 3 Table Slots */}
                <TableSlotsRow
                  candidate={oppCandidate}
                  isMySlots={false}
                  isTarget={isTarget}
                  phase={phase}
                  canDropWhite={false}
                  canDropRed={canDropRed}
                  onDropCard={handleDropCard}
                  onSelectWinner={onSelectWinner}
                  isSingle={isSingle}
                  isWinner={isWinner}
                />
              </div>
            );
          })}
        </div>

        {/* BOTTOM ROW: Local Player's Zone & Slots */}
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          {isSingle ? (
            // Bekâr Local Player Deck on table
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#fbbf24',
                textTransform: 'lowercase'
              }}>
                <Crown size={16} />
                <span>bu tur bekârsın ({player.name})</span>
              </div>
              <SingleDeckStack />
            </div>
          ) : (
            // Matchmaker Local Player 3 Slots
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.88rem',
                fontWeight: 700,
                textTransform: 'lowercase'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: player.color || '#38bdf8' }} />
                <span>{player.name} (senin masan)</span>
                {roundWinner === player.id && <Crown size={14} color="#10b981" />}
              </div>

              <TableSlotsRow
                candidate={myRenderCandidate}
                isMySlots={true}
                isTarget={false}
                phase={phase}
                canDropWhite={canDropWhite}
                canDropRed={false}
                onDropCard={handleDropCard}
                onSelectWinner={onSelectWinner}
                isSingle={isSingle}
                isWinner={roundWinner === player.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* FIXED BOTTOM FANNED HAND (Interactive Drag & Drop Tray) */}
      {!isSingle && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '210px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '12px',
          pointerEvents: 'none',
          zIndex: 80
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative',
            pointerEvents: 'auto',
            height: '100%',
            maxWidth: '900px',
            width: '100%'
          }}>
            {/* All Hand Cards in Fanned Arc */}
            {[
              ...availableWhiteCards.map(c => ({ card: c, type: 'perk' })),
              ...availableRedCards.map(c => ({ card: c, type: 'redflag' }))
            ].map((item, idx, arr) => {
              const mid = (arr.length - 1) / 2;
              const offset = idx - mid;
              const rot = offset * 3.5;
              const translateY = Math.abs(offset) * 4;
              const isHovered = hoveredCardId === item.card.id;
              const isPerk = item.type === 'perk';

              return (
                <div
                  key={item.card.id}
                  draggable={true}
                  onDragStart={(e) => handleCardDragStart(e, item.card, item.type)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => handleCardClick(item.card, item.type)}
                  onMouseEnter={() => setHoveredCardId(item.card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    position: 'relative',
                    width: '130px',
                    marginRight: '-42px',
                    cursor: 'grab',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), z-index 0.2s ease',
                    transform: isHovered
                      ? `translateY(-36px) scale(1.18) rotate(0deg)`
                      : `translateY(${translateY}px) rotate(${rot}deg)`,
                    zIndex: isHovered ? 50 : idx + 1,
                    filter: isHovered ? (isPerk ? 'drop-shadow(0 0 16px #38bdf8)' : 'drop-shadow(0 0 18px #ef4444)') : 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'
                  }}
                  title="masaya sürükle veya tıkla"
                >
                  <CardItem card={item.card} type={item.type} isSmall={true} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
