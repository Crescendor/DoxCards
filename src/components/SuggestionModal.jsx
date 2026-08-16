import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, CheckCircle2, Clock, XCircle, ShieldCheck, HelpCircle, Edit3, X, Sparkles, Send } from 'lucide-react';
import { fetchSuggestions, createSuggestion, updateSuggestion, deleteSuggestion } from '../services/userService';
import { sounds } from '../services/soundEffects';

export default function SuggestionModal({
  isOpen,
  onClose,
  userProfile,
  allDecks = ['Ana Deste', 'Ek Paket', 'Nerd Paket', 'Fenasal Nerd Paket', 'Sekso Paket', 'Kara Paket']
}) {
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'deck' | 'my_suggestions'
  const [mySuggestions, setMySuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Single Card Suggestion Form
  const [cardForm, setCardForm] = useState({
    type: 'perk', // 'perk' (white) | 'redflag' (red)
    text: '',
    targetDeck: 'Ana Deste',
    isAnonymous: false
  });

  // Deck Suggestion Form (Min 10 White + Min 10 Red)
  const [deckForm, setDeckForm] = useState({
    title: '',
    description: '',
    extraNote: '',
    whiteCards: ['', '', '', '', '', '', '', '', '', ''], // 10 initial
    redCards: ['', '', '', '', '', '', '', '', '', ''],   // 10 initial
    isAnonymous: false
  });

  // Editing state
  const [editingSug, setEditingSug] = useState(null);

  useEffect(() => {
    if (isOpen && userProfile?.id) {
      loadMySuggestions();
    }
  }, [isOpen, userProfile]);

  const loadMySuggestions = async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    const data = await fetchSuggestions(userProfile.id);
    setMySuggestions(Array.isArray(data) ? data : []);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  // Handle Card Suggestion Submit
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!cardForm.text.trim()) {
      setMsg({ text: 'Lütfen kart metnini girin.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMsg({ text: '', type: '' });

    const payload = {
      type: 'card',
      author: {
        id: userProfile?.id || 'anon',
        name: userProfile?.displayName || userProfile?.username || 'oyuncu',
        username: userProfile?.username || '',
        avatar: userProfile?.avatar || null,
        isAnonymous: cardForm.isAnonymous
      },
      cardData: {
        type: cardForm.type,
        text: cardForm.text.trim(),
        targetDeck: cardForm.targetDeck
      }
    };

    const res = await createSuggestion(payload);
    setIsLoading(false);

    if (res?.success) {
      sounds.playWin();
      setMsg({ text: 'Kart öneriniz başarıyla iletildi! İncelendikten sonra onaylanacaktır.', type: 'success' });
      setCardForm({ type: 'perk', text: '', targetDeck: 'Ana Deste', isAnonymous: false });
      loadMySuggestions();
    } else {
      setMsg({ text: res?.error || 'Kart önerisi gönderilemedi.', type: 'error' });
    }
  };

  // Handle Deck Suggestion Submit
  const handleDeckSubmit = async (e) => {
    e.preventDefault();
    const cleanWhite = deckForm.whiteCards.map(t => t.trim()).filter(Boolean);
    const cleanRed = deckForm.redCards.map(t => t.trim()).filter(Boolean);

    if (!deckForm.title.trim()) {
      setMsg({ text: 'Lütfen deste adını girin.', type: 'error' });
      return;
    }

    if (cleanWhite.length < 10 || cleanRed.length < 10) {
      setMsg({
        text: `Deste önerebilmek için en az 10 beyaz ve 10 kırmızı kart girmelisiniz. (Şu an: ${cleanWhite.length} beyaz, ${cleanRed.length} kırmızı)`,
        type: 'error'
      });
      return;
    }

    setIsLoading(true);
    setMsg({ text: '', type: '' });

    const payload = {
      type: 'deck',
      author: {
        id: userProfile?.id || 'anon',
        name: userProfile?.displayName || userProfile?.username || 'oyuncu',
        username: userProfile?.username || '',
        avatar: userProfile?.avatar || null,
        isAnonymous: deckForm.isAnonymous
      },
      deckData: {
        title: deckForm.title.trim(),
        description: deckForm.description.trim(),
        extraNote: deckForm.extraNote.trim(),
        whiteCards: cleanWhite,
        redCards: cleanRed
      }
    };

    const res = await createSuggestion(payload);
    setIsLoading(false);

    if (res?.success) {
      sounds.playWin();
      setMsg({ text: 'Deste öneriniz başarıyla iletildi! Admin ekibi inceledikten sonra oyuna eklenecektir.', type: 'success' });
      setDeckForm({
        title: '',
        description: '',
        extraNote: '',
        whiteCards: ['', '', '', '', '', '', '', '', '', ''],
        redCards: ['', '', '', '', '', '', '', '', '', ''],
        isAnonymous: false
      });
      loadMySuggestions();
    } else {
      setMsg({ text: res?.error || 'Deste önerisi gönderilemedi.', type: 'error' });
    }
  };

  // Delete suggestion
  const handleDelete = async (sugId) => {
    if (!window.confirm('Bu önerinizi silmek istediğinize emin misiniz?')) return;
    sounds.playClick();
    const res = await deleteSuggestion(sugId);
    if (res?.success) {
      loadMySuggestions();
    }
  };

  const validWhiteCount = deckForm.whiteCards.filter(t => t.trim()).length;
  const validRedCount = deckForm.redCards.filter(t => t.trim()).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          background: '#181818',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#1e1e1e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(255, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lightbulb size={20} color="#FF0000" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, textTransform: 'lowercase' }}>
                kart & deste önerisi
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                topluluğa yeni kartlar ve desteler kazandırın
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 24px',
          background: '#141414',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('card'); setMsg({ text: '', type: '' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'card' ? '#FF0000' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              textTransform: 'lowercase',
              transition: 'all 0.2s ease'
            }}
          >
            🃏 kart öner
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('deck'); setMsg({ text: '', type: '' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'deck' ? '#FF0000' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              textTransform: 'lowercase',
              transition: 'all 0.2s ease'
            }}
          >
            📦 deste öner (min 10+10)
          </button>

          <button
            type="button"
            onClick={() => { sounds.playClick(); setActiveTab('my_suggestions'); loadMySuggestions(); setMsg({ text: '', type: '' }); }}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: activeTab === 'my_suggestions' ? '#FF0000' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              textTransform: 'lowercase',
              transition: 'all 0.2s ease',
              marginLeft: 'auto'
            }}
          >
            📋 önerilerim ({mySuggestions.length})
          </button>
        </div>

        {/* Notification Message */}
        {msg.text && (
          <div style={{
            margin: '12px 24px 0 24px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${msg.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            color: msg.type === 'error' ? '#f87171' : '#34d399',
            fontSize: '0.84rem',
            fontWeight: 700
          }}>
            {msg.text}
          </div>
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* TAB 1: KART ÖNER */}
          {activeTab === 'card' && (
            <form onSubmit={handleCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                  kart türü
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCardForm(prev => ({ ...prev, type: 'perk' }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: cardForm.type === 'perk' ? '#ffffff' : '#222222',
                      color: cardForm.type === 'perk' ? '#1e1e1e' : '#94a3b8',
                      border: cardForm.type === 'perk' ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    ⚪ beyaz kart (avantaj / perk)
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardForm(prev => ({ ...prev, type: 'redflag' }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: cardForm.type === 'redflag' ? '#FF0000' : '#222222',
                      color: '#ffffff',
                      border: cardForm.type === 'redflag' ? '2px solid #FF0000' : '1px solid rgba(255, 255, 255, 0.1)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🔴 kırmızı kart (sabotaj / red flag)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                  kart metni (boşluk için <code>[boşluk]</code> yazabilirsiniz)
                </label>
                <textarea
                  value={cardForm.text}
                  onChange={(e) => setCardForm(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="örn: her sabah [boşluk] şarkısıyla uyanıyor"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#141414',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                  önerilen hedef deste (isteğe bağlı)
                </label>
                <select
                  value={cardForm.targetDeck}
                  onChange={(e) => setCardForm(prev => ({ ...prev, targetDeck: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#141414',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {allDecks.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Anonymous Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: '#e2e8f0',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={cardForm.isAnonymous}
                  onChange={(e) => setCardForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#FF0000', cursor: 'pointer' }}
                />
                <span>kartı anonim olarak öner (adımı gizle)</span>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '13px',
                  borderRadius: '12px',
                  background: '#FF0000',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: '0 4px 15px rgba(255, 0, 0, 0.3)'
                }}
              >
                <Send size={16} /> {isLoading ? 'gönderiliyor...' : 'kart önerisini gönder'}
              </button>
            </form>
          )}

          {/* TAB 2: DESTE ÖNER */}
          {activeTab === 'deck' && (
            <form onSubmit={handleDeckSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '10px 14px',
                borderRadius: '12px',
                color: '#fbbf24',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                ⚠️ Deste önerebilmek için en az <b>10 Beyaz Kart</b> ve <b>10 Kırmızı Kart</b> girilmelidir.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                    deste adı *
                  </label>
                  <input
                    type="text"
                    value={deckForm.title}
                    onChange={(e) => setDeckForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="örn: Geek Paketi"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#141414',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                    deste ek notu (kartların altında görünür)
                  </label>
                  <input
                    type="text"
                    value={deckForm.extraNote}
                    onChange={(e) => setDeckForm(prev => ({ ...prev, extraNote: e.target.value }))}
                    placeholder="örn: v1.0 Özel Seri"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#141414',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#94a3b8' }}>
                  deste açıklaması
                </label>
                <input
                  type="text"
                  value={deckForm.description}
                  onChange={(e) => setDeckForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deste hakkında kısa açıklama..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#141414',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* White Cards Inputs (Min 10) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff' }}>
                    ⚪ Beyaz Kartlar ({validWhiteCount}/10 en az)
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeckForm(prev => ({ ...prev, whiteCards: [...prev.whiteCards, ''] }))}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} /> kart ekle
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {deckForm.whiteCards.map((text, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: '22px' }}>#{idx + 1}</span>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                          const updated = [...deckForm.whiteCards];
                          updated[idx] = e.target.value;
                          setDeckForm(prev => ({ ...prev, whiteCards: updated }));
                        }}
                        placeholder={`Beyaz kart metni #${idx + 1}...`}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: '#141414',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          fontSize: '0.84rem'
                        }}
                      />
                      {deckForm.whiteCards.length > 10 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deckForm.whiteCards.filter((_, i) => i !== idx);
                            setDeckForm(prev => ({ ...prev, whiteCards: updated }));
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Cards Inputs (Min 10) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f87171' }}>
                    🔴 Kırmızı Kartlar (Sabotaj) ({validRedCount}/10 en az)
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeckForm(prev => ({ ...prev, redCards: [...prev.redCards, ''] }))}
                    style={{
                      background: 'rgba(255, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 0, 0, 0.3)',
                      color: '#ff6666',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} /> kart ekle
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {deckForm.redCards.map((text, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: '22px' }}>#{idx + 1}</span>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => {
                          const updated = [...deckForm.redCards];
                          updated[idx] = e.target.value;
                          setDeckForm(prev => ({ ...prev, redCards: updated }));
                        }}
                        placeholder={`Kırmızı kart metni #${idx + 1}...`}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: '#141414',
                          border: '1px solid rgba(255, 0, 0, 0.25)',
                          color: '#ffffff',
                          fontSize: '0.84rem'
                        }}
                      />
                      {deckForm.redCards.length > 10 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = deckForm.redCards.filter((_, i) => i !== idx);
                            setDeckForm(prev => ({ ...prev, redCards: updated }));
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: '#e2e8f0',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={deckForm.isAnonymous}
                  onChange={(e) => setDeckForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#FF0000', cursor: 'pointer' }}
                />
                <span>desteyi anonim olarak öner</span>
              </label>

              <button
                type="submit"
                disabled={isLoading || validWhiteCount < 10 || validRedCount < 10}
                style={{
                  padding: '13px',
                  borderRadius: '12px',
                  background: (validWhiteCount >= 10 && validRedCount >= 10) ? '#FF0000' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  cursor: (validWhiteCount >= 10 && validRedCount >= 10) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: (validWhiteCount >= 10 && validRedCount >= 10) ? '0 4px 15px rgba(255, 0, 0, 0.3)' : 'none'
                }}
              >
                <Send size={16} /> {isLoading ? 'gönderiliyor...' : 'deste önerisini gönder (10+10)'}
              </button>
            </form>
          )}

          {/* TAB 3: ÖNERİLERİM VE DURUMLARI */}
          {activeTab === 'my_suggestions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mySuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 10px', color: '#94a3b8', fontSize: '0.88rem' }}>
                  Henüz bir kart veya deste önerisinde bulunmadınız.
                </div>
              ) : (
                mySuggestions.map((sug) => {
                  const isApproved = sug.status === 'approved';
                  const isRejected = sug.status === 'rejected';
                  const isPending = !isApproved && !isRejected;

                  return (
                    <div
                      key={sug.id}
                      style={{
                        background: '#222222',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: sug.type === 'deck' ? '#3b82f6' : (sug.cardData?.type === 'perk' ? '#ffffff' : '#FF0000'),
                            color: sug.type === 'deck' ? '#ffffff' : (sug.cardData?.type === 'perk' ? '#000000' : '#ffffff'),
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            textTransform: 'lowercase'
                          }}>
                            {sug.type === 'deck' ? '📦 deste önerisi' : (sug.cardData?.type === 'perk' ? '⚪ beyaz kart' : '🔴 kırmızı kart')}
                          </span>

                          {sug.author?.isAnonymous && (
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                              (anonim)
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isPending && (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              color: '#fbbf24',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={12} /> inceleniyor
                            </span>
                          )}
                          {isApproved && (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34d399',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={12} /> onaylandı
                            </span>
                          )}
                          {isRejected && (
                            <span style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <XCircle size={12} /> reddedildi
                            </span>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleDelete(sug.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                              title="öneriyi sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content Preview */}
                      {sug.type === 'card' ? (
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                          "{sug.cardData?.text}"
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8', marginLeft: '8px' }}>
                            (Hedef: {sug.cardData?.targetDeck || 'Ana Deste'})
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                            {sug.deckData?.title} {sug.deckData?.extraNote && <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>- "{sug.deckData.extraNote}"</span>}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                            {sug.deckData?.description}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                            ⚪ {sug.deckData?.whiteCards?.length || 0} Beyaz Kart, 🔴 {sug.deckData?.redCards?.length || 0} Kırmızı Kart
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
