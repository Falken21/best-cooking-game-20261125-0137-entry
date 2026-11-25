// Copper Pan Diner — shared layout and tuning constants.
// One source of truth for the play field's geometry: render.js draws with
// these rectangles and input.js hit-tests against the same ones, so what a
// player sees is exactly what they can click.

export const VIEW = { width: 1280, height: 800 };

// Top status bar: day, shift clock, coins, combo, stars.
export const HUD = { x: 0, y: 0, width: 1280, height: 62 };

// Order board: the wooden rail across the top where tickets pin up.
export const BOARD = { x: 24, y: 76, width: 1232, height: 178 };
export const TICKET = { width: 286, height: 158, gap: 24, firstX: 46, y: 86 };
export const MAX_TICKETS = 4;

// Cooking stations on the back counter.
export const GRILL = { x: 40, y: 286, width: 380, height: 148, slots: 2 };
export const FRYER = { x: 860, y: 286, width: 380, height: 148, slots: 2 };

// The assembly plate, centre stage, and its two action buttons.
export const PLATE = { cx: 640, cy: 512, radiusX: 168, radiusY: 44 };
export const SERVE_BUTTON = { x: 1052, y: 470, width: 188, height: 64 };
export const TRASH_BUTTON = { x: 1052, y: 548, width: 188, height: 52 };
export const UNDO_BUTTON = { x: 40, y: 470, width: 188, height: 52 };

// Ingredient bins along the front counter.
export const COUNTER = { x: 24, y: 636, width: 1232, height: 148 };
export const BIN = { width: 112, height: 122, gap: 12, firstX: 40, y: 650 };

// Shift and order timing, in seconds. Later days squeeze all three.
export const SHIFT_SECONDS = 150;
export const ORDER_PATIENCE = { base: 62, perIngredient: 7 };
export const SPAWN_GAP = { first: 1.2, base: 9.5 };

// Cooking times: the ring fills over `cook` seconds; the food is best in the
// `perfect` window after that and burns once `burn` seconds pass.
export const COOKING = {
  grill: { cook: 4.2, perfect: 2.6, burn: 9.5 },
  fryer: { cook: 3.6, perfect: 2.4, burn: 8.5 },
};

// Scoring: tips reward food served while the ticket is still fresh, and a
// combo grows while serves land within COMBO_WINDOW seconds of each other.
export const COMBO_WINDOW = 12;
export const TIP_MAX = 8;

export const COLOURS = {
  ink: '#2e1d12',
  paper: '#fff6e6',
  cream: '#f7e8cf',
  wood: '#8a5a33',
  woodDark: '#6f4525',
  copper: '#c47b4a',
  copperDark: '#9c5a2e',
  red: '#c93b2e',
  green: '#4d9b47',
  gold: '#f2b63d',
};
