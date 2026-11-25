// Copper Pan Diner — food art. Every ingredient is drawn with canvas paths
// in code (no image files): a layer form for stacking on the plate, a small
// icon form for the bins and order tickets, and a station form that shows
// raw, cooking, perfect and burnt states on the grill and in the fryer.

/** How tall one stacked layer of an ingredient is, in play-field pixels. */
export function layerHeight(id, variant) {
  switch (id) {
    case 'bun': return variant === 'top' ? 36 : 18;
    case 'bread': return 17;
    case 'patty': return 21;
    case 'cheese': return 12;
    case 'lettuce': return 15;
    case 'tomato': return 14;
    case 'egg': return 18;
    case 'bacon': return 13;
    case 'potato': return 38;
    case 'greens': return 26;
    default: return 16;
  }
}

function ellipse(ctx, cx, cy, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

/** A wavy horizontal band (lettuce, bacon) between two rows of sine bumps. */
function wavyBand(ctx, cx, baseY, width, height, fill, waves = 6, amp = 4) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  const left = cx - width / 2;
  ctx.moveTo(left, baseY);
  for (let i = 0; i <= waves; i += 1) {
    const x = left + (width / waves) * i;
    ctx.lineTo(x, baseY - height + (i % 2 === 0 ? 0 : amp));
  }
  for (let i = waves; i >= 0; i -= 1) {
    const x = left + (width / waves) * i;
    ctx.lineTo(x, baseY - (i % 2 === 0 ? amp : 0));
  }
  ctx.closePath();
  ctx.fill();
}

function sesameSeeds(ctx, cx, topY, width) {
  ctx.fillStyle = '#ffe9b8';
  const spots = [[-0.3, 0.35], [-0.08, 0.15], [0.16, 0.3], [0.32, 0.55], [-0.18, 0.62], [0.02, 0.5]];
  for (const [fx, fy] of spots) {
    ctx.beginPath();
    ctx.ellipse(cx + fx * width, topY + fy * 22, 4.4, 2.6, fx * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBun(ctx, cx, baseY, width, variant) {
  if (variant === 'top') {
    const height = 36;
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath();
    ctx.moveTo(cx - width / 2, baseY);
    ctx.quadraticCurveTo(cx - width / 2, baseY - height, cx, baseY - height);
    ctx.quadraticCurveTo(cx + width / 2, baseY - height, cx + width / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 214, 140, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx - width * 0.18, baseY - height + 8, width * 0.26, 7, -0.15, 0, Math.PI * 2);
    ctx.fill();
    sesameSeeds(ctx, cx, baseY - height + 4, width);
    return height;
  }
  roundRect(ctx, cx - width / 2, baseY - 18, width, 18, 8, '#eeb45e');
  roundRect(ctx, cx - width / 2, baseY - 18, width, 7, 4, '#f7cd82');
  return 18;
}

function drawBread(ctx, cx, baseY, width) {
  roundRect(ctx, cx - width / 2, baseY - 17, width, 17, 7, '#c98d4e');
  roundRect(ctx, cx - width / 2 + 5, baseY - 14, width - 10, 11, 5, '#f3d9a4');
  return 17;
}

function drawPatty(ctx, cx, baseY, width, tone = '#7a4326') {
  roundRect(ctx, cx - width / 2, baseY - 21, width, 21, 10, tone);
  ctx.strokeStyle = 'rgba(46, 24, 10, 0.5)';
  ctx.lineWidth = 2.4;
  for (const fx of [-0.26, 0, 0.26]) {
    ctx.beginPath();
    ctx.moveTo(cx + fx * width - 7, baseY - 17);
    ctx.lineTo(cx + fx * width + 7, baseY - 5);
    ctx.stroke();
  }
  return 21;
}

function drawCheese(ctx, cx, baseY, width) {
  ctx.fillStyle = '#f6a821';
  ctx.beginPath();
  const left = cx - width / 2 - 4;
  const right = cx + width / 2 + 4;
  ctx.moveTo(left, baseY - 11);
  ctx.lineTo(right, baseY - 11);
  ctx.lineTo(right - 12, baseY - 1);
  ctx.quadraticCurveTo(right - 26, baseY + 5, right - 38, baseY - 2);
  ctx.lineTo(cx + 16, baseY - 3);
  ctx.quadraticCurveTo(cx, baseY + 4, cx - 18, baseY - 2);
  ctx.lineTo(left + 12, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 205, 92, 0.8)';
  ctx.fillRect(left + 8, baseY - 10, width - 12, 3.4);
  return 12;
}

function drawTomato(ctx, cx, baseY, width) {
  ellipse(ctx, cx, baseY - 7, width / 2, 7.5, '#d8402f');
  ellipse(ctx, cx, baseY - 7, width / 2 - 7, 5, '#ef6a52');
  ctx.fillStyle = '#f7a08d';
  for (const fx of [-0.24, 0.02, 0.27]) ellipse(ctx, cx + fx * width, baseY - 7, 3, 2.1, '#f7a08d');
  return 14;
}

function drawEgg(ctx, cx, baseY, width) {
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 8, width * 0.42, 8.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx - width * 0.2, baseY - 6, width * 0.2, 5.5, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + width * 0.22, baseY - 6, width * 0.18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ellipse(ctx, cx + width * 0.05, baseY - 8, 10.5, 7.6, '#f79c1d');
  ellipse(ctx, cx + width * 0.02, baseY - 10, 4, 2.8, '#ffc45e');
  return 18;
}

function drawBacon(ctx, cx, baseY, width) {
  for (const offset of [-9, 3]) {
    wavyBand(ctx, cx + offset * 0.4, baseY + offset * 0.32, width * 0.92, 9, '#a83a2c', 5, 3.4);
    ctx.strokeStyle = 'rgba(255, 190, 160, 0.75)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.4 + offset * 0.4, baseY - 3 + offset * 0.32);
    ctx.quadraticCurveTo(cx + offset * 0.4, baseY - 8 + offset * 0.32, cx + width * 0.4 + offset * 0.4, baseY - 3 + offset * 0.32);
    ctx.stroke();
  }
  return 13;
}

function drawFries(ctx, cx, baseY, width) {
  ctx.fillStyle = '#f7c948';
  const sticks = [-0.34, -0.2, -0.06, 0.08, 0.22, 0.35];
  for (let i = 0; i < sticks.length; i += 1) {
    const x = cx + sticks[i] * width;
    const tall = 26 + ((i * 7) % 9);
    ctx.save();
    ctx.translate(x, baseY - 12);
    ctx.rotate(sticks[i] * 0.35);
    ctx.fillRect(-4.4, -tall, 8.8, tall);
    ctx.restore();
  }
  ctx.fillStyle = '#c93b2e';
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.34, baseY - 20);
  ctx.lineTo(cx + width * 0.34, baseY - 20);
  ctx.lineTo(cx + width * 0.27, baseY);
  ctx.lineTo(cx - width * 0.27, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff6e6';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 20, width * 0.2, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  return 38;
}

function drawGreens(ctx, cx, baseY, width) {
  const leaves = [[-0.3, 4, 0.30], [-0.1, 0, 0.36], [0.12, 1, 0.34], [0.3, 5, 0.28], [0, 6, 0.3], [-0.2, 8, 0.26], [0.2, 9, 0.24]];
  for (const [fx, up, s] of leaves) {
    ellipse(ctx, cx + fx * width, baseY - 8 - up, width * s * 0.62, 10.5, up % 2 === 0 ? '#57a047' : '#6cb85a');
  }
  ctx.strokeStyle = 'rgba(30, 84, 32, 0.45)';
  ctx.lineWidth = 1.6;
  for (const [fx, up] of leaves.slice(0, 4)) {
    ctx.beginPath();
    ctx.moveTo(cx + fx * width - 8, baseY - 6 - up);
    ctx.quadraticCurveTo(cx + fx * width, baseY - 14 - up, cx + fx * width + 8, baseY - 6 - up);
    ctx.stroke();
  }
  return 26;
}

/**
 * Draw one ingredient as a plate layer centred at cx with its bottom on
 * baseY; returns the layer's height so the caller can stack the next one.
 * `variant` matters for bun: 'bottom' or 'top'.
 */
export function drawLayer(ctx, id, cx, baseY, width, variant = 'bottom') {
  switch (id) {
    case 'bun': return drawBun(ctx, cx, baseY, width, variant);
    case 'bread': return drawBread(ctx, cx, baseY, width);
    case 'patty': return drawPatty(ctx, cx, baseY, width);
    case 'cheese': return drawCheese(ctx, cx, baseY, width);
    case 'lettuce': wavyBand(ctx, cx, baseY, width + 14, 15, '#69b84f', 7, 5); return 15;
    case 'tomato': return drawTomato(ctx, cx, baseY, width);
    case 'egg': return drawEgg(ctx, cx, baseY, width);
    case 'bacon': return drawBacon(ctx, cx, baseY, width);
    case 'potato': return drawFries(ctx, cx, baseY, width * 0.8);
    case 'greens': return drawGreens(ctx, cx, baseY, width);
    default: return 16;
  }
}

/** A small standalone icon of an ingredient, centred at (cx, cy). */
export function drawIcon(ctx, id, cx, cy, size) {
  ctx.save();
  ctx.translate(cx, cy + size * 0.45);
  const unit = size / 40;
  ctx.scale(unit, unit);
  drawLayer(ctx, id, 0, 0, 46, id === 'bun' ? 'top' : 'bottom');
  ctx.restore();
}

/**
 * Food on a cooking station. `state` is 'raw', 'cooking', 'perfect' or
 * 'burnt'; the drawing changes colour and detail so the player can read the
 * station at a glance. Drawn centred at (cx, cy) inside a slot of `size`.
 */
export function drawStationFood(ctx, id, cx, cy, size, state) {
  const width = size * 1.15;
  const baseY = cy + size * 0.32;
  if (id === 'patty') {
    const tone = state === 'raw' ? '#c96a5e' : state === 'burnt' ? '#2b1c14' : '#7a4326';
    drawPatty(ctx, cx, baseY, width, tone);
    return;
  }
  if (id === 'bacon') {
    if (state === 'burnt') {
      wavyBand(ctx, cx, baseY, width, 9, '#2b1c14', 5, 3);
      return;
    }
    if (state === 'raw') {
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawBacon(ctx, cx, baseY, width);
      ctx.restore();
      return;
    }
    drawBacon(ctx, cx, baseY, width);
    return;
  }
  if (id === 'egg') {
    if (state === 'burnt') {
      ellipse(ctx, cx, baseY - 8, width * 0.4, 8, '#3a2a1a');
      ellipse(ctx, cx, baseY - 8, 9, 6, '#5e3c14');
      return;
    }
    ctx.fillStyle = state === 'raw' ? 'rgba(255, 253, 244, 0.65)' : '#fffdf4';
    ctx.beginPath();
    ctx.ellipse(cx, baseY - 8, width * 0.42, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ellipse(ctx, cx, baseY - 8, 10.5, 7.6, state === 'raw' ? '#f7b733' : '#f79c1d');
    return;
  }
  if (id === 'potato') {
    // In the fryer the sticks sit in a dark basket under bubbling oil.
    roundRect(ctx, cx - width / 2, baseY - 16, width, 18, 4, '#4c4c55');
    ctx.fillStyle = state === 'burnt' ? '#4a3418' : '#f7c948';
    for (const fx of [-0.3, -0.12, 0.06, 0.24]) {
      ctx.fillRect(cx + fx * width - 4, baseY - 30, 8, 18);
    }
    ctx.fillStyle = 'rgba(255, 226, 130, 0.75)';
    for (const fx of [-0.22, 0.02, 0.28]) ellipse(ctx, cx + fx * width, baseY - 13, 3.4, 2.4, 'rgba(255,226,130,0.75)');
    return;
  }
  drawLayer(ctx, id, cx, baseY, width);
}
