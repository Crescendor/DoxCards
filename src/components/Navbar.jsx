import React, { useState } from 'react';
import { Volume2, VolumeX, HelpCircle, Copy, Check, LogOut } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export default function Navbar({ roomCode, isGameActive, onLeave, onOpenHelp, soundMuted, onToggleSound }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    sounds.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 100
    }}>
      {/* Room Code Badge (only when inside a room) */}
      {roomCode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isGameActive ? 'rgba(239, 68, 68, 0.25)' : '#ffffff',
          border: isGameActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #000000',
          padding: '6px 14px',
          borderRadius: '9999px',
          boxShadow: isGameActive ? '0 4px 16px rgba(0,0,0,0.5)' : '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          <span style={{ fontSize: '0.8rem', color: isGameActive ? '#fca5a5' : '#000000', fontWeight: 800 }}>
            oda:
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 900,
            fontSize: '1.05rem',
            color: isGameActive ? '#ffffff' : '#ef4444',
            letterSpacing: '0.08em'
          }}>
            {roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            title="oda kodunu kopyala"
            style={{
              background: 'transparent',
              color: copied ? '#10b981' : isGameActive ? '#fff' : '#000000',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {/* Sound Mute Toggle */}
      <button
        onClick={onToggleSound}
        className="btn-icon"
        title={soundMuted ? "sesi aç" : "sesi kapat"}
        style={{
          background: isGameActive ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
          border: isGameActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #000000',
          color: isGameActive ? '#ffffff' : '#000000',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}
      >
        {soundMuted ? <VolumeX size={18} color={isGameActive ? "#fca5a5" : "#94a3b8"} /> : <Volume2 size={18} color="#ef4444" />}
      </button>

      {/* How To Play */}
      <button
        onClick={() => {
          sounds.playClick();
          onOpenHelp();
        }}
        className="btn-icon"
        title="nasıl oynanır?"
        style={{
          background: isGameActive ? 'rgba(255, 255, 255, 0.12)' : '#ffffff',
          border: isGameActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #000000',
          color: isGameActive ? '#ffffff' : '#000000',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}
      >
        <HelpCircle size={18} />
      </button>

      {/* Leave Room (if inside room) */}
      {roomCode && (
        <button
          onClick={() => {
            sounds.playClick();
            if (window.confirm('odadan ayrılmak istediğinize emin misiniz?')) {
              onLeave();
            }
          }}
          className="btn-icon"
          title="odadan ayrıl"
          style={{
            background: isGameActive ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
            border: isGameActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1.5px solid #ef4444',
            color: '#ef4444',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
          }}
        >
          <LogOut size={18} />
        </button>
      )}
    </div>
  );
}
