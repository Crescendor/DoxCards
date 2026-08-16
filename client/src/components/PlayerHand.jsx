import React, { useState, useEffect } from 'react';
import { Heart, Flag, ShieldAlert, Sparkles, Check } from 'lucide-react';
import CardItem from './CardItem';
import { sounds } from '../services/soundEffects';

export default function PlayerHand({
  hand = { whiteCards: [], redCards: [] },
  phase,
  isSingle,
  mySabotageTarget,
  onSubmitPerks,
  onSubmitSabotage,
  candidates,
  myPlayerId
}) {
  const [selectedWhiteCardIds, setSelectedWhiteCardIds] = useState([]);
  const [selectedRedCardId, setSelectedRedCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('white'); // 'white' | 'red'

  useEffect(() => {
    setSelectedWhiteCardIds([]);
    setSelectedRedCardId(null);
    if (phase === 'SABOTAGE') {
      setActiveTab('red');
    } else {
      setActiveTab('white');
    }
  }, [phase]);

  const handleWhiteCardClick = (cardId) => {
    if (phase !== 'PERKS') return;
    sounds.playClick();

    if (selectedWhiteCardIds.includes(cardId)) {
      setSelectedWhiteCardIds(selectedWhiteCardIds.filter(id => id !== cardId));
    } else {
      if (selectedWhiteCardIds.length < 2) {
        setSelectedWhiteCardIds([...selectedWhiteCardIds, cardId]);
      } else {
        setSelectedWhiteCardIds([selectedWhiteCardIds[0], cardId]);
      }
    }
  };

  const handleRedCardClick = (cardId) => {
    if (phase !== 'SABOTAGE') return;
    sounds.playClick();

    if (selectedRedCardId === cardId) {
      setSelectedRedCardId(null);
    } else {
      setSelectedRedCardId(cardId);
    }
  };

  const handlePerksSubmit = () => {
    if (selectedWhiteCardIds.length === 2) {
      sounds.playCardDeal();
      onSubmitPerks(selectedWhiteCardIds);
      setSelectedWhiteCardIds([]);
    }
  };

  const handleSabotageSubmit = () => {
    if (selectedRedCardId) {
      sounds.playSabotage();
      onSubmitSabotage(selectedRedCardId);
      setSelectedRedCardId(null);
    }
  };

  const myCandidate = candidates && candidates[myPlayerId];
  const hasSubmittedPerks = myCandidate && myCandidate.whiteCardsSubmitted;
  const hasSubmittedSabotage = mySabotageTarget && mySabotageTarget.targetCandidate && mySabotageTarget.targetCandidate.hasRedFlag;

  // Single Role Notice
  if (isSingle) {
    return (
      <div className="player-hand-tray">
        <div className="hand-tray-inner" style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '10px 24px',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 600 }}>bu tur bekârsın</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                çöpçatanların adayları hazırlamasını bekle. adaylar açılınca kararını vereceksin.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-hand-tray">
      <div className="hand-tray-inner">
        {/* Hand Top Bar */}
        <div className="hand-header-bar">
          <div className="hand-title">
            {phase === 'PERKS' && (
              <>
                <Heart size={18} color="#ef4444" fill="#ef4444" />
                <span>
                  {hasSubmittedPerks
                    ? 'adayın hazır, diğer oyuncular bekleniyor'
                    : `bekâr için 2 beyaz kart seç (${selectedWhiteCardIds.length}/2)`}
                </span>
              </>
            )}

            {phase === 'SABOTAGE' && (
              <>
                <ShieldAlert size={18} color="#ef4444" />
                <span>
                  {hasSubmittedSabotage
                    ? 'sabotajın masaya gönderildi'
                    : `rakibine kırmızı bayrak koy (hedef: ${mySabotageTarget?.targetPlayerName || 'rakip'})`}
                </span>
              </>
            )}

            {(phase === 'REVEAL' || phase === 'VOTING' || phase === 'ROUND_SUMMARY') && (
              <>
                <Sparkles size={18} color="#f59e0b" />
                <span>elinizdeki kartlar</span>
              </>
            )}
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)'
            }}>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('white');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: activeTab === 'white' ? '#fff' : 'transparent',
                  color: activeTab === 'white' ? '#000' : '#94a3b8'
                }}
              >
                beyaz ({hand.whiteCards?.length || 0})
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('red');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: activeTab === 'red' ? '#ef4444' : 'transparent',
                  color: '#fff'
                }}
              >
                kırmızı ({hand.redCards?.length || 0})
              </button>
            </div>

            {/* Submit Perks */}
            {phase === 'PERKS' && !hasSubmittedPerks && (
              <button
                onClick={handlePerksSubmit}
                disabled={selectedWhiteCardIds.length !== 2}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                <Check size={16} /> adayı gönder ({selectedWhiteCardIds.length}/2)
              </button>
            )}

            {/* Submit Sabotage */}
            {phase === 'SABOTAGE' && !hasSubmittedSabotage && (
              <button
                onClick={handleSabotageSubmit}
                disabled={!selectedRedCardId}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                <Flag size={16} /> sabotajı gönder
              </button>
            )}
          </div>
        </div>

        {/* Cards Row in Hand */}
        <div className="hand-cards-grid">
          {activeTab === 'white' ? (
            hand.whiteCards && hand.whiteCards.length > 0 ? (
              hand.whiteCards.map((card) => {
                const isSelected = selectedWhiteCardIds.includes(card.id);
                const orderIdx = selectedWhiteCardIds.indexOf(card.id);
                const disabled = phase !== 'PERKS' || hasSubmittedPerks;

                return (
                  <div
                    key={card.id}
                    className={`hand-card-wrapper ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleWhiteCardClick(card.id)}
                  >
                    {isSelected && (
                      <div className="selection-order-badge">
                        {orderIdx + 1}
                      </div>
                    )}
                    <CardItem card={card} type="perk" isSelected={isSelected} />
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', padding: '16px', fontSize: '0.85rem' }}>
                elinizde beyaz kart kalmadı.
              </div>
            )
          ) : (
            hand.redCards && hand.redCards.length > 0 ? (
              hand.redCards.map((card) => {
                const isSelected = selectedRedCardId === card.id;
                const disabled = phase !== 'SABOTAGE' || hasSubmittedSabotage;

                return (
                  <div
                    key={card.id}
                    className={`hand-card-wrapper ${isSelected ? 'selected-red' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && handleRedCardClick(card.id)}
                  >
                    {isSelected && (
                      <div className="selection-order-badge" style={{ background: '#ef4444', color: '#fff' }}>
                        1
                      </div>
                    )}
                    <CardItem card={card} type="redflag" isSelected={isSelected} />
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', padding: '16px', fontSize: '0.85rem' }}>
                elinizde kırmızı bayrak kartı kalmadı.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
