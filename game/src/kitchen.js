// Copper Pan Diner — the kitchen: game state and rules. Orders pin up with
// a patience timer, raw food cooks on the grill or in the fryer (perfect if
// you catch it in its window, burnt if you forget it), the plate stacks what
// you build, and serving a dish that matches a ticket pays its price plus a
// freshness tip, a perfect-cooking bonus and a combo bonus. This module is
// rules only: render.js draws the state and main.js feeds it input.

import {
  COOKING, COMBO_WINDOW, MAX_TICKETS, ORDER_PATIENCE, SHIFT_SECONDS,
  SPAWN_GAP, TIP_MAX,
} from './config.js';
import { INGREDIENT_BY_ID, RECIPE_BY_ID, recipesForDay, sameDish } from './recipes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DAY_END = 'dayEnd';
export const SCREEN_GAME_OVER = 'gameOver';

const PLATE_MAX = 8;
const START_STARS = 3;

export function createGame() {
  return {
    screen: SCREEN_TITLE,
    day: 1,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    coinsToday: 0,
    servedToday: 0,
    missedToday: 0,
    totalServed: 0,
    stars: START_STARS,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    orders: [],
    nextOrderId: 1,
    spawnTimer: SPAWN_GAP.first,
    plate: [],
    stations: { grill: [null, null], fryer: [null, null] },
    popups: [],
    message: null,
    shake: 0,
    events: [],
  };
}

/** Begin (or restart) a day: fresh tickets, full stars, a full shift clock. */
export function startDay(state, day) {
  state.day = day;
  state.screen = SCREEN_PLAY;
  state.timeLeft = SHIFT_SECONDS;
  state.coinsToday = 0;
  state.servedToday = 0;
  state.missedToday = 0;
  state.stars = START_STARS;
  state.combo = 0;
  state.comboTimer = 0;
  state.orders = [];
  state.spawnTimer = SPAWN_GAP.first;
  state.plate = [];
  state.stations = { grill: [null, null], fryer: [null, null] };
  state.popups = [];
  state.message = null;
  spawnOrder(state);
}

/** How many tickets may hang at once on this day. */
function ticketCapacity(state) {
  return Math.min(MAX_TICKETS, state.day >= 3 ? 4 : 3);
}

/** Later days serve customers with a little less patience. */
function patienceScale(state) {
  return Math.max(0.55, 1 - 0.07 * (state.day - 1));
}

function spawnOrder(state) {
  const menu = recipesForDay(state.day);
  const recipe = menu[Math.floor(Math.random() * menu.length)];
  const patience = (ORDER_PATIENCE.base + ORDER_PATIENCE.perIngredient * recipe.items.length) * patienceScale(state);
  state.orders.push({
    id: state.nextOrderId,
    recipeId: recipe.id,
    patience,
    patienceMax: patience,
    born: state.elapsed,
  });
  state.nextOrderId += 1;
  state.events.push('ding');
}

/** The station slot list an ingredient cooks on, or null if it plates raw. */
function stationOf(state, ingredientId) {
  const cook = INGREDIENT_BY_ID[ingredientId].cook;
  return cook === null ? null : state.stations[cook];
}

/** 'cooking', 'perfect', 'cooked' or 'burnt' for a station slot. */
export function doneness(slot) {
  const timing = COOKING[INGREDIENT_BY_ID[slot.id].cook];
  if (slot.t >= timing.burn) return 'burnt';
  if (slot.t >= timing.cook + timing.perfect) return 'cooked';
  if (slot.t >= timing.cook) return 'perfect';
  return 'cooking';
}

function addPopup(state, x, y, text, colour) {
  state.popups.push({ x, y, text, colour, t: 0, life: 1.5 });
}

function setMessage(state, text) {
  state.message = { text, t: 0, life: 2.2 };
}

/** The plate's ingredient ids, in the order they were stacked. */
export function plateIds(state) {
  return state.plate.map((entry) => entry.id);
}

/** The order the current plate would serve, or null when it matches none. */
export function matchedOrder(state) {
  const ids = plateIds(state);
  if (ids.length === 0) return null;
  let best = null;
  for (const order of state.orders) {
    if (sameDish(ids, RECIPE_BY_ID[order.recipeId].items)) {
      if (best === null || order.patience < best.patience) best = order;
    }
  }
  return best;
}

/**
 * Click an ingredient bin: cookables go to a free station slot, everything
 * else lands straight on the plate.
 */
export function addIngredient(state, ingredientId) {
  if (state.screen !== SCREEN_PLAY) return;
  const slots = stationOf(state, ingredientId);
  if (slots !== null) {
    const free = slots.indexOf(null);
    if (free === -1) {
      setMessage(state, INGREDIENT_BY_ID[ingredientId].cook === 'grill' ? 'The grill is full!' : 'The fryer is full!');
      state.events.push('buzz');
      return;
    }
    slots[free] = { id: ingredientId, t: 0, announced: false };
    state.events.push('sizzle');
    return;
  }
  if (state.plate.length >= PLATE_MAX) {
    setMessage(state, 'The plate is full!');
    state.events.push('buzz');
    return;
  }
  state.plate.push({ id: ingredientId, perfect: false });
  state.events.push('pop');
}

/**
 * Click a cooking station slot: perfect or cooked food moves to the plate,
 * burnt food goes in the bin, food still cooking stays put.
 */
export function takeFromStation(state, stationName, index) {
  if (state.screen !== SCREEN_PLAY) return;
  const slot = state.stations[stationName][index];
  if (slot === null) return;
  const state2 = doneness(slot);
  if (state2 === 'cooking') return;
  state.stations[stationName][index] = null;
  if (state2 === 'burnt') {
    setMessage(state, 'Burnt! In the bin it goes.');
    state.events.push('buzz');
    return;
  }
  if (state.plate.length >= PLATE_MAX) {
    setMessage(state, 'The plate is full!');
    state.events.push('buzz');
    state.stations[stationName][index] = slot;
    return;
  }
  state.plate.push({ id: slot.id, perfect: state2 === 'perfect' });
  state.events.push('pop');
}

/** Take the last ingredient back off the plate. */
export function undoLast(state) {
  if (state.plate.length > 0) {
    state.plate.pop();
    state.events.push('pop');
  }
}

/** Scrape the whole plate into the bin. */
export function clearPlate(state) {
  if (state.plate.length > 0) {
    state.plate = [];
    setMessage(state, 'Plate cleared.');
    state.events.push('buzz');
  }
}

/**
 * Serve the plate. With an order id it serves that ticket; without one it
 * serves whichever matching ticket is closest to walking out. Returns true
 * when a dish left the pass.
 */
export function serve(state, orderId = null, plateCx = 640, plateCy = 470) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (state.plate.length === 0) {
    setMessage(state, 'Build a dish first!');
    state.events.push('buzz');
    return false;
  }
  let order = null;
  if (orderId !== null) {
    const wanted = state.orders.find((entry) => entry.id === orderId);
    if (wanted && sameDish(plateIds(state), RECIPE_BY_ID[wanted.recipeId].items)) order = wanted;
  } else {
    order = matchedOrder(state);
  }
  if (order === null) {
    setMessage(state, "That dish isn't on any ticket!");
    state.shake = 0.35;
    state.events.push('buzz');
    return false;
  }
  const recipe = RECIPE_BY_ID[order.recipeId];
  const freshness = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(TIP_MAX * freshness);
  const perfectBonus = state.plate.reduce((sum, entry) => sum + (entry.perfect ? 2 : 0), 0);
  state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
  state.comboTimer = COMBO_WINDOW;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = Math.min(5, Math.max(0, state.combo - 1));
  const total = recipe.price + tip + perfectBonus + comboBonus;
  state.coins += total;
  state.coinsToday += total;
  state.servedToday += 1;
  state.totalServed += 1;
  addPopup(state, plateCx, plateCy - 60, `+${total}`, '#2e7d32');
  if (perfectBonus > 0) addPopup(state, plateCx, plateCy - 100, 'Perfect cooking!', '#c47b4a');
  if (state.combo >= 3) addPopup(state, plateCx + 120, plateCy - 90, `Combo x${state.combo}`, '#c93b2e');
  state.orders = state.orders.filter((entry) => entry.id !== order.id);
  state.plate = [];
  state.events.push('serve');
  return true;
}

function expireOrder(state, order) {
  state.orders = state.orders.filter((entry) => entry.id !== order.id);
  state.missedToday += 1;
  state.stars -= 1;
  state.combo = 0;
  state.comboTimer = 0;
  setMessage(state, 'A customer walked out!');
  state.events.push('buzz');
  if (state.stars <= 0) state.screen = SCREEN_GAME_OVER;
}

/** Advance the whole kitchen by dt seconds. */
export function update(state, dt) {
  state.elapsed += dt;
  for (const popup of state.popups) popup.t += dt;
  state.popups = state.popups.filter((popup) => popup.t < popup.life);
  if (state.message !== null) {
    state.message.t += dt;
    if (state.message.t >= state.message.life) state.message = null;
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.screen !== SCREEN_PLAY) return;

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = SCREEN_DAY_END;
    return;
  }

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.orders.length < ticketCapacity(state)) spawnOrder(state);
    const gap = SPAWN_GAP.base * Math.max(0.5, 1 - 0.06 * (state.day - 1));
    state.spawnTimer = gap * (0.75 + Math.random() * 0.5);
  }

  for (const stationName of ['grill', 'fryer']) {
    for (const slot of state.stations[stationName]) {
      if (slot === null) continue;
      slot.t += dt;
      if (!slot.announced && doneness(slot) === 'perfect') {
        slot.announced = true;
        state.events.push('ready');
      }
    }
  }

  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) expireOrder(state, order);
    if (state.screen !== SCREEN_PLAY) return;
  }
}
