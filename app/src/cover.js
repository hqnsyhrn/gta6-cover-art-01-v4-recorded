// Neon Coast cover renderer: draws every layout, grade and lettering block onto
// a 2D canvas. Pure drawing code — no network, no DOM reads besides the canvas
// it is handed. All art is the caller's own photos; all lettering is Anton and
// Pacifico, shipped under the SIL Open Font License in app/fonts/.

export const GRADES = {
  sunset: {
    label: 'Sunset',
    titleStops: ['#ffd76a', '#ff5e8a', '#ff7a18'],
    washTop: 'rgba(255, 94, 138, 0.20)',
    washBottom: 'rgba(255, 122, 24, 0.28)',
    tint: 'rgba(255, 120, 60, 0.10)',
    frame: '#fff4e0',
  },
  neon: {
    label: 'Neon',
    titleStops: ['#7df9e8', '#ff2e88', '#b967ff'],
    washTop: 'rgba(45, 226, 197, 0.16)',
    washBottom: 'rgba(255, 46, 136, 0.30)',
    tint: 'rgba(80, 40, 255, 0.12)',
    frame: '#eafcff',
  },
  gold: {
    label: 'Gold Hour',
    titleStops: ['#fff3b0', '#ffc93c', '#ff8a00'],
    washTop: 'rgba(255, 201, 60, 0.20)',
    washBottom: 'rgba(255, 138, 0, 0.30)',
    tint: 'rgba(255, 180, 40, 0.10)',
    frame: '#fff8e1',
  },
  vice: {
    label: 'Vice Nights',
    titleStops: ['#c9b8ff', '#ff5ea8', '#2de2c5'],
    washTop: 'rgba(120, 60, 255, 0.22)',
    washBottom: 'rgba(255, 46, 136, 0.26)',
    tint: 'rgba(40, 20, 120, 0.16)',
    frame: '#efe9ff',
  },
  teal: {
    label: 'Teal Dusk',
    titleStops: ['#d8fff6', '#2de2c5', '#1f8fff'],
    washTop: 'rgba(45, 226, 197, 0.18)',
    washBottom: 'rgba(31, 143, 255, 0.30)',
    tint: 'rgba(20, 120, 160, 0.12)',
    frame: '#e6fbff',
  },
  warm: {
    label: 'Warm Mono',
    titleStops: ['#ffffff', '#ffd9a0', '#c97b2e'],
    washTop: 'rgba(255, 220, 170, 0.16)',
    washBottom: 'rgba(160, 90, 20, 0.30)',
    tint: 'rgba(120, 70, 20, 0.10)',
    frame: '#fdf3e3',
  },
};

export const LAYOUTS = {
  'poster-hero': { label: 'Poster Hero', hero: true },
  'hero-8': { label: 'Hero + 8', hero: true },
  'hero-3': { label: 'Hero + 3', hero: true },
  'grid-9': { label: '9-Panel Grid', hero: false },
  'full-bleed': { label: 'Full-Bleed', hero: true },
  tilted: { label: 'Tilted Snaps', hero: true },
  classic: { label: 'Classic Poster', hero: false },
};

// Panel rectangles for a layout, in canvas pixels. Every layout returns nine
// slots; layouts that show fewer photos leave the extra rects null.
export function layoutRects(layout, W, H) {
  const gap = Math.max(3, Math.round(W * 0.004));
  const rects = new Array(9).fill(null);
  const inset = (r) => ({ x: r.x + gap / 2, y: r.y + gap / 2, w: r.w - gap, h: r.h - gap, rot: r.rot || 0 });
  if (layout === 'poster-hero') {
    rects[0] = inset({ x: 0, y: 0, w: W, h: H * 0.62 });
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      rects[i + 1] = inset({ x: (W / 4) * col, y: H * 0.62 + (H * 0.19) * row, w: W / 4, h: H * 0.19 });
    }
  } else if (layout === 'hero-8') {
    rects[0] = inset({ x: 0, y: 0, w: W * 0.58, h: H });
    for (let i = 0; i < 8; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      rects[i + 1] = inset({ x: W * 0.58 + (W * 0.21) * col, y: (H / 4) * row, w: W * 0.21, h: H / 4 });
    }
  } else if (layout === 'hero-3') {
    rects[0] = inset({ x: 0, y: 0, w: W, h: H * 0.7 });
    for (let i = 0; i < 3; i++) {
      rects[i + 1] = inset({ x: (W / 3) * i, y: H * 0.7, w: W / 3, h: H * 0.3 });
    }
  } else if (layout === 'grid-9') {
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      rects[i] = inset({ x: (W / 3) * col, y: (H / 3) * row, w: W / 3, h: H / 3 });
    }
  } else if (layout === 'full-bleed') {
    rects[0] = { x: 0, y: 0, w: W, h: H, rot: 0 };
  } else if (layout === 'tilted') {
    rects[0] = inset({ x: W * 0.24, y: H * 0.10, w: W * 0.52, h: H * 0.58, rot: -0.05 });
    rects[1] = inset({ x: W * 0.03, y: H * 0.05, w: W * 0.26, h: H * 0.34, rot: -0.12 });
    rects[2] = inset({ x: W * 0.71, y: H * 0.06, w: W * 0.26, h: H * 0.34, rot: 0.11 });
    rects[3] = inset({ x: W * 0.06, y: H * 0.58, w: W * 0.26, h: H * 0.34, rot: 0.09 });
    rects[4] = inset({ x: W * 0.68, y: H * 0.58, w: W * 0.26, h: H * 0.34, rot: -0.09 });
  } else if (layout === 'classic') {
    const f = Math.round(W * 0.028);
    const innerW = W - f * 2;
    const innerH = H - f * 2;
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      rects[i] = inset({
        x: f + (innerW / 3) * col,
        y: f + innerH * 0.17 + (innerH * 0.83 / 3) * row,
        w: innerW / 3,
        h: innerH * 0.83 / 3,
      });
    }
  }
  return rects;
}

// Where the title block sits for a layout: the hero rect, or the classic band.
export function titleZone(layout, W, H) {
  if (layout === 'classic') return { x: 0, y: H * 0.015, w: W, h: H * 0.15, band: true };
  if (layout === 'grid-9') return { x: 0, y: H * 0.66, w: W, h: H * 0.34, band: false };
  if (layout === 'tilted') return { x: 0, y: H * 0.68, w: W, h: H * 0.30, band: false };
  if (layout === 'hero-8') return { x: 0, y: H * 0.62, w: W * 0.58, h: H * 0.36, band: false };
  if (layout === 'hero-3') return { x: 0, y: H * 0.40, w: W, h: H * 0.30, band: false };
  if (layout === 'full-bleed') return { x: 0, y: H * 0.58, w: W, h: H * 0.40, band: false };
  return { x: 0, y: H * 0.34, w: W, h: H * 0.28, band: false }; // poster-hero
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawPhotoCover(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = panel?.zoom ?? 1;
  const fx = panel?.x ?? 0.5;
  const fy = panel?.y ?? 0.5;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) * fx;
  const dy = rect.y + (rect.h - dh) * fy;
  ctx.save();
  ctx.beginPath();
  if (rect.rot) {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.rect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.clip();
    ctx.drawImage(img, dx - (rect.x + rect.w / 2), dy - (rect.y + rect.h / 2), dw, dh);
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

function drawHalftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, Math.round(w / 46));
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = step * 0.16 * (1 - (yy - y) / h * 0.5);
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, state, W, H, grade) {
  const zone = titleZone(state.layout, W, H);
  const title = (state.title || 'SUNSET DUO').toUpperCase();
  const tagline = (state.tagline || '').toUpperCase();
  const script = state.script || '';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (zone.band) {
    ctx.fillStyle = '#14091d';
    ctx.fillRect(0, 0, W, H * 0.17);
    drawHalftone(ctx, 0, 0, W, H * 0.17, 'rgba(255,255,255,0.10)');
  } else {
    const scrim = ctx.createLinearGradient(0, zone.y, 0, zone.y + zone.h);
    scrim.addColorStop(0, 'rgba(0,0,0,0)');
    scrim.addColorStop(0.45, 'rgba(0,0,0,0.42)');
    scrim.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = scrim;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    drawHalftone(ctx, zone.x, zone.y + zone.h * 0.1, zone.w, zone.h * 0.9, 'rgba(255,255,255,0.07)');
  }

  const cx = zone.x + zone.w / 2;
  let cursorY = zone.y + zone.h * 0.30;
  if (script) {
    const spx = fitFont(ctx, script, zone.w * 0.5, Math.round(H * 0.045), 'Pacifico, cursive');
    ctx.font = `${spx}px Pacifico, cursive`;
    ctx.fillStyle = '#8ef5e2';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = Math.round(H * 0.008);
    ctx.fillText(script, cx, cursorY);
    ctx.shadowBlur = 0;
    cursorY += spx * 0.9;
  }
  const tpx = fitFont(ctx, title, zone.w * 0.94, Math.round(H * 0.115), 'Anton, sans-serif');
  ctx.font = `${tpx}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(tpx * 0.02)}px`; } catch (_) { /* older canvas */ }
  const grad = ctx.createLinearGradient(cx - zone.w * 0.4, 0, cx + zone.w * 0.4, 0);
  grad.addColorStop(0, grade.titleStops[0]);
  grad.addColorStop(0.5, grade.titleStops[1]);
  grad.addColorStop(1, grade.titleStops[2]);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, tpx * 0.045);
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = Math.round(tpx * 0.12);
  ctx.shadowOffsetY = Math.round(tpx * 0.04);
  ctx.strokeText(title, cx, cursorY + tpx * 0.42);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, cursorY + tpx * 0.42);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  try { ctx.letterSpacing = '0px'; } catch (_) { /* older canvas */ }

  if (tagline) {
    const gpx = fitFont(ctx, tagline, zone.w * 0.86, Math.round(H * 0.032), 'Anton, sans-serif');
    ctx.font = `${gpx}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(gpx * 0.14)}px`; } catch (_) { /* older canvas */ }
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = Math.max(2, gpx * 0.14);
    ctx.strokeText(tagline, cx, cursorY + tpx * 0.95);
    ctx.fillText(tagline, cx, cursorY + tpx * 0.95);
    try { ctx.letterSpacing = '0px'; } catch (_) { /* older canvas */ }
  }
  ctx.restore();
}

function drawStars(ctx, W, H) {
  ctx.save();
  ctx.font = `${Math.round(H * 0.032)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffc93c';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(2, H * 0.003);
  const label = '★★★★★';
  ctx.strokeText(label, W * 0.02, H * 0.02);
  ctx.fillText(label, W * 0.02, H * 0.02);
  ctx.restore();
}

function drawBadge(ctx, W, H) {
  ctx.save();
  const bw = W * 0.16;
  const bh = H * 0.055;
  ctx.translate(W - bw / 2 - W * 0.015, H * 0.055);
  ctx.rotate(0.06);
  ctx.fillStyle = '#ff2e88';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, H * 0.003);
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(bh * 0.42)}px Anton, sans-serif`;
  ctx.fillText('NEON COAST', 0, -bh * 0.12);
  ctx.font = `${Math.round(bh * 0.28)}px Anton, sans-serif`;
  ctx.fillText('EST. 2026', 0, bh * 0.26);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawGrain(ctx, W, H) {
  const rand = mulberry32(20261119);
  const count = Math.round((W * H) / 1400);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rand() * W, rand() * H, 1.6, 1.6);
  }
  ctx.restore();
}

// Draw the whole cover onto ctx (already sized to W x H). images maps a photo
// path to a loaded HTMLImageElement; missing photos paint a dark placeholder.
export function drawCover(ctx, images, state, W, H) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  ctx.fillStyle = '#14091d';
  ctx.fillRect(0, 0, W, H);

  if (state.layout === 'classic') {
    ctx.fillStyle = grade.frame;
    ctx.fillRect(0, 0, W, H);
  }

  const rects = layoutRects(state.layout, W, H);
  rects.forEach((rect, i) => {
    if (!rect) return;
    const panel = state.panels[i];
    const img = panel && images[panel.src];
    if (img) {
      drawPhotoCover(ctx, img, rect, panel);
    } else {
      ctx.save();
      ctx.fillStyle = '#2d1538';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    if (rect.rot) {
      ctx.save();
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      ctx.restore();
    }
  });

  // Sunset / neon colour grade as two soft washes over the photos.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (state.layout === 'tilted') {
    ctx.save();
    ctx.fillStyle = 'rgba(20,9,29,0.25)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawTitleBlock(ctx, state, W, H, grade);
  if (state.stars) drawStars(ctx, W, H);
  if (state.badge) drawBadge(ctx, W, H);
  if (state.vignette !== false) drawVignette(ctx, W, H);
  if (state.grain !== false) drawGrain(ctx, W, H);
  ctx.restore();
}

// Render a fresh canvas at the requested size. Used by the live preview, the
// PNG export and the screenshot scenes alike, so all three show the same art.
export function renderCover(images, state, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), images, state, W, H);
  return canvas;
}
