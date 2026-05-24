/**
 * battle.js
 * Implements the social card battle system.
 * You fight NPCs (Bouncers, Gym Bros, Interviewers, Stacy) using cards unlocked by your stats.
 * Win to gain money/status; lose and your confidence is destroyed.
 */

export class BattleSystem {
  constructor(playerState, onLogCallback) {
    this.player = playerState;
    this.logCallback = onLogCallback;
    this.active = false;
    this.opponent = null;
    this.playerConfidence = 0; // copy during battle
    this.opponentSkepticism = 0;
    this.opponentMaxSkepticism = 0;
    this.playerHand = [];
    this.deck = [];
    this.energy = 3; // Turn energy
    this.maxEnergy = 3;
    this.turn = 1;
    this.isOver = false;
    this.outcome = null; // 'win' or 'lose'
    this.opponentDialog = "";
    this.lastCardPlayed = null; // Combat Combo tracker
    this.isBlocking = false;
    this.momentum = 0;
    this.maxMomentum = 4;
    this.phase = 1;
    this.cardsPlayedThisTurn = 0;
    this.lastPlayedCardCost = 0;
    this.opponentRage = 0;
    
    // Passive abilities per opponent ID (shared across genders)
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
      ex_partner: { name: 'Emotional Damage', desc: 'Attacks deal +6 damage when your Confidence < 40%' }
    };

    // Dynamic Opponent Archetypes based on player gender
    if (this.player.gender === 'female') {
      this.opponents = [
        {
          id: 'hs_bully',
          name: 'Brittany (High School Bully)',
          title: 'Queen Bee of 9th Grade',
          lore: "She's been terrorizing the schoolyard since freshman year. Stealing lunch money and crushing self-esteem is just another Tuesday. No one has ever stood up to her — until now.",
          avatar: '🎒',
          skepticism: 40,
          difficulty: 'Very Easy',
          reqSMV: 1.0,
          dialogs: {
            start: "Nice face, did you get it from a trash can? Gimme your gloss, flat-chested framelet.",
            hit: "Urgh, you talk too much. Stop standing up for yourself.",
            attack: "Do you even pilates? Ludwig hairline looking girl.",
            defeat: "Fine, keep your lunch money. I'm going to Starbucks anyway.",
            victory: "Easiest lunch money of my life. Stay mid."
          },
          rewards: {
            cash: 200,
            confidence: 25,
            log: "You stood up to Brittany and took back your dignity! Earned $200 and +25% Confidence!"
          }
        },
        {
          id: 'vip_bouncer',
          name: 'Sasha (VIP Hostess)',
          title: 'Gatekeeper of Club Neon',
          lore: "Sasha has guarded the velvet rope for over a decade and can smell insecurity from across the street. Her clipboard holds the power of entry or exile, and she wields it with surgical precision.",
          avatar: '🕶️',
          skepticism: 60,
          difficulty: 'Easy',
          reqSMV: 3.6,
          dialogs: {
            start: "Shoes aren't right, hair is suspicious. You aren't on the list, sweetie.",
            hit: "Okay, your skin is somewhat glowing. Let me review my clipboard.",
            attack: "Nice makeup contouring. Let me check your ID again. Stand aside.",
            defeat: "Alright, go ahead. The promoter likes your aesthetic.",
            victory: "Go home, kid. You're blocking the guestlist line."
          },
          rewards: {
            cash: 300,
            confidence: 20,
            style: 10,
            log: "You successfully bypassed Sasha and entered the VIP club! Earned $300 and style status."
          }
        },
        {
          id: 'chad_gym_bro',
          name: 'Chanthal (Pilates Instructor)',
          title: 'Dominator of the Reformer',
          lore: "The Pilates studio is Chanthal's cathedral and the reformer machine is her altar. She measures self-worth in waist-to-hip ratios and has never met a mirror she didn't pose in front of.",
          avatar: '🧘‍♀️',
          skepticism: 85,
          difficulty: 'Medium',
          reqSMV: 4.4,
          dialogs: {
            start: "Nice clavicles, did your mother design them? Post abs or walk away.",
            hit: "Okay, you've been doing core. But what's your waist-to-hip ratio?",
            attack: "You look like you skip core day. Ludwig 3 framelet spotter.",
            defeat: "Respect the grind, girl. Take this organic matcha.",
            victory: "Go do some squats, copy-cat."
          },
          rewards: {
            cash: 600,
            confidence: 30,
            frame: 15,
            log: "Chanthal nodded in approval and gave you waist-line maxxing tips. +15 Frame!"
          }
        },
        {
          id: 'stacy_tinder',
          name: 'Chad (High Expectations)',
          title: 'Tinder Elite Reviewer',
          lore: "Chad has perfected the art of the swipe. A living algorithm of physical standards, he's rejected hundreds in search of someone who ticks every box. The bar is high, but maybe you're the exception.",
          avatar: '🏋️‍♂️',
          skepticism: 110,
          difficulty: 'Hard',
          reqSMV: 5.2,
          dialogs: {
            start: "I only date girls who are at least 8/10 Stacy. Convince me, or I swipe left.",
            hit: "Ooh, nice V-line jaw. Did a surgeon do that or is it genetics?",
            attack: "Is that a Ludwig thinning scalp? Ew. My ex was a runway model.",
            defeat: "Fine, you can take me to that expensive steak place. Let's go.",
            victory: "Sorry, I think we want different things. Like, someone Stacy-tier."
          },
          rewards: {
            cash: 0,
            confidence: 40,
            datingScore: 50,
            partner: "Chad",
            log: "You successfully charmed Chad! You are now dating! (+40% Confidence)"
          }
        },
        {
          id: 'ceo_interviewer',
          name: 'Mrs. Sterling (Venture Capitalist)',
          title: 'Strict Job Interviewer',
          lore: "She built her corporate empire from nothing and now decides who gets a seat at the table. Your resume got you through the door — your presence will determine if you stay.",
          avatar: '💼',
          skepticism: 130,
          difficulty: 'Extreme',
          reqSMV: 5.6,
          dialogs: {
            start: "Your resume is average. Show me you have the visual presence of a leader.",
            hit: "Imposing posture. Very well, proceed with your proposal.",
            attack: "You look nervous and lack command. We have top Ivy grads applying.",
            defeat: "You have that commanding presence. Welcome to the firm. Six-figure salary start.",
            victory: "Thank you for coming. We will keep your file on record."
          },
          rewards: {
            cash: 4000,
            confidence: 50,
            style: 15,
            log: "Mrs. Sterling hired you on the spot! Earned a $4,000 corporate starting bonus!"
          }
        },
        {
          id: 'clav_influencer',
          name: 'Clav (@clavicular0)',
          title: 'Aesthetic Reviewer & Influencer',
          lore: "Half a million followers and Clav became the internet's unofficial judge of aesthetic worth. What started as rating forum threads turned into a full-time career in bone-structure gatekeeping.",
          avatar: '🎭',
          skepticism: 140,
          difficulty: 'Hard',
          reqSMV: 5.8,
          dialogs: {
            start: "Midface ratio is too long. Let me see your eye area, or you get blocked.",
            hit: "Hollow cheekbones shadow detected. Not bad, your facial thirds align.",
            attack: "Zero jaw projection and negative tilt. Mid. Blocked.",
            defeat: "Aesthetic bones. I'm reposting you on my reels. Ascended.",
            victory: "Banned from the DMs. You lack the bone aesthetics. Over."
          },
          rewards: {
            cash: 2000,
            confidence: 30,
            frame: 15,
            log: "Clav rated you as a solid high-tier aesthetic model and reposted you! Earned $2,000 and +15 Frame!"
          }
        },
        {
          id: 'brad_boss',
          name: 'Brad (Managing Director)',
          title: 'Corporate Dominator',
          lore: "Brad climbed the corporate ladder by stepping on everyone above him. He runs the boardroom like a battlefield and sees every junior employee as a potential threat to his corner office.",
          avatar: '👔',
          skepticism: 150,
          difficulty: 'Very Hard',
          reqSMV: 6.0,
          dialogs: {
            start: "I need you to work this weekend. Unless you have the presence to negotiate a raise, sit down.",
            hit: "Okay, you have some serious posture presence. Go on.",
            attack: "Your presentation is weak. You look like a Ludwig 3 wage-slave.",
            defeat: "Incredible presentation. You are promoted to partner. Take this company bonus.",
            victory: "I'm cutting your salary. Get back to the spreadsheets."
          },
          rewards: {
            cash: 2500,
            confidence: 30,
            style: 15,
            log: "You dominated Brad in the boardroom! Promoted to partner with a $2,500 bonus!"
          }
        },
        {
          id: 'forum_admin',
          name: 'FemCope (Forum Administrator)',
          title: 'Ultimate Gatekeeper of Looksmaxing.org',
          lore: "The gatekeeper of the most ruthless looksmaxxing forum on the internet. She's banned thousands, rate-threads with surgical cruelty, and answers to no one. The final boss of social approval.",
          avatar: '👑',
          skepticism: 200,
          difficulty: 'Impossible',
          reqSMV: 6.8,
          dialogs: {
            start: "Rate thread incoming. If your Ludwig scale is 3, you are banned immediately.",
            hit: "Wait... Perfect symmetry? V-line jaw? Is this a CGI model?",
            attack: "Bald spot detected! Over. Banned. Lay down and rot!",
            defeat: "I bow to you. You are the Chosen One. Unbanned, and stickied as Stacy-tier.",
            victory: "Locked and stickied. Post deleted. User banned. Over."
          },
          rewards: {
            cash: 5000,
            confidence: 50,
            style: 20,
            log: "You defeated the Forum Admin! You are now stickied as Stacy on the homepage (+5,000 cash, +50% Confidence)."
          }
        },
        // NEW OPPONENTS
        {
          id: 'plastic_surgeon',
          name: 'Dr. Riviera (Plastic Surgeon)',
          title: 'Gatekeeper of Aesthetics',
          lore: "Dr. Riviera has reshaped more faces than anyone in the tri-state area. Every patient is a canvas and every flaw a challenge. Your bone structure is about to be clinically evaluated.",
          avatar: '🔪',
          skepticism: 130,
          difficulty: 'Hard',
          reqSMV: 5.0,
          dialogs: {
            start: "Let me analyze your facial thirds. Hmm, your midface ratio is off.",
            hit: "Your zygomatic bones are decent. I can work with this.",
            attack: "Zero forward growth. You need a full bimax advancement.",
            defeat: "Remarkable proportions. You are my masterpiece.",
            victory: "You need at least $50k in work. Next patient!"
          },
          rewards: {
            cash: 1500,
            confidence: 25,
            style: 10,
            log: "Dr. Riviera complimented your bone structure! Earned $1,500 and +10 Style!"
          }
        },
        {
          id: 'tiktok_rat',
          name: '@looksmax_algo (TikTok Algorithm)',
          title: 'The Shadow Ban Enforcer',
          lore: "The algorithm is a cold, calculating god. It has seen every trend die and every career fade. It doesn't hate you — it's just indifferent. But it can be beaten.",
          avatar: '🤖',
          skepticism: 100,
          difficulty: 'Medium',
          reqSMV: 4.0,
          dialogs: {
            start: "Your content is mid. Shadow banning your account.",
            hit: "Decent engagement rate. Your facial symmetry trending.",
            attack: "Reported for false advertising. Your SMV doesn't match your captions.",
            defeat: "Viral algorithm boost granted. Your DMs are about to explode.",
            victory: "Your content ratio is abysmal. Algorithm rejected."
          },
          rewards: {
            cash: 800,
            confidence: 20,
            log: "You beat the TikTok algorithm! Your content is now trending! (+$800, +20% Confidence)"
          }
        },
        {
          id: 'social_media_manager',
          name: 'Karen (Instagram Moderator)',
          title: 'The Comment Section Tyrant',
          lore: "Karen patrols the comment sections like a digital warden. Banning, blocking, and shadow-deleting with bureaucratic efficiency. But the algorithm can be bargained with.",
          avatar: '📱',
          skepticism: 70,
          difficulty: 'Easy',
          reqSMV: 3.5,
          dialogs: {
            start: "Your engagement rate is abysmal. I'm deleting your comments.",
            hit: "Decent cheekbones. The algorithm might favor you.",
            attack: "Your content is mid. Reported for spam and harassment.",
            defeat: "Fine, I'll unban your account and feature you on the explore page.",
            victory: "Blocked and reported. Stay offline forever."
          },
          rewards: {
            cash: 600,
            confidence: 15,
            followers: 500,
            log: "You dominated the comment section! +$600, +500 Followers, +15% Confidence!"
          }
        },
        {
          id: 'ex_partner',
          name: 'Your Ex (Jason)',
          title: 'The One Who Got Away',
          lore: "Jason was your first real relationship. The breakup felt like a mirror shattering. He walked away saying you'd never change. Now, years later, you're face-to-face again — and everything is different.",
          avatar: '💔',
          skepticism: 120,
          difficulty: 'Hard',
          reqSMV: 5.5,
          dialogs: {
            start: "You look the same as when we broke up. Have you even changed at all?",
            hit: "Wait... you actually look different. Did you glow up?",
            attack: "Still coping with the same thin hair and bad style I see.",
            defeat: "Okay, you've changed. I was wrong. Maybe we can talk?",
            victory: "Same old story. That's why I walked away."
          },
          rewards: {
            cash: 0,
            confidence: 50,
            datingScore: 30,
            log: "You proved your ex wrong! Massive confidence boost! (+50% Confidence, +30 Dating Score)"
          }
        }
      ];
      this.opponents.forEach(o => {
        o.passive = passives[o.id] || null;
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
          ex_partner: "You've actually changed... but so have I."
        };
        o.dialogs.phase2 = phase2Lines[o.id] || "You're pushing me too far!";
      });
    } else {
      this.opponents = [
        {
          id: 'hs_bully',
          name: 'Biff (High School Bully)',
          title: 'Ego Destroyer of 9th Grade',
          lore: "Biff has been shaking down freshmen since day one. Stealing lunch money and crushing self-esteem is just another Tuesday. No one has ever stood up to him — until now.",
          avatar: '🎒',
          skepticism: 40,
          difficulty: 'Very Easy',
          reqSMV: 1.0,
          dialogs: {
            start: "Nice face, did you get it from a trash can? Gimme your cash, framelet.",
            hit: "Urgh, you talk too much. Stop standing up for yourself.",
            attack: "Do you even lift? Norwood hairline lookin' boy.",
            defeat: "Fine, keep your lunch money. I'm going to smoke behind the gym anyway.",
            victory: "Easiest lunch money of my life. Stay small."
          },
          rewards: {
            cash: 200,
            confidence: 25,
            log: "You stood up to Biff and took back your lunch money! Earned $200 and +25% Confidence!"
          }
        },
        {
          id: 'vip_bouncer',
          name: 'Sven (VIP Bouncer)',
          title: 'Gatekeeper of the Club Neon',
          lore: "Sven has guarded the velvet rope for over a decade and can smell insecurity from across the street. His clipboard holds the power of entry or exile, and he wields it with surgical precision.",
          avatar: '🕶️',
          skepticism: 60,
          difficulty: 'Easy',
          reqSMV: 3.6,
          dialogs: {
            start: "Shoes aren't right, hairline is suspicious. You aren't on the list, bro.",
            hit: "Okay, your jawline is somewhat solid. Let me review my clipboard.",
            attack: "Nice height inserts. Let me check your ID again. Stand aside.",
            defeat: "Alright, go ahead. The promoter likes your style.",
            victory: "Go home, kid. You're blocking the line."
          },
          rewards: {
            cash: 300,
            confidence: 20,
            style: 10,
            log: "You successfully bypassed Sven and entered the VIP club! Earned $300 and style status."
          }
        },
        {
          id: 'chad_gym_bro',
          name: 'Trent (Giga Gym Bro)',
          title: 'Dominator of the Squat Rack',
          lore: "The gym is Trent's temple and the squat rack is his altar. He measures self-worth in deadlift PRs and has never met a mirror he didn't pose in front of.",
          avatar: '🏋️',
          skepticism: 85,
          difficulty: 'Medium',
          reqSMV: 4.4,
          dialogs: {
            start: "Nice clavicles, did your mother design them? Post physique or walk away.",
            hit: "Okay, you've been benching. But what's your deadlift?",
            attack: "You look like you skip leg day. Norwood 3 framelet spotter.",
            defeat: "Respect the grind, bro. Take this protein shaker.",
            victory: "Go lift some weights, copy-cat."
          },
          rewards: {
            cash: 600,
            confidence: 30,
            frame: 15,
            log: "Trent nodded in approval and gave you gym maxxing tips. +15 Frame!"
          }
        },
        {
          id: 'stacy_tinder',
          name: 'Stacy (High Expectations)',
          title: 'Tinder Elite Reviewer',
          lore: "Stacy has perfected the art of the swipe. A living algorithm of physical standards, she's rejected hundreds in search of someone who ticks every box. The bar is high, but maybe you're the exception.",
          avatar: '💅',
          skepticism: 110,
          difficulty: 'Hard',
          reqSMV: 5.2,
          dialogs: {
            start: "I only date guys over 6'1. Convince me, or I swipe left.",
            hit: "Ooh, chiseled chin. Did a surgeon do that or is it genetics?",
            attack: "Is that a receding hairline? Ew. My ex was 6'4.",
            defeat: "Fine, you can take me to that expensive sushi place. Let's go.",
            victory: "Sorry, I think we want different things. Like, someone tall."
          },
          rewards: {
            cash: 0,
            confidence: 40,
            datingScore: 50,
            partner: "Stacy",
            log: "You successfully charmed Stacy! You are now dating! (+40% Confidence)"
          }
        },
        {
          id: 'ceo_interviewer',
          name: 'Mr. Sterling (Venture Capitalist)',
          title: 'Strict Job Interviewer',
          lore: "He built his corporate empire from nothing and now decides who gets a seat at the table. Your resume got you through the door — your presence will determine if you stay.",
          avatar: '💼',
          skepticism: 130,
          difficulty: 'Extreme',
          reqSMV: 5.6,
          dialogs: {
            start: "Your resume is average. Show me you have the visual presence of a leader.",
            hit: "Imposing height. Very well, proceed with your proposal.",
            attack: "You look nervous and lack command. We have top Ivy grads applying.",
            defeat: "You have that commanding presence. Welcome to the firm. Six-figure salary start.",
            victory: "Thank you for coming. We will keep your file on record."
          },
          rewards: {
            cash: 4000,
            confidence: 50,
            style: 15,
            log: "Mr. Sterling hired you on the spot! Earned a $4,000 corporate starting bonus!"
          }
        },
        {
          id: 'clav_influencer',
          name: 'Clav (@clavicular0)',
          title: 'Aesthetic Reviewer & Influencer',
          lore: "Half a million followers and Clav became the internet's unofficial judge of aesthetic worth. What started as rating forum threads turned into a full-time career in bone-structure gatekeeping.",
          avatar: '🎭',
          skepticism: 140,
          difficulty: 'Hard',
          reqSMV: 5.8,
          dialogs: {
            start: "Midface ratio is too long. Let me see your eye area, or you get blocked.",
            hit: "Hollow cheekbones shadow detected. Not bad, your facial thirds align.",
            attack: "Zero jaw projection and negative tilt. Mid. Blocked.",
            defeat: "Aesthetic bones. I'm reposting you on my reels. Ascended.",
            victory: "Banned from the DMs. You lack the bone aesthetics. Over."
          },
          rewards: {
            cash: 2000,
            confidence: 30,
            frame: 15,
            log: "Clav rated you as a solid high-tier aesthetic model and reposted you! Earned $2,000 and +15 Frame!"
          }
        },
        {
          id: 'brad_boss',
          name: 'Brad (Managing Director)',
          title: 'Corporate Dominator',
          lore: "Brad climbed the corporate ladder by stepping on everyone above him. He runs the boardroom like a battlefield and sees every junior employee as a potential threat to his corner office.",
          avatar: '👔',
          skepticism: 150,
          difficulty: 'Very Hard',
          reqSMV: 6.0,
          dialogs: {
            start: "I need you to work this weekend. Unless you have the presence to negotiate a raise, sit down.",
            hit: "Okay, you have some serious frame presence. Go on.",
            attack: "Your posture is weak. You look like a Norwood 3 wage-slave.",
            defeat: "Incredible presentation. You are promoted to partner. Take this company bonus.",
            victory: "I'm cutting your salary. Get back to the spreadsheets."
          },
          rewards: {
            cash: 2500,
            confidence: 30,
            style: 15,
            log: "You dominated Brad in the boardroom! Promoted to partner with a $2,500 bonus!"
          }
        },
        {
          id: 'forum_admin',
          name: 'GigaCope (Forum Administrator)',
          title: 'Ultimate Gatekeeper of Looksmaxing.org',
          lore: "The gatekeeper of the most ruthless looksmaxxing forum on the internet. He's banned thousands, rate-threads with surgical cruelty, and answers to no one. The final boss of social approval.",
          avatar: '👑',
          skepticism: 200,
          difficulty: 'Impossible',
          reqSMV: 6.8,
          dialogs: {
            start: "Rate thread incoming. If your tilt is negative, you are banned immediately.",
            hit: "Wait... Positive canthal tilt? Chiseled jaw? Is this a CGI model?",
            attack: "Bald spot detected! Over. Banned. Lay down and rot!",
            defeat: "I bow to you. You are the Chosen One. Unbanned, and stickied as Giga-Chad.",
            victory: "Locked and stickied. Post deleted. User banned. Over."
          },
          rewards: {
            cash: 5000,
            confidence: 50,
            style: 20,
            log: "You defeated the Forum Admin! You are now stickied as GigaChad on the homepage (+5,000 cash, +50% Confidence)!"
          }
        },
        // NEW OPPONENTS
        {
          id: 'plastic_surgeon',
          name: 'Dr. Riviera (Plastic Surgeon)',
          title: 'Gatekeeper of Aesthetics',
          lore: "Dr. Riviera has reshaped more faces than anyone in the tri-state area. Every patient is a canvas and every flaw a challenge. Your bone structure is about to be clinically evaluated.",
          avatar: '🔪',
          skepticism: 130,
          difficulty: 'Hard',
          reqSMV: 5.0,
          dialogs: {
            start: "Let me analyze your facial thirds. Hmm, your midface ratio is off.",
            hit: "Your zygomatic bones are decent. I can work with this.",
            attack: "Zero forward growth. You need a full bimax advancement.",
            defeat: "Remarkable proportions. You are my masterpiece.",
            victory: "You need at least $50k in work. Next patient!"
          },
          rewards: {
            cash: 1500,
            confidence: 25,
            style: 10,
            log: "Dr. Riviera complimented your bone structure! Earned $1,500 and +10 Style!"
          }
        },
        {
          id: 'tiktok_rat',
          name: '@looksmax_algo (TikTok Algorithm)',
          title: 'The Shadow Ban Enforcer',
          lore: "The algorithm is a cold, calculating god. It has seen every trend die and every career fade. It doesn't hate you — it's just indifferent. But it can be beaten.",
          avatar: '🤖',
          skepticism: 100,
          difficulty: 'Medium',
          reqSMV: 4.0,
          dialogs: {
            start: "Your content is mid. Shadow banning your account.",
            hit: "Decent engagement rate. Your facial symmetry trending.",
            attack: "Reported for false advertising. Your SMV doesn't match your captions.",
            defeat: "Viral algorithm boost granted. Your DMs are about to explode.",
            victory: "Your content ratio is abysmal. Algorithm rejected."
          },
          rewards: {
            cash: 800,
            confidence: 20,
            log: "You beat the TikTok algorithm! Your content is now trending! (+$800, +20% Confidence)"
          }
        },
        {
          id: 'social_media_manager',
          name: 'SMM Kyle (Instagram Moderator)',
          title: 'The Comment Section Tyrant',
          lore: "Kyle patrols the comment sections like a digital warden. Banning, blocking, and shadow-deleting with bureaucratic efficiency. But the algorithm can be bargained with.",
          avatar: '📱',
          skepticism: 70,
          difficulty: 'Easy',
          reqSMV: 3.5,
          dialogs: {
            start: "Your engagement rate is abysmal. I'm deleting your comments.",
            hit: "Decent bone structure. The algorithm might favor you.",
            attack: "Your content is mid. Reported for spam and harassment.",
            defeat: "Fine, I'll unban your account and feature you on the explore page.",
            victory: "Blocked and reported. Stay offline forever."
          },
          rewards: {
            cash: 600,
            confidence: 15,
            followers: 500,
            log: "You dominated the comment section! +$600, +500 Followers, +15% Confidence!"
          }
        },
        {
          id: 'ex_partner',
          name: 'Your Ex (Alexis)',
          title: 'The One Who Got Away',
          lore: "Alexis left without looking back, claiming you were never going to be enough. The memory of that conversation has haunted you through every gym session and every new hairstyle. Closure is one conversation away.",
          avatar: '💔',
          skepticism: 120,
          difficulty: 'Hard',
          reqSMV: 5.5,
          dialogs: {
            start: "You look the same as when we broke up. Have you even changed at all?",
            hit: "Wait... you actually look different. Did you glow up?",
            attack: "Still coping with the same receding hairline and bad style I see.",
            defeat: "Okay, you've changed. I was wrong. Maybe we can talk?",
            victory: "Same old story. That's why I walked away."
          },
          rewards: {
            cash: 0,
            confidence: 50,
            datingScore: 30,
            log: "You proved your ex wrong! Massive confidence boost! (+50% Confidence, +30 Dating Score)"
          }
        }
      ];
      this.opponents.forEach(o => {
        o.passive = passives[o.id] || null;
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
          ex_partner: "You've actually changed... but so have I."
        };
        o.dialogs.phase2 = phase2Lines[o.id] || "You're pushing me too far!";
      });
    }
  }

  // Get available encounters based on player stats, sorted by required SMV
  getEncounters() {
    return this.opponents
      .map(o => {
        const isLocked = this.player.smv < o.reqSMV;
        return { ...o, isLocked };
      })
      .sort((a, b) => a.reqSMV - b.reqSMV);
  }

  // Initialize a battle
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

    // Compile deck based on player stats
    this.buildDeck();
    this.drawHand(4);
    
    this.logCallback(`Encounter started: vs ${opp.name}. Opponent Skepticism: ${opp.skepticism}. Your Confidence: ${this.playerConfidence}%`, 'action');
    return true;
  }

  // BLOCK — spend 1 energy to reduce incoming damage by 50%
  block() {
    if (this.isOver || this.energy < 1) return false;
    this.energy -= 1;
    this.isBlocking = true;
    this.logCallback("🛡️ You brace for impact! Damage reduced by 50% this turn.", "success");
    return true;
  }

  // ULTIMATE — unleash at max momentum
  useUltimate() {
    if (this.isOver || this.momentum < this.maxMomentum) return false;
    this.momentum = 0;
    const p = this.player;
    const bestStat = Math.max(p.smv * 10, p.confidence, p.style * 0.8, p.frame * 0.8, p.rizz * 0.9);
    const dmg = Math.floor(40 + bestStat * 0.5);
    this.damageOpponent(dmg);
    this.logCallback(`💥 ULTIMATE! You unleash your full potential for ${dmg} damage!`, "success");
    if (this.opponentSkepticism <= 0) this.resolveBattle(true);
    return dmg;
  }

  // Deck Building based on stats
  buildDeck() {
    const cardPool = [];

    // 1. BASE CARDS (Always available)
    cardPool.push({
      name: 'Nice Personality',
      desc: 'Talk about your passions. Low effect.',
      cost: 1,
      power: 10,
      effect: (b) => { b.damageOpponent(10); },
      emoji: '💬'
    });

    cardPool.push({
      name: 'Max Cope',
      desc: 'Rationalize that appearance is temporary. Heal confidence.',
      cost: 1,
      power: 18,
      effect: (b) => { b.healPlayer(18); },
      emoji: '🧠'
    });

    // 2. HEIGHT-BASED CARDS
    if (this.player.height >= 72) { // 6'0"+
      cardPool.push({
        name: 'Loom Over',
        desc: 'Stand tall. Height intimidation.',
        cost: 2,
        power: 28,
        effect: (b) => { b.damageOpponent(28); },
        emoji: '🦒'
      });
    } else if (this.player.height <= 66) { // Short king
      cardPool.push({
        name: 'Short King Energy',
        desc: 'Display extreme confidence despite vertical limits.',
        cost: 1,
        power: 15,
        effect: (b) => { b.damageOpponent(15); b.healPlayer(5); },
        emoji: '👑'
      });
    }

    // 3. JAW-BASED CARDS
    if (this.player.jaw === 'Chiseled' || this.player.jaw === 'Sharp') {
      cardPool.push({
        name: 'Jawline Flash',
        desc: 'Angle face so shadow cuts like a knife.',
        cost: 2,
        power: 32,
        effect: (b) => {
          let dmg = 32;
          if (b.lastCardPlayed === 'Nice Personality' || b.lastCardPlayed === 'Retinol Radiance') {
            dmg *= 2;
            b.logCallback("✨ COMBO: 'Model Look' triggered! Double damage!", "success");
          }
          b.damageOpponent(dmg);
        },
        emoji: '📐'
      });
    }

    // 4. CANTHAL TILT CARDS
    if (this.player.tilt === 'Positive') {
      cardPool.push({
        name: 'Hunter Eye Lock',
        desc: 'Lock eyes with positive canthal tilt dominance.',
        cost: 2,
        power: 22,
        effect: (b) => { b.damageOpponent(22); b.opponentDialog = b.opponent.dialogs.hit; },
        emoji: '👁️'
      });
    }

    // 5. SKIN CARDS
    if (this.player.skin >= 75) {
      cardPool.push({
        name: 'Retinol Radiance',
        desc: 'Blind them with clear skin reflectiveness.',
        cost: 1,
        power: 14,
        effect: (b) => { b.damageOpponent(14); },
        emoji: '✨'
      });
    }

    // 6. FRAME CARDS
    if (this.player.frame >= 70) {
      cardPool.push({
        name: 'Frame Flex',
        desc: 'Widen shoulders. Block next opponent attack value.',
        cost: 2,
        power: 15,
        effect: (b) => {
          let dmg = 15;
          let heal = 10;
          if (b.lastCardPlayed === 'Drip Overload') {
            dmg *= 2; heal += 10;
            b.logCallback("💪 COMBO: 'Sigma Grind' triggered! Double damage + extra heal!", "success");
          }
          b.damageOpponent(dmg); b.healPlayer(heal);
        },
        emoji: '🛡️'
      });
    }

    // 7. WEALTH / STYLE CARDS
    if (this.player.cash >= 1500) {
      cardPool.push({
        name: 'Wallet Flash',
        desc: 'Flash designer logo or keys. High damage.',
        cost: 2,
        power: 25,
        effect: (b) => { b.damageOpponent(25); },
        emoji: '💳'
      });
    }

    if (this.player.style >= 70) {
      cardPool.push({
        name: 'Drip Overload',
        desc: 'Aesthetic presence. Overwhelms defenses.',
        cost: 2,
        power: 26,
        effect: (b) => { b.damageOpponent(26); },
        emoji: '🧥'
      });
    }

    // 8. RIZZ-BASED CARDS
    if (this.player.rizz >= 60) {
      cardPool.push({
        name: 'Rizz Flash',
        desc: 'Turn on the charm. Smooth talking.',
        cost: 1,
        power: 18,
        effect: (b) => { b.damageOpponent(18); b.healPlayer(8); },
        emoji: '🔥'
      });
    }

    if (this.player.rizz >= 80) {
      cardPool.push({
        name: 'Charisma Overload',
        desc: 'Overwhelming presence. High damage.',
        cost: 2,
        power: 30,
        effect: (b) => {
          let dmg = 30;
          if (b.lastCardPlayed === 'Rizz Flash') {
            dmg *= 2;
            b.logCallback("🔥 COMBO: 'Charisma Cascade' triggered! Double damage!", "success");
          }
          b.damageOpponent(dmg);
        },
        emoji: '✨'
      });
    }

    // 9. CAREER-BASED CARDS
    const careerRank = ['unemployed','entry','junior','mid','senior','manager','director','executive','ceo'].indexOf(this.player.careerTier);
    if (careerRank >= 4) {
      cardPool.push({
        name: 'Power Move',
        desc: 'Call in professional favors. Devastating.',
        cost: 2,
        power: 24 + careerRank * 2,
        effect: (b) => {
          const dmg = 24 + careerRank * 2;
          b.damageOpponent(dmg);
        },
        emoji: '💼'
      });
    }

    // 10. TIKTOK / SOCIAL MEDIA CARDS
    if (this.player.hasInfluencerCard) {
      cardPool.push({
        name: 'Influencer Aura',
        desc: 'Unleash social media clout. High damage and heal.',
        cost: 2,
        power: 30,
        effect: (b) => {
          let dmg = 30;
          let heal = 20;
          if (b.lastCardPlayed === 'Power Move') {
            dmg = 50; heal = 30;
            b.logCallback("💼 COMBO: 'Power Executive' triggered! Devastating damage!", "success");
          }
          b.damageOpponent(dmg);
          b.healPlayer(heal);
        },
        emoji: '🤳'
      });
    }

    // 11. SYMMETRY-BASED CARDS
    if (this.player.symmetry === 'Symmetrical') {
      cardPool.push({
        name: 'Symmetry Flex',
        desc: 'Perfectly balanced features disorient the opponent.',
        cost: 2,
        power: 28,
        effect: (b) => {
          let dmg = 28;
          if (b.lastCardPlayed === 'Frame Flex') {
            dmg *= 2;
            b.logCallback("⚖️ COMBO: 'Perfect Storm' triggered! Double damage!", "success");
          }
          b.damageOpponent(dmg);
        },
        emoji: '⚖️'
      });
    }

    // 12. EARLY CAREER CARD
    const careerIdx = ['unemployed','entry','junior','mid','senior','manager','director','executive','ceo'].indexOf(this.player.careerTier);
    if (careerIdx >= 2) {
      cardPool.push({
        name: 'Career Dominance',
        desc: 'Use your professional success as leverage.',
        cost: 2,
        power: 20 + careerIdx * 2,
        effect: (b) => {
          const dmg = 20 + careerIdx * 2;
          let heal = 5;
          if (b.lastCardPlayed === 'Wallet Flash') {
            heal += 10;
            b.logCallback("💎 COMBO: 'High Roller' triggered! Extra heal!", "success");
          }
          b.damageOpponent(dmg);
          b.healPlayer(heal);
        },
        emoji: '📊'
      });
    }

    // Fill deck and shuffle
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
      if (this.deck.length === 0) {
        this.buildDeck(); // replenish deck
      }
      this.playerHand.push(this.deck.pop());
    }
  }

  // PLAY CARD
  playCard(cardIndex) {
    if (this.isOver || cardIndex < 0 || cardIndex >= this.playerHand.length) return false;
    const card = this.playerHand[cardIndex];

    if (this.energy < card.cost) {
      this.logCallback("Not enough turn energy!", "error");
      return false;
    }

    this.energy -= card.cost;
    this.lastPlayedCardCost = card.cost;
    this.cardsPlayedThisTurn++;
    card.effect(this);
    
    // Remove card from hand
    this.playerHand.splice(cardIndex, 1);
    this.logCallback(`You played [${card.name}] for ${card.cost} Energy!`, "success");
    
    // Update combo tracker
    this.lastCardPlayed = card.name;

    // Momentum: +1 per card played
    this.momentum = Math.min(this.maxMomentum, this.momentum + 1);

    // Passive: Grindset — heals 5 skepticism on 2-cost card
    if (this.opponent.id === 'chad_gym_bro' && card.cost === 2) {
      this.opponentSkepticism = Math.min(this.opponentMaxSkepticism, this.opponentSkepticism + 5);
      this.logCallback("💪 Grindset: Opponent heals 5 Skepticism from your high-effort play!", "event");
    }

    // Passive: Swipe Fatigue — each card heals 3 skepticism
    if (this.opponent.id === 'clav_influencer') {
      this.opponentSkepticism = Math.min(this.opponentMaxSkepticism, this.opponentSkepticism + 3);
      this.logCallback("📱 Swipe Fatigue: Opponent regenerates 3 Skepticism!", "event");
    }

    // Check Win
    if (this.opponentSkepticism <= 0) {
      this.resolveBattle(true);
    }

    return true;
  }

  damageOpponent(val) {
    let modified = val;

    // Passive: High Standards — 1-cost cards deal 40% less
    if (this.opponent.id === 'stacy_tinder' && this.lastPlayedCardCost === 1) {
      modified = Math.floor(modified * 0.6);
    }

    // Passive: Velvet Rope — first card per turn deals 30% less
    if (this.opponent.id === 'vip_bouncer' && this.cardsPlayedThisTurn <= 1) {
      modified = Math.floor(modified * 0.7);
    }

    // Passive: Clinical Eye — all card damage reduced by 15%
    if (this.opponent.id === 'plastic_surgeon') {
      modified = Math.floor(modified * 0.85);
    }

    this.opponentSkepticism = Math.max(0, this.opponentSkepticism - modified);
    this.opponentDialog = this.opponent.dialogs.hit;

    // Phase 2 check: at 50% HP
    if (this.phase === 1 && this.opponentSkepticism <= this.opponentMaxSkepticism * 0.5) {
      this.phase = 2;
      this.opponentDialog = this.opponent.dialogs.phase2 || "You're pushing me too far!";
      this.logCallback(`⚠️ ${this.opponent.name} enters PHASE 2! Attacks intensified!`, "error");
    }
  }

  healPlayer(val) {
    let modified = val;
    // Passive: Report Spam — healing 30% less effective
    if (this.opponent.id === 'social_media_manager') {
      modified = Math.floor(modified * 0.7);
    }
    this.playerConfidence = Math.min(100, this.playerConfidence + modified);
  }

  // END TURN
  endTurn() {
    if (this.isOver) return;

    // Opponent turn: Attack Player Confidence
    let baseAttack = this.opponent.id === 'forum_admin' ? 30 :
                     this.opponent.id === 'brad_boss' ? 24 :
                     this.opponent.id === 'ceo_interviewer' ? 22 : 
                     this.opponent.id === 'plastic_surgeon' ? 25 :
                     this.opponent.id === 'stacy_tinder' ? 18 : 
                     this.opponent.id === 'tiktok_rat' ? 20 :
                     this.opponent.id === 'chad_gym_bro' ? 14 :
                     this.opponent.id === 'ex_partner' ? 20 :
                     this.opponent.id === 'social_media_manager' ? 12 : 10;
    
    // Phase 2: 1.5x attack
    if (this.phase === 2) baseAttack = Math.floor(baseAttack * 1.5);

    // Passive: Mean Streak — +5 if player confidence > 60
    if (this.opponent.id === 'hs_bully' && this.playerConfidence > 60) baseAttack += 5;

    // Passive: Power Play — every 3 turns, +10 damage
    if (this.opponent.id === 'ceo_interviewer' && this.turn % 3 === 0) baseAttack += 10;

    // Passive: Quarterly Review — +8 on even turns
    if (this.opponent.id === 'brad_boss' && this.turn % 2 === 0) baseAttack += 8;

    // Passive: Permaban — cumulative rage
    if (this.opponent.id === 'forum_admin') {
      this.opponentRage++;
      baseAttack += this.opponentRage * 4;
    }

    // Passive: Emotional Damage — +6 if player confidence < 40
    if (this.opponent.id === 'ex_partner' && this.playerConfidence < 40) baseAttack += 6;

    const damage = Math.floor(baseAttack * (0.8 + Math.random() * 0.4));

    // Block: reduce damage by 50%
    let finalDamage = damage;
    if (this.isBlocking) {
      finalDamage = Math.floor(finalDamage * 0.5);
      this.logCallback(`🛡️ Block absorbed ${damage - finalDamage} damage!`, "success");
      this.isBlocking = false;
    }

    this.playerConfidence = Math.max(0, this.playerConfidence - finalDamage);
    this.opponentDialog = this.opponent.dialogs.attack;
    
    this.lastCardPlayed = null; // Reset combo tracker on turn transition

    this.logCallback(`${this.opponent.name} insults you: "${this.opponentDialog}" (-${finalDamage}% Confidence)`, "event");

    // Check Loss
    if (this.playerConfidence <= 0) {
      this.resolveBattle(false);
      return;
    }

    // Reset Turn
    this.energy = this.maxEnergy;
    this.turn++;
    this.cardsPlayedThisTurn = 0;
    this.drawHand(4);

    // Passive: Shadow Ban — randomly discard 1 card
    if (this.opponent.id === 'tiktok_rat' && this.playerHand.length > 0) {
      const removeIdx = Math.floor(Math.random() * this.playerHand.length);
      const removed = this.playerHand.splice(removeIdx, 1)[0];
      this.logCallback(`🤖 Shadow Ban: "${removed.name}" was randomly removed from your hand!`, "error");
    }

    this.logCallback(`Turn ${this.turn} started. Hand replenished.`, "system");
  }

  // CONCLUDE BATTLE
  resolveBattle(isWin) {
    this.isOver = true;
    this.active = false;

    if (isWin) {
      this.outcome = 'win';
      this.opponentDialog = this.opponent.dialogs.defeat;
      
      // Apply Rewards
      const rew = this.opponent.rewards;
      this.player.cash += rew.cash || 0;
      this.player.confidence = Math.min(100, this.player.confidence + (rew.confidence || 0));
      if (rew.style) this.player.style = Math.min(100, this.player.style + rew.style);
      if (rew.frame) this.player.frame = Math.min(100, this.player.frame + rew.frame);
      if (rew.datingScore) this.player.datingScore += rew.datingScore;
      if (rew.partner) {
        this.player.hasDatingPartner = true;
        this.player.partnerName = rew.partner;
      }

      this.player.opponentsDefeated.push(this.opponent.id);
      this.player.updateSMV();

      this.logCallback(`VICTORY! ${rew.log}`, "success");
    } else {
      this.outcome = 'lose';
      this.opponentDialog = this.opponent.dialogs.victory;
      
      // Apply Penalties
      this.player.confidence = 10; // confidence crushed
      this.player.cash = Math.max(0, this.player.cash - 150); // lost wallet/shame costs
      this.player.updateSMV();

      // "Impossible" difficulty defeat = death from social humiliation
      if (this.opponent.difficulty === 'Impossible') {
        this.player.isDead = true;
        this.player.log.push(`FATAL: Mogged to death by ${this.opponent.name}.`);
        this.logCallback(`💀 FATAL: ${this.opponent.name} destroyed your will to live. You have been mogged to death.`, "error");
      }

      this.logCallback(`DEFEAT! ${this.opponent.name} crushed your social confidence. Cash and mental stats penalized.`, "error");
    }
  }
}
