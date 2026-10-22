const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const config = require('./game/config');
const engine = require('./game/engine');

const { GENRES, TIERS, VENUES, GEAR, DEFAULT_TASKS, MINIGAMES, RULES, STATS } = config;
const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is not set. Set it in Railway variables.');

const allowed = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    // Allow Vercel preview deployments of the same project.
    if (/\.vercel\.app$/.test(origin) && allowed.some((a) => a.endsWith('.vercel.app'))) return cb(null, true);
    return cb(new Error(`Origin ${origin} is not allowed. Add it to FRONTEND_URL.`));
  },
}));
app.use(express.json({ limit: '50kb' }));

// ---------- helpers ----------
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const clean = (s, max) => String(s || '').trim().slice(0, max);

function serverDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toISOString().slice(0, 10);
}

// The phone/computer sends its own local date so "today" matches the player's day.
function localDate(req) {
  const d = req.get('x-local-date');
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= serverDate(-2) && d <= serverDate(2)) return d;
  return serverDate();
}

function auth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please log in.'));
  try {
    req.userId = jwt.verify(token, JWT_SECRET).uid;
    req.today = localDate(req);
    return next();
  } catch {
    return next(new HttpError(401, 'Your login expired. Please log in again.'));
  }
}

function sign(user) {
  return jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '180d' });
}

async function addEvent(tx, bandId, date, kind, text) {
  await tx.event.create({ data: { bandId, date, kind, text } });
}

// Applies song streams and streak resets for any days missed. Returns the fresh band.
async function loadBand(tx, userId, today) {
  const band = await tx.band.findUnique({ where: { userId } });
  if (!band) throw new HttpError(400, 'Create your band first.');
  if (band.lastSeenDate === today) return band;

  const songs = await tx.song.findMany({ where: { bandId: band.id } });
  const r = engine.rollover(band, songs, today);
  for (const e of r.events) await addEvent(tx, band.id, today, e.kind, e.text);
  return tx.band.update({
    where: { id: band.id },
    data: { fans: { increment: r.fans }, streak: r.streak, lastSeenDate: today },
  });
}

async function checkTierUp(tx, before, after, today) {
  const a = engine.tierIndex(before.fans);
  const b = engine.tierIndex(after.fans);
  if (b > a) {
    await addEvent(tx, after.id, today, 'tier', `LEVEL UP! You are now a ${TIERS[b].name}. New gigs unlocked.`);
    return TIERS[b].name;
  }
  return null;
}

function decorateBand(band) {
  const tier = engine.tierIndex(band.fans);
  return {
    ...band,
    tier,
    tierName: TIERS[tier].name,
    tierBlurb: TIERS[tier].blurb,
    nextTier: engine.nextTier(band.fans),
    power: engine.bandPower(band),
    streakBonus: Math.round((engine.streakMultiplier(band) - 1) * 100),
    songCost: engine.songCost(band),
  };
}

async function buildState(userId, today) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(401, 'Account not found. Please log in again.');
  const base = { user: { username: user.username, dailyGoal: user.dailyGoal, hasParentPin: !!user.parentPinHash }, today };

  const exists = await prisma.band.findUnique({ where: { userId } });
  if (!exists) return { ...base, band: null };

  const band = await prisma.$transaction((tx) => loadBand(tx, userId, today));
  const [tasks, done, songs, events, best] = await Promise.all([
    prisma.task.findMany({ where: { userId, active: true }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] }),
    prisma.completion.findMany({ where: { userId, date: today } }),
    prisma.song.findMany({ where: { bandId: band.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.event.findMany({ where: { bandId: band.id }, orderBy: { createdAt: 'desc' }, take: 25 }),
    prisma.minigamePlay.groupBy({ by: ['game'], where: { bandId: band.id }, _max: { score: true } }),
  ]);
  const doneIds = new Set(done.map((c) => c.taskId));
  return {
    ...base,
    band: decorateBand(band),
    tasks: tasks.map((t) => ({ ...t, done: doneIds.has(t.id) })),
    doneToday: done.length,
    songs,
    events,
    bestScores: Object.fromEntries(best.map((b) => [b.game, b._max.score])),
  };
}

const respond = async (req, res, extra = {}) => res.json({ ...(await buildState(req.userId, req.today)), ...extra });

// ---------- public ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/config', (req, res) => {
  res.json({ STATS, GENRES, TIERS, VENUES, GEAR, MINIGAMES, RULES });
});

app.post('/api/auth/signup', wrap(async (req, res) => {
  const username = clean(req.body.username, 24).toLowerCase();
  const pin = String(req.body.pin || '');
  const parentPin = String(req.body.parentPin || '');
  if (!/^[a-z0-9_]{3,24}$/.test(username)) throw new HttpError(400, 'Player name needs 3 to 24 letters or numbers.');
  if (!/^\d{4,8}$/.test(pin)) throw new HttpError(400, 'PIN needs 4 to 8 numbers.');
  if (parentPin && !/^\d{4,8}$/.test(parentPin)) throw new HttpError(400, 'Parent PIN needs 4 to 8 numbers.');
  if (await prisma.user.findUnique({ where: { username } })) throw new HttpError(409, 'That player name is taken. Try another.');

  const user = await prisma.user.create({
    data: {
      username,
      pinHash: await bcrypt.hash(pin, 10),
      parentPinHash: parentPin ? await bcrypt.hash(parentPin, 10) : null,
      tasks: { create: DEFAULT_TASKS.map((t, i) => ({ ...t, sort: i })) },
    },
  });
  res.json({ token: sign(user) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const username = clean(req.body.username, 24).toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(String(req.body.pin || ''), user.pinHash))) {
    throw new HttpError(401, 'Player name or PIN is wrong.');
  }
  res.json({ token: sign(user) });
}));

// ---------- player ----------
app.get('/api/state', auth, wrap(async (req, res) => respond(req, res)));

app.post('/api/band', auth, wrap(async (req, res) => {
  const genre = String(req.body.genre || '');
  const name = clean(req.body.name, 40);
  if (!GENRES[genre]) throw new HttpError(400, 'Pick a genre.');
  if (name.length < 2) throw new HttpError(400, 'Give your band a name.');
  if (await prisma.band.findUnique({ where: { userId: req.userId } })) throw new HttpError(409, 'You already have a band.');

  const roles = GENRES[genre].roles;
  const raw = Array.isArray(req.body.members) ? req.body.members : [];
  const members = roles.map((role, i) => ({ role, name: clean(raw[i], 20) || `Player ${i + 1}` }));

  const band = await prisma.band.create({
    data: { userId: req.userId, name, genre, members, lastSeenDate: req.today },
  });
  await addEvent(prisma, band.id, req.today, 'start', `${name} formed in a garage. Time to get noticed!`);
  await respond(req, res);
}));

app.post('/api/tasks/:id/complete', auth, wrap(async (req, res) => {
  const taskId = Number(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    const task = await tx.task.findFirst({ where: { id: taskId, userId: req.userId, active: true } });
    if (!task) throw new HttpError(404, 'Task not found.');
    if (await tx.completion.findUnique({ where: { taskId_date: { taskId, date: req.today } } })) {
      throw new HttpError(409, 'Already done today. Nice!');
    }
    const gain = engine.statGain(band, task.stat, task.amount);
    const energyGain = Math.max(0, Math.min(RULES.energyPerTask, RULES.energyCap - band.energy));
    await tx.completion.create({
      data: { userId: req.userId, taskId, date: req.today, statGained: gain, energyGained: energyGain },
    });
    let updated = await tx.band.update({
      where: { id: band.id },
      data: { [task.stat]: { increment: gain }, energy: { increment: energyGain } },
    });

    const user = await tx.user.findUnique({ where: { id: req.userId } });
    const count = await tx.completion.count({ where: { userId: req.userId, date: req.today } });
    let goal = null;
    if (count >= user.dailyGoal && updated.lastGoalDate !== req.today) {
      goal = engine.goalReached(updated, req.today);
      const before = updated;
      updated = await tx.band.update({
        where: { id: band.id },
        data: {
          streak: goal.streak,
          bestStreak: goal.bestStreak,
          lastGoalDate: goal.lastGoalDate,
          fans: { increment: goal.fans },
          energy: Math.min(RULES.energyCap, updated.energy + goal.energy),
        },
      });
      await addEvent(tx, band.id, req.today, 'goal', goal.text);
      await checkTierUp(tx, before, updated, req.today);
    }
    return { stat: task.stat, gain, energy: energyGain, goal: goal ? goal.text : null };
  });
  await respond(req, res, { reward: result });
}));

app.post('/api/tasks/:id/undo', auth, wrap(async (req, res) => {
  const taskId = Number(req.params.id);
  await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    const c = await tx.completion.findUnique({ where: { taskId_date: { taskId, date: req.today } }, include: { task: true } });
    if (!c || c.userId !== req.userId) throw new HttpError(404, 'That task is not ticked today.');
    if (band.energy < c.energyGained) throw new HttpError(400, 'You already spent the energy from this task, so it stays ticked.');
    await tx.completion.delete({ where: { id: c.id } });
    await tx.band.update({
      where: { id: band.id },
      data: {
        [c.task.stat]: Math.max(0, band[c.task.stat] - c.statGained),
        energy: { decrement: c.energyGained },
      },
    });
  });
  await respond(req, res);
}));

app.post('/api/gig', auth, wrap(async (req, res) => {
  const venue = VENUES.find((v) => v.id === req.body.venueId);
  if (!venue) throw new HttpError(404, 'Venue not found.');
  const result = await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    if (engine.tierIndex(band.fans) < venue.tier) throw new HttpError(400, 'Get more fans to unlock this venue.');
    if (band.energy < venue.energy) throw new HttpError(400, `You need ${venue.energy} energy. Finish tasks to earn more.`);
    const gig = engine.playGig(band, venue);
    const updated = await tx.band.update({
      where: { id: band.id },
      data: {
        energy: { decrement: venue.energy },
        fans: { increment: gig.fans },
        money: { increment: gig.money },
        stage: { increment: gig.stageXp },
        gigsPlayed: { increment: 1 },
      },
    });
    await addEvent(tx, band.id, req.today, 'gig', `${venue.icon} ${venue.name}: ${'★'.repeat(gig.stars) || 'no stars'}. +${gig.fans} fans, +$${gig.money}.`);
    const tierUp = await checkTierUp(tx, band, updated, req.today);
    return { ...gig, venue: venue.name, tierUp };
  });
  await respond(req, res, { gig: result });
}));

app.post('/api/song', auth, wrap(async (req, res) => {
  const title = clean(req.body.title, 40);
  if (title.length < 1) throw new HttpError(400, 'Give your song a title.');
  const result = await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    const cost = engine.songCost(band);
    if (band.energy < RULES.songEnergy) throw new HttpError(400, `Recording takes ${RULES.songEnergy} energy.`);
    if (band.money < cost) throw new HttpError(400, `Studio time costs $${cost}. Play gigs to earn cash.`);
    const song = engine.writeSong(band);
    await tx.song.create({ data: { bandId: band.id, title, quality: song.quality, fans: song.fans, date: req.today } });
    const updated = await tx.band.update({
      where: { id: band.id },
      data: {
        energy: { decrement: RULES.songEnergy },
        money: { decrement: cost },
        fans: { increment: song.fans },
        creativity: { increment: engine.statGain(band, 'creativity', 2) },
      },
    });
    await addEvent(tx, band.id, req.today, 'song', `Released "${title}" (quality ${song.quality}). +${song.fans} fans.`);
    const tierUp = await checkTierUp(tx, band, updated, req.today);
    return { ...song, title, tierUp };
  });
  await respond(req, res, { song: result });
}));

app.post('/api/minigame', auth, wrap(async (req, res) => {
  const game = String(req.body.game || '');
  const cfg = MINIGAMES[game];
  if (!cfg) throw new HttpError(404, 'Game not found.');
  const result = await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    if (band.energy < cfg.energy) throw new HttpError(400, 'You need 1 energy to rehearse. Finish a task first.');
    const r = engine.minigameReward(band, game, req.body.score);
    await tx.minigamePlay.create({ data: { bandId: band.id, game, score: r.score, date: req.today } });
    await tx.band.update({
      where: { id: band.id },
      data: { energy: { decrement: cfg.energy }, [r.stat]: { increment: r.amount } },
    });
    return r;
  });
  await respond(req, res, { rehearsal: result });
}));

app.post('/api/shop/:id', auth, wrap(async (req, res) => {
  const item = GEAR.find((g) => g.id === req.params.id);
  if (!item) throw new HttpError(404, 'Item not found.');
  await prisma.$transaction(async (tx) => {
    const band = await loadBand(tx, req.userId, req.today);
    const gear = Array.isArray(band.gear) ? band.gear : [];
    if (gear.includes(item.id)) throw new HttpError(409, 'You already own this.');
    if (band.money < item.cost) throw new HttpError(400, `You need $${item.cost}.`);
    await tx.band.update({ where: { id: band.id }, data: { money: { decrement: item.cost }, gear: [...gear, item.id] } });
    await addEvent(tx, band.id, req.today, 'gear', `Bought ${item.icon} ${item.name}. ${item.text}.`);
  });
  await respond(req, res);
}));

// Last 14 days of ticked tasks, for the accountability calendar.
app.get('/api/history', auth, wrap(async (req, res) => {
  const from = engine.addDays(req.today, -13);
  const rows = await prisma.completion.findMany({
    where: { userId: req.userId, date: { gte: from, lte: req.today } },
    include: { task: { select: { title: true, icon: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const date = engine.addDays(req.today, -i);
    const items = rows.filter((r) => r.date === date).map((r) => `${r.task.icon} ${r.task.title}`);
    days.push({ date, count: items.length, items, goalMet: items.length >= user.dailyGoal });
  }
  res.json({ days, dailyGoal: user.dailyGoal });
}));

// ---------- parent area ----------
async function parentCheck(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.parentPinHash && !(await bcrypt.compare(String(req.get('x-parent-pin') || ''), user.parentPinHash))) {
      throw new HttpError(403, 'Parent PIN is wrong.');
    }
    req.user = user;
    next();
  } catch (e) { next(e); }
}

app.post('/api/parent/verify', auth, parentCheck, (req, res) => res.json({ ok: true }));

app.get('/api/parent/tasks', auth, parentCheck, wrap(async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { userId: req.userId }, orderBy: [{ sort: 'asc' }, { id: 'asc' }] });
  res.json({ tasks, dailyGoal: req.user.dailyGoal, hasParentPin: !!req.user.parentPinHash });
}));

function taskInput(body) {
  const data = {};
  if (body.title !== undefined) data.title = clean(body.title, 60);
  if (body.icon !== undefined) data.icon = clean(body.icon, 8) || '⭐';
  if (body.category !== undefined) data.category = clean(body.category, 20) || 'Other';
  if (body.stat !== undefined) {
    if (!STATS[body.stat]) throw new HttpError(400, 'Pick which skill this task grows.');
    data.stat = body.stat;
  }
  if (body.amount !== undefined) data.amount = Math.min(15, Math.max(1, Math.round(Number(body.amount) || 4)));
  if (body.active !== undefined) data.active = !!body.active;
  return data;
}

app.post('/api/parent/tasks', auth, parentCheck, wrap(async (req, res) => {
  const data = taskInput({ icon: '⭐', category: 'Other', stat: 'skill', amount: 5, ...req.body });
  if (!data.title) throw new HttpError(400, 'Task needs a name.');
  await prisma.task.create({ data: { ...data, userId: req.userId, sort: 999 } });
  res.json({ ok: true });
}));

app.patch('/api/parent/tasks/:id', auth, parentCheck, wrap(async (req, res) => {
  const r = await prisma.task.updateMany({ where: { id: Number(req.params.id), userId: req.userId }, data: taskInput(req.body) });
  if (!r.count) throw new HttpError(404, 'Task not found.');
  res.json({ ok: true });
}));

app.delete('/api/parent/tasks/:id', auth, parentCheck, wrap(async (req, res) => {
  await prisma.task.deleteMany({ where: { id: Number(req.params.id), userId: req.userId } });
  res.json({ ok: true });
}));

app.patch('/api/parent/settings', auth, parentCheck, wrap(async (req, res) => {
  const data = {};
  if (req.body.dailyGoal !== undefined) data.dailyGoal = Math.min(20, Math.max(1, Math.round(Number(req.body.dailyGoal) || 6)));
  if (req.body.newParentPin) {
    if (!/^\d{4,8}$/.test(String(req.body.newParentPin))) throw new HttpError(400, 'Parent PIN needs 4 to 8 numbers.');
    data.parentPinHash = await bcrypt.hash(String(req.body.newParentPin), 10);
  }
  if (req.body.newPlayerPin) {
    if (!/^\d{4,8}$/.test(String(req.body.newPlayerPin))) throw new HttpError(400, 'Player PIN needs 4 to 8 numbers.');
    data.pinHash = await bcrypt.hash(String(req.body.newPlayerPin), 10);
  }
  await prisma.user.update({ where: { id: req.userId }, data });
  res.json({ ok: true });
}));

app.post('/api/parent/reset-band', auth, parentCheck, wrap(async (req, res) => {
  await prisma.band.deleteMany({ where: { userId: req.userId } });
  res.json({ ok: true });
}));

// ---------- errors ----------
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(409).json({ error: 'Already done.' });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  return res.status(status).json({ error: status === 500 ? 'Something went wrong on the server. Try again.' : err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Headliner API listening on ${PORT}`));
