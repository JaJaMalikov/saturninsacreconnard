import { updateOnionSkinSettings } from './onionSkin.js';
import { debugLog } from './debug.js';

/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 */
export function initUI(timeline, onFrameChange, onSave, objects) {
  debugLog("initUI called.");
  const frameInfo = document.getElementById('frameInfo');
  const timelineSlider = document.getElementById('timeline-slider');
  const fpsInput = document.getElementById('fps-input');
  const prevFrameBtn = document.getElementById('prevFrame');
  const nextFrameBtn = document.getElementById('nextFrame');
  const playBtn = document.getElementById('playAnim');
  const stopBtn = document.getElementById('stopAnim');
  const loopToggleBtn = document.getElementById('loopToggle');
  const addFrameBtn = document.getElementById('addFrame');
  const delFrameBtn = document.getElementById('delFrame');
  const exportAnimBtn = document.getElementById('exportAnim');
  const importAnimBtn = document.getElementById('importAnimBtn');
  const importAnimInput = document.getElementById('importAnim');
  const resetStorageBtn = document.getElementById('resetStorage');
  const onionSkinToggle = document.getElementById('onion-skin-toggle');
  const pastFramesInput = document.getElementById('past-frames');
  const futureFramesInput = document.getElementById('future-frames');
  const selectedElementName = document.getElementById('selected-element-name');
  const objectAssetSelect = document.getElementById('object-asset');
  const addObjectBtn = document.getElementById('add-object');
  const objectList = document.getElementById('object-list');
  const removeObjectBtn = document.getElementById('remove-object');
  const objectLayerSelect = document.getElementById('object-layer');
  const objectAttachSelect = document.getElementById('object-attach');
  const scaleValueEl = document.getElementById('scale-value');
  const rotateValueEl = document.getElementById('rotate-value');

  objects.memberList.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    objectAttachSelect.appendChild(opt);
  });

  let selection = 'pantin';

  function refreshObjectList() {
    const frame = timeline.getCurrentFrame();
    objectList.innerHTML = '';
    const pantinOpt = document.createElement('option');
    pantinOpt.value = '';
    pantinOpt.textContent = 'Pantin';
    objectList.appendChild(pantinOpt);
    Object.keys(frame.objects).forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      objectList.appendChild(opt);
    });
  }

  // --- Mise à jour de l'UI --- //
  function updateUI(skipFrameRefresh = false) {
    debugLog("updateUI called.");
    const frameCount = timeline.frames.length;
    const currentIndex = timeline.current;

    frameInfo.textContent = `${currentIndex + 1} / ${frameCount}`;
    timelineSlider.max = frameCount > 1 ? frameCount - 1 : 0;
    timelineSlider.value = currentIndex;
    refreshObjectList();
    objectList.value = selection !== 'pantin' ? selection : '';

    if (!skipFrameRefresh) onFrameChange();

    if (selection === 'pantin') {
      const frame = timeline.getCurrentFrame();
      scaleValueEl.value = frame.transform.scale.toFixed(2);
      rotateValueEl.value = Math.round(frame.transform.rotate);
    } else {
      const obj = timeline.getObject(selection);
      if (obj) {
        scaleValueEl.value = obj.scale.toFixed(2);
        rotateValueEl.value = Math.round(obj.rotate);
        objectLayerSelect.value = obj.layer;
        objectAttachSelect.value = obj.attachedTo || '';
      }
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

  let savedOnionSkinState = true;
  let loopEnabled = true;

  loopToggleBtn.addEventListener('click', () => {
    loopEnabled = !loopEnabled;
    loopToggleBtn.textContent = loopEnabled ? '🔁' : '➡️';
    loopToggleBtn.title = loopEnabled ? 'Boucle activée' : 'Boucle désactivée';
  });

  playBtn.addEventListener('click', () => {
    debugLog('Play button clicked.');
    if (timeline.playing) return;

    playBtn.textContent = '⏸️';
    const fps = parseInt(fpsInput.value, 10) || 10;

    savedOnionSkinState = onionSkinToggle.checked;
    updateOnionSkinSettings({ enabled: false });
    onFrameChange();

    timeline.play((frame, index) => {
      timeline.setCurrentFrame(index);
      updateUI();
    }, () => {
      playBtn.textContent = '▶️';
      updateOnionSkinSettings({ enabled: savedOnionSkinState });
      updateUI();
    }, fps, { loop: loopEnabled });
  });

  stopBtn.addEventListener('click', () => {
    debugLog('Stop button clicked.');
    timeline.stop();
    timeline.setCurrentFrame(0);
    playBtn.textContent = '▶️';
    updateOnionSkinSettings({ enabled: savedOnionSkinState });
    onFrameChange();
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
      localStorage.removeItem('inspector-collapsed');
      window.location.reload();
    }
  });

  // --- Contrôles Objets ---
  addObjectBtn.addEventListener('click', async () => {
    debugLog('Add object button clicked.');
    const src = objectAssetSelect.value;
    if (!src) return;
    await objects.addObject(src, objectLayerSelect.value);
  });

  objectList.addEventListener('change', () => {
    const id = objectList.value;
    if (id) {
      selection = id;
      objects.selectObject(id);
      selectedElementName.textContent = id;
    } else {
      selection = 'pantin';
      objects.selectObject(null);
      selectedElementName.textContent = 'Pantin';
    }
    updateUI(true);
  });

  removeObjectBtn.addEventListener('click', () => {
    const id = objectList.value;
    if (!id) return;
    objects.removeObject(id);
    selection = 'pantin';
    selectedElementName.textContent = 'Pantin';
    updateUI(true);
  });

  objectLayerSelect.addEventListener('change', () => {
    const id = objectList.value;
    if (!id) return;
    objects.setLayer(id, objectLayerSelect.value);
    updateUI(true);
  });

  objectAttachSelect.addEventListener('change', () => {
    const id = objectList.value;
    if (!id) return;
    objects.attach(id, objectAttachSelect.value || null);
    updateUI(true);
  });

  objects.onSelect(id => {
    if (!id) return;
    selection = id;
    selectedElementName.textContent = id;
    updateUI(true);
  });

  // --- Contrôles de l'inspecteur --- //
  const controls = {
    scale: { plus: 'scale-plus', minus: 'scale-minus', value: 'scale-value', step: 0.1 },
    rotate: { plus: 'rotate-plus', minus: 'rotate-minus', value: 'rotate-value', step: 1 },
  };

  function setTransform(key, value) {
    if (selection === 'pantin') {
      timeline.updateTransform({ [key]: value });
    } else {
      const obj = timeline.getObject(selection);
      if (!obj) return;
      timeline.updateObject(selection, { [key]: value });
    }
    updateUI();
    onSave();
  }

  function updateTransform(key, delta) {
    debugLog(`updateTransform for ${key} by ${delta}.`);
    const current = selection === 'pantin'
      ? timeline.getCurrentFrame().transform[key]
      : timeline.getObject(selection)?.[key];
    if (typeof current !== 'number') return;
    setTransform(key, current + delta);
  }

  for (const [key, ids] of Object.entries(controls)) {
    const plusEl = document.getElementById(ids.plus);
    const minusEl = document.getElementById(ids.minus);
    const valueEl = document.getElementById(ids.value);
    plusEl.addEventListener('click', () => {
      debugLog(`${key} plus button clicked.`);
      updateTransform(key, ids.step);
    });
    minusEl.addEventListener('click', () => {
      debugLog(`${key} minus button clicked.`);
      updateTransform(key, -ids.step);
    });
    valueEl.addEventListener('change', () => {
      const val = parseFloat(valueEl.value);
      if (isNaN(val)) return;
      setTransform(key, val);
    });
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

  pastFramesInput.parentElement.style.display = 'none';
  futureFramesInput.parentElement.style.display = 'none';
  onionSkinToggle.checked = true;
  updateOnionSkin();

  // Premier affichage
  updateUI();
}
