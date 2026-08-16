import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Search,
  Layers,
  FileCode,
  Check,
  FolderEdit,
  PenTool,
  Sparkles,
  Tag
} from 'lucide-react';
import doxcardsLogo from '../assets/doxcards.png';
import {
  getActiveDeck,
  saveActiveDeck,
  resetActiveDeck,
  parseRawDeck,
  DEFAULT_RAW_CARDS
} from '../data/cardsData';
import { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';

export const ADMIN_DISCORD_ID = '269639754675519489';

export default function AdminPageView({ onBack, discordUser }) {
  // Verify Admin Access
  if (discordUser?.id !== ADMIN_DISCORD_ID) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#121212',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#1c1c1c',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: '36px 30px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.4rem' }}>yetkisiz erişim</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            bu admin paneline sadece yetkili discord yöneticisi ({ADMIN_DISCORD_ID}) erişebilir.
          </p>
          <button onClick={onBack} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
            ← ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'categories' | 'json'
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

  // Category Renaming State
  const [renamingCategory, setRenamingCategory] = useState(null); // { type: 'Perks'|'Red Flags', oldName: '' }
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');

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

  // Insert Blank Placeholder (______) into New Card Text
  const handleInsertBlankPlaceholder = () => {
    sounds.playClick();
    setNewText(prev => prev + ' ______ ');
  };

  // Rename Category
  const handleRenameCategorySubmit = (e) => {
    e.preventDefault();
    if (!renamingCategory || !newCategoryNameInput.trim()) return;

    sounds.playClick();
    const { section, oldName } = renamingCategory;
    const newName = newCategoryNameInput.trim();

    if (oldName === newName) {
      setRenamingCategory(null);
      return;
    }

    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    if (updatedRaw[section] && updatedRaw[section][oldName]) {
      const cardsList = updatedRaw[section][oldName];
      delete updatedRaw[section][oldName];
      updatedRaw[section][newName] = cardsList;

      saveActiveDeck(updatedRaw);
      setDeckState(parseRawDeck(updatedRaw));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setRenamingCategory(null);
  };

  // Delete Entire Category
  const handleDeleteCategory = (section, categoryName) => {
    if (window.confirm(`"${categoryName}" kategorisini ve içerisindeki tüm kartları silmek istediğinize emin misiniz?`)) {
      sounds.playClick();
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
      if (updatedRaw[section] && updatedRaw[section][categoryName]) {
        delete updatedRaw[section][categoryName];
        saveActiveDeck(updatedRaw);
        setDeckState(parseRawDeck(updatedRaw));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Top Admin Navbar */}
      <header style={{
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left: Back button & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> oyuna dön
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={doxcardsLogo} alt="dox" style={{ height: '28px', width: 'auto' }} />
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              admin paneli
            </span>
          </div>
        </div>

        {/* Right: Admin Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            yönetici: <b style={{ color: '#ffffff' }}>{discordUser.displayName}</b> ({discordUser.id})
          </span>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e'
          }} />
        </div>
      </header>

      {/* Main Admin Page Container */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Stats Dashboard Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
              toplam kart
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{deckState.allCards.length}</div>
          </div>

          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, marginBottom: '4px' }}>
              beyaz kartlar (perks)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
              {deckState.whiteCards.length}
            </div>
          </div>

          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600, marginBottom: '4px' }}>
              kırmızı kartlar (red flags)
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>
              {deckState.redCards.length}
            </div>
          </div>

          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
              kategori sayısı
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>
              {allCategories.length}
            </div>
          </div>
        </div>

        {/* Tab Selector Bar */}
        <div style={{
          display: 'flex',
          gap: '10px',
          background: '#1c1c1c',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              background: activeTab === 'list' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Layers size={18} /> kart yönetimi ({filteredCards.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              background: activeTab === 'categories' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FolderEdit size={18} /> kategorileri düzenle ({allCategories.length})
          </button>

          <button
            onClick={() => setActiveTab('add')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              background: activeTab === 'add' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} /> yeni kart ekle
          </button>

          <button
            onClick={() => setActiveTab('json')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              background: activeTab === 'json' ? '#d90429' : 'transparent',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <FileCode size={18} /> json düzenleyici & içe/dışa aktar
          </button>
        </div>

        {/* Feedback Alert */}
        {saveSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '12px 18px',
            borderRadius: '12px',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} /> değişiklikler kaydedildi ve aktif desteye uygulandı!
          </div>
        )}

        {/* TAB 1: CARDS LIST (FULL SCREEN) */}
        {activeTab === 'list' && (
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="kart metninde ara..."
                  className="form-input"
                  style={{ paddingLeft: '40px', height: '44px', background: '#242424' }}
                />
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input"
                style={{ width: '180px', height: '44px', background: '#242424' }}
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
                style={{ width: '220px', height: '44px', background: '#242424' }}
              >
                <option value="all">tüm kategoriler</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Cards Grid / Table */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '650px',
              overflowY: 'auto',
              paddingRight: '6px'
            }}>
              {filteredCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  eşleşen kart bulunamadı.
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isPerk = card.type === 'perk';
                  const isEditing = editingCardId === card.id;
                  const hasBlank = isBlankCard(card.text);

                  return (
                    <div
                      key={card.id}
                      style={{
                        background: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                        <span style={{
                          background: isPerk ? '#ffffff' : '#d90429',
                          color: isPerk ? '#000000' : '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          whiteSpace: 'nowrap'
                        }}>
                          {isPerk ? 'beyaz' : 'kırmızı'}
                        </span>

                        <span style={{
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fbbf24',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap'
                        }}>
                          {card.category}
                        </span>

                        {hasBlank && (
                          <span style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            <PenTool size={11} /> boşluklu kart
                          </span>
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="form-input"
                            style={{ height: '38px', fontSize: '0.92rem', flex: 1, minWidth: '300px' }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f1f5f9', flex: 1 }}>
                            {card.text}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(card)}
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                          >
                            <Save size={14} /> kaydet
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(card)}
                            className="btn-icon"
                            style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.06)' }}
                            title="kartı düzenle"
                          >
                            <Edit2 size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCard(card)}
                          className="btn-icon"
                          style={{ width: '34px', height: '34px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                          title="kartı sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '30px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderEdit size={20} color="#fbbf24" /> kategori isimlerini düzenleme & yönetme
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                kategorilerin isimlerini değiştirdiğinizde, o kategorideki tüm kartlar otomatik olarak yeni kategori ismine güncellenir.
              </p>
            </div>

            {/* Perks Categories Section */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
                🤍 beyaz kart (perks) kategorileri
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {perkCategories.map(catName => {
                  const count = (deckState.raw.Perks[catName] || []).length;
                  const isRenaming = renamingCategory?.section === 'Perks' && renamingCategory?.oldName === catName;

                  return (
                    <div
                      key={catName}
                      style={{
                        background: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      {isRenaming ? (
                        <form onSubmit={handleRenameCategorySubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            value={newCategoryNameInput}
                            onChange={(e) => setNewCategoryNameInput(e.target.value)}
                            className="form-input"
                            style={{ height: '36px', fontSize: '0.88rem' }}
                            autoFocus
                            required
                          />
                          <button
                            type="submit"
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            kaydet
                          </button>
                        </form>
                      ) : (
                        <>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{catName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{count} kart</div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setRenamingCategory({ section: 'Perks', oldName: catName });
                                setNewCategoryNameInput(catName);
                              }}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.08)' }}
                              title="Kategori ismini değiştir"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory('Perks', catName)}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                              title="Kategoriyi sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red Flags Categories Section */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171', marginBottom: '12px' }}>
                🚩 kırmızı kart (red flags) kategorileri
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                {redFlagCategories.map(catName => {
                  const count = (deckState.raw['Red Flags'][catName] || []).length;
                  const isRenaming = renamingCategory?.section === 'Red Flags' && renamingCategory?.oldName === catName;

                  return (
                    <div
                      key={catName}
                      style={{
                        background: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      {isRenaming ? (
                        <form onSubmit={handleRenameCategorySubmit} style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            value={newCategoryNameInput}
                            onChange={(e) => setNewCategoryNameInput(e.target.value)}
                            className="form-input"
                            style={{ height: '36px', fontSize: '0.88rem' }}
                            autoFocus
                            required
                          />
                          <button
                            type="submit"
                            style={{
                              background: '#10b981',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            kaydet
                          </button>
                        </form>
                      ) : (
                        <>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>{catName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{count} kart</div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setRenamingCategory({ section: 'Red Flags', oldName: catName });
                                setNewCategoryNameInput(catName);
                              }}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.08)' }}
                              title="Kategori ismini değiştir"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteCategory('Red Flags', catName)}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                              title="Kategoriyi sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADD CARD (FULL SCREEN FORM) */}
        {activeTab === 'add' && (
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '30px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            <form onSubmit={handleAddCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">kart türü</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setNewType('perk')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        background: newType === 'perk' ? '#ffffff' : '#242424',
                        color: newType === 'perk' ? '#000000' : '#ffffff',
                        border: newType === 'perk' ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                      }}
                    >
                      🤍 beyaz kart (perk)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('redflag')}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        background: newType === 'redflag' ? '#d90429' : '#242424',
                        color: '#ffffff',
                        border: newType === 'redflag' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                        fontWeight: 800,
                        fontSize: '0.95rem'
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
                    style={{ marginBottom: '10px', height: '48px', background: '#242424' }}
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
                      style={{ background: '#242424' }}
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>kart metni (türkçe)</label>

                  {/* Insert Blank Tag Button */}
                  <button
                    type="button"
                    onClick={handleInsertBlankPlaceholder}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <PenTool size={13} /> + boşluk alanı ekle (______)
                  </button>
                </div>

                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="kartın üzerindeki metni buraya yazınız... (örn: Hayatı, ______ 'nin dayandığı gerçek hikaye)"
                  className="form-input"
                  style={{ height: '140px', resize: 'vertical', fontSize: '0.96rem', background: '#242424' }}
                  required
                />

                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                  💡 <b>ipucu:</b> kart metnine <code>______</code> eklediğinizde, oyuncular bu kartı masaya atarken ekranda bir modal açılır ve o turluk istedikleri kelimeyi girerek kartı tamamlarlar.
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '16px', fontSize: '1rem', alignSelf: 'flex-end', minWidth: '240px' }}
              >
                <Plus size={18} /> yeni kartı veritabanına ekle
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: RAW JSON EDITOR (FULL SCREEN) */}
        {activeTab === 'json' && (
          <div style={{
            background: '#1c1c1c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.88rem', color: '#94a3b8', fontWeight: 600 }}>
                doğrudan raw json metnini düzenleyebilir, dosya yükleyebilir veya dışa aktarabilirsiniz.
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <label
                  style={{
                    background: '#242424',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Upload size={15} /> json yükle
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
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={15} /> json indir
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={15} /> sıfırla
                </button>
              </div>
            </div>

            {jsonError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.85rem',
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
                fontSize: '0.86rem',
                height: '480px',
                resize: 'vertical',
                background: '#121212',
                lineHeight: '1.45',
                padding: '16px'
              }}
            />

            <button
              onClick={handleSaveJson}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '0.98rem' }}
            >
              <Save size={18} /> json değişikliklerini kaydet ve aktif et
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
