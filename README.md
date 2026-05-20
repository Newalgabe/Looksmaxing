# "ROLL THE DICE" — Genetic Lottery Roguelite

An interactive, dark-comedy, turn-based roguelite web game. You are born with random genetics, and you must navigate life from age 18 to 50 to maximize your looks, wealth, and social status. Grind actions, swipe on dating apps, battle NPCs, survive events, and face the final forum roast.

---

## 🎲 Core Gameplay Loop

1. **Difficulty & Gender Choice:** Pick Normal or Hard mode, then choose **Male**, **Female**, or **Random** gender.
2. **Genetic Lottery:** Roll your starting stats — Height, Jaw, Hairline (Norwood/Ludwig), Canthal tilt, Symmetry, Skin, Frame. These determine your base **PSL Rating (1.0 - 8.0)** and Social Tier (Truecel/Femcel → GigaChad/Stacy).
3. **Yearly Actions (Ages 18-50):** Spend 10 AP each year on Work, Gym, Skincare, Styling, TikTok, Career Promotion, Substances, Talent Tree points, Surgeries, Procreation, or Mirror Staring.
4. **Random Events + Seasonal Events + Midlife Crises:** Each year triggers a random event. Seasonal events happen at specific ages (New Year, Summer, Halloween, Christmas, Valentine's). Midlife crises hit 35-50.
5. **Talent Tree:** Earn 1 point per year. Unlock ranks in Social Butterfly (+Rizz), Gym Rat (+15% Frame/rank), Skin Whisperer (+15% Skin/rank), Fashion Icon (+20% Style/rank), Charisma (+10% Confidence/rank), Surgeon Savvy (-10% risk/rank).
6. **Substance System:** Buy Creatine, Pre-Workout, Finasteride, Accutane, Steroids, or Ozempic. Each has cash costs, risk/reward, and addiction tracking. High addiction risks overdose death.
7. **Gender-Specific Surgeries:** Limb Lengthening/BBL, Jaw Implants/V-Line, FUE Hair Transplant/Hairline Lowering, Canthoplasty. Three clinic tiers (Turkey budget, Local, Beverly Hills premium) with varying cost/risk.
8. **TikTok Studio:** Post 4 content styles (Jaw Flex, Retinol Glaze, Height Flex, Cope Meme). Gain followers, cash, confidence — or get roasted.
9. **Social Card Battles:** Turn-based battles against 10 opponents. Cards unlocked by your stats. Combo system (Model Look, Sigma Grind, Charisma Cascade, Power Executive). Losing to Impossible difficulty = death.
10. **Dating App ("swipeMax"):** Swipe profiles, match based on SMV, chat with choices, unlock partners for procreation.
11. **Mirror Staring Minigame:** Free action — stare without blinking for confidence/rizz rewards up to 30s.
12. **Interactive Forum Roast:** At run end, see your stats rated on a mock looksmaxing forum with interactive cope replies.
13. **Death Causes:** Surgery botch (10-40% fatality), steroid overdose, high-addiction overdose, depression suicide (3 years at ≤5 confidence), battle death (Impossible difficulty loss), or natural end at age 50.

---

## 💎 Roguelite Meta-Progression

- **Cope Tokens:** Earned at run end (SMV×15 + botched×10 + achievements×5). Spent on:
  - **Permanent Perks:** High Metabolism, Good Donor Area, Rich Uncle, Symmetrical Genes.
  - **Cosmetic Themes:** Stacy Magenta, Obsidian Incel, Beverly Hills Emerald, Turkey Neon.
- **Genetic Memories Gallery:** Last 10 runs saved with full avatar snapshots.
- **13 Achievements:** Born, Cash King, GigaChad, Truecel, TikTok Famous, Knife Magnet, Heartbreaker, Ultimate Mogger, CEO Grindset, Natural Beauty, Substance Abuser, Elder, Rizz God.
- **Leaderboard:** Top 10 scores saved locally.
- **Save/Load:** 3 save slots with anti-cheat checksums.
- **Lineage:** Have children who inherit weighted parent stats.

---

## 🧠 Features

- **Difficulty Modes:** Normal (10 AP, standard aging) / Hard (8 AP, harsher aging, higher expenses).
- **Dynamic Avatar:** Canvas-rendered portrait with realistic shading, 5 jaw shapes, canthal tilt, Norwood/Ludwig hair, skin quality (acne → glowing), outfits (ripped → suit), accessories, botch scars, blinking animation.
- **BGM:** 4 pre-recorded MP3 tracks (genesis, gameboard, battle, gameover) with volume slider.
- **SFX:** Web Audio API synthesized sound effects.
- **Anti-Cheat:** Property clamping, computed SMV getter, checksummed saves and cope tokens, state validation on every action.
- **Responsive Layout:** Desktop multi-column and mobile-friendly layouts.

---

## 🚀 Getting Started Locally

To launch the game on your local computer:

1. Clone or download this project.
2. Install development tools (Vite is configured for compiling ES6 modules):
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```
4. Open the generated local URL (e.g. `http://localhost:5173`) in your browser.

---

## ☁️ Deploying to Vercel

Vercel has native support for Vite projects and will deploy this app automatically:

1. Push this folder to a repository on **GitHub**, **GitLab**, or **Bitbucket** (ensure `.gitignore` excludes `node_modules/` and `dist/`).
2. Log into your [Vercel Dashboard](https://vercel.com).
3. Click **Add New** > **Project** and import your repository.
4. Vercel automatically detects **Vite** as the framework preset and populates these settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**. Your live game link will be generated in less than a minute!
