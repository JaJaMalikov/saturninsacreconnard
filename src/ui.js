import { updateOnionSkinSettings } from './onionSkin.js';
import { debugLog } from './debug.js';

/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 */
export function initUI(timeline, onFrameChange, onSave) {
  debugLog("initUI called.");
  const frameInfo = document.getElementById('frameInfo');
  const timelineSlider = document.getElementById('timeline-slider');
  const fpsInput = document.getElementById('fps-input');

  // --- Panneau Inspecteur Escamotable ---
  const appContainer = document.getElementById('app-container');
  const inspectorToggleBtn = document.getElementById('inspector-toggle-btn');
  const inspectorStateKey = 'inspector-collapsed';

  if (localStorage.getItem(inspectorStateKey) === 'true') {
    appContainer.classList.add('inspector-collapsed');
  }

  inspectorToggleBtn.onclick = () => {
    debugLog("Inspector toggle button clicked.");
    appContainer.classList.toggle('inspector-collapsed');
    localStorage.setItem(inspectorStateKey, appContainer.classList.contains('inspector-collapsed'));
  };

  // --- Mise à jour de l'UI --- //
  function updateUI() {
    debugLog("updateUI called.");
    const frameCount = timeline.frames.length;
    const currentIndex = timeline.current;

    frameInfo.textContent = `${currentIndex + 1} / ${frameCount}`;
    timelineSlider.max = frameCount > 1 ? frameCount - 1 : 0;
    timelineSlider.value = currentIndex;

    onFrameChange(); // Rafraîchit le SVG et les valeurs de l'inspecteur
  }

  // --- Connexions des événements --- //

  // Timeline
  timelineSlider.addEventListener('input', () => {
    debugLog("Timeline slider input.");
    timeline.setCurrentFrame(parseInt(timelineSlider.value, 10));
    updateUI();
  });
  timelineSlider.addEventListener('change', onSave);

  document.getElementById('prevFrame').onclick = () => { debugLog("Prev frame button clicked."); timeline.prevFrame(); updateUI(); onSave(); };
  document.getElementById('nextFrame').onclick = () => { debugLog("Next frame button clicked."); timeline.nextFrame(); updateUI(); onSave(); };

  document.getElementById('playAnim').onclick = () => {
    debugLog("Play button clicked.");
    const playBtn = document.getElementById('playAnim');
    if (timeline.playing) return;

    playBtn.textContent = '⏸️';
    const fps = parseInt(fpsInput.value, 10) || 10;

    let originalOnionSkinState = onionSkinToggle.checked;
    updateOnionSkinSettings({ enabled: false }); // Disable onion skin during playback
    onFrameChange(); // Refresh to hide onion skins immediately

    timeline.play(
      (frame, index) => { timeline.setCurrentFrame(index); updateUI(); },
      () => {
        playBtn.textContent = '▶️';
        updateOnionSkinSettings({ enabled: originalOnionSkinState }); // Restore original state
        onFrameChange(); // Refresh to show onion skins if they were enabled
        onSave();
      },
      fps
    );
  };

  document.getElementById('stopAnim').onclick = () => {
    debugLog("Stop button clicked.");
    timeline.stop();
    timeline.setCurrentFrame(0);
    document.getElementById('playAnim').textContent = '▶️';
    updateUI();
    onSave();
  };

  // Actions sur les frames
  document.getElementById('addFrame').onclick = () => { debugLog("Add frame button clicked."); timeline.addFrame(); updateUI(); onSave(); };
  document.getElementById('delFrame').onclick = () => {
    debugLog("Delete frame button clicked.");
    if (timeline.frames.length > 1) { timeline.deleteFrame(); updateUI(); onSave(); }
  };

  // Actions de l'application
  document.getElementById('exportAnim').onclick = () => {
    debugLog("Export button clicked.");
    const blob = new Blob([timeline.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('importAnimBtn').onclick = () => { debugLog("Import button clicked."); document.getElementById('importAnim').click(); };
  document.getElementById('importAnim').onchange = e => {
    debugLog("Import file selected.");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        timeline.importJSON(evt.target.result);
        updateUI();
        onSave();
      } catch (err) { alert(`Erreur d'importation : ${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  document.getElementById('resetStorage').onclick = () => {
    debugLog("Reset storage button clicked.");
    if (confirm("Voulez-vous vraiment réinitialiser le projet ?\nCette action est irréversible.")) {
      localStorage.removeItem('animation');
      localStorage.removeItem(inspectorStateKey);
      window.location.reload();
    }
  };

  // --- Contrôles de l'inspecteur --- //
  const controls = {
    scale: { plus: 'scale-plus', minus: 'scale-minus', value: 'scale-value', step: 0.1 },
    rotate: { plus: 'rotate-plus', minus: 'rotate-minus', value: 'rotate-value', step: 1 },
  };

  for (const [key, ids] of Object.entries(controls)) {
    document.getElementById(ids.plus).onclick = () => { debugLog(`${key} plus button clicked.`); updateTransform(key, ids.step);};
    document.getElementById(ids.minus).onclick = () => { debugLog(`${key} minus button clicked.`); updateTransform(key, -ids.step);};
  }

  function updateTransform(key, delta) {
    debugLog(`updateTransform for ${key} by ${delta}.`);
    const currentFrame = timeline.getCurrentFrame();
    const currentValue = currentFrame.transform[key];
    let newValue = currentValue + delta;
    if (key === 'scale') {
      newValue = Math.min(Math.max(newValue, 0.1), 10);
    } else if (key === 'rotate') {
      newValue = Math.min(Math.max(newValue, -180), 180);
    }
    timeline.updateTransform({ [key]: newValue });
    updateUI();
    onSave();
  }

  // --- Contrôles Onion Skin ---
  const onionSkinToggle = document.getElementById('onion-skin-toggle');
  const pastFramesInput = document.getElementById('past-frames');
  const futureFramesInput = document.getElementById('future-frames');

  const updateOnionSkin = () => {
    debugLog("updateOnionSkin called.");
    updateOnionSkinSettings({
      enabled: onionSkinToggle.checked,
      pastFrames: parseInt(pastFramesInput.value, 10) || 0,
      futureFrames: parseInt(futureFramesInput.value, 10) || 0,
    });
    onFrameChange(); // Redessine pour appliquer les changements
  };

  onionSkinToggle.addEventListener('change', updateOnionSkin);
  pastFramesInput.addEventListener('change', updateOnionSkin);
  futureFramesInput.addEventListener('change', updateOnionSkin);

  // Premier affichage
  updateUI();
}
