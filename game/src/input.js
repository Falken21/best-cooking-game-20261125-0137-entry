// Copper Pan Diner — input. Mouse clicks and keyboard presses become
// kitchen actions: bins add ingredients, station slots hand over cooked
// food, tickets serve to that customer, buttons serve / scrap / take back.
// Hit tests use the same rectangles render.js draws with.

import { SERVE_BUTTON, TRASH_BUTTON, UNDO_BUTTON, VIEW } from './config.js';
import { INGREDIENTS } from './recipes.js';
import {
  SCREEN_DAY_END, SCREEN_GAME_OVER, SCREEN_PLAY, SCREEN_TITLE,
  addIngredient, clearPlate, serve, takeFromStation, undoLast,
} from './kitchen.js';
import { binRect, slotRect, ticketRect } from './render.js';
import { unlockAudio } from './sound.js';

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

/** Convert a pointer event to play-field coordinates. */
export function toField(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (VIEW.width / rect.width),
    y: (event.clientY - rect.top) * (VIEW.height / rect.height),
  };
}

/**
 * Wire a canvas to a game state. `actions` carries the screen changes only
 * main.js should own: start() opens day 1, nextDay() starts the following
 * day, restart() resets the whole run. `ui` is the shared hover record
 * render.js reads. Returns the ui record.
 */
export function attachInput(canvas, state, actions) {
  const ui = { hoverBin: -1, hover: null };

  canvas.addEventListener('pointermove', (event) => {
    const { x, y } = toField(canvas, event);
    ui.hoverBin = -1;
    ui.hover = null;
    if (state.screen !== SCREEN_PLAY) return;
    INGREDIENTS.forEach((ingredient, index) => {
      if (inside(x, y, binRect(index))) ui.hoverBin = index;
    });
    if (inside(x, y, SERVE_BUTTON)) ui.hover = 'serve';
    else if (inside(x, y, TRASH_BUTTON)) ui.hover = 'trash';
    else if (inside(x, y, UNDO_BUTTON)) ui.hover = 'undo';
  });

  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio();
    const { x, y } = toField(canvas, event);
    if (state.screen === SCREEN_TITLE) {
      actions.start();
      return;
    }
    if (state.screen === SCREEN_DAY_END) {
      actions.nextDay();
      return;
    }
    if (state.screen === SCREEN_GAME_OVER) {
      actions.restart();
      return;
    }
    if (state.screen !== SCREEN_PLAY) return;
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      if (inside(x, y, binRect(index))) {
        addIngredient(state, INGREDIENTS[index].id);
        return;
      }
    }
    for (const stationName of ['grill', 'fryer']) {
      for (let index = 0; index < 2; index += 1) {
        if (inside(x, y, slotRect(stationName, index))) {
          takeFromStation(state, stationName, index);
          return;
        }
      }
    }
    for (let index = 0; index < state.orders.length; index += 1) {
      if (inside(x, y, ticketRect(index))) {
        serve(state, state.orders[index].id);
        return;
      }
    }
    if (inside(x, y, SERVE_BUTTON)) serve(state);
    else if (inside(x, y, TRASH_BUTTON)) clearPlate(state);
    else if (inside(x, y, UNDO_BUTTON)) undoLast(state);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    unlockAudio();
    if (state.screen === SCREEN_TITLE && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      actions.start();
      return;
    }
    if (state.screen === SCREEN_DAY_END && event.key === 'Enter') {
      actions.nextDay();
      return;
    }
    if (state.screen === SCREEN_GAME_OVER && event.key === 'Enter') {
      actions.restart();
      return;
    }
    if (state.screen !== SCREEN_PLAY) return;
    const ingredient = INGREDIENTS.find((entry) => entry.key === event.key);
    if (ingredient) {
      addIngredient(state, ingredient.id);
      return;
    }
    if (event.key === 'Enter') serve(state);
    else if (event.key === 'Backspace') {
      event.preventDefault();
      undoLast(state);
    } else if (event.key === 't' || event.key === 'T' || event.key === 'Delete') clearPlate(state);
  });

  return ui;
}
