import { updateOnionSkinSettings } from './onionSkin.js';
import { debugLog } from './debug.js';

/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 * @param {Object} objectsManager - Gestionnaire des objets.
 * @param {Array<string>} memberList - Liste des membres du pantin.
 */
export function initUI(timeline, onFrameChange, onSave, objectsManager, memberList) {
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
  const objectFileSelect = document.getElementById('object-file');
  const addObjectFrontBtn = document.getElementById('add-object-front');
  const addObjectBackBtn = document.getElementById('add-object-back');
  const attachSelect = document.getElementById('attach-select');
  const layerFrontBtn = document.getElementById('layer-front');
  const layerBackBtn = document.getElementById('layer-back');
  const deleteObjectBtn = document.getElementById('delete-object');
  const selectedNameEl = document.getElementById('selected-element-name');

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
    const selId = objectsManager.getSelectedId();
    if (selId) {
      const obj = timeline.getCurrentFrame().objects[selId];
      attachSelect.value = obj?.attachedTo || '';
    } else {
      attachSelect.value = '';
    }
  }

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
    const currentFrame = timeline.getCurrentFrame();
    const selId = objectsManager.getSelectedId();
    if (selId) {
      const obj = currentFrame.objects[selId];
      let newValue = obj[key] + delta;
      if (key === 'scale') {
        newValue = Math.min(Math.max(newValue, 0.1), 10);
      } else if (key === 'rotate') {
        newValue = ((newValue % 360) + 360) % 360;
      }
      timeline.updateObject(selId, { [key]: newValue });
    } else {
      const currentValue = currentFrame.transform[key];
      let newValue = currentValue + delta;
      if (key === 'scale') {
        newValue = Math.min(Math.max(newValue, 0.1), 10);
      } else if (key === 'rotate') {
        newValue = ((newValue % 360) + 360) % 360;
      }
      timeline.updateTransform({ [key]: newValue });
    }
    updateUI();
    onSave();
  }

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

  addObjectFrontBtn.addEventListener('click', () => {
    debugLog('Add object front button');
    objectsManager.addObject(objectFileSelect.value, 'front');
    updateUI();
  });
  addObjectBackBtn.addEventListener('click', () => {
    debugLog('Add object back button');
    objectsManager.addObject(objectFileSelect.value, 'back');
    updateUI();
  });
  attachSelect.addEventListener('change', () => {
    objectsManager.attachSelected(attachSelect.value);
  });
  layerFrontBtn.addEventListener('click', () => {
    objectsManager.setLayer('front');
  });
  layerBackBtn.addEventListener('click', () => {
    objectsManager.setLayer('back');
  });
  deleteObjectBtn.addEventListener('click', () => {
    objectsManager.deleteSelected();
    selectedNameEl.textContent = 'Pantin';
    updateUI();
  });

  memberList.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    attachSelect.appendChild(opt);
  });

  objectsManager.setSelectionCallback(id => {
    const frame = timeline.getCurrentFrame();
    if (id) {
      selectedNameEl.textContent = id;
      const obj = frame.objects[id];
      if (obj) {
        document.getElementById('scale-value').textContent = obj.scale.toFixed(2);
        document.getElementById('rotate-value').textContent = Math.round(obj.rotate);
        attachSelect.value = obj.attachedTo || '';
      }
    } else {
      selectedNameEl.textContent = 'Pantin';
      document.getElementById('scale-value').textContent = frame.transform.scale.toFixed(2);
      document.getElementById('rotate-value').textContent = Math.round(frame.transform.rotate);
      attachSelect.value = '';
    }
  });

  // Premier affichage
  updateUI();
}
