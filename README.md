# "ROLL THE DICE" — Genetic Lottery Roguelite

An interactive, dark-comedy, turn-based roguelite web game. You are born with random genetics, and you must navigate life from age 18 to 30 to reach the highest social tier. Maximize your stats, swipe on dating apps, survive random events, engage in social card battles, and face the final roast on a mock looksmaxing forum.

---

## 🎲 Core Gameplay Loop

1. **Gender Choice & Genetic Lottery (Birth):** Select to play as a **Male**, **Female**, or let the game pick a **Random** gender. Your stats are rolled: Height, Jaw definition, Hairline (Norwood Scale for males, Ludwig Scale for females), Canthal tilt, Skin quality, and Shoulder frame. These calculate your base **PSL Rating (1.0 - 8.0)** and starting Social Tier (Truecel/Femcel to GigaChad/Stacy).
2. **Yearly Action Grind:** Allocate 10 Action Points (AP) and money each year across working, gym-maxxing (Pilates for females), skincare, styling (styling/makeup for females), and risky plastic surgeries.
3. **Gender-Specific Surgeries:** Select surgical procedures (Limb Lengthening, Jaw Implants, and Hair Transplants for males; Brazilian Butt Lift (BBL), V-Line Jaw Surgery, and Surgical Hairline Lowering for females) from different clinics. Buying from a budget Turkey clinic saves cash but risks catastrophic failure; going to a premium Beverly Hills clinic minimizes risk but costs double.
4. **Random Life Events & TikTok-maxxing:** Face random events (bad breakups, job promotions, acne outbreaks, barber shop trips). Use the TikTok content studio to post viral trends if you meet strict genetic checkpoints. Earn cash, boost confidence, and acquire a massive follower count... or face brutal internet roasts!
5. **Social Card Battles:** Engage in turn-based card battles against Biff/Brittany the Bully, Sven/Sasha the Bouncer/Hostess, Clav the Influencer, Stacy/Chad, and Mr./Mrs. Sterling. Play combat cards unlocked by your stats (e.g. *Loom Over* at height >= 6'0"/5'8", *Jawline Flash* for chiseled jaw, *Retinol Radiance* for glowing skin) to reduce their "Skepticism". Card attacks now feature dazzling visual overlays directly drawn on a transparent canvas, neon eye lasers, particle ripples, screen shakes, and dynamic floating combat texts!
6. **Dating Swipe App ("swipeMax"):** Swipe right or left. Targets are gender-swapped. Match rates dynamically calculate from your PSL against targets' strict standards. Succeed in funny chat options to secure relationships.
7. **Interactive Post-Game Forum Roast:** At age 30, your run concludes. See your final biometrics rated and roasted on a simulated looksmaxing forum using gender-specific community slang. Reply to the haters with interactive cope strategies and get roasted in real-time.

---

## 💎 Roguelite Meta-Progression & Features

- **Cope Shop Upgrades:** Earn "Cope Tokens" at the end of each run based on your PSL and the number of botched surgeries survived. Spend them in the shop on:
  - **Permanent Perks:** *High Metabolism*, *Good Donor Area*, *Rich Uncle*, *Symmetrical Genes*.
  - **Cosmetic Themes:** Unlock new dynamic UI visual overhauls including *Stacy Magenta*, *Obsidian Incel*, *Beverly Hills Emerald*, and *Turkey Neon*.
- **Genetic Memories Gallery:** When you ascend or rot, your run is saved to the Hall of Memories. View a list of your past lives, including an interactive mini-canvas drawing the exact avatar from that run's end state, fully preserved!
- **Dynamic Botched Surgery Scars:** Botching a surgery places physical mutations directly onto your avatar (e.g. drooping asymmetric eyes, crooked jaws, red scabbed hairlines). Healing at a high-end clinic clears the botched deformity.
- **Procedural BGM Synthesizer:** Background retro synthwave music generated dynamically on the fly using native browser **Web Audio API** oscillators (keeps bundle size tiny). Soundtrack tempo and musical scales change according to screen state.
- **Dynamic Avatar:** Real-time `<canvas>` portrait drawing that updates eye tilt, eyelashes, skin spots, shoulder/neck frames, outfits, Norwood/Ludwig hair shapes, lipstick, earrings, and botched scars live as stats change.
- **Audio Synthesizer:** Native 8-bit sound effects (menu select, success chirps, error buzzers, Tinder swishes, combat impacts, and level-ups) built directly in code.
- **Responsive Layout:** Mobile-friendly layouts adjusting from multi-column desktop dashboards to vertical stacks on smartphones.

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
