import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock, ArrowRight, UserCheck, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import CardItem from './CardItem';
import FillBlankModal, { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';
import redCardBackImg from '../assets/cards/card_red_back.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';
import defaultAvatarImg from '../assets/default_avatar.png';

// Dynamic Fanned Card Backs for any player desk
function DynamicHandFanned({ redCount = 3, whiteCount = 4 }) {
  const safeRed = Math.max(0, Number(redCount) || 0);
  const safeWhite = Math.max(0, Number(whiteCount) || 0);
  const total = safeRed + safeWhite;

  if (total === 0) {
    return <div style={{ height: '70px', minHeight: '70px' }} />;
  }

  // Create card array with red cards first, then white cards
  const cards = [];
  for (let r = 0; r < safeRed; r++) cards.push('red');
  for (let w = 0; w < safeWhite; w++) cards.push('white');

  const cardWidth = 56;
  const step = Math.min(22, Math.max(12, 170 / Math.max(1, cards.length)));
  const totalWidth = (cards.length - 1) * step + cardWidth;
  const centerIdx = (cards.length - 1) / 2;

  return (
    <div style={{
      position: 'relative',
      width: `${totalWidth}px`,
      height: '74px',
      minHeight: '74px',
      margin: '2px auto 6px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {cards.map((type, i) => {
        const offset = i - centerIdx;
        const rot = offset * 4.2;
        const translateY = Math.abs(offset) * 2.8;
        const isWhiteBack = type === 'white';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${i * step}px`,
              width: `${cardWidth}px`,
              aspectRatio: '5 / 7',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.75)',
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              border: '1px solid rgba(0, 0, 0, 0.25)',
              transition: 'all 0.25s ease'
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
    width: '130px',
    minWidth: '130px',
    maxWidth: '130px',
    height: '184px',
    minHeight: '184px',
    maxHeight: '184px',
    borderRadius: '14px',
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
    boxShadow: isHovered ? '0 0 16px rgba(255, 255, 255, 0.4)' : 'none'
  });

  const redSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: '130px',
    minWidth: '130px',
    maxWidth: '130px',
    height: '184px',
    minHeight: '184px',
    maxHeight: '184px',
    borderRadius: '14px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2px dashed #FF0000'
          : (isActionable
              ? '2px dashed #FF0000'
              : '2px dashed rgba(255, 0, 0, 0.35)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(255, 0, 0, 0.3)'
          : (isActionable
              ? 'rgba(255, 0, 0, 0.12)'
              : 'rgba(255, 0, 0, 0.05)')),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    transition: 'all 0.2s ease',
    boxShadow: isHovered ? '0 0 16px rgba(255, 0, 0, 0.45)' : 'none'
  });

  return (
    <div
      onClick={() => isVoting && onSelectWinner && onSelectWinner(candidate?.matchmakerId)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        maxWidth: '430px',
        height: '204px',
        minHeight: '204px',
        maxHeight: '204px',
        margin: '0 auto',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '16px',
        background: isWinner
          ? 'rgba(16, 185, 129, 0.15)'
          : (isTarget && canDropRed && isMyTurn ? 'rgba(255, 0, 0, 0.2)' : 'rgba(20, 20, 20, 0.85)'),
        border: isWinner
          ? '2px solid #10b981'
          : (isVoting ? '2px dashed #f59e0b' : (isTarget && canDropRed && isMyTurn ? '2px dashed #FF0000' : '1px solid rgba(255, 0, 0, 0.3)')),
        cursor: isVoting ? 'pointer' : 'default',
        transition: 'all 0.25s ease',
        boxShadow: isWinner
          ? '0 0 25px rgba(16, 185, 129, 0.45)'
          : (isTarget && canDropRed && isMyTurn ? '0 0 24px rgba(255, 0, 0, 0.4)' : '0 6px 20px rgba(0,0,0,0.6)')
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
          <span style={{ fontSize: '0.8rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
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
          <span style={{ fontSize: '0.8rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
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
          <span style={{ fontSize: '0.8rem', color: isTarget && canDropRed && isMyTurn ? '#f87171' : 'rgba(248, 113, 113, 0.4)', fontWeight: 700 }}>
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
    handCardCounts = {},
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

  const myRenderCandidate = myCandidate || {};
  const canDropWhite = phase === 'PERKS' && !isSingle && !myCandidate?.whiteCardsSubmitted;
  const canDropRed = phase === 'SABOTAGE' && !isSingle && !mySabotageTarget?.targetCandidate?.hasRedFlag;

  // Calculate 3 Top + 3 Bottom player desks symmetrically
  const allRoomPlayers = players && players.length > 0 ? players : [player];
  const otherPlayers = allRoomPlayers.filter(p => p.id !== player.id);

  let topPlayers = [];
  let bottomPlayers = [];

  if (allRoomPlayers.length <= 3) {
    topPlayers = otherPlayers;
    bottomPlayers = [player];
  } else if (allRoomPlayers.length === 4) {
    topPlayers = [otherPlayers[0], otherPlayers[1]];
    bottomPlayers = [otherPlayers[2], player];
  } else if (allRoomPlayers.length === 5) {
    topPlayers = [otherPlayers[0], otherPlayers[1], otherPlayers[2]];
    bottomPlayers = [otherPlayers[3], player];
  } else {
    // 6 Players: Exactly 3 on top, 3 on bottom
    topPlayers = [otherPlayers[0], otherPlayers[1], otherPlayers[2]];
    bottomPlayers = [otherPlayers[3], player, otherPlayers[4]];
  }

  // Render a Single Standard Player Desk (Equal uniform size for ALL desks)
  const renderDesk = (deskPlayer) => {
    if (!deskPlayer) return null;

    const isMe = deskPlayer.id === player.id;
    const isPlayerSingle = deskPlayer.id === singlePlayerId;
    const isPlayerTurn = turnPlayerId === deskPlayer.id;
    const isTarget = mySabotageTarget?.targetPlayerId === deskPlayer.id;
    const isWinner = roundWinner === deskPlayer.id;
    const candidateObj = candidates[deskPlayer.id] || (isMe ? myRenderCandidate : null);

    // Get dynamic hand counts from server state
    const pCounts = handCardCounts?.[deskPlayer.id] || (isMe ? {
      white: availableWhiteCards.length,
      red: availableRedCards.length
    } : {
      white: 4,
      red: 3
    });

    return (
      <div
        key={deskPlayer.id}
        style={{
          width: '456px',
          minWidth: '420px',
          maxWidth: '456px',
          padding: '12px',
          boxSizing: 'border-box',
          borderRadius: '22px',
          background: isPlayerTurn
            ? 'rgba(255, 0, 0, 0.18)'
            : (isPlayerSingle ? 'rgba(245, 158, 11, 0.08)' : 'rgba(20, 20, 20, 0.75)'),
          border: isPlayerTurn
            ? '1.5px solid #FF0000'
            : (isPlayerSingle ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'),
          boxShadow: isPlayerTurn
            ? '0 0 28px rgba(255, 0, 0, 0.45)'
            : (isPlayerSingle ? '0 0 24px rgba(245, 158, 11, 0.2)' : '0 6px 20px rgba(0, 0, 0, 0.5)'),
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {/* Desk Header Info */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '2px',
          fontSize: '0.92rem',
          fontWeight: 600,
          textTransform: 'lowercase',
          width: '100%',
          justifyContent: 'center'
        }}>
          <img
            src={deskPlayer.avatar || defaultAvatarImg}
            alt={deskPlayer.name}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: isPlayerSingle ? '1.5px solid #fbbf24' : '1.5px solid rgba(255, 255, 255, 0.3)',
              background: '#000',
              flexShrink: 0
            }}
          />

          <span style={{
            maxWidth: '170px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isPlayerSingle ? '#fbbf24' : '#ffffff'
          }}>
            {deskPlayer.name} {isMe ? '(senin masan)' : ''}
          </span>

          {isPlayerSingle && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              <Crown size={12} color="#fbbf24" /> bekâr
            </span>
          )}

          {isPlayerTurn && !isPlayerSingle && (
            <span style={{
              background: '#FF0000',
              color: '#ffffff',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 800,
              flexShrink: 0
            }}>
              {isMe ? 'senin sıran' : 'sıra onda'}
            </span>
          )}

          {isTarget && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 600,
              flexShrink: 0
            }}>
              sabotaj hedefin
            </span>
          )}

          {isWinner && <Crown size={15} color="#10b981" style={{ flexShrink: 0 }} />}
        </div>

        {/* Fanned Hand Backs (Showing exact dynamic card counts!) */}
        <DynamicHandFanned
          redCount={isPlayerSingle ? 0 : pCounts.red}
          whiteCount={isPlayerSingle ? 1 : pCounts.white}
        />

        {/* 3 Table Slots */}
        <TableSlotsRow
          candidate={candidateObj}
          isMySlots={isMe}
          isTarget={isTarget}
          phase={phase}
          isMyTurn={isMyTurn}
          canDropWhite={isMe && canDropWhite}
          canDropRed={isTarget && canDropRed}
          onDropCard={handleDropCard}
          onSelectWinner={onSelectWinner}
          isSingle={isSingle}
          isWinner={isWinner}
        />
      </div>
    );
  };

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
      {/* Virtual Table Area: 3 Top Desks + 3 Bottom Desks */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 16px 85px 16px',
        width: '100%',
        maxWidth: '100%',
        minHeight: 'calc(100vh - 50px)',
        overflowY: 'auto',
        boxSizing: 'border-box',
        gap: '20px'
      }}>
        {/* TOP ROW: Up to 3 player desks side-by-side */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '16px',
          flexWrap: 'nowrap',
          width: '100%',
          maxWidth: '1480px',
          margin: '0 auto'
        }}>
          {topPlayers.map(p => renderDesk(p))}
        </div>

        {/* BOTTOM ROW: Up to 3 player desks side-by-side (including local player) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '16px',
          flexWrap: 'nowrap',
          width: '100%',
          maxWidth: '1480px',
          margin: '0 auto'
        }}>
          {bottomPlayers.map(p => renderDesk(p))}
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
              ? '0 -14px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 0, 0, 0.3)'
              : '0 -4px 18px rgba(0, 0, 0, 0.7)',
            boxSizing: 'border-box',
            paddingBottom: '16px'
          }}
        >
          {/* Pull Tab Bar with Perfectly Aligned Badges */}
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', height: '100%' }}>
              <span style={{
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1
              }}>
                <Layers size={16} color="#FF0000" />
                <span>destem</span>
              </span>

              <span style={{
                width: '84px',
                minWidth: '84px',
                maxWidth: '84px',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#1e1e1e',
                fontWeight: 800,
                fontSize: '0.74rem',
                lineHeight: 1,
                borderRadius: '9999px',
                boxSizing: 'border-box',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {availableWhiteCards.length} beyaz
              </span>

              <span style={{
                width: '84px',
                minWidth: '84px',
                maxWidth: '84px',
                height: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FF0000',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.74rem',
                lineHeight: 1,
                borderRadius: '9999px',
                boxSizing: 'border-box',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {availableRedCards.length} kırmızı
              </span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: (isHandDrawerOpen || isDragging) ? '#94a3b8' : '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              lineHeight: 1
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
            height: '270px',
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '20px'
          }}>
            {/* White Perks */}
            {availableWhiteCards.map((card, index) => {
              const total = availableWhiteCards.length + availableRedCards.length;
              const globalIndex = index;
              const mid = (total - 1) / 2;
              const offset = globalIndex - mid;
              const rot = offset * 2.8;
              const translateY = Math.abs(offset) * 3;
              const isHovered = hoveredCardId === card.id;

              return (
                <div
                  key={card.id}
                  draggable={isMyTurn && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted}
                  onDragStart={(e) => handleCardDragStart(e, card, 'perk')}
                  onDragEnd={handleCardDragEnd}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => handleCardClick(card, 'perk')}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${offset * 68}px - 85px)`,
                    bottom: 0,
                    zIndex: isHovered ? 50 : 10 + index,
                    transform: isHovered
                      ? `translateY(-48px) scale(1.12) rotate(0deg)`
                      : `translateY(${translateY}px) rotate(${rot}deg)`,
                    transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: (isMyTurn && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted) ? 'grab' : 'default',
                    opacity: (phase !== 'PERKS' && isMyTurn) ? 0.6 : 1
                  }}
                >
                  <CardItem
                    card={card}
                    type="perk"
                    isSelected={isHovered}
                  />
                </div>
              );
            })}

            {/* Red Flag Sabotages */}
            {availableRedCards.map((card, index) => {
              const total = availableWhiteCards.length + availableRedCards.length;
              const globalIndex = availableWhiteCards.length + index;
              const mid = (total - 1) / 2;
              const offset = globalIndex - mid;
              const rot = offset * 2.8;
              const translateY = Math.abs(offset) * 3;
              const isHovered = hoveredCardId === card.id;

              return (
                <div
                  key={card.id}
                  draggable={isMyTurn && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag}
                  onDragStart={(e) => handleCardDragStart(e, card, 'redflag')}
                  onDragEnd={handleCardDragEnd}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => handleCardClick(card, 'redflag')}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${offset * 68}px - 85px)`,
                    bottom: 0,
                    zIndex: isHovered ? 50 : 25 + index,
                    transform: isHovered
                      ? `translateY(-48px) scale(1.12) rotate(0deg)`
                      : `translateY(${translateY}px) rotate(${rot}deg)`,
                    transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: (isMyTurn && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag) ? 'grab' : 'default',
                    opacity: (phase !== 'SABOTAGE' && isMyTurn) ? 0.6 : 1
                  }}
                >
                  <CardItem
                    card={card}
                    type="redflag"
                    isSelected={isHovered}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fill Blank Modal for interactive wildcard cards */}
      <FillBlankModal
        isOpen={fillModalState.isOpen}
        card={fillModalState.card}
        onConfirm={fillModalState.onConfirm}
        onCancel={() => setFillModalState({ isOpen: false, card: null, onConfirm: null })}
      />
    </div>
  );
}
