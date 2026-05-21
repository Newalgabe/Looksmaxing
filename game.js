/**
 * game.js
 * Manages the core game state, genetics rolls, yearly action costs/benefits,
 * surgery logic ( Turkey vs. Beverly Hills ), random events, and SMV rating calculation.
 * Extended with: Rizz stat, Career system, Talent tree, Substances, Extended life,
 * Achievements, Event calendar, Lineage, and more.
 */

// Genetic option tables
export const JAW_TYPES = ['Receding', 'Soft', 'Average', 'Sharp', 'Chiseled'];
export const TILT_TYPES = ['Negative', 'Neutral', 'Positive'];
export const SYMMETRY_TYPES = ['Asymmetrical', 'Average', 'Symmetrical'];
export const FIRST_NAMES = ['Chadwick', 'Hunter', 'Kyle', 'Cope', 'Morty', 'Eugene', 'Bartholomew', 'Daxx', 'Brayson', 'Maximilian'];
export const FIRST_NAMES_FEMALE = ['Stacy', 'Becky', 'Chloe', 'Tiffany', 'Gertrude', 'Jessica', 'Brittany', 'Angelina', 'Kylie', 'Madison', 'Vindicta', 'Clara'];
export const LAST_NAMES = ['Maxxer', 'Coperson', 'Slayer', 'Framelet', 'Incelius', 'Plugs', 'Chadson', 'Canthal', 'Norwood', 'Giga', 'Femcelius', 'Prettyprivilege'];

// Career tiers
export const CAREER_TIERS = [
  { id: 'unemployed', title: 'Unemployed', pay: 0, apCost: 0, reqSMV: 0, reqRizz: 0 },
  { id: 'entry', title: 'Entry Level', pay: 1000, apCost: 2, reqSMV: 0, reqRizz: 0 },
  { id: 'junior', title: 'Junior Associate', pay: 1500, apCost: 2, reqSMV: 2.0, reqRizz: 10 },
  { id: 'mid', title: 'Mid-Level Specialist', pay: 2200, apCost: 2, reqSMV: 3.0, reqRizz: 20 },
  { id: 'senior', title: 'Senior Analyst', pay: 3000, apCost: 2, reqSMV: 4.0, reqRizz: 30 },
  { id: 'manager', title: 'Department Manager', pay: 4000, apCost: 3, reqSMV: 5.0, reqRizz: 45 },
  { id: 'director', title: 'Director', pay: 5500, apCost: 3, reqSMV: 6.0, reqRizz: 55 },
  { id: 'executive', title: 'Executive VP', pay: 7500, apCost: 3, reqSMV: 7.0, reqRizz: 65 },
  { id: 'ceo', title: 'CEO', pay: 10000, apCost: 4, reqSMV: 8.0, reqRizz: 75 }
];

// Talent tree
export const TALENTS = [
  { id: 'social_butterfly', name: 'Social Butterfly', desc: '+5 Rizz per rank', maxRank: 3, effect: (p, rank) => { p.rizz = Math.min(100, p.rizz + 5); } },
  { id: 'gym_rat', name: 'Gym Rat', desc: '+15% Frame gains per rank', maxRank: 3, effect: null },
  { id: 'skin_whisperer', name: 'Skin Whisperer', desc: '+15% Skin gains per rank', maxRank: 3, effect: null },
  { id: 'fashion_icon', name: 'Fashion Icon', desc: '+20% Style gains per rank', maxRank: 3, effect: null },
  { id: 'charisma', name: 'Charisma', desc: '+10% Confidence cap per rank', maxRank: 3, effect: null },
  { id: 'surgeon_savvy', name: 'Surgeon Savvy', desc: '-10% Surgery risk per rank', maxRank: 3, effect: null },
  { id: 'tiktok_guru', name: 'TikTok Guru', desc: '+25% Follower gains per rank', maxRank: 3, effect: null },
  { id: 'smooth_operator', name: 'Smooth Operator', desc: '+15% Dating success per rank', maxRank: 3, effect: null },
  { id: 'hustler', name: 'Hustler', desc: '+20% Career earnings per rank', maxRank: 3, effect: null },
  { id: 'iron_stomach', name: 'Iron Stomach', desc: '-20% Substance risk per rank', maxRank: 3, effect: null }
];

// Substance definitions
export const SUBSTANCES = [
  { id: 'creatine', name: 'Creatine Monohydrate', cost: 50, risk: 0.02, addictionRisk: 0.01, desc: 'Safe gym supplement. +3 Frame, +2 Rizz (pump confidence).', effects: { frame: 3, rizz: 2 }, sideEffects: null },
  { id: 'preworkout', name: 'Pre-Workout', cost: 80, risk: 0.05, addictionRisk: 0.1, desc: 'Caffeine blast. +5 Frame, -5 Confidence (crash later).', effects: { frame: 5 }, sideEffects: { confidence: -5 } },
  { id: 'finasteride', name: 'Finasteride', cost: 200, risk: 0.08, addictionRisk: 0.05, desc: 'Hair loss prevention. -1 Hairline tier risk reduction.', effects: { hairlineProtect: true }, sideEffects: null },
  { id: 'accutane', name: 'Accutane', cost: 500, risk: 0.15, addictionRisk: 0.02, desc: 'Powerful acne medication. +25 Skin, risk of depression.', effects: { skin: 25 }, sideEffects: { confidence: -15 } },
  { id: 'steroids', name: 'Anabolic Steroids', cost: 1000, risk: 0.25, addictionRisk: 0.3, desc: 'Massive gains but severe health risks. +20 Frame, +10 Confidence, risk of death.', effects: { frame: 20, confidence: 10 }, sideEffects: null },
  { id: 'ozempic', name: 'Ozempic', cost: 800, risk: 0.18, addictionRisk: 0.15, desc: 'Weight loss injection. +15 Style, -10 Frame (muscle loss), nausea.', effects: { style: 15 }, sideEffects: { frame: -10, confidence: -5 } }
];

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first_roll', name: 'Born', desc: 'Roll your genetics for the first time.', icon: '👶', check: (p) => true },
  { id: 'millionaire', name: 'Cash King', desc: 'Accumulate $10,000 cash.', icon: '💰', check: (p) => p.cash >= 10000 },
  { id: 'gigachad', name: 'GigaChad/GigaStacy', desc: 'Reach SMV 7.5+', icon: '👑', check: (p) => p.smv >= 7.5 },
  { id: 'truecel', name: 'Truecel', desc: 'Finish with SMV under 2.5', icon: '😭', check: (p) => p.smv <= 2.5 },
  { id: 'influencer', name: 'TikTok Famous', desc: 'Reach 10,000 followers.', icon: '📱', check: (p) => p.followers >= 10000 },
  { id: 'surgery_survivor', name: 'Knife Magnet', desc: 'Survive 3+ botched surgeries.', icon: '💉', check: (p) => p.surgeryBotchedCount >= 3 },
  { id: 'heartbreaker', name: 'Heartbreaker', desc: 'Secure a dating partner in a run.', icon: '💔', check: (p) => p.hasDatingPartner },
  { id: 'mogger', name: 'Ultimate Mogger', desc: 'Defeat all opponents in battle.', icon: '🏆', check: (p) => p.opponentsDefeated.length >= 8 },
  { id: 'ceo_grind', name: 'CEO Grindset', desc: 'Reach CEO career tier.', icon: '💼', check: (p) => p.careerTier === 'ceo' },
  { id: 'surgeon_savvy_ach', name: 'Natural Beauty', desc: 'Complete a run with 0 surgeries.', icon: '🌿', check: (p) => p.surgeryBotchedCount === 0 },
  { id: 'addict', name: 'Substance Abuser', desc: 'Take 5+ substances in one run.', icon: '💊', check: (p) => p.substancesUsed >= 5 },
  { id: 'centenarian', name: 'Elder', desc: 'Reach age 50.', icon: '👴', check: (p) => p.age >= 50 },
  { id: 'rizzler', name: 'Rizz God', desc: 'Reach 100 Rizz.', icon: '🔥', check: (p) => p.rizz >= 100 },
  { id: 'rival_slayer', name: 'Rival Slayer', desc: 'Beat your rival at every milestone.', icon: '🥊', check: (p) => p.rivalDefeatedCount >= 4 },
  { id: 'challenge_complete', name: 'Challenge Mode', desc: 'Complete any challenge run.', icon: '🏅', check: (p) => p.completedChallenge },
  { id: 'style_max', name: 'Style Icon', desc: 'Reach 100 Style.', icon: '👔', check: (p) => p.style >= 100 },
  { id: 'frame_max', name: 'Giga Frame', desc: 'Reach 100 Frame.', icon: '💪', check: (p) => p.frame >= 100 },
  { id: 'skin_max', name: 'Porcelain Skin', desc: 'Reach 100 Skin.', icon: '✨', check: (p) => p.skin >= 100 },
  { id: 'max_confidence', name: 'Unshakeable', desc: 'Reach 100 Confidence.', icon: '🧠', check: (p) => p.confidence >= 100 },
  { id: 'high_roller', name: 'High Roller', desc: 'Accumulate $20,000 cash.', icon: '💎', check: (p) => p.cash >= 20000 },
  { id: 'death_surgery', name: 'Table Fare', desc: 'Die on the operating table.', icon: '🩸', check: (p) => p.isDead && p.surgeryBotchedCount > 0 },
  { id: 'death_overdose', name: 'Overdose', desc: 'Die from substance overdose.', icon: '☠️', check: (p) => p.isDead && p.log.some(l => l.includes('FATAL')) },
  { id: 'substance_max', name: 'Poly-Drug User', desc: 'Take 15+ substances in one run.', icon: '💊', check: (p) => p.substancesUsed >= 15 },
  { id: 'baby_maker', name: 'Legacy', desc: 'Have a child.', icon: '👶', check: (p) => p.hasProcreated }
];

// Seasonal events
export const SEASONAL_EVENTS = [
  { id: 'new_year', name: 'New Year', desc: 'A fresh start! Everybody is at the gym.', icon: '🎉', age: 19, effect: (p) => { p.confidence = Math.min(100, p.confidence + 10); } },
  { id: 'summer', name: 'Summer Beach Season', desc: 'Beach body season. Social pressure is high.', icon: '🏖️', age: 21, effect: (p) => { if (p.smv < 4) p.confidence = Math.max(0, p.confidence - 10); else p.style = Math.min(100, p.style + 5); } },
  { id: 'halloween', name: 'Halloween', desc: 'Wear a mask and be whoever you want.', icon: '🎃', age: 23, effect: (p) => { p.confidence = Math.min(100, p.confidence + 5); } },
  { id: 'christmas', name: 'Christmas', desc: 'Holiday cheer! Family gatherings.', icon: '🎄', age: 25, effect: (p) => { p.cash += 200; } },
  { id: 'valentine', name: 'Valentine\'s Day', desc: 'Love is in the air... or not.', icon: '💝', age: 27, effect: (p) => { if (p.hasDatingPartner) p.confidence = Math.min(100, p.confidence + 15); else p.confidence = Math.max(0, p.confidence - 10); } }
];

// Challenge Seeds
export const CHALLENGE_SEEDS = {
  bald_begins: { name: 'Bald Begin', desc: 'Start at Norwood 7 with only $100', icon: '🦲', apply(p) { p.hairline = 7; p.cash = 100; } },
  manlet: { name: 'Manlet', desc: 'Maximum height 5\'2" (62 inches)', icon: '📏', apply(p) { p.height = Math.min(62, p.height); } },
  acne_hell: { name: 'Acne Hell', desc: 'Skin starts at 5/100', icon: '🤒', apply(p) { p.skin = 5; } },
  broke_boi: { name: 'Broke Boi', desc: 'Start with $0', icon: '💸', apply(p) { p.cash = 0; } },
  rizzless: { name: 'Rizzless', desc: 'Start with 0 Rizz', icon: '🤐', apply(p) { p.rizz = 0; } },
  daily_challenge: { name: 'Daily Challenge', desc: 'Same seed for everyone today', icon: '📅', apply(p) { } }
};

// Rival progression milestones
export const RIVAL_MILESTONES = [
  { age: 22, reqSMV: 3.5, title: 'High School Bully', icon: '👊' },
  { age: 27, reqSMV: 5.0, title: 'Office Rival', icon: '💼' },
  { age: 33, reqSMV: 6.5, title: 'Social Media Competitor', icon: '📱' },
  { age: 40, reqSMV: 7.5, title: 'GigaChad Nemesis', icon: '👑' }
];

// Codex entries
export const CODEX_ENTRIES = [
  { term: 'PSL', def: '"Pound-for-Pound Sexiness Level" — A community rating scale from 1.0 to 8.0 measuring overall facial and bodily attractiveness. Originated from the incel community.' },
  { term: 'SMV', def: '"Sexual Market Value" — Your composite attractiveness score (1.0–8.0). Determined by height, jaw, tilt, symmetry, hairline, frame, skin, style, and rizz.' },
  { term: 'Norwood Scale', def: 'A classification system for male pattern baldness. Norwood 1 (full head) to Norwood 7 (horseshoe bald). Used to describe hairline recession.' },
  { term: 'Ludwig Scale', def: 'The female equivalent of the Norwood scale. Classifies female pattern hair loss into 3 grades.' },
  { term: 'Canthal Tilt', def: 'The angle of your eye corners. Positive tilt (outer corner higher) is considered more attractive. Negative tilt is associated with tired/angry appearance.' },
  { term: 'Jaw Definition', def: 'How sharp/defined your jawline is. Ranges: Chiseled > Sharp > Average > Soft > Receding. A strong jaw is one of the highest-SMV bone traits.' },
  { term: 'Frame', def: 'Shoulder width and overall body build. Broad frames indicate high testosterone and are considered dominant. Measured 0–100.' },
  { term: 'Rizz', def: 'Short for "charisma." Your ability to flirt, charm, and command social situations. Impacts dating, career promotions, and battle outcomes.' },
  { term: 'Looksmaxxing', def: 'The practice of improving one\'s physical appearance through any means necessary: gym, skincare, surgery, styling, and substances.' },
  { term: 'Soft Maxxes', def: 'Improvements that don\'t require surgery: skincare, gym, hair styling, fashion, makeup. Reversible and lower risk.' },
  { term: 'Hard Maxxes', def: 'Surgical or medical interventions: jaw implants, hair transplants, limb lengthening, BBL. High risk, high reward.' },
  { term: 'Cope', def: 'A coping mechanism for suboptimal genetics. Ranges from healthy (gymcelling) to unhealthy (ropefuel). Used ironically in the community.' },
  { term: 'Ascend', def: 'To successfully improve your SMV to a tier where you receive positive social/romantic attention. Opposite of "roping."' },
  { term: 'Mog', def: 'To dominate someone else in looks comparison. If you mog someone, you are visibly more attractive than them.' },
  { term: 'Gymcel', def: 'Someone who spends excessive time at the gym to compensate for poor facial genetics. A healthy cope.' },
  { term: 'Incel', def: '"Involuntarily Celibate" — Someone who desires romantic/sexual relationships but cannot obtain them. The game\'s spiritual origin.' },
  { term: 'Stacy', def: 'A highly attractive woman (SMV 7+). The female equivalent of "Chad." Named after the archetype.' },
  { term: 'Chad', def: 'A highly attractive man (SMV 7+). Genetically gifted with strong jaw, tall height, and perfect hairline.' },
  { term: 'Cope Token', def: 'Metagame currency earned at the end of each run. Spend in the Cope Shop on permanent perks, themes, and memories.' },
  { term: 'Talent Point', def: 'Earned each year (age 18–50). Spend in the Talent Tree on permanent per-run upgrades like Social Butterfly or Gym Rat.' }
];

function _checksum(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export class GameState {
  constructor(activePerks = {}) {
    this.activePerks = activePerks;
    this.gender = 'male';
    this.reset();
  }

  reset(activePerks = null, chosenGender = 'male', difficulty = 'normal') {
    if (activePerks) {
      this.activePerks = activePerks;
    }
    this.gender = chosenGender;
    this.difficulty = difficulty;
    this.name = this.generateRandomName();
    this.age = 18;
    this.cash = (this.activePerks && this.activePerks.rich_uncle) ? 1500 : 500;
    this.ap = 10;

    // Genetic Lottery Roll
    this.height = this.rollHeight();
    this.jaw = this.randomElement(JAW_TYPES);
    this.tilt = this.randomElement(TILT_TYPES);

    if (this.activePerks && this.activePerks.symmetrical_genes) {
      const symRoll = Math.random();
      this.symmetry = symRoll < 0.60 ? 'Symmetrical' : symRoll < 0.90 ? 'Average' : 'Asymmetrical';
    } else {
      this.symmetry = this.randomElement(SYMMETRY_TYPES);
    }

    // Soft / Modifiable stats
    this.hairline = this.rollHairline();
    this.skin = this.randomRange(15, 65);
    this.frame = this.randomRange(15, 65);
    this.style = this.randomRange(10, 50);
    this.confidence = this.randomRange(40, 85);
    this.rizz = this.randomRange(20, 60); // NEW: Rizz stat (0-100)

    this.smv = 4.0;
    this.socialTier = 'NORMIE';
    this.log = [];
    this.isDead = false;
    this._depressionYears = 0;
    this.surgeryBotchedCount = 0;

    // Milestones & accomplishments
    this.hasDatingPartner = false;
    this.partnerName = "";
    this.datingScore = 0;
    this.followers = 0;
    this.hasInfluencerCard = false;
    this.opponentsDefeated = [];

    // Botch tracking
    this.botchedJaw = false;
    this.botchedHair = false;
    this.botchedCanthoplasty = false;

    // NEW: Career system
    this.careerTier = 'unemployed';
    this.promotionChances = 0;

    // NEW: Talent tree
    this.talentPoints = 0;
    this.talents = {};

    // NEW: Substance system
    this.substancesUsed = 0;
    this.activeSubstances = [];
    this.addictionLevel = 0;

    // NEW: Lineage
    this.children = [];
    this.hasProcreated = false;

    // Rival system
    this.rivalName = this.generateRandomName();
    this.rivalDefeatedCount = 0;
    this.rivalLastMilestone = 0;

    // Challenge tracking
    this.challengeId = null;
    this.completedChallenge = false;

    // NEW: Achievements (tracked via localStorage, checked at milestones)
    this.achievementsUnlocked = JSON.parse(localStorage.getItem('looksmax_achievements') || '[]');

    // NEW: Stat timeline for analytics
    this.statTimeline = [];

    this.updateSMV();
    this._protectProperties();
  }

  generateRandomName() {
    if (this.gender === 'female') {
      return `${this.randomElement(FIRST_NAMES_FEMALE)} ${this.randomElement(LAST_NAMES)}`;
    }
    return `${this.randomElement(FIRST_NAMES)} ${this.randomElement(LAST_NAMES)}`;
  }

  randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  rollHeight() {
    const roll = Math.random();
    if (this.gender === 'female') {
      if (roll < 0.05) return this.randomRange(56, 59); // 4'8" - 4'11" (Short)
      if (roll < 0.25) return this.randomRange(60, 62); // 5'0" - 5'2"
      if (roll < 0.70) return this.randomRange(63, 65); // 5'3" - 5'5" (Avg)
      if (roll < 0.92) return this.randomRange(66, 68); // 5'6" - 5'8" (Tall)
      return this.randomRange(69, 72); // 5'9" - 6'0" (Stacy model height)
    } else {
      if (roll < 0.05) return this.randomRange(60, 63); // 5'0" - 5'3" (Short King)
      if (roll < 0.25) return this.randomRange(64, 67); // 5'4" - 5'7"
      if (roll < 0.70) return this.randomRange(68, 71); // 5'8" - 5'11" (Avg)
      if (roll < 0.92) return this.randomRange(72, 74); // 6'0" - 6'2"
      return this.randomRange(75, 78); // 6'3" - 6'6" (Giga Height)
    }
  }

  rollHairline() {
    // Younger guys usually Norwood 1-2, but some bad luck occurs
    const roll = Math.random();
    if (roll < 0.60) return 1; // Perfect
    if (roll < 0.80) return 2; // Maturing
    if (roll < 0.90) return 3; // Receding
    if (roll < 0.96) return 4;
    return this.randomRange(5, 7); // Bald genetics
  }

  /**
   * Calculates the dynamic Sexual Market Value (SMV) on a scale of 1.0 - 10.0
   */
  updateSMV() {
    let score = 5.5;

    // Height Modifier
    if (this.gender === 'female') {
      if (this.height >= 69) score += 1.8;
      else if (this.height >= 66) score += 0.8;
      else if (this.height >= 62) score += 0.0;
      else if (this.height >= 59) score -= 0.8;
      else score -= 2.0;
    } else {
      if (this.height >= 75) score += 2.5;
      else if (this.height >= 72) score += 1.5;
      else if (this.height >= 69) score += 0.0;
      else if (this.height >= 66) score -= 1.2;
      else score -= 2.5;
    }

    // Jaw Modifier
    if (this.jaw === 'Chiseled') score += 2.5;
    else if (this.jaw === 'Sharp') score += 1.2;
    else if (this.jaw === 'Average') score += 0.0;
    else if (this.jaw === 'Soft') score -= 1.0;
    else if (this.jaw === 'Receding') score -= 2.2;

    // Canthal Tilt
    if (this.tilt === 'Positive') score += 1.2;
    else if (this.tilt === 'Negative') score -= 1.5;

    // Symmetry
    if (this.symmetry === 'Symmetrical') score += 1.0;
    else if (this.symmetry === 'Asymmetrical') score -= 1.2;

    // Hairline
    if (this.hairline === 1) score += 1.2;
    else if (this.hairline === 2) score += 0.4;
    else if (this.hairline === 3) score -= 0.2;
    else if (this.hairline === 4) score -= 1.0;
    else score -= 2.5;

    // Skin
    if (this.skin >= 90) score += 1.0;
    else if (this.skin >= 65) score += 0.4;
    else if (this.skin < 30) score -= 1.5;

    // Frame
    if (this.frame >= 80) score += 1.2;
    else if (this.frame >= 60) score += 0.5;
    else if (this.frame < 30) score -= 1.2;

    // Style
    if (this.style >= 80) score += 1.2;
    else if (this.style >= 60) score += 0.5;
    else if (this.style < 30) score -= 1.0;

    // Rizz (NEW: charisma modifier up to ±0.8)
    if (this.rizz >= 80) score += 0.8;
    else if (this.rizz >= 60) score += 0.4;
    else if (this.rizz < 25) score -= 0.5;

    // Botched Surgeries Penalty
    score -= (this.surgeryBotchedCount * 1.5);

    // Career prestige bonus
    const careerMap = { unemployed: 0, entry: 0, junior: 0.1, mid: 0.2, senior: 0.3, manager: 0.4, director: 0.5, executive: 0.6, ceo: 0.8 };
    score += careerMap[this.careerTier] || 0;

    let pslScore = parseFloat((score * 0.8).toFixed(1));
    pslScore = parseFloat(Math.max(1.0, Math.min(8.0, pslScore)).toFixed(1));
    this._smvCache = pslScore;

    // Social Tier Mapping
    if (this.gender === 'female') {
      if (this._smvCache >= 7.2) this.socialTier = 'STACY / ASCENDED';
      else if (this._smvCache >= 6.0) this.socialTier = 'STACYLITE';
      else if (this._smvCache >= 4.8) this.socialTier = 'HIGH TIER BECKY';
      else if (this._smvCache >= 3.6) this.socialTier = 'BECKY';
      else if (this._smvCache >= 2.4) this.socialTier = 'SUB-HUMAN';
      else this.socialTier = 'FEMCEL';
    } else {
      if (this._smvCache >= 7.2) this.socialTier = 'GIGACHAD / ASCENDED';
      else if (this._smvCache >= 6.0) this.socialTier = 'CHADLITE';
      else if (this._smvCache >= 4.8) this.socialTier = 'HIGH TIER NORMAL';
      else if (this._smvCache >= 3.6) this.socialTier = 'NORMIE';
      else if (this._smvCache >= 2.4) this.socialTier = 'SUB-HUMAN';
      else this.socialTier = 'TRUECEL';
    }
  }

  // ACTIONS
  postTikTok(styleId) {
    this._validateState();
    if (this.ap < 2) return { error: "Not enough Action Points (AP). Need 2 AP." };
    if (this.cash < 100) return { error: "Not enough cash. Need $100 for camera/lighting gear." };

    this.ap -= 2;
    this.cash -= 100;

    let views = 0;
    let likes = 0;
    let newFollowers = 0;
    let cashEarned = 0;
    let confidenceEffect = 0;
    let comments = [];

    const isFemale = this.gender === 'female';

    if (styleId === 'sigma_jaw') {
      const hasGoodJaw = this.jaw === 'Chiseled' || this.jaw === 'Sharp';
      if (hasGoodJaw) {
        views = this.randomRange(5000, 25000);
        likes = Math.floor(views * this.randomRange(15, 30) / 100);
        newFollowers = Math.floor(likes * 0.4);
        cashEarned = Math.floor(views * 0.02);
        confidenceEffect = 15;
        comments = [
          isFemale ? "Gigastacy jawline is insane 😭" : "Gigachad jawline is insane 😭",
          "Bro is cut from marble",
          "What is that bone structure?!",
          "Mogged by a shadow flex.",
          "Shadow line goes crazy"
        ];
      } else {
        views = this.randomRange(500, 2000);
        likes = Math.floor(views * this.randomRange(2, 6) / 100);
        newFollowers = Math.floor(likes * 0.1);
        confidenceEffect = -10;
        comments = [
          "Receding jaw detected, delete this",
          "Bro tried to filter his jawline",
          "Bro has no chin support",
          "Underbite flex?",
          "Lmao stick to writing guides"
        ];
      }
    } else if (styleId === 'retinol_glaze') {
      if (this.skin >= 60) {
        views = this.randomRange(4000, 18000);
        likes = Math.floor(views * this.randomRange(12, 25) / 100);
        newFollowers = Math.floor(likes * 0.35);
        cashEarned = Math.floor(views * 0.015);
        confidenceEffect = 10;
        comments = [
          "Glass skin routine please!",
          "That glow is unreal",
          "Bro is literally radiating",
          "Drop the skincare stack",
          "10/10 glazed donut aesthetic"
        ];
      } else {
        views = this.randomRange(300, 1500);
        likes = Math.floor(views * this.randomRange(2, 5) / 100);
        newFollowers = Math.floor(likes * 0.05);
        confidenceEffect = -15;
        comments = [
          "Cystic acne breakout spotted",
          "Need accutane immediately",
          "Is that a pimple or a third eye?",
          "Bro looks greasy, not glazed",
          "Bro needs to wash his pillowcases"
        ];
      }
    } else if (styleId === 'height_flex') {
      const isTall = isFemale ? this.height >= 69 : this.height >= 72;
      if (isTall) {
        views = this.randomRange(6000, 30000);
        likes = Math.floor(views * this.randomRange(15, 35) / 100);
        newFollowers = Math.floor(likes * 0.45);
        cashEarned = Math.floor(views * 0.025);
        confidenceEffect = 20;
        comments = [
          isFemale ? "Model height queen!" : "6'3+ absolute titan",
          "The camera angle is wild",
          "Legs for days",
          "Mogging the ceiling fan",
          "Skeletal frame maxxing"
        ];
      } else {
        views = this.randomRange(400, 2500);
        likes = Math.floor(views * this.randomRange(3, 7) / 100);
        newFollowers = Math.floor(likes * 0.1);
        confidenceEffect = -12;
        comments = [
          "Bro is standing on a stool",
          "Short king energy",
          "Bad camera angle cope",
          "Literally 5'5 framelet",
          "We can see the shoe inserts"
        ];
      }
    } else {
      views = this.randomRange(2000, 10000);
      likes = Math.floor(views * this.randomRange(10, 20) / 100);
      newFollowers = Math.floor(likes * 0.2);
      cashEarned = Math.floor(views * 0.01);
      confidenceEffect = 5;
      comments = [
        "Realest post on the app",
        "Literally me",
        "Cope of the century",
        "Lay down and rot gang",
        "Bro speaks fluent brainrot"
      ];
    }

    this.followers += this._getFollowerBonus(newFollowers);
    this.cash += cashEarned;
    this.confidence = Math.max(0, Math.min(100, this.confidence + confidenceEffect));

    let cardUnlocked = false;
    if (this.followers >= 5000 && !this.hasInfluencerCard) {
      this.hasInfluencerCard = true;
      cardUnlocked = true;
      this.log.push("✨ Unlocked Combat Card: INFLUENCER AURA! (5,000+ followers reached)");
    }

    this.updateSMV();

    return {
      success: true,
      views,
      likes,
      newFollowers,
      cashEarned,
      confidenceEffect,
      comments,
      cardUnlocked,
      totalFollowers: this.followers
    };
  }

  doGym() {
    this._validateState();
    if (this.ap < 2 || this.cash < 100) return false;
    this.ap -= 2;
    this.cash -= 100;
    
    let frameGain = this.randomRange(6, 12);
    if (this.activePerks && this.activePerks.high_metabolism) {
      frameGain = Math.round(frameGain * 1.2);
    }
    const gymRatRank = this.getTalentEffect('gym_rat');
    if (gymRatRank > 0) frameGain = Math.round(frameGain * (1 + 0.15 * gymRatRank));
    this.frame = Math.min(100, this.frame + frameGain);
    
    this.confidence = Math.min(100, this.confidence + this._charismaConfidenceBonus(this.randomRange(3, 8)));
    // Small chance to improve symmetry (posture improvement)
    if (this.symmetry === 'Asymmetrical' && Math.random() < 0.15) {
      this.symmetry = 'Average';
    }
    this.updateSMV();
    return {
      message: `You gym-maxxed! Pumped iron at the local gym. Built your frame and gained self-confidence.`,
      type: 'success'
    };
  }

  doSkincare() {
    this._validateState();
    if (this.ap < 1 || this.cash < 50) return false;
    this.ap -= 1;
    this.cash -= 50;
    let skinGain = this.randomRange(8, 15);
    const skinRank = this.getTalentEffect('skin_whisperer');
    if (skinRank > 0) skinGain = Math.round(skinGain * (1 + 0.15 * skinRank));
    this.skin = Math.min(100, this.skin + skinGain);
    this.confidence = Math.min(100, this.confidence + this._charismaConfidenceBonus(2));
    this.updateSMV();
    return {
      message: `You executed a rigorous 10-step skincare routine (-$50 cash, -1 AP). Skin cleared up.`,
      type: 'success'
    };
  }

  doStyling() {
    this._validateState();
    if (this.ap < 1 || this.cash < 150) return false;
    this.ap -= 1;
    this.cash -= 150;
    let styleGain = this.randomRange(10, 20);
    const fashionRank = this.getTalentEffect('fashion_icon');
    if (fashionRank > 0) styleGain = Math.round(styleGain * (1 + 0.20 * fashionRank));
    this.style = Math.min(100, this.style + styleGain);
    this.confidence = Math.min(100, this.confidence + this._charismaConfidenceBonus(this.randomRange(5, 10)));
    // Hair styling makes you feel like you have better hairline temporarily
    this.updateSMV();
    return {
      message: `You visited a premium stylist, got a fade, and purchased trendy streetwear (-$150 cash, -1 AP). Style stats up!`,
      type: 'success'
    };
  }

  doSocialize() {
    this._validateState();
    if (this.ap < 1 || this.cash < 50) return { error: 'Need 1 AP and $50 to go out.' };
    this.ap -= 1;
    this.cash -= 50;
    const rizzGain = this.randomRange(2, 5);
    const confGain = this.randomRange(3, 8);
    this.rizz = Math.min(100, this.rizz + rizzGain);
    this.confidence = Math.min(100, this.confidence + this._charismaConfidenceBonus(confGain));
    const randEvent = Math.random();
    if (randEvent < 0.10) {
      this.cash -= 80;
      this.log.push('Your night out got expensive. Someone spilled drinks on your outfit.');
      this.updateSMV();
      return { success: true, message: `You went out but a fight broke out. Lost $80. (+${rizzGain} Rizz, +${confGain} Confidence)`, type: 'action' };
    } else if (randEvent < 0.25) {
      const extraRizz = this.randomRange(1, 3);
      this.rizz = Math.min(100, this.rizz + extraRizz);
      this.log.push('You met interesting people and had deep conversations.');
      this.updateSMV();
      return { success: true, message: `Great night! You met a cool crowd. (+${rizzGain + extraRizz} Rizz, +${confGain} Confidence)`, type: 'success' };
    }
    this.updateSMV();
    return { success: true, message: `You went out and socialized. (+${rizzGain} Rizz, +${confGain} Confidence)`, type: 'action' };
  }

  // === CAREER SYSTEM ===
  getCareerList() {
    return CAREER_TIERS.map(t => {
      const isCurrent = this.careerTier === t.id;
      const idx = CAREER_TIERS.findIndex(c => c.id === this.careerTier);
      const reqIdx = CAREER_TIERS.findIndex(c => c.id === t.id);
      const canPromote = reqIdx === idx + 1 && this.smv >= t.reqSMV && this.rizz >= t.reqRizz;
      return { ...t, isCurrent, canPromote };
    });
  }

  doWork() {
    this._validateState();
    const tier = CAREER_TIERS.find(t => t.id === this.careerTier);
    if (!tier || tier.apCost === 0) {
      // Unemployed - can still hustle
      if (this.ap < 1) return false;
      this.ap -= 1;
      this.cash += 200;
      this.confidence = Math.max(0, this.confidence - 3);
      return { message: `You did odd jobs and side hustles. Earned $200 cash. (-1 AP)`, type: 'action' };
    }
    if (this.ap < tier.apCost) return false;
    this.ap -= tier.apCost;
    this.cash += this._getCareerBonus(tier.pay);
    this.confidence = Math.max(0, this.confidence - 3);
    this.updateSMV();
    return {
      message: `You worked as ${tier.title}. Earned $${tier.pay.toLocaleString()} cash. (-${tier.apCost} AP)`,
      type: 'action'
    };
  }

  seekPromotion() {
    this._validateState();
    const idx = CAREER_TIERS.findIndex(t => t.id === this.careerTier);
    if (idx >= CAREER_TIERS.length - 1) return { error: 'Already at the highest career tier (CEO)!' };
    const next = CAREER_TIERS[idx + 1];
    if (this.smv < next.reqSMV) return { error: `Need SMV ${next.reqSMV} to become ${next.title}. Current: ${this.smv}` };
    if (this.rizz < next.reqRizz) return { error: `Need Rizz ${next.reqRizz} to become ${next.title}. Current: ${this.rizz}` };
    if (this.ap < 2) return { error: 'Need 2 AP to network for a promotion.' };
    this.ap -= 2;
    const chance = (this.smv / next.reqSMV) * (this.rizz / Math.max(1, next.reqRizz)) * 0.5;
    if (Math.random() < chance) {
      this.careerTier = next.id;
      this.confidence = Math.min(100, this.confidence + 20);
      this.log.push(`PROMOTED to ${next.title}!`);
      this.updateSMV();
      return { success: true, message: `PROMOTED! You are now ${next.title}! (${next.pay >= 4000 ? `Salary: $${next.pay.toLocaleString()}/year` : ''})`, type: 'success', tier: next };
    } else {
      this.confidence = Math.max(0, this.confidence - 10);
      return { error: `Failed to secure promotion to ${next.title}. Keep building your stats.` };
    }
  }

  // === TALENT TREE ===
  getTalentPoint() {
    this.talentPoints++;
  }

  learnTalent(talentId) {
    const talent = TALENTS.find(t => t.id === talentId);
    if (!talent) return false;
    if (this.talentPoints < 1) return false;
    const currentRank = this.talents[talentId] || 0;
    if (currentRank >= talent.maxRank) return false;
    this.talentPoints--;
    this.talents[talentId] = (this.talents[talentId] || 0) + 1;
    if (talent.effect) talent.effect(this, this.talents[talentId]);
    return true;
  }

  getTalentEffect(talentId) {
    return this.talents[talentId] || 0;
  }

  _charismaConfidenceBonus(gain) {
    const rank = this.getTalentEffect('charisma');
    if (rank > 0) gain = Math.round(gain * (1 + 0.10 * rank));
    return gain;
  }

  _getFollowerBonus(gain) {
    const rank = this.getTalentEffect('tiktok_guru');
    if (rank > 0) gain = Math.round(gain * (1 + 0.25 * rank));
    return gain;
  }

  _getDatingBonus(gain) {
    const rank = this.getTalentEffect('smooth_operator');
    if (rank > 0) gain = Math.round(gain * (1 + 0.15 * rank));
    return gain;
  }

  _getCareerBonus(amount) {
    const rank = this.getTalentEffect('hustler');
    if (rank > 0) amount = Math.round(amount * (1 + 0.20 * rank));
    return amount;
  }

  _getSubstanceRiskReduction() {
    const rank = this.getTalentEffect('iron_stomach');
    return rank > 0 ? (1 - 0.20 * rank) : 1;
  }

  // === SUBSTANCE SYSTEM ===
  takeSubstance(substanceId) {
    this._validateState();
    const sub = SUBSTANCES.find(s => s.id === substanceId);
    if (!sub) return { error: 'Unknown substance.' };
    if (this.cash < sub.cost) return { error: `Need $${sub.cost} for ${sub.name}.` };

    this.cash -= sub.cost;
    this.substancesUsed++;
    this.activeSubstances.push(substanceId);

    // Addiction check
    if (Math.random() < sub.addictionRisk) {
      this.addictionLevel = Math.min(10, this.addictionLevel + 1);
    }

    // Risk check (reduced by iron_stomach talent)
    const finalRisk = sub.risk * this._getSubstanceRiskReduction();
    if (Math.random() < finalRisk) {
      this.skin = Math.max(0, this.skin - 10);
      this.confidence = Math.max(0, this.confidence - 20);
      if (substanceId === 'steroids' && Math.random() < (this.addictionLevel >= 5 ? 0.25 : 0.1)) {
        this.isDead = true;
        this.log.push(`FATAL: ${sub.name} caused cardiac arrest. You died.`);
        return { success: false, message: `FATAL: ${sub.name} caused cardiac arrest. You died.`, type: 'error' };
      }
      if (this.addictionLevel >= 5 && Math.random() < 0.15) {
        this.isDead = true;
        this.log.push(`FATAL OVERDOSE: Your body couldn't handle ${sub.name}.`);
        return { success: false, message: `FATAL OVERDOSE: Your body couldn't handle ${sub.name}. You died.`, type: 'error' };
      }
      return { success: false, message: `BAD REACTION: ${sub.name} caused side effects! (-10 Skin, -20 Confidence)`, type: 'error', effects: sub.effects };
    }

    // Apply effects
    if (sub.effects) {
      if (sub.effects.frame) this.frame = Math.min(100, this.frame + sub.effects.frame);
      if (sub.effects.rizz) this.rizz = Math.min(100, this.rizz + sub.effects.rizz);
      if (sub.effects.skin) this.skin = Math.min(100, this.skin + sub.effects.skin);
      if (sub.effects.style) this.style = Math.min(100, this.style + sub.effects.style);
      if (sub.effects.confidence) this.confidence = Math.min(100, this.confidence + sub.effects.confidence);
    }
    if (sub.sideEffects) {
      if (sub.sideEffects.confidence) this.confidence = Math.max(0, this.confidence + sub.sideEffects.confidence);
      if (sub.sideEffects.frame) this.frame = Math.max(0, this.frame + sub.sideEffects.frame);
    }

    this.updateSMV();
    return { success: true, message: `Took ${sub.name}. ${sub.desc}`, type: 'action' };
  }

  // === ACHIEVEMENTS ===
  checkAchievements() {
    const unlocked = new Set(this.achievementsUnlocked);
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlocked.has(ach.id) && ach.check(this)) {
        unlocked.add(ach.id);
        newlyUnlocked.push(ach);
      }
    });
    this.achievementsUnlocked = [...unlocked];
    localStorage.setItem('looksmax_achievements', JSON.stringify(this.achievementsUnlocked));
    return newlyUnlocked;
  }

  // === SEASONAL EVENTS ===
  checkSeasonalEvent() {
    return SEASONAL_EVENTS.find(e => e.age === this.age);
  }

  // === LINEAGE ===
  procreate() {
    this._validateState();
    if (!this.hasDatingPartner) return { error: 'Need a partner to procreate.' };
    if (this.hasProcreated) return { error: 'Already have a child this run.' };
    if (this.age < 20) return { error: 'Too young to start a family.' };
    this.hasProcreated = true;
    const child = {
      name: this.generateRandomName(),
      gender: Math.random() < 0.5 ? 'male' : 'female',
      // Inherit weighted stats from parent
      height: Math.round(this.height * 0.6 + this.randomRange(50, 80) * 0.4),
      jaw: Math.random() < 0.5 ? this.jaw : this.randomElement(JAW_TYPES),
      tilt: Math.random() < 0.5 ? this.tilt : this.randomElement(TILT_TYPES),
      symmetry: Math.random() < 0.5 ? this.symmetry : this.randomElement(SYMMETRY_TYPES),
      hairline: Math.round(this.hairline * 0.5 + this.randomRange(1, 7) * 0.5),
      skin: Math.round(this.skin * 0.4 + this.randomRange(10, 90) * 0.6),
      frame: Math.round(this.frame * 0.4 + this.randomRange(10, 90) * 0.6),
      rizz: Math.round(this.rizz * 0.3 + this.randomRange(10, 90) * 0.7)
    };
    this.children.push(child);
    this.cash = Math.max(0, this.cash - 2000); // Child costs
    return { success: true, child, message: `You had a child: ${child.name}! They inherit some of your traits.`, type: 'success' };
  }

  doRehab() {
    this._validateState();
    if (this.addictionLevel <= 0) return { error: 'No addiction to treat.' };
    if (this.ap < 2) return { error: 'Need 2 AP for rehab.' };
    if (this.cash < 500) return { error: 'Rehab costs $500.' };
    this.ap -= 2;
    this.cash -= 500;
    const reduction = Math.min(this.addictionLevel, this.randomRange(1, 3));
    this.addictionLevel = Math.max(0, this.addictionLevel - reduction);
    this.confidence = Math.max(0, this.confidence - 5);
    this.log.push(`Completed rehab. Addiction reduced by ${reduction} level(s).`);
    this.updateSMV();
    return { success: true, message: `Rehab complete! Addiction dropped by ${reduction} level(s) (now ${this.addictionLevel}/10).`, type: 'action', reduction };
  }

  checkRivalMilestone() {
    const mil = RIVAL_MILESTONES.find(m => m.age === this.age);
    if (!mil) return null;
    if (this.rivalLastMilestone >= RIVAL_MILESTONES.indexOf(mil) + 1) return null;
    const rivalSMV = parseFloat((this.smv + 0.8 + Math.random() * 0.5).toFixed(1));
    const playerWon = this.smv >= rivalSMV;
    if (playerWon) {
      this.rivalDefeatedCount++;
      this.rivalLastMilestone = RIVAL_MILESTONES.indexOf(mil) + 1;
      this.confidence = Math.min(100, this.confidence + 20);
      this.log.push(`Defeated rival (${mil.title}) at age ${this.age}! SMV: ${this.smv} vs ${rivalSMV}`);
    } else {
      this.confidence = Math.max(0, this.confidence - 15);
      this.log.push(`Lost to rival (${mil.title}) at age ${this.age}. Their SMV: ${rivalSMV}, Mine: ${this.smv}`);
    }
    this.updateSMV();
    return {
      milestone: mil,
      rivalSMV,
      playerWon,
      rivalName: this.rivalName
    };
  }

  applyChallenge(challengeId) {
    this.challengeId = challengeId;
    if (challengeId === 'daily_challenge') {
      const today = new Date();
      const seed = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) { hash = ((hash << 5) - hash) + seed.charCodeAt(i); hash |= 0; }
      this._dailySeed = Math.abs(hash);
    }
    const seedDef = CHALLENGE_SEEDS[challengeId];
    if (seedDef && seedDef.apply) seedDef.apply(this);
  }

  createChildRun(childIndex = 0) {
    if (this.children.length === 0 || !this.children[childIndex]) return null;
    const child = this.children[childIndex];
    const g = new GameState();
    g.name = child.name;
    g.gender = child.gender;
    g.age = 18;
    g.height = child.height;
    g.jaw = child.jaw;
    g.tilt = child.tilt;
    g.symmetry = child.symmetry;
    g.hairline = Math.min(7, Math.max(1, Math.round(child.hairline)));
    g.skin = Math.min(100, Math.max(0, child.skin));
    g.frame = Math.min(100, Math.max(0, child.frame));
    g.rizz = Math.min(100, Math.max(0, child.rizz));
    g.cash = Math.max(500, Math.round(this.cash * 0.3));
    g.confidence = 50;
    g.style = this.randomRange(10, 50);
    g.log = [`Born as ${child.name}, child of ${this.name}. The lineage continues.`];
    g.achievementsUnlocked = JSON.parse(JSON.stringify(this.achievementsUnlocked));
    g.difficulty = this.difficulty;
    g.hasInfluencerCard = false;
    g.updateSMV();
    return g;
  }

  // === STAT TIMELINE ===
  recordStatTimeline() {
    this.statTimeline.push({
      age: this.age,
      smv: this.smv,
      confidence: this.confidence,
      rizz: this.rizz,
      cash: this.cash,
      skin: this.skin,
      frame: this.frame,
      style: this.style
    });
  }

  // === ANTI-CHEAT / INTEGRITY ===
  serializeSigned() {
    const data = this.serialize();
    data._c = _checksum(JSON.stringify(data));
    return data;
  }

  static deserialize(data) {
    const checksum = data._c;
    delete data._c;
    if (checksum && checksum !== _checksum(JSON.stringify(data))) {
      console.warn('[ANTI-CHEAT] Save data integrity check FAILED — tampering detected');
      return null;
    }
    const g = new GameState(data.activePerks || {});
    Object.assign(g, data);
    g._protectProperties();
    return g;
  }

  _protectProperties() {
    // Skip if already protected (non-configurable)
    try {
      const desc = Object.getOwnPropertyDescriptor(this, 'cash');
      if (desc && !desc.configurable) return;
    } catch (e) {}
    const clamped = {
      cash: [0, 100000], ap: [0, 99], height: [48, 96],
      confidence: [0, 100], skin: [0, 100], frame: [0, 100],
      style: [0, 100], rizz: [0, 100],
      hairline: [1, 7], age: [18, 50], followers: [0, 10000000],
      talentPoints: [0, 99], surgeryBotchedCount: [0, 20],
      addictionLevel: [0, 100], promotionChances: [0, 100]
    };
    Object.entries(clamped).forEach(([prop, [min, max]]) => {
      let value = this[prop];
      try {
        Object.defineProperty(this, prop, {
          get() { return value; },
          set(newVal) { value = Math.max(min, Math.min(max, newVal)); },
          enumerable: true,
          configurable: false
        });
      } catch (e) {}
      this[prop] = value;
    });
    // Career tier: only allow known tiers
    const validTiers = ['unemployed', 'entry', 'junior', 'mid', 'senior', 'manager', 'director', 'executive', 'ceo'];
    let _careerTier = validTiers.includes(this.careerTier) ? this.careerTier : 'unemployed';
    Object.defineProperty(this, 'careerTier', {
      get() { return _careerTier; },
      set(v) { _careerTier = validTiers.includes(v) ? v : 'unemployed'; },
      enumerable: true, configurable: false
    });
    this.careerTier = _careerTier;
    // SMV: computed getter, always read from updateSMV()
    Object.defineProperty(this, 'smv', {
      get() { this.updateSMV(); return this._smvCache; },
      set(v) {},
      enumerable: true, configurable: false
    });
    this._smvCache = this.smv;
  }

  _validateState() {
    let reverted = false;
    // Recalculate SMV silently (getter does it)
    const smv = this.smv;
    // Check cash progression: can't have more than reasonable max
    if (this.cash > 100000) { this.cash = 100000; reverted = true; }
    // Check career tier exists
    const validTiers = ['unemployed', 'entry', 'junior', 'mid', 'senior', 'manager', 'director', 'executive', 'ceo'];
    if (!validTiers.includes(this.careerTier)) { this.careerTier = 'unemployed'; reverted = true; }
    // Check no NaN stats
    const numericStats = ['cash','ap','height','confidence','skin','frame','style','rizz','talentPoints','surgeryBotchedCount','addictionLevel','followers'];
    numericStats.forEach(s => {
      if (typeof this[s] !== 'number' || isNaN(this[s]) || !isFinite(this[s])) {
        this[s] = 0;
        reverted = true;
      }
    });
    return reverted;
  }

  validateIntegrity() {
    return !this._validateState();
  }

  // === DEBUG / SERIALIZATION ===
  serialize() {
    return JSON.parse(JSON.stringify({
      name: this.name, age: this.age, gender: this.gender, cash: this.cash, ap: this.ap,
      height: this.height, jaw: this.jaw, tilt: this.tilt, symmetry: this.symmetry,
      hairline: this.hairline, skin: this.skin, frame: this.frame, style: this.style,
      confidence: this.confidence, rizz: this.rizz,
      smv: this.smv, socialTier: this.socialTier,
      isDead: this.isDead, surgeryBotchedCount: this.surgeryBotchedCount,
      hasDatingPartner: this.hasDatingPartner, partnerName: this.partnerName,
      datingScore: this.datingScore, followers: this.followers,
      hasInfluencerCard: this.hasInfluencerCard, opponentsDefeated: this.opponentsDefeated,
      botchedJaw: this.botchedJaw, botchedHair: this.botchedHair, botchedCanthoplasty: this.botchedCanthoplasty,
      careerTier: this.careerTier, talentPoints: this.talentPoints, talents: this.talents,
      substancesUsed: this.substancesUsed, activeSubstances: this.activeSubstances,
      addictionLevel: this.addictionLevel, hasProcreated: this.hasProcreated,
      children: this.children, statTimeline: this.statTimeline,
      activePerks: this.activePerks,
      difficulty: this.difficulty,
      _depressionYears: this._depressionYears,
      rivalName: this.rivalName, rivalDefeatedCount: this.rivalDefeatedCount,
      rivalLastMilestone: this.rivalLastMilestone,
      challengeId: this.challengeId, completedChallenge: this.completedChallenge
    }));
  }

  // SURGERY DETAILS
  getSurgeriesList() {
    const isCheaperHair = this.activePerks && this.activePerks.good_donor_area;
    if (this.gender === 'female') {
      return [
        {
          id: 'jaw_implant',
          name: 'V-Line Jaw Surgery',
          cost: 8000,
          desc: 'Shaves and narrows the jaw bones for a delicate, slim V-shape jawline.',
          risk: 0.12,
          effect: 'Bones: Jawline upgraded to Chiseled (feminine V-line)'
        },
        {
          id: 'leg_lengthening',
          name: 'Brazilian Butt Lift (BBL)',
          cost: 12000,
          desc: 'Transfers harvested fat to hips/glutes for a curvier hourglass frame. Extremely high risk.',
          risk: 0.18,
          effect: 'Bones: Body Frame permanently increased by 40 points'
        },
        {
          id: 'hair_transplant',
          name: 'Hairline Lowering Surgery',
          cost: isCheaperHair ? 3000 : 6000,
          desc: 'Excises a small strip of forehead skin to pull the scalp forward and reduce forehead height.',
          risk: 0.08,
          effect: 'Soft Max: Hairline permanently restored to Ludwig 1'
        },
        {
          id: 'canthoplasty',
          name: 'Almond Eye Surgery (Canthoplasty)',
          cost: 5000,
          desc: 'Tightens the lower eyelid corners to change the eye slope (fox eyes).',
          risk: 0.10,
          effect: 'Bones: Canthal tilt becomes Positive'
        }
      ];
    }
    return [
      {
        id: 'jaw_implant',
        name: 'Jaw Angle Implants',
        cost: 8000,
        desc: 'Inserts custom silicone/porcelain implants to widen and define the jaw.',
        risk: 0.12,
        effect: 'Bones: Jawline upgraded to Chiseled'
      },
      {
        id: 'leg_lengthening',
        name: 'Limb Lengthening Surgery',
        cost: 20000,
        desc: 'Breaks femurs and installs rods to slowly expand bones. Extremely painful.',
        risk: 0.18,
        effect: 'Bones: Height permanently increased by 3 inches'
      },
      {
        id: 'hair_transplant',
        name: 'FUE Hair Transplant',
        cost: isCheaperHair ? 3000 : 6000,
        desc: 'Harvests grafts from back of head to restore the hairline.',
        risk: 0.08,
        effect: 'Soft Max: Hairline permanently restored to Norwood 1'
      },
      {
        id: 'canthoplasty',
        name: 'Almond Eye Surgery (Canthoplasty)',
        cost: 5000,
        desc: 'Tightens the lower eyelid corners to change the eye slope.',
        risk: 0.10,
        effect: 'Bones: Canthal tilt becomes Positive (Hunter eyes)'
      }
    ];
  }

  performSurgery(surgeryId, clinicTier) {
    this._validateState();
    const surgery = this.getSurgeriesList().find(s => s.id === surgeryId);
    if (!surgery) return false;

    // Clinic Multipliers
    let costMult = 1.0;
    let riskMult = 1.0;
    let clinicName = "";

    if (clinicTier === 'turkey') {
      costMult = 0.5;
      riskMult = 2.5;
      clinicName = "a budget clinic in Istanbul, Turkey";
    } else if (clinicTier === 'beverly') {
      costMult = 2.0;
      riskMult = 0.15;
      clinicName = "a high-end clinic in Beverly Hills";
    } else {
      clinicName = "a standard local surgical clinic";
    }

    const finalCost = surgery.cost * costMult;
    const surgeonRank = this.getTalentEffect('surgeon_savvy');
    const finalRisk = surgery.risk * riskMult * (1 - 0.10 * surgeonRank);

    if (this.cash < finalCost) {
      return {
        success: false,
        message: `Insufficient funds for this surgery. You need $${finalCost}.`,
        type: 'error'
      };
    }

    this.cash -= finalCost;
    const roll = Math.random();

    if (roll < finalRisk) {
      // Surgery botched!
      this.surgeryBotchedCount++;
      this.confidence = Math.max(0, this.confidence - 40);
      
      let botchText = "";
      if (surgeryId === 'jaw_implant') {
        this.jaw = 'Receding';
        this.skin = Math.max(0, this.skin - 20);
        this.botchedJaw = true;
        botchText = this.gender === 'female' 
          ? "The V-Line jaw shaving was botched. Left side of the bone chipped causing a lumpy, crooked face asymmetry (-40% Confidence, Jaw ruined, Skin ruined)."
          : "The surgeon botched the jaw implants. The implant migrated, causing asymmetric nerve damage (-40% Confidence, Jaw ruined to Receding, Skin ruined).";
      } else if (surgeryId === 'leg_lengthening') {
        if (Math.random() < 0.4) {
          this.isDead = true;
          this.log.push(`FATAL: Surgery botch during ${surgery.name}.`);
          botchText = this.gender === 'female'
            ? "CATASTROPHIC FAILURE! You contracted a severe fat embolism during the fat transfer. The BBL was fatal. Rest in Peace."
            : "CATASTROPHIC FAILURE! You contracted a severe bone infection (osteomyelitis). The leg lengthening was fatal. Rest in Peace.";
        } else {
          if (this.gender === 'female') {
            this.frame = Math.max(10, this.frame - 35);
            this.skin = Math.max(10, this.skin - 25);
            botchText = "The BBL was botched. Severe necrosis occurred in the fat transfer zone, leaving lumpy scabs and tissue loss (-35 Frame, -25 Skin).";
          } else {
            this.height = Math.max(50, this.height - 4);
            this.frame = Math.max(10, this.frame - 40);
            botchText = "The leg lengthening was botched. You spent a year in agony, and the bones fused poorly. You lost height and frame, and walk with a permanent limp.";
          }
        }
      } else if (surgeryId === 'hair_transplant') {
        this.hairline = 7;
        this.skin = Math.max(0, this.skin - 15);
        this.botchedHair = true;
        botchText = this.gender === 'female'
          ? "The hairline lowering failed. The scar tissue contracted, causing severe hair loss and red suture scarring (-15 Skin, Hair volume Ludwig 3)."
          : "The hair plugs failed to take. Necrosis left permanent scars on your scalp (-15 Skin, Hairline permanently Norwood 7).";
      } else if (surgeryId === 'canthoplasty') {
        this.symmetry = 'Asymmetrical';
        this.tilt = 'Negative';
        this.botchedCanthoplasty = true;
        botchText = "Your eyelids were over-tightened. You can no longer close your eyes fully, leading to chronic dry-eye and asymmetry.";
      }

      this.updateSMV();
      return {
        success: false,
        message: `BOTCHED! You underwent ${surgery.name} at ${clinicName}. ${botchText}`,
        type: 'error'
      };
    } else {
      // Surgery Success!
      let successText = "";
      if (surgeryId === 'jaw_implant') {
        this.jaw = 'Chiseled';
        this.botchedJaw = false;
        successText = this.gender === 'female' 
          ? "Mandible shaved successfully. You now have a perfect V-line face shape."
          : "Your chin is now sharp and chiseled. You look like a model.";
      } else if (surgeryId === 'leg_lengthening') {
        if (this.gender === 'female') {
          this.frame = Math.min(100, this.frame + 40);
          successText = "Your BBL was a complete success! You now have a perfect hourglass frame (+40 Frame).";
        } else {
          this.height += 3;
          successText = "Your femurs successfully healed. You stand 3 inches taller!";
        }
      } else if (surgeryId === 'hair_transplant') {
        this.hairline = 1;
        this.botchedHair = false;
        successText = this.gender === 'female'
          ? "Hairline lowered successfully. Forehead looks perfectly proportioned."
          : "Thick, full hair follicles successfully grafted. Norwood 1 hairline achieved.";
      } else if (surgeryId === 'canthoplasty') {
        this.tilt = 'Positive';
        this.botchedCanthoplasty = false;
        successText = this.gender === 'female'
          ? "Almond-shaped 'fox eyes' created successfully."
          : "Almond-shaped, positive tilt 'hunter eyes' created.";
      }

      this.confidence = Math.min(100, this.confidence + 25);
      this.updateSMV();
      return {
        success: true,
        message: `SUCCESS! You underwent ${surgery.name} at ${clinicName}. ${successText} (+25% Confidence)`,
        type: 'success'
      };
    }
  }

  // YEAR CYCLE & RANDOM EVENTS
  advanceYear() {
    this.age += 1;
    const isHard = this.difficulty === 'hard';
    this.ap = isHard ? 8 : 10;

    this.validateIntegrity();

    // Inflation / passive expenses
    this.cash = Math.max(0, this.cash - (isHard ? 200 : 100));

    // Give a talent point each year
    this.getTalentPoint();

    // Passive aging effects on hairline & skin
    const hairlineChance = isHard ? 0.30 : 0.20;
    const hasFinasteride = this.activeSubstances && this.activeSubstances.includes('finasteride');
    const finalHairlineChance = hasFinasteride ? hairlineChance * 0.5 : hairlineChance;
    if (this.age >= 25 && Math.random() < finalHairlineChance && this.hairline < 7) {
      this.hairline++;
    }
    // Skin degrades slightly after 35
    const skinChance = isHard ? 0.25 : 0.15;
    if (this.age >= 35 && Math.random() < skinChance) {
      this.skin = Math.max(0, this.skin - (isHard ? 5 : 3));
    }
    // Frame degrades after 45
    const frameChance = isHard ? 0.15 : 0.10;
    if (this.age >= 45 && Math.random() < frameChance) {
      this.frame = Math.max(0, this.frame - (isHard ? 5 : 3));
    }
    // Rizz improves with age (wisdom)
    if (this.age >= 30 && Math.random() < 0.20) {
      this.rizz = Math.min(100, this.rizz + 2);
    }
    // Style decays after 35 (fashion trends change, grooming slackens)
    if (this.age >= 35 && Math.random() < 0.15) {
      this.style = Math.max(0, this.style - this.randomRange(2, 4));
    }
    // General confidence erosion from life stress
    if (this.age >= 25 && Math.random() < 0.10) {
      this.confidence = Math.max(0, this.confidence - this.randomRange(2, 3));
    }

    // Relationship maintenance: partner costs 1 AP per year
    if (this.hasDatingPartner) {
      if (this.ap >= 1) {
        this.ap -= 1;
      } else if (Math.random() < 0.25) {
        this.hasDatingPartner = false;
        this.confidence = Math.max(0, this.confidence - 25);
        this.log.push('Your relationship fell apart from neglect.');
      }
    }

    // Depression tracking: if confidence at 0 for 3+ consecutive years → suicide
    if (this.confidence <= 5) {
      this._depressionYears++;
      if (this._depressionYears >= 3) {
        this.isDead = true;
        this.log.push("You succumbed to years of crushing depression.");
        this.updateSMV();
        this.recordStatTimeline();
        return { event: null, seasonal: null, midlifeEvent: null, depression: true };
      }
    } else {
      this._depressionYears = 0;
    }

    // Rival check-in at milestone ages
    const rivalResult = this.checkRivalMilestone();

    this.updateSMV();

    // Record stat timeline
    this.recordStatTimeline();

    // Check for seasonal event
    const seasonal = this.checkSeasonalEvent();

    // Midlife crisis events (age 35-50)
    let midlifeEvent = null;
    if (this.age >= 35 && this.age <= 50 && Math.random() < 0.12) {
      midlifeEvent = this.triggerMidlifeEvent();
    }

    // Trigger random event
    const event = this.triggerRandomEvent();

    return { event, seasonal, midlifeEvent, rivalResult };
  }

  triggerMidlifeEvent() {
    const isFemale = this.gender === 'female';
    const events = [
      {
        title: "Midlife Crisis: Sports Car",
        desc: "You feel the urge to buy a red convertible. Your bank account weeps.",
        effect: (p) => { p.cash = Math.max(0, p.cash - 5000); p.confidence = Math.min(100, p.confidence + 15); },
        impactText: "-$5,000 Cash, +15% Confidence (but at what cost?)",
        icon: "🏎️"
      },
      {
        title: "Midlife Crisis: Tattoo",
        desc: isFemale ? "You get a massive back tattoo of a phoenix. Regret incoming." : "You get a full sleeve tattoo of a dragon. Your mom is disappointed.",
        effect: (p) => { p.style = Math.min(100, p.style + 10); p.cash = Math.max(0, p.cash - 1000); },
        impactText: "+10 Style, -$1,000 Cash",
        icon: "💉"
      },
      {
        title: "Philosophical Awakening",
        desc: "You realize life is meaningless and stats are arbitrary. Inner peace achieved.",
        effect: (p) => { p.confidence = Math.min(100, p.confidence + 20); p.rizz = Math.min(100, p.rizz + 10); },
        impactText: "+20% Confidence, +10 Rizz",
        icon: "🧘"
      },
      {
        title: "Divorce Proceedings",
        desc: isFemale ? "Your husband leaves you for a younger Stacy. The alimony is brutal." : "Your wife takes half your assets. The legal fees pile up.",
        effect: (p) => { p.cash = Math.max(0, Math.round(p.cash * 0.5)); p.confidence = Math.max(0, p.confidence - 30); p.hasDatingPartner = false; },
        impactText: "-50% Cash, -30% Confidence",
        icon: "⚖️"
      }
    ];
    const ev = this.randomElement(events);
    ev.effect(this);
    this.updateSMV();
    return ev;
  }

  triggerRandomEvent() {
    const isFemale = this.gender === 'female';
    const events = [
      {
        title: "Acne Outbreak",
        desc: "Hormonal changes trigger a severe cystic breakout on your T-zone.",
        effect: (p) => { p.skin = Math.max(0, p.skin - 20); p.confidence = Math.max(0, p.confidence - 15); },
        impactText: "-20 Skin Quality, -15% Confidence",
        icon: "🚨"
      },
      {
        title: isFemale ? "Found a Great Stylist" : "Found a Great Barber",
        desc: isFemale 
          ? "You stumble into a premium hair salon for a blowout and styling."
          : "You stumble into an old-school Turkish barber who executes the perfect skin fade.",
        effect: (p) => { p.style = Math.min(100, p.style + 15); p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+15 Style, +10% Confidence",
        icon: "✂️"
      },
      {
        title: "Bad Breakup",
        desc: isFemale
          ? "Your partner laughs at your contouring and leaves you for a 10/10 Stacy."
          : "Your partner laughs at your height inserts and leaves you for a 6'3 gym instructor.",
        effect: (p) => { p.confidence = Math.max(0, p.confidence - 30); p.hasDatingPartner = false; },
        impactText: "-30% Confidence, Dating status reset to Single",
        icon: "💔"
      },
      {
        title: "Grandpa's Legacy",
        desc: "You inherit a small sum of savings tucked away inside an old military footlocker.",
        effect: (p) => { p.cash += 3500; },
        impactText: "+$3,500 Cash",
        icon: "💰"
      },
      {
        title: isFemale ? "Pilates Influencer Mentorship" : "Gym Bro Mentorship",
        desc: isFemale
          ? "A fitness coach takes you under her wing and teaches you how to tone and shape your frame."
          : "A giant gym instructor takes you under his wing and teaches you how to bulk properly.",
        effect: (p) => { p.frame = Math.min(100, p.frame + 18); p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+18 Frame, +10% Confidence",
        icon: "💪"
      },
      {
        title: "Job Promotion",
        desc: "Your hard work pays off. You are promoted to senior analyst, giving you a budget boost.",
        effect: (p) => { p.cash += 2500; p.confidence = Math.min(100, p.confidence + 15); },
        impactText: "+$2,500 Cash, +15% Confidence",
        icon: "📈"
      },
      {
        title: "Skincare Breakthrough",
        desc: "A dermatologist prescribes you a custom retinol regime that cleans your face completely.",
        effect: (p) => { p.skin = Math.min(100, p.skin + 25); },
        impactText: "+25 Skin Quality",
        icon: "🧪"
      },
      {
        title: "Public Roast",
        desc: "A group of teenagers film you walking down the street and post a TikTok mocking your style.",
        effect: (p) => { p.confidence = Math.max(0, p.confidence - 25); },
        impactText: "-25% Confidence",
        icon: "📱"
      },
      {
        title: "Found $50 on the Sidewalk",
        desc: "You spot a crisp bill lying under a park bench.",
        effect: (p) => { p.cash += 50; },
        impactText: "+$50 Cash",
        icon: "💵"
      },
      {
        title: "Allergic Reaction",
        desc: "You try a cheap moisturizer, causing your face to break out in red blotches.",
        effect: (p) => { p.skin = Math.max(0, p.skin - 15); },
        impactText: "-15 Skin Quality",
        icon: "🤒"
      },
      {
        title: "Viral TikTok Moment",
        desc: "A random video of you gets 100k views! Your follower count explodes.",
        effect: (p) => { p.followers += 2000; p.cash += 500; p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+2,000 Followers, +$500 Cash, +10% Confidence",
        icon: "📱"
      },
      {
        title: "Rizz Workshop",
        desc: "You attend a confidence seminar and learn some killer pick-up lines.",
        effect: (p) => { p.rizz = Math.min(100, p.rizz + 12); p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+12 Rizz, +10% Confidence",
        icon: "💬"
      },
      {
        title: "Fashion Week Invite",
        desc: "You get invited to a fashion show. Your style game levels up.",
        effect: (p) => { p.style = Math.min(100, p.style + 15); p.rizz = Math.min(100, p.rizz + 5); },
        impactText: "+15 Style, +5 Rizz",
        icon: "👔"
      },
      {
        title: "Gym Injury",
        desc: "You overdo it at the gym and pull a muscle. Setback on your frame.",
        effect: (p) => { p.frame = Math.max(0, p.frame - 10); p.cash = Math.max(0, p.cash - 200); },
        impactText: "-10 Frame, -$200 Medical Bills",
        icon: "🤕"
      },
      {
        title: "Unexpected Bonus",
        desc: "Your company gives you a surprise bonus for your hard work!",
        effect: (p) => { p.cash += 3000; p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+$3,000 Cash, +10% Confidence",
        icon: "🎊"
      },
      {
        title: "Hair Transplant Deal",
        desc: "A clinic offers a BOGO deal on hair transplants. You can't say no.",
        effect: (p) => { p.style = Math.min(100, p.style + 8); p.cash = Math.max(0, p.cash - 1500); },
        impactText: "+8 Style, -$1,500 Cash",
        icon: "💇"
      },
      {
        title: "Expo Hall Free Samples",
        desc: "You wander into a beauty expo and grab a bag of premium skincare samples.",
        effect: (p) => { p.skin = Math.min(100, p.skin + 10); },
        impactText: "+10 Skin Quality",
        icon: "🎁"
      },
      {
        title: "Identity Theft Scare",
        desc: "Someone drains your bank account. You recover most of it but the stress lingers.",
        effect: (p) => { p.cash = Math.max(0, p.cash - 800); p.confidence = Math.max(0, p.confidence - 10); },
        impactText: "-$800 Cash, -10% Confidence",
        icon: "🚨"
      },
      {
        title: "Compliment from a Stranger",
        desc: isFemale ? "A girl tells you your eyeliner is sharp enough to kill." : "A random girl says you smell nice. You ride this high for weeks.",
        effect: (p) => { p.confidence = Math.min(100, p.confidence + 12); p.rizz = Math.min(100, p.rizz + 3); },
        impactText: "+12% Confidence, +3 Rizz",
        icon: "💬"
      },
      {
        title: "Lucky Lottery Scratch",
        desc: "You buy a scratch card on a whim and actually win something for once.",
        effect: (p) => { p.cash += 500; },
        impactText: "+$500 Cash",
        icon: "🍀"
      },
      {
        title: "Bad Hair Day Gone Viral",
        desc: "A photo of your disastrous bedhead gets 50k likes. Embarrassing but you gain followers.",
        effect: (p) => { p.followers += 800; p.confidence = Math.max(0, p.confidence - 8); },
        impactText: "+800 Followers, -8% Confidence",
        icon: "🤳"
      },
      {
        title: "Free Gym Membership",
        desc: "A new gym opens in your area and offers a free year. Frame gains are cheaper!",
        effect: (p) => { p.frame = Math.min(100, p.frame + 10); p.cash = Math.max(0, p.cash - 100); },
        impactText: "+10 Frame, -$100 Admin Fee",
        icon: "🏋️"
      }
    ];

    const ev = this.randomElement(events);
    ev.effect(this);
    this.updateSMV();
    return ev;
  }
}
