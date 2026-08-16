import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import doxcardsLogo from '../assets/doxcards.png';
import { sounds } from '../services/soundEffects';

export default function LandingPage({
  player,
  onUpdatePlayer,
  onCreateRoom,
  onJoinRoom,
  error,
  isLoading
}) {
  const urlRoomCode = new URLSearchParams(window.location.search).get('room') || '';
  const [viewMode, setViewMode] = useState(urlRoomCode ? 'join' : 'menu'); // 'menu' | 'create' | 'join'
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode.toUpperCase());
  const [targetScore, setTargetScore] = useState(3);

  const handleNameChange = (e) => {
    onUpdatePlayer({ ...player, name: e.target.value.toLowerCase() });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!player.name.trim()) return;
    sounds.playClick();
    onCreateRoom({
      targetScore: Number(targetScore),
      deckType: 'all'
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!player.name.trim() || !roomCodeInput.trim()) return;
    sounds.playClick();
    onJoinRoom(roomCodeInput.trim().toUpperCase());
  };

  return (
    <div className="landing-hero animate-pop">
      {/* Official Centered Logo PNG */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <img
          src={doxcardsLogo}
          alt="dox"
          style={{
            width: '320px',
            maxWidth: '80vw',
            height: 'auto',
            display: 'block'
          }}
        />
      </div>

      {/* Main Landing Action Box */}
      <div className="minimal-card landing-action-box">
        {/* Initial Menu View: Pure Text Buttons */}
        {viewMode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => {
                sounds.playClick();
                setViewMode('create');
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '0.96rem' }}
            >
              oda oluştur
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setViewMode('join');
              }}
              className="btn-secondary"
              style={{ width: '100%', padding: '15px', fontSize: '0.96rem' }}
            >
              odaya katıl
            </button>
          </div>
        )}

        {/* Create Room Form */}
        {viewMode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="animate-pop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setViewMode('menu');
                }}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="geri dön"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>oda oluştur</h3>
            </div>

            <div className="form-group">
              <label className="form-label">oyuncu adın</label>
              <input
                type="text"
                value={player.name}
                onChange={handleNameChange}
                placeholder="bir isim yaz..."
                maxLength={18}
                className="form-input"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">hedef puan</label>
              <select
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="form-input"
              >
                <option value={3}>3 puan (hızlı)</option>
                <option value={5}>5 puan (standart)</option>
                <option value={7}>7 puan (uzun)</option>
              </select>
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.86rem', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !player.name.trim()}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              {isLoading ? 'oda oluşturuluyor...' : 'oda oluştur'}
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {viewMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="animate-pop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setViewMode('menu');
                }}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="geri dön"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>odaya katıl</h3>
            </div>

            <div className="form-group">
              <label className="form-label">oyuncu adın</label>
              <input
                type="text"
                value={player.name}
                onChange={handleNameChange}
                placeholder="bir isim yaz..."
                maxLength={18}
                className="form-input"
                autoFocus
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">oda kodu</label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ÖRN: RF7K2"
                maxLength={5}
                className="form-input room-code-input"
                required
              />
            </div>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.86rem', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !player.name.trim() || roomCodeInput.trim().length !== 5}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              {isLoading ? 'odaya bağlanılıyor...' : 'odaya katıl'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
