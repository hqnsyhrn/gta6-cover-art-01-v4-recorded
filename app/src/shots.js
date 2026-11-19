// Fixed scenes for screenshots: the cover alone, the editor, the 9-panel story
// cover and the classic poster. ?shot=cover&preset=sunset-duo shows the cover
// full-frame; ?shot=editor shows the app with a photo loaded; ?shot=story and
// ?shot=poster show the other exported covers. window.__shotReady is set once
// the fonts are in and the scene has painted, so a screenshot tool can wait
// for it instead of guessing a delay.

export async function applyShot(shot, query, ctx) {
  const { state, applyPresetById, render, setSize } = ctx;
  const preset = query.get('preset') || 'sunset-duo';
  const size = query.get('size') || '1920x1080';

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    applyPresetById(preset);
    setSize(size);
  } else if (shot === 'story') {
    document.body.classList.add('shot-cover');
    applyPresetById('sunset-duo');
    state.layout = 'grid-9';
    setSize('1080x1350');
  } else if (shot === 'poster') {
    document.body.classList.add('shot-cover');
    applyPresetById('gold-hour');
    setSize('1080x1080');
  } else if (shot === 'editor') {
    applyPresetById('sunset-duo');
    setSize('1920x1080');
  }
  render();
  try {
    await document.fonts.ready;
  } catch (_) { /* fonts are local; a miss still paints */ }
  render();
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.__shotReady = true;
      resolve();
    }));
  });
}
