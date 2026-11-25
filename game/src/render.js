// Copper Pan Diner — rendering. Everything the player sees is drawn here
// with canvas paths: the diner room, the HUD, the order board and its
// tickets, the grill and fryer, the assembly plate with its stacked dish,
// the ingredient counter, popups and the title / day-end / game-over cards.
// The hit rectangles input.js uses are exported from here so the picture
// and the clicking can never drift apart.

import {
  BIN, BOARD, COOKING, COUNTER, FRYER, GRILL, HUD, PLATE, SERVE_BUTTON,
  SHIFT_SECONDS, TICKET, TRASH_BUTTON, UNDO_BUTTON, VIEW,
} from './config.js';
import { INGREDIENTS, RECIPE_BY_ID, countOf } from './recipes.js';
import { drawIcon, drawLayer, drawStationFood, layerHeight } from './food-art.js';
import { doneness, matchedOrder, plateIds } from './kitchen.js';

export function ticketRect(index) {
  return { x: TICKET.firstX + index * (TICKET.width + TICKET.gap), y: TICKET.y, width: TICKET.width, height: TICKET.height };
}

export function binRect(index) {
  return { x: BIN.firstX + index * (BIN.width + BIN.gap), y: BIN.y, width: BIN.width, height: BIN.height };
}

export function slotRect(stationName, index) {
  const area = stationName === 'grill' ? GRILL : FRYER;
  return { x: area.x + 12 + index * 188, y: area.y + 30, width: 172, height: 104 };
}

function rect(ctx, x, y, width, height, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function ellipse(ctx, cx, cy, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, value, x, y, font, fill, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function formatClock(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function drawRoom(ctx, state) {
  // Wall: warm cream tiles with a wainscot line, then the wooden floor.
  rect(ctx, 0, 0, VIEW.width, VIEW.height, '#f3e3c2');
  ctx.strokeStyle = 'rgba(160, 120, 70, 0.16)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 62); ctx.lineTo(x, 262); ctx.stroke();
  }
  for (let y = 94; y <= 262; y += 42) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
  rect(ctx, 0, 622, VIEW.width, VIEW.height - 622, '#7c4f2a');
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  for (let x = 0; x <= VIEW.width; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 622); ctx.lineTo(x - 30, VIEW.height); ctx.stroke();
  }
  void state;
}

function drawHud(ctx, state) {
  rect(ctx, HUD.x, HUD.y, HUD.width, HUD.height, '#33241a');
  rect(ctx, 0, HUD.height - 4, HUD.width, 4, '#c47b4a');
  text(ctx, `DAY ${state.day}`, 28, 41, '700 25px Georgia, serif', '#f7e8cf');
  // Shift clock: a draining bar with the time on top.
  const frac = Math.max(0, state.timeLeft / SHIFT_SECONDS);
  roundRect(ctx, 150, 18, 300, 26, 13, '#57402c');
  if (frac > 0) roundRect(ctx, 150, 18, Math.max(26, 300 * frac), 26, 13, state.timeLeft < 25 ? '#c93b2e' : '#f2b63d');
  text(ctx, `Shift ${formatClock(state.timeLeft)}`, 300, 38, '700 17px system-ui, sans-serif', '#2e1d12', 'center');
  // Coins and combo.
  ellipse(ctx, 520, 31, 13, 13, '#f2b63d');
  text(ctx, 'C', 520, 37, '700 15px Georgia, serif', '#8a5a00', 'center');
  text(ctx, `${state.coins}`, 542, 40, '700 24px system-ui, sans-serif', '#fff6e6');
  if (state.combo >= 2) {
    const pulse = 1 + Math.sin(state.elapsed * 8) * 0.05;
    ctx.save();
    ctx.translate(700, 32);
    ctx.scale(pulse, pulse);
    text(ctx, `COMBO x${state.combo}`, 0, 8, '800 21px system-ui, sans-serif', '#ff9d5c', 'center');
    ctx.restore();
  }
  // Reputation stars.
  for (let i = 0; i < 3; i += 1) {
    drawStar(ctx, 1150 + i * 42, 31, 15, i < state.stars ? '#f2b63d' : 'rgba(255,246,230,0.25)');
  }
  text(ctx, 'reputation', 1211, 56, '600 10px system-ui, sans-serif', 'rgba(255,246,230,0.6)', 'center');
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function patienceColour(frac) {
  if (frac > 0.5) return '#4d9b47';
  if (frac > 0.25) return '#e79b26';
  return '#c93b2e';
}

function drawTicket(ctx, state, order, index) {
  const box = ticketRect(index);
  const recipe = RECIPE_BY_ID[order.recipeId];
  const matched = matchedOrder(state) === order;
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.save();
  if (matched) {
    ctx.shadowColor = 'rgba(242, 182, 61, 0.95)';
    ctx.shadowBlur = 22;
  }
  roundRect(ctx, box.x, box.y, box.width, box.height, 8, '#fff6e6');
  ctx.restore();
  ctx.strokeStyle = matched ? '#f2b63d' : 'rgba(90, 60, 30, 0.35)';
  ctx.lineWidth = matched ? 3 : 1.4;
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.width, box.height, 8);
  ctx.stroke();
  // Pin and ticket header.
  ellipse(ctx, box.x + box.width / 2, box.y + 9, 7, 7, '#c93b2e');
  ellipse(ctx, box.x + box.width / 2 - 2, box.y + 7, 2.4, 2.4, '#ffb3ab');
  text(ctx, recipe.name, box.x + 14, box.y + 36, '700 19px Georgia, serif', '#2e1d12');
  text(ctx, `${recipe.price}c`, box.x + box.width - 14, box.y + 36, '700 17px system-ui, sans-serif', '#9c5a2e', 'right');
  // Ingredient icons, with a tick on the ones already on the plate.
  const onPlate = plateIds(state);
  let ix = box.x + 16;
  const iy = box.y + 74;
  const seen = [];
  for (const id of recipe.items) {
    if (seen.includes(id)) continue;
    seen.push(id);
    const need = countOf(recipe.items, id);
    drawIcon(ctx, id, ix + 15, iy, 25);
    if (need > 1) text(ctx, `x${need}`, ix + 32, iy + 12, '700 13px system-ui, sans-serif', '#2e1d12');
    if (countOf(onPlate, id) >= need) {
      ctx.strokeStyle = '#4d9b47';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ix + 24, iy - 12);
      ctx.lineTo(ix + 29, iy - 6);
      ctx.lineTo(ix + 38, iy - 18);
      ctx.stroke();
    }
    ix += 52;
  }
  text(ctx, recipe.vessel === 'bowl' ? 'served in a bowl' : 'served on a plate', box.x + 14, box.y + 116, 'italic 12.5px Georgia, serif', '#8a6a4a');
  // Patience bar.
  roundRect(ctx, box.x + 14, box.y + 128, box.width - 28, 13, 6, '#e4d3ae');
  if (frac > 0) {
    const flash = frac < 0.25 && Math.sin(state.elapsed * 10) > 0;
    roundRect(ctx, box.x + 14, box.y + 128, Math.max(13, (box.width - 28) * frac), 13, 6, flash ? '#ff5a3c' : patienceColour(frac));
  }
  text(ctx, `${Math.ceil(order.patience)}s`, box.x + box.width - 14, box.y + 122, '700 12px system-ui, sans-serif', patienceColour(frac), 'right');
}

function drawBoard(ctx, state) {
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.width, BOARD.height, 12, '#8a5a33');
  roundRect(ctx, BOARD.x + 8, BOARD.y + 8, BOARD.width - 16, BOARD.height - 16, 9, '#a4713f');
  text(ctx, 'ORDER BOARD', BOARD.x + 22, BOARD.y + 168, '700 12px system-ui, sans-serif', 'rgba(255,246,230,0.75)');
  if (state.orders.length === 0) {
    text(ctx, 'Waiting for customers…', 640, 175, 'italic 600 19px Georgia, serif', 'rgba(255,246,230,0.85)', 'center');
  }
  state.orders.forEach((order, index) => drawTicket(ctx, state, order, index));
  // Chalk writing fills the board's empty stretch.
  if (state.orders.length > 0 && state.orders.length < 4) {
    text(ctx, 'COPPER PAN DINER', 1232, 150, '700 20px Georgia, serif', 'rgba(255,246,230,0.55)', 'right');
    text(ctx, 'fresh · fast · friendly', 1232, 178, 'italic 600 14.5px Georgia, serif', 'rgba(255,246,230,0.45)', 'right');
  }
}

function drawStation(ctx, state, stationName, area, label) {
  roundRect(ctx, area.x, area.y, area.width, area.height, 12, stationName === 'grill' ? '#3d3d44' : '#5b6670');
  roundRect(ctx, area.x, area.y, area.width, 26, 12, stationName === 'grill' ? '#2c2c31' : '#48525b');
  text(ctx, label, area.x + 14, area.y + 19, '700 13.5px system-ui, sans-serif', '#f7e8cf');
  for (let i = 0; i < area.slots; i += 1) {
    const slot = slotRect(stationName, i);
    const item = state.stations[stationName][i];
    roundRect(ctx, slot.x, slot.y, slot.width, slot.height, 9, stationName === 'grill' ? '#55555e' : '#74808a');
    if (stationName === 'grill') {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 3;
      for (let g = 0; g < 4; g += 1) {
        ctx.beginPath();
        ctx.moveTo(slot.x + 14, slot.y + 22 + g * 20);
        ctx.lineTo(slot.x + slot.width - 14, slot.y + 22 + g * 20);
        ctx.stroke();
      }
      // Gas flames flicker under the grate.
      for (let f = 0; f < 5; f += 1) {
        const fx = slot.x + 26 + f * 30;
        const fh = 7 + Math.sin(state.elapsed * 11 + f * 1.7 + i * 3) * 2.6;
        ellipse(ctx, fx, slot.y + slot.height - 7, 6, fh / 2, 'rgba(255, 140, 40, 0.75)');
      }
    } else {
      roundRect(ctx, slot.x + 8, slot.y + 8, slot.width - 16, slot.height - 16, 7, '#8b4d1f');
      roundRect(ctx, slot.x + 8, slot.y + 8, slot.width - 16, 16, 7, '#c97b2e');
    }
    if (item === null) {
      text(ctx, 'empty', slot.x + slot.width / 2, slot.y + slot.height / 2 + 5, '600 14px system-ui, sans-serif', 'rgba(255,246,230,0.5)', 'center');
      continue;
    }
    const stage = doneness(item);
    const cx = slot.x + slot.width / 2;
    const cy = slot.y + slot.height / 2 - 6;
    drawStationFood(ctx, item.id, cx, cy, 62, stage === 'cooking' ? (item.t < 1 ? 'raw' : 'cooking') : stage);
    // Doneness ring: fills while cooking, glows green at perfect, red at burnt.
    const timing = COOKING[stationName];
    const frac = Math.min(1, item.t / timing.burn);
    ctx.strokeStyle = 'rgba(255,246,230,0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx + 62, cy - 26, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = stage === 'perfect' ? '#69d95c' : stage === 'burnt' ? '#c93b2e' : stage === 'cooked' ? '#e79b26' : '#f7e8cf';
    ctx.beginPath();
    ctx.arc(cx + 62, cy - 26, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();
    if (stage === 'perfect') {
      const pulse = 1 + Math.sin(state.elapsed * 9) * 0.12;
      ctx.save();
      ctx.translate(cx, slot.y + 16);
      ctx.scale(pulse, pulse);
      text(ctx, 'PERFECT!', 0, 0, '800 14px system-ui, sans-serif', '#69d95c', 'center');
      ctx.restore();
    } else if (stage === 'cooked') {
      text(ctx, 'READY', cx, slot.y + 16, '800 13px system-ui, sans-serif', '#f2b63d', 'center');
    } else if (stage === 'burnt') {
      text(ctx, 'BURNT', cx, slot.y + 16, '800 13px system-ui, sans-serif', '#ff7a5c', 'center');
      for (let s = 0; s < 3; s += 1) {
        const rise = (state.elapsed * 22 + s * 17) % 34;
        ellipse(ctx, cx - 16 + s * 15, cy - 26 - rise, 6 - rise / 9, 6 - rise / 9, `rgba(70,70,70,${0.5 - rise / 80})`);
      }
    }
  }
}

function drawPlateArea(ctx, state, ui) {
  // The pass: a steel shelf the plate waits on.
  roundRect(ctx, 268, 452, 744, 168, 14, '#9aa3ab');
  roundRect(ctx, 268, 452, 744, 20, 12, '#c3ccd2');
  text(ctx, 'THE PASS — build here', 284, 444, '700 13px system-ui, sans-serif', '#6b5136');
  const shakeX = state.shake > 0 ? Math.sin(state.elapsed * 55) * 6 * state.shake : 0;
  const cx = PLATE.cx + shakeX;
  const cy = PLATE.cy + 58;
  const ids = plateIds(state);
  const isBowl = ids.includes('greens');
  // Plate shadow and body.
  ellipse(ctx, cx, cy + 12, PLATE.radiusX, PLATE.radiusY, 'rgba(0,0,0,0.22)');
  ellipse(ctx, cx, cy, PLATE.radiusX, PLATE.radiusY, '#fdfdf8');
  ellipse(ctx, cx, cy - 3, PLATE.radiusX - 26, PLATE.radiusY - 9, '#e8e8e0');
  if (ids.length === 0) {
    text(ctx, 'plate is empty', cx, cy + 5, 'italic 600 16px Georgia, serif', '#9a9a90', 'center');
  } else if (isBowl) {
    drawBowlStack(ctx, state, cx, cy);
  } else {
    drawPlateStack(ctx, state, cx, cy);
  }
  if (matchedOrder(state) !== null) {
    const pulse = 0.65 + Math.sin(state.elapsed * 6) * 0.3;
    ctx.strokeStyle = `rgba(105, 217, 92, ${pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, PLATE.radiusX + 10, PLATE.radiusY + 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    roundRect(ctx, cx - 118, 408, 236, 34, 17, '#2e7d32');
    text(ctx, 'READY TO SERVE!', cx, 431, '800 17.5px system-ui, sans-serif', '#fff6e6', 'center');
  }
  // Buttons.
  drawButton(ctx, SERVE_BUTTON, 'SERVE  ⏎', matchedOrder(state) !== null ? '#4d9b47' : '#7fae7a', ui.hover === 'serve');
  drawButton(ctx, TRASH_BUTTON, 'Scrap plate', '#b0533f', ui.hover === 'trash');
  drawButton(ctx, UNDO_BUTTON, 'Take back  ⌫', '#8a6a4a', ui.hover === 'undo');
  void ui;
}

function drawPlateStack(ctx, state, cx, cy) {
  const ids = plateIds(state);
  let baseY = cy - 2;
  ids.forEach((id, index) => {
    const width = 196 - index * 7;
    const variant = id === 'bun' ? (index === ids.length - 1 && index > 0 ? 'top' : 'bottom') : 'bottom';
    const height = layerHeight(id, variant);
    const perfect = state.plate[index].perfect;
    if (perfect) {
      ctx.save();
      ctx.shadowColor = 'rgba(242, 182, 61, 0.9)';
      ctx.shadowBlur = 13;
      drawLayer(ctx, id, cx, baseY, width, variant);
      ctx.restore();
    } else {
      drawLayer(ctx, id, cx, baseY, width, variant);
    }
    baseY -= height * 0.58;
  });
}

function drawBowlStack(ctx, state, cx, cy) {
  // Bowl first (its rim), then the tossed contents mounded inside, then the
  // bowl's front so the food looks tucked in.
  ctx.fillStyle = '#7fb3c8';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 6, 128, 34, 0, 0, Math.PI);
  ctx.fill();
  const ids = plateIds(state);
  let baseY = cy - 12;
  ids.forEach((id, index) => {
    const height = layerHeight(id, 'bottom');
    drawLayer(ctx, id, cx, baseY, 168 - index * 9, 'bottom');
    baseY -= height * 0.45;
  });
  ctx.fillStyle = '#8fc3d8';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 132, 23, 0, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();
  ellipse(ctx, cx, cy + 16, 60, 10, '#6d9db2');
}

function drawButton(ctx, box, label, fill, hover) {
  ctx.save();
  if (hover) {
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 12;
  }
  roundRect(ctx, box.x, box.y, box.width, box.height, 12, fill);
  ctx.restore();
  roundRect(ctx, box.x, box.y, box.width, 10, 6, 'rgba(255,255,255,0.25)');
  text(ctx, label, box.x + box.width / 2, box.y + box.height / 2 + 7, '800 19px system-ui, sans-serif', '#fff6e6', 'center');
}

function drawCounter(ctx, state, ui) {
  roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.width, COUNTER.height, 12, '#8a5a33');
  roundRect(ctx, COUNTER.x, COUNTER.y, COUNTER.width, 14, 10, '#c47b4a');
  INGREDIENTS.forEach((ingredient, index) => {
    const box = binRect(index);
    const hover = ui.hoverBin === index;
    roundRect(ctx, box.x, box.y, box.width, box.height, 10, hover ? '#fff1d6' : '#f7e8cf');
    ctx.strokeStyle = 'rgba(90, 60, 30, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.width, box.height, 10);
    ctx.stroke();
    drawIcon(ctx, ingredient.id, box.x + box.width / 2, box.y + 40, 40);
    text(ctx, ingredient.name, box.x + box.width / 2, box.y + 86, '700 15.5px system-ui, sans-serif', '#2e1d12', 'center');
    if (ingredient.cook !== null) {
      text(ctx, ingredient.cook === 'grill' ? 'grill first' : 'fry first', box.x + box.width / 2, box.y + 106, 'italic 600 11.5px Georgia, serif', '#b0533f', 'center');
    }
    // Key hint chip in the bin's top-right corner.
    roundRect(ctx, box.x + box.width - 27, box.y + 7, 20, 18, 5, '#33241a');
    text(ctx, ingredient.key, box.x + box.width - 17, box.y + 20.5, '700 12px system-ui, sans-serif', '#f7e8cf', 'center');
  });
  void state;
}

function drawPopups(ctx, state) {
  for (const popup of state.popups) {
    const frac = popup.t / popup.life;
    ctx.save();
    ctx.globalAlpha = 1 - frac * frac;
    text(ctx, popup.text, popup.x, popup.y - frac * 56, '800 25px system-ui, sans-serif', popup.colour, 'center');
    ctx.restore();
  }
  if (state.message !== null) {
    const alpha = state.message.t < 0.15 ? state.message.t / 0.15 : state.message.t > state.message.life - 0.4 ? Math.max(0, (state.message.life - state.message.t) / 0.4) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    const width = ctx.measureText(state.message.text).width;
    void width;
    roundRect(ctx, 640 - 190, 268, 380, 34, 17, 'rgba(46, 29, 18, 0.88)');
    text(ctx, state.message.text, 640, 291, '700 16.5px system-ui, sans-serif', '#fff6e6', 'center');
    ctx.restore();
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(36, 22, 12, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  roundRect(ctx, 340, 150, 600, 470, 20, '#fff6e6');
  ctx.strokeStyle = '#c47b4a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(340, 150, 600, 470, 20);
  ctx.stroke();
  text(ctx, 'COPPER PAN', 640, 248, '700 57px Georgia, serif', '#9c5a2e', 'center');
  text(ctx, 'DINER', 640, 312, '700 57px Georgia, serif', '#c93b2e', 'center');
  text(ctx, 'a cozy cooking game', 640, 352, 'italic 600 20px Georgia, serif', '#8a6a4a', 'center');
  const lines = [
    'Tickets pin up on the order board — build each dish',
    'on the plate before its patience bar runs out.',
    'Click ingredients (or keys 1-0) to stack them.',
    'Patties, eggs and bacon go on the GRILL, potatoes',
    'in the FRYER — catch them at PERFECT for a bonus.',
    'Serve with the SERVE button or Enter. Three walk-outs',
    'and the day is done. Good luck, chef!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 396 + i * 24, '600 17.5px system-ui, sans-serif', '#2e1d12', 'center'));
  const pulse = 0.75 + Math.sin(state.elapsed * 5) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  roundRect(ctx, 490, 556, 300, 52, 14, '#4d9b47');
  text(ctx, 'OPEN THE DINER', 640, 590, '800 20px system-ui, sans-serif', '#fff6e6', 'center');
  ctx.restore();
}

function drawDayEnd(ctx, state) {
  ctx.fillStyle = 'rgba(36, 22, 12, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  roundRect(ctx, 390, 190, 500, 400, 18, '#fff6e6');
  text(ctx, `Day ${state.day} complete!`, 640, 262, '700 38px Georgia, serif', '#9c5a2e', 'center');
  const rows = [
    ['Dishes served', `${state.servedToday}`],
    ['Customers lost', `${state.missedToday}`],
    ['Best combo', `x${Math.max(1, state.bestCombo)}`],
    ['Coins today', `${state.coinsToday}c`],
    ['Total coins', `${state.coins}c`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 460, 322 + i * 42, '600 19px system-ui, sans-serif', '#2e1d12');
    text(ctx, value, 820, 322 + i * 42, '700 19px system-ui, sans-serif', '#9c5a2e', 'right');
  });
  text(ctx, 'Tomorrow the tickets come faster…', 640, 548, 'italic 600 16px Georgia, serif', '#8a6a4a', 'center');
  roundRect(ctx, 490, 566 - 40, 300, 52, 14, '#4d9b47');
  text(ctx, `START DAY ${state.day + 1}`, 640, 566 - 6, '800 20px system-ui, sans-serif', '#fff6e6', 'center');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(30, 14, 10, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  roundRect(ctx, 390, 200, 500, 380, 18, '#fff6e6');
  text(ctx, 'CLOSED EARLY', 640, 272, '700 40px Georgia, serif', '#c93b2e', 'center');
  text(ctx, 'Three customers walked out hungry.', 640, 312, 'italic 600 17px Georgia, serif', '#8a6a4a', 'center');
  const rows = [
    ['Days survived', `${state.day}`],
    ['Dishes served', `${state.totalServed}`],
    ['Best combo', `x${Math.max(1, state.bestCombo)}`],
    ['Total coins', `${state.coins}c`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 460, 362 + i * 42, '600 19px system-ui, sans-serif', '#2e1d12');
    text(ctx, value, 820, 362 + i * 42, '700 19px system-ui, sans-serif', '#9c5a2e', 'right');
  });
  roundRect(ctx, 490, 540 - 14, 300, 52, 14, '#c93b2e');
  text(ctx, 'TRY AGAIN', 640, 540 + 20, '800 20px system-ui, sans-serif', '#fff6e6', 'center');
}

/** Draw the whole scene for the current state. */
export function drawScene(ctx, state, ui) {
  drawRoom(ctx, state);
  drawHud(ctx, state);
  drawBoard(ctx, state);
  drawStation(ctx, state, 'grill', GRILL, 'GRILL — click food when it is PERFECT');
  drawStation(ctx, state, 'fryer', FRYER, 'FRYER — click food when it is PERFECT');
  drawPlateArea(ctx, state, ui);
  drawCounter(ctx, state, ui);
  drawPopups(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'dayEnd') drawDayEnd(ctx, state);
  else if (state.screen === 'gameOver') drawGameOver(ctx, state);
}
