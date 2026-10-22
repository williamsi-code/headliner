// Pure game rules. No database code here, so it is easy to test and tweak.
const { GENRES, TIERS, VENUES, GEAR, MINIGAMES, RULES } = require('./config');

function genreOf(band) {
  return GENRES[band.genre] || GENRES.rock;
}

function tierIndex(fans) {
  let t = 0;
  TIERS.forEach((tier, i) => { if (fans >= tier.fans) t = i; });
  return t;
}

function ownedGear(band) {
  const ids = Array.isArray(band.gear) ? band.gear : [];
  return GEAR.filter((g) => ids.includes(g.id));
}

function gearSum(band, key) {
  return ownedGear(band).reduce((sum, g) => sum + (g.effect[key] || 0), 0);
}

function bandPower(band) {
  return band.skill + band.creativity + band.stage + gearSum(band, 'power');
}

function statGain(band, stat, amount) {
  const mult = (genreOf(band).bonus.statGain || {})[stat] || 1;
  return Math.max(1, Math.round(amount * mult));
}

function streakMultiplier(band) {
  const perStep = RULES.streakStep * (genreOf(band).bonus.streak || 1);
  return 1 + Math.min(band.streak, RULES.maxStreakForBonus) * perStep;
}

// Dates are plain 'YYYY-MM-DD' strings in the player's local time.
function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);
}

function songDailyFans(band, song, onDate) {
  const age = daysBetween(song.date, onDate);
  if (age <= 0 || age > RULES.songLifeDays) return 0;
  const mult = (genreOf(band).bonus.songFans || 1) * (1 + gearSum(band, 'songFans'));
  const fade = 1 - age / (RULES.songLifeDays + 1);
  return Math.max(1, Math.round((song.quality / 15) * fade * mult));
}

// Runs once when a new day is first seen: song streams + streak reset.
function rollover(band, songs, today) {
  const result = { fans: 0, streak: band.streak, lastSeenDate: today, events: [] };
  if (!band.lastSeenDate || band.lastSeenDate >= today) return result;

  const gap = Math.min(daysBetween(band.lastSeenDate, today), RULES.maxCatchUpDays);
  for (let i = gap - 1; i >= 0; i -= 1) {
    const day = addDays(today, -i);
    result.fans += songs.reduce((sum, s) => sum + songDailyFans(band, s, day), 0);
  }
  if (result.fans > 0) {
    result.events.push({ kind: 'stream', text: `Your songs were streamed while you were away: +${result.fans} fans.` });
  }
  if (band.lastGoalDate !== addDays(today, -1) && band.lastGoalDate !== today && band.streak > 0) {
    result.streak = 0;
    result.events.push({ kind: 'streak', text: 'Your streak reset. Hit your daily goal today to start a new one.' });
  }
  return result;
}

// Called after a task is completed and today's total reaches the goal.
function goalReached(band, today) {
  const streak = band.lastGoalDate === addDays(today, -1) ? band.streak + 1 : 1;
  const tier = tierIndex(band.fans);
  const fans = 5 * (tier + 1) + streak;
  return {
    streak,
    bestStreak: Math.max(band.bestStreak, streak),
    lastGoalDate: today,
    fans,
    energy: RULES.goalBonusEnergy,
    text: `Daily goal hit! Streak is now ${streak} day${streak === 1 ? '' : 's'}. +${fans} fans and +${RULES.goalBonusEnergy} energy.`,
  };
}

function rand(min, max, rng = Math.random) {
  return min + (max - min) * rng();
}

function playGig(band, venue, rng = Math.random) {
  const power = bandPower(band);
  const ratio = venue.power === 0 ? 2 : power / venue.power;
  let perf = ratio >= 1 ? Math.min(1 + (ratio - 1) * 0.25, 1.5) : Math.pow(ratio, 1.5);
  perf = Math.max(0.15, perf * rand(0.85, 1.15, rng));

  const g = genreOf(band).bonus;
  const fanMult = (g.gigFans || 1) * (1 + gearSum(band, 'gigFans')) * streakMultiplier(band);
  const moneyMult = (g.gigMoney || 1) * (1 + gearSum(band, 'gigMoney'));
  const fans = Math.max(1, Math.round(venue.fans * perf * fanMult));
  const money = Math.max(1, Math.round(venue.money * perf * moneyMult));

  let stars = 0;
  let verdict = 'Rough night. The crowd was quiet, but you learned a lot.';
  if (perf >= 1.2) { stars = 3; verdict = 'ENCORE! The crowd would not let you leave.'; }
  else if (perf >= 0.9) { stars = 2; verdict = 'Great show. People were dancing.'; }
  else if (perf >= 0.6) { stars = 1; verdict = 'Okay show. A few new fans found you.'; }

  // Playing live always teaches a little stage presence.
  const stageXp = statGain(band, 'stage', 1 + stars);
  return { fans, money, stars, verdict, stageXp, power, needed: venue.power };
}

function songCost(band) {
  return 15 * (tierIndex(band.fans) + 1);
}

function writeSong(band, rng = Math.random) {
  const base = band.creativity * 0.6 + band.skill * 0.4;
  const quality = Math.round(base * rand(0.8, 1.2, rng) + rand(0, 20, rng) + gearSum(band, 'songQuality'));
  const mult = (genreOf(band).bonus.songFans || 1) * (1 + gearSum(band, 'songFans'));
  const fans = Math.max(2, Math.round(quality * 0.4 * mult));
  let review = 'A fun little tune.';
  if (quality >= 600) review = 'Instant classic. Everyone is talking about it.';
  else if (quality >= 300) review = 'A real hit. Radio stations are calling.';
  else if (quality >= 120) review = 'Catchy! People are sharing it.';
  else if (quality >= 50) review = 'A solid song with a great hook.';
  return { quality, fans, review };
}

// Turns a minigame score into a stat reward. Scores are capped so cheating gains little.
function minigameReward(band, game, score) {
  const cfg = MINIGAMES[game];
  const s = Math.max(0, Math.floor(Number(score) || 0));
  let raw = 0;
  if (game === 'rhythm') raw = Math.min(s, 100) / 8; // accuracy %
  if (game === 'lyrics') raw = Math.min(s, 25) * 0.6; // correct answers
  if (game === 'soundcheck') raw = Math.min(s, 12) * 1.25; // rounds survived
  const mult = genreOf(band).bonus.minigame || 1;
  const amount = raw < 0.5 ? 0 : statGain(band, cfg.stat, Math.max(1, raw * mult));
  return { stat: cfg.stat, amount, score: s };
}

function nextTier(fans) {
  const i = tierIndex(fans);
  return TIERS[i + 1] || null;
}

module.exports = {
  tierIndex, nextTier, bandPower, statGain, streakMultiplier, rollover, goalReached,
  playGig, writeSong, songCost, minigameReward, addDays, daysBetween, genreOf, gearSum, VENUES,
};
