import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock, ArrowRight, UserCheck } from 'lucide-react';
import CardItem from './CardItem';
import FillBlankModal, { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';
import redCardBackImg from '../assets/cards/card_red_back.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';
import defaultAvatarImg from '../assets/default_avatar.png';

// Fanned Card Backs for Opponents
function OpponentHandFanned({ count = 7 }) {
  const cards = Array.from({ length: Math.min(count, 8) });
  const mid = (cards.length - 1) / 2;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '110px',
      position: 'relative',
      width: `${cards.length * 24 + 80}px`,
      margin: '0 auto 12px auto'
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
              left: `${i * 24}px`,
              width: '78px',
              aspectRatio: '5 / 7',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              border: '1px solid rgba(0,0,0,0.25)'
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

// Single Player 3D Deck Stack on Table
function SingleDeckStack() {
  return (
    <div style={{
      position: 'relative',
      width: '105px',
      aspectRatio: '5 / 7',
      margin: '0 auto'
    }}>
      {/* 3D stacked shadow card layers */}
      <div style={{
        position: 'absolute',
        inset: '8px -8px -8px 8px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      <div style={{
        position: 'absolute',
        inset: '4px -4px -4px 4px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      {/* Top Deck Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0,0,0,0.65)',
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
  isMyTurn,
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
    if (!isMyTurn) return;
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
    if (!isMyTurn) return;

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
        maxWidth: '440px',
        margin: '0 auto',
        padding: '12px',
        borderRadius: '18px',
        background: isWinner
          ? 'rgba(16, 185, 129, 0.15)'
          : (isTarget && canDropRed && isMyTurn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 0, 0, 0.3)'),
        border: isWinner
          ? '2px solid #10b981'
          : (isVoting ? '2px dashed #f59e0b' : (isTarget && canDropRed && isMyTurn ? '2px dashed #ef4444' : '1px solid rgba(255,255,255,0.1)')),
        cursor: isVoting ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        boxShadow: isWinner
          ? '0 0 25px rgba(16, 185, 129, 0.45)'
          : (isTarget && canDropRed && isMyTurn ? '0 0 20px rgba(239, 68, 68, 0.35)' : 'none')
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
          border: white1 ? 'none' : (dragOverIndex === 0 ? '2px dashed #38bdf8' : (isMySlots && canDropWhite && isMyTurn ? '2px dashed #38bdf8' : '2px dashed rgba(255,255,255,0.22)')),
          background: dragOverIndex === 0 ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {white1 ? (
          <CardItem card={white1} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.72rem', color: isMySlots && canDropWhite && isMyTurn ? '#38bdf8' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
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
          border: white2 ? 'none' : (dragOverIndex === 1 ? '2px dashed #38bdf8' : (isMySlots && canDropWhite && isMyTurn ? '2px dashed #38bdf8' : '2px dashed rgba(255,255,255,0.22)')),
          background: dragOverIndex === 1 ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {white2 ? (
          <CardItem card={white2} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.72rem', color: isMySlots && canDropWhite && isMyTurn ? '#38bdf8' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
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
          border: redFlag ? 'none' : (dragOverIndex === 2 ? '2px dashed #ef4444' : (isTarget && canDropRed && isMyTurn ? '2px dashed #ef4444' : '2px dashed rgba(255,255,255,0.22)')),
          background: dragOverIndex === 2 ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {redFlag ? (
          <CardItem card={redFlag} type="redflag" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.72rem', color: isTarget && canDropRed && isMyTurn ? '#f87171' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            {isTarget && canDropRed ? (isMyTurn ? 'kırmızı koy' : 'sabotaj') : ''}
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
    turnPlayerId,
    turnPlayerName,
    isMyTurn,
    candidates = {},
    mySabotageTarget,
    hand = { whiteCards: [], redCards: [] },
    roundWinner,
    roundWinnerName,
    timeLeft
  } = gameState || {};

  const players = room.players || [];
  const myCandidate = candidates[player.id];

  // Local pending placed white cards & custom blank texts
  const [localWhitePlaced, setLocalWhitePlaced] = useState([]);
  const [customTexts, setCustomTexts] = useState({});
  const [fillModalState, setFillModalState] = useState({ isOpen: false, card: null, onConfirm: null });
  const [draggedCard, setDraggedCard] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  useEffect(() => {
    setLocalWhitePlaced([]);
    setCustomTexts({});
  }, [phase, turnPlayerId]);

  // Drag start
  const handleCardDragStart = (e, card, type) => {
    if (!isMyTurn) return;
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardType', type);
    setDraggedCard({ card, type });
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  // Drop card into table slot
  const handleDropCard = (type, cardId, slotIndex) => {
    if (!isMyTurn) return;

    let targetCard = null;
    if (type === 'white') {
      targetCard = (hand.whiteCards || []).find(c => c.id === cardId);
    } else {
      targetCard = (hand.redCards || []).find(c => c.id === cardId);
    }

    if (targetCard && isBlankCard(targetCard.text) && !customTexts[cardId]) {
      setFillModalState({
        isOpen: true,
        card: targetCard,
        onConfirm: (val) => {
          const updatedCustomTexts = { ...customTexts, [cardId]: val };
          setCustomTexts(updatedCustomTexts);
          setFillModalState({ isOpen: false, card: null, onConfirm: null });
          proceedWithDrop(type, cardId, updatedCustomTexts);
        }
      });
      return;
    }

    proceedWithDrop(type, cardId, customTexts);
  };

  const proceedWithDrop = (type, cardId, currentCustomTexts) => {
    sounds.playCardDeal();

    if (type === 'white' && phase === 'PERKS') {
      const current = localWhitePlaced.filter(id => id !== cardId);
      const updated = [...current, cardId];
      setLocalWhitePlaced(updated);

      if (updated.length === 2) {
        onSubmitPerks(updated, currentCustomTexts);
      }
    } else if (type === 'red' && phase === 'SABOTAGE') {
      onSubmitSabotage(cardId, currentCustomTexts[cardId] || null);
    }
  };

  // Card click (quick placement)
  const handleCardClick = (card, type) => {
    if (!isMyTurn) return;

    if (isBlankCard(card.text) && !customTexts[card.id]) {
      setFillModalState({
        isOpen: true,
        card,
        onConfirm: (val) => {
          const updatedCustomTexts = { ...customTexts, [card.id]: val };
          setCustomTexts(updatedCustomTexts);
          setFillModalState({ isOpen: false, card: null, onConfirm: null });
          proceedWithCardClick(card, type, updatedCustomTexts);
        }
      });
      return;
    }

    proceedWithCardClick(card, type, customTexts);
  };

  const proceedWithCardClick = (card, type, currentCustomTexts) => {
    sounds.playClick();

    if (type === 'perk' && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted) {
      if (localWhitePlaced.includes(card.id)) {
        setLocalWhitePlaced(localWhitePlaced.filter(id => id !== card.id));
      } else {
        const next = localWhitePlaced.length < 2 ? [...localWhitePlaced, card.id] : [localWhitePlaced[0], card.id];
        setLocalWhitePlaced(next);
        if (next.length === 2) {
          sounds.playCardDeal();
          onSubmitPerks(next, currentCustomTexts);
        }
      }
    } else if (type === 'redflag' && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag) {
      sounds.playSabotage();
      onSubmitSabotage(card.id, currentCustomTexts[card.id] || null);
    }
  };

  const availableWhiteCards = (hand.whiteCards || []).filter(c => !localWhitePlaced.includes(c.id));
  const availableRedCards = hand.redCards || [];

  const singlePlayer = players.find(p => p.id === singlePlayerId);
  const opponentMatchmakers = players.filter(p => p.id !== singlePlayerId && p.id !== player.id);

  // Placed cards are 100% visible on table!
  const myRenderCandidate = {
    ...myCandidate,
    whiteCards: myCandidate?.whiteCards?.length === 2
      ? myCandidate.whiteCards
      : localWhitePlaced.map(id => {
          const base = (hand.whiteCards || []).find(c => c.id === id);
          if (base && customTexts[id]) {
            return {
              ...base,
              filledText: base.text.replace(/_{2,}|_{1,}\s*_{1,}\s*_{1,}|\[boşluk\]|\{blank\}/i, `**${customTexts[id]}**`)
            };
          }
          return base;
        }).filter(Boolean)
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
      {/* Top Turn & Phase Header Bar */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: isMyTurn ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0, 0, 0, 0.4)',
        borderBottom: isMyTurn ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease'
      }}>
        {/* Phase & Turn Order Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            background: isMyTurn ? '#38bdf8' : (phase === 'VOTING' ? '#f59e0b' : '#ff0000'),
            color: (isMyTurn || phase === 'VOTING') ? '#000000' : '#ffffff',
            fontSize: '0.76rem',
            fontWeight: 800,
            padding: '3px 12px',
            borderRadius: '9999px',
            textTransform: 'lowercase',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isMyTurn ? <UserCheck size={13} /> : null}
            {phase === 'PERKS' && '1. aşama: aday hazırlama'}
            {phase === 'SABOTAGE' && '2. aşama: sabotaj'}
            {(phase === 'REVEAL' || phase === 'VOTING') && '3. aşama: bekârın kararı'}
            {phase === 'ROUND_SUMMARY' && 'tur tamamlandı'}
          </span>

          <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', textTransform: 'lowercase' }}>
            {isMyTurn ? (
              <span style={{ color: '#38bdf8' }}>
                🎯 senin sıran! {phase === 'PERKS' ? '(2 beyaz kartını masana sürükle)' : `(kırmızı kartını ${mySabotageTarget?.targetPlayerName || 'rakibin'} masasına sürükle)`}
              </span>
            ) : (
              <span style={{ color: '#94a3b8' }}>
                {phase === 'VOTING'
                  ? (isSingle ? '👉 tüm adayları incele ve kazanana tıkla!' : `bekâr (${singlePlayerName}) karar veriyor...`)
                  : `⏳ sıra: ${turnPlayerName} (${turnPlayerName} kart koyuyor...)`}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Virtual Table Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px 250px 20px',
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
          {/* Bekâr Player Zone */}
          {!isSingle && singlePlayer && (
            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                textTransform: 'lowercase'
              }}>
                <img
                  src={singlePlayer.avatar || defaultAvatarImg}
                  alt={singlePlayer.name}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #fbbf24',
                    background: '#000'
                  }}
                />
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
            const isOppTurn = turnPlayerId === opp.id;

            return (
              <div
                key={opp.id}
                style={{
                  textAlign: 'center',
                  minWidth: '340px',
                  padding: '12px',
                  borderRadius: '20px',
                  background: isOppTurn ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                  border: isOppTurn ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textTransform: 'lowercase'
                }}>
                  <img
                    src={opp.avatar || defaultAvatarImg}
                    alt={opp.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                      background: '#000'
                    }}
                  />
                  <span>{opp.name}</span>
                  {isOppTurn && (
                    <span style={{
                      background: '#38bdf8',
                      color: '#000000',
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 700
                    }}>
                      sıra onda
                    </span>
                  )}
                  {isTarget && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: '0.68rem',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontWeight: 600
                    }}>
                      sabotaj hedefin
                    </span>
                  )}
                  {isWinner && <Crown size={14} color="#10b981" />}
                </div>

                {/* Opponent's Fanned Hand Backs */}
                <OpponentHandFanned count={7} />

                {/* Opponent's 3 Table Slots (Cards are visibly displayed!) */}
                <TableSlotsRow
                  candidate={oppCandidate}
                  isMySlots={false}
                  isTarget={isTarget}
                  phase={phase}
                  isMyTurn={isMyTurn}
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
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          {isSingle ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#fbbf24',
                textTransform: 'lowercase'
              }}>
                <img
                  src={player.avatar || defaultAvatarImg}
                  alt={player.name}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #fbbf24',
                    background: '#000'
                  }}
                />
                <span>bu tur bekârsın ({player.name})</span>
              </div>
              <SingleDeckStack />
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '20px',
                background: isMyTurn ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                border: isMyTurn ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'lowercase'
              }}>
                <img
                  src={player.avatar || defaultAvatarImg}
                  alt={player.name}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    background: '#000'
                  }}
                />
                <span>{player.name} (senin masan)</span>
                {isMyTurn && (
                  <span style={{
                    background: '#38bdf8',
                    color: '#000000',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 700
                  }}>
                    senin sıran
                  </span>
                )}
                {roundWinner === player.id && <Crown size={15} color="#10b981" />}
              </div>

              <TableSlotsRow
                candidate={myRenderCandidate}
                isMySlots={true}
                isTarget={false}
                phase={phase}
                isMyTurn={isMyTurn}
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

      {/* FIXED BOTTOM FANNED HAND (Drag & Drop Tray) */}
      {!isSingle && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '235px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '14px',
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
            maxWidth: '960px',
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
              const canInteract = isMyTurn && (
                (phase === 'PERKS' && isPerk) ||
                (phase === 'SABOTAGE' && !isPerk)
              );

              return (
                <div
                  key={item.card.id}
                  draggable={canInteract}
                  onDragStart={(e) => handleCardDragStart(e, item.card, item.type)}
                  onDragEnd={handleCardDragEnd}
                  onClick={() => canInteract && handleCardClick(item.card, item.type)}
                  onMouseEnter={() => setHoveredCardId(item.card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    position: 'relative',
                    width: '145px',
                    marginRight: '-36px',
                    cursor: canInteract ? 'grab' : 'not-allowed',
                    opacity: canInteract ? 1 : 0.65,
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, z-index 0.2s ease',
                    transform: isHovered
                      ? `translateY(-36px) scale(1.15) rotate(0deg)`
                      : `translateY(${translateY}px) rotate(${rot}deg)`,
                    zIndex: isHovered ? 50 : idx + 1,
                    filter: isHovered && canInteract
                      ? (isPerk ? 'drop-shadow(0 0 16px #38bdf8)' : 'drop-shadow(0 0 18px #ef4444)')
                      : 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'
                  }}
                  title={canInteract ? 'masaya sürükle veya tıkla' : (isMyTurn ? 'bu aşamada kullanılamaz' : 'sıranı bekle')}
                >
                  <CardItem card={item.card} type={item.type} isSmall={true} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fill-in-the-Blank Modal */}
      <FillBlankModal
        isOpen={fillModalState.isOpen}
        card={fillModalState.card}
        onConfirm={fillModalState.onConfirm}
        onCancel={() => setFillModalState({ isOpen: false, card: null, onConfirm: null })}
      />
    </div>
  );
}
