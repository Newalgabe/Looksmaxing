/**
 * app.js
 * Main controller coordinating the UI views, audio synthesizer,
 * canvas renderer, card battles, dating swiping, and year progression.
 */

import { GameState, CAREER_TIERS, TALENTS, SUBSTANCES, ACHIEVEMENTS, CODEX_ENTRIES, CHALLENGE_SEEDS, RIVAL_MILESTONES } from './game.js';
import { drawAvatar } from './avatar.js';
import { BattleSystem } from './battle.js';
import { DatingSimulator } from './dating.js';
import { generateForumThread, getCopingReplies, generateForumResponse } from './forum.js';

// --- Metagame Persistent Upgrades ---
function _copeChecksum(val) {
  let hash = 5381;
  const str = String(val);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
function _loadCopeTokens() {
  const stored = localStorage.getItem('looksmax_cope_tokens');
  const storedChk = localStorage.getItem('looksmax_cope_tokens_c');
  if (!stored) return 0;
  if (storedChk !== _copeChecksum(stored)) {
    console.warn('[ANTI-CHEAT] Cope token tampering detected — reset to 0');
    localStorage.removeItem('looksmax_cope_tokens');
    localStorage.removeItem('looksmax_cope_tokens_c');
    return 0;
  }
  return parseInt(stored) || 0;
}
function _saveCopeTokens(val) {
  localStorage.setItem('looksmax_cope_tokens', val);
  localStorage.setItem('looksmax_cope_tokens_c', _copeChecksum(val));
}
let copeTokens = _loadCopeTokens();
let unlockedPerks = JSON.parse(localStorage.getItem('looksmax_unlocked_perks') || '{}');
let unlockedThemes = JSON.parse(localStorage.getItem('looksmax_unlocked_themes') || '{"default":true}');
let activeTheme = localStorage.getItem('looksmax_active_theme') || 'default';
let activeShopTab = 'perks';
let chosenGender = 'male';
let _endYearLock = false;

// Apply active theme immediately on startup
document.body.setAttribute('data-theme', activeTheme);

const METAGAME_PERKS = [
  {
    id: 'high_metabolism',
    name: 'High Metabolism',
    desc: '+20% effect on Gym-maxxing frame gains.',
    cost: 100
  },
  {
    id: 'good_donor_area',
    name: 'Good Donor Area',
    desc: '50% cheaper hair transplants ($3,000 instead of $6,000).',
    cost: 150
  },
  {
    id: 'rich_uncle',
    name: 'Rich Uncle',
    desc: 'Start each life with $1,500 cash instead of $500.',
    cost: 200
  },
  {
    id: 'symmetrical_genes',
    name: 'Symmetrical Genes',
    desc: '60% chance to roll Symmetrical structure at birth.',
    cost: 250
  }
];

const THEME_OPTIONS = [
  { id: 'default', name: 'Default Obsidian', desc: 'Standard cyber dark mode.', cost: 0 },
  { id: 'stacy-magenta', name: 'Stacy Magenta', desc: 'Bubblegum pink glassmorphism style.', cost: 50 },
  { id: 'obsidian-incel', name: 'Obsidian Incel', desc: 'High-contrast retro green terminal.', cost: 80 },
  { id: 'beverly-hills', name: 'Beverly Hills Emerald', desc: 'Luxury gold & emerald green.', cost: 100 },
  { id: 'turkey-neon', name: 'Turkey Neon', desc: 'Cyberpunk orange & neon green.', cost: 120 }
];

function renderShop() {
  const container = document.getElementById('meta-upgrades-list');
  const tokensVal = document.getElementById('shop-tokens-val');
  
  if (!container || !tokensVal) return;
  
  tokensVal.textContent = copeTokens;
  container.innerHTML = '';
  
  // Highlight active tab
  document.querySelectorAll('.shop-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-shop-tab') === activeShopTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (activeShopTab === 'perks') {
    METAGAME_PERKS.forEach(perk => {
      const card = document.createElement('div');
      const isUnlocked = unlockedPerks[perk.id] === true;
      card.className = `shop-item-card ${isUnlocked ? 'unlocked' : ''}`;
      
      card.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-name">
            <span>${perk.name}</span>
            ${isUnlocked ? '<span class="neon-tag text-green" style="font-size: 8px; padding: 2px 4px;">ACTIVE</span>' : ''}
          </div>
          <div class="shop-item-desc">${perk.desc}</div>
        </div>
        <button class="shop-item-buy-btn ${isUnlocked ? 'purchased' : ''}" data-id="${perk.id}" ${isUnlocked ? '' : (copeTokens < perk.cost ? 'disabled' : '')}>
          ${isUnlocked ? 'UNLOCKED' : `${perk.cost} C`}
        </button>
      `;
      
      if (!isUnlocked && copeTokens >= perk.cost) {
        card.querySelector('.shop-item-buy-btn').addEventListener('click', () => {
          copeTokens -= perk.cost;
          unlockedPerks[perk.id] = true;
          _saveCopeTokens(copeTokens);
          localStorage.setItem('looksmax_unlocked_perks', JSON.stringify(unlockedPerks));
          
          playSound('success');
          logToConsole(`Purchased perk: ${perk.name}!`, 'success');
          renderShop();
          
          // Re-reset active game instance with new perks so immediate roll accounts for it
          game.reset(unlockedPerks);
          renderGenesisPreview(game);
        });
      }
      
      container.appendChild(card);
    });
  } 
  else if (activeShopTab === 'themes') {
    THEME_OPTIONS.forEach(theme => {
      const card = document.createElement('div');
      const isUnlocked = unlockedThemes[theme.id] === true;
      const isActive = activeTheme === theme.id;
      card.className = `shop-item-card ${isUnlocked ? 'unlocked' : ''} ${isActive ? 'active' : ''}`;
      
      card.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-name">
            <span>${theme.name}</span>
            ${isActive ? '<span class="neon-tag text-cyan" style="font-size: 8px; padding: 2px 4px;">EQUIPPED</span>' : ''}
          </div>
          <div class="shop-item-desc">${theme.desc}</div>
        </div>
        <button class="shop-item-buy-btn ${isActive ? 'purchased' : (isUnlocked ? 'equip-btn' : '')}" data-id="${theme.id}" ${(!isUnlocked && copeTokens < theme.cost) ? 'disabled' : ''}>
          ${isActive ? 'ACTIVE' : (isUnlocked ? 'EQUIP' : `${theme.cost} C`)}
        </button>
      `;
      
      const btn = card.querySelector('.shop-item-buy-btn');
      if (!isUnlocked && copeTokens >= theme.cost) {
        btn.addEventListener('click', () => {
          copeTokens -= theme.cost;
          unlockedThemes[theme.id] = true;
          _saveCopeTokens(copeTokens);
          localStorage.setItem('looksmax_unlocked_themes', JSON.stringify(unlockedThemes));
          
          playSound('success');
          logToConsole(`Unlocked theme: ${theme.name}!`, 'success');
          renderShop();
        });
      } else if (isUnlocked && !isActive) {
        btn.addEventListener('click', () => {
          activeTheme = theme.id;
          localStorage.setItem('looksmax_active_theme', activeTheme);
          document.body.setAttribute('data-theme', activeTheme);
          playSound('click');
          logToConsole(`Equipped theme: ${theme.name}.`, 'success');
          renderShop();
        });
      }
      
      container.appendChild(card);
    });
  } 
  else if (activeShopTab === 'memories') {
    const pastRuns = JSON.parse(localStorage.getItem('looksmax_past_runs') || '[]');
    if (pastRuns.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 11px; text-align: center; padding: 20px;">No genetic memories recorded yet. Ascend or rot to leave a legacy.</div>`;
      return;
    }
    
    pastRuns.forEach((run, index) => {
      const card = document.createElement('div');
      card.className = 'shop-item-card memory-item-card';
      card.style.display = 'flex';
      card.style.gap = '15px';
      card.style.alignItems = 'center';
      card.style.padding = '12px';
      card.style.background = 'var(--bg-tertiary)';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = 'var(--radius-md)';
      card.style.marginBottom = '10px';
      
      card.innerHTML = `
        <canvas class="memory-canvas-${index}" width="70" height="90" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: #000; flex-shrink: 0;"></canvas>
        <div style="flex: 1; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--accent-cyan); font-size: 12px;">${run.name} (${run.gender === 'female' ? 'F' : 'M'})</strong>
            <span style="font-size: 9px; color: var(--text-muted);">${run.date}</span>
          </div>
          <div style="font-size: 10px; color: var(--text-main); margin-top: 4px; line-height: 1.4;">
            PSL Rating: <strong class="text-cyan">${run.smv.toFixed(2)}</strong> // Status: <strong class="text-green">${run.socialTier}</strong><br>
            Wealth: <strong class="text-yellow">$${(run.cash || 0).toLocaleString()}</strong> // Age Reached: <strong>${run.age}</strong><br>
            <em style="color: var(--accent-magenta); font-size: 9px;">${run.reason || ''}</em>
          </div>
        </div>
      `;
      container.appendChild(card);
      
      // Draw the portrait on the memory canvas
      setTimeout(() => {
        const cvs = card.querySelector(`.memory-canvas-${index}`);
        if (cvs) {
          const stats = {
            gender: run.gender,
            height: run.avatarData ? run.avatarData.height : 68,
            jaw: run.avatarData ? run.avatarData.jaw : 'Average',
            tilt: run.avatarData ? run.avatarData.tilt : 'Neutral',
            hairline: run.avatarData ? run.avatarData.hairline : 2,
            skin: run.avatarData ? run.avatarData.skin : 50,
            frame: run.avatarData ? run.avatarData.frame : 50,
            style: run.avatarData ? run.avatarData.style : 30,
            symmetry: run.avatarData ? run.avatarData.symmetry : 'Average',
            confidence: 80,
            botchedJaw: run.avatarData ? run.avatarData.botchedJaw : false,
            botchedHair: run.avatarData ? run.avatarData.botchedHair : false,
            botchedCanthoplasty: run.avatarData ? run.avatarData.botchedCanthoplasty : false
          };
          drawAvatar(cvs, stats, 0);
        }
      }, 20);
    });
  }
}

let animationFrameId = null;
function startAnimationLoop() {
  if (animationFrameId) return;
  function tick(timestamp) {
    if (screenGenesis.classList.contains('active')) {
      // Background loop idle, draw dummy avatar occasionally if desired
    } else if (screenGameBoard.classList.contains('active')) {
      drawAvatar(mainCanvas, game, timestamp);
    } else if (screenGameOver.classList.contains('active')) {
      drawAvatar(finalCanvas, game, timestamp);
    }
    animationFrameId = requestAnimationFrame(tick);
  }
  animationFrameId = requestAnimationFrame(tick);
}

// --- Web Audio API (SFX only - BGM uses HTML5 Audio) ---
let audioCtx = null;
let soundEnabled = localStorage.getItem('looksmax_sound') !== 'off';

// BGM State
let bgmMode = 'genesis';
let bgmAudio = null;
let bgmModeTimer = null;

const BGM_FILES = {
  genesis: '/assets/audio/genesis.mp3',
  gameboard: '/assets/audio/gameboard.mp3',
  battle: '/assets/audio/battle.mp3',
  gameover: '/assets/audio/gameover.mp3'
};

function updateBgmMode() {
  if (screenGenesis && screenGenesis.classList.contains('active')) { return 'genesis'; }
  if (screenGameOver && screenGameOver.classList.contains('active')) { return 'gameover'; }
  const arena = document.querySelector('.battle-arena');
  return arena ? 'battle' : 'gameboard';
}

function switchBGM() {
  const newMode = updateBgmMode();
  if (bgmMode === newMode && bgmAudio) return;
  bgmMode = newMode;
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio = null;
  }
  if (!soundEnabled) return;
  const src = BGM_FILES[newMode];
  if (!src) return;
  bgmAudio = new Audio(src);
  bgmAudio.loop = true;
  bgmAudio.volume = parseFloat(localStorage.getItem('looksmax_bgm_vol') || '0.7');
  bgmAudio.play().catch(() => {});
}

function startBGM() {
  if (!soundEnabled) return;
  switchBGM();
}

function stopBGM() {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio = null;
  }
}

function initAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (Ctx) {
    audioCtx = new Ctx();
  }
  if (audioCtx && soundEnabled) startBGM();
}

function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (!audioCtx) return;

  const dest = audioCtx.destination;
  const now = audioCtx.currentTime;
  
  if (type === 'click') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } 
  else if (type === 'success') {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.1, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
    // Add a little sparkle
    const noise = audioCtx.createBufferSource();
    const nBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * (1 - i/nData.length);
    noise.buffer = nBuf;
    const nGain = audioCtx.createGain();
    nGain.gain.setValueAtTime(0.03, now + 0.24);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    noise.connect(nGain);
    nGain.connect(dest);
    noise.start(now + 0.24);
    noise.stop(now + 0.32);
  } 
  else if (type === 'error') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.25);
  } 
  else if (type === 'swipe') {
    for (let pass = 0; pass < 2; pass++) {
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.12, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const filt = audioCtx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(800 + pass * 600, now + pass * 0.03);
      filt.frequency.exponentialRampToValueAtTime(200 + pass * 300, now + 0.12 + pass * 0.03);
      filt.Q.setValueAtTime(5, now);
      const g = audioCtx.createGain();
      g.gain.setValueAtTime(0.06, now + pass * 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + pass * 0.03);
      src.connect(filt);
      filt.connect(g);
      g.connect(dest);
      src.start(now + pass * 0.03);
      src.stop(now + 0.12 + pass * 0.03);
    }
  }
  else if (type === 'hit') {
    // Punchier hit
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.15);
    
    // Add noise burst
    const nBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.06, audioCtx.sampleRate);
    const nD = nBuf.getChannelData(0);
    for (let i = 0; i < nD.length; i++) nD[i] = (Math.random() * 2 - 1) * (1 - i/nD.length);
    const nSrc = audioCtx.createBufferSource();
    nSrc.buffer = nBuf;
    const nG = audioCtx.createGain();
    nG.gain.setValueAtTime(0.12, now);
    nG.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    nSrc.connect(nG);
    nG.connect(dest);
    nSrc.start(now);
    nSrc.stop(now + 0.06);
  }
  else if (type === 'level-up') {
    [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      gain.gain.setValueAtTime(0.08, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.12);
    });
  }
  else if (type === 'achievement') {
    // Grand fanfare
    const fanfare = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.50];
    fanfare.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.07, now + i * 0.08);
      gain.gain.setValueAtTime(0.07, now + i * 0.08 + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
    // Cymbal crash
    const cBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const cD = cBuf.getChannelData(0);
    for (let i = 0; i < cD.length; i++) cD[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/cD.length, 2);
    const cSrc = audioCtx.createBufferSource();
    cSrc.buffer = cBuf;
    const cFilt = audioCtx.createBiquadFilter();
    cFilt.type = 'highpass';
    cFilt.frequency.setValueAtTime(3000, now);
    const cG = audioCtx.createGain();
    cG.gain.setValueAtTime(0.06, now);
    cG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    cSrc.connect(cFilt);
    cFilt.connect(cG);
    cG.connect(dest);
    cSrc.start(now);
    cSrc.stop(now + 0.3);
  }
}

// --- DOM References ---
const screenGenesis = document.getElementById('screen-genesis');
const screenGameBoard = document.getElementById('screen-gameboard');
const screenGameOver = document.getElementById('screen-gameover');

const genesisLoader = document.getElementById('genesis-loader');
const genesisStatsDisplay = document.getElementById('genesis-stats-display');
const btnRollGenetics = document.getElementById('btn-roll-genetics');
const btnStartLife = document.getElementById('btn-start-life');

const mainCanvas = document.getElementById('avatar-canvas');
const finalCanvas = document.getElementById('final-avatar-canvas');
const consoleContainer = document.getElementById('console-logs-container');

// HUD
const hudAge = document.getElementById('hud-age');
const hudCash = document.getElementById('hud-cash');
const hudSMV = document.getElementById('hud-smv');
const hudAP = document.getElementById('hud-ap');
const hudSocialTier = document.getElementById('hud-social-tier');
const hudAvatarClass = document.getElementById('hud-avatar-class');
const avatarTicker = document.getElementById('avatar-ticker');

// Biometrics
const statHeight = document.getElementById('stat-height');
const statJaw = document.getElementById('stat-jaw');
const statTilt = document.getElementById('stat-tilt');
const statSymmetry = document.getElementById('stat-symmetry');

// Soft Meters
const txtSkin = document.getElementById('txt-skin');
const barSkin = document.getElementById('bar-skin');
const txtHairline = document.getElementById('txt-hairline');
const lblHairline = document.getElementById('lbl-hairline');
const barHairline = document.getElementById('bar-hairline');
const txtFrame = document.getElementById('txt-frame');
const barFrame = document.getElementById('bar-frame');
const txtStyle = document.getElementById('txt-style');
const barStyle = document.getElementById('bar-style');
const txtConfidence = document.getElementById('txt-confidence');
const barConfidence = document.getElementById('bar-confidence');

// New stat references
const txtRizz = document.getElementById('txt-rizz');
const barRizz = document.getElementById('bar-rizz');
const txtCareer = document.getElementById('txt-career');
const txtTalentPoints = document.getElementById('txt-talent-points');

// Actions / Surgeries
const actWork = document.getElementById('act-work');
const actGym = document.getElementById('act-gym');
const actSkincare = document.getElementById('act-skincare');
const actStyling = document.getElementById('act-styling');
const actSurgery = document.getElementById('act-surgery');
const surgeryMenu = document.getElementById('surgery-menu');
const btnCloseSurgery = document.getElementById('btn-close-surgery');
const actPromotion = document.getElementById('act-promotion');
const actSubstances = document.getElementById('act-substances');
const actTalents = document.getElementById('act-talents');
const actProcreate = document.getElementById('act-procreate');
const actRehab = document.getElementById('act-rehab');
const actMirrorGame = document.getElementById('act-mirror-game');
const btnEndYear = document.getElementById('btn-end-year');

// Modals
const substanceModal = document.getElementById('substance-modal');
const talentModal = document.getElementById('talent-modal');
const mirrorModal = document.getElementById('minigame-mirror-modal');
const achievementToast = document.getElementById('achievement-toast');
const procreateModal = document.getElementById('procreate-modal');
const btnCloseProcreate = document.getElementById('btn-close-procreate');

// Modals
const eventModal = document.getElementById('event-modal');
const eventTitle = document.getElementById('event-modal-title');
const eventDesc = document.getElementById('event-modal-desc');
const eventImpact = document.getElementById('event-modal-impact');
const btnCloseEvent = document.getElementById('btn-close-event');

// TikTok Modals & Actions
const actTiktok = document.getElementById('act-tiktok');
const tiktokModal = document.getElementById('tiktok-modal');
const btnTiktokCancel = document.getElementById('btn-tiktok-cancel');
const btnTiktokClose = document.getElementById('btn-tiktok-close');
const tiktokChooseStage = document.getElementById('tiktok-choose-stage');
const tiktokResultStage = document.getElementById('tiktok-result-stage');
const tiktokCommentsContainer = document.getElementById('tiktok-comments-container');

// Navigation Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// --- Game Engine Variables ---
let game = new GameState();
let battle = null;
let dating = null;

// --- Initialize App ---
function init() {
  setupEventListeners();
  setupAudioControl();
  setupTutorial();
  renderShop();
  startAnimationLoop();
}

function setupTutorial() {
  if (localStorage.getItem('looksmax_tutorial_done')) return;
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  document.getElementById('btn-close-tutorial').addEventListener('click', () => {
    overlay.classList.add('hidden');
    localStorage.setItem('looksmax_tutorial_done', '1');
  });
}

function setupAudioControl() {
  const btn = document.getElementById('audio-toggle-btn');
  // Apply saved sound state to UI
  if (!soundEnabled) {
    btn.classList.add('disabled');
    btn.querySelector('span').textContent = 'SOUND OFF';
  }
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem('looksmax_sound', soundEnabled ? 'on' : 'off');
    if (soundEnabled) {
      btn.classList.remove('disabled');
      btn.querySelector('span').textContent = 'SOUND ON';
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      startBGM();
      playSound('click');
    } else {
      btn.classList.add('disabled');
      btn.querySelector('span').textContent = 'SOUND OFF';
      stopBGM();
    }
  });

  const volSlider = document.getElementById('bgm-volume-slider');
  if (volSlider) {
    const saved = localStorage.getItem('looksmax_bgm_vol');
    if (saved) volSlider.value = Math.round(parseFloat(saved) * 100);
    volSlider.addEventListener('input', () => {
      const vol = parseInt(volSlider.value) / 100;
      localStorage.setItem('looksmax_bgm_vol', vol.toString());
      if (bgmAudio) {
        bgmAudio.volume = vol;
      }
    });
  }
}

function logToConsole(message, type = 'system') {
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `[${type.toUpperCase()}] ${message}`;
  consoleContainer.appendChild(div);
  consoleContainer.scrollTop = consoleContainer.scrollHeight;
}

function setupEventListeners() {
  // Gender Choice
  const genderBtns = document.querySelectorAll('.gender-btn');
  genderBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      initAudio();
      playSound('click');
      genderBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenGender = btn.getAttribute('data-gender');
    });
  });

  // Difficulty Choice
  const difficultyBtns = document.querySelectorAll('.difficulty-btn');
  let chosenDifficulty = 'normal';
  difficultyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      difficultyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenDifficulty = btn.getAttribute('data-difficulty');
    });
  });

  // Challenge Mode Choice
  const challengeBtns = document.querySelectorAll('.challenge-btn');
  let chosenChallenge = 'none';
  challengeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      challengeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenChallenge = btn.getAttribute('data-challenge');
      const badge = document.getElementById('challenge-badge');
      if (chosenChallenge !== 'none') {
        const seed = CHALLENGE_SEEDS[chosenChallenge];
        badge.textContent = seed ? `${seed.icon} ${seed.name}: ${seed.desc}` : '';
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    });
  });

  // Genesis Screen Rolls
  btnRollGenetics.addEventListener('click', () => {
    initAudio();
    playSound('click');
    triggerRollAnimation();
  });

  btnStartLife.addEventListener('click', () => {
    playSound('level-up');
    _endYearLock = false;
    if (btnEndYear) btnEndYear.disabled = false;
    // Apply challenge if selected
    if (chosenChallenge !== 'none') game.applyChallenge(chosenChallenge);
    switchScreen('screen-gameboard');
    startGame();
  });

// Action Panel Toggles
let _firstTabClick = true;
tabBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (!_firstTabClick) playSound('click');
    _firstTabClick = false;
    const targetTab = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'tab-dating') {
        renderDatingTab();
      } else if (targetTab === 'tab-social') {
        renderSocialTab();
      }
    });
  });

  // Year Actions
  actWork.addEventListener('click', () => {
    const res = game.doWork();
    if (res) {
      playSound('click');
      logToConsole(res.message, res.type);
      updateDashboard();
    } else {
      playSound('error');
      logToConsole("Not enough Action Points (AP) left this year!", "error");
    }
  });

  actGym.addEventListener('click', () => {
    const res = game.doGym();
    if (res) {
      playSound('success');
      logToConsole(res.message, res.type);
      updateDashboard();
    } else {
      playSound('error');
      logToConsole("Insufficient AP (2 needed) or Cash ($100 needed)!", "error");
    }
  });

  actSkincare.addEventListener('click', () => {
    const res = game.doSkincare();
    if (res) {
      playSound('success');
      logToConsole(res.message, res.type);
      updateDashboard();
    } else {
      playSound('error');
      logToConsole("Insufficient AP (1 needed) or Cash ($50 needed)!", "error");
    }
  });

  actStyling.addEventListener('click', () => {
    const res = game.doStyling();
    if (res) {
      playSound('success');
      logToConsole(res.message, res.type);
      updateDashboard();
    } else {
      playSound('error');
      logToConsole("Insufficient AP (1 needed) or Cash ($150 needed)!", "error");
    }
  });

  actSurgery.addEventListener('click', () => {
    playSound('click');
    surgeryMenu.classList.remove('hidden');
    renderSurgeries();
  });

  btnCloseSurgery.addEventListener('click', () => {
    playSound('click');
    surgeryMenu.classList.add('hidden');
  });

  // NEW: Promotion
  actPromotion.addEventListener('click', () => {
    const res = game.seekPromotion();
    if (res.error) {
      playSound('error');
      logToConsole(res.error, 'error');
    } else {
      playSound('level-up');
      showCutscene('promotion');
      logToConsole(res.message, res.type);
      updateDashboard();
    }
  });

  // NEW: Substances
  actSubstances.addEventListener('click', () => {
    playSound('click');
    renderSubstances();
    substanceModal.classList.remove('hidden');
  });

  document.getElementById('btn-close-substance').addEventListener('click', () => {
    playSound('click');
    substanceModal.classList.add('hidden');
  });

  // NEW: Talent Tree
  actTalents.addEventListener('click', () => {
    playSound('click');
    renderTalents();
    talentModal.classList.remove('hidden');
  });

  document.getElementById('btn-close-talent').addEventListener('click', () => {
    playSound('click');
    talentModal.classList.add('hidden');
  });

  // NEW: Codex / Glossary
  document.getElementById('btn-codex').addEventListener('click', () => {
    playSound('click');
    renderCodex();
    document.getElementById('codex-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-codex').addEventListener('click', () => {
    playSound('click');
    document.getElementById('codex-modal').classList.add('hidden');
  });

  // NEW: Procreate
  actProcreate.addEventListener('click', () => {
    const res = game.procreate();
    if (res.error) {
      playSound('error');
      logToConsole(res.error, 'error');
    } else {
      playSound('success');
      logToConsole(res.message, res.type);
      const child = res.child;
      const ft = Math.floor(child.height / 12);
      const inc = child.height % 12;
      document.getElementById('procreate-desc').textContent = `You had a child: ${child.name}!`;
      document.getElementById('procreate-stats').innerHTML = `
        <strong style="color:var(--accent-cyan);">${child.name}</strong>
        <span style="font-size:9px;color:var(--text-muted);display:block;margin-bottom:6px;">
          ${child.gender === 'male' ? '♂' : '♀'} Born at ${ft}'${inc}" 
        </span>
        <div style="font-size:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px;">
          <span>Jaw: <strong>${child.jaw}</strong></span>
          <span>Tilt: <strong>${child.tilt}</strong></span>
          <span>Symmetry: <strong>${child.symmetry}</strong></span>
          <span>Skin: <strong>${child.skin}/100</strong></span>
          <span>Frame: <strong>${child.frame}/100</strong></span>
          <span>Rizz: <strong>${child.rizz}/100</strong></span>
          <span>Hairline: <strong>NW ${Math.min(7, Math.max(1, Math.round(child.hairline)))}</strong></span>
        </div>
      `;
      procreateModal.classList.remove('hidden');
      updateDashboard();
    }
  });

  btnCloseProcreate.addEventListener('click', () => {
    playSound('click');
    procreateModal.classList.add('hidden');
  });

  // NEW: Rehab
  actRehab.addEventListener('click', () => {
    const res = game.doRehab();
    if (res.error) {
      playSound('error');
      logToConsole(res.error, 'error');
    } else {
      playSound('success');
      logToConsole(res.message, 'action');
      updateDashboard();
    }
  });

  // NEW: Mirror Mini-game
  actMirrorGame.addEventListener('click', () => {
    playSound('click');
    mirrorModal.classList.remove('hidden');
    // Reset mirror game
    if (mirrorInterval) clearInterval(mirrorInterval);
    document.getElementById('btn-mirror-start').classList.remove('hidden');
    document.getElementById('btn-mirror-blink').classList.add('hidden');
    document.getElementById('mirror-status').textContent = 'Click START to begin';
    document.getElementById('mirror-timer').textContent = '0.0s';
    document.getElementById('mirror-result').classList.add('hidden');
  });

  // NEW: Save/Load (with anti-cheat checksum)
  document.getElementById('btn-save-game').addEventListener('click', () => {
    const slot = prompt('Save slot (1-3):', '1');
    if (!slot || slot < 1 || slot > 3) return;
    localStorage.setItem(`looksmax_save_${slot}`, JSON.stringify(game.serializeSigned()));
    logToConsole(`Game saved to slot ${slot}.`, 'success');
    playSound('click');
  });

  document.getElementById('btn-load-game').addEventListener('click', () => {
    const slot = prompt('Load slot (1-3):', '1');
    if (!slot || slot < 1 || slot > 3) return;
    const data = localStorage.getItem(`looksmax_save_${slot}`);
    if (!data) {
      logToConsole(`No save found in slot ${slot}.`, 'error');
      return;
    }
    if (!confirm('Loading will overwrite current game. Continue?')) return;
    const parsed = JSON.parse(data);
    const loaded = GameState.deserialize(parsed);
    if (!loaded) {
      logToConsole(`[ANTI-CHEAT] Save slot ${slot} was tampered with — load rejected.`, 'error');
      playSound('error');
      return;
    }
    game = loaded;
    updateDashboard();
    logToConsole(`Game loaded from slot ${slot}.`, 'success');
    playSound('click');
  });

  // TikTok Studio actions
  actTiktok.addEventListener('click', () => {
    openTiktokStudio();
  });

  btnTiktokCancel.addEventListener('click', () => {
    playSound('click');
    tiktokModal.classList.add('hidden');
  });

  btnTiktokClose.addEventListener('click', () => {
    playSound('click');
    tiktokModal.classList.add('hidden');
  });

  // Theme Shop Tabs Click
  document.querySelectorAll('.shop-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      activeShopTab = btn.getAttribute('data-shop-tab');
      renderShop();
    });
  });

  // NEW: Mirror Mini-game
  let mirrorStartTime = 0;
  let mirrorInterval = null;
  const mirrorTimerEl = document.getElementById('mirror-timer');
  const mirrorStatusEl = document.getElementById('mirror-status');
  const mirrorResultEl = document.getElementById('mirror-result');

  document.getElementById('btn-mirror-start').addEventListener('click', () => {
    playSound('click');
    mirrorStartTime = performance.now();
    document.getElementById('btn-mirror-start').classList.add('hidden');
    document.getElementById('btn-mirror-blink').classList.remove('hidden');
    mirrorStatusEl.textContent = 'STARING... Hold your blink!';
    mirrorTimerEl.textContent = '0.0s';
    mirrorResultEl.classList.add('hidden');
    if (mirrorInterval) clearInterval(mirrorInterval);
    mirrorInterval = setInterval(() => {
      const elapsed = (performance.now() - mirrorStartTime) / 1000;
      mirrorTimerEl.textContent = elapsed.toFixed(1) + 's';
      if (elapsed > 30) {
        clearInterval(mirrorInterval);
        endMirrorGame(true);
      }
    }, 100);
  });

  document.getElementById('btn-mirror-blink').addEventListener('click', () => {
    endMirrorGame(false);
  });

  function endMirrorGame(perfect) {
    if (mirrorInterval) clearInterval(mirrorInterval);
    const elapsed = (performance.now() - mirrorStartTime) / 1000;
    document.getElementById('btn-mirror-start').classList.remove('hidden');
    document.getElementById('btn-mirror-blink').classList.add('hidden');
    mirrorStatusEl.textContent = 'DONE!';

    let reward = '';
    if (perfect || elapsed >= 30) {
      reward = 'Perfect focus! +15 Confidence, +10 Rizz';
      game.confidence = Math.min(100, game.confidence + 15);
      game.rizz = Math.min(100, game.rizz + 10);
      playSound('success');
    } else if (elapsed >= 15) {
      reward = 'Great focus! +10 Confidence, +5 Rizz';
      game.confidence = Math.min(100, game.confidence + 10);
      game.rizz = Math.min(100, game.rizz + 5);
      playSound('success');
    } else if (elapsed >= 8) {
      reward = 'Decent! +5 Confidence';
      game.confidence = Math.min(100, game.confidence + 5);
      playSound('click');
    } else {
      reward = 'Weak focus. +2 Confidence';
      game.confidence = Math.min(100, game.confidence + 2);
      playSound('error');
    }

    document.getElementById('mirror-final-time').textContent = elapsed.toFixed(1) + 's';
    document.getElementById('mirror-reward-text').textContent = reward;
    mirrorResultEl.classList.remove('hidden');
    updateDashboard();
  }

  document.getElementById('btn-close-mirror').addEventListener('click', () => {
    playSound('click');
    mirrorModal.classList.add('hidden');
  });

  // TikTok post option buttons
  document.querySelectorAll('.tiktok-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.getAttribute('data-style');
      handleTikTokPost(style);
    });
  });

  function openTiktokStudio() {
    playSound('click');
    tiktokChooseStage.classList.remove('hidden');
    tiktokResultStage.classList.add('hidden');
    tiktokModal.classList.remove('hidden');

    const btnJaw = document.getElementById('btn-tiktok-jaw');
    const btnSkin = document.getElementById('btn-tiktok-skin');
    const btnHeight = document.getElementById('btn-tiktok-height');

    const hasGoodJaw = game.jaw === 'Chiseled' || game.jaw === 'Sharp';
    btnJaw.disabled = !hasGoodJaw;
    
    btnSkin.disabled = game.skin < 60;
    
    const isFemale = game.gender === 'female';
    const isTall = isFemale ? game.height >= 69 : game.height >= 72;
    btnHeight.disabled = !isTall;
  }

  function handleTikTokPost(styleId) {
    const result = game.postTikTok(styleId);
    if (result.error) {
      playSound('error');
      logToConsole(result.error, 'error');
      tiktokModal.classList.add('hidden');
      return;
    }

    playSound('success');
    showCutscene('viral');

    // Switch to result stage
    tiktokChooseStage.classList.add('hidden');
    tiktokResultStage.classList.remove('hidden');

    // Populate results
    document.getElementById('tiktok-res-views').textContent = result.views.toLocaleString();
    document.getElementById('tiktok-res-likes').textContent = result.likes.toLocaleString();
    document.getElementById('tiktok-res-followers').textContent = `+${result.newFollowers.toLocaleString()}`;

    const impactDiv = document.getElementById('tiktok-res-impact');
    let impactHtml = `Earned $${result.cashEarned.toLocaleString()} // Total Followers: ${result.totalFollowers.toLocaleString()}`;
    if (result.confidenceEffect > 0) {
      impactHtml += `<br><span style="color: var(--accent-green);">+${result.confidenceEffect}% Confidence</span>`;
    } else if (result.confidenceEffect < 0) {
      impactHtml += `<br><span style="color: var(--accent-pink);">${result.confidenceEffect}% Confidence (Roasted!)</span>`;
    }
    impactDiv.innerHTML = impactHtml;

    // Comments feed animation
    tiktokCommentsContainer.innerHTML = '';
    const commentUsers = ["lookmaxxer_x", "skincare_fanatic", "psl_god_99", "cope_dealer", "femcel_girl", "stacy_slayer", "chad_inspector"];
    
    let delay = 300;
    result.comments.forEach((commentText) => {
      setTimeout(() => {
        if (tiktokModal.classList.contains('hidden') || tiktokResultStage.classList.contains('hidden')) return;
        const user = commentUsers[Math.floor(Math.random() * commentUsers.length)];
        const row = document.createElement('div');
        row.className = 'tiktok-comment-row';
        row.innerHTML = `<span class="tiktok-comment-user">@${user}:</span><span class="tiktok-comment-text">${commentText}</span>`;
        tiktokCommentsContainer.appendChild(row);
        tiktokCommentsContainer.scrollTop = tiktokCommentsContainer.scrollHeight;
        playSound('click'); // micro audio feedback
      }, delay);
      delay += 800; // stagger comments scrolling in
    });

    updateDashboard();
  }

  btnEndYear.addEventListener('click', () => {
    if (_endYearLock) return;
    if (!confirm('Advance to the next year? Unused AP will be lost.')) return;
    _endYearLock = true;
    btnEndYear.disabled = true;
    endYear();
  });

  btnCloseEvent.addEventListener('click', () => {
    playSound('click');
    eventModal.classList.add('hidden');
    _endYearLock = false;
    if (btnEndYear) btnEndYear.disabled = false;
    checkGameOver();
  });

  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    playSound('click');
    consoleContainer.innerHTML = '';
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    playSound('click');
    _endYearLock = false;
    if (btnEndYear) btnEndYear.disabled = false;
    renderShop();
    switchScreen('screen-genesis');
  });

  document.getElementById('btn-continue-lineage').addEventListener('click', () => {
    playSound('success');
    const heir = game.createChildRun();
    if (!heir) return;
    // Switch to heir as the new player
    game = heir;
    dating = new DatingSimulator(game, logToConsole);
    battle = new BattleSystem(game, logToConsole);
    game.recordStatTimeline();
    const achs = game.checkAchievements();
    achs.forEach(ach => showAchievementToast(ach));
    switchScreen('screen-gameboard');
    tabBtns[0].click();
    updateDashboard();
    logToConsole(`Lineage continues with ${game.name}! Inherited stats from parent.`, 'success');
  });
}

function switchScreen(screenId) {
  const screens = document.querySelectorAll('.game-screen');
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  switchBGM();
}

// --- Screen 1: Genetic Roll Animation ---
function triggerRollAnimation() {
  btnRollGenetics.disabled = true;
  genesisLoader.classList.remove('hidden');
  genesisStatsDisplay.classList.add('hidden');
  
  let activeGender = chosenGender;
  if (activeGender === 'random') {
    activeGender = Math.random() < 0.5 ? 'female' : 'male';
  }

  let rollTicks = 0;
  const rollInterval = setInterval(() => {
    playSound('click');
    rollTicks++;
    if (rollTicks >= 12) {
      clearInterval(rollInterval);
      
      // Roll player's actual genetics
      const difficultyBtn = document.querySelector('.difficulty-btn.active');
      const chosenDifficulty = difficultyBtn ? difficultyBtn.getAttribute('data-difficulty') : 'normal';
      game.reset(unlockedPerks, activeGender, chosenDifficulty);
      renderGenesisPreview(game);
      
      genesisLoader.classList.add('hidden');
      genesisStatsDisplay.classList.remove('hidden');
      btnRollGenetics.disabled = false;
      btnRollGenetics.classList.add('hidden');
      btnStartLife.classList.remove('hidden');
      
      logToConsole(`DNA Sequenced successfully: ${game.name} born (${game.gender.toUpperCase()}). Base SMV: ${game.smv}`, 'success');
    }
  }, 120);
}

function renderGenesisPreview(player) {
  const ft = Math.floor(player.height / 12);
  const inVal = player.height % 12;
  
  genesisStatsDisplay.innerHTML = `
    <div class="smv-banner">
      <span class="clinical-font text-muted">GENETIC SMV RATING</span>
      <h2 class="text-cyan">${player.smv} / 10</h2>
      <span class="neon-tag text-cyan">${player.socialTier}</span>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>Height:</span>
      <strong>${ft}'${inVal}" (${Math.round(player.height * 2.54)} cm)</strong>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>Jaw Definition:</span>
      <strong>${player.jaw}</strong>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>Canthal Tilt:</span>
      <strong>${player.tilt}</strong>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>${player.gender === 'female' ? 'Hair Volume:' : 'Hairline:'}</span>
      <strong>${player.gender === 'female' ? 'Ludwig' : 'Norwood'} Scale ${player.gender === 'female' ? (player.hairline <= 2 ? 1 : player.hairline <= 5 ? 2 : 3) : player.hairline}</strong>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>Skin Quality:</span>
      <strong>${player.skin} / 100</strong>
    </div>
    <div class="stat-row-detail clinical-font">
      <span>Shoulder Frame:</span>
      <strong>${player.frame} / 100</strong>
    </div>
  `;
}

// --- Screen 2: Game Board Initialization & Update ---
function startGame() {
  logToConsole(`Starting Run for ${game.name}. Navigate yearly tasks from ages 18 to 50.`, 'system');
  dating = new DatingSimulator(game, logToConsole);
  battle = new BattleSystem(game, logToConsole);

  // Record initial stat timeline
  game.recordStatTimeline();

  // Check starting achievements
  const newAchs = game.checkAchievements();
  newAchs.forEach(ach => showAchievementToast(ach));

  // Default to year actions
  tabBtns[0].click();

  updateDashboard();
}

function updateDashboard() {
  if (game.isDead) return;

  // Text values
  hudAge.textContent = game.age;
  hudCash.textContent = `$${game.cash.toLocaleString()}`;
  hudSMV.textContent = `${game.smv.toFixed(1)} / 8`;
  if (document.getElementById('hud-followers')) {
    document.getElementById('hud-followers').textContent = game.followers.toLocaleString();
  }
  hudAP.textContent = game.ap;
  hudSocialTier.textContent = game.socialTier;
  const hudDifficulty = document.getElementById('hud-difficulty');
  if (hudDifficulty) {
    const challengePart = game.challengeId && CHALLENGE_SEEDS[game.challengeId] ? ` ${CHALLENGE_SEEDS[game.challengeId].icon}` : '';
    hudDifficulty.textContent = game.difficulty.toUpperCase() + challengePart;
    hudDifficulty.style.color = game.difficulty === 'hard' ? 'var(--accent-pink)' : 'var(--accent-yellow)';
  }
  
  // Format avatar subtitle class tag
  const ft = Math.floor(game.height / 12);
  const inVal = game.height % 12;
  hudAvatarClass.textContent = `${ft}'${inVal}" // ${game.jaw.toUpperCase()} JAW`;

  // Update Biometrics details
  statHeight.textContent = `${ft}'${inVal}" (${Math.round(game.height * 2.54)} cm)`;
  statJaw.textContent = game.jaw;
  statTilt.textContent = game.tilt;
  statSymmetry.textContent = game.symmetry;

  // Update Soft Meters
  // Skin
  const skinPct = game.skin;
  barSkin.style.width = `${skinPct}%`;
  txtSkin.textContent = skinPct < 30 ? 'Cystic Acne' : skinPct < 60 ? 'Blotchy' : skinPct < 90 ? 'Clear' : 'Glowing';
  
  // Hairline Norwood / Ludwig
  // Bar represents full head = Norwood 1 (100%), Norwood 7 = bald (10%)
  const hairPct = Math.max(10, Math.round(((8 - game.hairline) / 7) * 100));
  barHairline.style.width = `${hairPct}%`;
  if (game.gender === 'female') {
    lblHairline.textContent = "Hair Volume (Ludwig):";
    txtHairline.textContent = `Ludwig ${game.hairline <= 2 ? 1 : game.hairline <= 5 ? 2 : 3}`;
  } else {
    lblHairline.textContent = "Hairline (Norwood):";
    txtHairline.textContent = `NW ${game.hairline}`;
  }

  // Frame
  const framePct = game.frame;
  barFrame.style.width = `${framePct}%`;
  txtFrame.textContent = framePct < 30 ? 'Narrow' : framePct < 65 ? 'Average' : framePct < 85 ? 'Athletic' : 'Broad/Giga';

  // Style
  const stylePct = game.style;
  barStyle.style.width = `${stylePct}%`;
  txtStyle.textContent = stylePct < 30 ? 'Homeless' : stylePct < 60 ? 'Basic' : stylePct < 80 ? 'Trendy' : 'Dapper';

  // Confidence
  const confPct = game.confidence;
  barConfidence.style.width = `${confPct}%`;
  txtConfidence.textContent = `${confPct}%`;

  // Rizz
  const rizzPct = game.rizz;
  barRizz.style.width = `${rizzPct}%`;
  txtRizz.textContent = `${rizzPct}/100`;

  // Career
  const careerTier = CAREER_TIERS.find(t => t.id === game.careerTier);
  txtCareer.textContent = careerTier ? careerTier.title : 'Unknown';
  txtTalentPoints.textContent = game.talentPoints;

  // Addiction display
  const addictionRow = document.getElementById('hud-addiction-row');
  const txtAddiction = document.getElementById('txt-addiction');
  const barAddiction = document.getElementById('bar-addiction');
  if (game.addictionLevel > 0) {
    addictionRow.style.display = 'block';
    txtAddiction.textContent = `${game.addictionLevel}/10`;
    barAddiction.style.width = `${(game.addictionLevel / 10) * 100}%`;
  } else {
    addictionRow.style.display = 'none';
  }

  // Rehab button visibility
  if (actRehab) {
    actRehab.style.display = game.addictionLevel > 0 ? '' : 'none';
  }

  // Enable/Disable Action buttons based on resources
  const careerInfo = CAREER_TIERS.find(t => t.id === game.careerTier);
  actWork.disabled = (careerInfo && careerInfo.apCost > 0) ? game.ap < careerInfo.apCost : game.ap < 1;
  actGym.disabled = game.ap < 2 || game.cash < 100;
  actSkincare.disabled = game.ap < 1 || game.cash < 50;
  actStyling.disabled = game.ap < 1 || game.cash < 150;
  if (actTiktok) {
    actTiktok.disabled = game.ap < 2 || game.cash < 100;
  }
  actPromotion.disabled = game.ap < 2 || game.careerTier === 'ceo';
  actSubstances.disabled = game.cash < 50;
  actTalents.disabled = game.talentPoints < 1;
  actProcreate.disabled = !game.hasDatingPartner || game.hasProcreated || game.cash < 2000 || game.age < 20;
  actMirrorGame.disabled = false; // always available

  // Avatar Canvas Ticker
  avatarTicker.textContent = `STATUS: ONLINE // PSL: ${game.smv.toFixed(1)} // RIZZ: ${game.rizz} // PARTNER: ${game.hasDatingPartner ? game.partnerName : 'SINGLE'}`;

  // Redraw Canvas Avatar (handled by continuous requestAnimationFrame loop)
}

// --- Year Progression & Events ---
function endYear() {
  playSound('level-up');
  const result = game.advanceYear();

  updateDashboard();

  // Check for depression death
  if (result.depression) {
    logToConsole('DEPRESSION: Years of crushing loneliness took their toll.', 'error');
    triggerGameOver("Succumbed to years of crushing depression after living at rock-bottom.");
    _endYearLock = false;
    if (btnEndYear) btnEndYear.disabled = false;
    return;
  }

  // Check achievements
  const newAchs = game.checkAchievements();
  newAchs.forEach(ach => showAchievementToast(ach));

  // Show seasonal event as a modal (before random event)
  if (result.seasonal) {
    const seas = result.seasonal;
    eventTitle.textContent = seas.icon + ' ' + seas.name;
    eventDesc.textContent = seas.desc;
    eventImpact.textContent = `EFFECTS: Seasonal event applied.`;
    eventModal.classList.remove('hidden');
    logToConsole(`Seasonal Event: ${seas.icon} ${seas.name} - ${seas.desc}`, 'event');
    return; // wait for modal close before showing next event
  }

  // Show midlife crisis event
  if (result.midlifeEvent) {
    const me = result.midlifeEvent;
    eventTitle.textContent = me.icon + ' ' + me.title;
    eventDesc.textContent = me.desc;
    eventImpact.textContent = `EFFECTS: ${me.impactText}`;
    eventModal.classList.remove('hidden');
    logToConsole(`Midlife Crisis: ${me.title}`, 'event');
    return; // wait for modal close before random event
  }

  // Show rival result
  if (result.rivalResult) {
    const r = result.rivalResult;
    const won = r.playerWon;
    eventTitle.textContent = `${won ? '✅' : '❌'} RIVAL CHECK-IN: ${r.milestone.title}`;
    eventDesc.innerHTML = `Your rival <strong>${r.rivalName}</strong> at age ${r.milestone.age}.
      <br/><br/>Their SMV: <strong>${r.rivalSMV}</strong> | Your SMV: <strong>${game.smv}</strong>
      <br/>${won ? 'You crushed them. Confidence boosted!' : 'They\'re pulling ahead. Stay focused.'}`;
    eventImpact.textContent = won ? 'EFFECTS: +20% Confidence, Rival milestone passed!' : 'EFFECTS: -15% Confidence';
    eventModal.classList.remove('hidden');
    logToConsole(`Rival Check: ${r.rivalName} (SMV ${r.rivalSMV}) — ${won ? 'WON' : 'LOST'}`, won ? 'success' : 'error');
    return;
  }

  // Show random event
  if (result.event) {
    const event = result.event;
    eventTitle.textContent = event.icon + ' ' + event.title;
    eventDesc.textContent = event.desc;
    eventImpact.textContent = `EFFECTS: ${event.impactText}`;
    eventModal.classList.remove('hidden');
    logToConsole(`Advanced to Age ${game.age}. Random Event triggered: ${event.title}`, 'event');
    return;
  }

  // If no events at all (shouldn't happen), release lock
  _endYearLock = false;
  if (btnEndYear) btnEndYear.disabled = false;
}

function checkGameOver() {
  if (game.isDead) {
    playSound('error');
    // Determine death reason from context
    const lastLog = game.log.length > 0 ? game.log[game.log.length - 1] : '';
    if (lastLog.includes('depression') || lastLog.includes('Depression')) {
      triggerGameOver("Succumbed to years of crushing depression.");
    } else if (lastLog.includes('FATAL')) {
      // Extract death reason from the last Fatal log entry
      const fatalMatch = lastLog.match(/FATAL[^:]*:\s*(.+?)(?:\.|$)/);
      triggerGameOver(fatalMatch ? fatalMatch[1] : "Fatal incident.");
    } else if (game.surgeryBotchedCount > 0) {
      triggerGameOver("Fatality due to surgical error.");
    } else {
      triggerGameOver("Your journey was cut short.");
    }
  } else if (game.age >= 50) {
    if (game.challengeId) game.completedChallenge = true;
    playSound('success');
    triggerGameOver("Life journey completed at Age 50.");
  }
}

function triggerGameOver(reasonText) {
  // Check achievements before game over screen
  const achs = game.checkAchievements();
  achs.forEach(ach => showAchievementToast(ach));
  if (game.isDead) showCutscene('death');
  switchScreen('screen-gameover');
  document.getElementById('txt-death-reason').textContent = reasonText;
  document.getElementById('final-age-display').textContent = game.age;

  // Determine ending title
  const endTitleEl = document.getElementById('txt-end-title');
  const endCareer = CAREER_TIERS.find(t => t.id === game.careerTier);
  let ending = '';
  if (game.isDead && game.surgeryBotchedCount > 0) {
    ending = 'THE BUTCHER\'S BILL \u2014 Death by surgeon\'s mistake';
  } else if (game.isDead) {
    ending = 'GONE BEFORE GLORY \u2014 You left unfinished business';
  } else if (endCareer && endCareer.id === 'ceo') {
    ending = 'THE ASCENDED \u2014 CEO, total genetic victory';
  } else if (game.smv >= 7.0) {
    ending = 'LOOKSMAXED \u2014 You reached the pinnacle of genetic potential';
  } else if (endCareer && endCareer.pay >= 3000) {
    ending = 'HIGH VALUE \u2014 Comfortable life with a strong career';
  } else if (game.hasDatingPartner) {
    ending = 'SETTLED DOWN \u2014 Love conquered where looks couldn\'t';
  } else if (game.smv >= 5.0) {
    ending = 'DECENT RUN \u2014 Above average, room for improvement next life';
  } else {
    ending = 'COPER\'S END \u2014 The journey continues in the next life';
  }
  endTitleEl.textContent = ending;

  // Calculate Cope Tokens earned: base SMV + achievements + botched surgeries
  const tokensEarned = Math.round(game.smv * 15 + game.surgeryBotchedCount * 10 + game.achievementsUnlocked.length * 5);
  copeTokens += tokensEarned;
  _saveCopeTokens(copeTokens);

  // Save run to Memories gallery
  const pastRuns = JSON.parse(localStorage.getItem('looksmax_past_runs') || '[]');
  const runInfo = {
    name: game.name,
    age: game.age,
    gender: game.gender,
    smv: game.smv,
    cash: game.cash,
    career: game.careerTier,
    rizz: game.rizz,
    socialTier: game.socialTier,
    hasDatingPartner: game.hasDatingPartner,
    partnerName: game.partnerName,
    surgeryBotchedCount: game.surgeryBotchedCount,
    opponentsDefeated: game.opponentsDefeated.length,
    achievementsUnlocked: game.achievementsUnlocked.length,
    substancesUsed: game.substancesUsed,
    reason: reasonText,
    date: new Date().toLocaleDateString(),
    avatarData: {
      gender: game.gender, height: game.height, jaw: game.jaw,
      tilt: game.tilt, hairline: game.hairline, skin: game.skin,
      frame: game.frame, style: game.style, symmetry: game.symmetry,
      botchedJaw: game.botchedJaw, botchedHair: game.botchedHair,
      botchedCanthoplasty: game.botchedCanthoplasty
    }
  };
  pastRuns.unshift(runInfo);
  if (pastRuns.length > 10) pastRuns.pop();
  localStorage.setItem('looksmax_past_runs', JSON.stringify(pastRuns));

  // Update leaderboard
  updateLeaderboard(runInfo);

  // Show/hide lineage continuation button
  const continueBtn = document.getElementById('btn-continue-lineage');
  if (continueBtn) {
    continueBtn.style.display = (game.children && game.children.length > 0) ? '' : 'none';
  }

  // Re-render shop
  renderShop();

  // Compile final biometrics list
  const ft = Math.floor(game.height / 12);
  const inVal = game.height % 12;
  const careerObj = CAREER_TIERS.find(t => t.id === game.careerTier);
  const finalStatsList = document.getElementById('final-stats-list');
  finalStatsList.innerHTML = `
    <div class="stat-row-detail">
      <span>Final Rating:</span>
      <strong class="text-cyan">${game.smv.toFixed(1)} / 8</strong>
    </div>
    <div class="stat-row-detail">
      <span>Social Status:</span>
      <strong class="text-green">${game.socialTier}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Height:</span>
      <strong>${ft}'${inVal}" (${Math.round(game.height * 2.54)} cm)</strong>
    </div>
    <div class="stat-row-detail">
      <span>Jaw Definition:</span>
      <strong>${game.jaw}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Hairline:</span>
      <strong>${game.gender === 'female' ? 'Ludwig' : 'Norwood'} ${game.hairline}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Rizz (Charisma):</span>
      <strong class="text-yellow">${game.rizz}/100</strong>
    </div>
    <div class="stat-row-detail">
      <span>Career:</span>
      <strong class="text-cyan">${careerObj ? careerObj.title : 'Unknown'}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Dating Status:</span>
      <strong>${game.hasDatingPartner ? `Dating ${game.partnerName}` : 'Incel Single'}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Wallet Wealth:</span>
      <strong class="text-yellow">$${game.cash.toLocaleString()}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Surgeries Botched:</span>
      <strong class="${game.surgeryBotchedCount > 0 ? 'text-pink' : ''}">${game.surgeryBotchedCount}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Substances Used:</span>
      <strong>${game.substancesUsed}</strong>
    </div>
    <div class="stat-row-detail highlight-row" style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 5px;">
      <span>Cope Tokens Earned:</span>
      <strong class="text-yellow">+${tokensEarned} Tokens</strong>
    </div>
  `;

  // Render analytics
  renderAnalytics();

  // Render leaderboard
  renderLeaderboardList();

  // Render lineage
  renderLineage();

  // Render achievements
  renderAchievementsFinal();

  // Render mock forum comments
  const forumContainer = document.getElementById('forum-posts-container');
  const forumThreadName = document.getElementById('forum-thread-name');
  const forumThreadAuthor = document.getElementById('forum-thread-author');
  
  const thread = generateForumThread(game);
  forumThreadName.textContent = `Thread: "${thread.title}"`;
  forumThreadAuthor.textContent = thread.author;

  forumContainer.innerHTML = '';
  thread.posts.forEach(post => {
    const row = document.createElement('div');
    row.className = 'forum-post-row';
    row.innerHTML = `
      <aside class="forum-user-aside">
        <span class="forum-username">${post.username}</span>
        <span class="forum-user-rank">${post.rank}</span>
        <span class="forum-user-avatar">${post.avatar}</span>
        <div class="forum-user-stats">
          Joined: ${post.userStats.joined}<br/>
          Posts: ${post.userStats.posts}<br/>
          Rep: ${post.userStats.rep}
        </div>
      </aside>
      <div class="forum-post-body">
        <p class="forum-post-text">${post.content}</p>
        <span class="forum-post-footer">Posted ${post.date}</span>
      </div>
    `;
    forumContainer.appendChild(row);
  });

  // Set up interactive reply section
  const replyArea = document.getElementById('forum-reply-area');
  const choicesContainer = document.getElementById('forum-reply-choices-container');
  
  if (game.isDead) {
    // Dead players cannot post replies
    replyArea.style.display = 'none';
  } else {
    replyArea.style.display = 'flex';
    choicesContainer.innerHTML = '';
    
    const choices = getCopingReplies(game);
    choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'forum-reply-btn';
      btn.textContent = c.text;
      btn.addEventListener('click', () => {
        // Disable all choices
        const allBtns = choicesContainer.querySelectorAll('.forum-reply-btn');
        allBtns.forEach(b => b.disabled = true);
        
        // Append user's reply
        playSound('click');
        const userPost = document.createElement('div');
        userPost.className = 'forum-post-row user-response-post';
        userPost.innerHTML = `
          <aside class="forum-user-aside" style="border-right: 1.5px solid var(--accent-cyan);">
            <span class="forum-username" style="color: var(--accent-cyan); font-weight: bold;">${game.name.replace(/\s+/g, '')}99</span>
            <span class="forum-user-rank">Thread Starter</span>
            <span class="forum-user-avatar">👤</span>
            <div class="forum-user-stats">
              Joined: 2023<br/>
              Posts: 1,421<br/>
              Rep: ${game.smv >= 8.5 ? '+890' : '-120'}
            </div>
          </aside>
          <div class="forum-post-body">
            <p class="forum-post-text" style="color: var(--accent-cyan); font-style: italic;">"${c.text}"</p>
            <span class="forum-post-footer">Posted Just now</span>
          </div>
        `;
        forumContainer.appendChild(userPost);
        forumContainer.scrollTop = forumContainer.scrollHeight;
        
        // Trigger live roast reply after 800ms
        setTimeout(() => {
          const botReply = generateForumResponse(c.id, game);
          const replyEl = document.createElement('div');
          replyEl.className = 'forum-post-row';
          replyEl.innerHTML = `
            <aside class="forum-user-aside">
              <span class="forum-username">${botReply.username}</span>
              <span class="forum-user-rank">${botReply.rank}</span>
              <span class="forum-user-avatar">${botReply.avatar}</span>
              <div class="forum-user-stats">
                Joined: ${botReply.userStats.joined}<br/>
                Posts: ${botReply.userStats.posts}<br/>
                Rep: ${botReply.userStats.rep}
              </div>
            </aside>
            <div class="forum-post-body">
              <p class="forum-post-text">${botReply.content}</p>
              <span class="forum-post-footer">Posted ${botReply.date}</span>
            </div>
          `;
          forumContainer.appendChild(replyEl);
          forumContainer.scrollTop = forumContainer.scrollHeight;
          playSound('error'); // raw buzz roast feedback
        }, 800);
      });
      choicesContainer.appendChild(btn);
    });
  }
}

// --- Render Surgeries Modal ---
function renderSurgeries() {
  const container = document.querySelector('.surgery-list');
  container.innerHTML = '';
  
  const surgeries = game.getSurgeriesList();
  
  surgeries.forEach(s => {
    const card = document.createElement('div');
    card.className = 'surgery-item';
    
    // Clinic prices
    const costTurkey = Math.round(s.cost * 0.5);
    const costLocal = s.cost;
    const costBeverly = s.cost * 2;
    
    card.innerHTML = `
      <div class="surgery-item-row">
        <span class="surgery-item-name text-cyan">${s.name}</span>
        <span class="surgery-item-cost">Base: $${s.cost.toLocaleString()}</span>
      </div>
      <p class="surgery-item-desc">${s.desc}</p>
      <div class="surgery-item-row" style="margin-top: 5px;">
        <span class="text-green clinical-font" style="font-size: 10px;">${s.effect}</span>
      </div>
      
      <div class="surgery-item-meta">
        <div>
          <span>Turkey Clinic: <strong>$${costTurkey.toLocaleString()}</strong> (Risk: ${Math.round(s.risk * 2.5 * 100)}%)</span>
          <button class="surgery-buy-btn" data-id="${s.id}" data-clinic="turkey" ${game.cash < costTurkey ? 'disabled' : ''}>BUY</button>
        </div>
      </div>
      <div class="surgery-item-meta">
        <div>
          <span>Local Standard: <strong>$${costLocal.toLocaleString()}</strong> (Risk: ${Math.round(s.risk * 100)}%)</span>
          <button class="surgery-buy-btn" data-id="${s.id}" data-clinic="local" ${game.cash < costLocal ? 'disabled' : ''}>BUY</button>
        </div>
      </div>
      <div class="surgery-item-meta">
        <div>
          <span>Beverly Hills: <strong>$${costBeverly.toLocaleString()}</strong> (Risk: ${Math.round(s.risk * 0.15 * 100)}%)</span>
          <button class="surgery-buy-btn" data-id="${s.id}" data-clinic="beverly" ${game.cash < costBeverly ? 'disabled' : ''}>BUY</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach buttons events
  container.querySelectorAll('.surgery-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const clinic = btn.getAttribute('data-clinic');
      
      surgeryMenu.classList.add('hidden');
      showCutscene('surgery');
      const res = game.performSurgery(id, clinic);
      
      if (res.success) {
        playSound('success');
        logToConsole(res.message, 'success');
      } else {
        playSound('error');
        logToConsole(res.message, 'error');
      }
      
      updateDashboard();
      checkGameOver();
    });
  });
}

// --- Render Swipe-Maxxer (Dating Tab) ---
function renderDatingTab() {
  const container = document.getElementById('dating-app-view');
  container.innerHTML = '';

  // If locked (requires SMV >= 4.0)
  if (game.smv < 4.0) {
    container.innerHTML = `
      <div class="dating-locked">
        <span class="dating-lock-icon">🔒</span>
        <h4 class="text-pink">APP LOCKED // INSUFFICIENT STATS</h4>
        <p class="desc" style="font-size: 11px; color: var(--text-muted);">
          Your SMV rating is ${game.smv}/10. Dating apps filter you out automatically. Maximize skincare, frame, or seek surgery to break the filter.
        </p>
      </div>
    `;
    return;
  }

  // Create Phone Frame
  const phoneFrame = document.createElement('div');
  phoneFrame.className = 'dating-phone-frame';
  
  let screenContent = '';
  
  if (dating.activeChat) {
    // RENDER CHAT SCREEN
    const chat = dating.activeChat;
    const historyHtml = chat.chatLog.map(c => `
      <div class="chat-bubble ${c.sender}">${c.text}</div>
    `).join('');

    let inputHtml = '';
    if (!chat.resolved) {
      inputHtml = chat.profile.dialogues.options.map((opt, idx) => `
        <button class="chat-choice-btn" data-idx="${idx}">${opt.text}</button>
      `).join('');
    } else {
      inputHtml = `<button class="chat-choice-btn close-chat-btn" style="flex:1;">Return to Swiping</button>`;
    }

    screenContent = `
      <div class="dating-chat-screen">
        <div class="chat-partner-bar">
          <div class="chat-partner-avatar" style="background: ${chat.profile.avatarColor};"></div>
          <span class="chat-partner-name">${chat.profile.name} (${chat.profile.age})</span>
        </div>
        <div class="chat-history" id="chat-scroller">
          ${historyHtml}
        </div>
        <div class="chat-input-bar">
          ${inputHtml}
        </div>
      </div>
    `;
  } else {
    // RENDER SWIPER SCREEN
    const prof = dating.currentProfile;
    const matchPct = dating.calculateMatchPercent(prof);
    
    screenContent = `
      <div class="phone-screen">
        <div class="phone-header">
          <span class="phone-logo text-pink">🔥 swipeMax</span>
          <span class="phone-battery">99%</span>
        </div>
        <div class="phone-body">
          <div class="dating-profile-card" id="dating-swipe-card">
            <div class="dating-avatar-box">
              <!-- Render stylized face silhouette of profile -->
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="40" r="28" fill="${prof.avatarColor}" opacity="0.8"/>
                <path d="M20 90 Q50 65 80 90 Z" fill="${prof.avatarColor}" opacity="0.9"/>
                <!-- details based on avatarType -->
                ${prof.avatarType === 'goth' ? '<rect x="35" y="42" width="30" height="2" fill="#fff"/><circle cx="50" cy="50" r="3" fill="#ff007f"/>' : ''}
                ${prof.avatarType === 'corporate' ? '<polygon points="50,45 42,65 58,65" fill="#fff" opacity="0.2"/>' : ''}
              </svg>
              <span class="dating-match-badge">${matchPct}% Match</span>
            </div>
            <div class="dating-info">
              <div class="dating-name-age">${prof.name}, ${prof.age}</div>
              <p class="dating-bio">${prof.bio}</p>
              <div class="dating-requirements">
                Standards: SMV ${prof.reqSMV}+ ${prof.reqHeight ? `, Height ${Math.floor(prof.reqHeight/12)}'${prof.reqHeight%12}"` : ''}
              </div>
            </div>
          </div>
        </div>
        <div class="dating-controls">
          <button class="swipe-btn dislike" id="btn-swipe-dislike">✕</button>
          <button class="swipe-btn like" id="btn-swipe-like">♥</button>
        </div>
      </div>
    `;
  }

  phoneFrame.innerHTML = screenContent;
  container.appendChild(phoneFrame);

  // Attach Swiping Events
  if (!dating.activeChat) {
    const card = document.getElementById('dating-swipe-card');
    
    document.getElementById('btn-swipe-dislike').addEventListener('click', () => {
      playSound('swipe');
      card.classList.add('swiped-left');
      setTimeout(() => {
        dating.swipeLeft();
        renderDatingTab();
      }, 250);
    });

    document.getElementById('btn-swipe-like').addEventListener('click', () => {
      playSound('swipe');
      card.classList.add('swiped-right');
      setTimeout(() => {
        const res = dating.swipeRight();
        if (res.status === 'no_ap') {
          playSound('error');
          logToConsole(res.message, 'error');
          renderDatingTab();
        } else {
          renderDatingTab();
          updateDashboard();
        }
      }, 250);
    });
  } else {
    // Scroll chat to bottom
    const scroller = document.getElementById('chat-scroller');
    scroller.scrollTop = scroller.scrollHeight;

    // Attach Chat choice event listeners
    const choices = container.querySelectorAll('.chat-choice-btn');
    choices.forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        if (btn.classList.contains('close-chat-btn')) {
          dating.rollProfile();
          renderDatingTab();
          return;
        }
        const idx = parseInt(btn.getAttribute('data-idx'));
        dating.chooseChatOption(idx);
        renderDatingTab();
        updateDashboard();
      });
    });
  }

  // Premium Gold purchase option at top of tab
  const goldHeader = document.createElement('div');
  goldHeader.style.marginBottom = '10px';
  goldHeader.style.width = '100%';
  goldHeader.style.display = 'flex';
  goldHeader.style.justifyContent = 'space-between';
  goldHeader.style.alignItems = 'center';
  goldHeader.innerHTML = `
    <span class="clinical-font text-muted" style="font-size: 10px;">PREMIUM SYSTEM:</span>
    ${dating.goldSubscription ? 
      '<span class="text-green clinical-font" style="font-size: 10px;">GOLD ACTIVE (FREE AP SWIPES)</span>' : 
      `<button class="surgery-buy-btn" id="btn-buy-gold" style="border-color: var(--accent-yellow); color: var(--accent-yellow);">BUY GOLD ($200)</button>`}
  `;
  container.insertBefore(goldHeader, phoneFrame);

  if (!dating.goldSubscription) {
    document.getElementById('btn-buy-gold').addEventListener('click', () => {
      const res = dating.buyGold();
      if (res) {
        playSound('success');
        renderDatingTab();
        updateDashboard();
      } else {
        playSound('error');
        logToConsole("Insufficient cash to buy Premium Gold ($200)!", "error");
      }
    });
  }
}

// --- Render Encounters Tab (Card Battle) ---
function renderSocialTab() {
  const container = document.getElementById('social-encounter-view');
  container.innerHTML = '';

  if (battle.active) {
    // RENDER ACTIVE BATTLE
    renderActiveBattle(container);
  } else {
    // RENDER BATTLE LIST / OUTCOMES
    renderBattleMenu(container);
  }
}

function renderBattleMenu(container) {
  const menu = document.createElement('div');
  menu.className = 'encounters-menu';

  const encounters = battle.getEncounters();
  
  menu.innerHTML = `
    <div class="action-points-banner">
      <span>SOCIAL STATS REQUIRED:</span>
      <span class="text-cyan">SMV multipliers unlock combatants</span>
    </div>
  `;

  encounters.forEach(e => {
    const card = document.createElement('div');
    card.className = 'encounter-row-card';
    card.setAttribute('data-id', e.id);

    const isDefeated = game.opponentsDefeated.includes(e.id);

    card.innerHTML = `
      <div class="encounter-avatar-placeholder">${e.avatar}</div>
      <div class="encounter-row-info">
        <h4 class="${isDefeated ? 'text-green' : ''}">${e.name} ${isDefeated ? '✓' : ''}</h4>
        <p>${e.title} // Difficulty: <strong>${e.difficulty}</strong></p>
      </div>
      <div class="encounter-reward-badge">SMV ${e.reqSMV}+</div>
      ${e.isLocked ? `<div class="encounter-status-locked">LOCKED: REQUIRES SMV ${e.reqSMV}</div>` : ''}
    `;

    if (!e.isLocked && !isDefeated) {
      card.addEventListener('click', () => {
        showCutscene('battle');
        playSound('click');
        battle.startBattle(e.id);
        switchBGM();
        renderSocialTab();
      });
    } else if (isDefeated) {
      card.style.opacity = 0.5;
      card.style.cursor = 'default';
    }

    menu.appendChild(card);
  });

  container.appendChild(menu);
}

function renderActiveBattle(container) {
  const arena = document.createElement('div');
  arena.className = 'battle-arena';

  // Opponent details
  const opp = battle.opponent;
  const oppSkepticismPct = Math.round((battle.opponentSkepticism / battle.opponentMaxSkepticism) * 100);

  arena.innerHTML = `
    <!-- Overlay Canvas for Animations -->
    <canvas class="battle-effects-canvas" id="combat-fx-canvas" width="400" height="400"></canvas>
    
    <!-- Opponent Header HUD -->
    <div class="battle-opponent-row" id="opponent-card">
      <span class="battle-opponent-avatar">${opp.avatar}</span>
      <div class="opponent-stats">
        <div class="opponent-name">${opp.name}</div>
        <div class="skepticism-bar-label">
          <span>OPPONENT SKEPTICISM:</span>
          <span>${battle.opponentSkepticism} / ${battle.opponentMaxSkepticism}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-fill bg-pink" style="width: ${oppSkepticismPct}%;"></div>
        </div>
      </div>
    </div>

    <!-- Dialog Bubble -->
    <div class="battle-speech-bubble">
      "${battle.opponentDialog}"
    </div>

    <!-- Hand Cards -->
    <div class="battle-hand-area">
      <div class="battle-hand-title">
        <span>YOUR CARDS:</span>
        <span class="text-green">Energy: ${battle.energy} / ${battle.maxEnergy}</span>
      </div>
      <div class="battle-cards">
        <!-- Render card deck items -->
      </div>
    </div>

    <!-- Actions Control -->
    <div class="battle-action-bar">
      <span>Confidence: <strong class="text-cyan">${battle.playerConfidence}%</strong></span>
      <button class="btn warning-btn" id="btn-end-turn" style="padding: 4px 10px; font-size: 10px;">END TURN</button>
    </div>
  `;

  // Draw cards
  const cardsContainer = arena.querySelector('.battle-cards');
  battle.playerHand.forEach((card, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = `battle-card ${battle.energy < card.cost ? 'disabled' : ''}`;
    cardEl.innerHTML = `
      <div class="card-mana">${card.cost}</div>
      <div class="card-emoji">${card.emoji}</div>
      <div class="card-name">${card.name}</div>
      <p class="card-desc">${card.desc}</p>
      <div class="card-power">Eff: ${card.power}</div>
    `;

    if (battle.energy >= card.cost) {
      cardEl.addEventListener('click', () => {
        // Prevent clicking multiple cards during animation
        cardsContainer.querySelectorAll('.battle-card').forEach(c => c.style.pointerEvents = 'none');
        
        playSound('hit');
        triggerCardAnimation(card.name, arena);
        battle.playCard(idx);
        
        // Wait for animation to finish before rendering next state
        setTimeout(() => {
          if (battle.isOver) {
            renderBattleResolution(container);
            updateDashboard();
            if (game.isDead) checkGameOver();
          } else {
            renderSocialTab();
          }
        }, 800);
      });
    }

    cardsContainer.appendChild(cardEl);
  });

  container.appendChild(arena);

  // End turn listener
    document.getElementById('btn-end-turn').addEventListener('click', () => {
    playSound('error');
    battle.endTurn();
    if (battle.isOver) {
      renderBattleResolution(container);
      updateDashboard();
      if (game.isDead) checkGameOver();
    } else {
      renderSocialTab();
    }
  });
}

function triggerCardAnimation(cardName, arena) {
  const canvas = arena.querySelector('#combat-fx-canvas');
  if (!canvas) return;
  
  // Set accurate dimensions
  canvas.width = arena.clientWidth || 400;
  canvas.height = arena.clientHeight || 400;
  
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  
  let startTime = performance.now();
  
  function drawFloatingText(ctx, text, progress, color, x, y) {
    ctx.save();
    ctx.font = 'bold 24px var(--font-display)';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1 - progress;
    ctx.translate(x, y - progress * 50);
    ctx.scale(1 + progress * 0.5, 1 + progress * 0.5);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / 800, 1);
    
    ctx.clearRect(0, 0, w, h);
    
    if (cardName === 'Jawline Flash' || cardName === 'Hunter Eye Lock') {
      const color = cardName === 'Jawline Flash' ? '#00f0ff' : '#ff007f';
      const startX = 0;
      const startY = h;
      const endX = w * progress;
      const endY = h - (h * progress);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 10 * (1 - progress);
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.stroke();
      
      drawFloatingText(ctx, "LASER SHADOW!", progress, color, w/2, h/3);
    } 
    else if (cardName === 'Retinol Radiance') {
      ctx.beginPath();
      ctx.arc(w/2, h/3, progress * 300, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${1 - progress})`;
      ctx.lineWidth = 15;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 30;
      ctx.stroke();
      
      drawFloatingText(ctx, "GLAZED RADIANCE!", progress, '#00f0ff', w/2, h/3);
    }
    else if (cardName === 'Model Look' || cardName === 'Influencer Aura' || cardName === 'Loom Over') {
      ctx.fillStyle = `rgba(255, 0, 127, ${(1 - progress) * 0.5})`;
      ctx.fillRect(0, 0, w, h);
      drawFloatingText(ctx, "CRITICAL HIT!", progress, '#ffea00', w/2, h/3);
    }
    else {
      drawFloatingText(ctx, "HIT!", progress, '#ffffff', w/2, h/3);
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);

  const oppCard = document.getElementById('opponent-card');
  if (cardName === 'Model Look' || cardName === 'Influencer Aura' || cardName === 'Loom Over') {
    if (oppCard) oppCard.classList.add('shake-heavy');
    playSound('level-up'); // Use a loud sound for heavy hits
    setTimeout(() => { if (oppCard) oppCard.classList.remove('shake-heavy') }, 400);
  } else {
    if (oppCard) oppCard.classList.add('shake');
    setTimeout(() => { if (oppCard) oppCard.classList.remove('shake') }, 200);
  }
}

function renderBattleResolution(container) {
  container.innerHTML = '';
  const outcome = battle.outcome;
  const opp = battle.opponent;

  const div = document.createElement('div');
  div.className = 'battle-outcome';
  div.innerHTML = `
    <span style="font-size: 48px;">${outcome === 'win' ? '🏆' : '💀'}</span>
    <h3 class="outcome-title ${outcome}">${outcome === 'win' ? 'VICTORY' : 'DEFEATED'}</h3>
    <p class="desc" style="font-size: 12px; color: var(--text-muted);">
      ${outcome === 'win' ? opp.rewards.log : `${opp.name} crushed your ego. You fled in shame.`}
    </p>
    <div class="outcome-rewards">
      ${outcome === 'win' ? 
        `Rewards Obtained:<br/>
         ${opp.rewards.cash ? `+$${opp.rewards.cash} Cash<br/>` : ''}
         ${opp.rewards.confidence ? `+${opp.rewards.confidence}% Confidence<br/>` : ''}
         ${opp.rewards.style ? `+${opp.rewards.style}% Style<br/>` : ''}
         ${opp.rewards.frame ? `+${opp.rewards.frame}% Frame<br/>` : ''}
         ${opp.rewards.partner ? `Dating relationship unlocked: ${opp.rewards.partner}!<br/>` : ''}` :
        `Penalties Incurred:<br/>
         - Confidence dropped to 10%<br/>
         - $150 Wallet Loss`
      }
    </div>
    <button class="btn primary-btn" id="btn-close-outcome">Return to Dashboard</button>
  `;

  container.appendChild(div);

  document.getElementById('btn-close-outcome').addEventListener('click', () => {
    playSound('click');
    battle.active = false;
    battle.isOver = false;
    switchBGM();
    renderSocialTab();
    checkGameOver();
  });
}

// === NEW: Substance Shop Render ===
function renderSubstances() {
  const container = document.getElementById('substance-list');
  container.innerHTML = '';
  SUBSTANCES.forEach(sub => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;';
    const canAfford = game.cash >= sub.cost;
    card.innerHTML = `
      <div style="flex:1;">
        <strong style="font-size:12px;">${sub.name}</strong>
        <p style="font-size:10px;color:var(--text-muted);margin:2px 0;">${sub.desc}</p>
        <span style="font-family:var(--font-mono);font-size:9px;color:var(--accent-yellow);">$${sub.cost} | Risk: ${Math.round(sub.risk*100)}% | Addiction: ${Math.round(sub.addictionRisk*100)}%</span>
      </div>
      <button class="surgery-buy-btn" ${canAfford ? '' : 'disabled'}>BUY</button>
    `;
    const btn = card.querySelector('button');
    if (canAfford) {
      btn.addEventListener('click', () => {
        const res = game.takeSubstance(sub.id);
        if (res.success === false) {
          playSound('error');
          logToConsole(res.message || res.error, 'error');
          if (game.isDead) { substanceModal.classList.add('hidden'); checkGameOver(); return; }
        } else {
          playSound('success');
          logToConsole(res.message, 'success');
        }
        updateDashboard();
        renderSubstances();
      });
    }
    container.appendChild(card);
  });
}

// === NEW: Talent Tree Render ===
function renderTalents() {
  document.getElementById('talent-points-display').textContent = game.talentPoints;
  const container = document.getElementById('talent-list');
  container.innerHTML = '';
  TALENTS.forEach(talent => {
    const rank = game.talents[talent.id] || 0;
    const maxed = rank >= talent.maxRank;
    const card = document.createElement('div');
    card.style.cssText = `background:var(--bg-tertiary);border:1px solid ${maxed ? 'var(--accent-green)' : 'var(--border-color)'};border-radius:var(--radius-md);padding:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;`;
    const stars = '⭐'.repeat(rank) + '☆'.repeat(talent.maxRank - rank);
    card.innerHTML = `
      <div style="flex:1;">
        <strong style="font-size:12px;">${talent.name} ${stars}</strong>
        <p style="font-size:10px;color:var(--text-muted);margin:2px 0;">${talent.desc}</p>
      </div>
      <button class="surgery-buy-btn" style="${maxed ? 'border-color:var(--accent-green);color:var(--accent-green);' : ''}" ${game.talentPoints < 1 || maxed ? 'disabled' : ''}>
        ${maxed ? 'MAXED' : 'LEARN (' + game.talentPoints + ' pts)'}
      </button>
    `;
    const btn = card.querySelector('button');
    if (game.talentPoints >= 1 && !maxed) {
      btn.addEventListener('click', () => {
        game.learnTalent(talent.id);
        playSound('level-up');
        updateDashboard();
        renderTalents();
      });
    }
    container.appendChild(card);
  });
}

// === NEW: Achievement Toast ===
function showAchievementToast(ach) {
  document.getElementById('ach-icon').textContent = ach.icon;
  document.getElementById('ach-title').textContent = 'ACHIEVEMENT UNLOCKED!';
  document.getElementById('ach-name').textContent = ach.name;
  document.getElementById('ach-desc').textContent = ach.desc;
  achievementToast.classList.remove('hidden');
  achievementToast.classList.add('show');
  playSound('achievement');
  setTimeout(() => {
    achievementToast.classList.remove('show');
    achievementToast.classList.add('hidden');
  }, 4000);
}

// === NEW: Leaderboard ===
function updateLeaderboard(runInfo) {
  let leaderboard = JSON.parse(localStorage.getItem('looksmax_leaderboard') || '[]');
  const score = Math.round(runInfo.smv * 100 + runInfo.cash / 100 + runInfo.rizz * 2);
  leaderboard.push({ name: runInfo.name, smv: runInfo.smv, cash: runInfo.cash, rizz: runInfo.rizz, career: runInfo.career, date: runInfo.date, score });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard = leaderboard.slice(0, 10);
  localStorage.setItem('looksmax_leaderboard', JSON.stringify(leaderboard));
}

function renderLeaderboardList() {
  const container = document.getElementById('leaderboard-container');
  const leaderboard = JSON.parse(localStorage.getItem('looksmax_leaderboard') || '[]');
  container.innerHTML = '';
  if (leaderboard.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);text-align:center;">No scores recorded yet.</div>';
    return;
  }
  leaderboard.forEach((entry, i) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-color);';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    row.innerHTML = `
      <span>${medal} ${entry.name}</span>
      <span style="color:var(--accent-cyan);">PSL ${entry.smv.toFixed(1)}</span>
      <span style="color:var(--accent-yellow);">Score: ${entry.score}</span>
    `;
    container.appendChild(row);
  });

  const clearBtn = document.getElementById('btn-clear-leaderboard');
  if (clearBtn && !clearBtn.dataset.listenerAttached) {
    clearBtn.dataset.listenerAttached = '1';
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('looksmax_leaderboard');
      renderLeaderboardList();
      playSound('click');
    });
  }
}

// === NEW: Analytics (Canvas Line Chart) ===
function renderAnalytics() {
  const container = document.getElementById('analytics-container');
  const timeline = game.statTimeline;
  if (timeline.length < 2) {
    container.innerHTML = '<strong style="font-size:11px;color:var(--accent-cyan);margin-bottom:5px;display:block;">STAT PROGRESSION</strong><div style="color:var(--text-muted);font-size:10px;padding:8px;">Need at least 2 data points to chart. Advance some years.</div>';
    return;
  }

  // Use an existing canvas or create one
  let canvas = container.querySelector('canvas.analytics-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'analytics-canvas';
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  const rect = container.getBoundingClientRect();
  const w = canvas.width = Math.max(260, rect.width - 10) * 2;
  const h = canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.scale(1, 1);
  canvas.style.width = (w / 2) + 'px';
  canvas.style.height = (h / 2) + 'px';

  const pad = { top: 20, bottom: 28, left: 40, right: 16 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  // Data series
  const smvVals = timeline.map(p => p.smv * 12.5); // scale SMV 0-8 to 0-100
  const confVals = timeline.map(p => p.confidence);
  const rizzVals = timeline.map(p => p.rizz);
  const ages = timeline.map(p => p.age);
  const minAge = ages[0], maxAge = ages[ages.length - 1];
  const ageRange = maxAge - minAge || 1;

  const x = (i) => pad.left + (i / (timeline.length - 1)) * plotW;
  const y = (val) => pad.top + plotH - (val / 100) * plotH;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = 'rgba(110, 122, 150, 0.15)';
  ctx.lineWidth = 1;
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#6e7a96';
  ctx.textAlign = 'right';
  for (let g = 0; g <= 100; g += 20) {
    const gy = y(g);
    ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(w - pad.right, gy); ctx.stroke();
    ctx.fillText(g + (g === 100 ? '%' : ''), pad.left - 4, gy + 3);
  }
  // SMV scale annotations on right
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
  for (let s = 0; s <= 8; s += 2) {
    ctx.fillText('SMV ' + s, w - pad.right + 4, y(s * 12.5) + 3);
  }

  // X-axis labels (show every few ages to avoid crowding)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6e7a96';
  const step = Math.max(1, Math.floor(timeline.length / 8));
  ages.forEach((age, i) => {
    if (i % step === 0 || i === ages.length - 1) {
      ctx.fillText(age, x(i), h - pad.bottom + 16);
    }
  });
  ctx.fillText('Age', x(Math.floor(timeline.length / 2)), h - 2);

  // Helper: draw a polyline
  function drawLine(data, color, label) {
    ctx.beginPath();
    data.forEach((val, i) => {
      const px = x(i), py = y(val);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    data.forEach((val, i) => {
      ctx.beginPath();
      ctx.arc(x(i), y(val), 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Value labels at each point
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    data.forEach((val, i) => {
      if (i % step === 0 || i === data.length - 1) {
        ctx.fillStyle = color;
        const display = label === 'SMV' ? (val / 12.5).toFixed(1) : String(Math.round(val));
        ctx.fillText(display, x(i), y(val) - 6);
      }
    });
  }

  drawLine(smvVals, '#00f0ff', 'SMV');
  drawLine(confVals, '#ff55bb', 'CONF');
  drawLine(rizzVals, '#ffea00', 'RIZZ');

  // Legend
  const legendY = 10;
  const legendItems = [
    { label: 'SMV', color: '#00f0ff' },
    { label: 'Confidence', color: '#ff55bb' },
    { label: 'Rizz', color: '#ffea00' }
  ];
  let lx = pad.left;
  legendItems.forEach(item => {
    ctx.fillStyle = item.color;
    ctx.fillRect(lx, legendY, 10, 10);
    ctx.fillStyle = '#f0f3f8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, lx + 14, legendY + 9);
    lx += ctx.measureText(item.label).width + 30;
  });
}

// === NEW: Lineage ===
function renderLineage() {
  const container = document.getElementById('lineage-container');
  if (!game.children || game.children.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);text-align:center;">No children. Your genetic line ends here.</div>';
    return;
  }
  container.innerHTML = '<strong style="font-size:11px;color:var(--accent-green);margin-bottom:5px;display:block;">YOUR OFFSPRING</strong>';
  game.children.forEach(child => {
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:8px;margin-bottom:5px;';
    const ft = Math.floor(child.height / 12);
    const inc = child.height % 12;
    card.innerHTML = `
      <strong style="font-size:11px;color:var(--accent-cyan);">${child.name}</strong>
      <span style="font-size:9px;color:var(--text-muted);display:block;">
        ${child.gender === 'male' ? '♂' : '♀'} ${ft}'${inc}" | Jaw: ${child.jaw} | Tilt: ${child.tilt} | Rizz: ${child.rizz}
      </span>
    `;
    container.appendChild(card);
  });
}

// === NEW: Achievements Final ===
function renderAchievementsFinal() {
  const container = document.getElementById('achievements-container');
  const unlocked = new Set(game.achievementsUnlocked);
  let html = '';
  ACHIEVEMENTS.forEach(ach => {
    const isUnlocked = unlocked.has(ach.id);
    html += `<div style="display:flex;gap:8px;padding:3px 0;font-size:10px;${isUnlocked ? '' : 'opacity:0.4;'}">
      <span>${isUnlocked ? ach.icon : '🔒'}</span>
      <span style="${isUnlocked ? 'color:var(--accent-cyan);' : 'color:var(--text-muted);'}">${ach.name}</span>
      <span style="color:var(--text-muted);font-size:9px;">${ach.desc}</span>
    </div>`;
  });
  container.innerHTML = html;
}

// === NEW: Codex Render ===
function renderCodex() {
  const container = document.querySelector('.codex-body');
  let html = '<dl>';
  CODEX_ENTRIES.forEach(entry => {
    html += `<dt>${entry.term}</dt><dd>${entry.def}</dd>`;
  });
  html += '</dl>';
  container.innerHTML = html;
}

// === NEW: Cutscene Animation ===
function showCutscene(type) {
  const overlay = document.getElementById('cutscene-overlay');
  const icon = document.getElementById('cutscene-icon');
  const title = document.getElementById('cutscene-title');
  const subtitle = document.getElementById('cutscene-subtitle');
  const anim = document.getElementById('cutscene-animation');

  const scenes = {
    surgery: { icon: '💉', title: 'UNDER THE KNIFE', subtitle: 'Surgery in progress...' },
    battle: { icon: '⚔️', title: 'COMBAT ENGAGED', subtitle: 'Battle mode activated' },
    viral: { icon: '📱', title: 'GOING VIRAL', subtitle: 'Your feed is exploding' },
    promotion: { icon: '📈', title: 'PROMOTION', subtitle: 'Climbing the ladder' },
    dating: { icon: '💘', title: 'MATCH FOUND', subtitle: 'Swipe right on destiny' },
    death: { icon: '💀', title: 'FATALITY', subtitle: 'Your journey ends' }
  };

  const scene = scenes[type] || scenes.surgery;
  icon.textContent = scene.icon;
  title.textContent = scene.title;
  subtitle.textContent = scene.subtitle;
  anim.innerHTML = '';

  overlay.classList.remove('hidden');
  overlay.classList.add('show');

  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }, 1500);
}

// Start Init
window.addEventListener('DOMContentLoaded', init);
