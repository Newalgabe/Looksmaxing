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
  { id: 'social_butterfly', name: 'Social Butterfly', desc: '+5 Rizz per rank', maxRank: 3, effect: (p, rank) => { p.rizz = Math.min(100, p.rizz + 5 * rank); } },
  { id: 'gym_rat', name: 'Gym Rat', desc: '+15% Frame gains per rank', maxRank: 3, effect: null },
  { id: 'skin_whisperer', name: 'Skin Whisperer', desc: '+15% Skin gains per rank', maxRank: 3, effect: null },
  { id: 'fashion_icon', name: 'Fashion Icon', desc: '+20% Style gains per rank', maxRank: 3, effect: null },
  { id: 'charisma', name: 'Charisma', desc: '+10% Confidence cap per rank', maxRank: 3, effect: null },
  { id: 'surgeon_savvy', name: 'Surgeon Savvy', desc: '-10% Surgery risk per rank', maxRank: 3, effect: null }
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
  { id: 'heartbreaker', name: 'Heartbreaker', desc: 'Date 3+ different partners across runs.', icon: '💔', check: (p) => false },
  { id: 'mogger', name: 'Ultimate Mogger', desc: 'Defeat all opponents in battle.', icon: '🏆', check: (p) => p.opponentsDefeated.length >= 8 },
  { id: 'ceo_grind', name: 'CEO Grindset', desc: 'Reach CEO career tier.', icon: '💼', check: (p) => p.careerTier === 'ceo' },
  { id: 'surgeon_savvy_ach', name: 'Natural Beauty', desc: 'Complete a run with 0 surgeries.', icon: '🌿', check: (p) => p.surgeryBotchedCount === 0 },
  { id: 'addict', name: 'Substance Abuser', desc: 'Take 5+ substances in one run.', icon: '💊', check: (p) => p.substancesUsed >= 5 },
  { id: 'centenarian', name: 'Elder', desc: 'Reach age 50.', icon: '👴', check: (p) => p.age >= 50 },
  { id: 'rizzler', name: 'Rizz God', desc: 'Reach 100 Rizz.', icon: '🔥', check: (p) => p.rizz >= 100 }
];

// Seasonal events
export const SEASONAL_EVENTS = [
  { id: 'new_year', name: 'New Year', desc: 'A fresh start! Everybody is at the gym.', icon: '🎉', age: 19, effect: (p) => { p.confidence = Math.min(100, p.confidence + 10); } },
  { id: 'summer', name: 'Summer Beach Season', desc: 'Beach body season. Social pressure is high.', icon: '🏖️', age: 21, effect: (p) => { if (p.smv < 4) p.confidence = Math.max(0, p.confidence - 10); else p.style = Math.min(100, p.style + 5); } },
  { id: 'halloween', name: 'Halloween', desc: 'Wear a mask and be whoever you want.', icon: '🎃', age: 23, effect: (p) => { p.confidence = Math.min(100, p.confidence + 5); } },
  { id: 'christmas', name: 'Christmas', desc: 'Holiday cheer! Family gatherings.', icon: '🎄', age: 25, effect: (p) => { p.cash += 200; } },
  { id: 'valentine', name: 'Valentine\'s Day', desc: 'Love is in the air... or not.', icon: '💝', age: 27, effect: (p) => { if (p.hasDatingPartner) p.confidence = Math.min(100, p.confidence + 15); else p.confidence = Math.max(0, p.confidence - 10); } }
];

export class GameState {
  constructor(activePerks = {}) {
    this.activePerks = activePerks;
    this.gender = 'male';
    this.reset();
  }

  reset(activePerks = null, chosenGender = 'male') {
    if (activePerks) {
      this.activePerks = activePerks;
    }
    this.gender = chosenGender;
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

    // NEW: Achievements (tracked via localStorage, checked at milestones)
    this.achievementsUnlocked = JSON.parse(localStorage.getItem('looksmax_achievements') || '[]');

    // NEW: Stat timeline for analytics
    this.statTimeline = [];

    this.updateSMV();
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
    this.smv = parseFloat(Math.max(1.0, Math.min(8.0, pslScore)).toFixed(1));

    // Social Tier Mapping
    if (this.gender === 'female') {
      if (this.smv >= 7.2) this.socialTier = 'STACY / ASCENDED';
      else if (this.smv >= 6.0) this.socialTier = 'STACYLITE';
      else if (this.smv >= 4.8) this.socialTier = 'HIGH TIER BECKY';
      else if (this.smv >= 3.6) this.socialTier = 'BECKY';
      else if (this.smv >= 2.4) this.socialTier = 'SUB-HUMAN';
      else this.socialTier = 'FEMCEL';
    } else {
      if (this.smv >= 7.2) this.socialTier = 'GIGACHAD / ASCENDED';
      else if (this.smv >= 6.0) this.socialTier = 'CHADLITE';
      else if (this.smv >= 4.8) this.socialTier = 'HIGH TIER NORMAL';
      else if (this.smv >= 3.6) this.socialTier = 'NORMIE';
      else if (this.smv >= 2.4) this.socialTier = 'SUB-HUMAN';
      else this.socialTier = 'TRUECEL';
    }
  }

  // ACTIONS
  postTikTok(styleId) {
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

    this.followers += newFollowers;
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
    if (this.ap < 2 || this.cash < 100) return false;
    this.ap -= 2;
    this.cash -= 100;
    
    let frameGain = this.randomRange(6, 12);
    if (this.activePerks && this.activePerks.high_metabolism) {
      frameGain = Math.round(frameGain * 1.2);
    }
    this.frame = Math.min(100, this.frame + frameGain);
    
    this.confidence = Math.min(100, this.confidence + this.randomRange(3, 8));
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
    if (this.ap < 1 || this.cash < 50) return false;
    this.ap -= 1;
    this.cash -= 50;
    this.skin = Math.min(100, this.skin + this.randomRange(8, 15));
    this.confidence = Math.min(100, this.confidence + 2);
    this.updateSMV();
    return {
      message: `You executed a rigorous 10-step skincare routine (-$50 cash, -1 AP). Skin cleared up.`,
      type: 'success'
    };
  }

  doStyling() {
    if (this.ap < 1 || this.cash < 150) return false;
    this.ap -= 1;
    this.cash -= 150;
    this.style = Math.min(100, this.style + this.randomRange(10, 20));
    this.confidence = Math.min(100, this.confidence + this.randomRange(5, 10));
    // Hair styling makes you feel like you have better hairline temporarily
    this.updateSMV();
    return {
      message: `You visited a premium stylist, got a fade, and purchased trendy streetwear (-$150 cash, -1 AP). Style stats up!`,
      type: 'success'
    };
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
    this.cash += tier.pay;
    this.confidence = Math.max(0, this.confidence - 3);
    this.updateSMV();
    return {
      message: `You worked as ${tier.title}. Earned $${tier.pay.toLocaleString()} cash. (-${tier.apCost} AP)`,
      type: 'action'
    };
  }

  seekPromotion() {
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

  // === SUBSTANCE SYSTEM ===
  takeSubstance(substanceId) {
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

    // Risk check
    if (Math.random() < sub.risk) {
      this.skin = Math.max(0, this.skin - 10);
      this.confidence = Math.max(0, this.confidence - 20);
      if (substanceId === 'steroids' && Math.random() < 0.1) {
        this.isDead = true;
        return { success: false, message: `FATAL: ${sub.name} caused cardiac arrest. You died.`, type: 'error' };
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
      activePerks: this.activePerks
    }));
  }

  static deserialize(data) {
    const g = new GameState(data.activePerks || {});
    Object.assign(g, data);
    return g;
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
    const finalRisk = surgery.risk * riskMult;

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
    this.ap = 10;

    // Inflation / passive expenses
    this.cash = Math.max(0, this.cash - 100);

    // Give a talent point each year
    this.getTalentPoint();

    // Passive aging effects on hairline & skin
    if (this.age >= 25 && Math.random() < 0.20 && this.hairline < 7) {
      this.hairline++;
    }
    // Skin degrades slightly after 35
    if (this.age >= 35 && Math.random() < 0.15) {
      this.skin = Math.max(0, this.skin - 3);
    }
    // Frame degrades after 45
    if (this.age >= 45 && Math.random() < 0.10) {
      this.frame = Math.max(0, this.frame - 3);
    }
    // Rizz improves with age (wisdom)
    if (this.age >= 30 && Math.random() < 0.20) {
      this.rizz = Math.min(100, this.rizz + 2);
    }

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

    return { event, seasonal, midlifeEvent };
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
      }
    ];

    const ev = this.randomElement(events);
    ev.effect(this);
    this.updateSMV();
    return ev;
  }
}
