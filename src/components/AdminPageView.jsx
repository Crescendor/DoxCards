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
  RefreshCw,
  Volume2,
  Play,
  Square,
  Music,
  Radio,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Coins,
  Calculator,
  TrendingUp,
  Wallet,
  Award,
  ShieldAlert,
  Ban,
  CheckSquare,
  VolumeX,
  Store,
  ShoppingBag,
  Eye,
  Palette
} from 'lucide-react';
import doxcardsLogo from '../assets/doxcards.png';
import defaultAvatarImg from '../assets/default_avatar.png';
import {
  getActiveDeck,
  saveActiveDeck,
  resetActiveDeck,
  syncDeckFromCloudflare,
  parseRawDeck,
  standardizeBlankTokens,
  DEFAULT_RAW_CARDS
} from '../data/cardsData';
import {
  fetchAllUsers,
  updateUser,
  fetchAppConfig,
  updateAppConfig,
  fetchSuggestions,
  reviewSuggestion,
  DEFAULT_CONFIG
} from '../services/userService';
import { isBlankCard } from './FillBlankModal';
import { sounds } from '../services/soundEffects';
import { socket } from '../services/socket';
import TagBadge from './TagBadge';
import TagEditModal from './TagEditModal';
import ThemeEditModal from './ThemeEditModal';

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
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.4rem' }}>yetkisiz erişim</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            bu admin paneline sadece yetkili discord yöneticisi ({ADMIN_DISCORD_ID}) erişebilir.
          </p>
          <button onClick={onBack} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
            ana sayfaya dön
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
  const [editingCardCategory, setEditingCardCategory] = useState('');
  const [editingCardType, setEditingCardType] = useState('perk');

  // Add card form state
  const [newType, setNewType] = useState('perk'); // 'perk' | 'redflag'
  const [newCategory, setNewCategory] = useState('Ana Deste');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newText, setNewText] = useState('');

  // Category Renaming & Creation State
  const [renamingCategory, setRenamingCategory] = useState(null); // { type: 'Perks'|'Red Flags', oldName: '' }
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [newDeckNameInput, setNewDeckNameInput] = useState('');
  const [newDeckTypeTarget, setNewDeckTypeTarget] = useState('both'); // 'both' | 'perk' | 'redflag'
  const [newDeckIsSecret, setNewDeckIsSecret] = useState(false);
  const [newDeckLockDesc, setNewDeckLockDesc] = useState('');
  const [newDeckExtraNote, setNewDeckExtraNote] = useState('');
  const [editingDeckNotes, setEditingDeckNotes] = useState({}); // deckName -> extraNote text

  // Suggestions State
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [targetDeckForCard, setTargetDeckForCard] = useState({}); // sugId -> selected target deck name
  const [cardSuggestionsFilter, setCardSuggestionsFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [expandedDeckSugId, setExpandedDeckSugId] = useState(null);
  const [editingCardSug, setEditingCardSug] = useState({}); // sugId -> { text, type, targetDeck }
  const [isUpdatingSug, setIsUpdatingSug] = useState({}); // sugId -> boolean

  // Users Section State
  const [usersList, setUsersList] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  const [editingUserTags, setEditingUserTags] = useState({}); // userId -> custom tag input text
  const [userSavingId, setUserSavingId] = useState(null);
  const [isUsersRefreshing, setIsUsersRefreshing] = useState(false);

  // User Modals State
  const [editingUser, setEditingUser] = useState(null);
  const [editUserTags, setEditUserTags] = useState([]);
  const [editNewTagInput, setEditNewTagInput] = useState('');
  const [editUserDecks, setEditUserDecks] = useState([]);
  const [editUserWhiteSound, setEditUserWhiteSound] = useState('');
  const [editUserRedSound, setEditUserRedSound] = useState('');
  const [editUserWinSound, setEditUserWinSound] = useState('');
  const [editUserCoins, setEditUserCoins] = useState(0);
  const [editUserOwnedThemes, setEditUserOwnedThemes] = useState(['stocks']);
  const [editUserOwnedSounds, setEditUserOwnedSounds] = useState([]);

  const [banningUser, setBanningUser] = useState(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Global Config Section State
  const [appConfig, setAppConfig] = useState(DEFAULT_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  // Sound Management Section State
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundCategory, setNewSoundCategory] = useState('white_card'); // 'white_card' | 'red_card' | 'game_win' | 'general'
  const [newSoundSourceType, setNewSoundSourceType] = useState('local'); // 'local' | 'url' | 'youtube'
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [newSoundYtUrl, setNewSoundYtUrl] = useState('');
  const [newSoundStartSec, setNewSoundStartSec] = useState('0');
  const [newSoundEndSec, setNewSoundEndSec] = useState('3');
  const [newSoundIsDefault, setNewSoundIsDefault] = useState(false);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [editingSoundId, setEditingSoundId] = useState(null);
  const [editingSoundName, setEditingSoundName] = useState('');

  // Coin Management State
  const [coinDefaultMult, setCoinDefaultMult] = useState(10);
  const [coinPremiumMult, setCoinPremiumMult] = useState(20);
  const [coinVipMult, setCoinVipMult] = useState(30);
  const [simScore, setSimScore] = useState(2);
  const [simPlayers, setSimPlayers] = useState(4);
  const [userCoinsInput, setUserCoinsInput] = useState({}); // userId -> coins amount
  const [coinUserSearch, setCoinUserSearch] = useState('');
  const [isCoinConfigSaving, setIsCoinConfigSaving] = useState(false);
  const [savingUserCoinId, setSavingUserCoinId] = useState(null);

  // UI Settings & Tag Management State
  const [uiTab, setUiTab] = useState('sounds'); // 'sounds' | 'tags'
  const [editingTag, setEditingTag] = useState(null);
  const [isNewTag, setIsNewTag] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const handleOpenNewTagModal = () => {
    sounds.playClick();
    setEditingTag(null);
    setIsNewTag(true);
    setTagModalOpen(true);
  };

  const handleOpenEditTagModal = (tagToEdit) => {
    sounds.playClick();
    setEditingTag(tagToEdit);
    setIsNewTag(false);
    setTagModalOpen(true);
  };

  const handleSaveTag = async (savedTag) => {
    const currentTags = appConfig.customTags || DEFAULT_CONFIG.customTags || [];
    const existingIdx = currentTags.findIndex(t => t.id.toLowerCase() === savedTag.id.toLowerCase());
    let updatedTags = [];
    if (existingIdx !== -1) {
      updatedTags = currentTags.map((t, idx) => idx === existingIdx ? savedTag : t);
    } else {
      updatedTags = [...currentTags, savedTag];
    }

    const updatedConfig = { ...appConfig, customTags: updatedTags };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteTag = async (tagIdToDelete) => {
    if (['admin', 'vip', 'premium'].includes(tagIdToDelete.toLowerCase())) {
      alert('Temel sistem etiketleri silinemez. Ancak düzenleyebilirsiniz.');
      return;
    }
    if (!window.confirm('Bu etiketi silmek istediğinize emin misiniz?')) return;
    sounds.playClick();

    const currentTags = appConfig.customTags || DEFAULT_CONFIG.customTags || [];
    const updatedTags = currentTags.filter(t => t.id.toLowerCase() !== tagIdToDelete.toLowerCase());
    const updatedConfig = { ...appConfig, customTags: updatedTags };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Market Management State & Handlers
  const [marketSubTab, setMarketSubTab] = useState('themes'); // 'themes' | 'sounds'
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [isNewTheme, setIsNewTheme] = useState(false);

  // New Market Sound form state
  const [newMarketSoundName, setNewMarketSoundName] = useState('');
  const [newMarketSoundCategory, setNewMarketSoundCategory] = useState('white_card');
  const [newMarketSoundPrice, setNewMarketSoundPrice] = useState(200);
  const [newMarketSoundSourceType, setNewMarketSoundSourceType] = useState('file'); // 'file' | 'youtube'
  const [newMarketSoundUrl, setNewMarketSoundUrl] = useState('');
  const [newMarketSoundYtUrl, setNewMarketSoundYtUrl] = useState('');
  const [newMarketSoundStartSec, setNewMarketSoundStartSec] = useState('0');
  const [newMarketSoundEndSec, setNewMarketSoundEndSec] = useState('3');
  const [newMarketSoundCoverImage, setNewMarketSoundCoverImage] = useState('');

  const handleOpenNewTheme = () => {
    sounds.playClick();
    setEditingTheme(null);
    setIsNewTheme(true);
    setThemeModalOpen(true);
  };

  const handleOpenEditTheme = (th) => {
    sounds.playClick();
    setEditingTheme(th);
    setIsNewTheme(false);
    setThemeModalOpen(true);
  };

  const handleSaveTheme = async (savedTheme) => {
    sounds.playClick();
    const currentMarket = appConfig.market || { themes: [], sounds: [] };
    const existingThemes = currentMarket.themes || [];

    let updatedThemes;
    if (isNewTheme) {
      updatedThemes = [...existingThemes, savedTheme];
    } else {
      updatedThemes = existingThemes.map(t => t.id === savedTheme.id ? savedTheme : t);
      // If it didn't exist, append
      if (!existingThemes.some(t => t.id === savedTheme.id)) {
        updatedThemes.push(savedTheme);
      }
    }

    const updatedConfig = {
      ...appConfig,
      market: {
        ...currentMarket,
        themes: updatedThemes
      }
    };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteTheme = async (themeId) => {
    if (themeId === 'stocks') {
      alert('Varsayılan stok teması silinemez.');
      return;
    }
    if (!window.confirm('Bu temayı marketten silmek istediğinize emin misiniz?')) return;
    sounds.playClick();

    const currentMarket = appConfig.market || { themes: [], sounds: [] };
    const updatedThemes = (currentMarket.themes || []).filter(t => t.id !== themeId);
    const updatedConfig = {
      ...appConfig,
      market: {
        ...currentMarket,
        themes: updatedThemes
      }
    };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddMarketSound = async (e) => {
    e.preventDefault();
    if (!newMarketSoundName.trim()) {
      alert('Lütfen bir ses adı girin.');
      return;
    }
    sounds.playClick();

    let finalUrl = newMarketSoundUrl.trim();
    let ytId = '';

    if (newMarketSoundSourceType === 'youtube') {
      ytId = sounds.extractYouTubeId ? sounds.extractYouTubeId(newMarketSoundYtUrl) : '';
      if (!ytId) {
        // Fallback simple regex
        const match = newMarketSoundYtUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        ytId = (match && match[2].length === 11) ? match[2] : newMarketSoundYtUrl.trim();
      }
      if (!ytId) {
        alert('Lütfen geçerli bir YouTube linki girin.');
        return;
      }
    } else if (!finalUrl) {
      alert('Lütfen bir ses dosya yolu veya web URL bağlantısı girin.');
      return;
    }

    const newSound = {
      id: 'sound_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: newMarketSoundName.trim(),
      category: newMarketSoundCategory,
      type: newMarketSoundSourceType,
      price: Number(newMarketSoundPrice) || 200,
      url: finalUrl,
      ytId: ytId,
      startSec: Number(newMarketSoundStartSec) || 0,
      endSec: Number(newMarketSoundEndSec) || 3,
      coverImage: newMarketSoundCoverImage.trim(),
      isEnabled: true
    };

    const currentMarket = appConfig.market || { themes: [], sounds: [] };
    const updatedSounds = [...(currentMarket.sounds || []), newSound];
    const updatedConfig = {
      ...appConfig,
      market: {
        ...currentMarket,
        sounds: updatedSounds
      }
    };

    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setNewMarketSoundName('');
    setNewMarketSoundUrl('');
    setNewMarketSoundYtUrl('');
    setNewMarketSoundCoverImage('');
    setNewMarketSoundStartSec('0');
    setNewMarketSoundEndSec('3');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteMarketSound = async (soundId) => {
    if (!window.confirm('Bu market sesini silmek istediğinize emin misiniz?')) return;
    sounds.playClick();

    const currentMarket = appConfig.market || { themes: [], sounds: [] };
    const updatedSounds = (currentMarket.sounds || []).filter(s => s.id !== soundId);
    const updatedConfig = {
      ...appConfig,
      market: {
        ...currentMarket,
        sounds: updatedSounds
      }
    };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Sync editing user data when modal opens
  useEffect(() => {
    if (editingUser) {
      setEditUserTags(editingUser.tags || []);
      setEditNewTagInput('');
      setEditUserDecks(editingUser.unlockedDecks || [...(appConfig.discordDecks || DEFAULT_CONFIG.discordDecks)]);
      setEditUserWhiteSound(editingUser.customSounds?.whiteCardSoundId || '');
      setEditUserRedSound(editingUser.customSounds?.redCardSoundId || '');
      setEditUserWinSound(editingUser.customSounds?.gameWinSoundId || '');
      setEditUserCoins(editingUser.coins !== undefined ? editingUser.coins : 0);
      setEditUserOwnedThemes(Array.isArray(editingUser.ownedThemes) ? editingUser.ownedThemes : ['stocks']);
      setEditUserOwnedSounds(Array.isArray(editingUser.ownedSounds) ? editingUser.ownedSounds : []);
    }
  }, [editingUser]);

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
      if (cfg) {
        setAppConfig(cfg);
        if (cfg.coinMultipliers) {
          setCoinDefaultMult(cfg.coinMultipliers.default ?? 10);
          setCoinPremiumMult(cfg.coinMultipliers.premium ?? 20);
          setCoinVipMult(cfg.coinMultipliers.vip ?? 30);
        }
      }
    });

    fetchSuggestions(ADMIN_DISCORD_ID).then(sugs => {
      if (Array.isArray(sugs)) setSuggestionsList(sugs);
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
  const combinedDeckList = Array.from(new Set([
    ...(appConfig.allDecks || DEFAULT_CONFIG.allDecks),
    ...allCategories
  ]));

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

  // Delete single card (Robust across all sections and categories)
  const handleDeleteCard = async (card) => {
    if (!card) return;
    if (window.confirm(`"${card.text}" kartını silmek istediğinize emin misiniz?`)) {
      sounds.playClick();
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
      const targetNorm = standardizeBlankTokens(card.text).trim().toLowerCase();
      const targetRaw = (card.text || '').trim();

      // Search all sections and categories
      for (const sec of Object.keys(updatedRaw)) {
        if (sec === 'deckNotes') continue;
        const sectionObj = updatedRaw[sec];
        if (typeof sectionObj === 'object' && sectionObj !== null) {
          for (const catKey of Object.keys(sectionObj)) {
            if (Array.isArray(sectionObj[catKey])) {
              sectionObj[catKey] = sectionObj[catKey].filter(txt => {
                const norm = standardizeBlankTokens(txt || '').trim().toLowerCase();
                const raw = (txt || '').trim();
                const isMatch = norm === targetNorm || raw === targetRaw;
                return !isMatch;
              });
            }
          }
        }
      }

      await saveActiveDeck(updatedRaw);
      setDeckState(parseRawDeck(updatedRaw));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Start inline editing
  const handleStartEdit = (card) => {
    sounds.playClick();
    setEditingCardId(card.id);
    setEditingText(card.text);
    setEditingCardCategory(card.category);
    setEditingCardType(card.type);
  };

  // Save inline edit (Robust across all sections and categories)
  const handleSaveEdit = async (card) => {
    if (!editingText.trim()) return;
    sounds.playClick();

    const newSection = editingCardType === 'perk' ? 'Perks' : 'Red Flags';
    const newCategory = (editingCardCategory || card.category || 'Ana Deste').trim();
    const newTxt = editingText.trim();
    const targetNorm = standardizeBlankTokens(card.text).trim().toLowerCase();
    const targetRaw = (card.text || '').trim();

    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));

    // 1. Remove old card instance from wherever it was
    for (const sec of Object.keys(updatedRaw)) {
      if (sec === 'deckNotes') continue;
      const sectionObj = updatedRaw[sec];
      if (typeof sectionObj === 'object' && sectionObj !== null) {
        for (const catKey of Object.keys(sectionObj)) {
          if (Array.isArray(sectionObj[catKey])) {
            sectionObj[catKey] = sectionObj[catKey].filter(txt => {
              const norm = standardizeBlankTokens(txt || '').trim().toLowerCase();
              const raw = (txt || '').trim();
              return !(norm === targetNorm || raw === targetRaw);
            });
          }
        }
      }
    }

    // 2. Insert edited card into destination section & category
    updatedRaw[newSection] = updatedRaw[newSection] || {};
    let destCatKey = Object.keys(updatedRaw[newSection]).find(k => k.toLowerCase() === newCategory.toLowerCase()) || newCategory;
    updatedRaw[newSection][destCatKey] = updatedRaw[newSection][destCatKey] || [];
    updatedRaw[newSection][destCatKey].push(newTxt);

    await saveActiveDeck(updatedRaw);
    setDeckState(parseRawDeck(updatedRaw));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
    if (window.confirm(`"${categoryName}" destesini ve içerisindeki tüm kartları silmek istediğinize emin misiniz?`)) {
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

  // Create New Deck Handler
  const handleCreateNewDeck = async (e) => {
    if (e) e.preventDefault();
    const name = newDeckNameInput.trim();
    if (!name) return;

    sounds.playClick();
    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    if (!updatedRaw.Perks) updatedRaw.Perks = {};
    if (!updatedRaw['Red Flags']) updatedRaw['Red Flags'] = {};
    updatedRaw.deckNotes = updatedRaw.deckNotes || {};

    if (newDeckTypeTarget === 'both' || newDeckTypeTarget === 'perk') {
      if (!updatedRaw.Perks[name]) updatedRaw.Perks[name] = [];
    }
    if (newDeckTypeTarget === 'both' || newDeckTypeTarget === 'redflag') {
      if (!updatedRaw['Red Flags'][name]) updatedRaw['Red Flags'][name] = [];
    }

    if (newDeckExtraNote.trim()) {
      updatedRaw.deckNotes[name] = newDeckExtraNote.trim();
    }

    saveActiveDeck(updatedRaw);
    const parsed = parseRawDeck(updatedRaw);
    setDeckState(parsed);

    const updatedAllDecks = Array.from(new Set([...(appConfig.allDecks || DEFAULT_CONFIG.allDecks), name]));
    const updatedMeta = {
      ...(appConfig.deckMetadata || {}),
      [name]: {
        isSecret: newDeckIsSecret,
        lockDescription: newDeckLockDesc.trim() || 'Bu desteyi açmak için yetki gereklidir.'
      }
    };

    const updatedConfig = {
      ...appConfig,
      allDecks: updatedAllDecks,
      deckMetadata: updatedMeta
    };

    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);

    setNewDeckNameInput('');
    setNewDeckLockDesc('');
    setNewDeckExtraNote('');
    setNewDeckIsSecret(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Save Deck Extra Note Handler
  const handleSaveDeckExtraNote = (deckName, note) => {
    sounds.playClick();
    const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
    updatedRaw.deckNotes = updatedRaw.deckNotes || {};
    if (note && note.trim()) {
      updatedRaw.deckNotes[deckName] = note.trim();
    } else {
      delete updatedRaw.deckNotes[deckName];
    }
    saveActiveDeck(updatedRaw);
    setDeckState(parseRawDeck(updatedRaw));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // -------------------------------------------------------------------------
  // SUGGESTIONS HANDLERS
  // -------------------------------------------------------------------------
  const loadSuggestions = async () => {
    setSuggestionsLoading(true);
    const sugs = await fetchSuggestions(ADMIN_DISCORD_ID);
    if (Array.isArray(sugs)) setSuggestionsList(sugs);
    setSuggestionsLoading(false);
  };

  const startEditCardSug = (sug) => {
    sounds.playClick();
    const destDeck = targetDeckForCard[sug.id] || sug.cardData?.targetDeck || 'Ana Deste';
    setEditingCardSug(prev => ({
      ...prev,
      [sug.id]: {
        text: sug.cardData?.text || '',
        type: sug.cardData?.type === 'perk' ? 'perk' : 'red_flag',
        targetDeck: destDeck
      }
    }));
  };

  const cancelEditCardSug = (sugId) => {
    sounds.playClick();
    setEditingCardSug(prev => {
      const copy = { ...prev };
      delete copy[sugId];
      return copy;
    });
  };

  const handleSaveEditCardSug = async (sugId) => {
    sounds.playClick();
    const editData = editingCardSug[sugId];
    if (!editData || !editData.text.trim()) return;

    setIsUpdatingSug(prev => ({ ...prev, [sugId]: true }));
    const res = await updateSuggestion(sugId, {
      cardData: {
        text: editData.text.trim(),
        type: editData.type,
        targetDeck: editData.targetDeck
      }
    });

    if (res?.success) {
      setSuggestionsList(prev => prev.map(s => {
        if (s.id === sugId) {
          return {
            ...s,
            cardData: {
              ...s.cardData,
              text: editData.text.trim(),
              type: editData.type,
              targetDeck: editData.targetDeck
            }
          };
        }
        return s;
      }));
      cancelEditCardSug(sugId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
    setIsUpdatingSug(prev => ({ ...prev, [sugId]: false }));
  };

  const handleApproveCardSuggestion = async (sug) => {
    sounds.playWin();
    const editData = editingCardSug[sug.id];
    const finalText = (editData ? editData.text : sug.cardData?.text || '').trim();
    const finalType = (editData ? editData.type : sug.cardData?.type) === 'perk' ? 'perk' : 'red_flag';
    const destDeck = (editData ? editData.targetDeck : targetDeckForCard[sug.id]) || sug.cardData?.targetDeck || 'Ana Deste';

    if (!finalText) return;

    const res = await reviewSuggestion({
      suggestionId: sug.id,
      status: 'approved',
      targetDeckName: destDeck,
      cardText: finalText,
      cardType: finalType
    });

    if (res?.success) {
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
      const sec = finalType === 'perk' ? 'Perks' : 'Red Flags';
      updatedRaw[sec] = updatedRaw[sec] || {};
      updatedRaw[sec][destDeck] = updatedRaw[sec][destDeck] || [];
      updatedRaw[sec][destDeck].push(finalText);

      saveActiveDeck(updatedRaw);
      setDeckState(parseRawDeck(updatedRaw));
      cancelEditCardSug(sug.id);
      loadSuggestions();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleApproveDeckSuggestion = async (sug) => {
    sounds.playWin();
    const deckTitle = sug.deckData?.title?.trim();
    if (!deckTitle) return;

    const res = await reviewSuggestion({
      suggestionId: sug.id,
      status: 'approved',
      targetDeckName: deckTitle,
      extraNote: sug.deckData?.extraNote
    });

    if (res?.success) {
      const updatedRaw = JSON.parse(JSON.stringify(deckState.raw));
      updatedRaw.Perks = updatedRaw.Perks || {};
      updatedRaw['Red Flags'] = updatedRaw['Red Flags'] || {};
      updatedRaw.deckNotes = updatedRaw.deckNotes || {};

      updatedRaw.Perks[deckTitle] = sug.deckData?.whiteCards || [];
      updatedRaw['Red Flags'][deckTitle] = sug.deckData?.redCards || [];
      if (sug.deckData?.extraNote) {
        updatedRaw.deckNotes[deckTitle] = sug.deckData.extraNote;
      }

      saveActiveDeck(updatedRaw);
      setDeckState(parseRawDeck(updatedRaw));

      const updatedAllDecks = Array.from(new Set([...(appConfig.allDecks || DEFAULT_CONFIG.allDecks), deckTitle]));
      const updatedConfig = { ...appConfig, allDecks: updatedAllDecks };
      setAppConfig(updatedConfig);
      await updateAppConfig(updatedConfig);

      loadSuggestions();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleRejectSuggestion = async (sugId) => {
    if (!window.confirm('Bu öneriyi reddetmek istediğinize emin misiniz?')) return;
    sounds.playClick();
    const res = await reviewSuggestion({ suggestionId: sugId, status: 'rejected' });
    if (res?.success) {
      loadSuggestions();
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

  const handleSaveUserFromModal = async () => {
    if (!editingUser) return;
    sounds.playClick();
    setUserSavingId(editingUser.id);
    const updatedData = {
      tags: editUserTags,
      unlockedDecks: editUserDecks,
      coins: Math.max(0, Number(editUserCoins) || 0),
      ownedThemes: editUserOwnedThemes,
      ownedSounds: editUserOwnedSounds,
      customSounds: {
        whiteCardSoundId: editUserWhiteSound || null,
        redCardSoundId: editUserRedSound || null,
        gameWinSoundId: editUserWinSound || null
      }
    };
    const res = await updateUser(editingUser.id, updatedData);
    if (res) {
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updatedData } : u));
    }
    try {
      socket.emit('admin_notify_coin_update', {
        userId: editingUser.id,
        coins: Math.max(0, Number(editUserCoins) || 0),
        ownedThemes: editUserOwnedThemes,
        ownedSounds: editUserOwnedSounds
      });
    } catch (e) {}
    setUserSavingId(null);
    setEditingUser(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleBanUser = async () => {
    if (!banningUser) return;
    sounds.playClick();
    const reason = banReasonInput.trim() || 'Kural ihlali nedeniyle erişim engellendi.';
    const res = await updateUser(banningUser.id, {
      isBanned: true,
      banReason: reason
    });
    if (res) {
      setUsersList(prev => prev.map(u => u.id === banningUser.id ? { ...u, isBanned: true, banReason: reason } : u));
    }
    setBanningUser(null);
    setBanReasonInput('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUnbanUser = async () => {
    if (!banningUser) return;
    sounds.playClick();
    const res = await updateUser(banningUser.id, {
      isBanned: false,
      banReason: ''
    });
    if (res) {
      setUsersList(prev => prev.map(u => u.id === banningUser.id ? { ...u, isBanned: false, banReason: '' } : u));
    }
    setBanningUser(null);
    setBanReasonInput('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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

  // -------------------------------------------------------------------------
  // SOUND MANAGEMENT HANDLERS
  // -------------------------------------------------------------------------
  const extractYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  };

  const handleSoundFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAudioFileName(file.name);
    if (!newSoundName.trim()) {
      setNewSoundName(file.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSoundUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleTestPlay = (soundObj) => {
    sounds.playClick();
    setPlayingSoundId(soundObj.id || 'preview');
    sounds.playCustomAudio(soundObj);
    const duration = ((Number(soundObj.endSec) || 3) - (Number(soundObj.startSec) || 0)) * 1000;
    setTimeout(() => {
      setPlayingSoundId(null);
    }, Math.max(1000, duration));
  };

  const handleAddSoundSubmit = async (e) => {
    e.preventDefault();
    if (!newSoundName.trim()) {
      alert('Lütfen ses için bir isim girin.');
      return;
    }

    sounds.playClick();
    let finalUrl = newSoundUrl;
    let ytId = '';

    if (newSoundSourceType === 'youtube') {
      ytId = extractYouTubeId(newSoundYtUrl);
      if (!ytId) {
        alert('Lütfen geçerli bir YouTube video linki girin.');
        return;
      }
    } else if (!finalUrl.trim()) {
      alert('Lütfen bir ses dosyası seçin veya ses URL bağlantısı girin.');
      return;
    }

    const newSoundItem = {
      id: 'sound_' + Date.now(),
      name: newSoundName.trim().toLowerCase(),
      category: newSoundCategory,
      type: newSoundSourceType,
      url: finalUrl,
      ytId: ytId,
      startSec: Number(newSoundStartSec) || 0,
      endSec: Number(newSoundEndSec) || 3,
      isDefault: newSoundIsDefault
    };

    const currentSounds = appConfig.customSounds || [];
    let updatedSounds = [...currentSounds];

    if (newSoundIsDefault) {
      updatedSounds = updatedSounds.map(s => s.category === newSoundCategory ? { ...s, isDefault: false } : s);
    }
    updatedSounds.push(newSoundItem);

    const updatedConfig = {
      ...appConfig,
      customSounds: updatedSounds
    };

    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);

    setNewSoundName('');
    setNewSoundUrl('');
    setNewSoundYtUrl('');
    setAudioFileName('');
    setNewSoundStartSec('0');
    setNewSoundEndSec('3');
    setNewSoundIsDefault(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleDeleteSound = async (soundId) => {
    if (window.confirm('bu ses efektini silmek istediğinize emin misiniz?')) {
      sounds.playClick();
      const updatedSounds = (appConfig.customSounds || []).filter(s => s.id !== soundId);
      const updatedConfig = { ...appConfig, customSounds: updatedSounds };
      setAppConfig(updatedConfig);
      await updateAppConfig(updatedConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleToggleSoundDefault = async (soundId, category) => {
    sounds.playClick();
    const updatedSounds = (appConfig.customSounds || []).map(s => {
      if (s.id === soundId) {
        return { ...s, isDefault: !s.isDefault };
      } else if (s.category === category) {
        return { ...s, isDefault: false };
      }
      return s;
    });

    const updatedConfig = { ...appConfig, customSounds: updatedSounds };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveSoundEdit = async (soundId) => {
    if (!editingSoundName.trim()) return;
    sounds.playClick();
    const updatedSounds = (appConfig.customSounds || []).map(s => {
      if (s.id === soundId) {
        return { ...s, name: editingSoundName.trim().toLowerCase() };
      }
      return s;
    });
    const updatedConfig = { ...appConfig, customSounds: updatedSounds };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setEditingSoundId(null);
    setEditingSoundName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSaveCoinMultipliers = async () => {
    sounds.playClick();
    setIsCoinConfigSaving(true);
    const updatedConfig = {
      ...appConfig,
      coinMultipliers: {
        default: Number(coinDefaultMult) || 10,
        premium: Number(coinPremiumMult) || 20,
        vip: Number(coinVipMult) || 30
      }
    };
    setAppConfig(updatedConfig);
    await updateAppConfig(updatedConfig);
    setIsCoinConfigSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveUserCoin = async (userId, targetAmount) => {
    sounds.playClick();
    setSavingUserCoinId(userId);
    const amount = Number(targetAmount);
    const updated = await updateUser(userId, { coins: isNaN(amount) ? 0 : amount });
    if (updated) {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, coins: isNaN(amount) ? 0 : amount } : u));
    }
    try {
      socket.emit('admin_notify_coin_update', {
        userId,
        coins: isNaN(amount) ? 0 : amount
      });
    } catch (e) {}
    setSavingUserCoinId(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleQuickAdjustCoins = async (userId, currentCoins, delta) => {
    const newAmount = Math.max(0, (Number(currentCoins) || 0) + delta);
    setUserCoinsInput(prev => ({ ...prev, [userId]: String(newAmount) }));
    await handleSaveUserCoin(userId, newAmount);
  };

  // Filtered coin users
  const filteredCoinUsers = usersList.filter(u => {
    const q = coinUserSearch.toLowerCase().trim();
    if (!q) return true;
    return (u.username || '').toLowerCase().includes(q) ||
           (u.displayName || '').toLowerCase().includes(q) ||
           (u.id || '').includes(q);
  });

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
        borderRight: '1px solid rgba(255, 0, 0, 0.3)',
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
                background: '#FF0000',
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
                background: mainNav === 'cards' ? '#FF0000' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'cards' ? '1px solid #ff3333' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'cards' ? '0 4px 14px rgba(255, 0, 0, 0.45)' : 'none',
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
                background: mainNav === 'users' ? '#FF0000' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'users' ? '1px solid #ff3333' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'users' ? '0 4px 14px rgba(255, 0, 0, 0.45)' : 'none',
                textAlign: 'left'
              }}
            >
              <Users size={18} /> kullanıcılar ({usersList.length})
            </button>

            <button
              onClick={() => { sounds.playClick(); setMainNav('coins'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'coins' ? '#FF0000' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'coins' ? '1px solid #ff3333' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'coins' ? '0 4px 14px rgba(255, 0, 0, 0.45)' : 'none',
                textAlign: 'left'
              }}
            >
              <Coins size={18} /> coin düzenleme
            </button>

            <button
              onClick={() => { sounds.playClick(); setMainNav('ui_settings'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'ui_settings' ? '#FF0000' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'ui_settings' ? '1px solid #ff3333' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'ui_settings' ? '0 4px 14px rgba(255, 0, 0, 0.45)' : 'none',
                textAlign: 'left'
              }}
            >
              <Sliders size={18} /> arayüz ayarları
            </button>

            <button
              onClick={() => { sounds.playClick(); setMainNav('market'); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: mainNav === 'market' ? '#FF0000' : 'transparent',
                color: '#ffffff',
                border: mainNav === 'market' ? '1px solid #ff3333' : '1px solid transparent',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: mainNav === 'market' ? '0 4px 14px rgba(255, 0, 0, 0.45)' : 'none',
                textAlign: 'left'
              }}
            >
              <Store size={18} /> market yönetimi
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
        scrollbarGutter: 'stable',
        padding: '32px 40px 60px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxSizing: 'border-box'
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
                  toplam deste sayısı
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
                <FolderEdit size={18} /> desteler ve izinler ({combinedDeckList.length})
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

              <button
                onClick={() => { sounds.playClick(); setActiveTab('suggestions'); loadSuggestions(); }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: activeTab === 'suggestions' ? '#d90429' : 'transparent',
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
                <Lightbulb size={18} /> önerilen kart & desteler ({suggestionsList.length})
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
                    <option value="all">tüm desteler ({allCategories.length})</option>
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
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  {/* Type Switcher */}
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCardType('perk')}
                                      style={{
                                        background: editingCardType === 'perk' ? '#ffffff' : '#141414',
                                        color: editingCardType === 'perk' ? '#000000' : '#ffffff',
                                        border: editingCardType === 'perk' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      beyaz (perk)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCardType('redflag')}
                                      style={{
                                        background: editingCardType === 'redflag' ? '#d90429' : '#141414',
                                        color: '#ffffff',
                                        border: editingCardType === 'redflag' ? '1px solid #d90429' : '1px solid rgba(255, 255, 255, 0.2)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      kırmızı (red flag)
                                    </button>
                                  </div>

                                  {/* Deck / Package Selector */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>deste / paket:</span>
                                    <select
                                      value={editingCardCategory}
                                      onChange={(e) => setEditingCardCategory(e.target.value)}
                                      style={{
                                        padding: '4px 10px',
                                        fontSize: '0.78rem',
                                        background: '#141414',
                                        border: '1px solid #3b82f6',
                                        borderRadius: '6px',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {combinedDeckList.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Text Input */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    className="form-input"
                                    style={{ padding: '8px 12px', fontSize: '0.9rem', flex: 1 }}
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
                              </div>
                            ) : (
                              <>
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

                                <span style={{
                                  fontSize: '0.92rem',
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  flex: 1
                                }}>
                                  {card.text}
                                </span>
                              </>
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

            {/* TAB 2: DESTELER & İZİNLER */}
            {activeTab === 'categories' && (
              <div style={{
                background: '#1c1c1c',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px', color: '#ffffff' }}>
                    deste yönetimi, yeni deste ekleme & izin kuralları
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem' }}>
                    oyuna yepyeni desteler ekleyebilir, mevcut desteleri yeniden adlandırabilir ve misafir/discord izinleri ile gizlilik (secret) kurallarını buradan tek noktadan yönetebilirsiniz.
                  </p>
                </div>

                {/* 1. YENİ DESTE / PAKET OLUŞTURMA KARTI */}
                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(217, 4, 41, 0.35)',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} color="#ef4444" />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      yeni deste / paket oluştur
                    </h4>
                  </div>

                  <form onSubmit={handleCreateNewDeck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label className="form-label">yeni deste / paket adı</label>
                        <input
                          type="text"
                          placeholder="örn: Anime Paketi, Gece Paketi..."
                          value={newDeckNameInput}
                          onChange={(e) => setNewDeckNameInput(e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">hangi kart tiplerini kapsasın?</label>
                        <select
                          value={newDeckTypeTarget}
                          onChange={(e) => setNewDeckTypeTarget(e.target.value)}
                          className="select-box"
                          style={{ width: '100%', height: '48px' }}
                        >
                          <option value="both">hem beyaz (perk) hem kırmızı (red flag)</option>
                          <option value="perk">yalnızca beyaz kartlar (perk)</option>
                          <option value="redflag">yalnızca kırmızı kartlar (red flag)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'center' }}>
                      <div>
                        <label className="form-label">gizlilik (secret) durumu</label>
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setNewDeckIsSecret(prev => !prev); }}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: newDeckIsSecret ? '#d90429' : '#2d2d2d',
                            color: '#ffffff',
                            border: newDeckIsSecret ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          {newDeckIsSecret ? 'gizli (secret) deste' : 'genel (silik görünür)'}
                        </button>
                      </div>

                      <div>
                        <label className="form-label">kilitliyken mouse üzerine gelince çıkacak yazı (ipucu)</label>
                        <input
                          type="text"
                          placeholder="örn: bu desteyi açmak için VIP üye olmanız gerekir."
                          value={newDeckLockDesc}
                          onChange={(e) => setNewDeckLockDesc(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">deste ek notu (isteğe bağlı - kartların sol altında gösterilir)</label>
                      <input
                        type="text"
                        placeholder="örn: Özel Seri (kartların sol altında: X Deste - &quot;Özel Seri&quot; şeklinde görünür)"
                        value={newDeckExtraNote}
                        onChange={(e) => setNewDeckExtraNote(e.target.value)}
                        className="form-input"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: '12px 22px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Plus size={16} /> desteyi oluştur ve kaydet
                    </button>
                  </form>
                </div>

                {/* 2. MEVCUT DESTELER & İSİM DÜZENLEME & EK NOTLAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderEdit size={16} color="#fbbf24" />
                    mevcut desteler, kart sayıları ve ek notlar ({combinedDeckList.length})
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Perks Decks */}
                    <div style={{ background: '#242424', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <h5 style={{ color: '#ffffff', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem' }}>
                        <Layers size={15} /> beyaz kart desteleri ({perkCategories.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {perkCategories.map(cat => {
                          const currentNote = deckState.raw?.deckNotes?.[cat] || '';
                          const noteInput = editingDeckNotes[cat] !== undefined ? editingDeckNotes[cat] : currentNote;

                          return (
                            <div key={cat} style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cat} ({deckState.raw.Perks[cat]?.length || 0} kart)</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setRenamingCategory({ section: 'Perks', oldName: cat });
                                      setNewCategoryNameInput(cat);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
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

                              {/* Ek Not Input */}
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>ek not:</span>
                                <input
                                  type="text"
                                  placeholder="kartlarda görünecek ek not (boş bırakılabilir)..."
                                  value={noteInput}
                                  onChange={(e) => setEditingDeckNotes(prev => ({ ...prev, [cat]: e.target.value }))}
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#111111',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    fontSize: '0.76rem'
                                  }}
                                />
                                {noteInput !== currentNote && (
                                  <button
                                    onClick={() => handleSaveDeckExtraNote(cat, noteInput)}
                                    style={{
                                      background: '#22c55e',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    kaydet
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Red Flags Decks */}
                    <div style={{ background: '#242424', padding: '18px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <h5 style={{ color: '#f87171', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem' }}>
                        <Layers size={15} /> kırmızı kart desteleri ({redFlagCategories.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {redFlagCategories.map(cat => {
                          const currentNote = deckState.raw?.deckNotes?.[cat] || '';
                          const noteInput = editingDeckNotes[cat] !== undefined ? editingDeckNotes[cat] : currentNote;

                          return (
                            <div key={cat} style={{ background: '#1a1a1a', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fca5a5' }}>{cat} ({deckState.raw['Red Flags'][cat]?.length || 0} kart)</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setRenamingCategory({ section: 'Red Flags', oldName: cat });
                                      setNewCategoryNameInput(cat);
                                    }}
                                    className="btn-secondary"
                                    style={{ padding: '4px 10px', fontSize: '0.74rem' }}
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

                              {/* Ek Not Input */}
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>ek not:</span>
                                <input
                                  type="text"
                                  placeholder="kartlarda görünecek ek not (boş bırakılabilir)..."
                                  value={noteInput}
                                  onChange={(e) => setEditingDeckNotes(prev => ({ ...prev, [cat]: e.target.value }))}
                                  style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#111111',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    fontSize: '0.76rem'
                                  }}
                                />
                                {noteInput !== currentNote && (
                                  <button
                                    onClick={() => handleSaveDeckExtraNote(cat, noteInput)}
                                    style={{
                                      background: '#22c55e',
                                      color: '#ffffff',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    kaydet
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Rename Modal */}
                  {renamingCategory && (
                    <form onSubmit={handleRenameCategorySubmit} style={{
                      background: '#2d2d2d',
                      padding: '18px',
                      borderRadius: '14px',
                      border: '1px solid #d90429',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        "{renamingCategory.oldName}" destesinin yeni adını girin:
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          value={newCategoryNameInput}
                          onChange={(e) => setNewCategoryNameInput(e.target.value)}
                          className="form-input"
                          autoFocus
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>
                          kaydet
                        </button>
                        <button type="button" onClick={() => setRenamingCategory(null)} className="btn-secondary">
                          iptal
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 3. GENEL DESTE İZİN KURALLARI & GİZLİLİK AYARLARI */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '24px'
                }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={18} color="#38bdf8" />
                      genel deste izin kuralları & gizlilik ayarları
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px' }}>
                      misafirlerin ve discord kullanıcılarının varsayılan destelerini ayarlayın; kilitli desteler için açıklama metinleri ve gizli (secret) deste kurallarını belirleyin.
                    </p>
                  </div>

                  {/* Rule 1: Guest Users */}
                  <div style={{
                    background: '#242424',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: '#262626',
                        color: '#94a3b8',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}>
                        misafir (giriş yapmayan)
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                        varsayılan açık desteler
                      </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                      discord ile giriş yapmadan doğrudan lobi açan oyuncuların seçebileceği desteler:
                    </p>

                    <div className="deck-tags-container">
                      {combinedDeckList.map(deckName => {
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
                    background: '#242424',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid rgba(88, 101, 242, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: '#5865F2',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.78rem'
                      }}>
                        discord kullanıcıları
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                        ilk girişte tanımlanan standart desteler
                      </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                      discord ile giriş yapan tüm standart kullanıcıların profillerine başlangıçta otomatik tanımlanacak desteler:
                    </p>

                    <div className="deck-tags-container">
                      {combinedDeckList.map(deckName => {
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
                    background: '#242424',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                        deste gizlilik (secret) & kilitli bilgi metinleri (mouse hover)
                      </span>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', marginBottom: 0 }}>
                        oyuncunun sahip olmadığı bir deste <b>gizli (secret)</b> ise lobide silik bile görünmez. Gizli değilse silik görünür ve mouse ile üzerine gelindiğinde belirlediğiniz açıklama metni çıkar.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {combinedDeckList.map(deckName => {
                        const meta = appConfig.deckMetadata?.[deckName] || { isSecret: false, lockDescription: '' };

                        return (
                          <div
                            key={deckName}
                            style={{
                              background: '#1a1a1a',
                              border: meta.isSecret ? '1px solid #d90429' : '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '12px',
                              padding: '12px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
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
                                {meta.isSecret ? 'gizli (secret) deste: aktif' : 'genel deste (silik görünür)'}
                              </button>
                            </div>

                            {/* Tooltip Description Input */}
                            <div>
                              <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
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
                    style={{ padding: '12px 24px', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={18} /> {configSaving ? 'kaydediliyor...' : 'genel izinleri kaydet'}
                  </button>
                </div>
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
                    <label className="form-label">deste seç veya yeni oluştur</label>
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
                        placeholder="veya yeni deste adı..."
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

            {/* TAB 5: ÖNERİLEN KARTLAR VE DESTELER */}
            {activeTab === 'suggestions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header & Refresh */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#1c1c1c',
                  padding: '20px 24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lightbulb size={22} color="#FF0000" />
                      önerilen kartlar ve desteler yönetimi
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
                      kullanıcıların profillerinden gönderdiği kart ve deste önerilerini inceleyin, tek tuşla istediğiniz desteye ekleyin veya reddedin.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { sounds.playClick(); loadSuggestions(); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={suggestionsLoading ? 'spin' : ''} /> yenile
                  </button>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { id: 'all', label: `tümü (${suggestionsList.length})` },
                    { id: 'pending', label: `inceleniyor (${suggestionsList.filter(s => s.status === 'pending').length})` },
                    { id: 'approved', label: `onaylandı (${suggestionsList.filter(s => s.status === 'approved').length})` },
                    { id: 'rejected', label: `reddedildi (${suggestionsList.filter(s => s.status === 'rejected').length})` }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { sounds.playClick(); setCardSuggestionsFilter(f.id); }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: cardSuggestionsFilter === f.id ? '#FF0000' : '#1c1c1c',
                        color: '#ffffff',
                        border: cardSuggestionsFilter === f.id ? '1px solid #ff3333' : '1px solid rgba(255, 255, 255, 0.08)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* 1. ÖNERİLEN KARTLAR BÖLÜMÜ */}
                <div style={{
                  background: '#1c1c1c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#ef4444" />
                    önerilen tekil kartlar ({suggestionsList.filter(s => s.type === 'card' && (cardSuggestionsFilter === 'all' || s.status === cardSuggestionsFilter)).length})
                  </h4>

                  {(() => {
                    const cardSugs = suggestionsList.filter(s => s.type === 'card' && (cardSuggestionsFilter === 'all' || s.status === cardSuggestionsFilter));
                    if (cardSugs.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.88rem' }}>
                          bu filtrede önerilen kart bulunamadı.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cardSugs.map((sug) => {
                          const isPending = sug.status === 'pending';
                          const isEditing = !!editingCardSug[sug.id];
                          const editData = editingCardSug[sug.id] || {};
                          const isWhite = isEditing
                            ? (editData.type === 'perk')
                            : (sug.cardData?.type === 'perk');
                          const selectedDest = isEditing
                            ? (editData.targetDeck || targetDeckForCard[sug.id] || sug.cardData?.targetDeck || 'Ana Deste')
                            : (targetDeckForCard[sug.id] || sug.cardData?.targetDeck || 'Ana Deste');
                          const isSavingThis = !!isUpdatingSug[sug.id];

                          return (
                            <div
                              key={sug.id}
                              style={{
                                background: '#242424',
                                border: isEditing
                                  ? '1px solid #3b82f6'
                                  : (isPending ? '1px solid rgba(255, 0, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)'),
                                borderRadius: '14px',
                                padding: '16px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'border 0.2s'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                {/* Left: Card Badge + Text / Edit Mode Form */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                      {/* Type Switcher */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>kart türü:</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCardSug(prev => ({
                                              ...prev,
                                              [sug.id]: { ...prev[sug.id], type: 'perk' }
                                            }))}
                                            style={{
                                              background: editData.type === 'perk' ? '#ffffff' : '#141414',
                                              color: editData.type === 'perk' ? '#000000' : '#ffffff',
                                              border: editData.type === 'perk' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                                              padding: '4px 10px',
                                              borderRadius: '6px',
                                              fontSize: '0.75rem',
                                              fontWeight: 800,
                                              cursor: 'pointer'
                                            }}
                                          >
                                            beyaz kart
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingCardSug(prev => ({
                                              ...prev,
                                              [sug.id]: { ...prev[sug.id], type: 'red_flag' }
                                            }))}
                                            style={{
                                              background: editData.type === 'red_flag' ? '#FF0000' : '#141414',
                                              color: '#ffffff',
                                              border: editData.type === 'red_flag' ? '1px solid #FF0000' : '1px solid rgba(255, 255, 255, 0.2)',
                                              padding: '4px 10px',
                                              borderRadius: '6px',
                                              fontSize: '0.75rem',
                                              fontWeight: 800,
                                              cursor: 'pointer'
                                            }}
                                          >
                                            kırmızı kart
                                          </button>
                                        </div>
                                      </div>

                                      {/* Textarea for card text */}
                                      <div>
                                        <textarea
                                          value={editData.text || ''}
                                          onChange={(e) => setEditingCardSug(prev => ({
                                            ...prev,
                                            [sug.id]: { ...prev[sug.id], text: e.target.value }
                                          }))}
                                          placeholder="kart metnini giriniz..."
                                          rows={2}
                                          style={{
                                            width: '100%',
                                            background: '#141414',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '8px',
                                            padding: '10px 12px',
                                            color: '#ffffff',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            lineHeight: '1.4',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                          }}
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{
                                          background: isWhite ? '#ffffff' : '#FF0000',
                                          color: isWhite ? '#000000' : '#ffffff',
                                          fontWeight: 800,
                                          fontSize: '0.72rem',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          textTransform: 'lowercase'
                                        }}>
                                          {isWhite ? 'beyaz kart' : 'kırmızı kart'}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                          hedef: <strong style={{ color: '#ffffff' }}>{selectedDest}</strong>
                                        </span>
                                      </div>

                                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                                        "{sug.cardData?.text}"
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Author Info (Discord ID & Name) */}
                                <div style={{
                                  background: '#1a1a1a',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '10px',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  minWidth: '240px'
                                }}>
                                  <img
                                    src={sug.author?.avatar || defaultAvatarImg}
                                    alt="avatar"
                                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                                      {sug.author?.name || sug.author?.username || 'Anonim'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                                      ID: {sug.author?.id || 'Bilinmiyor'}
                                    </span>
                                    {sug.author?.isAnonymous && (
                                      <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                                        kullanıcı anonim gönderdi
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Toolbar */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                paddingTop: '10px',
                                gap: '12px'
                              }}>
                                {/* Destination Deck Selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>eklenecek deste:</span>
                                  <select
                                    value={selectedDest}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTargetDeckForCard(prev => ({ ...prev, [sug.id]: val }));
                                      if (isEditing) {
                                        setEditingCardSug(prev => ({
                                          ...prev,
                                          [sug.id]: { ...prev[sug.id], targetDeck: val }
                                        }));
                                      }
                                    }}
                                    disabled={!isPending}
                                    style={{
                                      background: '#141414',
                                      border: '1px solid rgba(255, 255, 255, 0.15)',
                                      color: '#ffffff',
                                      borderRadius: '8px',
                                      padding: '5px 10px',
                                      fontSize: '0.8rem',
                                      cursor: isPending ? 'pointer' : 'default'
                                    }}
                                  >
                                    {combinedDeckList.map(d => (
                                      <option key={d} value={d}>{d}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Buttons / Status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isPending ? (
                                    isEditing ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => cancelEditCardSug(sug.id)}
                                          style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#ffffff',
                                            padding: '7px 12px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                          }}
                                        >
                                          <X size={13} /> vazgeç
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditCardSug(sug.id)}
                                          disabled={isSavingThis || !editData.text?.trim()}
                                          style={{
                                            background: '#3b82f6',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <Save size={13} /> sadece öneriyi güncelle
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleApproveCardSuggestion(sug)}
                                          disabled={!editData.text?.trim()}
                                          style={{
                                            background: '#22c55e',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <Check size={14} /> düzenlemeyi onayla & desteye ekle
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => startEditCardSug(sug)}
                                          style={{
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            color: '#60a5fa',
                                            padding: '7px 12px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                          }}
                                        >
                                          <Edit2 size={13} /> düzenle
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleApproveCardSuggestion(sug)}
                                          style={{
                                            background: '#22c55e',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <Check size={14} /> tek tuşla desteye ekle & onayla
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleRejectSuggestion(sug.id)}
                                          style={{
                                            background: 'rgba(239, 68, 68, 0.15)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            color: '#f87171',
                                            padding: '7px 12px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          reddet
                                        </button>
                                      </>
                                    )
                                  ) : (
                                    <span style={{
                                      background: sug.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                      border: sug.status === 'approved' ? '1px solid #10b981' : '1px solid #ef4444',
                                      color: sug.status === 'approved' ? '#34d399' : '#f87171',
                                      padding: '4px 12px',
                                      borderRadius: '9999px',
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      {sug.status === 'approved' ? <><CheckCircle2 size={12} /> desteye eklendi</> : <><XCircle size={12} /> reddedildi</>}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. ÖNERİLEN DESTELER BÖLÜMÜ */}
                <div style={{
                  background: '#1c1c1c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderEdit size={18} color="#3b82f6" />
                    önerilen desteler & paketler ({suggestionsList.filter(s => s.type === 'deck' && (cardSuggestionsFilter === 'all' || s.status === cardSuggestionsFilter)).length})
                  </h4>

                  {(() => {
                    const deckSugs = suggestionsList.filter(s => s.type === 'deck' && (cardSuggestionsFilter === 'all' || s.status === cardSuggestionsFilter));
                    if (deckSugs.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.88rem' }}>
                          bu filtrede önerilen deste bulunamadı.
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {deckSugs.map((sug) => {
                          const isPending = sug.status === 'pending';
                          const isExpanded = expandedDeckSugId === sug.id;
                          const whiteCount = sug.deckData?.whiteCards?.length || 0;
                          const redCount = sug.deckData?.redCards?.length || 0;

                          return (
                            <div
                              key={sug.id}
                              style={{
                                background: '#242424',
                                border: isPending ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '18px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                                      {sug.deckData?.title}
                                    </span>
                                  </div>

                                  {sug.deckData?.description && (
                                    <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>
                                      {sug.deckData.description}
                                    </p>
                                  )}

                                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 700 }}>
                                      {whiteCount} Beyaz Kart
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: '#f87171', fontWeight: 700 }}>
                                      {redCount} Kırmızı Kart
                                    </span>
                                  </div>
                                </div>

                                {/* Author Info */}
                                <div style={{
                                  background: '#1a1a1a',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '10px',
                                  padding: '8px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  minWidth: '240px'
                                }}>
                                  <img
                                    src={sug.author?.avatar || defaultAvatarImg}
                                    alt="avatar"
                                    style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                                      {sug.author?.name || sug.author?.username || 'Anonim'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                                      ID: {sug.author?.id || 'Bilinmiyor'}
                                    </span>
                                    {sug.author?.isAnonymous && (
                                      <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                                        kullanıcı anonim önerdi
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expand Card List */}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setExpandedDeckSugId(isExpanded ? null : sug.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#3b82f6',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {isExpanded ? '▲ kart listesini gizle' : `▼ destedeki ${whiteCount + redCount} kartı incele`}
                                </button>

                                {isExpanded && (
                                  <div style={{
                                    marginTop: '10px',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '12px',
                                    background: '#181818',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    maxHeight: '240px',
                                    overflowY: 'auto'
                                  }}>
                                    <div>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', display: 'block', marginBottom: '6px' }}>
                                        Beyaz Kartlar ({whiteCount})
                                      </span>
                                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {(sug.deckData?.whiteCards || []).map((c, i) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ol>
                                    </div>

                                    <div>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f87171', display: 'block', marginBottom: '6px' }}>
                                        Kırmızı Kartlar ({redCount})
                                      </span>
                                      <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        {(sug.deckData?.redCards || []).map((c, i) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Toolbar */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                paddingTop: '10px',
                                gap: '10px'
                              }}>
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveDeckSuggestion(sug)}
                                      style={{
                                        background: '#22c55e',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '7px 18px',
                                        borderRadius: '8px',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                    >
                                      <Check size={14} /> tek tuşla yeni deste olarak oyuna ekle
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleRejectSuggestion(sug.id)}
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#f87171',
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      reddet
                                    </button>
                                  </>
                                ) : (
                                  <span style={{
                                    background: sug.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    border: sug.status === 'approved' ? '1px solid #10b981' : '1px solid #ef4444',
                                    color: sug.status === 'approved' ? '#34d399' : '#f87171',
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '0.76rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    {sug.status === 'approved' ? <><CheckCircle2 size={12} /> yeni deste olarak eklendi</> : <><XCircle size={12} /> reddedildi</>}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
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
                  discord ile giriş yapan oyuncuları görüntüleyin, düzenleme modalı üzerinden etiket, deste ve ses tercihlerini yönetin.
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

            {/* Clean Users Table / Card Rows */}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredUsers.map(user => {
                  const isMainAdminUser = user.id === ADMIN_DISCORD_ID;
                  const isBanned = !!user.isBanned;

                  return (
                    <div
                      key={user.id}
                      style={{
                        background: '#1c1c1c',
                        border: isBanned ? '1px solid rgba(239, 68, 68, 0.4)' : isMainAdminUser ? '1px solid #d90429' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                      }}
                    >
                      {/* Left: User Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={user.avatar || defaultAvatarImg}
                          alt={user.displayName}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isBanned ? '2px solid #ef4444' : isMainAdminUser ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)'
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff' }}>
                              {user.displayName || user.username}
                            </span>
                            {user.username && user.username !== user.displayName && (
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                (@{user.username})
                              </span>
                            )}
                            {isMainAdminUser && (
                              <span className="badge-admin">
                                <ShieldCheck size={10} /> ana yönetici
                              </span>
                            )}
                            {(user.tags || []).map(t => (
                              <TagBadge key={t} tag={t} size="sm" customTags={appConfig.customTags} />
                            ))}
                            {isBanned && (
                              <span style={{
                                background: '#ef4444',
                                color: '#ffffff',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800
                              }}>
                                yasaklı
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                            discord id: <b style={{ color: '#cbd5e1' }}>{user.id}</b>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions (Düzenle & Yasakla) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setEditingUser(user);
                          }}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: '#fff', border: 'none' }}
                        >
                          <Edit2 size={14} /> düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setBanningUser(user);
                            setBanReasonInput(user.banReason || '');
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: isBanned ? '#34d399' : '#f87171',
                            borderColor: isBanned ? 'rgba(52, 211, 153, 0.4)' : 'rgba(248, 113, 113, 0.4)'
                          }}
                        >
                          <ShieldAlert size={14} /> {isBanned ? 'yasağı kaldır' : 'yasakla'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION C: ARAYÜZ AYARLARI (UI SETTINGS: SOUNDS & TAGS)                 */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'ui_settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {/* Top Horizontal Sub-Navbar */}
            <div style={{
              display: 'flex',
              gap: '10px',
              background: '#1c1c1c',
              padding: '6px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                onClick={() => { sounds.playClick(); setUiTab('sounds'); }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: uiTab === 'sounds' ? '#d90429' : 'transparent',
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
                <Volume2 size={18} /> ses ayarları ({(appConfig.customSounds || []).length})
              </button>

              <button
                onClick={() => { sounds.playClick(); setUiTab('tags'); }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '10px',
                  background: uiTab === 'tags' ? '#d90429' : 'transparent',
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
                <Tag size={18} /> etiketler & roller ({(appConfig.customTags || DEFAULT_CONFIG.customTags || []).length})
              </button>
            </div>

            {/* SUB-TAB 1: SES AYARLARI */}
            {uiTab === 'sounds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                    ses efektleri & müzik yönetimi
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                    beyaz kart atarken, kırmızı kart atarken ve oyun kazanıldığında çalacak sesleri ekleyin. yerel mp3/wav yükleyebilir veya youtube video linki verip saniye aralığı belirleyebilirsiniz.
                  </p>
                </div>

                {/* 1. YENİ SES EKLEME FORMU */}
                <div style={{
                  background: '#1c1c1c',
                  border: '1px solid rgba(255, 0, 0, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{
                  background: '#FF0000',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  yeni ses
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  kütüphaneye yeni ses efekti ekle
                </span>
              </div>

              <form onSubmit={handleAddSoundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Ses İsmi */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      ses adı / başlığı:
                    </label>
                    <input
                      type="text"
                      placeholder="örn: bruh sesi, zafer fanfarı, mlg korna..."
                      value={newSoundName}
                      onChange={(e) => setNewSoundName(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  {/* Olay Türü / Kategorisi */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      çalacağı olay türü:
                    </label>
                    <select
                      value={newSoundCategory}
                      onChange={(e) => setNewSoundCategory(e.target.value)}
                      className="form-input"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="white_card">beyaz kart atılınca</option>
                      <option value="red_card">kırmızı kart atılınca</option>
                      <option value="game_win">oyun kazanılınca (skorbord)</option>
                      <option value="general">genel / serbest ses</option>
                    </select>
                  </div>
                </div>

                {/* Ses Kaynağı Seçimi (Local / YouTube / URL) */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    ses kaynağı türü:
                  </label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setNewSoundSourceType('local'); }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: newSoundSourceType === 'local' ? '#FF0000' : '#262626',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      yerel ses dosyası (mp3/wav)
                    </button>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setNewSoundSourceType('youtube'); }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: newSoundSourceType === 'youtube' ? '#FF0000' : '#262626',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      youtube video linki
                    </button>
                    <button
                      type="button"
                      onClick={() => { sounds.playClick(); setNewSoundSourceType('url'); }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        background: newSoundSourceType === 'url' ? '#FF0000' : '#262626',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      doğrudan ses url'si
                    </button>
                  </div>

                  {newSoundSourceType === 'local' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <label className="btn-secondary" style={{ padding: '10px 16px', fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Upload size={15} /> dosya seç (.mp3, .wav, .ogg)
                        <input type="file" accept="audio/*" onChange={handleSoundFileUpload} style={{ display: 'none' }} />
                      </label>
                      {audioFileName && (
                        <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> {audioFileName} seçildi
                        </span>
                      )}
                    </div>
                  )}

                  {newSoundSourceType === 'youtube' && (
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... veya https://youtu.be/..."
                      value={newSoundYtUrl}
                      onChange={(e) => setNewSoundYtUrl(e.target.value)}
                      className="form-input"
                      required
                    />
                  )}

                  {newSoundSourceType === 'url' && (
                    <input
                      type="url"
                      placeholder="https://site.com/ses.mp3"
                      value={newSoundUrl}
                      onChange={(e) => setNewSoundUrl(e.target.value)}
                      className="form-input"
                      required
                    />
                  )}
                </div>

                {/* Saniye Aralığı ve Önizleme */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      başlangıç saniyesi:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newSoundStartSec}
                      onChange={(e) => setNewSoundStartSec(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                      bitiş saniyesi:
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={newSoundEndSec}
                      onChange={(e) => setNewSoundEndSec(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestPlay({
                      name: newSoundName || 'önizleme',
                      type: newSoundSourceType,
                      url: newSoundUrl,
                      ytId: extractYouTubeId(newSoundYtUrl),
                      startSec: Number(newSoundStartSec) || 0,
                      endSec: Number(newSoundEndSec) || 3
                    })}
                    className="btn-secondary"
                    style={{ padding: '0 16px', height: '44px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
                  >
                    <Play size={14} fill="#ffffff" /> önizle / dinle
                  </button>
                </div>

                {/* Varsayılan Sistem Sesi Olsun mu */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.84rem', color: '#ffffff', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={newSoundIsDefault}
                    onChange={(e) => setNewSoundIsDefault(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>bu kategorideki herkes için varsayılan sistem sesi yap</span>
                </label>

                <button type="submit" className="btn-primary" style={{ padding: '14px', alignSelf: 'flex-start' }}>
                  <Plus size={18} /> ses kütüphanesine ekle
                </button>
              </form>
            </div>

            {/* 2. MEVCUT SES KÜTÜPHANESİ */}
            <div style={{
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  ses efektleri kütüphanesi ({(appConfig.customSounds || []).length} ses)
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  oyuncular profillerinden bu sesleri seçebilirler.
                </span>
              </div>

              {(!appConfig.customSounds || appConfig.customSounds.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.88rem' }}>
                  henüz ses efekti eklenmedi. yukarıdaki formdan ilk sesinizi ekleyebilirsiniz.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appConfig.customSounds.map((sound) => {
                    const isPlaying = playingSoundId === sound.id;
                    const isEditing = editingSoundId === sound.id;

                    const catBadge =
                      sound.category === 'white_card' ? { label: 'beyaz kart', bg: '#ffffff', color: '#000000' } :
                      sound.category === 'red_card' ? { label: 'kırmızı kart', bg: '#FF0000', color: '#ffffff' } :
                      sound.category === 'game_win' ? { label: 'zafer / skorbord', bg: '#eab308', color: '#000000' } :
                      { label: 'genel', bg: '#64748b', color: '#ffffff' };

                    return (
                      <div
                        key={sound.id}
                        style={{
                          background: '#242424',
                          border: sound.isDefault ? '1.5px solid #FF0000' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        {/* Left: Play button + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                          <button
                            type="button"
                            onClick={() => handleTestPlay(sound)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: isPlaying ? '#FF0000' : 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Çal"
                          >
                            {isPlaying ? <Square size={14} fill="#ffffff" /> : <Play size={14} fill="#ffffff" />}
                          </button>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={editingSoundName}
                                  onChange={(e) => setEditingSoundName(e.target.value)}
                                  className="form-input"
                                  style={{ padding: '4px 8px', fontSize: '0.85rem', width: '220px' }}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveSoundEdit(sound.id)}
                                  style={{ background: '#22c55e', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  kaydet
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSoundId(null)}
                                  style={{ background: '#333333', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  iptal
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                                  {sound.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSoundId(sound.id);
                                    setEditingSoundName(sound.name);
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  title="İsmi düzenle"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                background: catBadge.bg,
                                color: catBadge.color,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.68rem',
                                fontWeight: 800
                              }}>
                                {catBadge.label}
                              </span>

                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {sound.type === 'youtube' ? `youtube (${sound.startSec}s - ${sound.endSec}s)` :
                                 sound.type === 'local' ? `dosya (${sound.startSec}s - ${sound.endSec}s)` :
                                 `url (${sound.startSec}s - ${sound.endSec}s)`}
                              </span>

                              {sound.isDefault && (
                                <span style={{
                                  background: 'rgba(255, 0, 0, 0.2)',
                                  color: '#ff6666',
                                  border: '1px solid #FF0000',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.66rem',
                                  fontWeight: 800
                                }}>
                                  varsayılan sistem sesi
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSoundDefault(sound.id, sound.category)}
                            style={{
                              background: sound.isDefault ? '#FF0000' : 'rgba(255, 255, 255, 0.08)',
                              border: sound.isDefault ? '1px solid #ff3333' : '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#ffffff',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {sound.isDefault ? 'varsayılan' : 'varsayılan yap'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSound(sound.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '6px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            title="Sesi Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Save Config Button */}
            <button
              onClick={handleSaveConfig}
              disabled={configSaving}
              className="btn-primary"
              style={{ padding: '0 28px', height: '48px', alignSelf: 'flex-start' }}
            >
              <Save size={18} /> {configSaving ? 'kaydediliyor...' : 'genel ses ayarlarını kaydet'}
            </button>
          </div>
        )}

        {/* SUB-TAB 2: ETİKETLER & ROLLER YÖNETİMİ */}
        {uiTab === 'tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {/* Header & Create Tag Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1c1c1c',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} color="#FF0000" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    etiketler & roller yönetimi
                  </h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>
                  oyuncuların sahip olabileceği etiketleri, rozet renklerini, parlama ve animasyon efektlerini, ses ve deste yetkilerini özelleştirin.
                </p>
              </div>

              <button
                onClick={handleOpenNewTagModal}
                className="btn-primary"
                style={{ height: '42px', padding: '0 20px', fontSize: '0.86rem' }}
              >
                <Plus size={16} /> yeni etiket oluştur
              </button>
            </div>

            {/* Tags Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {(appConfig.customTags || DEFAULT_CONFIG.customTags || []).map(tagDef => {
                const isProtected = ['admin', 'vip', 'premium'].includes(tagDef.id.toLowerCase());
                return (
                  <div
                    key={tagDef.id}
                    style={{
                      background: '#1c1c1c',
                      border: `1px solid ${tagDef.borderColor || 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                      textAlign: 'left'
                    }}
                  >
                    {/* Top: Badge Preview & ID */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <TagBadge tag={tagDef} size="lg" customTags={appConfig.customTags} />
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          (id: {tagDef.id})
                        </span>
                      </div>

                      {isProtected && (
                        <span style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          color: '#fbbf24',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.66rem',
                          fontWeight: 800
                        }}>
                          temel rol
                        </span>
                      )}
                    </div>

                    {/* Middle: Style Properties */}
                    <div style={{
                      background: '#242424',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '0.74rem'
                    }}>
                      <div>
                        <span style={{ color: '#94a3b8' }}>parlama: </span>
                        <span style={{ color: '#ffffff', fontWeight: 700 }}>{tagDef.glow || 'yok'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>animasyon: </span>
                        <span style={{ color: '#ffffff', fontWeight: 700 }}>{tagDef.animation || 'yok'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>özel ses yetkisi: </span>
                        <span style={{ color: tagDef.permissions?.customSounds ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
                          {tagDef.permissions?.customSounds ? 'var' : 'yok'}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>coin katsayısı: </span>
                        <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                          {tagDef.permissions?.multiplier ? `${tagDef.permissions.multiplier}x` : '10x'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto' }}>
                      <button
                        onClick={() => handleOpenEditTagModal(tagDef)}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', height: '32px', minHeight: '32px' }}
                      >
                        <Edit2 size={13} /> düzenle
                      </button>

                      {!isProtected && (
                        <button
                          onClick={() => handleDeleteTag(tagDef.id)}
                          className="btn-icon"
                          style={{
                            width: '32px',
                            height: '32px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171'
                          }}
                          title="Etiketi Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION D: COIN DÜZENLEME & KATSAYI YÖNETİMİ                            */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'coins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header / Info Banner */}
            <div style={{
              background: '#1c1c1c',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Coins size={28} color="#f59e0b" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                    coin ve katsayı yönetimi
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    yalnızca discord ile giriş yapan oyuncular için oyun sonu kazanım katsayılarını ve kullanıcı bakiyelerini yönetin.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveCoinMultipliers}
                disabled={isCoinConfigSaving}
                className="btn-primary"
                style={{ padding: '0 24px', height: '44px', background: '#f59e0b', color: '#000000', fontWeight: 800, border: 'none' }}
              >
                <Save size={16} /> {isCoinConfigSaving ? 'kaydediliyor...' : 'katsayıları kaydet'}
              </button>
            </div>

            {/* 1. Coin Kazanım Katsayıları (Çarpanlar) */}
            <div style={{
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="#f59e0b" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  oyun sonu kazanım katsayıları
                </h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.5' }}>
                oyuncular oyun bittiğinde aldıkları puan ve odadaki kişi sayısına göre coin kazanır. <br />
                <code style={{ background: '#262626', padding: '2px 8px', borderRadius: '6px', color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700 }}>
                  kazanılan coin = (((oyundaki puan + 1) × katsayı) × oyuncu sayısı)
                </code>
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {/* Düz Oyuncular */}
                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                      düz oyuncular
                    </span>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      standart discord
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    özel bir yetki rolü (premium/vip) bulunmayan discord kullanıcıları için çarpan.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>çarpan:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={coinDefaultMult}
                      onChange={(e) => setCoinDefaultMult(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                      style={{ width: '90px', padding: '6px 10px', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800 }}>× çarpan</span>
                  </div>
                </div>

                {/* Premium Oyuncular */}
                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} color="#c084fc" /> premium oyuncular
                    </span>
                    <span style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      premium rolü
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    profilinde "Premium" tagine sahip özel kullanıcılar için çarpan.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>çarpan:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={coinPremiumMult}
                      onChange={(e) => setCoinPremiumMult(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                      style={{ width: '90px', padding: '6px 10px', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800 }}>× çarpan</span>
                  </div>
                </div>

                {/* VIP & Admin Oyuncular */}
                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={14} color="#fbbf24" /> VIP & admin oyuncular
                    </span>
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      VIP / admin rolü
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    profilinde "VIP" veya "admin" tagine sahip seçkin kullanıcılar için çarpan.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>çarpan:</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={coinVipMult}
                      onChange={(e) => setCoinVipMult(Math.max(1, Number(e.target.value) || 1))}
                      className="form-input"
                      style={{ width: '90px', padding: '6px 10px', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800 }}>× çarpan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Canlı Formül Hesaplama Simülatörü */}
            <div style={{
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calculator size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  canlı kazanım simülatörü
                </h3>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
                    örnek puan:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={simScore}
                    onChange={(e) => setSimScore(Math.max(0, Number(e.target.value) || 0))}
                    className="form-input"
                    style={{ width: '70px', padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
                    oyuncu sayısı:
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={simPlayers}
                    onChange={(e) => setSimPlayers(Math.max(2, Number(e.target.value) || 2))}
                    className="form-input"
                    style={{ width: '70px', padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Simulation Result Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px'
              }}>
                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700 }}>düz oyuncu kazanımı</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                    {(((simScore + 1) * (Number(coinDefaultMult) || 10)) * simPlayers).toLocaleString('tr-TR')} coin
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    (({simScore}+1) × {coinDefaultMult}) × {simPlayers}
                  </span>
                </div>

                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.76rem', color: '#c084fc', fontWeight: 700 }}>premium oyuncu kazanımı</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#c084fc' }}>
                    {(((simScore + 1) * (Number(coinPremiumMult) || 20)) * simPlayers).toLocaleString('tr-TR')} coin
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    (({simScore}+1) × {coinPremiumMult}) × {simPlayers}
                  </span>
                </div>

                <div style={{
                  background: '#242424',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 700 }}>vip oyuncu kazanımı</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>
                    {(((simScore + 1) * (Number(coinVipMult) || 30)) * simPlayers).toLocaleString('tr-TR')} coin
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    (({simScore}+1) × {coinVipMult}) × {simPlayers}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Discord Kullanıcıları Coin Bakiye Yönetimi */}
            <div style={{
              background: '#1c1c1c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wallet size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    kullanıcı coin bakiyeleri ({filteredCoinUsers.length})
                  </h3>
                </div>

                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="kullanıcı ara..."
                    value={coinUserSearch}
                    onChange={(e) => setCoinUserSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '36px', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {filteredCoinUsers.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                  eşleşen discord kullanıcısı bulunamadı.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredCoinUsers.map(u => {
                    const currentCoins = u.coins !== undefined ? u.coins : 0;
                    const inputValue = userCoinsInput[u.id] !== undefined ? userCoinsInput[u.id] : String(currentCoins);
                    const isSaving = savingUserCoinId === u.id;

                    return (
                      <div
                        key={u.id}
                        style={{
                          background: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px'
                        }}
                      >
                        {/* User info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={u.avatar || defaultAvatarImg}
                            alt={u.username}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                                {u.displayName || u.username}
                              </span>
                              {u.username && u.username !== u.displayName && (
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  (@{u.username})
                                </span>
                              )}
                              {(u.tags || []).map(t => (
                                <span
                                  key={t}
                                  className={t === 'admin' ? 'badge-admin' : t === 'VIP' ? 'badge-vip' : t === 'Premium' ? 'badge-premium' : ''}
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              id: {u.id}
                            </span>
                          </div>
                        </div>

                        {/* Coin Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          {/* Current Balance Badge */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#fbbf24',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.82rem'
                          }}>
                            <Coins size={14} color="#fbbf24" />
                            {currentCoins.toLocaleString('tr-TR')} coin
                          </span>

                          {/* Quick Add Buttons */}
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustCoins(u.id, currentCoins, 100)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              +100
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustCoins(u.id, currentCoins, 500)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#e2e8f0',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              +500
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustCoins(u.id, currentCoins, 1000)}
                              style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                color: '#fbbf24',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              +1000
                            </button>
                          </div>

                          {/* Direct Edit input */}
                          <input
                            type="number"
                            min="0"
                            value={inputValue}
                            onChange={(e) => setUserCoinsInput(prev => ({ ...prev, [u.id]: e.target.value }))}
                            className="form-input"
                            style={{ width: '100px', padding: '4px 8px', fontSize: '0.85rem', fontWeight: 800, textAlign: 'right' }}
                          />

                          <button
                            type="button"
                            onClick={() => handleSaveUserCoin(u.id, inputValue)}
                            disabled={isSaving}
                            style={{
                              background: '#22c55e',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {isSaving ? '...' : 'kaydet'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION E: MARKET YÖNETİMİ (KART TEMALARI & SESLER)                     */}
        {/* ----------------------------------------------------------------------- */}
        {mainNav === 'market' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header / Sub-tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1c1c1c',
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={22} color="#ef4444" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                    market ve tema yönetimi
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    kart temalarını, fiyatlarını, optik animasyonlarını ve market seslerini özelleştirin
                  </span>
                </div>
              </div>

              {/* Sub-tabs Pills */}
              <div style={{ display: 'flex', gap: '8px', background: '#141414', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  onClick={() => { sounds.playClick(); setMarketSubTab('themes'); }}
                  style={{
                    background: marketSubTab === 'themes' ? '#ef4444' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Layers size={14} /> kart temaları ({(appConfig.market?.themes || []).length})
                </button>

                <button
                  onClick={() => { sounds.playClick(); setMarketSubTab('sounds'); }}
                  style={{
                    background: marketSubTab === 'sounds' ? '#ef4444' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Volume2 size={14} /> özel sesler ({(appConfig.market?.sounds || []).length})
                </button>
              </div>
            </div>

            {/* 1. KART TEMALARI ALT SEKMESİ */}
            {marketSubTab === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    Markette oyuncuların satın alabileceği kart temaları:
                  </span>
                  <button
                    onClick={handleOpenNewTheme}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.84rem' }}
                  >
                    <Plus size={16} /> yeni tema ekle
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px'
                }}>
                  {(appConfig.market?.themes || []).map(th => (
                    <div
                      key={th.id}
                      style={{
                        background: '#1c1c1c',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        position: 'relative'
                      }}
                    >
                      {/* Theme Header & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#ffffff' }}>
                              {th.name}
                            </h4>
                            {th.isDefault && (
                              <span style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid #38bdf8',
                                color: '#38bdf8',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}>
                                varsayılan
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                            {th.description || 'Açıklama girilmedi.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(251, 191, 36, 0.12)', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                          <Coins size={14} color="#fbbf24" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fbbf24' }}>
                            {th.price === 0 ? 'ücretsiz' : `${th.price} coin`}
                          </span>
                        </div>
                      </div>

                      {/* 4 Cards Live Preview */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        background: '#141414',
                        padding: '8px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}>
                        {/* 1. Red Back */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '100%',
                            aspectRatio: '0.68',
                            borderRadius: '6px',
                            backgroundImage: `url(${th.images?.redBack || '/themes/stocks/1.png'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }} />
                          <span style={{ fontSize: '0.60rem', color: '#ef4444', fontWeight: 700 }}>1. kırmızı arka</span>
                        </div>

                        {/* 2. White Back */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '100%',
                            aspectRatio: '0.68',
                            borderRadius: '6px',
                            backgroundImage: `url(${th.images?.whiteBack || '/themes/stocks/2.png'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }} />
                          <span style={{ fontSize: '0.60rem', color: '#e2e8f0', fontWeight: 700 }}>2. beyaz arka</span>
                        </div>

                        {/* 3. Red Front */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '100%',
                            aspectRatio: '0.68',
                            borderRadius: '6px',
                            backgroundImage: `url(${th.images?.redFront || '/themes/stocks/3.png'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                          }}>
                            <span style={{ fontSize: '0.54rem', color: th.fontColorRed || '#ffffff', fontWeight: 800, textAlign: 'center' }}>
                              red flag
                            </span>
                          </div>
                          <span style={{ fontSize: '0.60rem', color: '#ef4444', fontWeight: 700 }}>3. kırmızı ön</span>
                        </div>

                        {/* 4. White Front */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{
                            width: '100%',
                            aspectRatio: '0.68',
                            borderRadius: '6px',
                            backgroundImage: `url(${th.images?.whiteFront || '/themes/stocks/4.png'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                          }}>
                            <span style={{ fontSize: '0.54rem', color: th.fontColorWhite || '#000000', fontWeight: 800, textAlign: 'center' }}>
                              perk
                            </span>
                          </div>
                          <span style={{ fontSize: '0.60rem', color: '#e2e8f0', fontWeight: 700 }}>4. beyaz ön</span>
                        </div>
                      </div>

                      {/* Theme Meta Info (Colors, Glow, Anim) */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem' }}>
                        <span style={{ background: '#242424', padding: '3px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          kırmızı font: <b style={{ color: th.fontColorRed || '#ffffff' }}>{th.fontColorRed || '#ffffff'}</b>
                        </span>
                        <span style={{ background: '#242424', padding: '3px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          beyaz font: <b style={{ color: th.fontColorWhite || '#000000' }}>{th.fontColorWhite || '#000000'}</b>
                        </span>
                        <span style={{ background: '#242424', padding: '3px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          parlama: <b>{th.glow || 'none'}</b>
                        </span>
                        <span style={{ background: '#242424', padding: '3px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                          animasyon: <b>{th.animation || 'none'}</b>
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditTheme(th)}
                          style={{
                            background: '#222222',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={12} /> düzenle
                        </button>
                        {!th.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTheme(th.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={12} /> sil
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. ÖZEL SESLER ALT SEKMESİ */}
            {marketSubTab === 'sounds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Add Sound Card */}
                <form onSubmit={handleAddMarketSound} style={{
                  background: '#1c1c1c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} color="#ef4444" /> markete yeni özel ses / müzik efekti ekle
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {/* Ses Adı */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>ses adı:</label>
                      <input
                        type="text"
                        placeholder="Örn: Siber Kart Dağıtımı"
                        value={newMarketSoundName}
                        onChange={e => setNewMarketSoundName(e.target.value)}
                        className="input-box"
                        required
                      />
                    </div>

                    {/* Kategori */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>kategori:</label>
                      <select
                        value={newMarketSoundCategory}
                        onChange={e => setNewMarketSoundCategory(e.target.value)}
                        className="select-box"
                      >
                        <option value="white_card">Beyaz Kart Dağıtımı</option>
                        <option value="red_card">Kırmızı Kart Sabotajı</option>
                        <option value="game_win">Oyun / Tur Zaferi</option>
                      </select>
                    </div>

                    {/* Coin Fiyatı */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>coin fiyatı:</label>
                      <input
                        type="number"
                        min="0"
                        value={newMarketSoundPrice}
                        onChange={e => setNewMarketSoundPrice(e.target.value)}
                        className="input-box"
                      />
                    </div>

                    {/* Kaynak Türü */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>ses kaynağı:</label>
                      <select
                        value={newMarketSoundSourceType}
                        onChange={e => setNewMarketSoundSourceType(e.target.value)}
                        className="select-box"
                      >
                        <option value="file">Dosya Yolu / MP3 Web Linki</option>
                        <option value="youtube">YouTube Video / Klip Linki</option>
                      </select>
                    </div>
                  </div>

                  {/* URL Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: newMarketSoundSourceType === 'youtube' ? '2fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
                    {newMarketSoundSourceType === 'youtube' ? (
                      <>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>youtube video linki:</label>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={newMarketSoundYtUrl}
                            onChange={e => setNewMarketSoundYtUrl(e.target.value)}
                            className="input-box"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>başlangıç (sn):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={newMarketSoundStartSec}
                            onChange={e => setNewMarketSoundStartSec(e.target.value)}
                            className="input-box"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>bitiş (sn):</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={newMarketSoundEndSec}
                            onChange={e => setNewMarketSoundEndSec(e.target.value)}
                            className="input-box"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>ses url / dosya yolu:</label>
                          <input
                            type="text"
                            placeholder="Örn: /sounds/deal.mp3 veya https://...mp3"
                            value={newMarketSoundUrl}
                            onChange={e => setNewMarketSoundUrl(e.target.value)}
                            className="input-box"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>kare kapak görseli url (opsiyonel):</label>
                          <input
                            type="text"
                            placeholder="Örn: https://.../square.png"
                            value={newMarketSoundCoverImage}
                            onChange={e => setNewMarketSoundCoverImage(e.target.value)}
                            className="input-box"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.84rem' }}>
                      <Plus size={15} /> market sesini kaydet
                    </button>
                  </div>
                </form>

                {/* Sounds Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '14px'
                }}>
                  {(appConfig.market?.sounds || []).map(snd => (
                    <div
                      key={snd.id}
                      style={{
                        background: '#1c1c1c',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {snd.coverImage ? (
                          <img
                            src={snd.coverImage}
                            alt={snd.name}
                            style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              sounds.playCustomAudio(snd);
                            }}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Dinle / Test Et"
                          >
                            <Play size={14} />
                          </button>
                        )}

                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                            {snd.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{snd.category}</span>
                            <span>•</span>
                            <span style={{ color: '#fbbf24', fontWeight: 700 }}>{snd.price} coin</span>
                            {snd.type === 'youtube' && <span style={{ color: '#ef4444', fontWeight: 700 }}>• YouTube</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMarketSound(snd.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 1: KULLANICI DÜZENLEME MODALI                                */}
      {/* ------------------------------------------------------------------- */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div
            className="modal-content animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '28px',
              background: '#181818',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              boxShadow: '0 24px 50px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={editingUser.avatar || defaultAvatarImg}
                  alt={editingUser.displayName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                    {editingUser.displayName || editingUser.username}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    discord id: <b style={{ color: '#cbd5e1' }}>{editingUser.id}</b>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1. Roller ve Etiketler */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                  1. roller & etiketler ({editUserTags.length} seçili)
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  etiket atamak veya kaldırmak için tıklayın
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(appConfig.customTags || DEFAULT_CONFIG.customTags || []).map(tagDef => {
                  const isSelected = editUserTags.some(t => t.toLowerCase() === tagDef.id.toLowerCase() || t.toLowerCase() === tagDef.name.toLowerCase());
                  return (
                    <button
                      key={tagDef.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setEditUserTags(prev => {
                          const hasIt = prev.some(t => t.toLowerCase() === tagDef.id.toLowerCase() || t.toLowerCase() === tagDef.name.toLowerCase());
                          if (hasIt) {
                            return prev.filter(t => t.toLowerCase() !== tagDef.id.toLowerCase() && t.toLowerCase() !== tagDef.name.toLowerCase());
                          } else {
                            return [...prev, tagDef.name];
                          }
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        height: '28px',
                        padding: '0 12px',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: isSelected ? `1px solid ${tagDef.borderColor || '#ef4444'}` : '1px solid rgba(255, 255, 255, 0.12)',
                        background: isSelected ? (tagDef.bgColor || 'rgba(239, 68, 68, 0.2)') : '#181818',
                        color: isSelected ? (tagDef.color || '#ffffff') : '#64748b',
                        boxShadow: isSelected && tagDef.glow ? `0 0 10px ${tagDef.color}40` : 'none',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box'
                      }}
                    >
                      {isSelected && <Check size={12} color={tagDef.color || '#ffffff'} />}
                      {tagDef.name}
                    </button>
                  );
                })}

                {/* Leftover custom tags on user */}
                {editUserTags.filter(t => !(appConfig.customTags || DEFAULT_CONFIG.customTags || []).some(def => def.name.toLowerCase() === t.toLowerCase() || def.id.toLowerCase() === t.toLowerCase())).map(customTag => (
                  <button
                    key={customTag}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setEditUserTags(prev => prev.filter(t => t !== customTag));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <Check size={12} /> {customTag}
                    <X size={11} style={{ marginLeft: '2px', opacity: 0.7 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Sahip Olunan Desteler */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                  2. sahip olunan desteler ({editUserDecks.length} aktif)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setEditUserDecks([...DEFAULT_CONFIG.allDecks])}
                    style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    tümünü aç
                  </button>
                  <span style={{ color: '#475569' }}>|</span>
                  <button
                    type="button"
                    onClick={() => setEditUserDecks(['Ana Deste'])}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    sıfırla
                  </button>
                </div>
              </div>

              <div className="deck-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {DEFAULT_CONFIG.allDecks.map(deckName => {
                  const isUnlocked = editUserDecks.includes(deckName);
                  return (
                    <button
                      key={deckName}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setEditUserDecks(prev => prev.includes(deckName) ? prev.filter(d => d !== deckName) : [...prev, deckName]);
                      }}
                      className={`deck-tag-btn ${isUnlocked ? 'active' : ''}`}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {isUnlocked ? <Check size={13} /> : <Plus size={13} />}
                      {deckName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Özel Ses Seçenekleri */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                3. kullanıcının özel ses tercihleri
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {/* White Card Sound */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>beyaz kart sesi</label>
                  <select
                    value={editUserWhiteSound}
                    onChange={(e) => setEditUserWhiteSound(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  >
                    <option value="">varsayılan sistem sesi</option>
                    {(appConfig.customSounds || []).filter(s => s.category === 'white_card').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Red Card Sound */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>kırmızı kart sesi</label>
                  <select
                    value={editUserRedSound}
                    onChange={(e) => setEditUserRedSound(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  >
                    <option value="">varsayılan sistem sesi</option>
                    {(appConfig.customSounds || []).filter(s => s.category === 'red_card').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Win Sound */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>kazanma sesi</label>
                  <select
                    value={editUserWinSound}
                    onChange={(e) => setEditUserWinSound(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                  >
                    <option value="">varsayılan sistem sesi</option>
                    {(appConfig.customSounds || []).filter(s => s.category === 'game_win').map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Sahip Olunan Kart Temaları */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#ef4444" /> 4. sahip olunan kart temaları ({editUserOwnedThemes.length} aktif)
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  oyuncunun kuşanabileceği temalar
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(appConfig.market?.themes || []).map(th => {
                  const isChecked = editUserOwnedThemes.includes(th.id) || th.id === 'stocks';
                  return (
                    <button
                      key={th.id}
                      type="button"
                      disabled={th.id === 'stocks'}
                      onClick={() => {
                        sounds.playClick();
                        setEditUserOwnedThemes(prev => {
                          if (prev.includes(th.id)) {
                            return prev.filter(id => id !== th.id);
                          } else {
                            return [...prev, th.id];
                          }
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: th.id === 'stocks' ? 'default' : 'pointer',
                        border: isChecked ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isChecked ? 'rgba(239, 68, 68, 0.2)' : '#181818',
                        color: isChecked ? '#ffffff' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isChecked ? <Check size={12} color="#ef4444" /> : <Plus size={12} />}
                      {th.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Sahip Olunan Özel Sesler */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#38bdf8" /> 5. sahip olunan özel sesler ({editUserOwnedSounds.length} aktif)
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  oyuncunun sahip olduğu market sesleri
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(appConfig.market?.sounds || []).map(snd => {
                  const isChecked = editUserOwnedSounds.includes(snd.id);
                  return (
                    <button
                      key={snd.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setEditUserOwnedSounds(prev => {
                          if (prev.includes(snd.id)) {
                            return prev.filter(id => id !== snd.id);
                          } else {
                            return [...prev, snd.id];
                          }
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        border: isChecked ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isChecked ? 'rgba(56, 189, 248, 0.2)' : '#181818',
                        color: isChecked ? '#ffffff' : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isChecked ? <Check size={12} color="#38bdf8" /> : <Plus size={12} />}
                      {snd.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Coin Bakiyesi */}
            <div style={{
              background: '#222222',
              padding: '16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={16} color="#fbbf24" /> coin bakiyesi
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  kullanıcının mevcut toplam coin miktarını belirleyin
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  value={editUserCoins}
                  onChange={(e) => setEditUserCoins(Math.max(0, Number(e.target.value) || 0))}
                  className="form-input"
                  style={{ width: '110px', padding: '6px 10px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setEditUserCoins(prev => prev + 100)}
                  className="btn-secondary"
                  style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => setEditUserCoins(prev => prev + 500)}
                  className="btn-secondary"
                  style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                >
                  +500
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn-secondary"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                iptal
              </button>
              <button
                type="button"
                onClick={handleSaveUserFromModal}
                disabled={userSavingId === editingUser.id}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem', background: '#22c55e', color: '#fff', border: 'none' }}
              >
                <Save size={16} /> {userSavingId === editingUser.id ? 'kaydediliyor...' : 'değişiklikleri kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 2: KULLANICI YASAKLAMA (BAN) MODALI                          */}
      {/* ------------------------------------------------------------------- */}
      {banningUser && (
        <div className="modal-overlay" onClick={() => setBanningUser(null)}>
          <div
            className="modal-content animate-pop"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              background: '#181818',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              boxShadow: '0 24px 50px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                  kullanıcı yasaklama (ban)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBanningUser(null)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
                title="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: '#222222',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <img
                src={banningUser.avatar || defaultAvatarImg}
                alt={banningUser.displayName}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  {banningUser.displayName || banningUser.username}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  discord id: {banningUser.id}
                </div>
              </div>
            </div>

            {/* If currently banned: display reason and Unban button */}
            {banningUser.isBanned ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'left'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f87171', marginBottom: '4px' }}>
                    bu kullanıcı şu anda yasaklı
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    yasaklama sebebi: <b>{banningUser.banReason || 'Belirtilmedi'}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setBanningUser(null)}
                    className="btn-secondary"
                    style={{ padding: '10px 16px' }}
                  >
                    vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleUnbanUser}
                    className="btn-primary"
                    style={{ padding: '10px 20px', background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 800 }}
                  >
                    yasağı kaldır (unban)
                  </button>
                </div>
              </div>
            ) : (
              /* If not banned: input reason and Ban button */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>yasaklama sebebi</label>
                  <input
                    type="text"
                    placeholder="örn: uygunsuz davranış, hile..."
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setBanningUser(null)}
                    className="btn-secondary"
                    style={{ padding: '10px 16px' }}
                  >
                    iptal
                  </button>
                  <button
                    type="button"
                    onClick={handleBanUser}
                    className="btn-primary"
                    style={{ padding: '10px 20px', background: '#ef4444', color: '#ffffff', border: 'none', fontWeight: 800 }}
                  >
                    kullanıcıyı yasakla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 3: ETİKET DÜZENLEME & OLUŞTURMA MODALI                       */}
      {/* ------------------------------------------------------------------- */}
      <TagEditModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        tag={editingTag}
        isNew={isNewTag}
        availableDecks={Array.from(new Set([
          ...Object.keys(deckState.raw?.Perks || {}),
          ...Object.keys(deckState.raw?.['Red Flags'] || {}),
          ...Object.keys(deckState.raw?.perks || {}),
          ...Object.keys(deckState.raw?.red_flags || {})
        ])).filter(Boolean)}
        availableThemes={appConfig.market?.themes || []}
        availableSounds={appConfig.market?.sounds || []}
        onSave={handleSaveTag}
      />

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 4: KART TEMASI DÜZENLEME & OLUŞTURMA MODALI                  */}
      {/* ------------------------------------------------------------------- */}
      <ThemeEditModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        theme={editingTheme}
        isNew={isNewTheme}
        onSave={handleSaveTheme}
      />
    </div>
  );
}

