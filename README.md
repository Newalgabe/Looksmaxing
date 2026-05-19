# "ROLL THE DICE" — Genetic Lottery Roguelite

An interactive, dark-comedy, turn-based roguelite web game. You are born with random genetics, and you must navigate life from age 18 to 30 to reach the highest social tier. Maximize your stats, swipe on dating apps, survive random events, engage in social card battles, and face the final roast on a mock looksmaxing forum.

## 🎲 Core Gameplay Loop

1. **The Genetic Lottery (Birth):** Starts with a random roll across stats: Height, Jaw definition, Hairline (Norwood Scale), Canthal tilt, Skin quality, and Shoulder frame. These calculate your base **Sexual Market Value (SMV) score (1.0 - 10.0)** and starting Social Tier (Truecel to GigaChad).
2. **Yearly Action Grind:** Allocate 10 Action Points (AP) and money each year across working, gym-maxxing, skincare, styling, and risky plastic surgeries.
3. **Risky Surgeries:** Select surgical procedures (Limb Lengthening, Jaw Implants, Hair Transplants) from different clinics. Buying from a budget Turkey clinic saves cash but risks catastrophic failure; going to a premium Beverly Hills clinic minimises risk but costs double.
4. **Random Life Events:** Face random events (bad breakups, job promotions, acne outbreaks, TikTok roasts) that alter your stats.
5. **Social Card Battles:** Engage in turn-based card battles against Sven the Bouncer, Trent the Gym Bro, Stacy, and Mr. Sterling. Play combat cards unlocked by your stats (e.g. *Loom Over* at height >= 6'0", *Jawline Flash* for chiseled jaw, *Retinol Radiance* for glowing skin, *Wallet Flash* for cash) to reduce their "Skepticism" before your "Confidence" hits zero.
6. **Dating Swipe App ("swipeMax"):** Swipe right or left. Match rates dynamically calculate from your SMV against targets' strict standards. Succeed in funny chat options to secure relationships.
7. **Post-Game Forum Roast:** At age 30, your run concludes. See your final biometrics rated and roasted on a simulated looksmaxing forum.

---

## 🛠️ Tech Stack & Features

- **Core:** HTML5, CSS3, ES6+ Javascript Modules.
- **Dynamic Avatar:** Real-time `<canvas>` portrait drawing that updates eye tilt, skin spots, shoulder widths, outfits, and Norwood hair shapes live as stats change.
- **Audio Synthesizer:** Fully native **Web Audio API** retro 8-bit sound effects (menu select, success chirps, error buzzers, Tinder swishes, combat impacts, and level-ups) built directly in code without external file assets.
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
