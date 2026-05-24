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

    interactions.push({ id: 'date', label: 'Go on a Date', desc: 'A nice evening out', costAP: 1, costCash: 200, satGain: 20, minLevel: 1 });
    interactions.push({ id: 'gift', label: 'Buy a Gift', desc: 'A thoughtful present', costAP: 0, costCash: 500, satGain: 25, minLevel: 1 });
    interactions.push({ id: 'deep_talk', label: 'Deep Talk', desc: 'A heartfelt conversation', costAP: 1, costCash: 0, satGain: 15, minLevel: 1, requiresRizz: 50 });
    if (lvl >= 2) {
      interactions.push({ id: 'luxury_date', label: 'Luxury Date ✨', desc: 'Go all out', costAP: 1, costCash: 1000, satGain: 40, minLevel: 2 });
    }
    if (lvl >= 3) {
      interactions.push({ id: 'propose', label: 'Propose Marriage 💍', desc: 'Take the next step', costAP: 0, costCash: 5000, satGain: 0, minLevel: 3 });
    }

    return interactions.filter(i => {
      if (p.ap < i.costAP) return false;
      if (p.cash < i.costCash) return false;
      if (p.relationshipLevel < i.minLevel) return false;
      if (i.requiresRizz && p.rizz < i.requiresRizz) return false;
      return true;
    });
  }

  doInteraction(id) {
    const p = this.player;
    const profile = p.partnerProfile;
    if (!profile) return { status: 'error', msg: 'No partner data.' };

    const archetype = profile.archetype || 'normie';
    let satGain = 0;
    let msg = '';

    if (id === 'date') {
      p.cash -= 200;
      p.ap -= 1;
      satGain = 20;
      // Archetype bonuses
      if (archetype === 'normie') satGain += 10;
      if (archetype === 'egirl') satGain += 5;
      msg = `You took ${profile.name} on a lovely date. +${satGain} satisfaction.`;
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
    } else if (id === 'luxury_date') {
      p.cash -= 1000;
      p.ap -= 1;
      satGain = 40;
      if (archetype === 'gold_digger') satGain += 15;
      if (archetype === 'lookist') satGain += 5;
      msg = `You took ${profile.name} on an extravagant luxury date. +${satGain} satisfaction.`;
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
    this.player.confidence = Math.max(0, this.player.confidence - 20);
    this.logCallback(`💔 You broke up with your partner. -20% Confidence.`, 'error');
  }
}
