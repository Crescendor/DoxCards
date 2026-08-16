import React, { useState, useEffect } from 'react';
import { PenTool, Check, X } from 'lucide-react';
import cardWhiteBack from '../assets/cards/card_white_back.png';
import cardRedBack from '../assets/cards/card_red_back.png';
import { sounds } from '../services/soundEffects';

export const BLANK_REGEX = /([_\s]*_{2,}[_\s]*)|\[boşluk\]|\{blank\}/i;

export function isBlankCard(text) {
  if (!text) return false;
  return BLANK_REGEX.test(text);
}

export function formatBlankCardText(text, fillValue = null) {
  if (!text) return '';
  if (fillValue) {
    return text.replace(BLANK_REGEX, `[ ${fillValue.trim()} ]`);
  }
  return text;
}

export default function FillBlankModal({ isOpen, card, onConfirm, onCancel }) {
  if (!isOpen || !card) return null;

  const [customText, setCustomText] = useState('');
  const isWhite = card.type === 'perk' || card.type === 'white';

  useEffect(() => {
    setCustomText('');
  }, [card]);

  const handleConfirm = (e) => {
    e?.preventDefault();
    if (!customText.trim()) return;
    sounds.playClick();
    onConfirm(customText.trim());
  };

  // Find exact first blank instance
  const match = (card.text || '').match(BLANK_REGEX);
  let before = card.text || '';
  let after = '';
  if (match) {
    before = (card.text || '').substring(0, match.index);
    after = (card.text || '').substring(match.index + match[0].length);
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content animate-pop" style={{
        maxWidth: '480px',
        width: '92vw',
        background: '#1c1c1c',
        borderRadius: '20px',
        padding: '24px',
        color: '#ffffff',
        border: isWhite ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: isWhite ? '#ffffff' : '#d90429',
              color: isWhite ? '#000000' : '#ffffff',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <PenTool size={16} />
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              karttaki boşluğu doldur
            </h3>
          </div>

          <button onClick={onCancel} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Card Live Preview */}
        <div style={{
          position: 'relative',
          borderRadius: '14px',
          overflow: 'hidden',
          padding: '22px 20px',
          minHeight: '130px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '20px',
          border: isWhite ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: isWhite ? '0 8px 24px rgba(255,255,255,0.06)' : '0 8px 24px rgba(239,68,68,0.2)'
        }}>
          {/* Card Background Image */}
          <img
            src={isWhite ? cardWhiteBack : cardRedBack}
            alt="card bg"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />

          {/* Card Text with Exactly ONE Filled Blank */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            color: isWhite ? '#ff0000' : '#ffffff',
            fontWeight: 700,
            fontSize: '1.02rem',
            lineHeight: '1.4',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            {match ? (
              <>
                <span>{before}</span>
                <span style={{
                  background: customText.trim()
                    ? (isWhite ? 'rgba(0, 0, 0, 0.08)' : '#ffffff')
                    : 'rgba(0, 0, 0, 0.15)',
                  color: customText.trim()
                    ? '#000000'
                    : (isWhite ? '#94a3b8' : '#cbd5e1'),
                  borderBottom: `2px dashed ${customText.trim() ? '#000000' : '#94a3b8'}`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 900,
                  margin: '0 4px',
                  textDecoration: customText.trim() ? 'underline' : 'none',
                  display: 'inline-block'
                }}>
                  {customText.trim() || '_________'}
                </span>
                <span>{after}</span>
              </>
            ) : (
              <span>{card.text}</span>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.82rem' }}>
              boşluğa gelecek kelime / cümle
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="kelime veya cümlenizi yazınız..."
              maxLength={45}
              className="form-input"
              style={{ fontSize: '0.95rem', height: '46px', background: '#242424' }}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ flex: 1, padding: '12px' }}
            >
              vazgeç
            </button>
            <button
              type="submit"
              disabled={!customText.trim()}
              className="btn-primary"
              style={{ flex: 2, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Check size={16} /> kartı masaya koy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
