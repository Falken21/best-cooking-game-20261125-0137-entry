# Copper Pan Diner

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Falken21/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Falken21/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A cozy cooking game that plays offline in a desktop browser. You run the
Copper Pan Diner: order tickets pin up on the board, each with its own
patience timer, and you build every dish on the plate at the pass before the
customer walks out.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static file server) — no network, no build step, no installs.

- **Build dishes.** Click an ingredient bin on the counter (or press its
  number key, 1–0) to add it to the plate. A ticket's ingredient icons tick
  off as your plate matches them.
- **Cook first.** Patties, eggs and bacon go on the **grill**; potatoes go
  in the **fryer**. Click the food when its ring reaches **PERFECT** to plate
  it with a bonus — leave it too long and it burns.
- **Serve.** When the plate matches a ticket exactly, press **SERVE**
  (or Enter, or click the ticket). Fresh dishes earn a tip, perfect cooking
  earns a bonus, and quick back-to-back serves build a combo.
- **Mind the clock.** Each ticket's patience bar drains; three walk-outs
  cost you your stars and close the diner early. Survive the 150-second
  shift to finish the day — the next day is faster, with more tickets and
  new recipes.

Seven dishes rotate onto the menu across the days: the Copper Burger,
Garden Burger and Sunrise Burger from day 1, the Green Bowl Salad and Club
Melt from day 2, and Loaded Fries and the Double Stack from day 3.

## Layout of this repository

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output folder and writes `dossier.json`
  with the vendored library. Run it with
  `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `vendor/makefun-game.ts` — the make.fun dossier library, copied from the
  competition kit unchanged.
- `game/` — the game itself, plain static files:
  - `index.html` and `style.css` — the page and its frame.
  - `src/config.js` — play-field geometry and tuning constants.
  - `src/recipes.js` — ingredients, recipes and dish matching.
  - `src/kitchen.js` — the rules: orders, cooking, scoring, day flow.
  - `src/food-art.js` — every ingredient drawn in code, raw to burnt.
  - `src/render.js` — the whole scene: room, board, stations, plate, HUD.
  - `src/input.js` — mouse and keyboard.
  - `src/sound.js` — a small WebAudio synth; no audio files.
  - `src/shots.js` — the staged scenes (`?shot=kitchen|assembly|serve|rush`)
    the screenshots were taken from.
  - `src/main.js` — boot, the fixed-step loop and screen flow.
- `screenshots/` — real renders of the game, taken in a browser from the
  staged scenes above.

## License

MIT — see `LICENSE`.
