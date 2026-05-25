export class DatingSimulator {
  constructor(playerState, onLogCallback) {
    this.player = playerState;
    this.logCallback = onLogCallback;
    this.currentProfile = null;
    this.activeChat = null;
    this.goldSubscription = false;
    this.activeDateRound = 0;
    this.dateRoundsCompleted = 0;

    // Looksmaxxing terms that will offend non-egirl dates
    this.looksmaxxingTerms = [
      'canthal tilt', 'canthal', 'psl', 'smv', 'norwood', 'looksmax',
      'looksmaxing', 'mewing', 'soft max', 'softmax', 'hard max', 'hardmax',
      'jawline', 'zygomatic', 'orbitals', 'eswt', 'bonesmash', 'bone smash',
      'ascending', 'descending', 'mog', 'mogger', 'chad', 'incel',
      'lookcel', 'blackpill', 'bluepill', 'redpill', 'copemax',
      'grimace', 'shrinkwrap', 'lefort', 'bimax', 'rhino',
      'giga', 'gigachad', 'stacylite', 'normie', 'truecel'
    ];

    // Build app-specific profile pools
    this.profiles = this.player.gender === 'female' ? this.getFemaleProfiles() : this.getMaleProfiles();
    this._buildAppPools();

    this.activeApp = 'slidr';
    this.showAppHome = true;
    this.ghostedProfiles = [];
    this.banWarning = false;
    this.bannedApps = [];

    this.dateBattle = null;
    this.activeEvent = null;
    this.rollProfile();
  }

  // === MULTI-APP ECOSYSTEM ===
  static APPS = [
    {
      id: 'slidr', name: 'Slidr', icon: '🔥',
      color: '#ff007f', desc: 'The wild west of dating. High variance, free to swipe.',
      unlock: () => true,
      matchMult: 0.8, ghostChance: 0.25,
      bioBonus: false, instantMatch: false, cashDrain: 0
    },
    {
      id: 'hinged', name: 'Hinged', icon: '💎',
      color: '#00f0ff', desc: 'Career-minded connection. Bio matters here.',
      unlock: (p) => (p.careerLevel || 0) >= 3 || (p.status || 0) > 30,
      matchMult: 1.0, ghostChance: 0.1,
      bioBonus: true, instantMatch: false, cashDrain: 0
    },
    {
      id: 'luxymog', name: 'LuxyMog', icon: '👑',
      color: '#f1fa8c', desc: 'Elite only. Beauty is the entry fee.',
      unlock: (p) => p.smv >= 7.0 || (p.style || 0) >= 80,
      matchMult: 1.5, ghostChance: 0.05,
      bioBonus: false, instantMatch: true, cashDrain: 0
    },
    {
      id: 'sugargrind', name: 'SugarGrind', icon: '💰',
      color: '#50fa7b', desc: 'Wealth is the only currency. Bypasses looks entirely.',
      unlock: (p) => p.cash >= 50000,
      matchMult: 2.0, ghostChance: 0,
      bioBonus: false, instantMatch: false, cashDrain: 500
    }
  ];

  _buildAppPools() {
    this.appPools = { slidr: [], hinged: [], luxymog: [], sugargrind: [] };
    for (const prof of this.profiles) {
      // Auto-assign apps based on archetype + profile traits
      let app = 'slidr';
      if (prof.archetype === 'gold_digger') app = 'sugargrind';
      else if (prof.archetype === 'corporate') app = 'hinged';
      else if (prof.archetype === 'lookist') app = 'luxymog';
      else if (prof.name === 'Tyrone' || prof.name === 'Chloe') app = 'luxymog'; // alt/lookist crossover
      this.appPools[app].push(prof);
    }
  }

  getUnlockedApps() {
    const p = this.player;
    return DatingSimulator.APPS.filter(a => a.unlock(p) && !this.bannedApps.includes(a.id)).map(a => a.id);
  }

  getActiveAppDef() {
    return DatingSimulator.APPS.find(a => a.id === this.activeApp) || DatingSimulator.APPS[0];
  }

  switchApp(appId) {
    if (!this.getUnlockedApps().includes(appId)) return false;
    if (this.bannedApps.includes(appId)) {
      this.logCallback(`🚫 You've been banned from ${appId}!`, 'error');
      return false;
    }
    this.activeApp = appId;
    this.banWarning = false;
    this.rollProfile();
    return true;
  }

  // === LOOKSMAXXING TERM DETECTION ===
  containsLooksmaxxing(text) {
    const lower = text.toLowerCase();
    return this.looksmaxxingTerms.some(term => lower.includes(term));
  }

  // === INTERACTIVE CHAT SIMULATOR ===
  static CHAT_TREES = {
    normie: [
      {
        id: 'opener', prompt: (n) => `Hey! Saw your profile. What's up?`,
        choices: [
          { text: '"Not much, just working and hitting the gym. You?"', stat: null, statVal: 0, interest: 15, ghostCost: 0, next: 'deep' },
          { text: '"Honestly? Kinda nervous. Your pics are really cute though."', stat: 'rizz', statVal: 30, interest: 20, ghostCost: 0, next: 'deep' },
          { text: '"You have a great smile. Let\'s skip the small talk?"', stat: null, statVal: 0, interest: 5, ghostCost: 1, next: 'deep' },
          { text: '"Your canthal tilt is immaculate. Very PSL."', stat: null, statVal: 0, interest: -30, ghostCost: 0, next: null, fail: 'creep' }
        ]
      },
      {
        id: 'deep', prompt: (n) => `That's sweet! So what do you actually do for fun?`,
        choices: [
          { text: '"Travel, try new restaurants, the usual. But I\'d rather hear about you."', stat: 'rizz', statVal: 40, interest: 20, ghostCost: 0, next: 'closer' },
          { text: '"Work keeps me busy but I make time for what matters."', stat: 'careerLevel', statVal: 2, interest: 15, ghostCost: 0, next: 'closer' },
          { text: '"Mostly gaming and hanging with friends."', stat: null, statVal: 0, interest: 5, ghostCost: 1, next: 'closer' },
          { text: '"I\'ve been really focused on looksmaxxing my zygos."', stat: null, statVal: 0, interest: -25, ghostCost: 0, next: null, fail: 'creep' }
        ]
      },
      {
        id: 'closer', prompt: (n) => `Okay you seem cool. What are you looking for on here?`,
        choices: [
          { text: '"Someone genuine to explore the city with. You free this weekend?"', stat: null, statVal: 0, interest: 25, ghostCost: 0, next: 'secured' },
          { text: '"Honestly? I\'d rather show you in person. Drinks?"', stat: 'rizz', statVal: 50, interest: 30, ghostCost: 0, next: 'secured' },
          { text: '"Not sure yet, seeing where things go."', stat: null, statVal: 0, interest: 0, ghostCost: 1, next: 'closer' },
          { text: '"I\'m looking for someone who appreciates good bone structure."', stat: null, statVal: 0, interest: -20, ghostCost: 0, next: null, fail: 'creep' }
        ]
      }
    ],
    lookist: [
      {
        id: 'opener', prompt: (n) => `${n} studies your profile silently. "Alright, talk to me."`,
        choices: [
          { text: '"Your aesthetic is incredible. Where do you train?"', stat: 'frame', statVal: 50, interest: 25, ghostCost: 0, next: 'deep' },
          { text: '"I\'ve been working on my jawline. Mind if I pick your brain?"', stat: 'smv', statVal: 5.5, interest: 20, ghostCost: 0, next: 'deep' },
          { text: '"Honestly, your profile is one of the best I\'ve seen."', stat: null, statVal: 0, interest: 5, ghostCost: 1, next: 'deep' },
          { text: '"Great PSL. I\'d rate you a solid 8."', stat: null, statVal: 0, interest: -15, ghostCost: 0, next: null, fail: 'creep' }
        ]
      },
      {
        id: 'deep', prompt: (n) => `"Interesting. You clearly take care of yourself. What's your routine?"`,
        choices: [
          { text: '"Gym 5x a week, strict diet, good sleep. The basics but I\'m consistent."', stat: 'frame', statVal: 60, interest: 25, ghostCost: 0, next: 'closer' },
          { text: '"I invest in skincare, treatments, the works. Looking good takes effort."', stat: 'skin', statVal: 60, interest: 20, ghostCost: 0, next: 'closer' },
          { text: '"I just try to stay active. Nothing crazy."', stat: null, statVal: 0, interest: 0, ghostCost: 1, next: 'closer' },
          { text: '"Mewing, bonesmashing, the whole PSL protocol."', stat: null, statVal: 0, interest: -25, ghostCost: 0, next: null, fail: 'creep' }
        ]
      },
      {
        id: 'closer', prompt: (n) => `"Good answer. I like someone with discipline. So... what now?"`,
        choices: [
          { text: '"Let\'s grab a drink and see if the chemistry matches the profiles."', stat: null, statVal: 0, interest: 30, ghostCost: 0, next: 'secured' },
          { text: '"I know a great spot with amazing lighting. Trust me."', stat: 'rizz', statVal: 45, interest: 35, ghostCost: 0, next: 'secured' },
          { text: '"Up to you — I\'m flexible."', stat: null, statVal: 0, interest: 5, ghostCost: 1, next: 'closer' }
        ]
      }
    ],
    egirl: [
      {
        id: 'opener', prompt: (n) => `"omg your vibe is immaculate. talk to me."`,
        choices: [
          { text: '"Your aesthetic is everything. Where\'d you get that fit?"', stat: 'style', statVal: 50, interest: 25, ghostCost: 0, next: 'deep' },
          { text: '"Honestly I was hoping you\'d match. Your playlist profile is fire."', stat: null, statVal: 0, interest: 20, ghostCost: 0, next: 'deep' },
          { text: '"Hey, what\'s up?"', stat: null, statVal: 0, interest: 0, ghostCost: 1, next: 'deep' },
          { text: '"Your canthal tilt is insane. True Hunter eyes."', stat: null, statVal: 0, interest: 15, ghostCost: 0, next: 'deep' }
        ]
      },
      {
        id: 'deep', prompt: (n) => `"u get it. finally someone w taste. so what r u into?"`,
        choices: [
          { text: '"Music, art, getting lost in the city. I go where the vibe takes me."', stat: 'rizz', statVal: 40, interest: 25, ghostCost: 0, next: 'closer' },
          { text: '"Honestly? I\'m just tryna find someone to send memes to at 2am."', stat: null, statVal: 0, interest: 20, ghostCost: 0, next: 'closer' },
          { text: '"Work and gym mostly. Pretty basic."', stat: null, statVal: 0, interest: -5, ghostCost: 1, next: 'closer' }
        ]
      },
      {
        id: 'closer', prompt: (n) => `"ok i fw the vibe. let's do something fr fr."`,
        choices: [
          { text: '"Let\'s hit a show this weekend. I know a spot."', stat: null, statVal: 0, interest: 30, ghostCost: 0, next: 'secured' },
          { text: '"Send me your location, I\'m coming to get you."', stat: 'rizz', statVal: 55, interest: 35, ghostCost: 0, next: 'secured' },
          { text: '"Yeah maybe, we\'ll see."', stat: null, statVal: 0, interest: -10, ghostCost: 2, next: 'closer' }
        ]
      }
    ],
    gold_digger: [
      {
        id: 'opener', prompt: (n) => `"So. What do you do for a living?"`,
        choices: [
          { text: '"I run my own business. Keeps me busy but the upside is real."', stat: 'careerLevel', statVal: 3, interest: 30, ghostCost: 0, next: 'deep' },
          { text: '"I\'m in finance. Let\'s just say the portfolio is healthy."', stat: 'cash', statVal: 30000, interest: 25, ghostCost: 0, next: 'deep' },
          { text: '"I have a job. It pays the bills."', stat: null, statVal: 0, interest: -5, ghostCost: 1, next: 'deep' },
          { text: '"I\'m between things right now, but I have big plans."', stat: null, statVal: 0, interest: -20, ghostCost: 0, next: null, fail: 'ghost' }
        ]
      },
      {
        id: 'deep', prompt: (n) => `"Interesting. And what do you like to spend your money on?"`,
        choices: [
          { text: '"Experiences. Travel, fine dining, the occasional splurge."', stat: 'cash', statVal: 20000, interest: 25, ghostCost: 0, next: 'closer' },
          { text: '"I invest mostly. But I know how to treat someone special."', stat: null, statVal: 0, interest: 20, ghostCost: 0, next: 'closer' },
          { text: '"I don\'t really spend much. Saving for a rainy day."', stat: null, statVal: 0, interest: -10, ghostCost: 1, next: 'closer' }
        ]
      },
      {
        id: 'closer', prompt: (n) => `"I like someone ambitious. So, what's your plan for us?"`,
        choices: [
          { text: '"Let me take you somewhere unforgettable. My treat."', stat: 'cash', statVal: 10000, interest: 35, ghostCost: 0, next: 'secured' },
          { text: '"I think we could build something great together. Let\'s start with dinner."', stat: null, statVal: 0, interest: 25, ghostCost: 0, next: 'secured' },
          { text: '"Whatever you\'re comfortable with."', stat: null, statVal: 0, interest: -5, ghostCost: 1, next: 'closer' }
        ]
      }
    ],
    corporate: [
      {
        id: 'opener', prompt: (n) => `"Your profile stood out. Let's see if the conversation matches."`,
        choices: [
          { text: '"I appreciate directness. What caught your eye?"', stat: 'rizz', statVal: 35, interest: 20, ghostCost: 0, next: 'deep' },
          { text: '"I like your approach. Most people just say hey."', stat: null, statVal: 0, interest: 15, ghostCost: 0, next: 'deep' },
          { text: '"Hey, how\'s your week going?"', stat: null, statVal: 0, interest: 0, ghostCost: 1, next: 'deep' }
        ]
      },
      {
        id: 'deep', prompt: (n) => `"I'm curious — what drives you?"`,
        choices: [
          { text: '"Growth. I\'m always trying to level up in every area."', stat: 'careerLevel', statVal: 2, interest: 25, ghostCost: 0, next: 'closer' },
          { text: '"Building something meaningful. What about you?"', stat: null, statVal: 0, interest: 20, ghostCost: 0, next: 'closer' },
          { text: '"Honestly? A comfortable life."', stat: null, statVal: 0, interest: 0, ghostCost: 1, next: 'closer' }
        ]
      },
      {
        id: 'closer', prompt: (n) => `"Good answer. I value ambition. Let's not waste time."`,
        choices: [
          { text: '"Drinks this week? I know a place with the right atmosphere."', stat: null, statVal: 0, interest: 30, ghostCost: 0, next: 'secured' },
          { text: '"Let me schedule something. I\'ll make it worth your time."', stat: 'cash', statVal: 5000, interest: 35, ghostCost: 0, next: 'secured' },
          { text: '"Yeah, we should do something sometime."', stat: null, statVal: 0, interest: 0, ghostCost: 2, next: 'closer' }
        ]
      }
    ]
  };

  getChatNode(archetype, nodeId) {
    const tree = DatingSimulator.CHAT_TREES[archetype] || DatingSimulator.CHAT_TREES.normie;
    return tree.find(n => n.id === nodeId) || tree[0];
  }

  getChatChoices() {
    if (!this.activeChat || this.activeChat.resolved) return null;
    return this.activeChat.currentChoices || null;
  }

  makeChatChoice(choiceIndex) {
    if (!this.activeChat || this.activeChat.resolved) return { status: 'error', msg: 'No active chat.' };
    const choices = this.activeChat.currentChoices;
    if (!choices || choiceIndex < 0 || choiceIndex >= choices.length) return { status: 'error', msg: 'Invalid choice.' };
    const choice = choices[choiceIndex];
    const p = this.player;
    const profile = this.currentProfile;

    // Check stat gate
    let statPassed = true;
    if (choice.stat && choice.statVal > 0) {
      const playerVal = p[choice.stat] || 0;
      statPassed = playerVal >= choice.statVal;
    }

    if (!statPassed) {
      this.activeChat.chatLog.push({ sender: 'player', text: choice.text });
      this.activeChat.chatLog.push({ sender: 'partner', text: `"Uh... that's not really working for me."` });
      this.activeChat.chatLog.push({ sender: 'system-chat', text: `❌ Your ${choice.stat} is too low (need ${choice.statVal}). They're losing interest.` });
      this.activeChat.ghostTimer -= 1;
      this.activeChat.interest = Math.max(0, this.activeChat.interest - 10);

      if (this.activeChat.ghostTimer <= 0 || this.activeChat.interest <= 0) {
        return this._ghostOut();
      }

      this.activeChat.currentChoices = this._filterChoices(this.activeChat.currentNodeId, profile.archetype);
      return { status: 'chat_continue', ghostTimer: this.activeChat.ghostTimer, interest: this.activeChat.interest };
    }

    // Handle creep/ghost fails
    if (choice.fail === 'creep') {
      this.activeChat.chatLog.push({ sender: 'player', text: choice.text });
      this.activeChat.chatLog.push({ sender: 'partner', text: `"...Did you just say that? I'm out."` });
      this.activeChat.chatLog.push({ sender: 'system-chat', text: `💀 You creeped them out with looksmaxxing terminology. Date destroyed.` });
      this.player.confidence = Math.max(0, this.player.confidence - 25);
      this.activeChat.resolved = true;
      // 10% chance viral screenshot
      if (Math.random() < 0.1) {
        this._triggerViralScreenshot();
      }
      this.rollProfile();
      this.player.updateSMV();
      return { status: 'creeped_out' };
    }

    if (choice.fail === 'ghost') {
      return this._ghostOut();
    }

    // Spend cash if required
    if (choice.cashCost && choice.cashCost > 0) {
      if (p.cash < choice.cashCost) {
        this.activeChat.chatLog.push({ sender: 'system-chat', text: `Not enough cash for this option!` });
        return { status: 'chat_continue', ghostTimer: this.activeChat.ghostTimer, interest: this.activeChat.interest };
      }
      p.cash -= choice.cashCost;
    }

    // Success — add player message
    this.activeChat.chatLog.push({ sender: 'player', text: choice.text });

    // Apply interest change
    this.activeChat.interest = Math.min(100, this.activeChat.interest + (choice.interest || 0));

    // Apply ghost timer cost
    this.activeChat.ghostTimer -= (choice.ghostCost || 0);
    if (this.activeChat.ghostTimer <= 0) {
      return this._ghostOut();
    }

    // Check if secured — transition to Date Night
    if (choice.next === 'secured') {
      this.activeChat.chatLog.push({ sender: 'system-chat', text: `💘 ${this.currentProfile.name} agreed to meet you! Pick a venue.` });
      this.activeChat.resolved = true;
      return this.startDateNight();
    }

    // Advance to next node
    if (choice.next) {
      const nextNode = this.getChatNode(profile.archetype, choice.next);
      if (nextNode) {
        this.activeChat.currentNodeId = nextNode.id;
        const filtered = this._filterChoices(nextNode.id, profile.archetype);
        this.activeChat.currentChoices = filtered;
        this.activeChat.chatLog.push({ sender: 'partner', text: nextNode.prompt(profile.name) });
        this.activeChat.mood = 'happy';
        return { status: 'chat_continue', ghostTimer: this.activeChat.ghostTimer, interest: this.activeChat.interest };
      }
    }

    // Fallback — same node
    this.activeChat.currentChoices = this._filterChoices(this.activeChat.currentNodeId, profile.archetype);
    return { status: 'chat_continue', ghostTimer: this.activeChat.ghostTimer, interest: this.activeChat.interest };
  }

  _filterChoices(nodeId, archetype) {
    const node = this.getChatNode(archetype, nodeId);
    if (!node) return [];
    const p = this.player;
    return node.choices.filter(c => {
      if (c.stat && c.statVal > 0) {
        return (p[c.stat] || 0) >= c.statVal;
      }
      return true;
    });
  }

  _ghostOut() {
    this.activeChat.chatLog.push({ sender: 'system-chat', text: `💨 ${this.currentProfile.name} stopped responding. You got ghosted.` });
    this.player.confidence = Math.max(0, this.player.confidence - 10);
    this.activeChat.resolved = true;
    this.rollProfile();
    this.player.updateSMV();
    return { status: 'ghosted' };
  }

  _secureDate() {
    this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.success || `"Okay, you've convinced me. Let's meet up."` });
    this.activeChat.chatLog.push({ sender: 'system-chat', text: `✅ Date secured with ${this.currentProfile.name}!` });
    this.player.confidence = Math.min(100, this.player.confidence + 20);
    this.player.datingScore += 25;
    this.player.hasDatingPartner = true;
    this.player.partnerName = this.currentProfile.name;
    this.player.partnerProfile = { ...this.currentProfile };
    this.player.partnerLoveLanguage = DatingSimulator.LOVE_LANGUAGES[this.currentProfile.archetype || 'normie'] || 'quality_time';
    this.player.relationshipLevel = 1;
    this.player.relationshipSatisfaction = 60;
    this.player.yearsWithPartner = 0;

    // Sugar partner bonus
    if (this.currentProfile.name === 'Gertrude' || this.currentProfile.name === 'Richard') {
      this.player.cash += 5000;
      if (this.player.freak >= 70) {
        this.player.confidence = Math.min(100, this.player.confidence + 10);
        this.logCallback(`You have an unexpected talent for this arrangement. +$5,000 cash.`, "success");
      } else {
        this.player.confidence = Math.max(0, this.player.confidence - 45);
        this.logCallback(`You traded your essence for ${this.currentProfile.name}'s fortune. -45% Confidence, +$5,000 cash.`, "success");
      }
    } else {
      this.logCallback(`Date secured with ${this.currentProfile.name}! Confidence boosted.`, "success");
    }

    this.activeChat.resolved = true;
    this.rollProfile();
    this.player.updateSMV();
    return { status: 'date_success' };
  }

  // === DATE NIGHT SYSTEM ===
  static VENUES = [
    { id: 'fast_food', name: 'Local Fast Food', icon: '🍔', cost: 10, difficulty: 0.3, minLevel: 0, desc: 'Cheap and cheerful. Low expectations.' },
    { id: 'coffee',    name: 'Artisan Coffee Shop', icon: '☕', cost: 25, difficulty: 0.4, minLevel: 0, desc: 'Casual vibe. Easy conversation.' },
    { id: 'arcade',    name: 'Mid-tier Arcade', icon: '🕹️', cost: 50, difficulty: 0.5, minLevel: 1, desc: 'Fun and low-pressure.' },
    { id: 'rooftop',   name: 'Rooftop Bar', icon: '🍸', cost: 100, difficulty: 0.65, minLevel: 2, desc: 'Classy but not overbearing.' },
    { id: 'sushi',     name: 'Luxury Sushi Bar', icon: '🍣', cost: 200, difficulty: 0.8, minLevel: 3, desc: 'High stakes. Impresses the elite.' },
  ];

  static DATE_CARDS = [
    { id: 'compliment', name: 'Smooth Compliment', type: 'charisma', cost: 1, baseImpact: 15, stat: 'rizz', statMult: 0.3, desc: '"You look amazing tonight." +rizz bonus' },
    { id: 'story', name: 'Engaging Story', type: 'charisma', cost: 1, baseImpact: 12, stat: 'rizz', statMult: 0.4, desc: 'Share a funny anecdote. +rizz bonus' },
    { id: 'listen', name: 'Active Listening', type: 'etiquette', cost: 1, baseImpact: 10, stat: 'style', statMult: 0.3, desc: 'Ask about their day. +style bonus' },
    { id: 'manners', name: 'Impeccable Manners', type: 'etiquette', cost: 2, baseImpact: 20, stat: 'style', statMult: 0.3, desc: 'Pull out their chair, hold the door. +style bonus' },
    { id: 'treat', name: 'Generous Gesture', type: 'wealth', cost: 2, baseImpact: 18, stat: 'cash', statMult: 0.0003, desc: 'Order something special. +cash bonus' },
    { id: 'flex', name: 'Subtle Flex', type: 'wealth', cost: 2, baseImpact: 15, stat: 'cash', statMult: 0.0004, desc: 'Mention your recent success. +cash bonus' },
    { id: 'charm', name: 'Charisma Bomb', type: 'charisma', cost: 3, baseImpact: 25, stat: 'rizz', statMult: 0.5, desc: 'Turn on the charm. Big rizz bonus' },
    { id: 'grace', name: 'Poise Under Pressure', type: 'etiquette', cost: 3, baseImpact: 22, stat: 'frame', statMult: 0.3, desc: 'Stay cool when things get awkward. +frame bonus' },
    { id: 'splurge', name: 'Big Splurge', type: 'wealth', cost: 3, baseImpact: 30, stat: 'cash', statMult: 0.0005, desc: 'Order the expensive bottle. +cash bonus' },
  ];

  static VENUE_PREF = {
    lookist:      { fast_food: -2, coffee: -1, arcade: -1, rooftop: 1, sushi: 2 },
    gold_digger:  { fast_food: -2, coffee: 0,  arcade: -1, rooftop: 1, sushi: 2 },
    corporate:    { fast_food: -1, coffee: 1,  arcade: -1, rooftop: 1, sushi: 1 },
    egirl:        { fast_food: 1,  coffee: 1,  arcade: 2,  rooftop: 0, sushi: -1 },
    normie:       { fast_food: 0,  coffee: 0,  arcade: 0,  rooftop: 0, sushi: 0 },
  };

  startDateNight() {
    if (!this.currentProfile) return null;
    // Clear the chat so render falls through to date night logic
    this.activeChat = null;
    this.showAppHome = false;
    this.dateBattle = {
      phase: 'select_venue',
      venue: null,
      skepticism: 100,
      maxSkepticism: 100,
      playerEnergy: 4,
      maxEnergy: 4,
      cardsPlayed: 0,
      hand: [],
      turn: 1,
      billPaid: false,
      outcome: null,
      archetypeMult: 1.0,
      venuePrefMod: 0,
    };
    return { status: 'select_venue', venues: DatingSimulator.VENUES.filter(v => v.minLevel <= (this.player.careerLevel || 0)) };
  }

  selectVenue(venueId) {
    if (!this.dateBattle || this.dateBattle.phase !== 'select_venue') return null;
    const venue = DatingSimulator.VENUES.find(v => v.id === venueId);
    if (!venue) return null;
    if (this.player.cash < venue.cost) return { status: 'error', msg: `Not enough cash for ${venue.name}!` };

    this.player.cash -= venue.cost;
    this.dateBattle.venue = venue;
    this.dateBattle.phase = 'battle';

    const archetype = this.currentProfile.archetype || 'normie';
    const pref = (DatingSimulator.VENUE_PREF[archetype] || DatingSimulator.VENUE_PREF.normie)[venueId] || 0;
    this.dateBattle.venuePrefMod = pref;

    // Starting skepticism: 60 base + venue difficulty * 40, adjusted by preference
    let starting = 30 + venue.difficulty * 70;
    if (pref <= -2) starting = Math.min(95, starting + 30); // they hate it
    else if (pref === -1) starting = Math.min(90, starting + 15);
    else if (pref >= 2) starting = Math.max(20, starting - 20);
    else if (pref === 1) starting = Math.max(20, starting - 10);

    this.dateBattle.skepticism = Math.round(starting);
    this.dateBattle.maxSkepticism = Math.round(starting);
    this.dateBattle.hand = this._drawDateHand(4);

    // 12% chance ex-boyfriend appears (skip for sugar profiles)
    const isSugar = this.currentProfile.name === 'Gertrude' || this.currentProfile.name === 'Richard';
    if (!isSugar && Math.random() < 0.12) {
      this.activeEvent = {
        type: 'ex_boss',
        opponentId: 'mogger_ex',
        resolved: false,
      };
    }

    return { status: 'battle_start', venue, skepticism: this.dateBattle.skepticism, maxSkepticism: this.dateBattle.maxSkepticism };
  }

  _drawDateHand(count) {
    const pool = [...DatingSimulator.DATE_CARDS];
    const hand = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      hand.push({ ...pool.splice(idx, 1)[0], instanceId: `${Date.now()}-${i}` });
    }
    return hand;
  }

  endDateTurn() {
    if (!this.dateBattle || this.dateBattle.phase !== 'battle') return;
    this.dateBattle.turn++;
    this.dateBattle.playerEnergy = this.dateBattle.maxEnergy;
    if (this.dateBattle.hand.length < 4) {
      const newCards = this._drawDateHand(4 - this.dateBattle.hand.length);
      this.dateBattle.hand.push(...newCards);
    }
  }

  playDateCard(instanceId) {
    if (!this.dateBattle || this.dateBattle.phase !== 'battle') return null;
    const idx = this.dateBattle.hand.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return null;
    const card = this.dateBattle.hand[idx];
    if (this.dateBattle.playerEnergy < card.cost) return { status: 'error', msg: 'Not enough energy!' };

    this.dateBattle.playerEnergy -= card.cost;
    this.dateBattle.cardsPlayed++;

    // Calculate impact
    let impact = card.baseImpact;
    if (card.stat && card.statMult) {
      const playerVal = this.player[card.stat] || 0;
      impact += playerVal * card.statMult;
    }

    // Venue preference modifier: -2 = 50% impact, +2 = 120% impact
    const prefMod = this.dateBattle.venuePrefMod;
    if (prefMod <= -2) impact *= 0.5;
    else if (prefMod === -1) impact *= 0.7;
    else if (prefMod >= 2) impact *= 1.2;
    else if (prefMod === 1) impact *= 1.1;

    impact = Math.round(impact);

    this.dateBattle.skepticism = Math.max(0, this.dateBattle.skepticism - impact);

    // Remove card from hand
    this.dateBattle.hand.splice(idx, 1);

    // Log
    this.logCallback(`Played "${card.name}" -${impact} Skepticism! (${this.dateBattle.skepticism}% remaining)`, 'success');

    // Check win
    if (this.dateBattle.skepticism <= 0) {
      this.dateBattle.phase = 'bill';
      this.dateBattle.hand = [];
      return { status: 'battle_won', skepticism: 0 };
    }

    return { status: 'card_played', impact, skepticism: this.dateBattle.skepticism, hand: this.dateBattle.hand, energy: this.dateBattle.playerEnergy, turn: this.dateBattle.turn };
  }

  handleBill(choice) {
    if (!this.dateBattle || this.dateBattle.phase !== 'bill') return null;
    const venue = this.dateBattle.venue;
    const billCost = venue.cost * 3;

    if (choice === 'pay') {
      if (this.player.cash < billCost) return { status: 'error', msg: `Can't afford the bill ($${billCost})!` };
      this.player.cash -= billCost;
      this.dateBattle.billPaid = true;
      this.dateBattle.phase = 'done';
      this.dateBattle.outcome = 'success';
      this._finalizeDateSuccess();
      this.logCallback(`Paid $${billCost} bill at ${venue.name}. Relationship secured!`, 'success');
      return { status: 'date_night_success', billCost };
    }

    if (choice === 'split') {
      const rizz = this.player.rizz || 0;
      if (rizz >= 35) {
        const splitCost = Math.round(billCost / 2);
        if (this.player.cash < splitCost) return { status: 'error', msg: `Can't afford your half ($${splitCost})!` };
        this.player.cash -= splitCost;
        this.dateBattle.billPaid = true;
        this.dateBattle.phase = 'done';
        this.dateBattle.outcome = 'success';
        this._finalizeDateSuccess();
        this.logCallback(`Split the bill $${splitCost}/${splitCost}. Smooth talk saved you cash!`, 'success');
        return { status: 'date_night_success', billCost: splitCost };
      } else {
        this.dateBattle.phase = 'done';
        this.dateBattle.outcome = 'split_fail';
        this.player.confidence = Math.max(0, this.player.confidence - 20);
        if (Math.random() < 0.1) this._triggerViralScreenshot();
        this.logCallback(`Your rizz (${rizz}) wasn't enough. They walked out. -20% Confidence.`, 'error');
        return { status: 'date_night_split_fail' };
      }
    }

    if (choice === 'dash') {
      const speed = this.player.speed || 0;
      if (speed >= 40) {
        this.player.cash -= Math.round(billCost * 0.1); // cover the drink you had
        this.dateBattle.billPaid = true;
        this.dateBattle.phase = 'done';
        this.dateBattle.outcome = 'success';
        this._finalizeDateSuccess();
        this.logCallback(`Dined and dashed successfully! You're a ghost.`, 'success');
        return { status: 'date_night_success', billCost: 0 };
      } else {
        // Caught! Lose followers
        this.player.cash -= billCost;
        const followerLoss = Math.round((this.player.followers || 0) * 0.5);
        this.player.followers = Math.max(0, (this.player.followers || 0) - followerLoss);
        this.player.confidence = Math.max(0, this.player.confidence - 35);
        if (Math.random() < 0.1) this._triggerViralScreenshot();
        this.dateBattle.phase = 'done';
        this.dateBattle.outcome = 'dash_fail';
        this.logCallback(`Caught dashing! Lost ${followerLoss} followers and paid $${billCost}. Public shame!`, 'error');
        return { status: 'date_night_dash_fail', followerLoss, billCost };
      }
    }

    return null;
  }

  _finalizeDateSuccess() {
    const p = this.player;
    p.confidence = Math.min(100, p.confidence + 15);
    p.datingScore += 30;
    p.hasDatingPartner = true;
    p.partnerName = this.currentProfile.name;
    p.partnerProfile = { ...this.currentProfile };
    p.partnerLoveLanguage = DatingSimulator.LOVE_LANGUAGES[this.currentProfile.archetype || 'normie'] || 'quality_time';
    p.relationshipLevel = 1;
    p.relationshipSatisfaction = 60;
    p.yearsWithPartner = 0;
    p.updateSMV();
  }

  _triggerViralScreenshot() {
    const p = this.player;
    p.followers = (p.followers || 0) + 20000;
    p.rizzLockTurns = 10;
    this.activeEvent = {
      type: 'viral_screenshot',
      turnsRemaining: 10,
    };
    this.logCallback(`📱 VIRAL! Your conversation was posted online. +20,000 followers, but Rizz is locked for 10 turns!`, 'action');
  }

  resolveExBoss(battleWon) {
    if (!this.activeEvent || this.activeEvent.type !== 'ex_boss') return;
    this.activeEvent.resolved = true;
    this.activeEvent.battleWon = battleWon;
    const p = this.player;
    if (battleWon) {
      p.confidence = Math.min(100, p.confidence + 25);
      p.status = (p.status || 0) + 10;
      this.logCallback(`You defeated the ex! +25% Confidence, +10 Status. The date is impressed.`, 'success');
    } else {
      p.cash = Math.max(0, (p.cash || 0) - 2000);
      p.confidence = Math.max(0, p.confidence - 20);
      this.logCallback(`The ex beat you down. -$2,000 medical bills, -20% Confidence.`, 'error');
    }
    this.activeEvent = null;
  }

  isRizzLocked() {
    return (this.player.rizzLockTurns || 0) > 0;
  }

  // === MATCH CALCULATION (updated with Gold Digger / Lookism) ===
  calculateMatchPercent(profile) {
    const archetype = profile.archetype || 'normie';
    let prob;

    if (archetype === 'gold_digger') {
      prob = 10 + (this.player.cash / 10000) * 30;
      if (this.player.cash >= 20000) prob += 25;
      if (this.player.cash >= 50000) prob += 20;
      if (this.player.smv < profile.reqSMV) prob -= 15;
      const smoRank = this.player.getTalentEffect('smooth_operator');
      if (smoRank > 0) prob += smoRank * 5;
    } else if (archetype === 'lookist') {
      let smvDiff = this.player.smv - (profile.reqSMV || 5.0);
      prob = 20 + smvDiff * 20;
      if (this.player.smv >= 7.5) prob += 25;
      if (profile.reqHeight && this.player.height < profile.reqHeight) prob -= 30;
      if (profile.reqTilt && this.player.tilt !== profile.reqTilt) prob -= 35;
      if (profile.reqSkin && this.player.skin < profile.reqSkin) prob -= 20;
      if (this.player.rizz >= 60) prob += 10;
      const smoRank = this.player.getTalentEffect('smooth_operator');
      if (smoRank > 0) prob += smoRank * 5;
    } else {
      // Standard (normie / egirl / corporate)
      let smvDiff = this.player.smv - (profile.reqSMV || 5.0);
      prob = 30 + smvDiff * 15;
      if (profile.reqHeight && this.player.height < profile.reqHeight) {
        const diff = profile.reqHeight - this.player.height;
        prob -= (diff * 20);
      }
      if (profile.reqTilt && this.player.tilt !== profile.reqTilt) prob -= 30;
      if (profile.reqHairline && this.player.hairline > profile.reqHairline) prob -= 40;
      if (profile.reqSkin && this.player.skin < profile.reqSkin) prob -= 20;
      if (profile.reqRizz && this.player.rizz < profile.reqRizz) prob -= 25;
      if (this.player.rizz >= 60) prob += 10;
      if (this.player.rizz >= 80) prob += 15;
      const smoRank = this.player.getTalentEffect('smooth_operator');
      if (smoRank > 0) prob += smoRank * 8;
    }

    // Rizz lock penalty: viral screenshot destroys your dating rep
    if (this.isRizzLocked()) {
      prob = 0;
    }

    return Math.max(0, Math.min(99, Math.round(prob)));
  }

  // === CATFISH MECHANIC ===
  rollCatfish(profile) {
    if (profile.reqSMV < 7.0) return null;
    if (Math.random() > 0.20) return null;
    const catfishNames = ['Carl (52, lives in his van)', 'Linda (48, uses her daughter\'s photos)', 'A Bot (automated trading course promoter)'];
    const catfish = catfishNames[Math.floor(Math.random() * catfishNames.length)];
    return {
      originalName: profile.name,
      catfishName: catfish,
      description: `The "${profile.name}" you matched with is actually ${catfish}. The photos were all fake.`
    };
  }

  // === PROFILES ===
  getFemaleProfiles() {
    return [
      {
        name: 'Chad', age: 22, archetype: 'lookist',
        bio: 'D1 athlete. Looking for an 8/10+ Stacy. Must have slim proportions and good style. 🏋️‍♂️🔥',
        avatarColor: '#ff75b5', avatarType: 'chad', gender: 'male',
        reqSMV: 7.5, reqSkin: 60,
        dialogues: {
          match: "Hey. You look decent. What's your Instagram?",
          reject: "Yeah... sorry, you don't really fit my vibe.",
          success: "Sweet. Let's grab steak or hit the gym."
        }
      },
      {
        name: 'Tyrone', age: 24, archetype: 'egirl',
        bio: '6\'4". Positive canthal tilts only. Alt aesthetics are a plus. Let\'s swap playlists.',
        avatarColor: '#bd93f9', avatarType: 'tyrone', gender: 'male',
        reqTilt: 'Positive', reqSMV: 6.0, reqSkin: 65,
        dialogues: {
          match: "Hey, beautiful eyes. What kind of music are you into?",
          reject: "No offense, but you look a bit basic.",
          success: "Cool, come over to my studio."
        }
      },
      {
        name: 'Beta Bob', age: 25, archetype: 'normie',
        bio: 'Software engineer. Looking for a nice girl to play video games and build LEGO with. 🎮🤓',
        avatarColor: '#50fa7b', avatarType: 'bob', gender: 'male',
        reqSMV: 3.5,
        dialogues: {
          match: "Hi! Your profile looks really friendly.",
          reject: "Ah, sorry, I think we have different hobbies.",
          success: "Awesome! Let's hop on Discord."
        }
      },
      {
        name: 'Richard', age: 72, archetype: 'gold_digger',
        bio: 'CEO. Looking for a companion to spoil on yacht trips. Allowance provided. 💰🛥️',
        avatarColor: '#ffb86c', avatarType: 'sugar_daddy', gender: 'male',
        reqSMV: 1.0,
        dialogues: {
          match: "Hello dear! I would love to pamper you.",
          reject: "You're too complicated for my schedule.",
          success: "Let's fly out to Paris."
        }
      },
      {
        name: 'Marcus', age: 27, archetype: 'normie',
        bio: 'Rizz instructor. Looking for someone with conversational game. 🎯',
        avatarColor: '#00f0ff', avatarType: 'chad', gender: 'male',
        reqSMV: 4.5, reqRizz: 40,
        dialogues: {
          match: "Hey, you seem interesting. Let's chat.",
          reject: "Your conversation skills need work.",
          success: "You've got real charm."
        }
      },
    {
      name: 'Derek', age: 30, archetype: 'gold_digger',
      bio: 'CEO of a tech startup. Looking for a power couple. 📈',
      avatarColor: '#50fa7b', avatarType: 'corporate', gender: 'male',
      reqSMV: 5.5, reqRizz: 30,
        dialogues: {
          match: "Impressive profile. I appreciate ambition.",
          reject: "I need someone with more drive.",
          success: "Let's build an empire together."
        }
      }
    ];
  }

  getMaleProfiles() {
    return [
    {
      name: 'Tiffany', age: 21, archetype: 'lookist',
      bio: 'No short kings! 6\'2" minimum. Must drive a clean car. 💅✨',
      avatarColor: '#ff75b5', avatarType: 'stacy', gender: 'female',
        reqHeight: 74, reqSMV: 7.5, reqSkin: 60,
        dialogues: {
          match: "Hey! Loved your height. Are you busy this weekend?",
          reject: "Wait... are you actually 5'9\"? Delete my number.",
          success: "Wow, okay. Pick me up at 8."
        }
      },
    {
      name: 'Chloe', age: 23, archetype: 'egirl',
      bio: 'Alt girl. Positive canthal tilts and clean skin. Let\'s ignore our responsibilities.',
      avatarColor: '#bd93f9', avatarType: 'goth', gender: 'female',
        reqTilt: 'Positive', reqSMV: 6.0, reqSkin: 65,
        dialogues: {
          match: "Hey, nice eyes. You look like you'd ruin my life.",
          reject: "Ugh, you have major normie vibes.",
          success: "Let's hang out. Bring snacks."
        }
      },
    {
      name: 'Gemma', age: 26, archetype: 'lookist',
      bio: 'Corporate analyst. Stable career only. Norwood 5+ dealbreaker.',
      avatarColor: '#50fa7b', avatarType: 'corporate', gender: 'female',
        reqHairline: 4, reqSMV: 5.0, reqSkin: 50,
        dialogues: {
          match: "Hello. You look presentable. What do you do?",
          reject: "Sorry, I don't feel a professional spark.",
          success: "Great, let's schedule a formal dinner."
        }
      },
    {
      name: 'Gertrude', age: 69, archetype: 'gold_digger',
      bio: 'Looking for a young boy to spoil. 💰🛍️',
      avatarColor: '#ffb86c', avatarType: 'sugar', gender: 'female',
        reqSMV: 1.0,
        dialogues: {
          match: "Hello there, handsome! I want to spoil you.",
          reject: "Oh, you're too sassy for my budget.",
          success: "Here's some shopping allowance!"
        }
      },
    {
      name: 'Valentina', age: 25, archetype: 'normie',
      bio: 'Rizz queen. Looking for a guy with actual game. 🎯',
      avatarColor: '#ff79c6', avatarType: 'baddie', avatarSeed: 'valentina_baddie', gender: 'female',
        reqSMV: 4.5, reqRizz: 40,
        dialogues: {
          match: "Hey, you seem interesting. Try to keep up.",
          reject: "Your rizz is lacking.",
          success: "You've got real charm."
        }
      },
    {
      name: 'Priya', age: 28, archetype: 'gold_digger',
      bio: 'Corporate lawyer. Someone ambitious with a good career. 📈',
      avatarColor: '#50fa7b', avatarType: 'corporate', gender: 'female',
        reqSMV: 5.5, reqRizz: 35,
        dialogues: {
          match: "Impressive profile. I appreciate direction.",
          reject: "I need someone more established.",
          success: "Let's discuss our futures."
        }
      }
    ];
  }

  rollProfile() {
    const pool = this.appPools[this.activeApp] || this.profiles;
    this.currentProfile = pool.length > 0 ? this.player.randomElement(pool) : this.player.randomElement(this.profiles);
    this.activeChat = null;
    this.activeDateRound = 0;
    this.dateRoundsCompleted = 0;
    this.partnerMood = 'neutral';
    this.isPartnerTyping = false;
    this.lastSceneBackground = null;
  }

  swipeLeft() {
    this.ghostedProfiles.push(this.currentProfile);
    this._decayRizzLock();
    this.rollProfile();
    return { status: 'left' };
  }

  swipeRight() {
    if (this.player.ap < 1 && !this.goldSubscription) {
      return { status: 'no_ap', message: 'Out of Swipe Action Points! Wait for next year or buy Premium Gold.' };
    }
    if (!this.goldSubscription) this.player.ap -= 1;

    const appDef = this.getActiveAppDef();

    // SugarGrind: guaranteed match but cash drain
    if (appDef.cashDrain > 0) {
      if (this.player.cash < appDef.cashDrain) {
        return { status: 'no_ap', message: `Not enough cash for SugarGrind swipe (costs $${appDef.cashDrain})!` };
      }
      this.player.cash -= appDef.cashDrain;
    }

    // LuxyMog: instant match if stats are high enough
    if (appDef.instantMatch && this.player.smv >= 7.0) {
      return this._createMatch(100);
    }

    // Normal match calculation with app multiplier
    let matchChance = this.calculateMatchPercent(this.currentProfile);
    matchChance = Math.round(matchChance * appDef.matchMult);

    // Hinged bio bonus
    if (appDef.bioBonus && this._hasBrainmaxxBio()) {
      matchChance = Math.min(99, matchChance * 4);
    }

    const rolledMatch = (Math.random() * 100) < matchChance;

    if (!rolledMatch) {
      // Slidr ghosting: profile vanishes with confidence hit
      if (appDef.id === 'slidr' && Math.random() < 0.15) {
        this.player.confidence = Math.max(0, this.player.confidence - 5);
        this.logCallback(`💨 ${this.currentProfile.name} ghosted you mid-swipe. -5% Confidence.`, 'error');
      }
      this.rollProfile();
      return { status: 'no_match', matchChance };
    }

    // Check for catfish
    const catfish = this.rollCatfish(this.currentProfile);
    if (catfish) {
      this.activeChat = {
        profile: this.currentProfile,
        isCatfish: true,
        catfish,
        chatLog: [{ sender: 'system-chat', text: `⚠️ CATFISH ALERT: ${catfish.description}` }],
        resolved: false
      };
      this.logCallback(`Catfish detected! "${this.currentProfile.name}" was actually ${catfish.catfishName}.`, 'error');
      return { status: 'catfish', chat: this.activeChat, catfish };
    }

    // Slidr ghosting on match too
    if (appDef.id === 'slidr' && Math.random() < appDef.ghostChance) {
      this.player.confidence = Math.max(0, this.player.confidence - 8);
      this.rollProfile();
      this.logCallback(`💀 ${this.currentProfile.name} unmatched you out of nowhere. -8% Confidence.`, 'error');
      return { status: 'ghosted' };
    }

    // LuxyMog ban risk: if PSL dropped since entering app
    if (appDef.id === 'luxymog' && this.player.smv < 7.0) {
      if (this.banWarning) {
        this.bannedApps.push('luxymog');
        this.banWarning = false;
        this.showAppHome = true;
        this.logCallback(`🚫 LuxyMog has banned you for failing to maintain elite standards.`, 'error');
        return { status: 'banned' };
      }
      this.banWarning = true;
      this.logCallback(`⚠️ Your PSL dropped below LuxyMog threshold. One more violation and you're banned!`, 'error');
    }

    return this._createMatch(matchChance);
  }

  _decayRizzLock() {
    if (this.player.rizzLockTurns > 0) {
      this.player.rizzLockTurns--;
      if (this.player.rizzLockTurns <= 0) {
        this.activeEvent = null;
        this.logCallback(`Your Rizz is no longer locked. The viral shame has faded.`, 'success');
      }
    }
  }

  _createMatch(matchChance) {
    const archetype = this.currentProfile.archetype || 'normie';
    const firstNode = this.getChatNode(archetype, 'opener');
    const filteredChoices = this._filterChoices('opener', archetype);
    this.activeChat = {
      profile: this.currentProfile,
      isCatfish: false,
      chatLog: [
        { sender: 'partner', text: this.currentProfile.dialogues.match || firstNode.prompt(this.currentProfile.name) }
      ],
      resolved: false,
      mood: 'neutral',
      isTyping: false,
      sceneBg: null,
      ghostTimer: 3,
      interest: 30,
      currentNodeId: 'opener',
      currentChoices: filteredChoices
    };
    // Add the opener prompt after the match message
    if (filteredChoices.length > 0) {
      const opener = this.getChatNode(archetype, 'opener');
      if (opener && this.activeChat.chatLog.length < 2) {
        this.activeChat.chatLog.push({ sender: 'partner', text: opener.prompt(this.currentProfile.name) });
      }
    }
    this.activeDateRound = 0;
    this.dateRoundsCompleted = 0;
    this.logCallback(`Matched with ${this.currentProfile.name}! Match Rate: ${matchChance}%`, 'success');
    return { status: 'match', chat: this.activeChat };
  }

  _hasBrainmaxxBio() {
    const bio = this.player.bio || '';
    const terms = ['ceo', 'founder', 'startup', 'investor', 'engineering', 'finance', 'quant', 'consulting',
                   'strategy', 'growth', 'product', 'portfolio', 'venture', 'angel', 'board'];
    return terms.some(t => bio.toLowerCase().includes(t));
  }

  // Get current date round choices
  getDateChoices() {
    if (!this.activeChat || this.activeChat.resolved || this.activeChat.isCatfish) return null;
    const rounds = this.generateDateRounds(this.currentProfile);
    if (this.activeDateRound >= rounds.length) return null;
    return rounds[this.activeDateRound];
  }

  // Handle catfish resolution
  resolveCatfish(fight) {
    if (!this.activeChat || !this.activeChat.isCatfish) return;
    this.activeChat.resolved = true;
    if (fight) {
      this.player.confidence = Math.min(100, this.player.confidence + 10);
      this.logCallback(`You confronted the catfish and stood your ground. +10% Confidence.`, 'success');
    } else {
      this.player.confidence = Math.max(0, this.player.confidence - 30);
      this.logCallback(`You were catfished and slunk away in shame. -30% Confidence.`, 'error');
    }
    this.rollProfile();
    this.player.updateSMV();
    return { status: fight ? 'catfish_confronted' : 'catfish_retreat' };
  }

  // Make a date choice
  makeDateChoice(choiceIndex) {
    if (!this.activeChat || this.activeChat.resolved) return;
    const rounds = this.generateDateRounds(this.currentProfile);
    if (this.activeDateRound >= rounds.length) return;
    const round = rounds[this.activeDateRound];
    const choice = round.choices[choiceIndex];
    if (!choice) return;

    // Check cash cost
    if (choice.cashCost > 0 && this.player.cash < choice.cashCost) {
      this.activeChat.chatLog.push({ sender: 'system-chat', text: "Insufficient cash for this choice!" });
      return;
    }

    // Check for looksmaxxing term offense
    const isOffensive = choice.looksmaxxing && this.currentProfile.archetype !== 'egirl';
    if (isOffensive) {
      this.activeChat.chatLog.push({ sender: 'player', text: choice.text });
      this.activeChat.chatLog.push({ sender: 'partner', text: `"Did you just say '${this.extractLooksmaxxingTerm(choice.text)}'? What is wrong with you?"` });
      this.activeChat.chatLog.push({ sender: 'system-chat', text: `${this.currentProfile.name} stands up and walks out. The date is over.` });
      this.player.confidence = Math.max(0, this.player.confidence - 25);
      this.activeChat.mood = 'angry';
      this.activeChat.resolved = true;
      this.logCallback(`Your date with ${this.currentProfile.name} walked out after you used looksmaxxing terminology. -25% Confidence.`, 'error');
      this.rollProfile();
      this.player.updateSMV();
      return { status: 'reject_offended' };
    }

    // Spend cash
    if (choice.cashCost > 0) this.player.cash -= choice.cashCost;

    this.activeChat.chatLog.push({ sender: 'player', text: choice.text });

    // Success roll for this round
    const roll = Math.random();
    const archetype = this.currentProfile.archetype || 'normie';
    let baseWeight = choice.weight;

    // GigaChad bonus: if SMV >= 7.5, all choices have better weight
    if (this.player.smv >= 7.5) baseWeight = Math.min(1.0, baseWeight + 0.15);
    // High cash bonus: if cash >= 20000, cash choices work better
    if (choice.cashCost > 0 && this.player.cash >= 20000) baseWeight = Math.min(1.0, baseWeight + 0.1);

    if (roll < baseWeight) {
      this.activeDateRound++;
      this.dateRoundsCompleted++;

      if (this.activeDateRound >= rounds.length) {
        // All rounds complete — DATE SUCCESS
        this.activeChat.mood = 'excited';
        this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.success });
        // Sugar partner logic
        if (this.currentProfile.name === 'Gertrude' || this.currentProfile.name === 'Richard') {
          this.player.cash += 5000;
          if (this.player.freak >= 70) {
            this.player.confidence = Math.min(100, this.player.confidence + 30);
            this.activeChat.chatLog.push({ sender: 'player', text: "Honestly? This arrangement kinda works for me." });
            this.logCallback(`You have an unexpected talent for this arrangement. +30% Confidence, +$5,000 cash.`, "success");
          } else {
            this.player.confidence = Math.max(0, this.player.confidence - 45);
            this.logCallback(`You traded your essence for ${this.currentProfile.name}'s fortune. -45% Confidence, +$5,000 cash.`, "success");
          }
        } else {
          this.player.confidence = Math.min(100, this.player.confidence + 20);
          this.player.datingScore += 25;
          this.player.hasDatingPartner = true;
          this.player.partnerName = this.currentProfile.name;
          this.player.partnerProfile = { ...this.currentProfile };
          this.player.partnerLoveLanguage = DatingSimulator.LOVE_LANGUAGES[this.currentProfile.archetype || 'normie'] || 'quality_time';
          this.player.relationshipLevel = 1;
          this.player.relationshipSatisfaction = 60;
          this.player.yearsWithPartner = 0;
          this.logCallback(`Date with ${this.currentProfile.name} went perfectly! Confidence boosted.`, "success");
        }
        this.activeChat.resolved = true;
        this.rollProfile();
        this.player.updateSMV();
        return { status: 'date_success' };
      } else {
        // Move to next round
        const nextRound = rounds[this.activeDateRound];
        this.activeChat.mood = ['happy', 'flirty', 'excited'][Math.floor(Math.random() * 3)];
        this.activeChat.chatLog.push({ sender: 'system-chat', text: `✔ ${this.currentProfile.name} seems interested. Round ${this.activeDateRound + 1}...` });
        this.activeChat.chatLog.push({ sender: 'partner', text: nextRound.prompt });
        return { status: 'date_continue', currentRound: this.activeDateRound, totalRounds: rounds.length };
      }
    } else {
      // Failed this round
      this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.reject });
      this.activeChat.mood = 'sad';
      this.player.confidence = Math.max(0, this.player.confidence - 15);
      this.activeChat.resolved = true;
      this.logCallback(`Rejected by ${this.currentProfile.name} mid-date. -15% Confidence.`, "error");
      this.rollProfile();
      this.player.updateSMV();
      return { status: 'date_failed' };
    }
  }

  getMoodEmoji() {
    const moods = {
      happy: '😊', flirty: '😏', neutral: '😐', sad: '😢', angry: '😠', shy: '🥺', excited: '🤩'
    };
    const mood = this.activeChat?.mood || this.partnerMood || 'neutral';
    return moods[mood] || '😐';
  }

  getMoodColor() {
    const colors = {
      happy: '#50fa7b', flirty: '#ff79c6', neutral: '#8892b0',
      sad: '#6272a4', angry: '#ff5555', shy: '#ffb86c', excited: '#f1fa8c'
    };
    const mood = this.activeChat?.mood || this.partnerMood || 'neutral';
    return colors[mood] || '#8892b0';
  }

  getSceneBackground(locationId) {
    const scenes = DatingSimulator.SCENES;
    if (locationId && scenes[locationId]) return scenes[locationId];
    const arch = this.currentProfile?.archetype || 'normie';
    if (scenes[arch]) return scenes[arch];
    return scenes.default;
  }

  static SCENES = {
    default: { label: 'Date Night', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', particles: 'stars' },
    loc_park: { label: 'Park Picnic', gradient: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)', particles: 'leaves' },
    loc_restaurant: { label: 'Dinner Date', gradient: 'linear-gradient(135deg, #2d0a0a 0%, #4a1212 50%, #6b1a1a 100%)', particles: 'candles' },
    loc_movies: { label: 'Movie Night', gradient: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a2e 100%)', particles: 'sparkles' },
    loc_beach: { label: 'Beach Walk', gradient: 'linear-gradient(135deg, #0e1a2b 0%, #1a3a4a 50%, #2a5a6a 100%)', particles: 'waves' },
    loc_concert: { label: 'Concert', gradient: 'linear-gradient(135deg, #1a002a 0%, #3a005a 50%, #5a0080 100%)', particles: 'lights' },
    loc_rooftop: { label: 'Rooftop Bar', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 50%, #3a1a4e 100%)', particles: 'city' },
    loc_escape: { label: 'Escape Room', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)', particles: 'gears' },
    loc_cooking: { label: 'Cooking Class', gradient: 'linear-gradient(135deg, #2a1a0a 0%, #4a3a1a 50%, #3a2a0a 100%)', particles: 'steam' },
    loc_spa: { label: 'Spa Day', gradient: 'linear-gradient(135deg, #1a2a3a 0%, #2a4a5a 50%, #1a3a4a 100%)', particles: 'incense' },
    normie: { label: 'Cozy Café', gradient: 'linear-gradient(135deg, #2a1a0a 0%, #3a2a1a 50%, #2a1a0a 100%)', particles: 'none' },
    lookist: { label: 'High-End Lounge', gradient: 'linear-gradient(135deg, #1a0a2a 0%, #2a1a4a 50%, #1a0a2a 100%)', particles: 'glitter' },
    egirl: { label: 'Arcade Bar', gradient: 'linear-gradient(135deg, #0a002a 0%, #2a0a4a 50%, #1a003a 100%)', particles: 'neon' },
    gold_digger: { label: 'Fine Dining', gradient: 'linear-gradient(135deg, #1a1a00 0%, #3a3a00 50%, #1a1a00 100%)', particles: 'gold' },
    corporate: { label: 'Business Lounge', gradient: 'linear-gradient(135deg, #0a1a2a 0%, #1a2a3a 50%, #0a1a2a 100%)', particles: 'none' }
  };

  static MOOD_TRANSITIONS = {
    date_continue: (old) => ['happy', 'flirty', 'excited'][Math.floor(Math.random() * 3)],
    date_success: () => 'excited',
    date_failed: () => 'sad',
    reject_offended: () => 'angry',
    good_choice: () => 'happy',
    bad_choice: () => 'sad'
  };

  extractLooksmaxxingTerm(text) {
    const lower = text.toLowerCase();
    const found = this.looksmaxxingTerms.find(t => lower.includes(t));
    return found || 'that weird term';
  }

  buyGold() {
    if (this.player.cash < 200) return false;
    this.player.cash -= 200;
    this.goldSubscription = true;
    this.logCallback('Purchased SwipeMax Premium Gold! Swipes are now FREE!', 'success');
    return true;
  }

  // === RELATIONSHIP INTERACTIONS ===
  getAvailableInteractions() {
    if (!this.player.hasDatingPartner) return [];
    const p = this.player;
    const lvl = p.relationshipLevel;
    const interactions = [];

    // Date locations (replaces generic 'date' and 'luxury_date')
    DatingSimulator.DATE_LOCATIONS.forEach(loc => {
      interactions.push({
        id: loc.id, label: loc.label, desc: loc.desc,
        costAP: loc.costAP, costCash: loc.costCash,
        satGain: loc.satGain, minLevel: loc.minLevel
      });
    });

    // Gift catalog
    DatingSimulator.GIFTS.forEach(g => {
      interactions.push({ id: g.id, label: g.label, desc: `$${g.cost}`, costAP: 0, costCash: g.cost, satGain: g.satGain, minLevel: 1 });
    });

    interactions.push({ id: 'deep_talk', label: 'Deep Talk', desc: 'A heartfelt conversation', costAP: 1, costCash: 0, satGain: 15, minLevel: 1, requiresRizz: 50 });

    // Living together (engaged+)
    if (lvl >= 3 && !p.livingTogether) {
      interactions.push({ id: 'living_together', label: '🏠 Move In Together', desc: '$8,000 down payment', costAP: 0, costCash: 8000, satGain: 25, minLevel: 3 });
    }

    // Pet adoption (exclusive+)
    if (lvl >= 2 && !p.petType) {
      interactions.push({ id: 'adopt_pet', label: '🐾 Adopt a Pet', desc: '$300 adoption fee', costAP: 0, costCash: 300, satGain: 15, minLevel: 2 });
    }

    // Wedding planner (engaged, not planned)
    if (lvl >= 3 && !p.weddingPlanned) {
      interactions.push({ id: 'plan_wedding', label: '💒 Plan Wedding', desc: 'Choose venue', costAP: 0, costCash: 0, satGain: 20, minLevel: 3 });
    }

    if (lvl >= 3) {
      interactions.push({ id: 'propose', label: 'Propose Marriage 💍', desc: 'Take the next step', costAP: 0, costCash: 5000, satGain: 0, minLevel: 3 });
    }

    return interactions.filter(i => {
      if (p.ap < i.costAP) return false;
      if (p.cash < i.costCash) return false;
      if (p.relationshipLevel < i.minLevel) return false;
      if (i.requiresRizz && p.rizz < i.requiresRizz) return false;
      if (i.id.startsWith('loc_') && !this.isLocationAvailable(i)) return false;
      return true;
    });
  }

  static DATE_LOCATIONS = [
    { id: 'loc_park', label: '🌳 Park Picnic', desc: 'A quiet afternoon in the park', costAP: 0, costCash: 50, satGain: 10, cooldown: 1, minLevel: 1, bonus: { normie: 5 } },
    { id: 'loc_restaurant', label: '🍽️ Dinner Date', desc: 'A nice restaurant evening', costAP: 1, costCash: 200, satGain: 20, cooldown: 0, minLevel: 1, bonus: { lookist: 5, corporate: 5 } },
    { id: 'loc_movies', label: '🎬 Movie Night', desc: 'Catch the latest film', costAP: 1, costCash: 100, satGain: 12, cooldown: 1, minLevel: 1, bonus: { egirl: 5 } },
    { id: 'loc_beach', label: '🏖️ Beach Walk', desc: 'A romantic stroll on the shore', costAP: 1, costCash: 0, satGain: 8, cooldown: 2, minLevel: 1, bonus: { normie: 5 } },
    { id: 'loc_concert', label: '🎵 Concert', desc: 'See a live band', costAP: 1, costCash: 300, satGain: 22, cooldown: 2, minLevel: 2, bonus: { egirl: 10 } },
    { id: 'loc_rooftop', label: '🌆 Rooftop Bar', desc: 'Drinks with a stunning view', costAP: 1, costCash: 400, satGain: 25, cooldown: 2, minLevel: 2, bonus: { lookist: 10, gold_digger: 5 } },
    { id: 'loc_escape', label: '🔐 Escape Room', desc: 'Work together to escape', costAP: 1, costCash: 150, satGain: 18, cooldown: 2, minLevel: 2, bonus: { normie: 5, egirl: 5 } },
    { id: 'loc_cooking', label: '👨‍🍳 Cooking Class', desc: 'Learn to cook together', costAP: 2, costCash: 250, satGain: 30, cooldown: 3, minLevel: 3, bonus: { normie: 10 } },
    { id: 'loc_spa', label: '💆 Spa Day', desc: 'Relax and recharge as a couple', costAP: 1, costCash: 500, satGain: 35, cooldown: 3, minLevel: 3, bonus: { lookist: 10, gold_digger: 10 } }
  ];

  isLocationAvailable(location) {
    const entry = this.player.visitedLocations.find(v => v.id === location.id);
    if (!entry) return true;
    return this.player.age - entry.lastYear >= location.cooldown;
  }

  _visitLocation(locationId) {
    const entry = this.player.visitedLocations.find(v => v.id === locationId);
    if (entry) { entry.lastYear = this.player.age; }
    else { this.player.visitedLocations.push({ id: locationId, lastYear: this.player.age }); }
  }

  doInteraction(id) {
    const p = this.player;
    const profile = p.partnerProfile;
    if (!profile) return { status: 'error', msg: 'No partner data.' };

    const archetype = profile.archetype || 'normie';
    let satGain = 0;
    let msg = '';

    if (id.startsWith('loc_')) {
      const loc = DatingSimulator.DATE_LOCATIONS.find(l => l.id === id);
      if (!loc) return { status: 'error', msg: 'Unknown location.' };
      if (p.cash < loc.costCash || p.ap < loc.costAP) return { status: 'error', msg: 'Insufficient resources for this location.' };
      p.cash -= loc.costCash;
      p.ap -= loc.costAP;
      let bonus = 0;
      if (loc.bonus && loc.bonus[archetype]) bonus = loc.bonus[archetype];
      const llMult = this._getLoveLangBonus(id);
      satGain = Math.floor((loc.satGain + bonus) * llMult);
      this._visitLocation(id);
      this._growPartnerStats(satGain);
      msg = `You took ${profile.name} on ${loc.label.toLowerCase()}. +${satGain} satisfaction.${bonus > 0 ? ' (Archetype bonus!)' : ''}${llMult > 1 ? ' 💕 Love language match!' : ''}`;
    } else if (id.startsWith('gift_')) {
      const g = DatingSimulator.GIFTS.find(x => x.id === id);
      if (!g) return { status: 'error', msg: 'Unknown gift.' };
      if (p.cash < g.cost) return { status: 'error', msg: 'Insufficient cash for this gift.' };
      p.cash -= g.cost;
      let bonus = 0;
      if (g.bonus && g.bonus[archetype]) bonus = g.bonus[archetype];
      const llMult = this._getLoveLangBonus(id);
      satGain = Math.floor((g.satGain + bonus) * llMult);
      this._growPartnerStats(satGain);
      msg = `You gave ${profile.name} ${g.label.toLowerCase()}. +${satGain} satisfaction.${bonus > 0 ? ' (Archetype bonus!)' : ''}${llMult > 1 ? ' 💕 Love language match!' : ''}`;
    } else if (id === 'living_together') {
      return this.moveInTogether();
    } else if (id === 'deep_talk') {
      if (p.ap < 1) return { status: 'error', msg: 'Not enough AP for a deep talk.' };
      p.ap -= 1;
      const llMult = this._getLoveLangBonus(id);
      satGain = Math.floor((15 + Math.floor(p.rizz / 20)) * llMult);
      if (archetype === 'normie') satGain += 5;
      this._growPartnerStats(satGain);
      msg = `You shared a deep conversation with ${profile.name}. +${satGain} satisfaction.${llMult > 1 ? ' 💕 Love language match!' : ''}`;
    } else if (id === 'adopt_pet') {
      return this.adoptPet('dog', 'Pet');
    } else if (id === 'plan_wedding') {
      return { status: 'plan_wedding' };
    } else if (id === 'propose') {
      if (p.relationshipLevel < 3) return { status: 'error', msg: 'You must be Engaged first.' };
      if (p.cash < 5000) return { status: 'error', msg: 'A ring costs $5,000!' };
      p.cash -= 5000;
      p.relationshipLevel = 4;
      p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + (p.weddingPlanned ? 45 : 30));
      p.confidence = Math.min(100, p.confidence + 20);
      if (p.weddingPlanned) this.logCallback(`💒 The wedding was beautiful! ${p.weddingVenue} venue was perfect.`, 'success');
      this.logCallback(`💍 You married ${profile.name}! Massive confidence boost!`, 'success');
      return { status: 'married' };
    } else {
      return { status: 'error', msg: 'Unknown interaction.' };
    }

    // Archetype-specific needs: lookist satisfaction decays based on appearance
    if (archetype === 'lookist' && (p.style < 50 || p.skin < 50)) {
      satGain = Math.floor(satGain * 0.6);
      msg += ' (Your appearance disappointed them — less effective.)';
    }

    // Couple goal progress
    if (p.coupleGoalId === 'goal_save' && (id.startsWith('loc_') || id.startsWith('gift_'))) {
      const spent = DatingSimulator.DATE_LOCATIONS.find(l => l.id === id)?.costCash || DatingSimulator.GIFTS.find(g => g.id === id)?.cost || 0;
      this.advanceGoal(spent);
    }
    if (p.coupleGoalId === 'goal_locations' && id.startsWith('loc_')) {
      this.advanceGoal(1);
    }

    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + satGain);
    p.confidence = Math.min(100, p.confidence + 5);
    this.logCallback(msg, 'success');

    // Check level-up
    if (p.relationshipLevel === 1 && p.yearsWithPartner >= 2 && p.relationshipSatisfaction >= 60) {
      p.relationshipLevel = 2;
      p.confidence = Math.min(100, p.confidence + 10);
      this.logCallback(`💗 Your relationship with ${profile.name} has deepened! You are now EXCLUSIVE!`, 'success');
    }
    if (p.relationshipLevel === 2 && p.yearsWithPartner >= 3 && p.relationshipSatisfaction >= 80) {
      p.relationshipLevel = 3;
      p.confidence = Math.min(100, p.confidence + 15);
      this.logCallback(`💍 ${profile.name} accepted your commitment! You are now ENGAGED!`, 'success');
    }

    return { status: 'success', satGain };
  }

  breakUp() {
    if (!this.player.hasDatingPartner) return;
    this.player.hasDatingPartner = false;
    this.player.partnerProfile = null;
    this.player.partnerName = '';
    this.player.relationshipLevel = 1;
    this.player.relationshipSatisfaction = 0;
    this.player.yearsWithPartner = 0;
    this.player.lastTextedYear = 0;
    this.player.textsRemainingThisYear = 0;
    this.player.textHistory = [];
    this.player.textRapport = 50;
    this.player.jealousyMeter = 0;
    this.player.hasActiveConflict = false;
    this.player._conflictIndex = 0;
    this.player.rivalActive = false;
    this.player.rivalYearsActive = 0;
    this.player._rivalName = null;
    this.player.livingTogether = false;
    this.player.homeType = null;
    this.player.petType = null;
    this.player.petName = null;
    this.player.partnerStyle = 50;
    this.player.partnerRizz = 50;
    this.player.partnerConfidence = 50;
    this.player.familyApproval = 50;
    this.player.partnerLoveLanguage = 'quality_time';
    this.player.coupleGoalId = null;
    this.player.coupleGoalProgress = 0;
    this.player.coupleGoalTarget = 0;
    this.player.lastAnniversaryYear = 0;
    this.player.weddingVenue = null;
    this.player.weddingPlanned = false;
    this.player.questStage = 0;
    this.player.questCompleted = false;
    this.player.questSatDecayReduction = 0;
    this.player.questPassiveIncome = 0;
    this.player.questIncomeMult = 1;
    this.player.datingScore = 0;
    this.bannedApps = [];
    this.showAppHome = true;
    this.banWarning = false;
    this.player.confidence = Math.max(0, this.player.confidence - 20);
    this.logCallback(`💔 You broke up with your partner. -20% Confidence.`, 'error');
  }

  // === TEXTING SYSTEM (THREADED, MULTI-SLOT) ===
  static TEXT_TONES = [
    { id: 'sweet', label: '💕 Sweet', text: '"Good morning, thinking of you"', satGain: 5, rizzGain: 0, confGain: 2 },
    { id: 'caring', label: '💬 Check in', text: '"How was your day?"', satGain: 3, rizzGain: 2, confGain: 0 },
    { id: 'funny', label: '😂 Meme', text: 'Sent a funny meme', satGain: 4, rizzGain: 0, confGain: 3 }
  ];

  static TEXT_MEDIA = [
    { id: 'none', label: 'Just text', icon: '💬', satMult: 1.0, rizzMult: 1.0 },
    { id: 'meme', label: 'Send a meme', icon: '📱', satMult: 1.15, rizzMult: 1.2 },
    { id: 'photo', label: 'Send a photo', icon: '📸', satMult: 1.2, rizzMult: 1.0 },
    { id: 'voice', label: 'Send voice note', icon: '🎤', satMult: 1.1, rizzMult: 1.3 }
  ];

  getMaxTextsPerYear() {
    const lvl = this.player.relationshipLevel || 1;
    return lvl === 1 ? 3 : lvl === 2 ? 5 : lvl === 3 ? 7 : 10;
  }

  getAvailableTexts() {
    if (!this.player.hasDatingPartner) return [];
    const remaining = this.player.textsRemainingThisYear;
    if (remaining <= 0) return [];
    return DatingSimulator.TEXT_TONES.map(t => ({ ...t, remaining }));
  }

  getTextHistory() {
    return this.player.textHistory || [];
  }

  getTextRapportLabel() {
    const r = this.player.textRapport || 50;
    if (r >= 90) return { label: 'Soulmates 💞', color: '#ff79c6' };
    if (r >= 70) return { label: 'Close 💕', color: '#50fa7b' };
    if (r >= 50) return { label: 'Comfortable 😊', color: '#f1fa8c' };
    if (r >= 30) return { label: 'Distant 🫤', color: '#ffb86c' };
    return { label: 'Cold 🥶', color: '#6272a4' };
  }

  textPartner(toneId, mediaId = 'none') {
    const p = this.player;
    if (!p.hasDatingPartner || !p.partnerProfile) return { status: 'error', msg: 'No partner.' };
    if (p.textsRemainingThisYear <= 0) return { status: 'error', msg: 'No texts remaining this year.' };

    const tone = DatingSimulator.TEXT_TONES.find(t => t.id === toneId);
    if (!tone) return { status: 'error', msg: 'Unknown tone.' };
    const media = DatingSimulator.TEXT_MEDIA.find(m => m.id === mediaId) || DatingSimulator.TEXT_MEDIA[0];

    p.textsRemainingThisYear--;

    const llMult = this._getLoveLangBonus(toneId);
    const rapportMult = 1 + ((p.textRapport || 50) - 50) / 200; // 0.75-1.25x based on rapport
    const baseSat = Math.floor(tone.satGain * media.satMult * llMult * rapportMult);
    const effectiveSatGain = Math.max(1, baseSat);
    p.relationshipSatisfaction = Math.min(100, Math.max(0, p.relationshipSatisfaction + effectiveSatGain));
    p.rizz = Math.min(100, Math.max(0, p.rizz + Math.floor((tone.rizzGain || 0) * media.rizzMult)));
    p.confidence = Math.min(100, Math.max(0, p.confidence + (tone.confGain || 0)));

    // Rapport increases on successful texts, bonus for media
    p.textRapport = Math.min(100, (p.textRapport || 50) + 2 + (mediaId !== 'none' ? 1 : 0));

    const archetype = p.partnerProfile.archetype || 'normie';
    const responses = this._getTextResponses(archetype, tone.id);
    const reply = responses[Math.floor(Math.random() * responses.length)];

    // Maybe get a follow-up (higher rapport = more back-and-forth)
    let followUp = '';
    if (mediaId !== 'none' && Math.random() < 0.4 + (p.textRapport || 50) / 200) {
      const mediaReactions = this._getMediaReactions(archetype, mediaId);
      followUp = mediaReactions[Math.floor(Math.random() * mediaReactions.length)];
    }

    // Store in history
    const entry = {
      year: p.age,
      tone: toneId,
      media: mediaId,
      sentText: tone.text,
      reply,
      followUp,
      satGain: effectiveSatGain
    };
    if (!p.textHistory) p.textHistory = [];
    p.textHistory.push(entry);
    if (p.textHistory.length > 20) p.textHistory = p.textHistory.slice(-20);

    const mediaIcon = mediaId !== 'none' ? media.icon + ' ' : '';
    const llLabel = llMult > 1 ? ' 💕 Love language match!' : '';
    const rapportChange = rapportMult > 1 ? ` (Rapport bonus!)` : rapportMult < 1 ? ` (Low rapport...)` : '';
    this.logCallback(`📱 You ${mediaIcon}${tone.text}`, 'action');
    this.logCallback(`💬 ${p.partnerProfile.name}: ${reply}${llLabel}${rapportChange}`, 'success');
    if (followUp) {
      this.logCallback(`💬 ${p.partnerProfile.name}: ${followUp}`, 'success');
    }

    return { status: 'success', reply, followUp, satGain: effectiveSatGain, remaining: p.textsRemainingThisYear };
  }

  _getTextResponses(archetype, toneId) {
    const all = {
      sweet: {
        lookist: ['"You\'re the only 10/10 I need 💕"', '"Aww, you look cute today too"', '"Missing you too babe 💋"', '"Keep talking like that and I\'ll be yours forever 😘"'],
        egirl: ['"Ugh you\'re so soft 🥺"', '"This is why you\'re my favorite person"', '"🤍"', '"You\'re actually adorable stop 🥹"'],
        normie: ['"You\'re so sweet 🥹"', '"Best morning ever. How did I get so lucky?"', '"Can\'t stop smiling 😊"', '"This made my whole day ❤️"'],
        gold_digger: ['"Thinking about you too... and that trip we should take 💎"', '"You\'re the best thing in my life 💕"', '"My friends are so jealous of us ❤️"', '"Sweet talker. I like it 😏"'],
        corporate: ['"Sweet of you to say. Let\'s have dinner tonight."', '"Noted. You\'re growing on me."', '"That\'s... nice. Busy day ahead?"', '"You have a way with words. Dinner?"']
      },
      caring: {
        lookist: ['"Work was fine, but I\'d rather be with you"', '"Just did a killer workout. Wish you were here 💪"', '"Busy but better now that you texted ✨"', '"Stressful week. Your text helped 💕"'],
        egirl: ['"Meh, same old. Let\'s play something later?"', '"Stressful. Send memes."', '"Actually had a good day. Wanna hear about it?"', '"Ugh today was rough. Thanks for checking 🥺"'],
        normie: ['"It was okay. Better now that you asked 🥰"', '"You\'re so thoughtful. Let\'s cook together soon!"', '"Rough day but this helps ❤️"', '"Just what I needed. You always know 💕"'],
        gold_digger: ['"Exhausting. But I saw the cutest bag today..."', '"Work work work. Take me somewhere nice?"', '"Better now. Let\'s plan our next trip 💅"', '"Long day. A spa weekend would fix everything 💆"'],
        corporate: ['"Productive day. Closed two deals."', '"Long meetings. Your text was a good break."', '"Busy but thriving. How about you?"', '"Just wrapped a big project. Celebrating soon."']
      },
      funny: {
        lookist: ['"LMAOOO stop 💀"', '"I sent this to my group chat 😂"', '"You\'re actually funny. Lucky me 😏"', '"Okay that was actually hilarious 😭"'],
        egirl: ['"SCREAMING 💀💀💀"', '"This is exactly my humor 😭"', '"Okay you win the internet today"', '"I\'m stealing this for my story 💀"'],
        normie: ['"HAHAHA I\'m saving this 📱"', '"This is so us 🤣"', '"You know exactly how to cheer me up 😂"', '"Stop I\'m at work 😭💀"'],
        gold_digger: ['"Lol cute. Send me the one with the cat 💅"', '"Okay that was actually funny 😂"', '"You\'re lucky you\'re funny *and* cute 💕"', '"Gotta say, your humor is an asset 💎"'],
        corporate: ['"...I chuckled. Well played."', '"Not bad. You\'ve earned bonus points."', '"Sending this to my assistant. Enjoy your win."', '"Fine. That was funny. Take the W."']
      }
    };
    return (all[toneId] && all[toneId][archetype]) || ['"Thanks baby ❤️"', '"You\'re the best 💕"', '"Made me smile 😊"'];
  }

  _getMediaReactions(archetype, mediaId) {
    const reactions = {
      meme: {
        lookist: ['"LMAOO accurate 💀"', '"This is so unserious 😂"', '"Okay that\'s a good one"'],
        egirl: ['"SCREAMING why is this us 😭"', '"I\'m posting this on my story"', '"Perfect timing I needed this 💀"'],
        normie: ['"Stoppp 🤣🤣🤣"', '"How do you always find the perfect ones?"', '"I snorted 😂"'],
        gold_digger: ['"Lol okay that was good 💅"', '"Send me more of these"', '"You have good taste in memes 😏"'],
        corporate: ['"...Accurate. Forwarding to my team."', '"Saving this. Well done."', '"Hmm. Not bad."']
      },
      photo: {
        lookist: ['"You look amazing 🔥"', '"Did you just wake up looking like that? 😍"', '"This is my new favorite photo 📸"'],
        egirl: ['"Aesthetic 📸"', '"Okay you\'re cute I guess 😏"', '"This is going in my camera roll 📱"'],
        normie: ['"You\'re so beautiful/handsome 🥰"', '"Made my day seeing your face ❤️"', '"😍😍😍"'],
        gold_digger: ['"Looking like a million bucks 💎"', '"That outfit 👀🔥"', '"Take me there next time 💅"'],
        corporate: ['"Sharp. I approve."', '"Good lighting. Professional."', '"Not bad. You clean up well."']
      },
      voice: {
        lookist: ['"Your voice is so calming 🥺"', '"I could listen to you all day 💕"', '"Send more voice notes 😍"'],
        egirl: ['"Omg your voiceee 🥹"', '"This is so intimate I love it 💕"', '"Voice notes > texting forever"'],
        normie: ['"I love hearing your voice 🥰"', '"This is so sweet 😭"', '"Saved it. Listening on repeat ❤️"'],
        gold_digger: ['"Mmm I like the sound of that 💕"', '"Confident. I like it."', '"That\'s... actually really nice 😏"'],
        corporate: ['"Good articulation. Well spoken."', '"I appreciate the efficiency of voice."', '"Noted. You have a good speaking voice."']
      }
    };
    return (reactions[mediaId] && reactions[mediaId][archetype]) || ['"Nice! 💕"', '"Love it 😊"', '"Thanks for sending ❤️"'];
  }

  // === QUEST SYSTEM ===
  static QUEST_CHAINS = {
    lookist: {
      name: 'The Mirror',
      stages: [
        {
          title: 'Gym Date',
          desc: (name) => `${name} wants to hit the gym together. "Let's get that pump!"`,
          choices: [
            { text: 'Crush the workout together', satGain: 15, style: 2, skin: 1, resultMsg: 'You both got an insane pump. They love the effort.' },
            { text: 'Spot them but take it easy', satGain: 5, style: 1, resultMsg: 'You tried. They appreciate you showing up.' },
            { text: 'Skip — too tired', satGain: -10, confidence: -3, resultMsg: `They're disappointed you didn't prioritize fitness.` }
          ]
        },
        {
          title: 'The Photoshoot',
          desc: (name) => `${name} booked a couple's photoshoot. "We'll look flawless!"`,
          choices: [
            { text: 'Pose with confidence', satGain: 15, style: 3, confidence: 5, resultMsg: 'The photos turned out amazing. Your confidence shines.' },
            { text: 'Agree but feel awkward', satGain: 5, resultMsg: 'The photos are mid but at least you showed up.' },
            { text: 'Refuse — too vain', satGain: -10, style: -2, resultMsg: `${name} is annoyed you didn't support their vision.` }
          ]
        },
        {
          title: 'Aging Fears',
          desc: (name) => `${name} confesses: "I'm scared of losing my looks as I get older."`,
          choices: [
            { text: 'Reassure them with genuine warmth', satGain: 20, rizz: 3, resultMsg: 'Your words truly comforted them. They feel secure.' },
            { text: 'Suggest skincare routines', satGain: 8, skin: 2, resultMsg: 'Practical advice. They appreciate the tips.' },
            { text: 'Brush it off', satGain: -5, confidence: -3, resultMsg: 'They felt dismissed and shut down.' }
          ]
        },
        {
          title: 'Going Public',
          desc: (name) => `${name} wants to post your relationship on social media. "You in?"`,
          choices: [
            { text: 'Post a cute couple photo', satGain: 25, confidence: 5, style: 2, resultMsg: 'The likes pour in. You both feel validated.' },
            { text: 'Let them post, stay low-key', satGain: 10, resultMsg: 'They appreciate the compromise.' },
            { text: 'Say no — keep it private', satGain: -15, resultMsg: `${name} feels like you're hiding them.` }
          ]
        }
      ],
      reward: { desc: 'You\'ve embraced the spotlight together. Permanent +10 Style, +10 Skin.', style: 10, skin: 10 }
    },
    egirl: {
      name: 'The Real Connection',
      stages: [
        {
          title: 'Game Night',
          desc: (name) => `${name} challenges you to a fighting game. "Hope you're ready to lose!"`,
          choices: [
            { text: 'Play competitively and have fun', satGain: 15, rizz: 2, resultMsg: 'Epic battles! You bonded over the competition.' },
            { text: 'Let them win', satGain: 8, resultMsg: 'They saw through it but thought it was sweet.' },
            { text: 'Refuse — games are childish', satGain: -10, confidence: -2, resultMsg: 'They feel judged for their hobbies.' }
          ]
        },
        {
          title: 'Playlist Share',
          desc: (name) => `${name} made you a playlist. "Each song means something. Listen with me."`,
          choices: [
            { text: 'Listen intently and discuss', satGain: 20, rizz: 3, resultMsg: 'You connected on a deep emotional level through music.' },
            { text: 'Put it on as background', satGain: 5, resultMsg: 'They noticed you weren\'t really listening.' },
            { text: 'Say you\'ll listen later', satGain: -8, resultMsg: 'You forgot. They noticed.' }
          ]
        },
        {
          title: 'Opening Up',
          desc: (name) => `${name} gets vulnerable. "I don't talk about this with anyone."`,
          choices: [
            { text: 'Hold them and listen', satGain: 25, confidence: 5, resultMsg: 'They feel truly seen and safe with you.' },
            { text: 'Share your own struggles', satGain: 15, rizz: 3, resultMsg: 'Mutual vulnerability strengthens your bond.' },
            { text: 'Change the subject', satGain: -15, resultMsg: 'They shut down. Trust takes a hit.' }
          ]
        },
        {
          title: 'The Real Meet',
          desc: (name) => `${name} wants to take you somewhere meaningful. "This place is special to me."`,
          choices: [
            { text: 'Go enthusiastically', satGain: 30, rizz: 5, confidence: 5, resultMsg: 'An unforgettable day. You\'ve never felt closer.' },
            { text: 'Go but keep guard up', satGain: 10, resultMsg: 'It was nice but they wanted more from you.' },
            { text: 'Cancel', satGain: -20, resultMsg: `They're deeply hurt you didn't come.` }
          ]
        }
      ],
      reward: { desc: 'You\'ve earned their deepest trust. Permanent +15 Rizz.', rizz: 15 }
    },
    normie: {
      name: 'Soulmates',
      stages: [
        {
          title: 'Home Cooking',
          desc: (name) => `${name} wants to cook dinner together. "I make a mean pasta!"`,
          choices: [
            { text: 'Cook together and laugh', satGain: 15, rizz: 2, resultMsg: 'The kitchen is a mess but your hearts are full.' },
            { text: 'Order takeout instead', satGain: 5, resultMsg: 'Easy but less memorable.' },
            { text: 'Let them cook alone', satGain: -5, confidence: -2, resultMsg: 'They feel like they\'re putting in all the effort.' }
          ]
        },
        {
          title: 'Hobby Time',
          desc: (name) => `${name} wants to show you their favorite hobby.`,
          choices: [
            { text: 'Give it an honest try', satGain: 15, style: 2, resultMsg: 'You actually enjoyed it! They\'re thrilled.' },
            { text: 'Watch and cheer them on', satGain: 8, resultMsg: 'Your support means a lot to them.' },
            { text: 'Not interested', satGain: -5, resultMsg: 'They feel rejected.' }
          ]
        },
        {
          title: 'Meet the Friends',
          desc: (name) => `${name}'s friends want to meet you. "They're excited!"`,
          choices: [
            { text: 'Be charming and sociable', satGain: 20, rizz: 3, confidence: 3, resultMsg: 'The friends love you. Your partner is beaming.' },
            { text: 'Be polite but quiet', satGain: 8, resultMsg: 'Acceptable but they hoped you\'d engage more.' },
            { text: 'Cancel', satGain: -10, confidence: -3, resultMsg: 'They\'re embarrassed having to cancel on friends.' }
          ]
        },
        {
          title: 'The Surprise',
          desc: (name) => `${name} planned a surprise for you. They seem nervous.`,
          choices: [
            { text: 'Embrace it with open arms', satGain: 30, confidence: 5, rizz: 3, resultMsg: 'The surprise was perfect. You\'re both overjoyed.' },
            { text: 'Appreciate it but overwhelmed', satGain: 10, resultMsg: 'Sweet, but your reaction was muted.' },
            { text: 'Anxiety', satGain: -10, resultMsg: 'They feel their effort went unappreciated.' }
          ]
        }
      ],
      reward: { desc: 'You\'ve built a rock-solid foundation. Satisfaction decay reduced by 1/year permanently.', satDecayReduction: 1 }
    },
    gold_digger: {
      name: 'Trust & Treasure',
      stages: [
        {
          title: 'Money Talk',
          desc: (name) => `${name} asks about your financial goals. "Where do you see yourself?"`,
          choices: [
            { text: 'Share ambitious plans', satGain: 15, rizz: 2, confidence: 2, resultMsg: 'They\'re impressed by your drive.' },
            { text: 'Be humble but honest', satGain: 8, resultMsg: 'Honest but not very exciting to them.' },
            { text: 'Deflect', satGain: -5, resultMsg: 'They sense you\'re insecure about money.' }
          ]
        },
        {
          title: 'Shopping Spree',
          desc: (name) => `${name} wants to take you shopping. "My treat. Pick something nice."`,
          choices: [
            { text: 'Accept graciously, pick one item', satGain: 15, style: 3, resultMsg: 'Classy. They appreciate your restraint.' },
            { text: 'Go all out', satGain: 5, cash: 500, style: 5, resultMsg: 'You got some nice stuff, but they noticed the greed.' },
            { text: 'Refuse — don\'t owe them', satGain: -8, confidence: 3, resultMsg: 'They respect your independence but feel rejected.' }
          ]
        },
        {
          title: 'The Prenup',
          desc: (name) => `${name} brings up a prenuptial agreement. "It's just practical."`,
          choices: [
            { text: 'Sign without hesitation', satGain: 25, confidence: 5, resultMsg: 'They\'re relieved and touched by your trust.' },
            { text: 'Read carefully, then sign', satGain: 15, rizz: 2, resultMsg: 'Responsible. They respect your thoroughness.' },
            { text: 'Refuse', satGain: -20, resultMsg: 'This becomes a major issue between you.' }
          ]
        },
        {
          title: 'The Secret Vault',
          desc: (name) => `${name} reveals their true wealth. "I needed to trust you first."`,
          choices: [
            { text: 'Appreciate the trust', satGain: 30, cash: 2500, resultMsg: `They're overjoyed you love them for who they are. And you get a generous gift.` },
            { text: 'Offer to help manage it', satGain: 15, rizz: 5, resultMsg: 'You discuss future investments together.' },
            { text: 'Act entitled', satGain: -25, cash: -1000, resultMsg: 'They withdraw. This was a test — and you failed.' }
          ]
        }
      ],
      reward: { desc: 'You\'ve earned their trust completely. +$1,000 passive income per year.', passiveIncome: 1000 }
    },
    corporate: {
      name: 'Power Couple',
      stages: [
        {
          title: 'The Gala',
          desc: (name) => `${name} scored invites to a networking gala. "This could be huge!"`,
          choices: [
            { text: 'Network like a pro', satGain: 15, rizz: 3, confidence: 3, resultMsg: 'You made connections. They\'re proud to have you by their side.' },
            { text: 'Stick by their side', satGain: 10, resultMsg: 'Solid support but you didn\'t make your own mark.' },
            { text: 'Skip it', satGain: -8, confidence: -2, resultMsg: 'They went alone and felt embarrassed explaining your absence.' }
          ]
        },
        {
          title: 'The Side Hustle',
          desc: (name) => `${name} wants to start a joint venture. "We'd make a great team."`,
          choices: [
            { text: 'Invest $2,000 and dive in', satGain: 20, cash: -2000, rizz: 3, resultMsg: 'The business is off to a promising start!' },
            { text: 'Support but stay hands-off', satGain: 8, cash: -500, resultMsg: 'Small investment, minimal involvement.' },
            { text: 'Too risky', satGain: -10, resultMsg: 'They feel you don\'t believe in them.' }
          ]
        },
        {
          title: 'The Relocation Offer',
          desc: (name) => `${name} got a dream job offer... in another city. "Come with me?"`,
          choices: [
            { text: 'Support unconditionally', satGain: 25, confidence: 5, resultMsg: 'Your unwavering support means everything.' },
            { text: 'Negotiate a timeline', satGain: 15, rizz: 3, resultMsg: 'A mature compromise. You both feel heard.' },
            { text: 'Say no', satGain: -20, resultMsg: 'This creates a rift that may not heal.' }
          ]
        },
        {
          title: 'The Corner Office',
          desc: (name) => `${name} got the promotion. But it means twice the hours. "Will you wait?"`,
          choices: [
            { text: 'Weather it together', satGain: 30, rizz: 5, confidence: 5, resultMsg: 'You\'re a true partner. They promise to make it up to you.' },
            { text: 'Support with boundaries', satGain: 15, style: 2, resultMsg: 'Healthy balance. You\'ll make it work.' },
            { text: 'Complain about the hours', satGain: -15, resultMsg: 'They feel torn between you and their dream.' }
          ]
        }
      ],
      reward: { desc: 'You\'re an unstoppable power couple. Permanent +25% income on all earnings.', incomeMult: 1.25 }
    }
  };

  getQuestChain() {
    if (!this.player.hasDatingPartner || !this.player.partnerProfile) return null;
    const archetype = this.player.partnerProfile.archetype || 'normie';
    return DatingSimulator.QUEST_CHAINS[archetype] || null;
  }

  startQuest() {
    if (this.player.questStage !== 0) return { status: 'error', msg: 'Quest already in progress or completed.' };
    if (!this.player.hasDatingPartner) return { status: 'error', msg: 'No partner.' };
    this.player.questStage = 1;
    this.logCallback(`📜 Quest started: ${this.getQuestChain().name}`, 'success');
    return { status: 'started' };
  }

  getCurrentQuestStage() {
    const chain = this.getQuestChain();
    if (!chain || this.player.questStage < 1 || this.player.questStage > chain.stages.length) return null;
    return chain.stages[this.player.questStage - 1];
  }

  advanceQuest(choiceIndex) {
    const chain = this.getQuestChain();
    const stage = this.getCurrentQuestStage();
    if (!chain || !stage) return { status: 'error', msg: 'No active quest.' };
    if (choiceIndex < 0 || choiceIndex >= stage.choices.length) return { status: 'error', msg: 'Invalid choice.' };

    const choice = stage.choices[choiceIndex];
    const p = this.player;

    if (choice.satGain) p.relationshipSatisfaction = Math.min(100, Math.max(0, p.relationshipSatisfaction + choice.satGain));
    if (choice.cash) {
      if (choice.cash < 0 && p.cash < Math.abs(choice.cash)) return { status: 'error', msg: 'Insufficient cash for this choice.' };
      p.cash = Math.max(0, p.cash + choice.cash);
    }
    if (choice.confidence) p.confidence = Math.min(100, Math.max(0, p.confidence + choice.confidence));
    if (choice.style) p.style = Math.min(100, p.style + choice.style);
    if (choice.skin) p.skin = Math.min(100, p.skin + choice.skin);
    if (choice.rizz) p.rizz = Math.min(100, p.rizz + choice.rizz);

    if (p.questStage >= chain.stages.length) {
      p.questStage = -1;
      p.questCompleted = true;
      const reward = chain.reward;
      if (reward.style) p.style = Math.min(100, p.style + reward.style);
      if (reward.skin) p.skin = Math.min(100, p.skin + reward.skin);
      if (reward.rizz) p.rizz = Math.min(100, p.rizz + reward.rizz);
      if (reward.passiveIncome) p.questPassiveIncome = (p.questPassiveIncome || 0) + reward.passiveIncome;
      if (reward.incomeMult) p.questIncomeMult = (p.questIncomeMult || 1) * reward.incomeMult;
      if (reward.satDecayReduction) p.questSatDecayReduction = (p.questSatDecayReduction || 0) + reward.satDecayReduction;
      p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 15);
      this.logCallback(`🏆 Quest complete! ${reward.desc}`, 'success');
      return { status: 'completed', reward };
    }

    p.questStage++;
    this.logCallback(`📖 ${choice.resultMsg || 'Quest continues...'}`, 'success');
    return { status: 'advanced', stage: p.questStage };
  }

  cancelQuest() {
    if (this.player.questStage <= 0) return;
    this.player.questStage = 0;
    this.logCallback('Quest cancelled.', 'error');
  }

  // === GIFT CATALOG ===
  static GIFTS = [
    { id: 'gift_flowers', label: '💐 Flowers', cost: 150, satGain: 15, bonus: { lookist: 5, normie: 5 } },
    { id: 'gift_perfume', label: '🍾 Perfume', cost: 400, satGain: 22, bonus: { gold_digger: 10, egirl: 5 } },
    { id: 'gift_jewelry', label: '💎 Jewelry', cost: 2000, satGain: 35, bonus: { gold_digger: 15, lookist: 10 } }
  ];

  // === LOVE LANGUAGE MAPPING ===
  static LOVE_LANGUAGES = {
    lookist: 'words_of_affirmation', egirl: 'quality_time', normie: 'quality_time',
    gold_digger: 'gifts', corporate: 'acts_of_service'
  };

  static LOVE_LANG_LABELS = {
    words_of_affirmation: 'Words of Affirmation', quality_time: 'Quality Time',
    gifts: 'Gifts', acts_of_service: 'Acts of Service'
  };

  static LOVE_LANG_ACTIONS = {
    sweet: 'words_of_affirmation', caring: 'words_of_affirmation', funny: 'quality_time',
    gift_flowers: 'gifts', gift_perfume: 'gifts', gift_jewelry: 'gifts',
    loc_restaurant: 'quality_time', loc_park: 'quality_time', loc_movies: 'quality_time',
    loc_beach: 'quality_time', loc_concert: 'quality_time', loc_rooftop: 'quality_time',
    loc_escape: 'quality_time', loc_cooking: 'acts_of_service', loc_spa: 'acts_of_service',
    deep_talk: 'words_of_affirmation'
  };

  _getLoveLangBonus(actionId) {
    const p = this.player;
    if (!p.partnerLoveLanguage) return 1;
    const actionLang = DatingSimulator.LOVE_LANG_ACTIONS[actionId];
    return actionLang === p.partnerLoveLanguage ? 2 : 1;
  }

  // === CONFLICT SYSTEM ===
  static CONFLICTS = [
    { title: '👿 Jealousy Flare', desc: (n) => `${n} snaps: "You're always at the gym/work. Do you even care about us?"`,
      choices: [
        { text: 'Apologize and promise to do better', satGain: 20, jealousy: -30 },
        { text: 'Defend yourself — you need to grind', satGain: -10, jealousy: 20 },
        { text: 'Compromise — schedule more us time', satGain: 10, jealousy: -15 }
      ] },
    { title: '💔 Trust Issue', desc: (n) => `${n} says: "I saw you liked someone else's photo... who is that?"`,
      choices: [
        { text: 'Reassure them it\'s nothing', satGain: 15, jealousy: -20 },
        { text: 'Get defensive', satGain: -15, jealousy: 25 },
        { text: 'Show them your phone', satGain: 20, jealousy: -35 }
      ] },
    { title: '🗣️ Communication Breakdown', desc: (n) => `${n}: "You never listen to me anymore."`,
      choices: [
        { text: 'Sit down and really listen', satGain: 20, rizz: 2 },
        { text: 'Say they\'re overreacting', satGain: -15, confidence: -3 },
        { text: 'Suggest couple\'s counseling', satGain: 10, familyApproval: 5 }
      ] }
  ];

  getActiveConflict() {
    if (!this.player.hasActiveConflict) return null;
    const conflict = DatingSimulator.CONFLICTS[this.player._conflictIndex || 0];
    return conflict;
  }

  resolveConflict(choiceIndex) {
    const p = this.player;
    if (!p.hasActiveConflict) return { status: 'error', msg: 'No active conflict.' };
    const conflict = DatingSimulator.CONFLICTS[p._conflictIndex || 0];
    if (!conflict || choiceIndex < 0 || choiceIndex >= conflict.choices.length) return { status: 'error', msg: 'Invalid choice.' };
    const choice = conflict.choices[choiceIndex];
    p.hasActiveConflict = false;
    p._conflictIndex = 0;
    if (choice.satGain) p.relationshipSatisfaction = Math.min(100, Math.max(0, p.relationshipSatisfaction + choice.satGain));
    if (choice.jealousy) p.jealousyMeter = Math.min(100, Math.max(0, p.jealousyMeter + choice.jealousy));
    if (choice.rizz) p.rizz = Math.min(100, p.rizz + choice.rizz);
    if (choice.confidence) p.confidence = Math.min(100, Math.max(0, p.confidence + choice.confidence));
    if (choice.familyApproval) p.familyApproval = Math.min(100, Math.max(0, p.familyApproval + choice.familyApproval));
    return { status: 'resolved', msg: `Conflict resolved!` };
  }

  // === RIVAL SYSTEM ===
  getRivalStatus() {
    const p = this.player;
    if (!p.rivalActive) return null;
    return { name: p._rivalName || 'Unknown', yearsActive: p.rivalYearsActive };
  }

  handleRival(choice) {
    const p = this.player;
    if (!p.rivalActive) return { status: 'error', msg: 'No rival.' };
    if (choice === 'confront') {
      p.rivalActive = false;
      p.rivalYearsActive = 0;
      p._rivalName = null;
      p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 15);
      p.confidence = Math.min(100, p.confidence + 10);
      return { status: 'success', msg: 'You confronted the rival and saved your relationship!' };
    }
    if (choice === 'ignore') {
      p.rivalYearsActive++;
      p.relationshipSatisfaction = Math.max(0, p.relationshipSatisfaction - 10);
      if (p.rivalYearsActive >= 3) {
        this.breakUp();
        p.rivalActive = false;
        p.rivalYearsActive = 0;
        p._rivalName = null;
        return { status: 'lost', msg: 'Your partner left you for the rival.' };
      }
      return { status: 'warning', msg: 'The rival is still around...' };
    }
    if (choice === 'let_go') {
      this.breakUp();
      p.rivalActive = false;
      p.rivalYearsActive = 0;
      p._rivalName = null;
      return { status: 'breakup', msg: 'You let your partner go. It hurts but it\'s done.' };
    }
    return { status: 'error', msg: 'Unknown choice.' };
  }

  // === LIVING TOGETHER ===
  moveInTogether(venue) {
    const p = this.player;
    if (p.relationshipLevel < 3) return { status: 'error', msg: 'Need to be engaged first.' };
    if (p.cash < 8000) return { status: 'error', msg: 'Need $8,000 for a down payment.' };
    if (p.livingTogether) return { status: 'error', msg: 'Already living together.' };
    p.cash -= 8000;
    p.livingTogether = true;
    p.homeType = venue || 'apartment';
    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 25);
    p.confidence = Math.min(100, p.confidence + 15);
    this.logCallback(`🏠 You moved in together! +25 satisfaction, +15 confidence.`, 'success');
    return { status: 'success' };
  }

  // === PET ADOPTION ===
  adoptPet(petType, petName) {
    const p = this.player;
    if (p.relationshipLevel < 2) return { status: 'error', msg: 'Need exclusive relationship.' };
    if (p.cash < 300) return { status: 'error', msg: 'Adoption costs $300.' };
    if (p.petType) return { status: 'error', msg: 'You already have a pet!' };
    p.cash -= 300;
    p.petType = petType;
    p.petName = petName;
    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 15);
    p.confidence = Math.min(100, p.confidence + 10);
    this.logCallback(`🐾 You adopted ${petName} the ${petType}!`, 'success');
    return { status: 'success' };
  }

  // === WEDDING PLANNER ===
  planWedding(venue) {
    const p = this.player;
    if (p.relationshipLevel < 3) return { status: 'error', msg: 'Need to be engaged.' };
    if (p.weddingPlanned) return { status: 'error', msg: 'Wedding already planned.' };
    const validVenues = ['beach', 'church', 'city_hall', 'garden'];
    if (!validVenues.includes(venue)) return { status: 'error', msg: 'Invalid venue.' };
    p.weddingVenue = venue;
    p.weddingPlanned = true;
    const bonuses = { beach: 20, church: 25, city_hall: 10, garden: 30 };
    const bonus = bonuses[venue] || 15;
    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + bonus);
    this.logCallback(`💒 Wedding planned at the ${venue}! +${bonus} satisfaction.`, 'success');
    return { status: 'success' };
  }

  // === PARTNER STATS GROWTH ===
  _growPartnerStats(amount = 1) {
    const p = this.player;
    if (!p.hasDatingPartner) return;
    p.partnerStyle = Math.min(100, (p.partnerStyle || 50) + Math.floor(amount * 0.3));
    p.partnerRizz = Math.min(100, (p.partnerRizz || 50) + Math.floor(amount * 0.3));
    p.partnerConfidence = Math.min(100, (p.partnerConfidence || 50) + Math.floor(amount * 0.4));
  }

  // === ANNIVERSARY EVENTS ===
  static ANNIVERSARIES = {
    lookist: [
      'bought matching designer outfits for the occasion 🕶️',
      'booked a luxury photoshoot to capture the moment 📸',
      'posted a perfect couple selfie with a heartfelt caption 💕'
    ],
    egirl: [
      'made you a custom playlist to celebrate 🎧',
      'planned a private gaming session with your favorite snacks 🎮',
      'took you to a underground concert venue you\'d never find alone 🎵'
    ],
    normie: [
      'cooked your favorite meal and set up a candlelit dinner 🕯️',
      'recreated your first date down to the smallest detail 🥹',
      'wrote you a long, heartfelt letter 📝'
    ],
    gold_digger: [
      'booked a surprise weekend at a 5-star resort 🏨',
      'bought you something from your wishlist you mentioned months ago 🎁',
      'took you on a hot air balloon ride at sunset 🎈'
    ],
    corporate: [
      'reserved the entire top floor of a restaurant for just the two of you 🌃',
      'planned a sophisticated wine tasting event 🍷',
      'arranged a surprise weekend itinerary — spreadsheet included 📊'
    ]
  };

  checkAnniversary() {
    const p = this.player;
    if (!p.hasDatingPartner || p.lastAnniversaryYear >= p.yearsWithPartner) return null;
    p.lastAnniversaryYear = p.yearsWithPartner;
    const archetype = p.partnerProfile?.archetype || 'normie';
    const events = DatingSimulator.ANNIVERSARIES[archetype] || DatingSimulator.ANNIVERSARIES.normie;
    const event = events[Math.floor(Math.random() * events.length)];
    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 20);
    p.confidence = Math.min(100, p.confidence + 5);
    return { year: p.yearsWithPartner, event };
  }

  // === COUPLE GOALS ===
  static GOALS = [
    { id: 'goal_save', label: '💰 Save $5,000 Together', target: 5000, progressType: 'cash', reward: { desc: 'Financial trust bonus: +$200/yr passive income', passiveIncome: 200 } },
    { id: 'goal_locations', label: '📍 Visit 5 Different Date Spots', target: 5, progressType: 'locations', reward: { desc: 'Adventurous couple: +10 Rizz, +10 Style', rizz: 10, style: 10 } },
    { id: 'goal_years', label: '💕 Stay Together 5 Years', target: 5, progressType: 'years', reward: { desc: 'Enduring love: satisfaction decay -1/yr permanently', satDecayReduction: 1 } }
  ];

  getAvailableGoals() {
    if (!this.player.hasDatingPartner) return [];
    return DatingSimulator.GOALS.filter(g => !this.player.coupleGoalId || this.player.coupleGoalId !== g.id);
  }

  startGoal(goalId) {
    const p = this.player;
    if (p.coupleGoalId) return { status: 'error', msg: 'Already working on a goal.' };
    const goal = DatingSimulator.GOALS.find(g => g.id === goalId);
    if (!goal) return { status: 'error', msg: 'Unknown goal.' };
    p.coupleGoalId = goalId;
    p.coupleGoalProgress = 0;
    p.coupleGoalTarget = goal.target;
    this.logCallback(`🎯 New couple goal: ${goal.label}`, 'success');
    return { status: 'started' };
  }

  advanceGoal(amount = 1) {
    const p = this.player;
    if (!p.coupleGoalId) return { status: 'error', msg: 'No active goal.' };
    p.coupleGoalProgress = Math.min(p.coupleGoalTarget, (p.coupleGoalProgress || 0) + amount);
    if (p.coupleGoalProgress >= p.coupleGoalTarget) {
      const goal = DatingSimulator.GOALS.find(g => g.id === p.coupleGoalId);
      if (goal?.reward) {
        const r = goal.reward;
        if (r.passiveIncome) p.questPassiveIncome = (p.questPassiveIncome || 0) + r.passiveIncome;
        if (r.rizz) p.rizz = Math.min(100, (p.rizz || 0) + r.rizz);
        if (r.style) p.style = Math.min(100, (p.style || 0) + r.style);
        if (r.satDecayReduction) p.questSatDecayReduction = (p.questSatDecayReduction || 0) + r.satDecayReduction;
        p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 20);
        this.logCallback(`🏆 Goal complete! ${r.desc}`, 'success');
      }
      p.coupleGoalId = null;
      p.coupleGoalProgress = 0;
      return { status: 'completed' };
    }
    return { status: 'progress', progress: p.coupleGoalProgress, target: p.coupleGoalTarget };
  }
}
