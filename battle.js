export class BattleSystem {
  constructor(playerState, onLogCallback) {
    this.player = playerState;
    this.logCallback = onLogCallback;
    this.active = false;
    this.opponent = null;
    this.playerConfidence = 0;
    this.opponentSkepticism = 0;
    this.opponentMaxSkepticism = 0;
    this.playerHand = [];
    this.deck = [];
    this.energy = 3;
    this.maxEnergy = 3;
    this.turn = 1;
    this.isOver = false;
    this.outcome = null;
    this.opponentDialog = "";
    this.lastCardPlayed = null;
    this.isBlocking = false;
    this.momentum = 0;
    this.maxMomentum = 4;
    this.phase = 1;
    this.cardsPlayedThisTurn = 0;
    this.lastPlayedCardCost = 0;
    this.opponentRage = 0;
    this.playerEffects = {};
    this.opponentEffects = {};
    this.lastMoveName = "";
    this.lastMoveDamage = 0;
    this.lastMoveEffects = [];

    const passives = {
      hs_bully: { name: 'Mean Streak', desc: 'Attacks deal +5 damage when your Confidence > 60%' },
      vip_bouncer: { name: 'Velvet Rope', desc: 'Your first card each turn deals 30% less damage' },
      chad_gym_bro: { name: 'Grindset', desc: 'Heals 5 Skepticism when you play a 2-cost card' },
      stacy_tinder: { name: 'High Standards', desc: '1-cost cards deal 40% less damage' },
      ceo_interviewer: { name: 'Power Play', desc: 'Every 3 turns, attacks deal +10 damage' },
      clav_influencer: { name: 'Swipe Fatigue', desc: 'Each card you play heals them 3 Skepticism' },
      brad_boss: { name: 'Quarterly Review', desc: 'Attacks deal +8 damage on even turns' },
      forum_admin: { name: 'Permaban', desc: 'Attacks deal +4 more damage each turn (cumulative)' },
      plastic_surgeon: { name: 'Clinical Eye', desc: 'All card damage reduced by 15%' },
      tiktok_rat: { name: 'Shadow Ban', desc: 'At turn start, randomly discards 1 card from your hand' },
      social_media_manager: { name: 'Report Spam', desc: 'Your healing is 30% less effective' },
      ex_partner: { name: 'Emotional Damage', desc: 'Attacks deal +6 damage when your Confidence < 40%' },
      fixer: { name: 'Debt Collector', desc: 'Each turn you take +3 damage from financial pressure' },
      influencer_agent: { name: 'Hype Drain', desc: 'Your first card each turn costs +1 energy' },
      mastermind: { name: 'Omega Chess', desc: 'All your card effects have 30% less impact' }
    };

    const moves = {
      hs_bully: [
        { name: 'Schoolyard Shade', baseDamage: 8, priority: 0, dialog: "You call that a fit? My grandma dresses better." },
        { name: 'Triple Taunt', baseDamage: 12, priority: 1, condition: b => b.turn >= 2, targetEffects: { vulnerable: { duration: 2 } }, dialog: "Oh you're actually trying? That's cute." },
        { name: 'Gang Up', baseDamage: 10, priority: 2, condition: b => b.turn >= 4, dialog: "My friends are watching. You're about to get roasted." }
      ],
      vip_bouncer: [
        { name: 'The Once-Over', baseDamage: 10, priority: 0, dialog: "Shoes are off-brand. Not a good look." },
        { name: 'Clipboard Block', baseDamage: 8, priority: 1, condition: b => b.turn >= 2, selfEffects: { shield: { value: 15 } }, dialog: "Not on the list. Security!" },
        { name: 'Velvet Rope Burn', baseDamage: 14, priority: 2, condition: b => b.turn >= 4, targetEffects: { weakened: { duration: 2 } }, dialog: "VIP section is closed to your kind tonight." }
      ],
      chad_gym_bro: [
        { name: 'Deadlift Shame', baseDamage: 12, priority: 0, dialog: "What do you bench? Never mind, I can tell." },
        { name: 'Protein Shake Spit', baseDamage: 10, priority: 1, selfEffects: { regeneration: { value: 5, duration: 2 } }, dialog: "You're making me lose gains by existing." },
        { name: 'Squat Rack Dominance', baseDamage: 16, priority: 2, condition: b => b.phase === 2, dialog: "THIS IS MY RACK! LIGHTWEIGHT BABY!" }
      ],
      stacy_tinder: [
        { name: 'The Swipe', baseDamage: 14, priority: 0, dialog: "Left. Next." },
        { name: 'Height Check', baseDamage: 10, priority: 1, condition: b => b.player.height < 70, targetEffects: { vulnerable: { duration: 3 } }, dialog: "You're not 6 feet? Next!" },
        { name: 'Expectation Bomb', baseDamage: 18, priority: 2, condition: b => b.turn >= 3, targetEffects: { weakened: { duration: 2 } }, dialog: "My ex did all that and more. Try harder." }
      ],
      ceo_interviewer: [
        { name: 'Resume Scan', baseDamage: 16, priority: 0, dialog: "Your credentials are unimpressive." },
        { name: 'Pressure Test', baseDamage: 14, priority: 1, condition: b => b.turn >= 2, targetEffects: { vulnerable: { duration: 2 } }, dialog: "How do you handle stress? Poorly, I see." },
        { name: 'Boardroom Power Play', baseDamage: 22, priority: 2, condition: b => b.turn % 3 === 0, dialog: "I own this company. You're just an interview slot." }
      ],
      clav_influencer: [
        { name: 'Rating Drop', baseDamage: 14, priority: 0, dialog: "Midface ratio is off. 4/10." },
        { name: 'Viral Roast', baseDamage: 18, priority: 1, condition: b => b.turn >= 3, targetEffects: { burn: { stacks: 3 } }, dialog: "My followers are about to destroy your DMs." },
        { name: 'Aesthetic Block', baseDamage: 12, priority: 2, condition: b => b.phase === 2, selfEffects: { shield: { value: 20 } }, dialog: "You're not aesthetic enough for my timeline." }
      ],
      brad_boss: [
        { name: 'Quarterly Review', baseDamage: 18, priority: 0, condition: b => b.turn % 2 === 0, dialog: "Your performance this quarter is lacking." },
        { name: 'Corner Office Flex', baseDamage: 14, priority: 1, condition: b => b.turn % 2 === 1, dialog: "See that corner office? That's what you'll never have." },
        { name: 'Executive Decision', baseDamage: 22, priority: 2, condition: b => b.turn >= 4, targetEffects: { vulnerable: { duration: 3 } }, dialog: "I'm cutting your budget. And your self-esteem." },
        { name: 'Micromanage', baseDamage: 10, priority: 0, selfEffects: { shield: { value: 12 } }, dialog: "Let me tell you how to do your job." }
      ],
      forum_admin: [
        { name: 'Thread Ban', baseDamage: 20, priority: 0, dialog: "Rule 1: Don't be ugly. You're banned." },
        { name: 'Permaban Wave', baseDamage: 16, priority: 1, condition: b => b.turn >= 2, selfEffects: { shield: { value: 8 } }, dialog: "Reported for being mid. Over." },
        { name: 'Final Verdict', baseDamage: 28, priority: 2, condition: b => b.phase === 2, targetEffects: { burn: { stacks: 5 } }, dialog: "YOU ARE HEREBY BANNED FROM LOOKSMAXING. ROT." },
        { name: 'Rage Cascade', baseDamage: 4, priority: 0, bonusPerStack: true, stackKey: 'opponentRage', dialog: "Reported, downvoted, mocked, banned." }
      ],
      plastic_surgeon: [
        { name: 'Clinical Glare', baseDamage: 14, priority: 0, dialog: "Your nasal-labial folds need work." },
        { name: 'Scalpel Critique', baseDamage: 12, priority: 1, targetEffects: { weakened: { duration: 3 } }, dialog: "Your chin projection is inadequate." },
        { name: 'Surgery Quote', baseDamage: 18, priority: 2, condition: b => b.turn >= 4, dialog: "That'll be $20k minimum. Per feature." }
      ],
      tiktok_rat: [
        { name: 'Algorithm Shadow', baseDamage: 12, priority: 0, dialog: "Your content has been suppressed temporarily." },
        { name: 'Engagement Throttle', baseDamage: 8, priority: 1, targetEffects: { weakened: { duration: 2 } }, dialog: "Shadow banning your account for low engagement." },
        { name: 'Viral Suppression', baseDamage: 16, priority: 2, condition: b => b.turn >= 3, dialog: "Your viral moment has been denied." }
      ],
      social_media_manager: [
        { name: 'Report Spam', baseDamage: 10, priority: 0, dialog: "Reported for being a terrible poster." },
        { name: 'Comment Delete', baseDamage: 8, priority: 1, selfEffects: { shield: { value: 10 } }, dialog: "Your comment has been removed by moderators." },
        { name: 'Block Wave', baseDamage: 14, priority: 2, condition: b => b.turn >= 3, targetEffects: { burn: { stacks: 2 } }, dialog: "Blocked. Stay out of my comment section." }
      ],
      ex_partner: [
        { name: 'Memory Lane', baseDamage: 14, priority: 0, dialog: "Remember when you couldn't even look people in the eye?" },
        { name: 'Gaslight', baseDamage: 10, priority: 1, targetEffects: { vulnerable: { duration: 3 } }, dialog: "You haven't changed at all. I was right to leave." },
        { name: 'Emotional Nuke', baseDamage: 22, priority: 2, condition: b => b.playerConfidence < 40, dialog: "This is why nobody stays." }
      ],
      fixer: [
        { name: 'Interest Payment', baseDamage: 14, priority: 0, dialog: "You owe. And I always collect." },
        { name: 'Debt Reminder', baseDamage: 10, priority: 1, targetEffects: { vulnerable: { duration: 2 } }, dialog: "I know where you live. Pay up." },
        { name: 'Collection Notice', baseDamage: 20, priority: 2, condition: b => b.turn >= 3, targetEffects: { burn: { stacks: 3 } }, dialog: "Final warning. Or we take it out of your hide." }
      ],
      influencer_agent: [
        { name: 'Reach Flex', baseDamage: 16, priority: 0, dialog: "I have 2 million followers. You have 12." },
        { name: 'Collab Rejection', baseDamage: 12, priority: 1, targetEffects: { weakened: { duration: 2 } }, dialog: "Your engagement ratio is too low for a collab." },
        { name: 'Hype Train', baseDamage: 20, priority: 2, condition: b => b.phase === 2, selfEffects: { shield: { value: 18 } }, dialog: "My followers are about to destroy your comment section." }
      ],
      mastermind: [
        { name: 'Logical Fallacy', baseDamage: 18, priority: 0, dialog: "Your argument is flawed. Checkmate." },
        { name: 'Omega Gambit', baseDamage: 14, priority: 1, targetEffects: { weakened: { duration: 3 } }, dialog: "You fell for my trap. Predictable." },
        { name: 'Grandmaster Strike', baseDamage: 26, priority: 2, condition: b => b.turn >= 4, dialog: "I've calculated every possible outcome. You lose." },
        { name: 'Positional Play', baseDamage: 8, priority: 0, selfEffects: { shield: { value: 16 } }, dialog: "Safe move. Let's see how you respond." }
      ],
      mogger_ex: [
        { name: 'Chest Puff', baseDamage: 10, priority: 0, dialog: "You think you can take my spot? Look at this physique." },
        { name: 'Alleged Flex', baseDamage: 14, priority: 1, targetEffects: { vulnerable: { duration: 2 } }, dialog: "She told me everything. You're not him, pretty boy." },
        { name: 'Parking Lot Shove', baseDamage: 18, priority: 2, condition: b => b.turn >= 3, dialog: "Let's settle this like men. Outside." }
      ]
    };

    if (this.player.gender === 'female') {
      const f = this._femaleOpponents(moves, passives);
      this.opponents = f;
    } else {
      const m = this._maleOpponents(moves, passives);
      this.opponents = m;
    }
  }

  _femaleOpponents(moves, passives) {
    const opps = [
      {
        id: 'hs_bully', name: 'Brittany (High School Bully)', title: 'Queen Bee of 9th Grade',
        lore: "She's been terrorizing the schoolyard since freshman year. Stealing lunch money and crushing self-esteem is just another Tuesday. No one has ever stood up to her — until now.",
        avatar: '🎒', skepticism: 40, difficulty: 'Very Easy', reqSMV: 1.0,
        dialogs: { start: "Nice face, did you get it from a trash can? Gimme your gloss, flat-chested framelet.", hit: "Urgh, you talk too much. Stop standing up for yourself.", attack: "Do you even pilates? Ludwig hairline looking girl.", defeat: "Fine, keep your lunch money. I'm going to Starbucks anyway.", victory: "Easiest lunch money of my life. Stay mid." },
        rewards: { cash: 100, confidence: 25, log: "You stood up to Brittany and took back your dignity! +25% Confidence!" }
      },
      {
        id: 'vip_bouncer', name: 'Sasha (VIP Hostess)', title: 'Gatekeeper of Club Neon',
        lore: "Sasha has guarded the velvet rope for over a decade and can smell insecurity from across the street. Her clipboard holds the power of entry or exile.",
        avatar: '🕶️', skepticism: 60, difficulty: 'Easy', reqSMV: 3.6,
        dialogs: { start: "Shoes aren't right, hair is suspicious. You aren't on the list, sweetie.", hit: "Okay, your skin is somewhat glowing. Let me review my clipboard.", attack: "Nice makeup contouring. Let me check your ID again. Stand aside.", defeat: "Alright, go ahead. The promoter likes your aesthetic.", victory: "Go home, kid. You're blocking the guestlist line." },
        rewards: { cash: 150, confidence: 20, style: 10, log: "You successfully bypassed Sasha and entered the VIP club! +$150 and style status." }
      },
      {
        id: 'chad_gym_bro', name: 'Chanthal (Pilates Instructor)', title: 'Dominator of the Reformer',
        lore: "The Pilates studio is Chanthal's cathedral and the reformer machine is her altar. She measures self-worth in waist-to-hip ratios.",
        avatar: '🧘‍♀️', skepticism: 85, difficulty: 'Medium', reqSMV: 4.4,
        dialogs: { start: "Nice clavicles, did your mother design them? Post abs or walk away.", hit: "Okay, you've been doing core. But what's your waist-to-hip ratio?", attack: "You look like you skip core day. Ludwig 3 framelet spotter.", defeat: "Respect the grind, girl. Take this organic matcha.", victory: "Go do some squats, copy-cat." },
        rewards: { cash: 350, confidence: 30, frame: 15, log: "Chanthal nodded in approval and gave you waist-line maxxing tips. +15 Frame!" }
      },
      {
        id: 'stacy_tinder', name: 'Chad (High Expectations)', title: 'Tinder Elite Reviewer',
        lore: "Chad has perfected the art of the swipe. A living algorithm of physical standards, he's rejected hundreds in search of someone who ticks every box.",
        avatar: '🏋️‍♂️', skepticism: 110, difficulty: 'Hard', reqSMV: 5.2,
        dialogs: { start: "I only date girls who are at least 8/10 Stacy. Convince me, or I swipe left.", hit: "Ooh, nice V-line jaw. Did a surgeon do that or is it genetics?", attack: "Is that a Ludwig thinning scalp? Ew. My ex was a runway model.", defeat: "Fine, you can take me to that expensive steak place. Let's go.", victory: "Sorry, I think we want different things. Like, someone Stacy-tier." },
        rewards: { cash: 0, confidence: 40, datingScore: 50, partner: "Chad", log: "You successfully charmed Chad! You are now dating! (+40% Confidence)" }
      },
      {
        id: 'ceo_interviewer', name: 'Mrs. Sterling (Venture Capitalist)', title: 'Strict Job Interviewer',
        lore: "She built her corporate empire from nothing and now decides who gets a seat at the table.",
        avatar: '💼', skepticism: 130, difficulty: 'Extreme', reqSMV: 5.6,
        dialogs: { start: "Your resume is average. Show me you have the visual presence of a leader.", hit: "Imposing posture. Very well, proceed with your proposal.", attack: "You look nervous and lack command. We have top Ivy grads applying.", defeat: "You have that commanding presence. Welcome to the firm. Six-figure salary start.", victory: "Thank you for coming. We will keep your file on record." },
        rewards: { cash: 4000, confidence: 50, style: 15, log: "Mrs. Sterling hired you on the spot! Earned a $4,000 corporate starting bonus!" }
      },
      {
        id: 'clav_influencer', name: 'Clav (@clavicular0)', title: 'Aesthetic Reviewer & Influencer',
        lore: "Half a million followers and Clav became the internet's unofficial judge of aesthetic worth.",
        avatar: '🎭', skepticism: 140, difficulty: 'Hard', reqSMV: 5.8,
        dialogs: { start: "Midface ratio is too long. Let me see your eye area, or you get blocked.", hit: "Hollow cheekbones shadow detected. Not bad, your facial thirds align.", attack: "Zero jaw projection and negative tilt. Mid. Blocked.", defeat: "Aesthetic bones. I'm reposting you on my reels. Ascended.", victory: "Banned from the DMs. You lack the bone aesthetics. Over." },
        rewards: { cash: 2000, confidence: 30, frame: 15, log: "Clav rated you as a solid high-tier aesthetic model! Earned $2,000 and +15 Frame!" }
      },
      {
        id: 'brad_boss', name: 'Brad (Managing Director)', title: 'Corporate Dominator',
        lore: "Brad climbed the corporate ladder by stepping on everyone above him. He runs the boardroom like a battlefield.",
        avatar: '👔', skepticism: 150, difficulty: 'Very Hard', reqSMV: 6.0,
        dialogs: { start: "I need you to work this weekend.", hit: "Okay, you have some serious posture presence.", attack: "Your presentation is weak. You look like a wage-slave.", defeat: "Incredible presentation. You are promoted to partner.", victory: "I'm cutting your salary. Get back to the spreadsheets." },
        rewards: { cash: 2500, confidence: 30, style: 15, log: "You dominated Brad in the boardroom! Promoted to partner with a $2,500 bonus!" }
      },
      {
        id: 'forum_admin', name: 'FemCope (Forum Administrator)', title: 'Ultimate Gatekeeper',
        lore: "The gatekeeper of the most ruthless looksmaxxing forum on the internet. She's banned thousands.",
        avatar: '👑', skepticism: 200, difficulty: 'Impossible', reqSMV: 6.8,
        dialogs: { start: "Rate thread incoming. If your Ludwig scale is 3, you are banned immediately.", hit: "Wait... Perfect symmetry? V-line jaw? Is this a CGI model?", attack: "Bald spot detected! Over. Banned. Lay down and rot!", defeat: "I bow to you. You are the Chosen One. Unbanned, and stickied as Stacy-tier.", victory: "Locked and stickied. Post deleted. User banned. Over." },
        rewards: { cash: 5000, confidence: 50, style: 20, log: "You defeated the Forum Admin! You are now stickied as Stacy (+5,000 cash, +50% Confidence)." }
      },
      {
        id: 'plastic_surgeon', name: 'Dr. Riviera (Plastic Surgeon)', title: 'Gatekeeper of Aesthetics',
        lore: "Dr. Riviera has reshaped more faces than anyone in the tri-state area. Your bone structure is about to be clinically evaluated.",
        avatar: '🔪', skepticism: 130, difficulty: 'Hard', reqSMV: 5.0,
        dialogs: { start: "Let me analyze your facial thirds. Hmm, your midface ratio is off.", hit: "Your zygomatic bones are decent. I can work with this.", attack: "Zero forward growth. You need a full bimax advancement.", defeat: "Remarkable proportions. You are my masterpiece.", victory: "You need at least $50k in work. Next patient!" },
        rewards: { cash: 1500, confidence: 25, style: 10, log: "Dr. Riviera complimented your bone structure! Earned $1,500 and +10 Style!" }
      },
      {
        id: 'tiktok_rat', name: '@looksmax_algo (TikTok Algorithm)', title: 'The Shadow Ban Enforcer',
        lore: "The algorithm is a cold, calculating god. It has seen every trend die and every career fade.",
        avatar: '🤖', skepticism: 100, difficulty: 'Medium', reqSMV: 4.0,
        dialogs: { start: "Your content is mid. Shadow banning your account.", hit: "Decent engagement rate. Your facial symmetry trending.", attack: "Reported for false advertising.", defeat: "Viral algorithm boost granted!", victory: "Your content ratio is abysmal. Algorithm rejected." },
        rewards: { cash: 400, confidence: 20, log: "You beat the TikTok algorithm! Your content is now trending! (+$400, +20% Confidence)" }
      },
      {
        id: 'social_media_manager', name: 'Karen (Instagram Moderator)', title: 'The Comment Section Tyrant',
        lore: "Karen patrols the comment sections like a digital warden. Banning, blocking, and shadow-deleting with bureaucratic efficiency.",
        avatar: '📱', skepticism: 70, difficulty: 'Easy', reqSMV: 3.5,
        dialogs: { start: "Your engagement rate is abysmal. I'm deleting your comments.", hit: "Decent cheekbones. The algorithm might favor you.", attack: "Your content is mid. Reported for spam.", defeat: "Fine, I'll feature you on the explore page.", victory: "Blocked and reported. Stay offline forever." },
        rewards: { cash: 250, confidence: 15, followers: 500, log: "You dominated the comment section! +$250, +500 Followers, +15% Confidence!" }
      },
      {
        id: 'ex_partner', name: 'Your Ex (Jason)', title: 'The One Who Got Away',
        lore: "Jason was your first real relationship. The breakup felt like a mirror shattering. He walked away saying you'd never change.",
        avatar: '💔', skepticism: 120, difficulty: 'Hard', reqSMV: 5.5,
        dialogs: { start: "You look the same as when we broke up. Have you even changed at all?", hit: "Wait... you actually look different. Did you glow up?", attack: "Still coping with the same thin hair and bad style I see.", defeat: "Okay, you've changed. I was wrong. Maybe we can talk?", victory: "Same old story. That's why I walked away." },
        rewards: { cash: 0, confidence: 50, datingScore: 30, log: "You proved your ex wrong! Massive confidence boost! (+50% Confidence, +30 Dating Score)" }
      },
      {
        id: 'fixer', name: 'Vinny (The Fixer)', title: 'Debt Collector from Your Past',
        lore: "Vinny has been tracking you since that loan you took out for your first surgery. He doesn't care about your glow-up. He wants his money — with interest.",
        avatar: '💰', skepticism: 160, difficulty: 'Very Hard', reqSMV: 6.2,
        dialogs: { start: "You owe $5k plus interest. Pay up or I take it out of your skin.", hit: "Nice try. Money talks, pretty face walks.", attack: "You think surgery scares me? I've broken jaws better than yours.", defeat: "Fine. You're off the hook. But I'm watching you.", victory: "Enjoy your pretty face. It's collateral now." },
        rewards: { cash: 3000, confidence: 35, style: 10, log: "You stood up to Vinny the Fixer and cleared your debt! Earned $3,000 and +35% Confidence!" }
      },
      {
        id: 'influencer_agent', name: 'Mina (@mina_agency)', title: 'Top Talent Manager',
        lore: "Mina represents the top 1% of influencers. She's made and broken careers with a single DM. If she doesn't see star potential in you, your social media future is dead.",
        avatar: '📈', skepticism: 170, difficulty: 'Extreme', reqSMV: 6.5,
        dialogs: { start: "Your follower count is cute. Come back when you're relevant.", hit: "Decent engagement spike. But can you sustain it?", attack: "Your content lacks brand synergy. You're not marketable.", defeat: "You have the X-factor. I'll represent you personally.", victory: "You're not ready. Call me when you're actually famous." },
        rewards: { cash: 3500, confidence: 40, followers: 2000, log: "Mina signed you as her client! +$3,500, +2,000 Followers, +40% Confidence!" }
      },
      {
        id: 'mastermind', name: 'The Oracle (Looksmaxing Legend)', title: 'The Final Boss',
        lore: "No one knows who The Oracle really is. Some say they're the original looksmaxxer who created the first rating system. They've seen every strategy, every surgery, every cope. Beating them means proving you've truly ascended.",
        avatar: '🗿', skepticism: 220, difficulty: 'Impossible', reqSMV: 7.5,
        dialogs: { start: "You've come far. But you haven't faced yourself yet.", hit: "Impressive. You've studied the meta. But I wrote it.", attack: "You rely on stats I optimized years ago. Predictable.", defeat: "You've transcended. Welcome to the 1%.", victory: "Back to the drawing board. You still have weaknesses." },
        rewards: { cash: 10000, confidence: 80, style: 30, frame: 20, log: "You defeated The Oracle! Legendary victory! +$10,000, +80% Confidence, +30 Style, +20 Frame!" }
      }
    ];
    this._attachMetadata(opps, moves, passives);
    return opps;
  }

  _maleOpponents(moves, passives) {
    const opps = [
      {
        id: 'hs_bully', name: 'Biff (High School Bully)', title: 'Ego Destroyer of 9th Grade',
        lore: "Biff has been shaking down freshmen since day one. Stealing lunch money and crushing self-esteem is just another Tuesday.",
        avatar: '🎒', skepticism: 40, difficulty: 'Very Easy', reqSMV: 1.0,
        dialogs: { start: "Nice face, did you get it from a trash can? Gimme your cash, framelet.", hit: "Urgh, you talk too much. Stop standing up for yourself.", attack: "Do you even lift? Norwood hairline lookin' boy.", defeat: "Fine, keep your lunch money. I'm going to smoke behind the gym.", victory: "Easiest lunch money of my life. Stay small." },
        rewards: { cash: 100, confidence: 25, log: "You stood up to Biff and took back your lunch money! +25% Confidence!" }
      },
      {
        id: 'vip_bouncer', name: 'Sven (VIP Bouncer)', title: 'Gatekeeper of Club Neon',
        lore: "Sven has guarded the velvet rope for over a decade and can smell insecurity from across the street.",
        avatar: '🕶️', skepticism: 60, difficulty: 'Easy', reqSMV: 3.6,
        dialogs: { start: "Shoes aren't right, hairline is suspicious. You aren't on the list, bro.", hit: "Okay, your jawline is somewhat solid. Let me review my clipboard.", attack: "Nice height inserts. Let me check your ID again. Stand aside.", defeat: "Alright, go ahead. The promoter likes your style.", victory: "Go home, kid. You're blocking the line." },
        rewards: { cash: 150, confidence: 20, style: 10, log: "You successfully bypassed Sven and entered the VIP club! +$150 and style status." }
      },
      {
        id: 'chad_gym_bro', name: 'Trent (Giga Gym Bro)', title: 'Dominator of the Squat Rack',
        lore: "The gym is Trent's temple and the squat rack is his altar. He measures self-worth in deadlift PRs.",
        avatar: '🏋️', skepticism: 85, difficulty: 'Medium', reqSMV: 4.4,
        dialogs: { start: "Nice clavicles, did your mother design them? Post physique or walk away.", hit: "Okay, you've been benching. But what's your deadlift?", attack: "You look like you skip leg day. Norwood 3 framelet spotter.", defeat: "Respect the grind, bro. Take this protein shaker.", victory: "Go lift some weights, copy-cat." },
        rewards: { cash: 350, confidence: 30, frame: 15, log: "Trent nodded in approval and gave you gym maxxing tips. +15 Frame!" }
      },
      {
        id: 'stacy_tinder', name: 'Stacy (High Expectations)', title: 'Tinder Elite Reviewer',
        lore: "Stacy has perfected the art of the swipe. A living algorithm of physical standards, she's rejected hundreds in search of someone who ticks every box.",
        avatar: '💅', skepticism: 110, difficulty: 'Hard', reqSMV: 5.2,
        dialogs: { start: "I only date guys over 6'1. Convince me, or I swipe left.", hit: "Ooh, chiseled chin. Did a surgeon do that or is it genetics?", attack: "Is that a receding hairline? Ew. My ex was 6'4.", defeat: "Fine, you can take me to that expensive sushi place. Let's go.", victory: "Sorry, I think we want different things. Like, someone tall." },
        rewards: { cash: 0, confidence: 40, datingScore: 50, partner: "Stacy", log: "You successfully charmed Stacy! You are now dating! (+40% Confidence)" }
      },
      {
        id: 'ceo_interviewer', name: 'Mr. Sterling (Venture Capitalist)', title: 'Strict Job Interviewer',
        lore: "He built his corporate empire from nothing and now decides who gets a seat at the table.",
        avatar: '💼', skepticism: 130, difficulty: 'Extreme', reqSMV: 5.6,
        dialogs: { start: "Your resume is average. Show me you have the visual presence of a leader.", hit: "Imposing height. Very well, proceed with your proposal.", attack: "You look nervous and lack command. We have top Ivy grads applying.", defeat: "You have that commanding presence. Welcome to the firm. Six-figure salary start.", victory: "Thank you for coming. We will keep your file on record." },
        rewards: { cash: 4000, confidence: 50, style: 15, log: "Mr. Sterling hired you on the spot! Earned a $4,000 corporate starting bonus!" }
      },
      {
        id: 'clav_influencer', name: 'Clav (@clavicular0)', title: 'Aesthetic Reviewer & Influencer',
        lore: "Half a million followers and Clav became the internet's unofficial judge of aesthetic worth.",
        avatar: '🎭', skepticism: 140, difficulty: 'Hard', reqSMV: 5.8,
        dialogs: { start: "Midface ratio is too long. Let me see your eye area.", hit: "Hollow cheekbones shadow detected. Not bad.", attack: "Zero jaw projection and negative tilt. Mid. Blocked.", defeat: "Aesthetic bones. I'm reposting you. Ascended.", victory: "Banned from the DMs. Over." },
        rewards: { cash: 2000, confidence: 30, frame: 15, log: "Clav rated you as solid high-tier aesthetic! Earned $2,000 and +15 Frame!" }
      },
      {
        id: 'brad_boss', name: 'Brad (Managing Director)', title: 'Corporate Dominator',
        lore: "Brad climbed the corporate ladder by stepping on everyone above him.",
        avatar: '👔', skepticism: 150, difficulty: 'Very Hard', reqSMV: 6.0,
        dialogs: { start: "I need you to work this weekend.", hit: "Okay, you have some serious frame presence.", attack: "Your posture is weak. You look like a wage-slave.", defeat: "Incredible presentation. You are promoted to partner.", victory: "I'm cutting your salary. Get back to work." },
        rewards: { cash: 2500, confidence: 30, style: 15, log: "You dominated Brad in the boardroom! Promoted to partner with a $2,500 bonus!" }
      },
      {
        id: 'forum_admin', name: 'GigaCope (Forum Administrator)', title: 'Ultimate Gatekeeper',
        lore: "The gatekeeper of the most ruthless looksmaxxing forum on the internet. He's banned thousands.",
        avatar: '👑', skepticism: 200, difficulty: 'Impossible', reqSMV: 6.8,
        dialogs: { start: "Rate thread incoming. If your tilt is negative, banned.", hit: "Wait... Positive canthal tilt? Chiseled jaw? CGI?", attack: "Bald spot detected! Over. Banned. Lay down and rot!", defeat: "I bow to you. You are the Chosen One. Stickied as Giga-Chad.", victory: "Locked and stickied. Post deleted. User banned. Over." },
        rewards: { cash: 5000, confidence: 50, style: 20, log: "You defeated the Forum Admin! Stickied as GigaChad! (+5,000 cash, +50% Confidence)!" }
      },
      {
        id: 'plastic_surgeon', name: 'Dr. Riviera (Plastic Surgeon)', title: 'Gatekeeper of Aesthetics',
        lore: "Dr. Riviera has reshaped more faces than anyone in the tri-state area.",
        avatar: '🔪', skepticism: 130, difficulty: 'Hard', reqSMV: 5.0,
        dialogs: { start: "Let me analyze your facial thirds. Hmm, your midface ratio is off.", hit: "Your zygomatic bones are decent.", attack: "Zero forward growth. You need a full bimax.", defeat: "Remarkable proportions. You are my masterpiece.", victory: "You need at least $50k in work. Next!" },
        rewards: { cash: 1500, confidence: 25, style: 10, log: "Dr. Riviera complimented your bone structure! Earned $1,500 and +10 Style!" }
      },
      {
        id: 'tiktok_rat', name: '@looksmax_algo (TikTok Algorithm)', title: 'The Shadow Ban Enforcer',
        lore: "The algorithm is a cold, calculating god. It doesn't hate you — it's just indifferent.",
        avatar: '🤖', skepticism: 100, difficulty: 'Medium', reqSMV: 4.0,
        dialogs: { start: "Your content is mid. Shadow banning.", hit: "Decent engagement rate. Trending.", attack: "Reported for false advertising.", defeat: "Viral algorithm boost granted!", victory: "Your content ratio is abysmal." },
        rewards: { cash: 400, confidence: 20, log: "You beat the algorithm! Your content is trending! (+$400, +20% Confidence)" }
      },
      {
        id: 'social_media_manager', name: 'SMM Kyle (Instagram Mod)', title: 'The Comment Section Tyrant',
        lore: "Kyle patrols comment sections like a digital warden. Banning and blocking with bureaucratic efficiency.",
        avatar: '📱', skepticism: 70, difficulty: 'Easy', reqSMV: 3.5,
        dialogs: { start: "Your engagement is abysmal. Deleting your comments.", hit: "Decent bone structure. The algorithm might favor you.", attack: "Reported for spam and harassment.", defeat: "Fine, I'll feature you on the explore page.", victory: "Blocked and reported. Stay offline forever." },
        rewards: { cash: 250, confidence: 15, followers: 500, log: "You dominated the comment section! +$250, +500 Followers!" }
      },
      {
        id: 'ex_partner', name: 'Your Ex (Alexis)', title: 'The One Who Got Away',
        lore: "Alexis left without looking back, claiming you were never going to be enough.",
        avatar: '💔', skepticism: 120, difficulty: 'Hard', reqSMV: 5.5,
        dialogs: { start: "You look the same as when we broke up.", hit: "Wait... you actually look different.", attack: "Still coping with the same receding hairline.", defeat: "Okay, you've changed. I was wrong.", victory: "Same old story. That's why I walked away." },
        rewards: { cash: 0, confidence: 50, datingScore: 30, log: "You proved your ex wrong! Massive confidence boost! (+50% Confidence, +30 Dating Score)" }
      },
      {
        id: 'fixer', name: 'Vinny (The Fixer)', title: 'Debt Collector from Your Past',
        lore: "Vinny has been tracking you since that loan you took out for your first surgery. He doesn't care about your glow-up. He wants his money — with interest.",
        avatar: '💰', skepticism: 160, difficulty: 'Very Hard', reqSMV: 6.2,
        dialogs: { start: "You owe $5k plus interest. Pay up.", hit: "Nice try. Money talks, pretty face walks.", attack: "You think surgery scares me? I've broken jaws.", defeat: "Fine. You're off the hook. But I'm watching.", victory: "Enjoy your pretty face. It's collateral now." },
        rewards: { cash: 3000, confidence: 35, style: 10, log: "You stood up to Vinny the Fixer! +$3,000 and +35% Confidence!" }
      },
      {
        id: 'influencer_agent', name: 'Dante (@dante_agency)', title: 'Top Talent Manager',
        lore: "Dante represents the top 1% of influencers. If he doesn't see star potential in you, your social media future is dead.",
        avatar: '📈', skepticism: 170, difficulty: 'Extreme', reqSMV: 6.5,
        dialogs: { start: "Your follower count is cute. Come back when you're relevant.", hit: "Decent engagement spike. But can you sustain it?", attack: "Your content lacks brand synergy. You're not marketable.", defeat: "You have the X-factor. I'll represent you.", victory: "You're not ready. Call me when you're famous." },
        rewards: { cash: 3500, confidence: 40, followers: 2000, log: "Dante signed you! +$3,500, +2,000 Followers, +40% Confidence!" }
      },
      {
        id: 'mastermind', name: 'The Oracle (Looksmaxing Legend)', title: 'The Final Boss',
        lore: "No one knows who The Oracle really is. Some say they're the original looksmaxxer who created the first rating system. They've seen every strategy, every surgery, every cope.",
        avatar: '🗿', skepticism: 220, difficulty: 'Impossible', reqSMV: 7.5,
        dialogs: { start: "You've come far. But you haven't faced yourself yet.", hit: "Impressive. You've studied the meta. But I wrote it.", attack: "You rely on stats I optimized years ago. Predictable.", defeat: "You've transcended. Welcome to the 1%.", victory: "Back to the drawing board. You still have weaknesses." },
        rewards: { cash: 10000, confidence: 80, style: 30, frame: 20, log: "Legendary! You defeated The Oracle! +$10,000, +80% Confidence, +30 Style, +20 Frame!" }
      },
      {
        id: 'mogger_ex', name: 'The Ex (Mogger)', title: 'The Gym Incel',
        lore: "Your date's ex showed up outside the venue. He's been watching your every move on her story. He wants to prove he's still the alpha.",
        avatar: '💪', skepticism: 100, difficulty: 'Medium', reqSMV: 0, eventOnly: true,
        dialogs: { start: "You think you can take my girl? Let's see what you've got.", hit: "Not bad. But I've been doing this longer.", attack: "She told me about you. You're not him.", defeat: "Fine. She's yours. But I'll be back.", victory: "Stay in your lane, pretty boy." },
        rewards: { cash: 0, confidence: 25, log: "You defeated the ex! Confidence surged!" }
      }
    ];
    this._attachMetadata(opps, moves, passives);
    return opps;
  }

  _attachMetadata(opps, moves, passives) {
    const phase2Lines = {
      hs_bully: "Oh, you've got teeth now? Let me show you who's boss!",
      vip_bouncer: "You're persistent. Time to call security.",
      chad_gym_bro: "Alright, no more warm-up sets. Going heavy now!",
      stacy_tinder: "Impressive... but I'm still hard to please.",
      ceo_interviewer: "You show potential. Let's see if you crack under real pressure.",
      clav_influencer: "My followers are watching. Time to go viral on your failure.",
      brad_boss: "This is my corner office. You don't get it that easily.",
      forum_admin: "YOU DARE DEFY THE GODS OF LOOKSMAXING?",
      plastic_surgeon: "Remarkable... time for a closer clinical look.",
      tiktok_rat: "Algorithm update: your engagement is being throttled.",
      social_media_manager: "You want to play? I'll crash your reach.",
      ex_partner: "You've actually changed... but so have I.",
      fixer: "You think a pretty face scares me? Pay up.",
      influencer_agent: "Impressive. But can you handle fame?",
      mastermind: "You've forced me to use 100% of my power.",
      mogger_ex: "This isn't over. I'll show you what real dominance looks like!"
    };
    opps.forEach(o => {
      o.passive = passives[o.id] || null;
      o.dialogs.phase2 = phase2Lines[o.id] || "You're pushing me too far!";
      o.moves = moves[o.id] || [{ name: 'Basic Shade', baseDamage: 10, priority: 0, dialog: "You think you're ready?" }];
    });
  }

  getEncounters() {
    return this.opponents
      .filter(o => !o.eventOnly)
      .map(o => {
        const isLocked = this.player.smv < o.reqSMV;
        return { ...o, isLocked };
      })
      .sort((a, b) => a.reqSMV - b.reqSMV);
  }

  startBattle(opponentId) {
    const opp = this.opponents.find(o => o.id === opponentId);
    if (!opp || this.player.smv < opp.reqSMV) return false;

    this.opponent = opp;
    this.opponentSkepticism = opp.skepticism;
    this.opponentMaxSkepticism = opp.skepticism;
    this.playerConfidence = this.player.confidence;
    this.active = true;
    this.isOver = false;
    this.outcome = null;
    this.energy = 3;
    this.turn = 1;
    this.opponentDialog = opp.dialogs.start;
    this.lastCardPlayed = null;
    this.isBlocking = false;
    this.momentum = 0;
    this.phase = 1;
    this.cardsPlayedThisTurn = 0;
    this.lastPlayedCardCost = 0;
    this.opponentRage = 0;
    this.playerEffects = {};
    this.opponentEffects = {};
    this.lastMoveName = "";
    this.lastMoveDamage = 0;
    this.lastMoveEffects = [];

    this.buildDeck();
    this.drawHand(4);

    this.logCallback(`Encounter started: vs ${opp.name}. Opponent Skepticism: ${opp.skepticism}. Your Confidence: ${this.playerConfidence}%`, 'action');
    return true;
  }

  // ====== STATUS EFFECTS SYSTEM ======

  addEffect(target, effectId, config) {
    const effects = target === 'player' ? this.playerEffects : this.opponentEffects;
    if (effectId === 'shield') {
      effects.shield = { value: (effects.shield?.value || 0) + (config.value || 0) };
    } else if (effectId === 'burn') {
      effects.burn = { stacks: (effects.burn?.stacks || 0) + (config.stacks || 1), duration: config.duration || 2 };
    } else if (effectId === 'regeneration') {
      effects.regeneration = { value: config.value || 5, duration: config.duration || 2 };
    } else if (effectId === 'vulnerable') {
      effects.vulnerable = { duration: config.duration || 2 };
    } else if (effectId === 'weakened') {
      effects.weakened = { duration: config.duration || 2 };
    } else {
      effects[effectId] = { ...config };
    }
  }

  hasEffect(target, effectId) {
    const effects = target === 'player' ? this.playerEffects : this.opponentEffects;
    return !!effects[effectId] && (effects[effectId].stacks === undefined || effects[effectId].stacks > 0) && (effects[effectId].duration === undefined || effects[effectId].duration > 0) && (effects[effectId].value === undefined || effects[effectId].value > 0);
  }

  removeEffect(target, effectId) {
    const effects = target === 'player' ? this.playerEffects : this.opponentEffects;
    delete effects[effectId];
  }

  getEffectsDisplay(target) {
    const effects = target === 'player' ? this.playerEffects : this.opponentEffects;
    const out = [];
    if (this.hasEffect(target, 'burn')) out.push(`🔥 Burn ${effects.burn.stacks}`);
    if (this.hasEffect(target, 'shield')) out.push(`🛡️ ${effects.shield.value}`);
    if (this.hasEffect(target, 'regeneration')) out.push(`💚 Regen ${effects.regeneration.value}`);
    if (this.hasEffect(target, 'vulnerable')) out.push(`🔻 Vulnerable ${effects.vulnerable.duration}t`);
    if (this.hasEffect(target, 'weakened')) out.push(`🔺 Weakened ${effects.weakened.duration}t`);
    return out.join(' ');
  }

  processTurnStartEffects() {
    const pe = this.playerEffects;
    if (pe.weakened) { pe.weakened.duration--; if (pe.weakened.duration <= 0) delete pe.weakened; }
    if (pe.vulnerable) { pe.vulnerable.duration--; if (pe.vulnerable.duration <= 0) delete pe.vulnerable; }
    if (pe.regeneration) {
      this.playerConfidence = Math.min(100, this.playerConfidence + pe.regeneration.value);
      this.logCallback(`💚 Regeneration restored ${pe.regeneration.value} Confidence!`, "success");
      pe.regeneration.duration--;
      if (pe.regeneration.duration <= 0) delete pe.regeneration;
    }
    if (pe.burn) {
      const dmg = pe.burn.stacks;
      this.playerConfidence = Math.max(0, this.playerConfidence - dmg);
      this.logCallback(`🔥 Burn deals ${dmg} damage!`, "error");
      pe.burn.stacks = Math.max(0, pe.burn.stacks - 1);
      if (pe.burn.stacks <= 0) delete pe.burn;
    }

    const oe = this.opponentEffects;
    if (oe.weakened) { oe.weakened.duration--; if (oe.weakened.duration <= 0) delete oe.weakened; }
    if (oe.vulnerable) { oe.vulnerable.duration--; if (oe.vulnerable.duration <= 0) delete oe.vulnerable; }
    if (oe.burn) {
      const dmg = oe.burn.stacks;
      this.opponentSkepticism = Math.max(0, this.opponentSkepticism - dmg);
      this.logCallback(`🔥 Opponent burn deals ${dmg} damage!`, "success");
      oe.burn.stacks = Math.max(0, oe.burn.stacks - 1);
      if (oe.burn.stacks <= 0) delete oe.burn;
    }
  }

  // ====== OPPONENT MOVE AI ======

  selectMove() {
    const availableMoves = this.opponent.moves.filter(m => !m.condition || m.condition(this));
    if (availableMoves.length === 0) return null;

    const maxPriority = Math.max(...availableMoves.map(m => m.priority));
    const topMoves = availableMoves.filter(m => m.priority === maxPriority);
    return topMoves[Math.floor(Math.random() * topMoves.length)];
  }

  executeMove(move) {
    let baseDamage = move.baseDamage || 0;

    if (move.bonusPerStack && move.stackKey && this[move.stackKey] !== undefined) {
      baseDamage += this[move.stackKey] * 4;
    }

    if (this.phase === 2) baseDamage = Math.floor(baseDamage * 1.5);

    if (this.opponent.id === 'hs_bully' && this.playerConfidence > 60) baseDamage += 5;
    if (this.opponent.id === 'ceo_interviewer' && this.turn % 3 === 0) baseDamage += 10;
    if (this.opponent.id === 'ex_partner' && this.playerConfidence < 40) baseDamage += 6;
    if (this.opponent.id === 'fixer') baseDamage += 3;

    if (this.opponent.id === 'forum_admin') {
      this.opponentRage++;
      if (!move.bonusPerStack) baseDamage += this.opponentRage * 4;
    }

    if (this.hasEffect('player', 'vulnerable')) baseDamage = Math.floor(baseDamage * 1.25);
    if (this.hasEffect('player', 'weakened')) baseDamage = Math.floor(baseDamage * 0.75);

    const variance = Math.floor(baseDamage * (0.85 + Math.random() * 0.3));
    let finalDamage = variance;

    if (this.hasEffect('opponent', 'vulnerable')) finalDamage = Math.floor(finalDamage * 1.25);
    if (this.hasEffect('opponent', 'weakened')) finalDamage = Math.floor(finalDamage * 0.75);

    if (this.isBlocking) {
      const absorbed = Math.floor(finalDamage * 0.5);
      this.logCallback(`🛡️ Block absorbed ${absorbed} damage!`, "success");
      finalDamage -= absorbed;
      this.isBlocking = false;
    }

    let shieldAbsorbed = 0;
    if (this.hasEffect('player', 'shield')) {
      const shieldVal = this.playerEffects.shield.value;
      if (shieldVal >= finalDamage) {
        this.playerEffects.shield.value -= finalDamage;
        shieldAbsorbed = finalDamage;
        finalDamage = 0;
      } else {
        shieldAbsorbed = shieldVal;
        finalDamage -= shieldVal;
        delete this.playerEffects.shield;
      }
      if (shieldAbsorbed > 0) this.logCallback(`🛡️ Shield absorbed ${shieldAbsorbed} damage!`, "success");
    }

    this.playerConfidence = Math.max(0, this.playerConfidence - finalDamage);
    this.opponentDialog = move.dialog || this.opponent.dialogs.attack;

    this.lastMoveName = move.name;
    this.lastMoveDamage = finalDamage + shieldAbsorbed;
    this.lastMoveEffects = [];

    if (move.targetEffects) {
      Object.entries(move.targetEffects).forEach(([effectId, cfg]) => {
        this.addEffect('player', effectId, cfg);
        this.lastMoveEffects.push(effectId);
      });
    }
    if (move.selfEffects) {
      Object.entries(move.selfEffects).forEach(([effectId, cfg]) => {
        this.addEffect('opponent', effectId, cfg);
      });
    }

    this.logCallback(`${this.opponent.name} uses [${move.name}]! (-${finalDamage}% Confidence${shieldAbsorbed > 0 ? `, ${shieldAbsorbed} absorbed` : ''})`, "event");
    if (this.lastMoveEffects.length > 0) {
      this.logCallback(`⚡ Status applied: ${this.lastMoveEffects.join(', ')}`, "system");
    }
  }

  // ====== BLOCK ======

  block() {
    if (this.isOver || this.energy < 1) return false;
    this.energy -= 1;
    this.isBlocking = true;
    this.logCallback("🛡️ You brace for impact! Damage reduced by 50% this turn.", "success");
    return true;
  }

  // ====== ULTIMATE ======

  useUltimate() {
    if (this.isOver || this.momentum < this.maxMomentum) return false;
    this.momentum = 0;
    const p = this.player;
    const bestStat = Math.max(p.smv * 10, p.confidence, p.style * 0.8, p.frame * 0.8, p.rizz * 0.9);
    let dmg = Math.floor(40 + bestStat * 0.5);
    if (this.hasEffect('opponent', 'vulnerable')) dmg = Math.floor(dmg * 1.25);
    if (this.hasEffect('opponent', 'weakened')) dmg = Math.floor(dmg * 0.75);
    this.damageOpponent(dmg);
    this.logCallback(`💥 ULTIMATE! You unleash your full potential for ${dmg} damage!`, "success");
    if (this.opponentSkepticism <= 0) this.resolveBattle(true);
    return dmg;
  }

  // ====== DECK BUILDING ======

  buildDeck() {
    const cardPool = [];

    cardPool.push({
      name: 'Nice Personality', desc: 'Talk about your passions. Low effect.',
      cost: 1, power: 10,
      effect: (b) => { b.damageOpponent(10); },
      emoji: '💬'
    });
    cardPool.push({
      name: 'Max Cope', desc: 'Rationalize. Heal confidence.',
      cost: 1, power: 18,
      effect: (b) => { b.healPlayer(18); },
      emoji: '🧠'
    });

    if (this.player.height >= 72) {
      cardPool.push({
        name: 'Loom Over', desc: 'Stand tall. Height intimidation.',
        cost: 2, power: 28,
        effect: (b) => { b.damageOpponent(28); },
        emoji: '🦒'
      });
    } else if (this.player.height <= 66) {
      cardPool.push({
        name: 'Short King Energy', desc: 'Extreme confidence despite limits.',
        cost: 1, power: 15,
        effect: (b) => { b.damageOpponent(15); b.healPlayer(5); },
        emoji: '👑'
      });
    }

    if (this.player.jaw === 'Chiseled' || this.player.jaw === 'Sharp') {
      cardPool.push({
        name: 'Jawline Flash', desc: 'Shadow cuts like a knife.',
        cost: 2, power: 32,
        effect: (b) => {
          let dmg = 32;
          if (b.lastCardPlayed === 'Nice Personality' || b.lastCardPlayed === 'Retinol Radiance') {
            dmg *= 2;
            b.logCallback("✨ COMBO: 'Model Look'! Double damage!", "success");
          }
          b.damageOpponent(dmg);
        }, emoji: '📐'
      });
    }

    if (this.player.tilt === 'Positive') {
      cardPool.push({
        name: 'Hunter Eye Lock', desc: 'Lock eyes with tilt dominance.',
        cost: 2, power: 22,
        effect: (b) => { b.damageOpponent(22); b.opponentDialog = b.opponent.dialogs.hit; },
        emoji: '👁️'
      });
    }

    if (this.player.skin >= 75) {
      cardPool.push({
        name: 'Retinol Radiance', desc: 'Blind them with clear skin.',
        cost: 1, power: 14,
        effect: (b) => { b.damageOpponent(14); },
        emoji: '✨'
      });
    }

    if (this.player.frame >= 70) {
      cardPool.push({
        name: 'Frame Flex', desc: 'Widen shoulders. Damage + heal.',
        cost: 2, power: 15,
        effect: (b) => {
          let dmg = 15; let heal = 10;
          if (b.lastCardPlayed === 'Drip Overload') {
            dmg *= 2; heal += 10;
            b.logCallback("💪 COMBO: 'Sigma Grind'! Double damage + extra heal!", "success");
          }
          b.damageOpponent(dmg); b.healPlayer(heal);
        }, emoji: '🛡️'
      });
    }

    if (this.player.cash >= 1500) {
      cardPool.push({
        name: 'Wallet Flash', desc: 'Flash designer logo.',
        cost: 2, power: 25,
        effect: (b) => { b.damageOpponent(25); },
        emoji: '💳'
      });
    }

    if (this.player.style >= 70) {
      cardPool.push({
        name: 'Drip Overload', desc: 'Aesthetic presence.',
        cost: 2, power: 26,
        effect: (b) => { b.damageOpponent(26); },
        emoji: '🧥'
      });
    }

    if (this.player.rizz >= 60) {
      cardPool.push({
        name: 'Rizz Flash', desc: 'Turn on the charm.',
        cost: 1, power: 18,
        effect: (b) => { b.damageOpponent(18); b.healPlayer(8); },
        emoji: '🔥'
      });
    }

    if (this.player.rizz >= 80) {
      cardPool.push({
        name: 'Charisma Overload', desc: 'Overwhelming presence.',
        cost: 2, power: 30,
        effect: (b) => {
          let dmg = 30;
          if (b.lastCardPlayed === 'Rizz Flash') { dmg *= 2; b.logCallback("🔥 COMBO: 'Charisma Cascade'! Double damage!", "success"); }
          b.damageOpponent(dmg);
        }, emoji: '✨'
      });
    }

    const careerRank = ['unemployed','entry','junior','mid','senior','manager','director','executive','ceo'].indexOf(this.player.careerTier);
    if (careerRank >= 4) {
      cardPool.push({
        name: 'Power Move', desc: 'Call in professional favors.',
        cost: 2, power: 24 + careerRank * 2,
        effect: (b) => { b.damageOpponent(24 + careerRank * 2); },
        emoji: '💼'
      });
    }

    if (this.player.hasInfluencerCard) {
      cardPool.push({
        name: 'Influencer Aura', desc: 'Social media clout.',
        cost: 2, power: 30,
        effect: (b) => {
          let dmg = 30; let heal = 20;
          if (b.lastCardPlayed === 'Power Move') { dmg = 50; heal = 30; b.logCallback("💼 COMBO: 'Power Executive'! Devastating!", "success"); }
          b.damageOpponent(dmg); b.healPlayer(heal);
        }, emoji: '🤳'
      });
    }

    if (this.player.symmetry === 'Symmetrical') {
      cardPool.push({
        name: 'Symmetry Flex', desc: 'Perfectly balanced features.',
        cost: 2, power: 28,
        effect: (b) => {
          let dmg = 28;
          if (b.lastCardPlayed === 'Frame Flex') { dmg *= 2; b.logCallback("⚖️ COMBO: 'Perfect Storm'! Double damage!", "success"); }
          b.damageOpponent(dmg);
        }, emoji: '⚖️'
      });
    }

    const careerIdx = ['unemployed','entry','junior','mid','senior','manager','director','executive','ceo'].indexOf(this.player.careerTier);
    if (careerIdx >= 2) {
      cardPool.push({
        name: 'Career Dominance', desc: 'Professional success as leverage.',
        cost: 2, power: 20 + careerIdx * 2,
        effect: (b) => {
          const dmg = 20 + careerIdx * 2; let heal = 5;
          if (b.lastCardPlayed === 'Wallet Flash') { heal += 10; b.logCallback("💎 COMBO: 'High Roller'! Extra heal!", "success"); }
          b.damageOpponent(dmg); b.healPlayer(heal);
        }, emoji: '📊'
      });
    }

    // NEW STATUS EFFECT CARDS
    if (this.player.rizz >= 50) {
      cardPool.push({
        name: 'Motivational Speech', desc: 'Regenerate confidence over time.',
        cost: 1, power: 0,
        effect: (b) => { b.addEffect('player', 'regeneration', { value: 6, duration: 3 }); b.logCallback("💚 Regeneration: +6 Confidence for 3 turns!", "success"); },
        emoji: '🎤'
      });
    }

    if (this.player.confidence >= 40) {
      cardPool.push({
        name: 'Guard Up', desc: 'Gain shield.',
        cost: 2, power: 0,
        effect: (b) => { b.addEffect('player', 'shield', { value: 18 }); b.logCallback("🛡️ Shield: +18 damage absorption!", "success"); },
        emoji: '🔰'
      });
    }

    if (this.player.smv >= 3.0) {
      cardPool.push({
        name: 'Withering Gaze', desc: 'Apply burn to opponent.',
        cost: 1, power: 8,
        effect: (b) => { b.damageOpponent(8); b.addEffect('opponent', 'burn', { stacks: 2, duration: 3 }); },
        emoji: '👀'
      });
    }

    if (this.player.rizz >= 70) {
      cardPool.push({
        name: 'Charm Offensive', desc: 'Damage + vulnerable on opponent.',
        cost: 2, power: 16,
        effect: (b) => { b.damageOpponent(16); b.addEffect('opponent', 'vulnerable', { duration: 2 }); },
        emoji: '💘'
      });
    }

    this.deck = [...cardPool];
    this.shuffle(this.deck);
  }

  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  drawHand(count) {
    this.playerHand = [];
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) this.buildDeck();
      this.playerHand.push(this.deck.pop());
    }
  }

  // ====== PLAY CARD ======

  playCard(cardIndex) {
    if (this.isOver || cardIndex < 0 || cardIndex >= this.playerHand.length) return false;
    const card = this.playerHand[cardIndex];

    if (this.energy < card.cost) {
      this.logCallback("Not enough turn energy!", "error");
      return false;
    }

    let actualCost = card.cost;
    if (this.opponent.id === 'influencer_agent' && this.cardsPlayedThisTurn === 0) {
      actualCost += 1;
    }

    if (this.energy < actualCost) {
      this.logCallback("Not enough energy (Hype Drain increases first card cost)!", "error");
      return false;
    }

    this.energy -= actualCost;
    this.lastPlayedCardCost = actualCost;
    this.cardsPlayedThisTurn++;
    card.effect(this);

    this.playerHand.splice(cardIndex, 1);
    this.logCallback(`You played [${card.name}] for ${actualCost} Energy!`, "success");

    this.lastCardPlayed = card.name;
    this.momentum = Math.min(this.maxMomentum, this.momentum + 1);

    if (this.opponent.id === 'chad_gym_bro' && card.cost === 2) {
      this.opponentSkepticism = Math.min(this.opponentMaxSkepticism, this.opponentSkepticism + 5);
      this.logCallback("💪 Grindset: Opponent heals 5 Skepticism!", "event");
    }
    if (this.opponent.id === 'clav_influencer') {
      this.opponentSkepticism = Math.min(this.opponentMaxSkepticism, this.opponentSkepticism + 3);
      this.logCallback("📱 Swipe Fatigue: Opponent regenerates 3 Skepticism!", "event");
    }

    if (this.opponentSkepticism <= 0) {
      this.resolveBattle(true);
    }
    return true;
  }

  damageOpponent(val) {
    let modified = val;

    if (this.opponent.id === 'stacy_tinder' && this.lastPlayedCardCost === 1) {
      modified = Math.floor(modified * 0.6);
    }
    if (this.opponent.id === 'vip_bouncer' && this.cardsPlayedThisTurn <= 1) {
      modified = Math.floor(modified * 0.7);
    }
    if (this.opponent.id === 'plastic_surgeon') {
      modified = Math.floor(modified * 0.85);
    }
    if (this.opponent.id === 'mastermind') {
      modified = Math.floor(modified * 0.7);
    }
    if (this.hasEffect('opponent', 'vulnerable')) modified = Math.floor(modified * 1.25);
    if (this.hasEffect('opponent', 'weakened')) modified = Math.floor(modified * 0.75);

    this.opponentSkepticism = Math.max(0, this.opponentSkepticism - modified);
    this.opponentDialog = this.opponent.dialogs.hit;

    if (this.phase === 1 && this.opponentSkepticism <= this.opponentMaxSkepticism * 0.5) {
      this.phase = 2;
      this.opponentDialog = this.opponent.dialogs.phase2 || "You're pushing me too far!";
      this.logCallback(`⚠️ ${this.opponent.name} enters PHASE 2! Attacks intensified!`, "error");
    }
  }

  healPlayer(val) {
    let modified = val;
    if (this.opponent.id === 'social_media_manager') {
      modified = Math.floor(modified * 0.7);
    }
    if (this.opponent.id === 'mastermind') {
      modified = Math.floor(modified * 0.7);
    }
    this.playerConfidence = Math.min(100, this.playerConfidence + modified);
  }

  // ====== END TURN ======

  endTurn() {
    if (this.isOver) return;

    this.processTurnStartEffects();

    if (this.playerConfidence <= 0) {
      this.resolveBattle(false);
      return;
    }

    if (this.hasEffect('player', 'stun')) {
      this.logCallback("⏸️ You are stunned and skip your turn!", "error");
      this.removeEffect('player', 'stun');
      this.energy = this.maxEnergy;
      this.turn++;
      this.cardsPlayedThisTurn = 0;
      this.drawHand(4);
      if (this.opponent.id === 'tiktok_rat' && this.playerHand.length > 0) {
        const removeIdx = Math.floor(Math.random() * this.playerHand.length);
        const removed = this.playerHand.splice(removeIdx, 1)[0];
        this.logCallback(`🤖 Shadow Ban: "${removed.name}" discarded!`, "error");
      }
      this.logCallback(`Turn ${this.turn} started (stun skip).`, "system");
      return;
    }

    const move = this.selectMove();
    if (move) {
      this.executeMove(move);
    } else {
      const baseAttack = 10;
      const variance = Math.floor(baseAttack * (0.8 + Math.random() * 0.4));
      this.playerConfidence = Math.max(0, this.playerConfidence - variance);
      this.opponentDialog = this.opponent.dialogs.attack;
      this.lastMoveName = 'Basic Shade';
      this.lastMoveDamage = variance;
      this.lastMoveEffects = [];
      this.logCallback(`${this.opponent.name} attacks! (-${variance}% Confidence)`, "event");
    }

    this.lastCardPlayed = null;

    if (this.playerConfidence <= 0) {
      this.resolveBattle(false);
      return;
    }

    this.energy = this.maxEnergy;
    this.turn++;
    this.cardsPlayedThisTurn = 0;
    this.drawHand(4);

    if (this.opponent.id === 'tiktok_rat' && this.playerHand.length > 0) {
      const removeIdx = Math.floor(Math.random() * this.playerHand.length);
      const removed = this.playerHand.splice(removeIdx, 1)[0];
      this.logCallback(`🤖 Shadow Ban: "${removed.name}" discarded!`, "error");
    }

    this.logCallback(`Turn ${this.turn} started. Hand replenished.`, "system");
  }

  // ====== CONCLUDE BATTLE ======

  resolveBattle(isWin) {
    this.isOver = true;
    this.active = false;

    if (isWin) {
      this.outcome = 'win';
      this.opponentDialog = this.opponent.dialogs.defeat;
      const rew = this.opponent.rewards;
      this.player.cash += rew.cash || 0;
      this.player.confidence = Math.min(100, this.player.confidence + (rew.confidence || 0));
      if (rew.style) this.player.style = Math.min(100, this.player.style + rew.style);
      if (rew.frame) this.player.frame = Math.min(100, this.player.frame + rew.frame);
      if (rew.datingScore) this.player.datingScore += rew.datingScore;
      if (rew.followers) this.player.followers += rew.followers;
      if (rew.partner) {
        this.player.hasDatingPartner = true;
        this.player.partnerName = rew.partner;
      }
      this.player.opponentsDefeated.push(this.opponent.id);
      this.player.updateSMV();
      if (typeof this.player.getTalentPoint === 'function') this.player.getTalentPoint();
      this.logCallback(`VICTORY! ${rew.log}`, "success");
    } else {
      this.outcome = 'lose';
      this.opponentDialog = this.opponent.dialogs.victory;
      this.player.confidence = 10;
      this.player.cash = Math.max(0, this.player.cash - 150);
      this.player.updateSMV();
      if (this.opponent.difficulty === 'Impossible') {
        this.player.isDead = true;
        this.player.log.push(`FATAL: Mogged to death by ${this.opponent.name}.`);
        this.logCallback(`💀 FATAL: ${this.opponent.name} destroyed your will to live.`, "error");
      }
      this.logCallback(`DEFEAT! ${this.opponent.name} crushed you.`, "error");
    }
  }
}
