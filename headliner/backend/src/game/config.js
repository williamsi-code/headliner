// All tunable game content lives here. Change numbers here to rebalance the game.

const STATS = {
  skill: { label: 'Musicianship', icon: '🎵' },
  creativity: { label: 'Songwriting', icon: '✍️' },
  stage: { label: 'Stage presence', icon: '🔥' },
};

const GENRES = {
  rock: {
    name: 'Rock', icon: '🎸', color: '#FF5A3C',
    roles: ['Lead vocals', 'Guitar', 'Bass', 'Drums'],
    perk: 'Stage presence grows 25% faster',
    bonus: { statGain: { stage: 1.25 } },
    nameIdeas: ['The Loud Socks', 'Garage Thunder', 'Static Rebels', 'Broken Strings Club'],
  },
  rap: {
    name: 'Rap', icon: '🎤', color: '#FFC21A',
    roles: ['MC', 'Producer', 'DJ', 'Hype man'],
    perk: 'Songwriting grows 25% faster',
    bonus: { statGain: { creativity: 1.25 } },
    nameIdeas: ['Mic Check Crew', 'Block Party Kings', 'Rhyme Time', 'Beat Street'],
  },
  indie: {
    name: 'Indie', icon: '📼', color: '#3FD0B6',
    roles: ['Vocals & guitar', 'Synth', 'Bass', 'Drums'],
    perk: 'Songs earn 30% more fans',
    bonus: { songFans: 1.3 },
    nameIdeas: ['Paper Lanterns', 'The Quiet Arcade', 'Cassette Weather', 'Polaroid Moon'],
  },
  folk: {
    name: 'Folk', icon: '🪕', color: '#E0A060',
    roles: ['Vocals', 'Banjo', 'Fiddle', 'Upright bass'],
    perk: 'Musicianship grows 25% faster',
    bonus: { statGain: { skill: 1.25 } },
    nameIdeas: ['The Porch Lights', 'Old Pine Road', 'Lantern & Creek', 'Wandering Owls'],
  },
  pop: {
    name: 'Pop', icon: '✨', color: '#FF5FB0',
    roles: ['Lead singer', 'Keys', 'Dancer', 'Drums'],
    perk: 'Gigs earn 20% more fans',
    bonus: { gigFans: 1.2 },
    nameIdeas: ['Glitter Signal', 'Neon Hearts', 'Sugar Satellite', 'The Bright Side'],
  },
  country: {
    name: 'Country', icon: '🤠', color: '#F0B43C',
    roles: ['Vocals', 'Acoustic guitar', 'Pedal steel', 'Drums'],
    perk: 'Gigs earn 25% more cash',
    bonus: { gigMoney: 1.25 },
    nameIdeas: ['Dusty Boots', 'Tractor Pull Band', 'County Line', 'The Fence Posts'],
  },
  electronic: {
    name: 'Electronic', icon: '🎛️', color: '#4DA8FF',
    roles: ['Producer', 'Synths', 'Visuals', 'Drum machine'],
    perk: 'Rehearsal games give 25% more',
    bonus: { minigame: 1.25 },
    nameIdeas: ['Pixel Pulse', 'Circuit Garden', 'Low Battery', 'Night Mode'],
  },
  metal: {
    name: 'Metal', icon: '🤘', color: '#B7BCC4',
    roles: ['Vocals', 'Rhythm guitar', 'Lead guitar', 'Drums'],
    perk: 'Streak bonus counts double',
    bonus: { streak: 2 },
    nameIdeas: ['Iron Lunchbox', 'Thunder Hamster', 'Volcano Choir', 'Dragon Homework'],
  },
};

// Career ladder. A band moves up when its fan count passes `fans`.
const TIERS = [
  { fans: 0, name: 'Garage Band', blurb: 'Only your family has heard you play.' },
  { fans: 30, name: 'Coffee Shop Regulars', blurb: 'A few people on your street know your name.' },
  { fans: 150, name: 'Local Buzz', blurb: 'Kids at school are humming your songs.' },
  { fans: 600, name: 'Hometown Heroes', blurb: 'The whole town turns up when you play.' },
  { fans: 2500, name: 'Regional Act', blurb: 'Cities nearby are booking you.' },
  { fans: 9000, name: 'Festival Regulars', blurb: 'Your name is on festival posters.' },
  { fans: 30000, name: 'National Tour', blurb: 'You play a new state every night.' },
  { fans: 100000, name: 'Arena Headliner', blurb: 'Thousands sing every word back to you.' },
  { fans: 350000, name: 'World Tour Legend', blurb: 'Your music is known all over the planet.' },
];

// Gigs. `power` is the band power needed to nail the show.
const VENUES = [
  { id: 'garage', tier: 0, name: 'Garage show for the neighbors', icon: '🏠', energy: 2, power: 0, fans: 3, money: 5 },
  { id: 'party', tier: 0, name: 'Birthday party in a basement', icon: '🎂', energy: 2, power: 25, fans: 5, money: 10 },
  { id: 'openmic', tier: 1, name: 'Coffee shop open mic', icon: '☕', energy: 2, power: 60, fans: 8, money: 15 },
  { id: 'market', tier: 1, name: 'Farmers market stage', icon: '🥕', energy: 2, power: 100, fans: 12, money: 20 },
  { id: 'talent', tier: 2, name: 'School talent show', icon: '🏫', energy: 3, power: 180, fans: 22, money: 25 },
  { id: 'pizza', tier: 2, name: 'Friday night at the pizza place', icon: '🍕', energy: 3, power: 260, fans: 28, money: 45 },
  { id: 'fair', tier: 3, name: 'Town fair main stage', icon: '🎡', energy: 3, power: 420, fans: 55, money: 80 },
  { id: 'battle', tier: 3, name: 'Battle of the bands', icon: '🏆', energy: 3, power: 560, fans: 75, money: 110 },
  { id: 'club', tier: 4, name: 'City music club', icon: '🌃', energy: 4, power: 800, fans: 130, money: 180 },
  { id: 'radio', tier: 4, name: 'Live radio session', icon: '📻', energy: 4, power: 1000, fans: 170, money: 150 },
  { id: 'sidestage', tier: 5, name: 'Summer festival side stage', icon: '⛺', energy: 4, power: 1350, fans: 320, money: 360 },
  { id: 'theater', tier: 5, name: 'Sold-out theater', icon: '🎭', energy: 4, power: 1600, fans: 430, money: 520 },
  { id: 'tourstop', tier: 6, name: 'National tour stop', icon: '🚌', energy: 5, power: 2100, fans: 850, money: 1000 },
  { id: 'tv', tier: 6, name: 'TV morning show', icon: '📺', energy: 5, power: 2500, fans: 1250, money: 800 },
  { id: 'arena', tier: 7, name: 'Arena show', icon: '🏟️', energy: 5, power: 3200, fans: 2600, money: 3000 },
  { id: 'headline', tier: 7, name: 'Festival headliner', icon: '🎆', energy: 5, power: 3800, fans: 4000, money: 4500 },
  { id: 'stadium', tier: 8, name: 'World tour stadium', icon: '🌍', energy: 6, power: 5000, fans: 8000, money: 10000 },
];

// One-time upgrades bought with cash.
const GEAR = [
  { id: 'amp', name: 'Practice amp', icon: '🔊', cost: 30, effect: { power: 15 }, text: '+15 band power' },
  { id: 'mic', name: 'Better microphone', icon: '🎙️', cost: 60, effect: { power: 25 }, text: '+25 band power' },
  { id: 'shirts', name: 'Band T-shirts', icon: '👕', cost: 100, effect: { gigMoney: 0.2 }, text: 'Gigs pay 20% more' },
  { id: 'van', name: 'Rusty old van', icon: '🚐', cost: 250, effect: { gigFans: 0.15 }, text: 'Gigs earn 15% more fans' },
  { id: 'homestudio', name: 'Bedroom studio', icon: '🎚️', cost: 400, effect: { songQuality: 15 }, text: 'Songs +15 quality' },
  { id: 'lights', name: 'Light show', icon: '💡', cost: 700, effect: { power: 80 }, text: '+80 band power' },
  { id: 'social', name: 'Social media helper', icon: '📱', cost: 1200, effect: { songFans: 0.25 }, text: 'Songs earn 25% more fans' },
  { id: 'bus', name: 'Tour bus', icon: '🚌', cost: 3000, effect: { gigFans: 0.3 }, text: 'Gigs earn 30% more fans' },
  { id: 'prostudio', name: 'Pro studio time', icon: '💿', cost: 6000, effect: { songQuality: 40 }, text: 'Songs +40 quality' },
  { id: 'pyro', name: 'Fireworks rig', icon: '🎇', cost: 12000, effect: { power: 300 }, text: '+300 band power' },
];

// Starter wellbeing tasks. Parents can edit these in the app.
const DEFAULT_TASKS = [
  { category: 'Morning', icon: '🛏️', title: 'Make my bed', stat: 'stage', amount: 3 },
  { category: 'Morning', icon: '🪥', title: 'Brush teeth morning and night', stat: 'stage', amount: 3 },
  { category: 'Morning', icon: '🥣', title: 'Eat a healthy breakfast', stat: 'skill', amount: 4 },
  { category: 'Body', icon: '🏃', title: 'Move for 30 minutes', stat: 'stage', amount: 6 },
  { category: 'Body', icon: '💧', title: 'Drink 6 glasses of water', stat: 'skill', amount: 4 },
  { category: 'Body', icon: '🥕', title: 'Eat a fruit or veggie', stat: 'skill', amount: 4 },
  { category: 'Body', icon: '😴', title: 'Lights out on time', stat: 'stage', amount: 5 },
  { category: 'Mind', icon: '📚', title: 'Read for 20 minutes', stat: 'creativity', amount: 6 },
  { category: 'Mind', icon: '📝', title: 'Finish homework', stat: 'skill', amount: 6 },
  { category: 'Mind', icon: '🎹', title: 'Practice an instrument or sing', stat: 'skill', amount: 6 },
  { category: 'Mind', icon: '🙏', title: 'Write 3 things I am grateful for', stat: 'creativity', amount: 5 },
  { category: 'Heart', icon: '💛', title: 'Do something kind for someone', stat: 'stage', amount: 5 },
  { category: 'Heart', icon: '🧹', title: 'Help with a chore', stat: 'skill', amount: 4 },
  { category: 'Heart', icon: '🌳', title: 'One hour with no screens', stat: 'creativity', amount: 5 },
];

const MINIGAMES = {
  rhythm: { name: 'Rhythm Rush', icon: '🥁', stat: 'skill', energy: 1, text: 'Tap the notes as they hit the line.' },
  lyrics: { name: 'Lyric Lab', icon: '📝', stat: 'creativity', energy: 1, text: 'Pick the word that rhymes, fast.' },
  soundcheck: { name: 'Soundcheck', icon: '🎚️', stat: 'stage', energy: 1, text: 'Repeat the pattern the band plays.' },
};

const RULES = {
  energyCap: 20,
  energyPerTask: 1,
  goalBonusEnergy: 2,
  songEnergy: 4,
  songLifeDays: 30,
  maxCatchUpDays: 7,
  maxStreakForBonus: 20,
  streakStep: 0.05,
};

module.exports = { STATS, GENRES, TIERS, VENUES, GEAR, DEFAULT_TASKS, MINIGAMES, RULES };
