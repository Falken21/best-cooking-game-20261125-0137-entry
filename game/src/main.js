// Copper Pan Diner — boot and loop. Owns the canvas, the fixed-step clock,
// the sound effects the kitchen asks for, the screen-flow actions input.js
// calls, and the ?shot= staging the screenshots are taken with.

import {
  SCREEN_DAY_END, SCREEN_GAME_OVER, SCREEN_PLAY,
  createGame, startDay, update,
} from './kitchen.js';
import { drawScene } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import {
  playBuzz, playDing, playPop, playReady, playServe, playSizzle,
} from './sound.js';

const STEP = 1 / 60;
const SOUND_FOR_EVENT = {
  pop: playPop,
  sizzle: playSizzle,
  serve: playServe,
  ding: playDing,
  buzz: playBuzz,
  ready: playReady,
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

let state = shotName !== null ? stageShot(shotName) : createGame();
let lastStatus = '';

const actions = {
  start() {
    state.coins = 0;
    state.totalServed = 0;
    state.bestCombo = 0;
    startDay(state, 1);
  },
  nextDay() {
    startDay(state, state.day + 1);
  },
  restart() {
    const fresh = createGame();
    Object.assign(state, fresh);
    startDay(state, 1);
  },
};

const ui = attachInput(canvas, state, actions);

// The screenshot driver (and curious players) can reach the live state.
window.__copperPan = { state, stageShot, startDay };

function announce() {
  let message = '';
  if (state.screen === SCREEN_PLAY) {
    const next = state.orders[0];
    message = next
      ? `Day ${state.day}. ${state.coins} coins. ${state.orders.length} tickets waiting.`
      : `Day ${state.day}. ${state.coins} coins. No tickets waiting.`;
  } else if (state.screen === SCREEN_DAY_END) {
    message = `Day ${state.day} complete. ${state.coinsToday} coins earned.`;
  } else if (state.screen === SCREEN_GAME_OVER) {
    message = `The diner closed early with ${state.coins} coins.`;
  } else {
    message = 'Copper Pan Diner. Press Enter or click to open.';
  }
  if (message !== lastStatus) {
    lastStatus = message;
    status.textContent = message;
  }
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    // A staged screenshot scene is frozen: the kitchen does not advance, so
    // the frame the maker captured is the frame that ships.
    if (shotName === null) update(state, STEP);
    else state.elapsed += STEP;
    accumulator -= STEP;
  }
  for (const event of state.events.splice(0)) {
    const play = SOUND_FOR_EVENT[event];
    if (play) play();
  }
  drawScene(ctx, state, ui);
  announce();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
