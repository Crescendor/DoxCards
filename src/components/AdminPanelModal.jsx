import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Search,
  Filter,
  Layers,
  FileCode,
  Check
} from 'lucide-react';
import {
  getActiveDeck,
  saveActiveDeck,
  resetActiveDeck,
  parseRawDeck,
  DEFAULT_RAW_CARDS
} from '../data/cardsData';
import { sounds } from '../services/soundEffects';

export const ADMIN_DISCORD_ID = '269639754675519489';

export default function AdminPanelModal({ isOpen, onClose, discordUser }) {
  if (!isOpen) return null;

  // Verify Admin Access
  if (discordUser?.id !== ADMIN_DISCORD_ID) {
    return (
      <div className="modal-overlay">
        <div className="modal-content animate-pop" style={{ maxWidth: '440px', textAlign: 'center' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '12px' }}>yetkisiz erişim</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            bu admin paneline yalnızca yetkili discord yöneticisi erişebilir.
          </p>
          <button onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>
            kapat
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'json'
  const [deckState, setDeckState] = useState(getActiveDeck());
  const [jsonText, setJsonText] = useState(JSON.stringify(deckState.raw, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'perk' | 'redflag'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Edit card state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Add card form state
  const [newType, setNewType] = useState('perk'); // 'perk' | 'redflag'
  const [newCategory, setNewCategory] = useState('Core Deck');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newText, setNewText] = useState('');

  // Update JSON text when deckState changes
  useEffect(() => {
    setJsonText(JSON.stringify(deckState.raw, null, 2));
  }, [deckState]);

  // Extract all categories
  const perkCategories = Object.keys(deckState.raw.Perks || {});
  const redFlagCategories = Object.keys(deckState.raw['Red Flags'] || {});
  const allCategories = Array.from(new Set([...perkCategories, ...redFlagCategories]));

  // Filter cards
  const filteredCards = deckState.allCards.filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || c.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Handle Save JSON
  const handleSaveJson = () => {
    sounds.playClick();
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.Perks && !parsed['Red Flags']) {
        throw new Error("JSON içerisinde 'Perks' veya 'Red Flags' anahtarları bulunmalıdır.");
      }
      saveActiveDeck(parsed);
      setDeckState(parseRawDeck(parsed));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setJsonError(err.message || 'Geçersiz JSON formatı!');
    }
  };

  // Handle File Upload (.json)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);
        setJsonText(JSON.stringify(parsed, null, 2));
        saveActiveDeck(parsed);
        setDeckState(parseRawDeck(parsed));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch (err) {
        alert('Yüklenen dosya geçerli bir JSON formatında değil!');
      }
    };
    reader.readAsText(file);
  };

  // Handle Download JSON
  const handleDownloadJson = () => {
    sounds.playClick();
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Red_Flags_Turkish_Complete.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Reset to Default
  const handleResetToDefault = () => {
    if (window.confirm('Tüm özel kart değişikliklerini sıfırlayıp orijinal Red Flags veritabanına dönmek istediğinize emin misiniz?')) {
      sounds.playClick();
      resetActiveDeck();
      setDeckState(parseRawDeck(DEFAULT_RAW_CARDS));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Delete Card
  const handleDeleteCard = (card) => {
    if (window.confirm(`"${card.text}" kartını silmek istediğinize emin misiniz?`)) {
      sounds.playClick();
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
      const section = card.type === 'perk' ? 'Perks' : 'Red Flags';

      if (updatedRaw[section] && updatedRaw[section][card.category]) {
        updatedRaw[section][card.category] = updatedRaw[section][card.category].filter(
          t => (t || '').trim().toLowerCase() !== card.text.toLowerCase()
        );
        saveActiveDeck(updatedRaw);
        setDeckState(parseRawDeck(updatedRaw));
      }
    }
  };

  // Start Inline Edit
  const handleStartEdit = (card) => {
    setEditingCardId(card.id);
    setEditingText(card.text);
  };

  // Save Inline Edit
  const handleSaveEdit = (card) => {
    if (!editingText.trim()) return;
    sounds.playClick();

    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    const section = card.type === 'perk' ? 'Perks' : 'Red Flags';

    if (updatedRaw[section] && updatedRaw[section][card.category]) {
      const idx = updatedRaw[section][card.category].findIndex(
        t => (t || '').trim().toLowerCase() === card.text.toLowerCase()
      );
      if (idx !== -1) {
        updatedRaw[section][card.category][idx] = editingText.trim();
        saveActiveDeck(updatedRaw);
        setDeckState(parseRawDeck(updatedRaw));
      }
    }
    setEditingCardId(null);
  };

  // Add Single Card Submit
  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    sounds.playClick();
    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    const section = newType === 'perk' ? 'Perks' : 'Red Flags';
    const targetCategory = customCategoryInput.trim() || newCategory;

    if (!updatedRaw[section]) updatedRaw[section] = {};
    if (!updatedRaw[section][targetCategory]) updatedRaw[section][targetCategory] = [];

    updatedRaw[section][targetCategory].push(newText.trim());

    saveActiveDeck(updatedRaw);
    setDeckState(parseRawDeck(updatedRaw));
    setNewText('');
    setCustomCategoryInput('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content animate-pop" style={{
        maxWidth: '920px',
        width: '95vw',
        maxHeight: '90vh',
        background: '#181818',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '16px',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#ef4444',
              color: '#fff',
              padding: '5px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                doxcards admin paneli
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                yönetici: {discordUser.displayName} ({discordUser.id})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '18px'
        }}>
          <div style={{ background: '#242424', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>toplam kart</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{deckState.allCards.length}</div>
          </div>
          <div style={{ background: '#242424', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>beyaz kartlar (perks)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>{deckState.whiteCards.length}</div>
          </div>
          <div style={{ background: '#242424', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>kırmızı kartlar (red flags)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{deckState.redCards.length}</div>
          </div>
          <div style={{ background: '#242424', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>kategoriler</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>{allCategories.length}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: '#242424',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '18px'
        }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '8px',
              background: activeTab === 'list' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Layers size={15} /> kart yönetimi ({filteredCards.length})
          </button>

          <button
            onClick={() => setActiveTab('add')}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '8px',
              background: activeTab === 'add' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={15} /> yeni kart ekle
          </button>

          <button
            onClick={() => setActiveTab('json')}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: '8px',
              background: activeTab === 'json' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileCode size={15} /> json düzenleyici & içe/dışa aktar
          </button>
        </div>

        {/* Save feedback toast */}
        {saveSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Check size={16} /> değişiklikler kaydedildi ve aktif desteye uygulandı!
          </div>
        )}

        {/* TAB 1: CARDS LIST */}
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{
                flex: 1,
                minWidth: '220px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="kart metninde ara..."
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '40px' }}
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input"
                style={{ width: '160px', height: '40px' }}
              >
                <option value="all">tüm türler</option>
                <option value="perk">🤍 beyaz (perk)</option>
                <option value="redflag">🚩 kırmızı (red flag)</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-input"
                style={{ width: '180px', height: '40px' }}
              >
                <option value="all">tüm kategoriler</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Scrollable Cards List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '6px'
            }}>
              {filteredCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  eşleşen kart bulunamadı.
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isPerk = card.type === 'perk';
                  const isEditing = editingCardId === card.id;

                  return (
                    <div
                      key={card.id}
                      style={{
                        background: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{
                          background: isPerk ? '#ffffff' : '#d90429',
                          color: isPerk ? '#000000' : '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {isPerk ? 'beyaz' : 'kırmızı'}
                        </span>

                        <span style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fbbf24',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap'
                        }}>
                          {card.category}
                        </span>

                        {isEditing ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="form-input"
                            style={{ height: '34px', fontSize: '0.88rem' }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#f1f5f9' }}>
                            {card.text}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(card)}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Save size={13} /> kaydet
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(card)}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.06)' }}
                            title="kartı düzenle"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCard(card)}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                          title="kartı sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADD CARD */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">kart türü</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNewType('perk')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: newType === 'perk' ? '#ffffff' : '#242424',
                      color: newType === 'perk' ? '#000000' : '#ffffff',
                      border: newType === 'perk' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 800,
                      fontSize: '0.88rem'
                    }}
                  >
                    🤍 beyaz kart (perk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('redflag')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      background: newType === 'redflag' ? '#d90429' : '#242424',
                      color: '#ffffff',
                      border: newType === 'redflag' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                      fontWeight: 800,
                      fontSize: '0.88rem'
                    }}
                  >
                    🚩 kırmızı kart (red flag)
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">kategori seçimi</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '8px' }}
                >
                  {(newType === 'perk' ? perkCategories : redFlagCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__NEW__">+ yeni kategori adı yaz</option>
                </select>

                {newCategory === '__NEW__' && (
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="yeni kategori adı giriniz..."
                    className="form-input"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="form-label">kart metni (türkçe)</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="kartın üzerindeki metni yazınız..."
                className="form-input"
                style={{ height: '110px', resize: 'vertical', fontSize: '0.92rem' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              <Plus size={16} /> yeni kartı veritabanına ekle
            </button>
          </form>
        )}

        {/* TAB 3: RAW JSON EDITOR & IMPORT/EXPORT */}
        {activeTab === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                doğrudan raw json düzenleyebilir, dosya yükleyebilir veya dışa aktarabilirsiniz.
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  style={{
                    background: '#242424',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Upload size={13} /> json yükle
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  style={{
                    background: '#242424',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Download size={13} /> json indir
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={13} /> sıfırla
                </button>
              </div>
            </div>

            {jsonError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                hata: {jsonError}
              </div>
            )}

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                flex: 1,
                minHeight: '260px',
                resize: 'none',
                background: '#121212',
                lineHeight: '1.4'
              }}
            />

            <button
              onClick={handleSaveJson}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              <Save size={16} /> json değişikliklerini kaydet ve aktif et
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
