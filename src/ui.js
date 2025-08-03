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
  const prevFrameBtn = document.getElementById('prevFrame');
  const nextFrameBtn = document.getElementById('nextFrame');
  const playBtn = document.getElementById('playAnim');
  const stopBtn = document.getElementById('stopAnim');
  const addFrameBtn = document.getElementById('addFrame');
  const delFrameBtn = document.getElementById('delFrame');
  const exportBtn = document.getElementById('exportAnim');
  const importBtn = document.getElementById('importAnimBtn');
  const importInput = document.getElementById('importAnim');
  const resetBtn = document.getElementById('resetStorage');

  // --- Panneau Inspecteur Escamotable ---
  const appContainer = document.getElementById('app-container');
  const inspectorToggleBtn = document.getElementById('inspector-toggle-btn');
  const inspectorStateKey = 'inspector-collapsed';

  if (localStorage.getItem(inspectorStateKey) === 'true') {
    appContainer.classList.add('inspector-collapsed');
  }

  inspectorToggleBtn.addEventListener('click', () => {
    debugLog("Inspector toggle button clicked.");
    appContainer.classList.toggle('inspector-collapsed');
    localStorage.setItem(inspectorStateKey, appContainer.classList.contains('inspector-collapsed'));
  });

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

  prevFrameBtn.addEventListener('click', () => { debugLog("Prev frame button clicked."); timeline.prevFrame(); updateUI(); onSave(); });
  nextFrameBtn.addEventListener('click', () => { debugLog("Next frame button clicked."); timeline.nextFrame(); updateUI(); onSave(); });

  playBtn.addEventListener('click', () => {
    debugLog("Play button clicked.");
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
  });

  stopBtn.addEventListener('click', () => {
    debugLog("Stop button clicked.");
    timeline.stop();
    timeline.setCurrentFrame(0);
    playBtn.textContent = '▶️';
    updateUI();
    onSave();
  });

  // Actions sur les frames
  addFrameBtn.addEventListener('click', () => { debugLog("Add frame button clicked."); timeline.addFrame(); updateUI(); onSave(); });
  delFrameBtn.addEventListener('click', () => {
    debugLog("Delete frame button clicked.");
    if (timeline.frames.length > 1) { timeline.deleteFrame(); updateUI(); onSave(); }
  });

  // Actions de l'application
  exportBtn.addEventListener('click', () => {
    debugLog("Export button clicked.");
    const blob = new Blob([timeline.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Le label "importAnimBtn" est déjà lié à l'input fichier via l'attribut "for".
  // Appeler programmatique `click()` déclenchait donc deux fois l'ouverture de la
  // boîte de dialogue. On se contente du comportement par défaut qui ne l'ouvre
  // qu'une seule fois tout en conservant le message de debug.
  importBtn.addEventListener('click', () => { debugLog("Import button clicked."); });
  importInput.addEventListener('change', e => {
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
  });

  resetBtn.addEventListener('click', () => {
    debugLog("Reset storage button clicked.");
    if (confirm("Voulez-vous vraiment réinitialiser le projet ?\nCette action est irréversible.")) {
      localStorage.removeItem('animation');
      localStorage.removeItem(inspectorStateKey);
      window.location.reload();
    }
  });

  // --- Contrôles de l'inspecteur --- //
  const controls = {
    scale: { plus: 'scale-plus', minus: 'scale-minus', value: 'scale-value', step: 0.1 },
    rotate: { plus: 'rotate-plus', minus: 'rotate-minus', value: 'rotate-value', step: 1 },
  };

  for (const [key, ids] of Object.entries(controls)) {
      const plusBtn = document.getElementById(ids.plus);
      const minusBtn = document.getElementById(ids.minus);
      plusBtn.addEventListener('click', () => { debugLog(`${key} plus button clicked.`); updateTransform(key, ids.step); });
      minusBtn.addEventListener('click', () => { debugLog(`${key} minus button clicked.`); updateTransform(key, -ids.step); });
  }

  function updateTransform(key, delta) {
    debugLog(`updateTransform for ${key} by ${delta}.`);
    const currentFrame = timeline.getCurrentFrame();
    const currentValue = currentFrame.transform[key];
    let newValue = currentValue + delta;
    if (key === 'scale') {
      newValue = Math.min(Math.max(newValue, 0.1), 10);
    } else if (key === 'rotate') {
      newValue = ((newValue % 360) + 360) % 360;
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
