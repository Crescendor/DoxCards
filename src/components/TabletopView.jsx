import React, { useState, useEffect, useRef } from 'react';
import { Crown, Sparkles, Check, Flame, ShieldAlert, Clock, ArrowRight, UserCheck, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import CardItem from './CardItem';
import FillBlankModal, { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';
import { socket } from '../services/socket';
import { fetchAppConfig, DEFAULT_CONFIG } from '../services/userService';
import redCardBackImg from '../assets/cards/card_red_back.png';
import whiteCardBackImg from '../assets/cards/card_white_back.png';
import defaultAvatarImg from '../assets/default_avatar.png';
import doxcardsLogoImg from '../assets/doxcards.png';

// Dynamic Fanned Card Backs for matchmaker player desks
function DynamicHandFanned({ redCount = 3, whiteCount = 4, theme = null, appConfig = null }) {
  const safeRed = Math.max(0, Number(redCount) || 0);
  const safeWhite = Math.max(0, Number(whiteCount) || 0);
  const total = safeRed + safeWhite;

  if (total === 0) {
    return <div style={{ height: '115px', minHeight: '115px' }} />;
  }

  // Resolve player theme
  const resolvedTheme = (() => {
    if (theme && typeof theme === 'object') return theme;
    const themeId = (typeof theme === 'string' && theme) || 'stocks';
    const themes = appConfig?.market?.themes || [];
    return themes.find(t => t.id === themeId) || null;
  })();

  const whiteBackUrl = resolvedTheme?.whiteBack || resolvedTheme?.images?.whiteBack || whiteCardBackImg;
  const redBackUrl = resolvedTheme?.redBack || resolvedTheme?.images?.redBack || redCardBackImg;
  const themeAnim = resolvedTheme?.animation || 'none';
  const themeGlow = resolvedTheme?.glow || 'none';

  // Create card array with red cards first, then white cards
  const cards = [];
  for (let r = 0; r < safeRed; r++) cards.push('red');
  for (let w = 0; w < safeWhite; w++) cards.push('white');

  const cardWidth = 112; // Substantially larger and prominent
  const step = Math.min(32, Math.max(16, 260 / Math.max(1, cards.length)));
  const totalWidth = (cards.length - 1) * step + cardWidth;
  const centerIdx = (cards.length - 1) / 2;

  const glowShadow = themeGlow === 'crimson' ? '0 10px 28px rgba(239, 68, 68, 0.45)' :
                     themeGlow === 'golden' ? '0 10px 28px rgba(251, 191, 36, 0.45)' :
                     themeGlow === 'neon_purple' ? '0 10px 28px rgba(168, 85, 247, 0.45)' :
                     themeGlow === 'neon_blue' ? '0 10px 28px rgba(56, 189, 248, 0.45)' :
                     themeGlow === 'emerald' ? '0 10px 28px rgba(52, 211, 153, 0.45)' :
                     '0 8px 24px rgba(0, 0, 0, 0.85)';

  return (
    <div style={{
      position: 'relative',
      width: `${totalWidth}px`,
      height: '156px',
      minHeight: '156px',
      margin: '6px auto 10px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none'
    }}>
      {cards.map((type, i) => {
        const offset = i - centerIdx;
        const rot = offset * 4.2;
        const translateY = Math.abs(offset) * 3.2;
        const isWhiteBack = type === 'white';

        return (
          <div
            key={i}
            className={`tag-anim-${themeAnim}`}
            style={{
              position: 'absolute',
              left: `${i * step}px`,
              width: `${cardWidth}px`,
              aspectRatio: '5 / 7',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: glowShadow,
              transform: `rotate(${rot}deg) translateY(${translateY}px)`,
              zIndex: i,
              background: isWhiteBack ? '#ffffff' : '#dc2626',
              border: isWhiteBack ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(239, 68, 68, 0.5)',
              boxSizing: 'border-box',
              transition: 'all 0.25s ease'
            }}
          >
            <img
              src={isWhiteBack ? whiteBackUrl : redBackUrl}
              alt="card back"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserDrag: 'none'
              }}
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
  deskPlayerId,
  isMySlots,
  isTarget,
  phase,
  isMyTurn,
  canDropWhite,
  canDropRed,
  activeDrag,
  onDropCard,
  deskPlayerTheme = null,
  saboteurTheme = null,
  appConfig = null
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

  const isSlotActiveHover = (index) => {
    if (dragOverIndex === index) return true;
    if (activeDrag?.targetSlot?.playerId === deskPlayerId && activeDrag?.targetSlot?.slotIndex === index) return true;
    return false;
  };

  const whiteSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: 'clamp(96px, 8.5vw, 136px)',
    height: 'clamp(136px, 18.5vh, 190px)',
    borderRadius: '14px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2.5px dashed #ffffff'
          : (isActionable
              ? '2px dashed rgba(255, 255, 255, 0.85)'
              : '2px dashed rgba(255, 255, 255, 0.22)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(255, 255, 255, 0.32)'
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
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
    boxShadow: isHovered ? '0 0 28px rgba(255, 255, 255, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.3)' : 'none'
  });

  const redSlotStyle = (hasCard, isHovered, isActionable) => ({
    width: 'clamp(96px, 8.5vw, 136px)',
    height: 'clamp(136px, 18.5vh, 190px)',
    borderRadius: '14px',
    border: hasCard
      ? 'none'
      : (isHovered
          ? '2.5px dashed #FF0000'
          : (isActionable
              ? '2px dashed #FF0000'
              : '2px dashed rgba(255, 0, 0, 0.35)')),
    background: hasCard
      ? 'transparent'
      : (isHovered
          ? 'rgba(255, 0, 0, 0.42)'
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
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'scale(1.06)' : 'scale(1)',
    boxShadow: isHovered ? '0 0 32px rgba(255, 0, 0, 0.85), inset 0 0 15px rgba(255, 0, 0, 0.4)' : 'none'
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
        data-table-slot="true"
        data-slot-player-id={deskPlayerId}
        data-slot-index="0"
        data-slot-type="white"
        onDragOver={(e) => handleDragOver(e, 0)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 0)}
        style={whiteSlotStyle(!!white1, isSlotActiveHover(0), isMySlots && canDropWhite && isMyTurn)}
      >
        {white1 ? (
          <CardItem card={white1} type="perk" isSmall={true} theme={deskPlayerTheme || candidate?.equippedTheme} appConfig={appConfig} />
        ) : (
          <span style={{ fontSize: '0.84rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {isMySlots ? '1. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 2: White Perk 2 */}
      <div
        data-table-slot="true"
        data-slot-player-id={deskPlayerId}
        data-slot-index="1"
        data-slot-type="white"
        onDragOver={(e) => handleDragOver(e, 1)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 1)}
        style={whiteSlotStyle(!!white2, isSlotActiveHover(1), isMySlots && canDropWhite && isMyTurn)}
      >
        {white2 ? (
          <CardItem card={white2} type="perk" isSmall={true} theme={deskPlayerTheme || candidate?.equippedTheme} appConfig={appConfig} />
        ) : (
          <span style={{ fontSize: '0.84rem', color: isMySlots && canDropWhite && isMyTurn ? '#ffffff' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
            {isMySlots ? '2. beyaz' : ''}
          </span>
        )}
      </div>

      {/* Slot 3: Red Flag Sabotage */}
      <div
        data-table-slot="true"
        data-slot-player-id={deskPlayerId}
        data-slot-index="2"
        data-slot-type="red"
        onDragOver={(e) => handleDragOver(e, 2)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 2)}
        style={redSlotStyle(!!redFlag, isSlotActiveHover(2), isTarget && canDropRed && isMyTurn)}
      >
        {redFlag ? (
          <CardItem card={redFlag} type="redflag" isSmall={true} theme={saboteurTheme || candidate?.saboteurTheme} appConfig={appConfig} />
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

  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);
  useEffect(() => {
    fetchAppConfig().then(cfg => {
      if (cfg) setAppConfig(cfg);
    });
  }, []);

  // Fill blank modal state
  const [fillModalState, setFillModalState] = useState({ isOpen: false, card: null, onConfirm: null });
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [isHandDrawerOpen, setIsHandDrawerOpen] = useState(false);

  // Active Local Pointer Drag State
  const [activeDrag, setActiveDrag] = useState(null);
  const dragRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Realtime Remote Other Players Drag State
  const [remoteDrags, setRemoteDrags] = useState({});

  const availableWhiteCards = hand.whiteCards || [];
  const availableRedCards = hand.redCards || [];
  const myRenderCandidate = myCandidate || {};
  const canDropWhite = phase === 'PERKS' && !isSingle && !myCandidate?.whiteCardsSubmitted;
  const canDropRed = phase === 'SABOTAGE' && !isSingle && !mySabotageTarget?.targetCandidate?.hasRedFlag;

  // Listen for realtime card drag motion from other players in room
  useEffect(() => {
    const handleRemoteDrag = (data) => {
      if (!data || !data.playerId || data.playerId === player.id) return;

      setRemoteDrags(prev => {
        if (!data.isDragging) {
          const next = { ...prev };
          delete next[data.playerId];
          return next;
        }
        return {
          ...prev,
          [data.playerId]: {
            ...data,
            lastUpdate: Date.now()
          }
        };
      });
    };

    socket.on('player_card_drag_motion', handleRemoteDrag);
    return () => {
      socket.off('player_card_drag_motion', handleRemoteDrag);
    };
  }, [player.id]);

  // Clean stale remote drags (> 3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteDrags(prev => {
        let changed = false;
        const next = {};
        Object.entries(prev).forEach(([pId, info]) => {
          if (now - info.lastUpdate < 3500 && info.isDragging) {
            next[pId] = info;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Start Card Pointer Drag
  const startCardDrag = (e, card, type) => {
    if (!isMyTurn) return;
    if (type === 'perk' && (phase !== 'PERKS' || myCandidate?.whiteCardsSubmitted)) return;
    if (type === 'redflag' && (phase !== 'SABOTAGE' || !mySabotageTarget || mySabotageTarget.targetCandidate?.hasRedFlag)) return;

    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

    lastPosRef.current = { x: clientX, y: clientY };

    const initialDrag = {
      card,
      type,
      x: clientX,
      y: clientY,
      tilt: 0,
      targetSlot: null
    };

    dragRef.current = initialDrag;
    setActiveDrag(initialDrag);
    sounds.playCardDeal();

    socket.emit('card_drag_motion', {
      playerId: player.id,
      playerName: player.name,
      playerAvatar: player.avatar || null,
      cardType: type,
      cardText: card.text,
      normX: clientX / (window.innerWidth || 1),
      normY: clientY / (window.innerHeight || 1),
      tilt: 0,
      isDragging: true
    });
  };

  // Global Pointer tracking for local drag
  useEffect(() => {
    if (!activeDrag) return;

    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;

      const deltaX = clientX - lastPosRef.current.x;
      lastPosRef.current = { x: clientX, y: clientY };

      const targetTilt = Math.max(-28, Math.min(28, deltaX * 2.2));

      // Hit-test target drop slots
      const elem = document.elementFromPoint(clientX, clientY);
      const slotElem = elem ? elem.closest('[data-table-slot="true"]') : null;

      let targetSlot = null;
      if (slotElem) {
        const slotPlayerId = slotElem.getAttribute('data-slot-player-id');
        const slotIndex = Number(slotElem.getAttribute('data-slot-index'));
        const slotType = slotElem.getAttribute('data-slot-type');

        if (activeDrag.type === 'perk' && slotType === 'white' && slotPlayerId === player.id && canDropWhite) {
          targetSlot = { playerId: slotPlayerId, slotIndex, type: 'white' };
        } else if (activeDrag.type === 'redflag' && slotType === 'red' && slotPlayerId === mySabotageTarget?.targetPlayerId && canDropRed) {
          targetSlot = { playerId: slotPlayerId, slotIndex: 2, type: 'red' };
        }
      }

      const updated = {
        ...dragRef.current,
        x: clientX,
        y: clientY,
        tilt: targetTilt,
        targetSlot
      };
      dragRef.current = updated;
      setActiveDrag(updated);

      // Throttled emit ~35ms
      const now = Date.now();
      if (now - lastEmitTimeRef.current > 35) {
        lastEmitTimeRef.current = now;
        socket.emit('card_drag_motion', {
          playerId: player.id,
          playerName: player.name,
          playerAvatar: player.avatar || null,
          cardType: activeDrag.type,
          cardText: activeDrag.card.text,
          normX: clientX / (window.innerWidth || 1),
          normY: clientY / (window.innerHeight || 1),
          tilt: targetTilt,
          isDragging: true
        });
      }
    };

    const handlePointerUp = () => {
      const current = dragRef.current;
      if (!current) return;

      if (current.targetSlot) {
        handleDropCard(current.targetSlot.type, current.card.id, current.targetSlot.slotIndex);
      }

      dragRef.current = null;
      setActiveDrag(null);

      socket.emit('card_drag_motion', {
        playerId: player.id,
        isDragging: false
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeDrag, player.id, player.name, player.avatar, canDropWhite, canDropRed, mySabotageTarget]);

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
          position: 'relative'
        }}
        title={canBekarSelectThisDesk ? `${deskPlayer.name} adlı adayı kazanan seçmek için tıkla!` : ''}
      >
        {/* Bekâr Select Candidate Action Banner */}
        {canBekarSelectThisDesk && (
          <div style={{
            position: 'absolute',
            top: '-13px',
            background: '#f59e0b',
            color: '#000000',
            fontWeight: 900,
            fontSize: '0.74rem',
            padding: '3px 14px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.6)',
            zIndex: 50,
            pointerEvents: 'none'
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
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: isPlayerSingle ? '2px solid #fbbf24' : '1.5px solid rgba(255, 255, 255, 0.35)',
              background: '#000',
              flexShrink: 0,
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserDrag: 'none'
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
            justifyContent: 'space-between',
            padding: '2px 0 2px 0'
          }}>
            {/* Large 3D Layered Deck with Player Equipped Theme */}
            {(() => {
              const bekTheme = (() => {
                const tId = deskPlayer?.equippedTheme || 'stocks';
                const themes = appConfig?.market?.themes || [];
                return themes.find(t => t.id === tId) || null;
              })();
              const bekRedBack = bekTheme?.redBack || bekTheme?.images?.redBack || redCardBackImg;
              const bekGlow = bekTheme?.glow || 'golden';
              const bekAnim = bekTheme?.animation || 'none';

              const glowBoxShadow = bekGlow === 'crimson' ? '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(239, 68, 68, 0.45)' :
                                   bekGlow === 'golden' ? '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(245, 158, 11, 0.45)' :
                                   bekGlow === 'neon_purple' ? '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(168, 85, 247, 0.45)' :
                                   bekGlow === 'neon_blue' ? '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(56, 189, 248, 0.45)' :
                                   bekGlow === 'emerald' ? '0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(52, 211, 153, 0.45)' :
                                   '0 8px 24px rgba(0,0,0,0.7), 0 0 20px rgba(245, 158, 11, 0.35)';

              return (
                <div style={{
                  position: 'relative',
                  width: 'clamp(96px, 8.5vw, 136px)',
                  height: 'clamp(134px, 18vh, 190px)',
                  aspectRatio: '5 / 7',
                  margin: 'auto auto'
                }}>
                  {/* Layer 3 */}
                  <div style={{
                    position: 'absolute',
                    inset: '5px -5px -5px 5px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    opacity: 0.85
                  }} />
                  {/* Layer 2 */}
                  <div style={{
                    position: 'absolute',
                    inset: '2.5px -2.5px -2.5px 2.5px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    opacity: 0.95
                  }} />
                  {/* Top Card */}
                  <div
                    className={`tag-anim-${bekAnim}`}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: glowBoxShadow,
                      border: '2px solid rgba(255, 255, 255, 0.35)',
                      zIndex: 3
                    }}
                  >
                    <img
                      src={bekRedBack}
                      alt="bekar destesi"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none' }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Bekâr Status Message (Anchored at Bottom of Desk) */}
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '4px 14px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: 'auto',
              marginBottom: '2px'
            }}>
              <Crown size={13} color="#fbbf24" />
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
              theme={deskPlayer?.equippedTheme}
              appConfig={appConfig}
            />

            {/* 3 Table Slots */}
            {(() => {
              const saboteurPlayer = players.find(p => p.id === candidateObj?.sabotagedBy);
              return (
                <TableSlotsRow
                  candidate={candidateObj}
                  deskPlayerId={deskPlayer.id}
                  isMySlots={isMe}
                  isTarget={isTarget}
                  phase={phase}
                  isMyTurn={isMyTurn}
                  canDropWhite={isMe && canDropWhite}
                  canDropRed={isTarget && canDropRed}
                  activeDrag={activeDrag}
                  onDropCard={handleDropCard}
                  deskPlayerTheme={deskPlayer?.equippedTheme}
                  saboteurTheme={saboteurPlayer?.equippedTheme || candidateObj?.saboteurTheme}
                  appConfig={appConfig}
                />
              );
            })()}
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
        padding: 'clamp(8px, 1.2vh, 16px) clamp(10px, 1.5vw, 24px) clamp(44px, 5vh, 60px) clamp(10px, 1.5vw, 24px)',
        width: '100%',
        maxWidth: '100%',
        height: 'calc(100vh - 50px)',
        maxHeight: 'calc(100vh - 50px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        gap: '4px'
      }}>
        {/* TOP ROW: Up to 3 player desks side-by-side */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 'clamp(10px, 1.4vw, 20px)',
          width: '100%',
          maxWidth: '1840px',
          flex: '1 1 0',
          maxHeight: '44vh',
          margin: '0 auto'
        }}>
          {topPlayers.map(p => renderDesk(p))}
        </div>

        {/* DoxCards Logo in Table Header Gap */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'clamp(16px, 2.4vh, 26px)',
          padding: '0',
          userSelect: 'none',
          pointerEvents: 'none',
          flexShrink: 0
        }}>
          <img
            src={doxcardsLogoImg}
            alt="DoxCards"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            style={{
              height: '100%',
              objectFit: 'contain',
              opacity: 0.85,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7))',
              pointerEvents: 'none',
              userSelect: 'none',
              WebkitUserDrag: 'none'
            }}
          />
        </div>

        {/* BOTTOM ROW: Up to 3 player desks side-by-side */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 'clamp(10px, 1.4vw, 20px)',
          width: '100%',
          maxWidth: '1840px',
          flex: '1 1 0',
          maxHeight: '44vh',
          margin: '0 auto'
        }}>
          {bottomPlayers.map(p => renderDesk(p))}
        </div>
      </div>

      {/* PEEK & SLIDE HOVER HAND DRAWER (Available to all players including Single) */}
      <div
        className="player-hand-drawer"
        onMouseEnter={() => setIsHandDrawerOpen(true)}
        onMouseLeave={() => setIsHandDrawerOpen(false)}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${
            (!activeDrag && isHandDrawerOpen) ? '0%' : 'calc(100% - 46px)'
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
          boxShadow: (!activeDrag && isHandDrawerOpen)
            ? '0 -14px 45px rgba(0, 0, 0, 0.9), 0 0 25px rgba(255, 0, 0, 0.3)'
            : '0 -4px 18px rgba(0, 0, 0, 0.7)',
          boxSizing: 'border-box',
          paddingBottom: '10px',
          overflow: 'hidden'
        }}
      >
        {/* Pull Tab Bar */}
        <div
          onClick={() => setIsHandDrawerOpen(prev => !prev)}
          style={{
            width: '100%',
            height: '46px',
            minHeight: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            cursor: 'pointer',
            borderBottom: (!activeDrag && isHandDrawerOpen) ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
            userSelect: 'none',
            background: (!activeDrag && isHandDrawerOpen) ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
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
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              color: '#1e1e1e',
              fontWeight: 800,
              fontSize: '0.74rem',
              lineHeight: 1,
              borderRadius: '9999px',
              flexShrink: 0
            }}>
              {availableWhiteCards.length} beyaz
            </span>

            <span style={{
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FF0000',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.74rem',
              lineHeight: 1,
              borderRadius: '9999px',
              flexShrink: 0
            }}>
              {availableRedCards.length} kırmızı
            </span>
          </div>

          {/* Middle Action Hint */}
          <div style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: isMyTurn ? '#34d399' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isMyTurn && phase === 'PERKS' && <span>kartını masana sürükle veya tıkla</span>}
            {isMyTurn && phase === 'SABOTAGE' && <span>kırmızı kartını hedef masaya sürükle</span>}
            {isSingle && (phase === 'VOTING' || phase === 'REVEAL') && <span>kazanan masayı seçmek için üzerine tıkla</span>}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: (!activeDrag && isHandDrawerOpen) ? '#94a3b8' : '#ffffff',
            fontSize: '0.8rem',
            fontWeight: 700,
            lineHeight: 1
          }}>
            {(!activeDrag && isHandDrawerOpen) ? (
              <>
                <ChevronDown size={15} />
                <span>desteyi gizle</span>
              </>
            ) : (
              <>
                <ChevronUp size={15} />
                <span>kartlarını açmak için tıkla / üzerine gel</span>
              </>
            )}
          </div>
        </div>

        {/* Spacious Horizontal Cards Rack Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: (availableWhiteCards.length + availableRedCards.length) <= 7 ? 'center' : 'flex-start',
          gap: '14px',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '16px 28px 16px 28px',
          boxSizing: 'border-box',
          scrollbarWidth: 'thin',
          minHeight: '252px',
          pointerEvents: activeDrag ? 'none' : 'auto'
        }}>
          {/* White Perk Cards */}
          {availableWhiteCards.map((card, index) => {
            const isHovered = hoveredCardId === card.id;
            const isBeingDragged = activeDrag?.card?.id === card.id;
            const canPlay = isMyTurn && phase === 'PERKS' && !myCandidate?.whiteCardsSubmitted;

            return (
              <div
                key={card.id}
                onPointerDown={(e) => startCardDrag(e, card, 'perk')}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => !activeDrag && handleCardClick(card, 'perk')}
                style={{
                  position: 'relative',
                  width: '148px',
                  minWidth: '148px',
                  maxWidth: '148px',
                  height: '208px',
                  zIndex: isHovered ? 50 : 10 + index,
                  transform: isHovered
                    ? 'translateY(-10px) scale(1.04)'
                    : 'translateY(0px) scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: canPlay ? 'grab' : 'default',
                  opacity: (phase !== 'PERKS' && isMyTurn) ? 0.6 : (isBeingDragged ? 0.2 : 1),
                  touchAction: 'none',
                  userSelect: 'none',
                  flexShrink: 0
                }}
              >
                <CardItem
                  card={card}
                  type="perk"
                  isSelected={isHovered}
                  theme={player?.equippedTheme}
                  appConfig={appConfig}
                />
              </div>
            );
          })}

          {/* Divider between White and Red cards if both exist */}
          {availableWhiteCards.length > 0 && availableRedCards.length > 0 && (
            <div style={{
              width: '2px',
              height: '170px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(239, 68, 68, 0.4), rgba(255,255,255,0.1))',
              margin: '0 6px',
              flexShrink: 0,
              borderRadius: '9999px'
            }} />
          )}

          {/* Red Flag Sabotage Cards */}
          {availableRedCards.map((card, index) => {
            const isHovered = hoveredCardId === card.id;
            const isBeingDragged = activeDrag?.card?.id === card.id;
            const canPlay = isMyTurn && phase === 'SABOTAGE' && mySabotageTarget && !mySabotageTarget.targetCandidate?.hasRedFlag;

            return (
              <div
                key={card.id}
                onPointerDown={(e) => startCardDrag(e, card, 'redflag')}
                onMouseEnter={() => setHoveredCardId(card.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => !activeDrag && handleCardClick(card, 'redflag')}
                style={{
                  position: 'relative',
                  width: '148px',
                  minWidth: '148px',
                  maxWidth: '148px',
                  height: '208px',
                  zIndex: isHovered ? 50 : 25 + index,
                  transform: isHovered
                    ? 'translateY(-10px) scale(1.04)'
                    : 'translateY(0px) scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: canPlay ? 'grab' : 'default',
                  opacity: (phase !== 'SABOTAGE' && isMyTurn) ? 0.6 : (isBeingDragged ? 0.2 : 1),
                  touchAction: 'none',
                  userSelect: 'none',
                  flexShrink: 0
                }}
              >
                <CardItem
                  card={card}
                  type="redflag"
                  isSelected={isHovered}
                  theme={player?.equippedTheme}
                  appConfig={appConfig}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* REALTIME FLOATING DRAG CARD FOR LOCAL PLAYER */}
      {activeDrag && (
        <div
          style={{
            position: 'fixed',
            left: `${activeDrag.x}px`,
            top: `${activeDrag.y}px`,
            transform: `translate(-50%, -50%) rotate(${activeDrag.tilt}deg) scale(1.08)`,
            zIndex: 10000,
            pointerEvents: 'none',
            filter: activeDrag.targetSlot
              ? 'drop-shadow(0 0 28px rgba(255, 255, 255, 0.95))'
              : 'drop-shadow(0 20px 45px rgba(0, 0, 0, 0.85))',
            transition: 'transform 0.04s ease-out',
            width: '154px',
            userSelect: 'none'
          }}
        >
          <CardItem
            card={activeDrag.card}
            type={activeDrag.type}
            isSelected={true}
            theme={player?.equippedTheme}
            appConfig={appConfig}
          />
        </div>
      )}

      {/* REALTIME FLOATING DRAGGING CARDS FOR OTHER PLAYERS IN ROOM */}
      {Object.entries(remoteDrags).map(([rPlayerId, info]) => {
        if (!info || !info.isDragging) return null;

        const isWhite = info.cardType === 'perk';
        const rPlayer = players.find(p => p.id === rPlayerId);
        const rTheme = (appConfig?.market?.themes || []).find(t => t.id === rPlayer?.equippedTheme) || null;
        const rWhiteBackUrl = rTheme?.whiteBack || rTheme?.images?.whiteBack || whiteCardBackImg;
        const rRedBackUrl = rTheme?.redBack || rTheme?.images?.redBack || redCardBackImg;

        return (
          <div
            key={rPlayerId}
            style={{
              position: 'fixed',
              left: `${(info.normX || 0.5) * 100}vw`,
              top: `${(info.normY || 0.5) * 100}vh`,
              transform: `translate(-50%, -50%) rotate(${info.tilt || 0}deg) scale(0.92)`,
              zIndex: 9990,
              pointerEvents: 'none',
              transition: 'left 0.08s ease-out, top 0.08s ease-out, transform 0.08s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              userSelect: 'none'
            }}
          >
            {/* Player Name Badge Floating Above Remote Card */}
            <div style={{
              background: 'rgba(15, 15, 15, 0.92)',
              border: isWhite ? '1.5px solid #ffffff' : '1.5px solid #FF0000',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: isWhite ? '0 4px 16px rgba(255, 255, 255, 0.35)' : '0 4px 16px rgba(255, 0, 0, 0.45)',
              textTransform: 'lowercase'
            }}>
              <span>{info.playerName} kart sürüklüyor...</span>
            </div>

            {/* Floating Card Representation */}
            <div style={{
              width: 'clamp(90px, 7.5vw, 120px)',
              aspectRatio: '5 / 7',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: isWhite
                ? '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(255, 255, 255, 0.45)'
                : '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(255, 0, 0, 0.55)',
              border: '1.5px solid rgba(0,0,0,0.35)'
            }}>
              <img
                src={isWhite ? rWhiteBackUrl : rRedBackUrl}
                alt="remote card"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        );
      })}

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
