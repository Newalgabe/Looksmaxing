/**
 * game.js
 * Manages the core game state, genetics rolls, yearly action costs/benefits,
 * surgery logic ( Turkey vs. Beverly Hills ), random events, and SMV rating calculation.
 */

// Genetic option tables
export const JAW_TYPES = ['Receding', 'Soft', 'Average', 'Sharp', 'Chiseled'];
export const TILT_TYPES = ['Negative', 'Neutral', 'Positive'];
export const SYMMETRY_TYPES = ['Asymmetrical', 'Average', 'Symmetrical'];
export const FIRST_NAMES = ['Chadwick', 'Hunter', 'Kyle', 'Cope', 'Morty', 'Eugene', 'Bartholomew', 'Daxx', 'Brayson', 'Maximilian'];
export const LAST_NAMES = ['Maxxer', 'Coperson', 'Slayer', 'Framelet', 'Incelius', 'Plugs', 'Chadson', 'Canthal', 'Norwood', 'Giga'];

export class GameState {
  constructor(activePerks = {}) {
    this.activePerks = activePerks;
    this.reset();
  }

  reset(activePerks = null) {
    if (activePerks) {
      this.activePerks = activePerks;
    }
    this.name = this.generateRandomName();
    this.age = 18;
    this.cash = (this.activePerks && this.activePerks.rich_uncle) ? 1500 : 500;
    this.ap = 10;
    
    // Genetic Lottery Roll
    this.height = this.rollHeight(); // in inches (60 to 78)
    this.jaw = this.randomElement(JAW_TYPES);
    this.tilt = this.randomElement(TILT_TYPES);
    
    if (this.activePerks && this.activePerks.symmetrical_genes) {
      const symRoll = Math.random();
      this.symmetry = symRoll < 0.60 ? 'Symmetrical' : symRoll < 0.90 ? 'Average' : 'Asymmetrical';
    } else {
      this.symmetry = this.randomElement(SYMMETRY_TYPES);
    }
    
    // Soft / Modifiable stats
    this.hairline = this.rollHairline(); // 1 to 7 (Norwood Scale)
    this.skin = this.randomRange(15, 65); // 0-100
    this.frame = this.randomRange(15, 65); // 0-100
    this.style = this.randomRange(10, 50); // 0-100
    this.confidence = this.randomRange(40, 85); // 0-100

    this.smv = 5.0;
    this.socialTier = 'NORMIE';
    this.log = [];
    this.isDead = false;
    this.surgeryBotchedCount = 0;
    
    // Milestones & accomplishments
    this.hasDatingPartner = false;
    this.partnerName = "";
    this.datingScore = 0;
    this.opponentsDefeated = [];
    
    // Botch tracking for rendering scars/visual debuffs
    this.botchedJaw = false;
    this.botchedHair = false;
    this.botchedCanthoplasty = false;
    
    this.updateSMV();
  }

  generateRandomName() {
    return `${this.randomElement(FIRST_NAMES)} ${this.randomElement(LAST_NAMES)}`;
  }

  randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  rollHeight() {
    // Height distribution: skew slightly towards 5'9" average
    const roll = Math.random();
    if (roll < 0.05) return this.randomRange(60, 63); // 5'0" - 5'3" (Short King extreme)
    if (roll < 0.25) return this.randomRange(64, 67); // 5'4" - 5'7" (Short)
    if (roll < 0.70) return this.randomRange(68, 71); // 5'8" - 5'11" (Avg)
    if (roll < 0.92) return this.randomRange(72, 74); // 6'0" - 6'2" (Tall)
    return this.randomRange(75, 78); // 6'3" - 6'6" (Giga Height)
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
   * based on bone structure, grooming, and styling modifiers.
   */
  updateSMV() {
    let score = 5.5; // Baseline

    // Height Modifier
    if (this.height >= 75) score += 2.5; // 6'3"+
    else if (this.height >= 72) score += 1.5; // 6'0"-6'2"
    else if (this.height >= 69) score += 0.0; // 5'9"-5'11"
    else if (this.height >= 66) score -= 1.2; // 5'6"-5'8"
    else score -= 2.5; // <5'6"

    // Jaw Modifier
    if (this.jaw === 'Chiseled') score += 2.5;
    else if (this.jaw === 'Sharp') score += 1.2;
    else if (this.jaw === 'Average') score += 0.0;
    else if (this.jaw === 'Soft') score -= 1.0;
    else if (this.jaw === 'Receding') score -= 2.2;

    // Canthal Tilt Modifier
    if (this.tilt === 'Positive') score += 1.2;
    else if (this.tilt === 'Negative') score -= 1.5;

    // Symmetry Modifier
    if (this.symmetry === 'Symmetrical') score += 1.0;
    else if (this.symmetry === 'Asymmetrical') score -= 1.2;

    // Hairline Modifier (Norwood scale 1-7)
    if (this.hairline === 1) score += 1.2;
    else if (this.hairline === 2) score += 0.4;
    else if (this.hairline === 3) score -= 0.2;
    else if (this.hairline === 4) score -= 1.0;
    else score -= 2.5; // Norwood 5-7

    // Skin Modifier (0-100)
    if (this.skin >= 90) score += 1.0;
    else if (this.skin >= 65) score += 0.4;
    else if (this.skin < 30) score -= 1.5; // cystic acne debuff

    // Frame Modifier (0-100)
    if (this.frame >= 80) score += 1.2;
    else if (this.frame >= 60) score += 0.5;
    else if (this.frame < 30) score -= 1.2; // narrow framelet

    // Style Modifier (0-100)
    if (this.style >= 80) score += 1.2;
    else if (this.style >= 60) score += 0.5;
    else if (this.style < 30) score -= 1.0; // homeless/poor styling

    // Botched Surgeries Penalty
    score -= (this.surgeryBotchedCount * 1.5);

    // Clamp score
    this.smv = parseFloat(Math.max(1.0, Math.min(10.0, score)).toFixed(1));

    // Social Tier Mapping
    if (this.smv >= 9.0) this.socialTier = 'GIGACHAD / ASCENDED';
    else if (this.smv >= 7.5) this.socialTier = 'CHADLITE';
    else if (this.smv >= 6.0) this.socialTier = 'HIGH TIER NORMAL';
    else if (this.smv >= 4.5) this.socialTier = 'NORMIE';
    else if (this.smv >= 3.0) this.socialTier = 'SUB-HUMAN';
    else this.socialTier = 'TRUECEL';
  }

  // ACTIONS
  doWork() {
    if (this.ap < 2) return false;
    this.ap -= 2;
    this.cash += 1500;
    // Working drains confidence slightly (grind fatigue)
    this.confidence = Math.max(0, this.confidence - 5);
    this.updateSMV();
    return {
      message: `You spent 2 AP grinding at a corporate desk job. Earned $1,500 cash, but mental fatigue set in (-5% Confidence).`,
      type: 'action'
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

  // SURGERY DETAILS
  getSurgeriesList() {
    const isCheaperHair = this.activePerks && this.activePerks.good_donor_area;
    return [
      {
        id: 'jaw_implant',
        name: 'Jaw Angle Implants',
        cost: 8000,
        desc: 'Inserts custom silicone/porcelain implants to widen and define the jaw.',
        risk: 0.12, // 12% standard failure
        effect: 'Bones: Jawline upgraded to Chiseled'
      },
      {
        id: 'leg_lengthening',
        name: 'Limb Lengthening Surgery',
        cost: 20000,
        desc: 'Breaks femurs and installs rods to slowly expand bones. Extremely painful.',
        risk: 0.18, // 18% standard failure
        effect: 'Bones: Height permanently increased by 3 inches'
      },
      {
        id: 'hair_transplant',
        name: 'FUE Hair Transplant',
        cost: isCheaperHair ? 3000 : 6000,
        desc: 'Harvests grafts from back of head to restore the hairline.',
        risk: 0.08, // 8% standard failure
        effect: 'Soft Max: Hairline permanently restored to Norwood 1'
      },
      {
        id: 'canthoplasty',
        name: 'Almond Eye Surgery (Canthoplasty)',
        cost: 5000,
        desc: 'Tightens the lower eyelid corners to change the eye slope.',
        risk: 0.10, // 10% standard failure
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
      riskMult = 2.5; // Shady clinic has 2.5x standard failure rate
      clinicName = "a budget clinic in Istanbul, Turkey";
    } else if (clinicTier === 'beverly') {
      costMult = 2.0;
      riskMult = 0.15; // Elite clinic reduces risk by 85%
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
        this.skin = Math.max(0, this.skin - 20); // nerve scarring/cystic breakout
        this.botchedJaw = true;
        botchText = "The surgeon botched the jaw implants. The implant migrated, causing asymmetric nerve damage (-40% Confidence, Jaw ruined to Receding, Skin ruined).";
      } else if (surgeryId === 'leg_lengthening') {
        // Catastrophic failure: wheel-chair bound or death
        if (Math.random() < 0.4) {
          this.isDead = true;
          botchText = "CATASTROPHIC FAILURE! You contracted a severe bone infection (osteomyelitis). The surgery was fatal. Rest in Peace.";
        } else {
          this.height = Math.max(50, this.height - 4); // permanently bent/damaged legs
          this.frame = Math.max(10, this.frame - 40);
          botchText = "The leg lengthening was botched. You spent a year in agony, and the bones fused poorly. You lost height and frame, and walk with a permanent limp.";
        }
      } else if (surgeryId === 'hair_transplant') {
        this.hairline = 7; // lost all donor hair
        this.skin = Math.max(0, this.skin - 15);
        this.botchedHair = true;
        botchText = "The hair plugs failed to take. Necrosis left permanent scars on your scalp (-15 Skin, Hairline permanently Norwood 7).";
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
        successText = "Your chin is now sharp and chiseled. You look like a model.";
      } else if (surgeryId === 'leg_lengthening') {
        this.height += 3;
        successText = "Your femurs successfully healed. You stand 3 inches taller!";
      } else if (surgeryId === 'hair_transplant') {
        this.hairline = 1;
        this.botchedHair = false;
        successText = "Thick, full hair follicles successfully grafted. Norwood 1 hairline achieved.";
      } else if (surgeryId === 'canthoplasty') {
        this.tilt = 'Positive';
        this.botchedCanthoplasty = false;
        successText = "Almond-shaped, positive tilt 'hunter eyes' created.";
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
    this.ap = 10; // reset action points
    
    // Inflation / minor passive expenses
    this.cash = Math.max(0, this.cash - 100);

    // Passive aging effects on hairline & skin
    if (this.age >= 25 && Math.random() < 0.20 && this.hairline < 7) {
      this.hairline++;
      this.log.push({
        message: `Aging signs: Your temples receded slightly. Hairline degraded by 1 Norwood tier.`,
        type: 'event'
      });
    }

    this.updateSMV();

    // Trigger random event
    const event = this.triggerRandomEvent();
    return event;
  }

  triggerRandomEvent() {
    const events = [
      {
        title: "Acne Outbreak",
        desc: "Hormonal changes trigger a severe cystic breakout on your T-zone.",
        effect: (p) => { p.skin = Math.max(0, p.skin - 20); p.confidence = Math.max(0, p.confidence - 15); },
        impactText: "-20 Skin Quality, -15% Confidence",
        icon: "🚨"
      },
      {
        title: "Found a Great Barber",
        desc: "You stumble into an old-school Turkish barber who executes the perfect skin fade.",
        effect: (p) => { p.style = Math.min(100, p.style + 15); p.confidence = Math.min(100, p.confidence + 10); },
        impactText: "+15 Style, +10% Confidence",
        icon: "✂️"
      },
      {
        title: "Bad Breakup",
        desc: "Your partner laughs at your height insert inserts and leaves you for a 6'3 gym instructor.",
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
        title: "Gym Bro Mentorship",
        desc: "A giant gym instructor takes you under his wing and teaches you how to bulk properly.",
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
      }
    ];

    const ev = this.randomElement(events);
    ev.effect(this);
    this.updateSMV();
    return ev;
  }
}
