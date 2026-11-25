// Copper Pan Diner — screenshot scenes. Loading the game with
// ?shot=kitchen|assembly|serve|rush stages one real game state, built with
// the kitchen's own rules and data, so a screenshot is a true render of the
// game mid-service. The maker's screenshots come from these scenes.

import { createGame, startDay } from './kitchen.js';

function order(state, recipeId, patience, patienceMax) {
  state.orders.push({
    id: state.nextOrderId,
    recipeId,
    patience,
    patienceMax,
    born: state.elapsed,
  });
  state.nextOrderId += 1;
}

function base(day, coins, timeLeft) {
  const state = createGame();
  startDay(state, day);
  state.orders = [];
  state.nextOrderId = 1;
  state.coins = coins;
  state.coinsToday = coins;
  state.timeLeft = timeLeft;
  state.elapsed = 42;
  return state;
}

/** The cover: a fresh service — full board, full counter, patty sizzling. */
function stageKitchen() {
  const state = base(1, 24, 121);
  order(state, 'copper-burger', 58, 90);
  order(state, 'garden-burger', 71, 97);
  order(state, 'sunrise-burger', 84, 90);
  state.stations.grill[0] = { id: 'patty', t: 2.4, announced: false };
  return state;
}

/** Mid-assembly: half a Copper Burger stacked, an egg at PERFECT. */
function stageAssembly() {
  const state = base(1, 57, 96);
  order(state, 'copper-burger', 52, 90);
  order(state, 'sunrise-burger', 66, 90);
  order(state, 'garden-burger', 88, 97);
  state.plate = [
    { id: 'bun', perfect: false },
    { id: 'patty', perfect: true },
    { id: 'cheese', perfect: false },
  ];
  state.stations.grill[0] = { id: 'egg', t: 5.1, announced: true };
  state.stations.grill[1] = { id: 'bacon', t: 1.8, announced: false };
  state.combo = 2;
  state.comboTimer = 8;
  return state;
}

/** A finished dish on the pass, matched to its ticket, coins landing. */
function stageServe() {
  const state = base(2, 96, 88);
  order(state, 'copper-burger', 47, 90);
  order(state, 'club-melt', 74, 104);
  order(state, 'green-bowl', 92, 104);
  state.plate = [
    { id: 'bun', perfect: false },
    { id: 'patty', perfect: true },
    { id: 'cheese', perfect: false },
    { id: 'bun', perfect: false },
  ];
  state.stations.fryer[0] = { id: 'potato', t: 4.4, announced: true };
  state.combo = 3;
  state.comboTimer = 9;
  state.popups.push({ x: 848, y: 470, text: '+20', colour: '#2e7d32', t: 0.35, life: 1.5 });
  return state;
}

/** The dinner rush: four tickets, one nearly walking out, everything busy. */
function stageRush() {
  const state = base(3, 231, 41);
  order(state, 'double-stack', 14, 111);
  order(state, 'loaded-fries', 39, 83);
  order(state, 'green-bowl', 55, 104);
  order(state, 'club-melt', 68, 104);
  state.plate = [
    { id: 'greens', perfect: false },
    { id: 'greens', perfect: false },
    { id: 'tomato', perfect: false },
  ];
  state.stations.grill[0] = { id: 'patty', t: 5.4, announced: true };
  state.stations.grill[1] = { id: 'patty', t: 2.2, announced: false };
  state.stations.fryer[0] = { id: 'potato', t: 6.8, announced: true };
  state.stations.fryer[1] = { id: 'potato', t: 1.2, announced: false };
  state.combo = 4;
  state.comboTimer = 7;
  state.stars = 2;
  return state;
}

const SCENES = {
  kitchen: stageKitchen,
  assembly: stageAssembly,
  serve: stageServe,
  rush: stageRush,
};

/** Build the staged state for a ?shot= name; unknown names give the cover. */
export function stageShot(name) {
  const build = SCENES[name] || stageKitchen;
  return build();
}
