import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock, ArrowRight, UserCheck, Layers, ChevronUp, ChevronDown } from 'lucide-react';
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
  const cardWidth = 92;
  const step = 28;
  const totalWidth = (cards.length - 1) * step + cardWidth;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '132px',
      position: 'relative',
      width: `${totalWidth}px`,
      margin: '6px auto 14px auto'
    }}>
      {cards.map((_, i) => {
        const offset = i - mid;
        const rot = offset * 3.8;
        const translateY = Math.abs(offset) * 3.5;
        const isWhiteBack = i >= 4;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${i * step}px`,
              width: `${cardWidth}px`,
              aspectRatio: '5 / 7',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.65)',
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              border: '1px solid rgba(0, 0, 0, 0.2)'
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
      width: '120px',
      height: '168px',
      aspectRatio: '5 / 7',
      margin: '0 auto'
    }}>
      {/* 3D stacked shadow card layers */}
      <div style={{
        position: 'absolute',
        inset: '8px -8px -8px 8px',
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      <div style={{
        position: 'absolute',
        inset: '4px -4px -4px 4px',
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)'
      }} />
      {/* Top Deck Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '14px',
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

  const whiteSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: '154px',
    minWidth: '154px',
    maxWidth: '154px',
    height: '216px',
    minHeight: '216px',
    maxHeight: '216px',
    borderRadius: '16px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2px dashed #ffffff'
          : (isActionable
              ? '2px dashed rgba(255, 255, 255, 0.75)'
              : '2px dashed rgba(255, 255, 255, 0.25)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(255, 255, 255, 0.22)'
          : (isActionable
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(255, 255, 255, 0.03)')),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    transition: 'all 0.2s ease',
    boxShadow: isHovered ? '0 0 18px rgba(255, 255, 255, 0.4)' : 'none'
  });

  const redSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: '154px',
    minWidth: '154px',
    maxWidth: '154px',
    height: '216px',
    minHeight: '216px',
    maxHeight: '216px',
    borderRadius: '16px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2px dashed #ef4444'
          : (isActionable
              ? '2px dashed #ef4444'
              : '2px dashed rgba(217, 4, 41, 0.35)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(217, 4, 41, 0.3)'
          : (isActionable
              ? 'rgba(217, 4, 41, 0.12)'
              : 'rgba(217, 4, 41, 0.05)')),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    transition: 'all 0.2s ease',
    boxShadow: isHovered ? '0 0 18px rgba(217, 4, 41, 0.45)' : 'none'
  });

  return (
    <div
      onClick={() => isVoting && onSelectWinner && onSelectWinner(candidate?.matchmakerId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '512px',
        minWidth: '512px',
        maxWidth: '512px',
        height: '238px',
        minHeight: '238px',
        maxHeight: '238px',
        margin: '0 auto',
        padding: '10px',
        boxSizing: 'border-box',
        borderRadius: '20px',
        background: isWinner
          ? 'rgba(16, 185, 129, 0.15)'
          : (isTarget && canDropRed && isMyTurn ? 'rgba(217, 4, 41, 0.2)' : 'rgba(20, 20, 20, 0.85)'),
        border: isWinner
          ? '2px solid #10b981'
          : (isVoting ? '2px dashed #f59e0b' : (isTarget && canDropRed && isMyTurn ? '2px dashed #ef4444' : '1px solid rgba(217, 4, 41, 0.3)')),
        cursor: isVoting ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        boxShadow: isWinner
          ? '0 0 25px rgba(16, 185, 129, 0.45)'
          : (isTarget && canDropRed && isMyTurn ? '0 0 24px rgba(217, 4, 41, 0.4)' : '0 6px 20px rgba(0,0,0,0.6)')
      }}
    >
      {/* Slot 1: White Perk 1 */}
      <div
        onDragOver={(e) => handleDragOver(e, 0)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 0)}
        style={whiteSlotStyle(!!white1, dragOverIndex === 0, isMySlots && canDropWhite && isMyTurn)}
      >
        {white1 ? (
          <CardItem card={white1} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.84rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {isMySlots ? '1. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 2: White Perk 2 */}
      <div
        onDragOver={(e) => handleDragOver(e, 1)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 1)}
        style={whiteSlotStyle(!!white2, dragOverIndex === 1, isMySlots && canDropWhite && isMyTurn)}
      >
        {white2 ? (
          <CardItem card={white2} type="perk" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.84rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {isMySlots ? '2. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 3: Red Flag Sabotage */}
      <div
        onDragOver={(e) => handleDragOver(e, 2)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 2)}
        style={redSlotStyle(!!redFlag, dragOverIndex === 2, isTarget && canDropRed && isMyTurn)}
      >
        {redFlag ? (
          <CardItem card={redFlag} type="redflag" isSmall={true} />
        ) : (
          <span style={{ fontSize: '0.84rem', color: isTarget && canDropRed && isMyTurn ? '#f87171' : 'rgba(248, 113, 113, 0.4)', fontWeight: 700 }}>
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
  onPlaceWhiteCard,
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

  // Fill blank modal state
  const [fillModalState, setFillModalState] = useState({ isOpen: false, card: null, onConfirm: null });
  const [draggedCard, setDraggedCard] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [isHandDrawerOpen, setIsHandDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag start
  const handleCardDragStart = (e, card, type) => {
    if (!isMyTurn) return;
    setIsDragging(true);
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardType', type);
    setDraggedCard({ card, type });
  };

  const handleCardDragEnd = () => {
    setIsDragging(false);
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

    if (targetCard && isBlankCard(targetCard.text)) {
      setFillModalState({
        isOpen: true,
        card: targetCard,
        onConfirm: (val) => {
          setFillModalState({ isOpen: false, card: null, onConfirm: null });
          proceedWithDrop(type, cardId, val);
        }
      });
      return;
    }

    proceedWithDrop(type, cardId, null);
  };

  const proceedWithDrop = (type, cardId, customVal) => {
    sounds.playCardDeal();

    if (type === 'white' && phase === 'PERKS') {
      if (onPlaceWhiteCard) {
        onPlaceWhiteCard(cardId, customVal);
      }
    } else if (type === 'red' && phase === 'SABOTAGE') {
      if (onSubmitSabotage) {
        onSubmitSabotage(cardId, customVal);
      }
    }
  };

  // Card click (quick placement)
  const handleCardClick = (card, type) => {
    if (!isMyTurn) return;

    if (isBlankCard(card.text)) {
      setFillModalState({
        isOpen: true,
        card,
        onConfirm: (val) => {
          setFillModalState({ isOpen: false, card: null, onConfirm: null });
          proceedWithCardClick(card, type, val);
        }
      });
      return;
    }

    proceedWithCardClick(card, type, null);
  };

  const proceedWithCardClick = (card, type, customVal) => {
    sounds.playClick();

    if (type === 'perk' && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted) {
      sounds.playCardDeal();
      if (onPlaceWhiteCard) {
        onPlaceWhiteCard(card.id, customVal);
      }
    } else if (type === 'redflag' && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag) {
      sounds.playSabotage();
      if (onSubmitSabotage) {
        onSubmitSabotage(card.id, customVal);
      }
    }
  };

  const availableWhiteCards = hand.whiteCards || [];
  const availableRedCards = hand.redCards || [];

  const singlePlayer = players.find(p => p.id === singlePlayerId);
  const opponentMatchmakers = players.filter(p => p.id !== singlePlayerId && p.id !== player.id);

  // Placed cards on table are 100% visible to everyone in real-time from server state!
  const myRenderCandidate = myCandidate || {};

  const canDropWhite = phase === 'PERKS' && !isSingle && !myCandidate?.whiteCardsSubmitted;
  const canDropRed = phase === 'SABOTAGE' && !isSingle && !mySabotageTarget?.targetCandidate?.hasRedFlag;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '100%',
      background: 'radial-gradient(ellipse at 50% 35%, #242424 0%, #171717 60%, #0d0d0d 100%)',
      color: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Virtual Table Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 20px 85px 20px',
        width: '100%',
        maxWidth: '100%',
        minHeight: 'calc(100vh - 50px)',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}>

        {/* TOP / CENTER ROW: Opponents & Bekâr Seated Around Table */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '1800px',
          margin: '0 auto',
          paddingTop: '6px'
        }}>
          {/* Bekâr Player Zone */}
          {!isSingle && singlePlayer && (
            <div style={{ textAlign: 'center', minWidth: '190px', margin: '6px 12px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.92rem',
                fontWeight: 700,
                textTransform: 'lowercase',
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 14px',
                borderRadius: '9999px'
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
                <Crown size={15} color="#fbbf24" title="bekâr" />
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
                  width: '536px',
                  minWidth: '500px',
                  maxWidth: '536px',
                  padding: '14px',
                  boxSizing: 'border-box',
                  borderRadius: '24px',
                  background: isOppTurn ? 'rgba(217, 4, 41, 0.14)' : 'rgba(20, 20, 20, 0.65)',
                  border: isOppTurn ? '1.5px solid #d90429' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isOppTurn ? '0 0 28px rgba(217, 4, 41, 0.35)' : '0 6px 20px rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  textTransform: 'lowercase'
                }}>
                  <img
                    src={opp.avatar || defaultAvatarImg}
                    alt={opp.name}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid rgba(255, 255, 255, 0.3)',
                      background: '#000'
                    }}
                  />
                  <span>{opp.name}</span>
                  {isOppTurn && (
                    <span style={{
                      background: '#d90429',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 800
                    }}>
                      sıra onda
                    </span>
                  )}
                  {isTarget && (
                    <span style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 600
                    }}>
                      sabotaj hedefin
                    </span>
                  )}
                  {isWinner && <Crown size={15} color="#10b981" />}
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
        <div style={{
          marginTop: 'auto',
          marginBottom: '20px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '1800px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          {isSingle ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.94rem',
                fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '4px 16px',
                borderRadius: '9999px',
                textTransform: 'lowercase'
              }}>
                <img
                  src={player.avatar || defaultAvatarImg}
                  alt={player.name}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #fbbf24',
                    background: '#000'
                  }}
                />
                <span>bu tur bekârsın ({player.name})</span>
                <Crown size={15} color="#fbbf24" />
              </div>
              <SingleDeckStack />
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                width: '536px',
                minWidth: '500px',
                maxWidth: '536px',
                margin: '0 auto',
                padding: '14px',
                borderRadius: '24px',
                background: isMyTurn ? 'rgba(217, 4, 41, 0.16)' : 'rgba(20, 20, 20, 0.65)',
                border: isMyTurn ? '1.5px solid #d90429' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isMyTurn ? '0 0 30px rgba(217, 4, 41, 0.45)' : '0 6px 20px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px',
                fontSize: '0.94rem',
                fontWeight: 600,
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
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    background: '#000'
                  }}
                />
                <span>{player.name} (senin masan)</span>
                {isMyTurn && (
                  <span style={{
                    background: '#d90429',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 800
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

      {/* PEEK & SLIDE HOVER HAND DRAWER */}
      {!isSingle && (
        <div
          className="player-hand-drawer"
          onMouseEnter={() => setIsHandDrawerOpen(true)}
          onMouseLeave={() => setIsHandDrawerOpen(false)}
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: `translateX(-50%) translateY(${
              (isHandDrawerOpen || isDragging) ? '0%' : 'calc(100% - 44px)'
            })`,
            transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
            zIndex: 85,
            width: '94%',
            maxWidth: '1400px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(18, 18, 18, 0.96)',
            backdropFilter: 'blur(20px)',
            borderTopLeftRadius: '22px',
            borderTopRightRadius: '22px',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderBottom: 'none',
            boxShadow: (isHandDrawerOpen || isDragging)
              ? '0 -14px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(217, 4, 41, 0.25)'
              : '0 -4px 18px rgba(0, 0, 0, 0.7)',
            boxSizing: 'border-box',
            paddingBottom: '16px'
          }}
        >
          {/* Pull Tab Bar */}
          <div
            onClick={() => setIsHandDrawerOpen(prev => !prev)}
            style={{
              width: '100%',
              height: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              cursor: 'pointer',
              borderBottom: (isHandDrawerOpen || isDragging) ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
              userSelect: 'none',
              background: (isHandDrawerOpen || isDragging) ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
              borderTopLeftRadius: '22px',
              borderTopRightRadius: '22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#ef4444" />
                <span>destem</span>
              </span>
              <span style={{
                height: '24px',
                minWidth: '78px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#1e1e1e',
                fontWeight: 800,
                fontSize: '0.74rem',
                lineHeight: '1',
                padding: '0 10px',
                borderRadius: '9999px',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}>
                {availableWhiteCards.length} beyaz
              </span>
              <span style={{
                height: '24px',
                minWidth: '78px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#d90429',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.74rem',
                lineHeight: '1',
                padding: '0 10px',
                borderRadius: '9999px',
                boxSizing: 'border-box',
                textAlign: 'center'
              }}>
                {availableRedCards.length} kırmızı
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: (isHandDrawerOpen || isDragging) ? '#94a3b8' : '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700
            }}>
              {(isHandDrawerOpen || isDragging) ? (
                <>
                  <ChevronDown size={14} />
                  <span>desteyi gizle</span>
                </>
              ) : (
                <>
                  <ChevronUp size={14} />
                  <span>kartlarını görmek için üzerine gel</span>
                </>
              )}
            </div>
          </div>

          {/* Fanned Cards Container */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            position: 'relative',
            height: '260px',
            width: '100%',
            paddingTop: '12px'
          }}>
            {[
              ...availableWhiteCards.map(c => ({ card: c, type: 'perk' })),
              ...availableRedCards.map(c => ({ card: c, type: 'redflag' }))
            ].map((item, idx, arr) => {
              const mid = (arr.length - 1) / 2;
              const offset = idx - mid;
              const rot = offset * 3.2;
              const translateY = Math.abs(offset) * 4.5;
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
                    width: '180px',
                    marginRight: '-40px',
                    cursor: canInteract ? 'grab' : 'not-allowed',
                    opacity: canInteract ? 1 : 0.7,
                    transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, z-index 0.2s ease',
                    transform: isHovered
                      ? `translateY(-65px) scale(1.15) rotate(0deg)`
                      : `translateY(${translateY}px) rotate(${rot}deg)`,
                    zIndex: isHovered ? 50 : idx + 1,
                    filter: isHovered && canInteract
                      ? (isPerk ? 'drop-shadow(0 0 24px rgba(255, 255, 255, 0.95))' : 'drop-shadow(0 0 26px rgba(217, 4, 41, 0.95))')
                      : 'drop-shadow(0 6px 12px rgba(0,0,0,0.65))'
                  }}
                  title={canInteract ? 'masaya sürükle veya tıkla' : (isMyTurn ? 'bu aşamada kullanılamaz' : 'sıranı bekle')}
                >
                  <CardItem card={item.card} type={item.type} isSmall={false} />
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
