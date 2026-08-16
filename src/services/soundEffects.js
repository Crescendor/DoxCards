// Web Audio API Procedural Sound Engine
// Crisp, lag-free procedural sound effects without external audio assets

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.customMuted = false;
    try {
      this.customMuted = localStorage.getItem('doxcards_custom_sounds_muted') === 'true';
    } catch (e) {}
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  toggleCustomMute() {
    this.customMuted = !this.customMuted;
    try {
      localStorage.setItem('doxcards_custom_sounds_muted', String(this.customMuted));
    } catch (e) {}
    return this.customMuted;
  }

  // Play button click / card select
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Card slide / deal sound
  playCardDeal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Card flip sound
  playCardFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Red Flag Sabotage whoosh & impact
  playSabotage() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Round Win fanfare chime
  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
    const now = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Timer Tick (warning)
  playTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Emoji / Reaction Pop
  playReaction() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  extractYouTubeId(url) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url.trim();
  }

  setCustomSounds(list) {
    if (Array.isArray(list)) {
      this.customSoundsList = list;
    }
  }

  // Play YouTube Clip Audio with Start / End seconds
  playYouTubeAudio(ytId, startSec = 0, endSec = 0) {
    if (this.muted || this.customMuted || !ytId) return;

    try {
      let ytContainer = document.getElementById('doxcards-yt-audio-container');
      if (!ytContainer) {
        ytContainer = document.createElement('div');
        ytContainer.id = 'doxcards-yt-audio-container';
        ytContainer.style.position = 'fixed';
        ytContainer.style.bottom = '0px';
        ytContainer.style.right = '0px';
        ytContainer.style.width = '200px';
        ytContainer.style.height = '200px';
        ytContainer.style.opacity = '0.001';
        ytContainer.style.pointerEvents = 'none';
        ytContainer.style.zIndex = '-9999';
        document.body.appendChild(ytContainer);
      }

      const start = Number(startSec) || 0;
      const end = Number(endSec) || (start + 5);
      const durationMs = Math.max(500, (end - start) * 1000);

      // Create iframe embed with autoplay
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&playsinline=1&controls=0&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&start=${Math.floor(start)}&end=${Math.ceil(end)}`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      ytContainer.innerHTML = '';
      ytContainer.appendChild(iframe);

      // Automatically clean up after clip finishes
      setTimeout(() => {
        if (ytContainer) ytContainer.innerHTML = '';
      }, durationMs + 1000);
    } catch (err) {
      console.warn('YouTube Audio play error:', err);
    }
  }

  // Play Custom Sound Item (Local DataURL / Web URL / YouTube)
  playCustomAudio(soundItem) {
    if (this.muted || this.customMuted || !soundItem) return;

    const ytId = soundItem.ytId || (soundItem.type === 'youtube' ? this.extractYouTubeId(soundItem.url) : '');
    if ((soundItem.type === 'youtube' || ytId) && ytId) {
      this.playYouTubeAudio(ytId, soundItem.startSec, soundItem.endSec);
      return;
    }

    const audioUrl = soundItem.url || soundItem.dataUrl;
    if (!audioUrl) return;

    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.85;

      const start = Number(soundItem.startSec) || 0;
      const end = Number(soundItem.endSec) || 0;

      let isPlaying = false;
      const handleCanPlay = () => {
        if (!isPlaying) {
          isPlaying = true;
          if (start > 0) {
            try { audio.currentTime = start; } catch(e) {}
          }
          audio.play().catch(() => {});
        }
      };

      audio.addEventListener('canplay', handleCanPlay, { once: true });
      audio.addEventListener('loadedmetadata', () => {
        if (start > 0) {
          try { audio.currentTime = start; } catch(e) {}
        }
      }, { once: true });

      if (start > 0) {
        try { audio.currentTime = start; } catch(e) {}
      }
      audio.play().then(() => { isPlaying = true; }).catch(() => {});

      if (end > start) {
        const durationMs = (end - start) * 1000;
        setTimeout(() => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (e) {}
        }, durationMs);
      }
    } catch (e) {
      console.warn('Custom audio playback error:', e);
    }
  }

  // Play Trigger Sound for specific event and player
  playTriggerSound(triggerCategory, playerObj = null, customSoundsList = []) {
    if (this.muted) return;

    const activeSounds = (Array.isArray(customSoundsList) && customSoundsList.length > 0)
      ? customSoundsList
      : (this.customSoundsList || []);

    // 1. Check if the player has a custom sound chosen in profile
    const customSoundId = playerObj?.customSounds?.[
      triggerCategory === 'white_card' ? 'whiteCardSoundId' :
      triggerCategory === 'red_card' ? 'redCardSoundId' :
      triggerCategory === 'game_win' ? 'gameWinSoundId' : ''
    ];

    if (customSoundId && Array.isArray(activeSounds)) {
      const matched = activeSounds.find(s => s.id === customSoundId);
      if (matched) {
        this.playCustomAudio(matched);
        return;
      }
    }

    // 2. Check if there is an admin default sound for this category
    if (Array.isArray(activeSounds)) {
      const defaultSound = activeSounds.find(s => s.category === triggerCategory && s.isDefault);
      if (defaultSound && (defaultSound.url || defaultSound.ytId)) {
        this.playCustomAudio(defaultSound);
        return;
      }
    }

    // 3. Fallback to procedural sound
    if (triggerCategory === 'white_card') {
      this.playCardDeal();
    } else if (triggerCategory === 'red_card') {
      this.playSabotage();
    } else if (triggerCategory === 'game_win') {
      this.playWin();
    }
  }
}

export const sounds = new SoundEngine();
