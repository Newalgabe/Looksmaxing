/**
 * dating.js
 * Implements the "Swipe-Maxxer" dating app simulator.
 * Calculates match probabilities based on your SMV, lets you swipe, and triggers funny chat dialogues.
 */

export class DatingSimulator {
  constructor(playerState, onLogCallback) {
    this.player = playerState;
    this.logCallback = onLogCallback;
    this.currentProfile = null;
    this.activeChat = null;
    this.goldSubscription = false;

    // Pre-made Tinder/Bumble profile archetypes
    if (this.player.gender === 'female') {
      this.profiles = [
        {
          name: 'Chad',
          age: 22,
          bio: 'D1 athlete. Looking for an 8/10+ Stacy. Must have slim proportions and good style. 🏋️‍♂️🔥',
          avatarColor: '#ff75b5',
          avatarType: 'chad',
          reqSMV: 7.5,
          reqSkin: 60,
          dialogues: {
            match: "Hey. You look decent. What's your Instagram?",
            reject: "Yeah... sorry, you don't really fit my vibe. Blocked.",
            success: "Sweet. Let's head to the gym or grab steak.",
            options: [
              { text: "Wear a designer dress (-$300)", cashCost: 300, successProb: 0.95, outcome: "success" },
              { text: "Suggest splitting a protein shake (-$10)", cashCost: 10, successProb: 0.10, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Tyrone',
          age: 24,
          bio: '6\'4". Positive canthal tilts only. Alt/goth aesthetics are a plus. Let\'s make playlist swaps.',
          avatarColor: '#bd93f9',
          avatarType: 'tyrone',
          reqTilt: 'Positive',
          reqSMV: 6.0,
          reqSkin: 65,
          dialogues: {
            match: "Hey, beautiful eyes. What kind of music are you into?",
            reject: "No offense, but you look a bit basic. Take care.",
            success: "Cool, come over to my studio. I'll play some bass.",
            options: [
              { text: "Pretend to love underground vinyl music (-$30)", cashCost: 30, successProb: 0.70, outcome: "success" },
              { text: "Talk about your high school GPA", cashCost: 0, successProb: 0.30, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Beta Bob',
          age: 25,
          bio: 'Software engineer. Looking for a nice girl to play video games and build LEGO with. 🎮🤓',
          avatarColor: '#50fa7b',
          avatarType: 'bob',
          reqSMV: 3.5,
          dialogues: {
            match: "Hi! Your profile looks really friendly. Do you like gaming?",
            reject: "Ah, sorry, I think we have different hobbies.",
            success: "Awesome! Let's hop on Discord and play Co-Op.",
            options: [
              { text: "Buy him a vintage gaming console (-$100)", cashCost: 100, successProb: 0.85, outcome: "success" },
              { text: "Explain why looksmaxing is the only truth", cashCost: 0, successProb: 0.01, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Richard',
          age: 72,
          bio: 'CEO. Looking for a beautiful companion to spoil on yacht trips. Allowance provided. 💰🛥️',
          avatarColor: '#ffb86c',
          avatarType: 'sugar_daddy',
          reqSMV: 1.0,
          dialogues: {
            match: "Hello dear! I would love to pamper you with shopping trips.",
            reject: "You're a bit too complicated for my schedule, dear.",
            success: "Perfect. Here is some allowance, let's fly out to Paris.",
            options: [
              { text: "Accept his sugar-daddy proposal (-50 Confidence, +$5,000 cash)", cashCost: -5000, successProb: 1.0, outcome: "success" },
              { text: "Politely decline to keep your self-worth", cashCost: 0, successProb: 0.0, outcome: "reject" }
            ]
          }
        }
      ];
    } else {
      this.profiles = [
        {
          name: 'Tiffany',
          age: 21,
          bio: 'No short kings! 6\'2" minimum. Must drive a clean car and take me to fine dining. 💅✨',
          avatarColor: '#ff75b5',
          avatarType: 'stacy',
          reqHeight: 74, // 6'2
          reqSMV: 7.5,
          reqSkin: 60,
          dialogues: {
            match: "Hey! Loved your height. Are you busy this weekend?",
            reject: "Wait... are you actually 5'9\"? Please delete my contact info.",
            success: "Wow, okay. Pick me up at 8. Don't be late.",
            options: [
              { text: "Take her to a Michelin-star restaurant (-$300)", cashCost: 300, successProb: 0.95, outcome: "success" },
              { text: "Suggest a coffee walk (-$10)", cashCost: 10, successProb: 0.10, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Chloe',
          age: 23,
          bio: 'Alt girl. Looking for a guy with positive canthal tilts and clean skin. Let\'s listen to vinyl and ignore our responsibilities.',
          avatarColor: '#bd93f9',
          avatarType: 'goth',
          reqTilt: 'Positive',
          reqSMV: 6.0,
          reqSkin: 65,
          dialogues: {
            match: "Hey, nice eyes. You look like you would ruin my life.",
            reject: "Ugh, you have major normie vibes. Bye.",
            success: "Let's hang out in my dark room. Bring snacks.",
            options: [
              { text: "Pretend you know underground synth bands (-$30)", cashCost: 30, successProb: 0.70, outcome: "success" },
              { text: "Flex your gym progress (+10 AP)", cashCost: 0, successProb: 0.30, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Gemma',
          age: 26,
          bio: 'Corporate analyst. Must have a stable career. Norwood 5+ is a dealbreaker. Clean skin only.',
          avatarColor: '#50fa7b',
          avatarType: 'corporate',
          reqHairline: 4, // Norwood < 4
          reqSMV: 5.0,
          reqSkin: 50,
          dialogues: {
            match: "Hello. You look presentable. What do you do for a living?",
            reject: "Sorry, I just don't feel a professional spark.",
            success: "Great, let's schedule a formal dinner date next Wednesday.",
            options: [
              { text: "Talk about your crypto gains and career (-$100)", cashCost: 100, successProb: 0.85, outcome: "success" },
              { text: "Talk about your looksmaxing forum rankings", cashCost: 0, successProb: 0.01, outcome: "reject" }
            ]
          }
        },
        {
          name: 'Gertrude',
          age: 69,
          bio: 'Looking for a young boy to spoil. I don\'t care about height or jawlines, just looking for some company and energy. 💰🛍️',
          avatarColor: '#ffb86c',
          avatarType: 'sugar',
          reqSMV: 1.0, // Swipes right on anyone!
          dialogues: {
            match: "Hello there, handsome young man! I want to spoil you.",
            reject: "Oh, you're a bit too sassy for my budget.",
            success: "Here's some shopping allowance, sweetie! Let's go to France.",
            options: [
              { text: "Accept her sugar-mommy proposal (-50 Confidence, +$5,000 cash)", cashCost: -5000, successProb: 1.0, outcome: "success" },
              { text: "Respectfully decline to preserve your dignity", cashCost: 0, successProb: 0.0, outcome: "reject" }
            ]
          }
        }
      ];
    }

    this.rollProfile();
  }

  // Calculate Match Probability
  calculateMatchPercent(profile) {
    let smvDiff = this.player.smv - profile.reqSMV;
    let prob = 30 + smvDiff * 15; // 30% base + SMV scaling

    // Strict requirements modifiers
    if (profile.reqHeight && this.player.height < profile.reqHeight) {
      const diff = profile.reqHeight - this.player.height;
      prob -= (diff * 20); // Massive height penalty
    }

    if (profile.reqTilt && this.player.tilt !== profile.reqTilt) {
      prob -= 30; // Eyes penalty
    }

    if (profile.reqHairline && this.player.hairline > profile.reqHairline) {
      prob -= 40; // Norwood baldness penalty
    }

    if (profile.reqSkin && this.player.skin < profile.reqSkin) {
      prob -= 20;
    }

    // Clamp between 0% and 99%
    return Math.max(0, Math.min(99, Math.round(prob)));
  }

  rollProfile() {
    this.currentProfile = this.player.randomElement(this.profiles);
    this.activeChat = null;
  }

  swipeLeft() {
    this.rollProfile();
    return { status: 'pass' };
  }

  swipeRight() {
    if (this.player.ap < 1 && !this.goldSubscription) {
      return { status: 'no_ap', message: 'Out of Swipe Action Points! Wait for next year or buy Premium Gold.' };
    }

    if (!this.goldSubscription) {
      this.player.ap -= 1;
    }

    const matchChance = this.calculateMatchPercent(this.currentProfile);
    const rolledMatch = (Math.random() * 100) < matchChance;

    if (rolledMatch) {
      this.activeChat = {
        profile: this.currentProfile,
        chatLog: [{ sender: 'partner', text: this.currentProfile.dialogues.match }],
        resolved: false
      };
      this.logCallback(`Matched with ${this.currentProfile.name}! Match Rate: ${matchChance}%`, 'success');
      return { status: 'match', chat: this.activeChat };
    } else {
      this.rollProfile();
      return { status: 'no_match', matchChance };
    }
  }

  buyGold() {
    if (this.player.cash < 200) {
      return false;
    }
    this.player.cash -= 200;
    this.goldSubscription = true;
    this.logCallback(`Purchased SwipeMax Premium Gold! Swipes are now FREE (AP cost removed)!`, 'success');
    return true;
  }

  chooseChatOption(optionIndex) {
    if (!this.activeChat || this.activeChat.resolved) return;
    const option = this.currentProfile.dialogues.options[optionIndex];
    if (!option) return;

    // Check cash cost
    if (option.cashCost > 0 && this.player.cash < option.cashCost) {
      this.activeChat.chatLog.push({ sender: 'system-chat', text: "Insufficient cash to support this choice!" });
      return;
    }

    // Spend cash / get cash (Sugar Mommy yields cash)
    this.player.cash -= option.cashCost;
    this.activeChat.chatLog.push({ sender: 'player', text: option.text });

    const roll = Math.random();
    if (roll < option.successProb) {
      // Chat Success
      this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.success });
      
      // Sugar partner rewards or dating upgrades
      if (this.currentProfile.name === 'Gertrude' || this.currentProfile.name === 'Richard') {
        this.player.confidence = Math.max(0, this.player.confidence - 45); // lost pride
        this.logCallback(`You traded your youthful essence for ${this.currentProfile.name}'s fortune (-45% Confidence, +$5,000 cash).`, "success");
      } else {
        this.player.confidence = Math.min(100, this.player.confidence + 20);
        this.player.datingScore += 25;
        this.player.hasDatingPartner = true;
        this.player.partnerName = this.currentProfile.name;
        this.logCallback(`Successfully secured a date with ${this.currentProfile.name}! Confidence boosted.`, "success");
      }
      
      this.activeChat.resolved = true;
      this.player.updateSMV();
    } else {
      // Chat Botched / Rejected
      this.activeChat.chatLog.push({ sender: 'partner', text: this.currentProfile.dialogues.reject });
      this.player.confidence = Math.max(0, this.player.confidence - 15);
      this.activeChat.resolved = true;
      this.player.updateSMV();
      this.logCallback(`Rejected by ${this.currentProfile.name} in chat (-15% Confidence).`, "error");
    }
  }
}
