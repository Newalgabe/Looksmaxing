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
  const ft = Math.floor(player.height / 12);
  const inch = player.height % 12;
  const heightStr = `${ft}'${inch}"`;

  if (player.isDead) {
    return `RIP to member "${player.name}" - Botched leg lengthening exit.`;
  }

  if (player.smv >= 8.5) {
    return `Ascended at 30: ${heightStr} / ${player.jaw} Jaw / Norwood ${player.hairline} GigaChad. Rate my SMV.`;
  }
  
  if (player.smv < 3.5) {
    return `It is over. ${heightStr} Norwood ${player.hairline} framelet. Max coped but got roasted.`;
  }

  if (player.surgeryBotchedCount >= 2) {
    return `Botched run. Turkey surgery ruined my jaw and symmetry. How to cope?`;
  }

  return `Rate my 30-year-old build. ${heightStr} / Norwood ${player.hairline} / SMV ${player.smv} Normie.`;
}

function generateOpeningPost(player) {
  const ft = Math.floor(player.height / 12);
  const inch = player.height % 12;
  
  let intro = `Just hit age 30. Started life with average genetics but tried to max out what I could. Here is my clinical stats breakdown:
  <br/><br/>
  <strong>Biometrics:</strong><br/>
  - Height: ${ft}'${inch}" (${player.height} cm)<br/>
  - Jaw Definition: ${player.jaw}<br/>
  - Canthal Tilt: ${player.tilt}<br/>
  - Hairline: Norwood ${player.hairline}<br/>
  - Frame / Build: ${player.frame > 75 ? 'Broad Giga' : player.frame > 40 ? 'Average' : 'Narrow Framelet'}<br/>
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
  // Focuses on height and bones
  if (player.height >= 74) {
    return `6'2+ height is absolute god-tier. You literally could roll with cystic acne and a Norwood 4 hairline and still pull normies on height alone. Bones are law and you rolled the vertical jackpot. Giga-tier frame potential.`;
  }
  
  if (player.height <= 66) {
    return `Oof, under 5'7\" at age 30 is brutal. No amount of skincare or trendy haircuts can fix vertical limits. Height is the primary multiplier. Even with a chiseled jaw, you're looking at a short king build. Absolute cope, but respect the hustle.`;
  }

  return `5'9\" height is a standard normal roll. Average frame potential. You don't get height-checked at the door, but you aren't turning heads. You are strictly dependent on your jawline and hairline to carry you.`;
}

function generateSurgeryReply(player) {
  if (player.isDead) {
    return `Bro contracted osteomyelitis from leg lengthening. That is the blackest pill of all. RIP. Do not get budget bone shattering.`;
  }

  if (player.surgeryBotchedCount >= 2) {
    return `Bro got standard budget Turkey surgeries. Complete botchfest. Your face looks like an asymmetrical abstract painting. This is why you save cash and go to Beverly Hills. Absolute gym-coping from here on.`;
  }

  if (player.opponentsDefeated.includes('ceo_interviewer')) {
    return `Ascended career-maxxing. You actually passed the VC interviewer. Mr. Sterling normally ignores anyone below a 7/10. Cash stack is massive, you can fund a whole Beverly Hills overhaul now.`;
  }

  if (player.surgeryBotchedCount > 0) {
    return `That botched surgery ruined your SMV trajectory. Should have stuck to gym-maxxing instead of letting some budget surgeon play Lego with your bone structures.`;
  }

  return `Smart run. No sketchy bones surgeries, just natural gym-maxxing and styling. Slow, stable grind. A clean 6/10 build.`;
}

function generateDatingReply(player) {
  if (player.hasDatingPartner) {
    if (player.partnerName === 'Stacy') {
      return `Wait... you actually matched and locked down Stacy? That's a massive anomaly. Your SMV must have been high-tier to bypass her filters. Stacy normally filters out anything below a 6'2\" positive canthal tilt Chad. Huge win.`;
    }
    if (player.partnerName === 'Gertrude') {
      return `Bro matched with Gertrude for the $5k cash injection! 💀💀 Absolute desperation-maxx. Your confidence is in the gutter, but that wallet is heavy. Did you buy a new hairline with her money?`;
    }
    return `Matched and dating ${player.partnerName}. Decent normie ascension. Better than 99% of this forum who just post rate threads all day.`;
  }

  return `Zero dating matches. Brutally typical. If you are under 6'0\" or have a receding jaw, Tinder swipe matching is mathematically impossible unless you gold-max. Tinder is a simulator of genetic despair.`;
}

function generateFinalRoast(player) {
  if (player.smv >= 8.5) {
    return `Final Rating: 9/10 Chad. Ascended. You won the genetic lottery and styled it perfectly. Go leave this forum and live life, you don't belong here anymore.`;
  }
  if (player.smv >= 6.5) {
    return `Final Rating: 7/10 HTN (High Tier Normal). Decent build, respectable jaw, style carried. You are a couple of skincare steps away from chadlite. Good run.`;
  }
  if (player.smv >= 4.5) {
    return `Final Rating: 5/10 Normie. The definition of average. You did not break the game, but you survived without ending up on a wheelchair. Go buy some lifts and keep lifting.`;
  }
  
  return `Final Rating: 2/10 Truecel. Norwood 6 hairline, receding jaw, short king. Over. Lay down and rot.`;
}
