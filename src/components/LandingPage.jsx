import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import doxcardsLogo from '../assets/doxcards.png';
import defaultAvatarImg from '../assets/default_avatar.png';
import { sounds } from '../services/soundEffects';
import {
  getDiscordUser,
  initiateDiscordLogin,
  checkDiscordAuthCallback,
  logoutDiscord
} from '../services/discordAuth';
import { ADMIN_DISCORD_ID } from './AdminPageView';

// Discord SVG Logo Icon
function DiscordIcon() {
  return (
    <svg
      style={{ width: '22px', height: '22px', marginRight: '8px', flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -28.5 256 256"
      version="1.1"
      preserveAspectRatio="xMidYMid"
    >
      <g>
        <path
          d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
          fill="#5865F2"
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}

export default function LandingPage({
  player,
  onUpdatePlayer,
  onCreateRoom,
  onJoinRoom,
  onOpenAdmin,
  error,
  isLoading
}) {
  const getUrlRoomCode = () => {
    const params = new URLSearchParams(window.location.search);
    const qRoom = params.get('room') || params.get('join') || params.get('r');
    if (qRoom) return qRoom.toLowerCase().trim();
    const pathMatch = window.location.pathname.match(/^\/(?:room|join)\/([a-zA-Z0-9]{3,8})/i);
    return pathMatch ? pathMatch[1].toLowerCase().trim() : '';
  };

  const urlRoomCode = getUrlRoomCode();
  const [viewMode, setViewMode] = useState(urlRoomCode ? 'join' : 'menu'); // 'menu' | 'create' | 'join'
  const [roomCodeInput, setRoomCodeInput] = useState(urlRoomCode.toLowerCase());
  const [targetScore, setTargetScore] = useState(6);
  const [discordUser, setDiscordUser] = useState(getDiscordUser());
  const [useDiscordName, setUseDiscordName] = useState(true);

  // Check Discord redirect callback on mount
  useEffect(() => {
    checkDiscordAuthCallback().then(user => {
      if (user) {
        setDiscordUser(user);
        onUpdatePlayer({
          ...player,
          name: (user.displayName || user.username || '').toLowerCase().slice(0, 19),
          avatar: user.avatarUrl,
          discordId: user.id
        });
      } else if (discordUser && !player.discordId) {
        onUpdatePlayer({
          ...player,
          discordId: discordUser.id
        });
      }
    });
  }, []);

  const handleDiscordLogin = () => {
    sounds.playClick();
    initiateDiscordLogin();
  };

  const handleDiscordLogout = () => {
    sounds.playClick();
    logoutDiscord();
    setDiscordUser(null);
    onUpdatePlayer({
      ...player,
      avatar: null
    });
  };

  const handleNameChange = (e) => {
    onUpdatePlayer({ ...player, name: e.target.value.toLowerCase().slice(0, 19) });
  };

  const handleToggleNameSource = (isDiscord) => {
    setUseDiscordName(isDiscord);
    if (isDiscord && discordUser) {
      onUpdatePlayer({
        ...player,
        name: (discordUser.displayName || discordUser.username || '').toLowerCase().slice(0, 19)
      });
    }
  };

  const handleCreateDirect = () => {
    sounds.playClick();
    let activeName = player.name;
    if (!activeName || !activeName.trim()) {
      if (discordUser) {
        activeName = (discordUser.displayName || discordUser.username || 'oyuncu').toLowerCase().slice(0, 19);
      } else {
        activeName = 'oyuncu 1';
      }
      onUpdatePlayer({ ...player, name: activeName });
    }
    onCreateRoom({
      roundLimit: 6,
      targetScore: 6,
      deckType: 'all'
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    sounds.playClick();
    onJoinRoom(roomCodeInput.trim().toLowerCase());
  };

  const handleBackToMenu = () => {
    sounds.playClick();
    setViewMode('menu');
    window.history.pushState({}, '', window.location.pathname);
  };

  const activeAvatar = player.avatar || discordUser?.avatarUrl || defaultAvatarImg;
  const isAuthorizedAdmin = discordUser?.id === ADMIN_DISCORD_ID;

  return (
    <div className="landing-hero animate-pop">
      {/* Official Centered Logo PNG */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '28px'
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
        {/* User Profile / Discord Auth Status Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={activeAvatar}
              alt="avatar"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                background: '#000000'
              }}
            />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                {player.name || 'ziyaretçi'}
              </div>
              <div style={{ fontSize: '0.72rem', color: discordUser ? '#5865F2' : '#94a3b8', fontWeight: 600 }}>
                {discordUser ? `discord: ${discordUser.username}` : 'ziyaretçi girişi'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Admin Panel Button (Authorized Discord User ID only) */}
            {isAuthorizedAdmin && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Tam Ekran Admin Paneli"
              >
                <ShieldCheck size={14} /> admin
              </button>
            )}

            {discordUser ? (
              <button
                onClick={handleDiscordLogout}
                className="btn-icon"
                style={{ width: '30px', height: '30px' }}
                title="discord çıkışı yap"
              >
                <LogOut size={14} color="#fca5a5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Initial Menu View */}
        {viewMode === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleCreateDirect}
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {isLoading ? 'oda oluşturuluyor...' : 'oda oluştur'}
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setViewMode('join');
              }}
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              odaya katıl
            </button>

            {/* Admin Panel Full-Screen Link if Admin */}
            {isAuthorizedAdmin && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  background: 'rgba(255, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 0, 0, 0.35)',
                  color: '#ff4d4d',
                  fontWeight: 700
                }}
              >
                <ShieldCheck size={16} /> admin paneli
              </button>
            )}

            {/* Discord Login Button (If not logged in yet) */}
            {!discordUser && (
              <button
                type="button"
                onClick={handleDiscordLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'background 0.2s, transform 0.15s'
                }}
              >
                <DiscordIcon />
                <span>continue with discord</span>
              </button>
            )}
          </div>
        )}

        {/* Join Room Form */}
        {viewMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="animate-pop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={handleBackToMenu}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="geri dön"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>odaya katıl</h3>
            </div>

            {/* Room Invite Banner */}
            {urlRoomCode && (
              <div style={{
                background: 'rgba(255, 0, 0, 0.14)',
                border: '1px solid rgba(255, 0, 0, 0.35)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ff6666' }}>
                  oda daveti: <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#ffffff' }}>{urlRoomCode.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '2px' }}>
                  doğrudan bu odaya katılabilirsin.
                </div>
              </div>
            )}

            {/* If visitor (no Discord), allow changing visitor nickname */}
            {!discordUser && (
              <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="form-label">oyuncu adın</label>
                <input
                  type="text"
                  value={player.name}
                  onChange={handleNameChange}
                  placeholder="bir isim yaz..."
                  maxLength={19}
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label className="form-label">oda kodu</label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toLowerCase())}
                placeholder="örn: rf7k2"
                maxLength={5}
                className="form-input room-code-input"
                autoFocus
                required
              />
            </div>

            {/* Discord Option if not logged in */}
            {!discordUser && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={handleDiscordLogin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer'
                  }}
                >
                  <DiscordIcon />
                  <span>continue with discord</span>
                </button>
              </div>
            )}

            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.86rem', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !player.name.trim() || roomCodeInput.trim().length !== 5}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', background: '#FF0000' }}
            >
              {isLoading ? 'odaya bağlanılıyor...' : 'odaya katıl'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
