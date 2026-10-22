# Headliner 🎸

A daily wellbeing accountability game. Finishing real-life tasks (make the bed, read, move, drink water, be kind) powers up a band that starts in a garage and climbs to a world tour.

## How the game works

- **Pick a genre** (Rock, Rap, Indie, Folk, Pop, Country, Electronic, Metal). Each has a perk, its own color, band-name ideas, and band roles.
- **Today tab:** tick off wellbeing tasks. Each one raises a skill (Musicianship, Songwriting, or Stage presence) and gives ⚡1 energy. Hitting the daily goal grows the streak, which gives bonus fans on every gig.
- **Rehearse tab:** three mini-games, each costs ⚡1:
  - Rhythm Rush: tap falling notes on the beat (Musicianship)
  - Lyric Lab: pick rhyming words against the clock (Songwriting)
  - Soundcheck: repeat a growing pattern (Stage presence)
- **Gigs tab:** spend energy to play shows. Band power vs. the venue's requirement decides how well it goes. New venues unlock with each career level.
- **Studio tab:** record songs (earn fans now and every day for a month) and buy gear.
- **Band tab:** bandmates, skills, a 14-day history of ticked tasks, band news, and the **Parent area** (PIN protected) to add, edit, or turn off tasks, change the daily goal, and reset PINs.

There are 9 career levels, from Garage Band to World Tour Legend. With steady daily effort, the top level takes roughly 2 to 3 months.

All game rules live on the server in `backend/src/game/config.js` (tasks, venues, gear, numbers). Change values there to rebalance.

## Folder layout

```
headliner/
  backend/    Express + Prisma + Postgres API  → Railway
  frontend/   React + Vite app                 → Vercel
```

## Deploy (no command line needed)

### 1. Put it on GitHub
1. Open **GitHub Desktop** → File → Add local repository → choose the `headliner` folder → "create a repository" when asked.
2. Commit everything, then click **Publish repository** (private is fine).

### 2. Backend on Railway
1. On railway.com: **New Project → Deploy from GitHub repo** → pick `headliner`.
2. Click the new service → **Settings → Source → Root Directory** → type `backend`.
3. In the project canvas, click **+ Create → Database → PostgreSQL**.
4. Back on the backend service → **Variables** → add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway offers this as a reference variable)
   - `JWT_SECRET` = any long random sentence
   - `FRONTEND_URL` = leave as `http://localhost:5173` for now
5. **Settings → Networking → Generate Domain.** Copy the address (like `https://headliner-production.up.railway.app`).
6. Check it works: open `<that address>/api/health` in a browser. You should see `{"ok":true}`.

The database tables are created automatically on every start (`prisma db push`).

### 3. Frontend on Vercel
1. On vercel.com: **Add New → Project** → import `headliner`.
2. Set **Root Directory** to `frontend`. Vercel detects Vite automatically.
3. Under **Environment Variables** add `VITE_API_URL` = your Railway address (no slash at the end).
4. Click **Deploy** and copy the site address (like `https://headliner.vercel.app`).

### 4. Connect them
Back in Railway → backend service → Variables → set `FRONTEND_URL` to your Vercel address. Railway redeploys on its own.

Open the Vercel address, create a player, and pick a genre. On a phone, use "Add to Home Screen" to make it feel like an app.

### Making changes later
Edit files (on GitHub's website or locally), commit and push with GitHub Desktop, and both Railway and Vercel redeploy automatically. If you change `VITE_API_URL`, redeploy the frontend in Vercel so it picks up the new value.

## Troubleshooting
- **"Cannot reach the server"**: check `VITE_API_URL` in Vercel matches the Railway domain exactly, then redeploy the frontend.
- **Login works locally but not on the live site**: `FRONTEND_URL` in Railway must match the Vercel address exactly (https, no trailing slash). Several addresses can be comma-separated.
- **Railway deploy fails at start**: make sure the Postgres database exists and `DATABASE_URL` is set on the backend service.
