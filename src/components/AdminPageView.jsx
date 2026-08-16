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
  Tag,
  Users,
  Sliders,
  Crown,
  Star,
  UserCheck,
  X,
  RefreshCw
} from 'lucide-react';
import doxcardsLogo from '../assets/doxcards.png';
import defaultAvatarImg from '../assets/default_avatar.png';
import {
  getActiveDeck,
  saveActiveDeck,
  resetActiveDeck,
  syncDeckFromCloudflare,
  parseRawDeck,
  DEFAULT_RAW_CARDS
} from '../data/cardsData';
import {
  fetchAllUsers,
  updateUser,
  fetchAppConfig,
  updateAppConfig,
  DEFAULT_CONFIG
} from '../services/userService';
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

  // Main Section: 'cards' | 'users' | 'permissions'
  const [mainNav, setMainNav] = useState('cards');

  // Sub-tab inside Cards & Decks section: 'list' | 'add' | 'categories' | 'json'
  const [activeTab, setActiveTab] = useState('list');
  const [deckState, setDeckState] = useState(getActiveDeck());
  const [jsonText, setJsonText] = useState(JSON.stringify(deckState.raw, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Filter & Search state in cards tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'perk' | 'redflag'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Edit card state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Add card form state
  const [newType, setNewType] = useState('perk'); // 'perk' | 'redflag'
  const [newCategory, setNewCategory] = useState('Ana Deste');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newText, setNewText] = useState('');

  // Category Renaming State
  const [renamingCategory, setRenamingCategory] = useState(null); // { type: 'Perks'|'Red Flags', oldName: '' }
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');

  // Users Section State
  const [usersList, setUsersList] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [editingUserTags, setEditingUserTags] = useState({}); // userId -> custom tag input text
  const [userSavingId, setUserSavingId] = useState(null);

  // Global Config Section State
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  // Sync deck & users from Cloudflare Database on mount
  useEffect(() => {
    setIsCloudSyncing(true);
    syncDeckFromCloudflare().then(liveDeck => {
      if (liveDeck && liveDeck.allCards.length > 0) {
        setDeckState(liveDeck);
      }
      setIsCloudSyncing(false);
    }).catch(() => setIsCloudSyncing(false));

    fetchAllUsers().then(users => {
      if (Array.isArray(users)) setUsersList(users);
    });

    fetchAppConfig().then(cfg => {
      if (cfg) setAppConfig(cfg);
    });
  }, []);

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

  // Save JSON
  const handleSaveJson = () => {
    try {
      sounds.playClick();
      const parsed = JSON.parse(jsonText);
      const validated = parseRawDeck(parsed);
      if (!validated.whiteCards.length || !validated.redCards.length) {
        setJsonError('JSON geçerli bir kart destesi içermelidir (Perks ve Red Flags kategorileri gerekli).');
        return;
      }
      saveActiveDeck(validated.raw);
      setDeckState(validated);
      setJsonError(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      setJsonError(`Geçersiz JSON formatı: ${e.message}`);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (window.confirm('Tüm kartları orijinal varsayılan Türkçe desteye sıfırlamak istediğinize emin misiniz?')) {
      sounds.playClick();
      resetActiveDeck();
      const def = parseRawDeck(DEFAULT_RAW_CARDS);
      setDeckState(def);
      setJsonText(JSON.stringify(def.raw, null, 2));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  // Export JSON file
  const handleExportJson = () => {
    sounds.playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deckState.raw, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "Red_Flags_Turkish_Custom.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJsonFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    sounds.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const parsed = JSON.parse(content);
        const validated = parseRawDeck(parsed);
        if (!validated.whiteCards.length || !validated.redCards.length) {
          alert('Yüklenen dosya geçerli kartlar içermiyor.');
          return;
        }
        saveActiveDeck(validated.raw);
        setDeckState(validated);
        setJsonText(JSON.stringify(validated.raw, null, 2));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch (err) {
        alert(`Dosya okuma hatası: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Delete single card
  const handleDeleteCard = (card) => {
    if (window.confirm(`"${card.text}" kartını silmek istediğinize emin misiniz?`)) {
      sounds.playClick();
      const section = card.type === 'perk' ? 'Perks' : 'Red Flags';
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));

      if (updatedRaw[section] && updatedRaw[section][card.category]) {
        updatedRaw[section][card.category] = updatedRaw[section][card.category].filter(
          txt => txt.trim() !== card.text.trim()
        );
        saveActiveDeck(updatedRaw);
        setDeckState(parseRawDeck(updatedRaw));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    }
  };

  // Start inline editing
  const handleStartEdit = (card) => {
    sounds.playClick();
    setEditingCardId(card.id);
    setEditingText(card.text);
  };

  // Save inline edit
  const handleSaveEdit = (card) => {
    if (!editingText.trim()) return;
    sounds.playClick();
    const section = card.type === 'perk' ? 'Perks' : 'Red Flags';
    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));

    if (updatedRaw[section] && updatedRaw[section][card.category]) {
      const list = updatedRaw[section][card.category];
      const idx = list.findIndex(txt => txt.trim() === card.text.trim());
      if (idx !== -1) {
        list[idx] = editingText.trim();
        saveActiveDeck(updatedRaw);
        setDeckState(parseRawDeck(updatedRaw));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    }
    setEditingCardId(null);
  };

  // Add new card
  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    sounds.playClick();
    const section = newType === 'perk' ? 'Perks' : 'Red Flags';
    const finalCategory = customCategoryInput.trim() ? customCategoryInput.trim() : newCategory;

    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    if (!updatedRaw[section]) updatedRaw[section] = {};
    if (!updatedRaw[section][finalCategory]) updatedRaw[section][finalCategory] = [];

    updatedRaw[section][finalCategory].push(newText.trim());

    saveActiveDeck(updatedRaw);
    setDeckState(parseRawDeck(updatedRaw));
    setNewText('');
    setCustomCategoryInput('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Insert Blank Placeholder ([boşluk]) into New Card Text
  const handleInsertBlankPlaceholder = () => {
    sounds.playClick();
    setNewText(prev => (prev ? prev.trim() + ' [boşluk] ' : '[boşluk] '));
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

  // User Management Handlers
  const handleToggleUserTag = (user, tagToToggle) => {
    sounds.playClick();
    const currentTags = user.tags || [];
    let updatedTags;
    if (currentTags.includes(tagToToggle)) {
      updatedTags = currentTags.filter(t => t !== tagToToggle);
    } else {
      updatedTags = [...currentTags, tagToToggle];
    }
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, tags: updatedTags } : u));
  };

  const handleAddCustomTag = (userId) => {
    const inputVal = (editingUserTags[userId] || '').trim();
    if (!inputVal) return;
    sounds.playClick();
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const currentTags = u.tags || [];
        if (!currentTags.includes(inputVal)) {
          return { ...u, tags: [...currentTags, inputVal] };
        }
      }
      return u;
    }));
    setEditingUserTags(prev => ({ ...prev, [userId]: '' }));
  };

  const handleToggleUserDeck = (user, deckName) => {
    sounds.playClick();
    const currentDecks = user.unlockedDecks || [];
    let updatedDecks;
    if (currentDecks.includes(deckName)) {
      updatedDecks = currentDecks.filter(d => d !== deckName);
    } else {
      updatedDecks = [...currentDecks, deckName];
    }
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, unlockedDecks: updatedDecks } : u));
  };

  const handleGrantAllDecksToUser = (userId) => {
    sounds.playClick();
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, unlockedDecks: [...DEFAULT_CONFIG.allDecks] } : u));
  };

  const handleResetUserDecks = (userId) => {
    sounds.playClick();
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, unlockedDecks: [...appConfig.discordDecks] } : u));
  };

  const handleSaveUser = async (user) => {
    setUserSavingId(user.id);
    sounds.playClick();
    const updated = await updateUser(user.id, {
      tags: user.tags,
      unlockedDecks: user.unlockedDecks,
      totalScore: Number(user.totalScore) || 0
    });
    setUserSavingId(null);
    if (updated) {
      setUsersList(prev => prev.map(u => u.id === user.id ? updated : u));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Global Config Handlers
  const handleToggleDefaultGuestDeck = (deckName) => {
    sounds.playClick();
    const current = appConfig.guestDecks || [];
    const updated = current.includes(deckName)
      ? (current.length > 1 ? current.filter(d => d !== deckName) : current)
      : [...current, deckName];
    setAppConfig(prev => ({ ...prev, guestDecks: updated }));
  };

  const handleToggleDefaultDiscordDeck = (deckName) => {
    sounds.playClick();
    const current = appConfig.discordDecks || [];
    const updated = current.includes(deckName)
      ? (current.length > 1 ? current.filter(d => d !== deckName) : current)
      : [...current, deckName];
    setAppConfig(prev => ({ ...prev, discordDecks: updated }));
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    sounds.playClick();
    const res = await updateAppConfig(appConfig);
    setConfigSaving(false);
    if (res) {
      setAppConfig(res);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    const q = usersSearch.toLowerCase().trim();
    if (!q) return true;
    return (u.username || '').toLowerCase().includes(q) ||
           (u.displayName || '').toLowerCase().includes(q) ||
           (u.id || '').includes(q);
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'row'
    }}>
      {/* ========================================================================= */}
      {/* 1. LEFT RED VERTICAL NAVBAR */}
      {/* ========================================================================= */}
      <aside style={{
        width: '260px',
        minWidth: '260px',
        background: '#161616',
        borderRight: '1px solid rgba(217, 4, 41, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Logo & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <img src={doxcardsLogo} alt="dox" style={{ height: '32px', width: 'auto' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                doxcards
              </span>
              <span style={{
                background: '#d90429',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '4px',
                width: 'fit-content',
                textTransform: 'uppercase'
              }}>
                admin paneli
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => { sounds.playClick(); setMainNav('cards'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'cards' ? '#d90429' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'cards' ? '1px solid #ef4444' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'cards' ? '0 4px 14px rgba(217, 4, 41, 0.4)' : 'none',
                textAlign: 'left'
              }}
            >
              <Layers size={18} /> kartlar ve desteler
            </button>

            <button
              onClick={() => { sounds.playClick(); setMainNav('users'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'users' ? '#d90429' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'users' ? '1px solid #ef4444' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'users' ? '0 4px 14px rgba(217, 4, 41, 0.4)' : 'none',
                textAlign: 'left'
              }}
            >
              <Users size={18} /> kullanıcılar ({usersList.length})
            </button>

            <button
              onClick={() => { sounds.playClick(); setMainNav('permissions'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'permissions' ? '#d90429' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'permissions' ? '1px solid #ef4444' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'permissions' ? '0 4px 14px rgba(217, 4, 41, 0.4)' : 'none',
                textAlign: 'left'
              }}
            >
              <Sliders size={18} /> deste izinleri
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          {/* Cloud DB Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#202020',
            padding: '8px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#94a3b8'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span>cloudflare db bağlı</span>
          </div>

          {/* Return to Game Button */}
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={16} /> oyuna dön
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        padding: '32px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Global Feedback Alert */}
        {saveSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '14px 20px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Check size={18} /> değişiklikler Cloudflare veritabanına başarıyla kaydedildi!
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION A: KARTLAR VE DESTELER (WITH HORIZONTAL TABS FROM IMAGE 2) */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'cards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Stats Cards */}
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
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                  {deckState.allCards.length}
                </div>
              </div>

              <div style={{
                background: '#1c1c1c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                  beyaz kartlar (perks)
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
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

            {/* Horizontal Sub-Tabs (Image 2 style) */}
            <div style={{
              display: 'flex',
              gap: '10px',
              background: '#1c1c1c',
              padding: '6px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                onClick={() => { sounds.playClick(); setActiveTab('list'); }}
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
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <Layers size={18} /> kart yönetimi ({deckState.allCards.length})
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('categories'); }}
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
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <FolderEdit size={18} /> kategorileri düzenle ({allCategories.length})
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('add'); }}
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
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <Plus size={18} /> yeni kart ekle
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('json'); }}
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
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'background 0.2s'
                }}
              >
                <FileCode size={18} /> json düzenleyici & içe/dışa aktar
              </button>
            </div>

            {/* TAB 1: KART LİSTESİ & DÜZENLEME */}
            {activeTab === 'list' && (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{
                    flex: 1,
                    minWidth: '260px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
                    <input
                      type="text"
                      placeholder="kart metninde ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '42px' }}
                    />
                  </div>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="select-box"
                    style={{ width: '180px' }}
                  >
                    <option value="all">tüm kart tipleri</option>
                    <option value="perk">beyaz (perk)</option>
                    <option value="redflag">kırmızı (red flag)</option>
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select-box"
                    style={{ width: '220px' }}
                  >
                    <option value="all">tüm kategoriler ({allCategories.length})</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Cards List Grid */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: '6px'
                }}>
                  {filteredCards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      eşleşen kart bulunamadı.
                    </div>
                  ) : (
                    filteredCards.map((card) => {
                      const isEditing = editingCardId === card.id;
                      const isBlank = isBlankCard(card.text);

                      return (
                        <div
                          key={card.id}
                          style={{
                            background: '#242424',
                            border: card.type === 'perk'
                              ? '1px solid rgba(255, 255, 255, 0.15)'
                              : '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span style={{
                              background: card.type === 'perk' ? '#ffffff' : '#d90429',
                              color: card.type === 'perk' ? '#000000' : '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              {card.type === 'perk' ? 'perk' : 'red flag'}
                            </span>

                            <span style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: '#94a3b8',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}>
                              {card.category}
                            </span>

                            {isBlank && (
                              <span style={{
                                background: 'rgba(251, 191, 36, 0.15)',
                                color: '#fbbf24',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Tag size={10} /> boşluklu kart
                              </span>
                            )}

                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="form-input"
                                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingText(prev => (prev ? prev.trim() + ' [boşluk] ' : '[boşluk] '))}
                                  style={{
                                    background: 'rgba(251, 191, 36, 0.15)',
                                    border: '1px solid #fbbf24',
                                    color: '#fbbf24',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  + [boşluk]
                                </button>
                              </div>
                            ) : (
                              <span style={{
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                color: '#ffffff',
                                flex: 1
                              }}>
                                {card.text}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(card)}
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  <Save size={14} /> kaydet
                                </button>
                                <button
                                  onClick={() => setEditingCardId(null)}
                                  className="btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                  iptal
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(card)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '6px'
                                  }}
                                  title="kartı düzenle"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(card)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '6px'
                                  }}
                                  title="kartı sil"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: KATEGORİ DÜZENLEME */}
            {activeTab === 'categories' && (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#ffffff' }}>
                    kategori yönetimi ve isim düzenleme
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    destedeki kategorileri yeniden adlandırabilir veya tamamen silebilirsiniz.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* Perks Categories */}
                  <div style={{ background: '#242424', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <h4 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={16} /> beyaz kart kategorileri ({perkCategories.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {perkCategories.map(cat => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '10px 14px', borderRadius: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{cat} ({deckState.raw.Perks[cat]?.length || 0} kart)</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setRenamingCategory({ section: 'Perks', oldName: cat });
                                setNewCategoryNameInput(cat);
                              }}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              yeniden adlandır
                            </button>
                            <button
                              onClick={() => handleDeleteCategory('Perks', cat)}
                              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Red Flags Categories */}
                  <div style={{ background: '#242424', padding: '20px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h4 style={{ color: '#f87171', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={16} /> kırmızı kart kategorileri ({redFlagCategories.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {redFlagCategories.map(cat => (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '10px 14px', borderRadius: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fca5a5' }}>{cat} ({deckState.raw['Red Flags'][cat]?.length || 0} kart)</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setRenamingCategory({ section: 'Red Flags', oldName: cat });
                                setNewCategoryNameInput(cat);
                              }}
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              yeniden adlandır
                            </button>
                            <button
                              onClick={() => handleDeleteCategory('Red Flags', cat)}
                              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rename Modal */}
                {renamingCategory && (
                  <form onSubmit={handleRenameCategorySubmit} style={{
                    background: '#2d2d2d',
                    padding: '20px',
                    borderRadius: '14px',
                    border: '1px solid #d90429',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      "{renamingCategory.oldName}" kategorisinin yeni adını girin:
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        value={newCategoryNameInput}
                        onChange={(e) => setNewCategoryNameInput(e.target.value)}
                        className="form-input"
                        autoFocus
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                        kaydet
                      </button>
                      <button type="button" onClick={() => setRenamingCategory(null)} className="btn-secondary">
                        iptal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: YENİ KART EKLE */}
            {activeTab === 'add' && (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '28px',
                maxWidth: '700px'
              }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>yeni kart ekle</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '24px' }}>
                  oyuna yeni bir perk veya red flag kartı ekleyin. Boşluklu kart yapmak için <b>[boşluk]</b> butonunu kullanabilirsiniz.
                </p>

                <form onSubmit={handleAddCardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label className="form-label">kart tipi</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setNewType('perk')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          background: newType === 'perk' ? '#ffffff' : '#262626',
                          color: newType === 'perk' ? '#000000' : '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        beyaz kart (perk)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewType('redflag')}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          background: newType === 'redflag' ? '#d90429' : '#262626',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        kırmızı kart (red flag)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">kategori seç veya yeni oluştur</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="select-box"
                        style={{ flex: 1 }}
                      >
                        {allCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="veya yeni kategori adı..."
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>kart metni</label>
                      <button
                        type="button"
                        onClick={handleInsertBlankPlaceholder}
                        style={{
                          background: 'rgba(251, 191, 36, 0.15)',
                          border: '1px solid #fbbf24',
                          color: '#fbbf24',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + [boşluk] ekle
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="örneğin: her zaman [boşluk] gibi kokuyor"
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      className="form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
                    <Plus size={18} /> kartı ekle
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: JSON DÜZENLEYİCİ & İÇE/DIŞA AKTAR */}
            {activeTab === 'json' && (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>ham json verisi & dosya işlemleri</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      kartları doğrudan json formatında düzenleyebilir, dışa aktarabilir veya kendi dosyanızı yükleyebilirsiniz.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleExportJson} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      <Download size={15} /> json indir
                    </button>

                    <label className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={15} /> json yükle
                      <input type="file" accept=".json" onChange={handleImportJsonFile} style={{ display: 'none' }} />
                    </label>

                    <button onClick={handleResetToDefault} style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <RotateCcw size={15} /> orijinal desteye sıfırla
                    </button>
                  </div>
                </div>

                {jsonError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem' }}>
                    {jsonError}
                  </div>
                )}

                <textarea
                  rows={20}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  style={{
                    width: '100%',
                    fontFamily: 'monospace',
                    fontSize: '0.88rem',
                    background: '#141414',
                    color: '#a5f3fc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '16px',
                    lineHeight: '1.5'
                  }}
                />

                <button onClick={handleSaveJson} className="btn-primary" style={{ padding: '14px', alignSelf: 'flex-start' }}>
                  <Save size={18} /> json değişikliklerini kaydet
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION B: KULLANICILAR (DISCORD USERS, TAGS & DECK PERMISSIONS) */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  kayıtlı discord kullanıcıları ({usersList.length})
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                  discord ile giriş yapan oyuncuları görüntüleyin, özel etiketler (Admin, VIP, Premium) atayın ve hangi destelere erişebileceklerini belirleyin.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsUsersRefreshing(true);
                    fetchAllUsers().then(users => {
                      if (Array.isArray(users)) setUsersList(users);
                      setIsUsersRefreshing(false);
                    }).catch(() => setIsUsersRefreshing(false));
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '9px 14px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  title="kullanıcı listesini veritabanından yenile"
                >
                  <RefreshCw size={14} style={{ animation: isUsersRefreshing ? 'spin 1s linear infinite' : 'none' }} /> yenile
                </button>

                <div style={{ position: 'relative', minWidth: '280px' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                  <input
                    type="text"
                    placeholder="kullanıcı adı veya id ara..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '38px', padding: '10px 14px 10px 38px' }}
                  />
                </div>
              </div>
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                {usersList.length === 0 ? 'henüz discord ile giriş yapmış kullanıcı bulunmuyor.' : 'arama ile eşleşen kullanıcı bulunamadı.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredUsers.map(user => {
                  const isMainAdminUser = user.id === ADMIN_DISCORD_ID;
                  const isSaving = userSavingId === user.id;

                  return (
                    <div
                      key={user.id}
                      style={{
                        background: '#1c1c1c',
                        border: isMainAdminUser ? '1px solid #d90429' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}
                    >
                      {/* User Top Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={user.avatar || defaultAvatarImg}
                            alt={user.displayName}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: isMainAdminUser ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)'
                            }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                                {user.displayName || user.username}
                              </span>
                              {isMainAdminUser && (
                                <span className="badge-admin">
                                  <ShieldCheck size={11} /> ana yönetici
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              discord id: <b style={{ color: '#cbd5e1' }}>{user.id}</b>
                            </div>
                          </div>
                        </div>

                        {/* User Total Score Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            background: '#242424',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Star size={16} fill="#fbbf24" color="#fbbf24" />
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>toplam puan:</span>
                            <input
                              type="number"
                              value={user.totalScore !== undefined ? user.totalScore : 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, totalScore: val } : u));
                              }}
                              style={{
                                width: '60px',
                                background: '#181818',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#fbbf24',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                borderRadius: '6px',
                                padding: '3px 6px',
                                textAlign: 'center'
                              }}
                            />
                          </div>

                          <button
                            onClick={() => handleSaveUser(user)}
                            disabled={isSaving}
                            className="btn-primary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                          >
                            <Save size={15} /> {isSaving ? 'kaydediliyor...' : 'kaydet'}
                          </button>
                        </div>
                      </div>

                      {/* Middle: Tags Section */}
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                          özel etiketler (taglar):
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Quick Tag Toggles */}
                          <button
                            type="button"
                            onClick={() => handleToggleUserTag(user, 'admin')}
                            className={user.tags?.includes('admin') ? 'badge-admin' : 'deck-tag-btn'}
                            style={{ cursor: 'pointer', padding: '4px 10px' }}
                          >
                            <ShieldCheck size={12} /> admin
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserTag(user, 'VIP')}
                            className={user.tags?.includes('VIP') ? 'badge-vip' : 'deck-tag-btn'}
                            style={{ cursor: 'pointer', padding: '4px 10px' }}
                          >
                            <Crown size={12} /> VIP
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserTag(user, 'Premium')}
                            className={user.tags?.includes('Premium') ? 'badge-premium' : 'deck-tag-btn'}
                            style={{ cursor: 'pointer', padding: '4px 10px' }}
                          >
                            <Sparkles size={12} /> Premium
                          </button>

                          {/* Render other custom tags */}
                          {(user.tags || []).filter(t => !['admin', 'VIP', 'Premium'].includes(t)).map(customTag => (
                            <span key={customTag} style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {customTag}
                              <X
                                size={12}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleToggleUserTag(user, customTag)}
                              />
                            </span>
                          ))}

                          {/* Add Custom Tag Input */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="özel etiket adı..."
                              value={editingUserTags[user.id] || ''}
                              onChange={(e) => setEditingUserTags(prev => ({ ...prev, [user.id]: e.target.value }))}
                              style={{
                                background: '#242424',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '6px',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                padding: '4px 8px',
                                width: '120px'
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag(user.id)}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomTag(user.id)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              + ekle
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Unlocked Decks Section */}
                      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>
                            kullanıcının sahip olduğu desteler ({user.unlockedDecks?.length || 0} aktif):
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleGrantAllDecksToUser(user.id)}
                              style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              tümünü aç
                            </button>
                            <span style={{ color: '#475569' }}>|</span>
                            <button
                              type="button"
                              onClick={() => handleResetUserDecks(user.id)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              varsayılana dön
                            </button>
                          </div>
                        </div>

                        <div className="deck-tags-container">
                          {DEFAULT_CONFIG.allDecks.map(deckName => {
                            const isUnlocked = (user.unlockedDecks || []).includes(deckName);
                            return (
                              <button
                                key={deckName}
                                type="button"
                                onClick={() => handleToggleUserDeck(user, deckName)}
                                className={`deck-tag-btn ${isUnlocked ? 'active' : ''}`}
                                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                              >
                                {isUnlocked ? <Check size={12} /> : <Plus size={12} />}
                                {deckName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION C: DESTE İZİNLERİ (GLOBAL DECK DEFAULTS & SECRET / LOCK INFO) */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'permissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '850px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                genel deste izin kuralları & gizlilik ayarları
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                misafirlerin, standart discord kullanıcılarının varsayılan destelerini ayarlayın; kilitli desteler için açıklama metinleri ve gizli (secret) deste kurallarını belirleyin.
              </p>
            </div>

            {/* Rule 1: Guest Users */}
            <div style={{
              background: '#1c1c1c',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: '#262626',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  misafir (giriş yapmayan)
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  varsayılan açık desteler
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                discord ile giriş yapmadan doğrudan lobi açan oyuncuların seçebileceği desteler:
              </p>

              <div className="deck-tags-container">
                {DEFAULT_CONFIG.allDecks.map(deckName => {
                  const isActive = (appConfig.guestDecks || []).includes(deckName);
                  return (
                    <button
                      key={deckName}
                      type="button"
                      onClick={() => handleToggleDefaultGuestDeck(deckName)}
                      className={`deck-tag-btn ${isActive ? 'active' : ''}`}
                    >
                      {isActive ? <Check size={13} /> : <Plus size={13} />}
                      {deckName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rule 2: Registered Discord Users */}
            <div style={{
              background: '#1c1c1c',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(88, 101, 242, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  background: '#5865F2',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  discord kullanıcıları
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  ilk girişte tanımlanan standart desteler
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                discord ile giriş yapan tüm standart kullanıcıların profillerine başlangıçta otomatik tanımlanacak desteler:
              </p>

              <div className="deck-tags-container">
                {DEFAULT_CONFIG.allDecks.map(deckName => {
                  const isActive = (appConfig.discordDecks || []).includes(deckName);
                  return (
                    <button
                      key={deckName}
                      type="button"
                      onClick={() => handleToggleDefaultDiscordDeck(deckName)}
                      className={`deck-tag-btn ${isActive ? 'active' : ''}`}
                    >
                      {isActive ? <Check size={13} /> : <Plus size={13} />}
                      {deckName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rule 3: Deck Metadata (Secret Toggle & Lock Tooltip Text) */}
            <div style={{
              background: '#1c1c1c',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  deste gizlilik (secret) & kilitli bilgi metinleri (mouse hover)
                </span>
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>
                  oyuncunun sahip olmadığı bir deste <b>gizli (secret)</b> ise lobide silik bile görünmez. Gizli değilse silik görünür ve mouse ile üzerine gelindiğinde belirlediğiniz açıklama metni çıkar.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {DEFAULT_CONFIG.allDecks.map(deckName => {
                  const meta = appConfig.deckMetadata?.[deckName] || { isSecret: false, lockDescription: '' };

                  return (
                    <div
                      key={deckName}
                      style={{
                        background: '#242424',
                        border: meta.isSecret ? '1px solid #d90429' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                          {deckName}
                        </span>

                        {/* Secret Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            const newMeta = {
                              ...(appConfig.deckMetadata || {}),
                              [deckName]: {
                                ...meta,
                                isSecret: !meta.isSecret
                              }
                            };
                            setAppConfig(prev => ({ ...prev, deckMetadata: newMeta }));
                          }}
                          style={{
                            background: meta.isSecret ? '#d90429' : 'rgba(255, 255, 255, 0.08)',
                            border: meta.isSecret ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {meta.isSecret ? '🔒 gizli (secret) deste: aktif' : '🔓 genel deste (silik görünür)'}
                        </button>
                      </div>

                      {/* Tooltip Description Input */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                          kilitliyken mouse üzerine gelince çıkacak yazı (ipucu):
                        </label>
                        <input
                          type="text"
                          placeholder="örn: bu desteyi açmak için VIP üye olmanız gerekir."
                          value={meta.lockDescription || ''}
                          onChange={(e) => {
                            const newDesc = e.target.value;
                            const newMeta = {
                              ...(appConfig.deckMetadata || {}),
                              [deckName]: {
                                ...meta,
                                lockDescription: newDesc
                              }
                            };
                            setAppConfig(prev => ({ ...prev, deckMetadata: newMeta }));
                          }}
                          className="form-input"
                          style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="btn-primary"
              style={{ padding: '14px 24px', alignSelf: 'flex-start' }}
            >
              <Save size={18} /> {configSaving ? 'kaydediliyor...' : 'genel izinleri kaydet'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
