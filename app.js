/**
 * app.js
 * Main controller coordinating the UI views, audio synthesizer,
 * canvas renderer, card battles, dating swiping, and year progression.
 */

import { GameState } from './game.js';
import { drawAvatar } from './avatar.js';
import { BattleSystem } from './battle.js';
import { DatingSimulator } from './dating.js';
import { generateForumThread } from './forum.js';

// --- Web Audio API Synth ---
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
  if (audioCtx) return;
  // Initialize context on user interaction
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext) {
    audioCtx = new AudioContext();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') {
    // Try to resume if browser suspended it
    audioCtx.resume();
  }
  if (!audioCtx) return;

  const dest = audioCtx.destination;
  
  if (type === 'click') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } 
  else if (type === 'success') {
    // Arpeggio
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);
      gain.gain.setValueAtTime(0.08, now + index * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.07 + 0.15);
      
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.15);
    });
  } 
  else if (type === 'error') {
    // Buzz
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } 
  else if (type === 'swipe') {
    // Noise whoosh
    const bufferSize = audioCtx.sampleRate * 0.15;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(10, audioCtx.currentTime);
    filter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    noise.start();
    noise.stop(audioCtx.currentTime + 0.15);
  }
  else if (type === 'hit') {
    // Combat damage hit
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(dest);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  else if (type === 'level-up') {
    // Retro scale
    const now = audioCtx.currentTime;
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    scale.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(dest);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.05);
      gain.gain.setValueAtTime(0.06, now + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.05 + 0.1);
      
      osc.start(now + index * 0.05);
      osc.stop(now + index * 0.05 + 0.1);
    });
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
const barHairline = document.getElementById('bar-hairline');
const txtFrame = document.getElementById('txt-frame');
const barFrame = document.getElementById('bar-frame');
const txtStyle = document.getElementById('txt-style');
const barStyle = document.getElementById('bar-style');
const txtConfidence = document.getElementById('txt-confidence');
const barConfidence = document.getElementById('bar-confidence');

// Actions / Surgeries
const actWork = document.getElementById('act-work');
const actGym = document.getElementById('act-gym');
const actSkincare = document.getElementById('act-skincare');
const actStyling = document.getElementById('act-styling');
const actSurgery = document.getElementById('act-surgery');
const surgeryMenu = document.getElementById('surgery-menu');
const btnCloseSurgery = document.getElementById('btn-close-surgery');
const btnEndYear = document.getElementById('btn-end-year');

// Modals
const eventModal = document.getElementById('event-modal');
const eventTitle = document.getElementById('event-modal-title');
const eventDesc = document.getElementById('event-modal-desc');
const eventImpact = document.getElementById('event-modal-impact');
const btnCloseEvent = document.getElementById('btn-close-event');

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
}

function setupAudioControl() {
  const btn = document.getElementById('audio-toggle-btn');
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      btn.classList.remove('disabled');
      btn.querySelector('span').textContent = 'SOUND ON';
      playSound('click');
    } else {
      btn.classList.add('disabled');
      btn.querySelector('span').textContent = 'SOUND OFF';
    }
  });
}

function logToConsole(message, type = 'system') {
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.innerHTML = `[${type.toUpperCase()}] ${message}`;
  consoleContainer.appendChild(div);
  consoleContainer.scrollTop = consoleContainer.scrollHeight;
}

function setupEventListeners() {
  // Genesis Screen Rolls
  btnRollGenetics.addEventListener('click', () => {
    initAudio();
    playSound('click');
    triggerRollAnimation();
  });

  btnStartLife.addEventListener('click', () => {
    playSound('level-up');
    switchScreen('screen-gameboard');
    startGame();
  });

  // Action Panel Toggles
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      playSound('click');
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

  btnEndYear.addEventListener('click', () => {
    endYear();
  });

  btnCloseEvent.addEventListener('click', () => {
    playSound('click');
    eventModal.classList.add('hidden');
    checkGameOver();
  });

  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    playSound('click');
    consoleContainer.innerHTML = '';
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    playSound('click');
    switchScreen('screen-genesis');
    // Hide game board and final blocks
    btnRollGenetics.classList.remove('hidden');
    btnStartLife.classList.add('hidden');
    genesisStatsDisplay.classList.add('hidden');
    genesisLoader.classList.add('hidden');
  });
}

function switchScreen(screenId) {
  const screens = document.querySelectorAll('.game-screen');
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// --- Screen 1: Genetic Roll Animation ---
function triggerRollAnimation() {
  btnRollGenetics.disabled = true;
  genesisLoader.classList.remove('hidden');
  genesisStatsDisplay.classList.add('hidden');
  
  let rollTicks = 0;
  const rollInterval = setInterval(() => {
    // Generate tick sounds
    playSound('click');
    
    // Scramble DNA stats text
    const dummyGame = new GameState();
    renderGenesisPreview(dummyGame);
    
    rollTicks++;
    if (rollTicks >= 12) {
      clearInterval(rollInterval);
      
      // Roll player's actual genetics
      game.reset();
      renderGenesisPreview(game);
      
      genesisLoader.classList.add('hidden');
      genesisStatsDisplay.classList.remove('hidden');
      btnRollGenetics.disabled = false;
      btnRollGenetics.classList.add('hidden');
      btnStartLife.classList.remove('hidden');
      
      logToConsole(`DNA Sequenced successfully: ${game.name} born. Base SMV: ${game.smv}`, 'success');
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
      <strong>${ft}'${inVal}" (${player.height} cm)</strong>
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
      <span>Hairline:</span>
      <strong>Norwood Scale ${player.hairline}</strong>
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
  logToConsole(`Starting Run for ${game.name}. Navigate yearly tasks before age 30.`, 'system');
  dating = new DatingSimulator(game, logToConsole);
  battle = new BattleSystem(game, logToConsole);
  
  // Default to year actions
  tabBtns[0].click();
  
  updateDashboard();
}

function updateDashboard() {
  if (game.isDead) return;

  // Text values
  hudAge.textContent = game.age;
  hudCash.textContent = `$${game.cash.toLocaleString()}`;
  hudSMV.textContent = `${game.smv} / 10`;
  hudAP.textContent = game.ap;
  hudSocialTier.textContent = game.socialTier;
  
  // Format avatar subtitle class tag
  const ft = Math.floor(game.height / 12);
  const inVal = game.height % 12;
  hudAvatarClass.textContent = `${ft}'${inVal}" // ${game.jaw.toUpperCase()} JAW`;

  // Update Biometrics details
  statHeight.textContent = `${ft}'${inVal}" (${game.height} cm)`;
  statJaw.textContent = game.jaw;
  statTilt.textContent = game.tilt;
  statSymmetry.textContent = game.symmetry;

  // Update Soft Meters
  // Skin
  const skinPct = game.skin;
  barSkin.style.width = `${skinPct}%`;
  txtSkin.textContent = skinPct < 30 ? 'Cystic Acne' : skinPct < 60 ? 'Blotchy' : skinPct < 90 ? 'Clear' : 'Glowing';
  
  // Hairline Norwood
  // Bar represents full head = Norwood 1 (100%), Norwood 7 = bald (10%)
  const hairPct = Math.max(10, Math.round(((8 - game.hairline) / 7) * 100));
  barHairline.style.width = `${hairPct}%`;
  txtHairline.textContent = `NW ${game.hairline}`;

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

  // Enable/Disable Action buttons based on resources
  actWork.disabled = game.ap < 2;
  actGym.disabled = game.ap < 2 || game.cash < 100;
  actSkincare.disabled = game.ap < 1 || game.cash < 50;
  actStyling.disabled = game.ap < 1 || game.cash < 150;

  // Avatar Canvas Ticker
  avatarTicker.textContent = `STATUS: ONLINE // SMV: ${game.smv} // PARTNER: ${game.hasDatingPartner ? game.partnerName : 'SINGLE'}`;

  // Redraw Canvas Avatar
  drawAvatar(mainCanvas, game);
}

// --- Year Progression & Events ---
function endYear() {
  playSound('level-up');
  const event = game.advanceYear();
  
  updateDashboard();
  
  // Show Random Event Modal
  eventTitle.textContent = event.title;
  eventDesc.textContent = event.desc;
  eventImpact.textContent = `EFFECTS: ${event.impactText}`;
  eventModal.classList.remove('hidden');

  logToConsole(`Advanced to Age ${game.age}. Random Event triggered: ${event.title}`, 'event');
}

function checkGameOver() {
  if (game.isDead) {
    playSound('error');
    triggerGameOver("Fatality due to surgical botch.");
  } else if (game.age >= 30) {
    playSound('success');
    triggerGameOver("Social tier finalized at Age 30.");
  }
}

function triggerGameOver(reasonText) {
  switchScreen('screen-gameover');
  document.getElementById('txt-death-reason').textContent = reasonText;

  // Render final avatar canvas
  drawAvatar(finalCanvas, game);

  // Compile final biometrics list
  const ft = Math.floor(game.height / 12);
  const inVal = game.height % 12;
  const finalStatsList = document.getElementById('final-stats-list');
  finalStatsList.innerHTML = `
    <div class="stat-row-detail">
      <span>Final Rating:</span>
      <strong class="text-cyan">${game.smv} / 10</strong>
    </div>
    <div class="stat-row-detail">
      <span>Social Status:</span>
      <strong class="text-green">${game.socialTier}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Height:</span>
      <strong>${ft}'${inVal}"</strong>
    </div>
    <div class="stat-row-detail">
      <span>Jaw Definition:</span>
      <strong>${game.jaw}</strong>
    </div>
    <div class="stat-row-detail">
      <span>Hairline:</span>
      <strong>Norwood ${game.hairline}</strong>
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
  `;

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
        playSound('click');
        battle.startBattle(e.id);
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
        playSound('hit');
        triggerCardShake();
        battle.playCard(idx);
        if (battle.isOver) {
          renderBattleResolution(container);
          updateDashboard();
        } else {
          renderSocialTab();
        }
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
    } else {
      renderSocialTab();
    }
  });
}

function triggerCardShake() {
  const oppCard = document.getElementById('opponent-card');
  if (oppCard) {
    oppCard.classList.add('shake');
    setTimeout(() => {
      oppCard.classList.remove('shake');
    }, 300);
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
    renderSocialTab();
    checkGameOver();
  });
}

// Start Init
window.addEventListener('DOMContentLoaded', init);
