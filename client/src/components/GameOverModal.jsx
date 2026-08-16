import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, RotateCcw, LogOut } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export default function GameOverModal({
  isOpen,
  winnerId,
  winnerName,
  players = [],
  scores = {},
  stats = {},
  isHost,
  onPlayAgain,
  onLeave
}) {
  useEffect(() => {
    if (isOpen) {
      sounds.playWin();

      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));
  const winner = sortedPlayers[0];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '560px', textAlign: 'center', padding: '32px' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#f59e0b',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px'
        }}>
          <Trophy size={28} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
          oyun bitti
        </h1>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          tebrikler <b style={{ color: '#f59e0b' }}>{winner?.name || winnerName}</b>, en iyi çöpçatan olduğunu kanıtladın!
        </p>

        {/* Podium Leaderboard (No Avatars) */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.03)',
          border: '1px solid var(--border-site)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            skor tablosu
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : '#ffffff',
                  border: idx === 0 ? '1px solid #f59e0b' : '1px solid var(--border-site)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: idx === 0 ? '#f59e0b' : '#64748b' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</span>
                  {idx === 0 && <Crown size={15} color="#f59e0b" />}
                </div>

                <div style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem'
                }}>
                  {scores[p.id] || 0} puan
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {isHost ? (
            <button
              onClick={() => {
                sounds.playClick();
                onPlayAgain();
              }}
              className="btn-primary"
              style={{ flex: 1, padding: '12px 18px' }}
            >
              <RotateCcw size={16} /> yeniden oyna
            </button>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'flex', alignItems: 'center' }}>
              kurucunun yeniden başlatması bekleniyor...
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              onLeave();
            }}
            className="btn-secondary"
            style={{ padding: '12px 18px' }}
          >
            <LogOut size={16} /> odadan ayrıl
          </button>
        </div>
      </div>
    </div>
  );
}
