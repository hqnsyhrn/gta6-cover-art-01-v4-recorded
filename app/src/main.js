// Neon Coast — Duo Hero Cover Studio: editor state, controls and export.
// Photos stay on the machine: samples load from app/samples/, uploads are read
// with FileReader and never sent anywhere. The cover on screen, the PNG export
// and the screenshots all go through the same drawCover in cover.js.

import { GRADES, LAYOUTS, drawCover, layoutRects, renderCover } from './cover.js';
import { applyShot } from './shots.js';

export const SAMPLES = [
  'duo-convertible', 'duo-hood', 'woman-neon', 'woman-car', 'woman-rooftop',
  'man-rooftop', 'neon-marina', 'harbour-night', 'beach-tower', 'skyline-dusk',
  'motel-dusk', 'diner-neon', 'rooftop-sunset', 'convertible-golden',
  'pier-sunset', 'boulevard-palms', 'street-neon',
];

const SAMPLE_LABELS = {
  'duo-convertible': 'Duo · convertible sunset',
  'duo-hood': 'Duo · laughing on the hood',
  'woman-neon': 'Woman · neon marina',
  'woman-car': 'Woman · golden convertible',
  'woman-rooftop': 'Woman · sunset rooftop',
  'man-rooftop': 'Man · rooftop dusk',
  'neon-marina': 'Neon marina',
  'harbour-night': 'Harbour night',
  'beach-tower': 'Beach lifeguard tower',
  'skyline-dusk': 'Skyline at dusk',
  'motel-dusk': 'Motel at dusk',
  'diner-neon': 'Friends · neon diner',
  'rooftop-sunset': 'Rooftop pool sunset',
  'convertible-golden': 'Convertible · golden hour',
  'pier-sunset': 'Pier fisherman sunset',
  'boulevard-palms': 'Palm boulevard',
  'street-neon': 'Rainy neon street',
};

function panelsFrom(names) {
  return names.map((name) => ({ src: `samples/${name}.jpg`, zoom: 1.15, x: 0.5, y: 0.45 }));
}

export const PRESETS = [
  {
    id: 'sunset-duo', label: 'Sunset Duo', layout: 'poster-hero', grade: 'sunset',
    title: 'SUNSET DUO', tagline: 'TWO OUTLAWS. ONE SUNSET.', script: 'Neon Coast',
    photos: ['duo-convertible', 'duo-hood', 'beach-tower', 'skyline-dusk', 'neon-marina',
      'woman-car', 'convertible-golden', 'boulevard-palms', 'pier-sunset'],
  },
  {
    id: 'neon-harbour', label: 'Neon Harbour', layout: 'poster-hero', grade: 'neon',
    title: 'NEON HARBOUR', tagline: 'EVERY LIGHT HAS A SECRET.', script: 'Neon Coast',
    photos: ['woman-neon', 'neon-marina', 'harbour-night', 'diner-neon', 'street-neon',
      'man-rooftop', 'rooftop-sunset', 'motel-dusk', 'skyline-dusk'],
  },
  {
    id: 'sunset-chase', label: 'Sunset Chase', layout: 'hero-3', grade: 'gold',
    title: 'SUNSET CHASE', tagline: 'CATCH THE LAST LIGHT.', script: 'Neon Coast',
    photos: ['woman-car', 'convertible-golden', 'boulevard-palms', 'beach-tower',
      'duo-convertible', 'pier-sunset', 'skyline-dusk', 'rooftop-sunset', 'motel-dusk'],
  },
  {
    id: 'gold-hour', label: 'Gold Hour', layout: 'classic', grade: 'gold',
    title: 'GOLD HOUR', tagline: 'ONE CITY. ONE GOLDEN HOUR.', script: 'Neon Coast',
    photos: ['woman-rooftop', 'rooftop-sunset', 'skyline-dusk', 'beach-tower',
      'boulevard-palms', 'convertible-golden', 'pier-sunset', 'duo-hood', 'harbour-night'],
  },
  {
    id: 'vice-nights', label: 'Vice Nights', layout: 'hero-8', grade: 'vice',
    title: 'VICE NIGHTS', tagline: 'THE CITY NEVER SLEEPS.', script: 'Neon Coast',
    photos: ['man-rooftop', 'street-neon', 'diner-neon', 'neon-marina', 'harbour-night',
      'woman-neon', 'motel-dusk', 'rooftop-sunset', 'skyline-dusk'],
  },
];

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
  '1080x1920': [1080, 1920],
};

function freshState() {
  const preset = PRESETS[0];
  return {
    preset: preset.id,
    layout: preset.layout,
    grade: preset.grade,
    title: preset.title,
    tagline: preset.tagline,
    script: preset.script,
    size: '1920x1080',
    stars: true,
    badge: true,
    grain: true,
    vignette: true,
    selected: 0,
    panels: panelsFrom(preset.photos),
  };
}

const state = freshState();
const images = {};
const history = [];
let historyIndex = -1;

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

function setStatus(text) { statusEl.textContent = text; }

function snapshot() { return JSON.parse(JSON.stringify(state)); }

function pushHistory() {
  history.splice(historyIndex + 1);
  history.push(snapshot());
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  syncHistoryButtons();
}

function restoreHistory(index) {
  const snap = history[index];
  if (!snap) return;
  const keepImages = state;
  Object.assign(state, JSON.parse(JSON.stringify(snap)));
  historyIndex = index;
  syncControls();
  render();
  syncHistoryButtons();
}

function syncHistoryButtons() {
  $('undoBtn').disabled = historyIndex <= 0;
  $('redoBtn').disabled = historyIndex >= history.length - 1;
}

function loadSample(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[`samples/${name}.jpg`] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = `samples/${name}.jpg`;
  });
}

function render() {
  const [w, h] = SIZES[state.size] || SIZES['1920x1080'];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(canvas.getContext('2d'), images, state, w, h);
  document.querySelectorAll('#samples img').forEach((img) => {
    img.classList.toggle('in-use', state.panels.some((p) => p.src === img.dataset.src));
  });
}

function buildChips(containerId, items, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.dataset.id = item.id;
    if (item.id === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      pushHistory();
      onPick(item.id);
      buildChips(containerId, items, item.id, onPick);
      render();
    });
    box.appendChild(btn);
  });
}

function refreshChips() {
  buildChips('presets', PRESETS.map((p) => ({ id: p.id, label: p.label })), state.preset, applyPresetById);
  buildChips('layouts', Object.entries(LAYOUTS).map(([id, v]) => ({ id, label: v.label })), state.layout, (id) => { state.layout = id; });
  buildChips('grades', Object.entries(GRADES).map(([id, v]) => ({ id, label: v.label })), state.grade, (id) => { state.grade = id; });
}

function applyPresetById(id) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) return;
  state.preset = preset.id;
  state.layout = preset.layout;
  state.grade = preset.grade;
  state.title = preset.title;
  state.tagline = preset.tagline;
  state.script = preset.script;
  state.panels = panelsFrom(preset.photos);
  state.selected = 0;
  syncControls();
}

function syncControls() {
  $('titleInput').value = state.title;
  $('taglineInput').value = state.tagline;
  $('scriptInput').value = state.script;
  $('starsToggle').checked = state.stars;
  $('badgeToggle').checked = state.badge;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  $('sizeSelect').value = state.size;
  syncPanelSliders();
  refreshChips();
}

function syncPanelSliders() {
  const panel = state.panels[state.selected];
  if (!panel) return;
  $('zoomRange').value = panel.zoom;
  $('panXRange').value = panel.x;
  $('panYRange').value = panel.y;
}

function buildFilmstrip() {
  const box = $('samples');
  SAMPLES.forEach((name) => {
    const img = document.createElement('img');
    img.src = `samples/${name}.jpg`;
    img.alt = SAMPLE_LABELS[name] || name;
    img.title = SAMPLE_LABELS[name] || name;
    img.dataset.src = `samples/${name}.jpg`;
    img.addEventListener('click', () => {
      pushHistory();
      state.panels[state.selected] = { src: `samples/${name}.jpg`, zoom: 1.15, x: 0.5, y: 0.45 };
      syncPanelSliders();
      render();
      setStatus(`Panel ${state.selected + 1} is now “${SAMPLE_LABELS[name]}”.`);
    });
    box.appendChild(img);
  });
}

function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const [w, h] = SIZES[state.size] || SIZES['1920x1080'];
  const px = ((clientX - box.left) / box.width) * w;
  const py = ((clientY - box.top) / box.height) * h;
  const rects = layoutRects(state.layout, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (!r) continue;
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvas() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (hit < 0) return;
    pushHistory();
    state.selected = hit;
    syncPanelSliders();
    render();
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const box = canvas.getBoundingClientRect();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.x = Math.min(1, Math.max(0, panel.x + (e.clientX - lastX) / box.width));
    panel.y = Math.min(1, Math.max(0, panel.y + (e.clientY - lastY) / box.height));
    lastX = e.clientX;
    lastY = e.clientY;
    syncPanelSliders();
    render();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    pushHistory();
    panel.zoom = Math.min(2.5, Math.max(1, panel.zoom - Math.sign(e.deltaY) * 0.08));
    $('zoomRange').value = panel.zoom;
    render();
  }, { passive: false });
}

function wireControls() {
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('titleInput').addEventListener('change', pushHistory);
  $('taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; render(); });
  $('taglineInput').addEventListener('change', pushHistory);
  $('scriptInput').addEventListener('input', (e) => { state.script = e.target.value; render(); });
  $('scriptInput').addEventListener('change', pushHistory);
  $('starsToggle').addEventListener('change', (e) => { pushHistory(); state.stars = e.target.checked; render(); });
  $('badgeToggle').addEventListener('change', (e) => { pushHistory(); state.badge = e.target.checked; render(); });
  $('grainToggle').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; render(); });
  $('vignetteToggle').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; render(); });
  $('zoomRange').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    render();
  });
  $('zoomRange').addEventListener('change', pushHistory);
  $('panXRange').addEventListener('input', (e) => {
    state.panels[state.selected].x = Number(e.target.value);
    render();
  });
  $('panXRange').addEventListener('change', pushHistory);
  $('panYRange').addEventListener('input', (e) => {
    state.panels[state.selected].y = Number(e.target.value);
    render();
  });
  $('panYRange').addEventListener('change', pushHistory);
  $('sizeSelect').addEventListener('change', (e) => {
    pushHistory();
    state.size = e.target.value;
    render();
    setStatus(`Preview is now ${state.size.replace('x', ' × ')}.`);
  });
  $('undoBtn').addEventListener('click', () => restoreHistory(historyIndex - 1));
  $('redoBtn').addEventListener('click', () => restoreHistory(historyIndex + 1));
  $('shuffleBtn').addEventListener('click', () => {
    pushHistory();
    const pool = [...SAMPLES].sort(() => Math.random() - 0.5).slice(0, 9);
    state.panels = panelsFrom(pool);
    state.selected = 0;
    syncPanelSliders();
    render();
    setStatus('Shuffled — 9 fresh photos across the panels.');
  });
  $('uploadInput').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pushHistory();
        const key = `upload:${file.name}`;
        images[key] = img;
        state.panels[state.selected] = { src: key, zoom: 1.1, x: 0.5, y: 0.5 };
        syncPanelSliders();
        render();
        setStatus(`Your photo “${file.name}” is in panel ${state.selected + 1}.`);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
  $('exportBtn').addEventListener('click', () => {
    const [w, h] = SIZES[state.size] || SIZES['1920x1080'];
    const out = renderCover(images, state, w, h);
    out.toBlob((blob) => {
      if (!blob) { setStatus('Export failed — try again.'); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = `neon-coast-cover-${state.size}.png`;
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Saved ${name} (${(blob.size / 1048576).toFixed(1)} MB).`);
    }, 'image/png');
  });
}

async function boot() {
  buildFilmstrip();
  refreshChips();
  wireControls();
  wireCanvas();
  await Promise.all(SAMPLES.map(loadSample));
  pushHistory();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await applyShot(shot, query, { state, applyPresetById, render, setSize: (s) => { state.size = s; } });
    setStatus('Ready — pick a preset, click a panel, then Export PNG.');
  } else {
    render();
    setStatus('Ready — pick a preset, click a panel, then Export PNG.');
  }
  requestAnimationFrame(() => { window.__shotReady = true; });
}

boot();
