/**
 * forum.js
 * Generates mock looksmaxing forum comments based on the final biometric stats
 * and achievements of the player. Generates dark comedy parody reactions.
 */

const USERNAMES = [
  'Copemaxxer99', 'JawlineLord', 'NorwoodSlayer', 'BonesAreLaw', 'GigaCope', 
  'ShortKingGiga', 'TurkeyPlugsPro', 'TinderSurfer', 'CraniumSizeGuy', 'ClavicleFlexer'
];

const RANKS = ['Coping Incel', 'Junior Maxxer', 'Senior Coperson', 'Elite Surgeon Ally', 'Ascended Deity', 'Truecel Veteran'];

export function generateForumThread(player) {
  const threadTitle = generateThreadTitle(player);
  const posts = [];

  // Post 1: The player's opening post
  posts.push({
    username: player.name.replace(/\s+/g, '') + '99',
    rank: player.smv >= 8.5 ? 'Ascended Giga' : player.smv < 3.5 ? 'Coping Incel' : 'Junior Maxxer',
    avatar: player.smv >= 8.5 ? '👑' : player.smv < 3.5 ? '😭' : '😐',
    userStats: { joined: '2023', posts: '1,420', rep: player.smv >= 8.5 ? '+890' : '-120' },
    content: generateOpeningPost(player),
    date: 'Today, 22:15'
  });

  // Post 2: Standard forum reply on height/jaw
  posts.push({
    username: 'BonesAreLaw',
    rank: 'Truecel Veteran',
    avatar: '💀',
    userStats: { joined: '2020', posts: '12,940', rep: '+12,300' },
    content: generateBoneReply(player),
    date: 'Today, 22:18'
  });

  // Post 3: Comment on surgeries
  if (player.surgeryBotchedCount > 0 || player.opponentsDefeated.length > 0) {
    posts.push({
      username: 'TurkeyPlugsPro',
      rank: 'Elite Surgeon Ally',
      avatar: '💉',
      userStats: { joined: '2022', posts: '3,840', rep: '+590' },
      content: generateSurgeryReply(player),
      date: 'Today, 22:21'
    });
  }

  // Post 4: Comment on dating status
  posts.push({
    username: 'TinderSurfer',
    rank: 'Senior Coperson',
    avatar: '📱',
    userStats: { joined: '2024', posts: '940', rep: '+110' },
    content: generateDatingReply(player),
    date: 'Today, 22:25'
  });

  // Post 5: Final roast summary
  posts.push({
    username: 'JawlineLord',
    rank: 'Ascended Deity',
    avatar: '🗿',
    userStats: { joined: '2021', posts: '9,480', rep: '+18,490' },
    content: generateFinalRoast(player),
    date: 'Today, 22:30'
  });

  return {
    title: threadTitle,
    author: posts[0].username,
    posts: posts
  };
}

function generateThreadTitle(player) {
  const isFemale = player.gender === 'female';
  const ft = Math.floor(player.height / 12);
  const inch = player.height % 12;
  const heightStr = `${ft}'${inch}"`;
  const hairLabel = isFemale ? `Ludwig ${player.hairline}` : `Norwood ${player.hairline}`;

  if (player.isDead) {
    return isFemale
      ? `RIP to member "${player.name}" - Botched BBL/V-Line exit.`
      : `RIP to member "${player.name}" - Botched leg lengthening exit.`;
  }

  if (player.smv >= 8.5) {
    const tier = isFemale ? 'GigaStacy' : 'GigaChad';
    return `Ascended at 30: ${heightStr} / ${player.jaw} Jaw / ${hairLabel} ${tier}. Rate my SMV.`;
  }
  
  if (player.smv < 3.5) {
    const frameTerm = isFemale ? 'linebacker frame' : 'framelet';
    return `It is over. ${heightStr} ${hairLabel} ${frameTerm}. Max coped but got roasted.`;
  }

  if (player.surgeryBotchedCount >= 2) {
    return `Botched run. Turkey surgery ruined my jaw and symmetry. How to cope?`;
  }

  return `Rate my ${player.age}-year-old build. ${heightStr} / ${hairLabel} / SMV ${player.smv} Normie.`;
}

function generateOpeningPost(player) {
  const isFemale = player.gender === 'female';
  const ft = Math.floor(player.height / 12);
  const inch = player.height % 12;
  const hairLabel = isFemale ? `Ludwig ${player.hairline}` : `Norwood ${player.hairline}`;
  
  let frameDesc = '';
  if (isFemale) {
    frameDesc = player.frame > 75 ? 'Wide Linebacker Frame' : player.frame > 40 ? 'Average proportions' : 'Petite Model Frame';
  } else {
    frameDesc = player.frame > 75 ? 'Broad Giga' : player.frame > 40 ? 'Average' : 'Narrow Framelet';
  }
  
  let intro = `Just hit age ${player.age}. Started life with average genetics but tried to max out what I could. Here is my clinical stats breakdown:
  <br/><br/>
  <strong>Biometrics:</strong><br/>
  - Height: ${ft}'${inch}" (${Math.round(player.height * 2.54)} cm)<br/>
  - Jaw Definition: ${player.jaw}<br/>
  - Canthal Tilt: ${player.tilt}<br/>
  - Hairline: ${hairLabel}<br/>
  - Frame / Build: ${frameDesc}<br/>
  - Cash Assets: $${player.cash}<br/>
  `;

  if (player.hasDatingPartner) {
    intro += `- Dating Status: Dating ${player.partnerName}<br/>`;
  } else {
    intro += `- Dating Status: Eternal Single (Swipe rate was abysmal)<br/>`;
  }

  if (player.surgeryBotchedCount > 0) {
    intro += `- Surgical History: Botched ${player.surgeryBotchedCount} times.<br/>`;
  }

  intro += `<br/>Final SMV score estimated at ${player.smv}/10. Be brutal. Am I coping or did I ascend?`;
  return intro;
}

function generateBoneReply(player) {
  const isFemale = player.gender === 'female';
  if (isFemale) {
    if (player.height >= 70) {
      return `5'10+ height is runway model tier. You literally could walk into any room and command the space. High-tier model potential. Bones are law and you rolled the vertical jackpot.`;
    }
    if (player.height <= 62) {
      return `Oof, under 5'3\" at age 30 is pretty short. You are heavily dependent on facial symmetry, clear skin, and hair to escape normie status. Heels are a mandatory cope.`;
    }
    return `5'5\" height is a standard normal roll. Average frame potential. You don't get height-checked by partners, but you aren't turning heads. You are strictly dependent on your jawline and hairline to carry you.`;
  } else {
    if (player.height >= 74) {
      return `6'2+ height is absolute god-tier. You literally could roll with cystic acne and a Norwood 4 hairline and still pull normies on height alone. Bones are law and you rolled the vertical jackpot. Giga-tier frame potential.`;
    }
    if (player.height <= 66) {
      return `Oof, under 5'7\" at age 30 is brutal. No amount of skincare or trendy haircuts can fix vertical limits. Height is the primary multiplier. Even with a chiseled jaw, you're looking at a short king build. Absolute cope, but respect the hustle.`;
    }
    return `5'9\" height is a standard normal roll. Average frame potential. You don't get height-checked at the door, but you aren't turning heads. You are strictly dependent on your jawline and hairline to carry you.`;
  }
}

function generateSurgeryReply(player) {
  const isFemale = player.gender === 'female';
  if (player.isDead) {
    return isFemale
      ? `Sister contracted severe sepsis from a budget BBL. That is the blackest pill of all. RIP. Do not get cheap cosmetic surgery.`
      : `Bro contracted osteomyelitis from leg lengthening. That is the blackest pill of all. RIP. Do not get budget bone shattering.`;
  }

  if (player.surgeryBotchedCount >= 2) {
    return isFemale
      ? `Sis got standard budget Turkey surgeries. Complete botchfest. Your face looks like an asymmetrical abstract painting and your hairline lowering scarred. This is why you save cash and go to Beverly Hills. Absolute pilates-coping from here on.`
      : `Bro got standard budget Turkey surgeries. Complete botchfest. Your face looks like an asymmetrical abstract painting. This is why you save cash and go to Beverly Hills. Absolute gym-coping from here on.`;
  }

  if (player.opponentsDefeated.includes('ceo_interviewer')) {
    return `Ascended career-maxxing. You actually passed the VC interviewer. Mrs. Sterling normally ignores anyone below a 7/10. Cash stack is massive, you can fund a whole Beverly Hills overhaul now.`;
  }

  if (player.surgeryBotchedCount > 0) {
    return `That botched surgery ruined your SMV trajectory. Should have stuck to natural styling instead of letting some budget surgeon play Lego with your bone structures.`;
  }

  return `Smart run. No sketchy bones surgeries, just natural styling and skin-maxxing. Slow, stable grind. A clean 6/10 build.`;
}

function generateDatingReply(player) {
  const isFemale = player.gender === 'female';
  if (player.hasDatingPartner) {
    if (player.partnerName === 'Stacy' || player.partnerName === 'Chad') {
      const topTierPartner = isFemale ? 'Chad' : 'Stacy';
      const oppositeGender = isFemale ? 'Chad' : 'Stacy';
      const requirementsText = isFemale ? "an 8/10 Stacy" : "a 6'2\" positive canthal tilt Chad";
      return `Wait... you actually matched and locked down ${topTierPartner}? That's a massive anomaly. Your SMV must have been high-tier to bypass their filters. ${oppositeGender} normally filters out anything below ${requirementsText}. Huge win.`;
    }
    if (player.partnerName === 'Gertrude' || player.partnerName === 'Richard') {
      const sugarName = player.partnerName;
      return `Bro/Sis matched with ${sugarName} for the $5k cash injection! 💀💀 Absolute desperation-maxx. Your confidence is in the gutter, but that wallet is heavy. Did you buy a new hairline with their money?`;
    }
    return `Matched and dating ${player.partnerName}. Decent normie ascension. Better than 99% of this forum who just post rate threads all day.`;
  }

  return `Zero dating matches. Brutally typical. Tinder swipe matching is mathematically impossible unless you gold-max. Tinder is a simulator of genetic despair.`;
}

function generateFinalRoast(player) {
  const isFemale = player.gender === 'female';
  if (player.smv >= 8.5) {
    const tier = isFemale ? 'Stacy' : 'Chad';
    return `Final Rating: 9/10 ${tier}. Ascended. You won the genetic lottery and styled it perfectly. Go leave this forum and live life, you don't belong here anymore.`;
  }
  if (player.smv >= 6.5) {
    const liteTier = isFemale ? 'Stacy-lite' : 'chadlite';
    return `Final Rating: 7/10 HTN (High Tier Normal). Decent build, respectable jaw, style carried. You are a couple of skincare steps away from ${liteTier}. Good run.`;
  }
  if (player.smv >= 4.5) {
    return `Final Rating: 5/10 Normie. The definition of average. You did not break the game, but you survived without ending up on a wheelchair. Go buy some lifts/makeup and keep lifting.`;
  }
  
  const failTier = isFemale ? 'Femcel' : 'Truecel';
  const hairLabel = isFemale ? `Ludwig 3` : `Norwood 6`;
  const frameTerm = isFemale ? `linebacker frame` : `short king`;
  return `Final Rating: 2/10 ${failTier}. ${hairLabel} hairline, receding jaw, ${frameTerm}. Over. Lay down and rot.`;
}

export function getCopingReplies(player) {
  const isFemale = player.gender === 'female';
  const choices = [
    {
      id: 'height_cope',
      text: isFemale ? "I'm literally 5'8 guys, bad camera angle and I wasn't in heels!" : "I'm literally 6'3 guys, it's just a bad camera angle!",
      unlocked: isFemale ? player.height >= 67 : player.height >= 72
    },
    {
      id: 'mom_cope',
      text: "My mom says I'm handsome, you guys are just toxic.",
      unlocked: true
    },
    {
      id: 'rot_cope',
      text: "It's over. I am going to lay down and rot.",
      unlocked: player.smv < 5.0
    },
    {
      id: 'flex_cope',
      text: `I have $${player.cash.toLocaleString()} cash ${player.hasDatingPartner ? `and dating ${player.partnerName}` : ''}, stay mad.`,
      unlocked: player.cash >= 3000 || player.hasDatingPartner
    }
  ];
  return choices.filter(c => c.unlocked);
}

export function generateForumResponse(choiceId, player) {
  const isFemale = player.gender === 'female';
  const responses = {
    height_cope: [
      {
        username: 'BonesAreLaw',
        rank: 'Truecel Veteran',
        avatar: '💀',
        content: isFemale 
          ? `Copemeister extreme. Height doesn't change your skull structure or receding jaw. Even if you're 5'8, you're just a lanky linebacker frame with no presence. Post eye-level photos or ban.`
          : `Copemeister extreme. Height doesn't change your skull structure or receding jaw. Even if you're 6'3, you're just a lanky framelet with no presence. Post eye-level photos or ban.`,
      },
      {
        username: 'GigaCope',
        rank: 'Senior Coperson',
        avatar: '😐',
        content: isFemale
          ? `Sure sis, and I'm 5'11 with runway hips. Put the tape measure against the wall or keep coping. 💀`
          : `Sure bro, and I'm 6'8 with hunter eyes. Put the tape measure against the wall or keep coping. 💀`,
      }
    ],
    mom_cope: [
      {
        username: 'JawlineLord',
        rank: 'Ascended Deity',
        avatar: '🗿',
        content: `MOM COPE IS THE ULTIMATE COPE! 💀 "My special boy/girl" tier coping. Your mom is biologically programmed to ignore your negative canthal tilt. Post your rating from an objective AI/looksmaxing site instead.`,
      },
      {
        username: 'NorwoodSlayer',
        rank: 'Truecel Veteran',
        avatar: '😭',
        content: isFemale
          ? `Lmao my mom said the same thing until she paid for my Turkey nose job and filler. Real talk, ignore your mother's lies. Lay down and rot.`
          : `Lmao my mom said the same thing until she paid for my Turkey hair plugs. Real talk, ignore your mother's lies. Lay down and rot.`,
      }
    ],
    rot_cope: [
      {
        username: 'BonesAreLaw',
        rank: 'Truecel Veteran',
        avatar: '💀',
        content: `Based pill. Welcome to the LDAR (Lay Down And Rot) club. Acceptance is the first step. Get a gaming PC and forget about the genetic market. It's over.`,
      },
      {
        username: 'ShortKingGiga',
        rank: 'Coping Incel',
        avatar: '😭',
        content: isFemale
          ? `At least you tried, sister. I've been rotting since Ludwig 2 hit me at age 21. See you in the gaming lobbies.`
          : `At least you tried, brother. I've been rotting since Norwood 3 hit me at age 21. See you in the gaming lobbies.`,
      }
    ],
    flex_cope: [
      {
        username: 'GigaCope',
        rank: 'Senior Coperson',
        avatar: '😐',
        content: `Imagine bragging about your wallet on looksmaxing.org. We don't care about paper, we care about jaw angles. But honestly, congrats on the cash stack, go pay for custom chin bones.`,
      },
      {
        username: 'TurkeyPlugsPro',
        rank: 'Elite Surgeon Ally',
        avatar: '💉',
        content: isFemale
          ? `Sis managed to escape the incel tier by wage-maxxing. Respect. Now use that cash to fly to Beverly Hills and fix that hair/jaw. You have the raw materials (money) to buy genetics now!`
          : `Bro managed to escape the incel tier by wage-maxxing. Respect. Now use that cash to fly to Beverly Hills and fix that hair/jaw. You have the raw materials (money) to buy genetics now!`,
      }
    ]
  };
  
  const list = responses[choiceId] || [];
  const selected = list[Math.floor(Math.random() * list.length)];
  
  return {
    ...selected,
    userStats: { joined: '2022', posts: '4,510', rep: '+980' },
    date: 'Just now'
  };
}
