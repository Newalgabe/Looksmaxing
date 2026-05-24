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

    if (this.player.gender === 'female') {
      this.profiles = this.getFemaleProfiles();
    } else {
      this.profiles = this.getMaleProfiles();
    }

    this.rollProfile();
  }

  // === LOOKSMAXXING TERM DETECTION ===
  containsLooksmaxxing(text) {
    const lower = text.toLowerCase();
    return this.looksmaxxingTerms.some(term => lower.includes(term));
  }

  // === MULTI-ROUND DATE GENERATION ===
  generateDateRounds(profile) {
    const rounds = [];
    const archetype = profile.archetype || 'normie';
    const name = profile.name;
    const isEgirl = archetype === 'egirl';

    // Round 1: Icebreaker
    rounds.push({
      prompt: `${name} breaks the ice.`,
      choices: [
        {
          text: `"You look great tonight."`,
          looksmaxxing: false,
          cashCost: 0,
          weight: 0.7
        },
        {
          text: `"Nice canthal tilt, honestly."`,
          looksmaxxing: true,
          cashCost: 0,
          weight: isEgirl ? 0.9 : 0
        },
        {
          text: `"So what do you do for fun?"`,
          looksmaxxing: false,
          cashCost: 0,
          weight: 0.5
        }
      ]
    });

    // Round 2: Getting deeper
    if (archetype === 'gold_digger') {
      rounds.push({
        prompt: `${name} glances at your watch.`,
        choices: [
          {
            text: `Flex your expensive watch (or invent one). (-$200)`,
            looksmaxxing: false,
            cashCost: 200,
            weight: 0.9
          },
          {
            text: `Talk about your investment portfolio.`,
            looksmaxxing: false,
            cashCost: 50,
            weight: 0.7
          },
          {
            text: `Explain the importance of positive canthal tilts in mate selection.`,
            looksmaxxing: true,
            cashCost: 0,
            weight: 0
          }
        ]
      });
    } else if (archetype === 'lookist') {
      rounds.push({
        prompt: `${name} examines your face carefully.`,
        choices: [
          {
            text: `"I've been working on my jawline. You?"`,
            looksmaxxing: false,
            cashCost: 0,
            weight: 0.6
          },
          {
            text: `"Your PSL rating must be at least a 6."`,
            looksmaxxing: true,
            cashCost: 0,
            weight: isEgirl ? 0.9 : 0
          },
          {
            text: `Order something impressive. (-$150)`,
            looksmaxxing: false,
            cashCost: 150,
            weight: 0.8
          }
        ]
      });
    } else if (archetype === 'egirl') {
      rounds.push({
        prompt: `${name} tilts her head and smirks.`,
        choices: [
          {
            text: `"I can tell you've been mewing. Great maxilla."`,
            looksmaxxing: true,
            cashCost: 0,
            weight: 0.9
          },
          {
            text: `"Your zygomatic structure is insane."`,
            looksmaxxing: true,
            cashCost: 0,
            weight: 0.85
          },
          {
            text: `"Wanna take a selfie for the 'gram?"`,
            looksmaxxing: false,
            cashCost: 0,
            weight: 0.5
          }
        ]
      });
    } else {
      rounds.push({
        prompt: `${name} asks about your hobbies.`,
        choices: [
          {
            text: `"I work out, travel, the usual."`,
            looksmaxxing: false,
            cashCost: 0,
            weight: 0.7
          },
          {
            text: `"I'm really into looksmaxxing and optimizing my SMV."`,
            looksmaxxing: true,
            cashCost: 0,
            weight: 0
          },
          {
            text: `Suggest doing something fun together. (-$80)`,
            looksmaxxing: false,
            cashCost: 80,
            weight: 0.8
          }
        ]
      });
    }

    // Round 3: The closer
    rounds.push({
      prompt: `The night is winding down. ${name} looks at you expectantly.`,
      choices: [
        {
          text: `"I had a great time. Let's do this again."`,
          looksmaxxing: false,
          cashCost: 0,
          weight: 0.6
        },
        {
          text: `"Based on our SMV alignment, this seems viable."`,
          looksmaxxing: true,
          cashCost: 0,
          weight: isEgirl ? 0.7 : 0
        },
        {
          text: `Pay for the whole bill. (-$200)`,
          looksmaxxing: false,
          cashCost: 200,
          weight: 0.9
        }
      ]
    });

    return rounds;
  }

  // === MATCH CALCULATION (updated with Gold Digger / Lookism) ===
  calculateMatchPercent(profile) {
    const archetype = profile.archetype || 'normie';

    if (archetype === 'gold_digger') {
      // Gold diggers care about cash much more than looks
      let prob = 10 + (this.player.cash / 10000) * 30;
      if (this.player.cash >= 20000) prob += 25;
      if (this.player.cash >= 50000) prob += 20;
      // They still have a minimum SMV floor
      if (this.player.smv < profile.reqSMV) prob -= 15;
      // Smooth operator helps
      const smoRank = this.player.getTalentEffect('smooth_operator');
      if (smoRank > 0) prob += smoRank * 5;
      return Math.max(0, Math.min(99, Math.round(prob)));
    }

    if (archetype === 'lookist') {
      // Lookists care only about SMV, not cash
      let smvDiff = this.player.smv - (profile.reqSMV || 5.0);
      let prob = 20 + smvDiff * 20;
      if (this.player.smv >= 7.5) prob += 25; // GigaChad bonus
      // Cash doesn't matter at all
      // Strict requirements still apply
      if (profile.reqHeight && this.player.height < profile.reqHeight) prob -= 30;
      if (profile.reqTilt && this.player.tilt !== profile.reqTilt) prob -= 35;
      if (profile.reqSkin && this.player.skin < profile.reqSkin) prob -= 20;
      if (this.player.rizz >= 60) prob += 10;
      const smoRank = this.player.getTalentEffect('smooth_operator');
      if (smoRank > 0) prob += smoRank * 5;
      return Math.max(0, Math.min(99, Math.round(prob)));
    }

    // Standard (normie / egirl) - existing formula
    let smvDiff = this.player.smv - profile.reqSMV;
    let prob = 30 + smvDiff * 15;

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
      avatarColor: '#00f0ff', avatarType: 'goth', gender: 'female',
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
    this.currentProfile = this.player.randomElement(this.profiles);
    this.activeChat = null;
    this.activeDateRound = 0;
    this.dateRoundsCompleted = 0;
  }

  swipeLeft() {
    this.rollProfile();
    return { status: 'pass' };
  }

  swipeRight() {
    if (this.player.ap < 1 && !this.goldSubscription) {
      return { status: 'no_ap', message: 'Out of Swipe Action Points! Wait for next year or buy Premium Gold.' };
    }
    if (!this.goldSubscription) this.player.ap -= 1;

    const matchChance = this.calculateMatchPercent(this.currentProfile);
    const rolledMatch = (Math.random() * 100) < matchChance;

    if (!rolledMatch) {
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

    // Normal match — start multi-round date
    this.activeChat = {
      profile: this.currentProfile,
      isCatfish: false,
      chatLog: [{ sender: 'partner', text: this.currentProfile.dialogues.match }],
      resolved: false
    };
    this.activeDateRound = 0;
    this.dateRoundsCompleted = 0;
    this.logCallback(`Matched with ${this.currentProfile.name}! Match Rate: ${matchChance}%`, 'success');
    return { status: 'match', chat: this.activeChat };
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
        this.activeChat.chatLog.push({ sender: 'system-chat', text: `✔ ${this.currentProfile.name} seems interested. Round ${this.activeDateRound + 1}...` });
        this.activeChat.chatLog.push({ sender: 'partner', text: nextRound.prompt });
        return { status: 'date_continue', currentRound: this.activeDateRound, totalRounds: rounds.length };
      }
    } else {
      // Failed this round
      this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.reject });
      this.player.confidence = Math.max(0, this.player.confidence - 15);
      this.activeChat.resolved = true;
      this.logCallback(`Rejected by ${this.currentProfile.name} mid-date. -15% Confidence.`, "error");
      this.rollProfile();
      this.player.updateSMV();
      return { status: 'date_failed' };
    }
  }

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

    interactions.push({ id: 'gift', label: 'Buy a Gift', desc: 'A thoughtful present', costAP: 0, costCash: 500, satGain: 25, minLevel: 1 });
    interactions.push({ id: 'deep_talk', label: 'Deep Talk', desc: 'A heartfelt conversation', costAP: 1, costCash: 0, satGain: 15, minLevel: 1, requiresRizz: 50 });
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
    return this.player.age - entry.lastYear > location.cooldown;
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
      p.cash -= loc.costCash;
      p.ap -= loc.costAP;
      let bonus = 0;
      if (loc.bonus && loc.bonus[archetype]) bonus = loc.bonus[archetype];
      satGain = loc.satGain + bonus;
      this._visitLocation(id);
      msg = `You took ${profile.name} on ${loc.label.toLowerCase()}. +${satGain} satisfaction.${bonus > 0 ? ' (Archetype bonus!)' : ''}`;
    } else if (id === 'gift') {
      p.cash -= 500;
      satGain = 25;
      if (archetype === 'gold_digger') satGain += 15;
      if (p.cash >= 20000) satGain += 5;
      msg = `You gave ${profile.name} a thoughtful gift. +${satGain} satisfaction.`;
    } else if (id === 'deep_talk') {
      p.ap -= 1;
      satGain = 15 + Math.floor(p.rizz / 20);
      if (archetype === 'normie') satGain += 5;
      msg = `You shared a deep conversation with ${profile.name}. +${satGain} satisfaction.`;
    } else if (id === 'propose') {
      if (p.relationshipLevel < 3) return { status: 'error', msg: 'You must be Engaged first.' };
      if (p.cash < 5000) return { status: 'error', msg: 'A ring costs $5,000!' };
      p.cash -= 5000;
      p.relationshipLevel = 4;
      p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + 30);
      p.confidence = Math.min(100, p.confidence + 20);
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

    p.relationshipSatisfaction = Math.min(100, p.relationshipSatisfaction + satGain);
    p.confidence = Math.min(100, p.confidence + 5);
    this.logCallback(msg, 'success');

    // Check level-up
    const oldLevel = p.relationshipLevel;
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
    this.player.relationshipLevel = 1;
    this.player.relationshipSatisfaction = 0;
    this.player.yearsWithPartner = 0;
    this.player.lastTextedYear = 0;
    this.player.confidence = Math.max(0, this.player.confidence - 20);
    this.logCallback(`💔 You broke up with your partner. -20% Confidence.`, 'error');
  }

  // === TEXTING SYSTEM ===
  static TEXTS = [
    { id: 'sweet', label: '💕 Sweet', text: '"Good morning, thinking of you"', satGain: 5, rizzGain: 0, confGain: 2 },
    { id: 'caring', label: '💬 Check in', text: '"How was your day?"', satGain: 3, rizzGain: 2, confGain: 0 },
    { id: 'funny', label: '😂 Meme', text: 'Sent a funny meme', satGain: 4, rizzGain: 0, confGain: 3 }
  ];

  getAvailableTexts() {
    if (!this.player.hasDatingPartner) return [];
    if (this.player.lastTextedYear === this.player.age) return [];
    return DatingSimulator.TEXTS;
  }

  textPartner(toneId) {
    const p = this.player;
    if (!p.hasDatingPartner || !p.partnerProfile) return { status: 'error', msg: 'No partner.' };
    if (p.lastTextedYear === p.age) return { status: 'error', msg: 'Already texted this year.' };

    const tone = DatingSimulator.TEXTS.find(t => t.id === toneId);
    if (!tone) return { status: 'error', msg: 'Unknown tone.' };

    p.lastTextedYear = p.age;
    p.relationshipSatisfaction = Math.min(100, Math.max(0, p.relationshipSatisfaction + tone.satGain));
    p.rizz = Math.min(100, Math.max(0, p.rizz + (tone.rizzGain || 0)));
    p.confidence = Math.min(100, Math.max(0, p.confidence + (tone.confGain || 0)));

    const archetype = p.partnerProfile.archetype || 'normie';
    const responses = this._getTextResponses(archetype, tone.id);
    const reply = responses[Math.floor(Math.random() * responses.length)];

    this.logCallback(`📱 You: ${tone.text}`, 'action');
    this.logCallback(`💬 ${p.partnerProfile.name}: ${reply}`, 'success');
    return { status: 'success', reply, satGain: tone.satGain };
  }

  _getTextResponses(archetype, toneId) {
    const all = {
      sweet: {
        lookist: ['"You\'re the only 10/10 I need 💕"', '"Aww, you look cute today too"', '"Missing you too babe 💋"'],
        egirl: ['"Ugh you\'re so soft 🥺"', '"This is why you\'re my favorite person"', '"🤍"'],
        normie: ['"You\'re so sweet 🥹"', '"Best morning ever. How did I get so lucky?"', '"Can\'t stop smiling 😊"'],
        gold_digger: ['"Thinking about you too... and that trip we should take 💎"', '"You\'re the best thing in my life 💕"', '"My friends are so jealous of us ❤️"'],
        corporate: ['"Sweet of you to say. Let\'s have dinner tonight."', '"Noted. You\'re growing on me."', '"That\'s... nice. Busy day ahead?"']
      },
      caring: {
        lookist: ['"Work was fine, but I\'d rather be with you"', '"Just did a killer workout. Wish you were here 💪"', '"Busy but better now that you texted ✨"'],
        egirl: ['"Meh, same old. Let\'s play something later?"', '"Stressful. Send memes."', '"Actually had a good day. Wanna hear about it?"'],
        normie: ['"It was okay. Better now that you asked 🥰"', '"You\'re so thoughtful. Let\'s cook together soon!"', '"Rough day but this helps ❤️"'],
        gold_digger: ['"Exhausting. But I saw the cutest bag today..."', '"Work work work. Take me somewhere nice?"', '"Better now. Let\'s plan our next trip 💅"'],
        corporate: ['"Productive day. Closed two deals."', '"Long meetings. Your text was a good break."', '"Busy but thriving. How about you?"']
      },
      funny: {
        lookist: ['"LMAOOO stop 💀"', '"I sent this to my group chat 😂"', '"You\'re actually funny. Lucky me 😏"'],
        egirl: ['"SCREAMING 💀💀💀"', '"This is exactly my humor 😭"', '"Okay you win the internet today"'],
        normie: ['"HAHAHA I\'m saving this 📱"', '"This is so us 🤣"', '"You know exactly how to cheer me up 😂"'],
        gold_digger: ['"Lol cute. Send me the one with the cat 💅"', '"Okay that was actually funny 😂"', '"You\'re lucky you\'re funny *and* cute 💕"'],
        corporate: ['"...I chuckled. Well played."', '"Not bad. You\'ve earned bonus points."', '"Sending this to my assistant. Enjoy your win."']
      }
    };
    return (all[toneId] && all[toneId][archetype]) || ['"Thanks baby ❤️"', '"You\'re the best 💕"', '"Made me smile 😊"'];
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
    if (choice.cash) p.cash = Math.max(0, p.cash + choice.cash);
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
}
