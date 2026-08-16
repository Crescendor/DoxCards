import React, { useState, useEffect } from 'react';
import { PenTool, Check, X } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const BLANK_REGEX = /(?:\[boşluk\]|[_\s]*_{2,}[_\s]*|\[blank\]|\{blank\})/i;

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
        border: '1px solid rgba(255, 0, 0, 0.35)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.85)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#FF0000',
              color: '#ffffff',
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

        {/* Clean Plain White Card Preview (No Card Pattern BG) */}
        <div style={{
          position: 'relative',
          borderRadius: '16px',
          padding: '24px 20px',
          minHeight: '110px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '20px',
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}>
          {/* Card Text with Clean Filled Blank */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            color: '#FF0000',
            fontWeight: 800,
            fontSize: '1.08rem',
            lineHeight: '1.45',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            {match ? (
              <>
                <span>{before}</span>
                {customText.trim() ? (
                  <span style={{
                    background: '#fff0f0',
                    color: '#000000',
                    borderBottom: '2.5px solid #FF0000',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 900,
                    margin: '0 4px',
                    textDecoration: 'underline',
                    display: 'inline-block'
                  }}>
                    {customText.trim()}
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-block',
                    width: '48px',
                    height: '2.5px',
                    background: '#FF0000',
                    margin: '0 6px',
                    verticalAlign: 'middle',
                    borderRadius: '2px',
                    opacity: 0.95
                  }} />
                )}
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
