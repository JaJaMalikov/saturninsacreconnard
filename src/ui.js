import { updateOnionSkinSettings } from './onionSkin.js';
import * as logger from './logger.js';

/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 */
export function initUI(timeline, onFrameChange, onSave) {
  logger.log("initUI called.");
  const frameInfo = document.getElementById('frameInfo');
  const timelineSlider = document.getElementById('timeline-slider');
  const fpsInput = document.getElementById('fps-input');
  const onionSkinToggle = document.getElementById('onion-skin-toggle');
  const pastFramesInput = document.getElementById('past-frames');
  const futureFramesInput = document.getElementById('future-frames');

  // --- Panneau Inspecteur Escamotable ---
  const appContainer = document.getElementById('app-container');
  const inspectorToggleBtn = document.getElementById('inspector-toggle-btn');
  const inspectorStateKey = 'inspector-collapsed';

  if (localStorage.getItem(inspectorStateKey) === 'true') {
    appContainer.classList.add('inspector-collapsed');
  }

  inspectorToggleBtn.onclick = () => {
    logger.log("Inspector toggle button clicked.");
    appContainer.classList.toggle('inspector-collapsed');
    localStorage.setItem(inspectorStateKey, appContainer.classList.contains('inspector-collapsed'));
  };

  // --- Mise à jour de l'UI --- //
  function updateUI() {
    logger.log("updateUI called.");
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
    logger.log("Timeline slider input.");
    timeline.setCurrentFrame(parseInt(timelineSlider.value, 10));
    updateUI();
  });
  timelineSlider.addEventListener('change', onSave);

  document.getElementById('prevFrame').onclick = () => { logger.log("Prev frame button clicked."); timeline.prevFrame(); updateUI(); onSave(); };
  document.getElementById('nextFrame').onclick = () => { logger.log("Next frame button clicked."); timeline.nextFrame(); updateUI(); onSave(); };

  document.getElementById('playAnim').onclick = () => {
    logger.log("Play button clicked.");
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
    logger.log("Stop button clicked.");
    timeline.stop();
    timeline.setCurrentFrame(0);
    document.getElementById('playAnim').textContent = '▶️';
    updateUI();
    onSave();
  };

  // Actions sur les frames
  document.getElementById('addFrame').onclick = () => { logger.log("Add frame button clicked."); timeline.addFrame(); updateUI(); onSave(); };
  document.getElementById('delFrame').onclick = () => {
    logger.log("Delete frame button clicked.");
    if (timeline.frames.length > 1) { timeline.deleteFrame(); updateUI(); onSave(); }
  };

  // Actions de l'application
  document.getElementById('exportAnim').onclick = () => {
    logger.log("Export button clicked.");
    const blob = new Blob([timeline.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('importAnimBtn').onclick = () => { logger.log("Import button clicked."); document.getElementById('importAnim').click(); };
  document.getElementById('importAnim').onchange = e => {
    logger.log("Import file selected.");
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
    logger.log("Reset storage button clicked.");
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
    document.getElementById(ids.plus).onclick = () => { logger.log(`${key} plus button clicked.`); updateTransform(key, ids.step);};
    document.getElementById(ids.minus).onclick = () => { logger.log(`${key} minus button clicked.`); updateTransform(key, -ids.step);};
  }

  function updateTransform(key, delta) {
    logger.log(`updateTransform for ${key} by ${delta}.`);
    const currentFrame = timeline.getCurrentFrame();
    const currentValue = currentFrame.transform[key];
    const newValue = currentValue + delta;
    timeline.updateTransform({ [key]: newValue });
    updateUI();
    onSave();
  }

  // --- Contrôles Onion Skin ---
  const updateOnionSkin = () => {
    logger.log("updateOnionSkin called.");
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
