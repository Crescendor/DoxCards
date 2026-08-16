import React, { useState } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock, ArrowRight, UserCheck, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import CardItem from './CardItem';
import FillBlankModal, { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';
import redCardBackImg from '../assets/cards/card_red_back.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';
import defaultAvatarImg from '../assets/default_avatar.png';
import doxcardsLogoImg from '../assets/doxcards.png';

// Dynamic Fanned Card Backs for matchmaker player desks
function DynamicHandFanned({ redCount = 3, whiteCount = 4 }) {
  const safeRed = Math.max(0, Number(redCount) || 0);
  const safeWhite = Math.max(0, Number(whiteCount) || 0);
  const total = safeRed + safeWhite;

  if (total === 0) {
    return <div style={{ height: '76px', minHeight: '76px' }} />;
  }

  // Create card array with red cards first, then white cards
  const cards = [];
  for (let r = 0; r < safeRed; r++) cards.push('red');
  for (let w = 0; w < safeWhite; w++) cards.push('white');

  const cardWidth = 64;
  const step = Math.min(26, Math.max(14, 210 / Math.max(1, cards.length)));
  const totalWidth = (cards.length - 1) * step + cardWidth;
  const centerIdx = (cards.length - 1) / 2;

  return (
    <div style={{
      position: 'relative',
      width: `${totalWidth}px`,
      height: '82px',
      minHeight: '82px',
      margin: '4px auto 8px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {cards.map((type, i) => {
        const offset = i - centerIdx;
        const rot = offset * 4.4;
        const translateY = Math.abs(offset) * 3.2;
        const isWhiteBack = type === 'white';

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${i * step}px`,
              width: `${cardWidth}px`,
              aspectRatio: '5 / 7',
              borderRadius: '11px',
              overflow: 'hidden',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.85)',
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              border: '1.5px solid rgba(0, 0, 0, 0.35)',
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

// 3 Large Dashed Table Drop Slots for matchmaker candidate
function TableSlotsRow({
  candidate,
  isMySlots,
  isTarget,
  phase,
  isMyTurn,
  canDropWhite,
  canDropRed,
  onDropCard
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

  const whiteSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: 'clamp(96px, 8.5vw, 136px)',
    height: 'clamp(136px, 18.5vh, 190px)',
    borderRadius: '14px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2px dashed #ffffff'
          : (isActionable
              ? '2px dashed rgba(255, 255, 255, 0.85)'
              : '2px dashed rgba(255, 255, 255, 0.22)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(255, 255, 255, 0.24)'
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
    boxShadow: isHovered ? '0 0 20px rgba(255, 255, 255, 0.5)' : 'none'
  });

  const redSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: 'clamp(96px, 8.5vw, 136px)',
    height: 'clamp(136px, 18.5vh, 190px)',
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
          ? 'rgba(255, 0, 0, 0.32)'
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
    boxShadow: isHovered ? '0 0 20px rgba(255, 0, 0, 0.55)' : 'none'
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        maxWidth: '460px',
        height: 'clamp(148px, 20vh, 202px)',
        margin: '0 auto',
        padding: '6px',
        boxSizing: 'border-box',
        borderRadius: '16px',
        background: isTarget && canDropRed && isMyTurn ? 'rgba(255, 0, 0, 0.18)' : 'rgba(15, 15, 15, 0.85)',
        border: isTarget && canDropRed && isMyTurn ? '2px dashed #FF0000' : '1px solid rgba(255, 0, 0, 0.25)',
        transition: 'all 0.25s ease',
        boxShadow: isTarget && canDropRed && isMyTurn ? '0 0 24px rgba(255, 0, 0, 0.4)' : '0 6px 20px rgba(0,0,0,0.6)'
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

  // DETERMINISTIC 3 TOP + 3 BOTTOM SEATING (Identical arrangement for all players in room!)
  const allRoomPlayers = players && players.length > 0 ? players : [player];
  const topPlayers = allRoomPlayers.slice(0, Math.min(3, Math.ceil(allRoomPlayers.length / 2)));
  const bottomPlayers = allRoomPlayers.slice(Math.min(3, Math.ceil(allRoomPlayers.length / 2)), 6);

  // Render a Single Standard Player Desk (Equal uniform size for ALL desks)
  const renderDesk = (deskPlayer) => {
    if (!deskPlayer) return null;

    const isMe = deskPlayer.id === player.id;
    const isPlayerSingle = deskPlayer.id === singlePlayerId;
    const isPlayerTurn = turnPlayerId === deskPlayer.id;
    const isTarget = mySabotageTarget?.targetPlayerId === deskPlayer.id;
    const isWinner = roundWinner === deskPlayer.id;
    const candidateObj = candidates[deskPlayer.id] || (isMe ? myRenderCandidate : null);

    // Can Bekâr click this entire desk to pick winner?
    const canBekarSelectThisDesk = isSingle && !isPlayerSingle && (phase === 'VOTING' || phase === 'REVEAL');

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
        onClick={() => {
          if (canBekarSelectThisDesk && onSelectWinner) {
            sounds.playWin();
            onSelectWinner(deskPlayer.id);
          }
        }}
        style={{
          flex: '1 1 0',
          width: '100%',
          minWidth: '280px',
          maxWidth: '540px',
          padding: '8px 12px',
          boxSizing: 'border-box',
          borderRadius: '18px',
          background: isWinner
            ? 'rgba(16, 185, 129, 0.18)'
            : (isPlayerTurn
                ? 'rgba(255, 0, 0, 0.18)'
                : (isPlayerSingle ? 'rgba(245, 158, 11, 0.08)' : 'rgba(20, 20, 20, 0.78)')),
          border: isWinner
            ? '2px solid #10b981'
            : (canBekarSelectThisDesk
                ? '2px dashed #f59e0b'
                : (isPlayerTurn
                    ? '1.5px solid #FF0000'
                    : (isPlayerSingle ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'))),
          boxShadow: isWinner
            ? '0 0 35px rgba(16, 185, 129, 0.55)'
            : (canBekarSelectThisDesk
                ? '0 0 30px rgba(245, 158, 11, 0.45)'
                : (isPlayerTurn
                    ? '0 0 28px rgba(255, 0, 0, 0.45)'
                    : (isPlayerSingle ? '0 0 24px rgba(245, 158, 11, 0.2)' : '0 6px 20px rgba(0, 0, 0, 0.5)'))),
          cursor: canBekarSelectThisDesk ? 'pointer' : 'default',
          transition: 'all 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          position: 'relative',
          overflow: 'hidden'
        }}
        title={canBekarSelectThisDesk ? `${deskPlayer.name} adlı adayı kazanan seçmek için tıkla!` : ''}
      >
        {/* Bekâr Select Candidate Action Banner */}
        {canBekarSelectThisDesk && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            background: '#f59e0b',
            color: '#000000',
            fontWeight: 900,
            fontSize: '0.78rem',
            padding: '3px 14px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.6)',
            zIndex: 10
          }}>
            <Crown size={13} color="#000000" /> bu adayı seçmek için tıkla
          </div>
        )}

        {/* Desk Header Info */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.96rem',
          fontWeight: 700,
          textTransform: 'lowercase',
          width: '100%',
          justifyContent: 'center'
        }}>
          <img
            src={deskPlayer.avatar || defaultAvatarImg}
            alt={deskPlayer.name}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: isPlayerSingle ? '2px solid #fbbf24' : '1.5px solid rgba(255, 255, 255, 0.35)',
              background: '#000',
              flexShrink: 0
            }}
          />

          <span style={{
            maxWidth: '190px',
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
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              fontSize: '0.74rem',
              padding: '2px 9px',
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
              fontSize: '0.74rem',
              padding: '2px 9px',
              borderRadius: '9999px',
              fontWeight: 800,
              flexShrink: 0
            }}>
              {isMe ? 'senin sıran' : 'sıra onda'}
            </span>
          )}

          {isTarget && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.74rem',
              padding: '2px 9px',
              borderRadius: '9999px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              sabotaj hedefin
            </span>
          )}

          {isWinner && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '0.74rem',
              padding: '2px 9px',
              borderRadius: '9999px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}>
              <Crown size={13} color="#10b981" /> tur kazananı
            </span>
          )}
        </div>

        {/* BEKÂR DESK: Large Prominent Deck Stack & Status (No table drop slots!) */}
        {isPlayerSingle ? (
          <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 0 6px 0',
            gap: '8px'
          }}>
            {/* Large 3D Layered Deck */}
            <div style={{
              position: 'relative',
              width: 'clamp(88px, 7.8vw, 126px)',
              height: 'clamp(124px, 17vh, 178px)',
              aspectRatio: '5 / 7',
              margin: '0 auto'
            }}>
              {/* Layer 3 */}
              <div style={{
                position: 'absolute',
                inset: '10px -10px -10px 10px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
                opacity: 0.85
              }} />
              {/* Layer 2 */}
              <div style={{
                position: 'absolute',
                inset: '5px -5px -5px 5px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
                opacity: 0.95
              }} />
              {/* Top Card */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(245, 158, 11, 0.35)',
                border: '2px solid rgba(245, 158, 11, 0.6)',
                zIndex: 3
              }}>
                <img
                  src={redCardBackImg}
                  alt="bekar destesi"
                  style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                />
              </div>
            </div>

            {/* Bekâr Status Message */}
            <div style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '6px 16px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px'
            }}>
              <Crown size={14} color="#fbbf24" />
              <span>
                {phase === 'VOTING' || phase === 'REVEAL'
                  ? (isSingle ? 'kazanan adayı seçmek için masasına tıkla!' : 'bekârın seçim yapması bekleniyor...')
                  : 'bekâr masası - adaylarını bekliyor'}
              </span>
            </div>
          </div>
        ) : (
          /* MATCHMAKER DESK: Fanned Hand Backs + 3 Table Slots */
          <>
            {/* Dynamic Fanned Hand Backs */}
            <DynamicHandFanned
              redCount={pCounts.red}
              whiteCount={pCounts.white}
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
            />
          </>
        )}
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
      {/* Virtual Table Area: 3 Top Desks + 3 Bottom Desks (Strictly Fits Screen, Zero Overflow) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 16px 52px 16px',
        width: '100%',
        maxWidth: '100%',
        height: 'calc(100vh - 50px)',
        maxHeight: 'calc(100vh - 50px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        gap: '6px'
      }}>
        {/* DoxCards Logo in Table Header Gap */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0',
          userSelect: 'none',
          pointerEvents: 'none',
          flexShrink: 0
        }}>
          <img
            src={doxcardsLogoImg}
            alt="DoxCards"
            style={{
              height: 'clamp(20px, 3vh, 30px)',
              objectFit: 'contain',
              opacity: 0.9,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7))'
            }}
          />
        </div>

        {/* TOP ROW: Up to 3 player desks side-by-side */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '14px',
          width: '100%',
          maxWidth: '1780px',
          flex: 1,
          maxHeight: '44vh',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          {topPlayers.map(p => renderDesk(p))}
        </div>

        {/* BOTTOM ROW: Up to 3 player desks side-by-side */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '14px',
          width: '100%',
          maxWidth: '1780px',
          flex: 1,
          maxHeight: '44vh',
          margin: '0 auto',
          overflow: 'hidden'
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
              (isHandDrawerOpen || isDragging) ? '0%' : 'calc(100% - 46px)'
            })`,
            transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
            zIndex: 85,
            width: '96%',
            maxWidth: '1500px',
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
              height: '46px',
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
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
                fontSize: '0.9rem',
                fontWeight: 800,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                lineHeight: 1
              }}>
                <Layers size={17} color="#FF0000" />
                <span>destem</span>
              </span>

              <span style={{
                width: '88px',
                minWidth: '88px',
                maxWidth: '88px',
                height: '26px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#1e1e1e',
                fontWeight: 800,
                fontSize: '0.76rem',
                lineHeight: 1,
                borderRadius: '9999px',
                boxSizing: 'border-box',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {availableWhiteCards.length} beyaz
              </span>

              <span style={{
                width: '88px',
                minWidth: '88px',
                maxWidth: '88px',
                height: '26px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FF0000',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.76rem',
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
              fontSize: '0.8rem',
              fontWeight: 700,
              lineHeight: 1
            }}>
              {(isHandDrawerOpen || isDragging) ? (
                <>
                  <ChevronDown size={15} />
                  <span>desteyi gizle</span>
                </>
              ) : (
                <>
                  <ChevronUp size={15} />
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
            height: '280px',
            position: 'relative',
            width: '100%',
            maxWidth: '1300px',
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
                    left: `calc(50% + ${offset * 72}px - 90px)`,
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
                    left: `calc(50% + ${offset * 72}px - 90px)`,
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
