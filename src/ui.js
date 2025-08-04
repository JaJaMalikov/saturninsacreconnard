import { updateOnionSkinSettings } from './onionSkin.js';
import { debugLog } from './debug.js';

let selection = { type: 'pantin', id: null };
let externalUpdateUI = () => {};
export function setSelection(type = 'pantin', id = null) {
  selection = { type, id };
  externalUpdateUI();
}

/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 * @param {Object} extras - Fonctions supplémentaires pour les objets.
 */
export function initUI(timeline, onFrameChange, onSave, extras = {}) {
  const { objectManifest = [], memberList = [], addObject, deleteObject, setLayer, attachObject } = extras;
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
  const exportAnimBtn = document.getElementById('exportAnim');
  const importAnimBtn = document.getElementById('importAnimBtn');
  const importAnimInput = document.getElementById('importAnim');
  const resetStorageBtn = document.getElementById('resetStorage');
  const onionSkinToggle = document.getElementById('onion-skin-toggle');
  const pastFramesInput = document.getElementById('past-frames');
  const futureFramesInput = document.getElementById('future-frames');
  const scaleValueEl = document.getElementById('scale-value');
  const rotateValueEl = document.getElementById('rotate-value');
  const selectedNameEl = document.getElementById('selected-element-name');
  const objectSelect = document.getElementById('object-select');
  const addObjectBtn = document.getElementById('add-object');
  const deleteObjectBtn = document.getElementById('delete-object');
  const bringFrontBtn = document.getElementById('bring-front');
  const sendBackBtn = document.getElementById('send-back');
  const attachSelect = document.getElementById('attach-select');

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

  objectManifest.forEach(obj => {
    const opt = document.createElement('option');
    opt.value = obj.file;
    opt.textContent = obj.name;
    objectSelect.appendChild(opt);
  });

  memberList.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    attachSelect.appendChild(opt);
  });

  // --- Mise à jour de l'UI --- //
  function updateUI() {
    debugLog("updateUI called.");
    const frameCount = timeline.frames.length;
    const currentIndex = timeline.current;

    frameInfo.textContent = `${currentIndex + 1} / ${frameCount}`;
    timelineSlider.max = frameCount > 1 ? frameCount - 1 : 0;
    timelineSlider.value = currentIndex;

    const frame = timeline.getCurrentFrame();
    if (selection.type === 'pantin') {
      scaleValueEl.textContent = frame.transform.scale.toFixed(2);
      rotateValueEl.textContent = Math.round(frame.transform.rotate);
      selectedNameEl.textContent = 'Pantin';
      attachSelect.value = '';
    } else {
      const obj = frame.objects.find(o => o.id === selection.id);
      if (obj) {
        scaleValueEl.textContent = (obj.scale || 1).toFixed(2);
        rotateValueEl.textContent = Math.round(obj.rotate || 0);
        selectedNameEl.textContent = obj.name || selection.id;
        attachSelect.value = obj.attachTo || '';
      }
    }

    onFrameChange(); // Rafraîchit le SVG et les valeurs de l'inspecteur
  }
  externalUpdateUI = updateUI;

  // --- Connexions des événements --- //

  // Timeline
  timelineSlider.addEventListener('input', () => {
    debugLog("Timeline slider input.");
    timeline.setCurrentFrame(parseInt(timelineSlider.value, 10));
    updateUI();
  });
  timelineSlider.addEventListener('change', onSave);

  prevFrameBtn.addEventListener('click', () => {
    debugLog('Prev frame button clicked.');
    timeline.prevFrame();
    updateUI();
    onSave();
  });
  nextFrameBtn.addEventListener('click', () => {
    debugLog('Next frame button clicked.');
    timeline.nextFrame();
    updateUI();
    onSave();
  });

  playBtn.addEventListener('click', () => {
    debugLog('Play button clicked.');
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
    debugLog('Stop button clicked.');
    timeline.stop();
    timeline.setCurrentFrame(0);
    playBtn.textContent = '▶️';
    updateUI();
    onSave();
  });

  // Actions sur les frames
  addFrameBtn.addEventListener('click', () => {
    debugLog('Add frame button clicked.');
    timeline.addFrame();
    updateUI();
    onSave();
  });
  delFrameBtn.addEventListener('click', () => {
    debugLog('Delete frame button clicked.');
    if (timeline.frames.length > 1) {
      timeline.deleteFrame();
      updateUI();
      onSave();
    }
  });

  // Actions de l'application
  exportAnimBtn.addEventListener('click', () => {
    debugLog('Export button clicked.');
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
  importAnimBtn.addEventListener('click', () => {
    debugLog('Import button clicked.');
  });
  importAnimInput.addEventListener('change', e => {
    debugLog('Import file selected.');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        timeline.importJSON(evt.target.result);
        updateUI();
        onSave();
      } catch (err) {
        alert(`Erreur d'importation : ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  resetStorageBtn.addEventListener('click', () => {
    debugLog('Reset storage button clicked.');
    if (confirm('Voulez-vous vraiment réinitialiser le projet ?\nCette action est irréversible.')) {
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
    document.getElementById(ids.plus).addEventListener('click', () => {
      debugLog(`${key} plus button clicked.`);
      updateTransform(key, ids.step);
    });
    document.getElementById(ids.minus).addEventListener('click', () => {
      debugLog(`${key} minus button clicked.`);
      updateTransform(key, -ids.step);
    });
  }

  function updateTransform(key, delta) {
    debugLog(`updateTransform for ${key} by ${delta}.`);
    const frame = timeline.getCurrentFrame();
    if (selection.type === 'pantin') {
      const currentValue = frame.transform[key];
      let newValue = currentValue + delta;
      if (key === 'scale') {
        newValue = Math.min(Math.max(newValue, 0.1), 10);
      } else if (key === 'rotate') {
        newValue = ((newValue % 360) + 360) % 360;
      }
      timeline.updateTransform({ [key]: newValue });
    } else if (selection.type === 'object') {
      const obj = frame.objects.find(o => o.id === selection.id);
      if (!obj) return;
      const currentValue = obj[key] || (key === 'scale' ? 1 : 0);
      let newValue = currentValue + delta;
      if (key === 'scale') {
        newValue = Math.min(Math.max(newValue, 0.1), 10);
      } else if (key === 'rotate') {
        newValue = ((newValue % 360) + 360) % 360;
      }
      timeline.updateObject(selection.id, { [key]: newValue });
    }
    updateUI();
    onSave();
  }

  addObjectBtn.addEventListener('click', () => {
    if (typeof addObject === 'function') {
      const src = objectSelect.value;
      const id = addObject(src);
      setSelection('object', id);
      updateUI();
      onSave();
    }
  });

  deleteObjectBtn.addEventListener('click', () => {
    if (selection.type === 'object' && typeof deleteObject === 'function') {
      deleteObject(selection.id);
      setSelection('pantin');
      updateUI();
      onSave();
    }
  });

  bringFrontBtn.addEventListener('click', () => {
    if (selection.type === 'object' && typeof setLayer === 'function') {
      setLayer(selection.id, 'front');
      updateUI();
      onSave();
    }
  });

  sendBackBtn.addEventListener('click', () => {
    if (selection.type === 'object' && typeof setLayer === 'function') {
      setLayer(selection.id, 'back');
      updateUI();
      onSave();
    }
  });

  attachSelect.addEventListener('change', () => {
    if (selection.type === 'object' && typeof attachObject === 'function') {
      attachObject(selection.id, attachSelect.value);
      updateUI();
      onSave();
    }
  });

  // --- Contrôles Onion Skin ---
  const updateOnionSkin = () => {
    debugLog("updateOnionSkin called.");
    const past = Math.max(0, Math.min(10, parseInt(pastFramesInput.value, 10) || 0));
    const future = Math.max(0, Math.min(10, parseInt(futureFramesInput.value, 10) || 0));
    updateOnionSkinSettings({
      enabled: onionSkinToggle.checked,
      pastFrames: past,
      futureFrames: future,
    });
    onFrameChange(); // Redessine pour appliquer les changements
  };

  onionSkinToggle.addEventListener('change', updateOnionSkin);
  pastFramesInput.addEventListener('change', updateOnionSkin);
  futureFramesInput.addEventListener('change', updateOnionSkin);

  // Premier affichage
  updateUI();
}
