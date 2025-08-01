// src/ui.js

/**
 * Initialise l’UI de contrôle de la timeline
 *
 * @param {Timeline} timeline - instance de Timeline
 * @param {Function} onFrameChange - callback appelée après chaque modif (ex: pour réappliquer la frame sur le SVG)
 */
export function initUI(timeline, onFrameChange, pantinCtrl = null) {
  const controls = document.getElementById('controls');
  controls.innerHTML = `
    <button id="prevFrame">⏮️</button>
    <span id="frameInfo">Frame 1 / 1</span>
    <button id="nextFrame">⏭️</button>
    <button id="addFrame">➕ Frame</button>
    <button id="delFrame">🗑️ Frame</button>
    <button id="playAnim">▶️ Play</button>
    <button id="stopAnim">⏹️ Stop</button>
    <button id="exportAnim">💾 Export</button>
    <input type="file" id="importAnim" style="display:none" />
    <button id="importAnimBtn">📂 Import</button>
    <label style="margin-left:20px;">Rotation
      <input type="range" id="rotatePantin" class="slider" min="-180" max="180" value="0">
    </label>
    <label style="margin-left:10px;">Taille
      <input type="range" id="scalePantin" class="slider" min="0.1" max="3" step="0.1" value="1">
    </label>
  `;

  // Référence rapide
  const frameInfo = document.getElementById('frameInfo');

  // Update de l'affichage frame courante
  function updateFrameInfo() {
    frameInfo.textContent = `Frame ${timeline.current + 1} / ${timeline.frames.length}`;
  }

  // ---- Handlers ----
  function save() {
    localStorage.setItem('animation', timeline.exportJSON());
  }

  document.getElementById('prevFrame').onclick = () => {
    timeline.prevFrame();
    updateFrameInfo();
    onFrameChange();
    save();
  };

  document.getElementById('nextFrame').onclick = () => {
    timeline.nextFrame();
    updateFrameInfo();
    onFrameChange();
    save();
  };

  document.getElementById('addFrame').onclick = () => {
    timeline.addFrame();
    updateFrameInfo();
    onFrameChange();
    save();
  };

  document.getElementById('delFrame').onclick = () => {
    timeline.deleteFrame();
    updateFrameInfo();
    onFrameChange();
    save();
  };

  document.getElementById('playAnim').onclick = () => {
    timeline.play((frame, idx) => {
      timeline.setCurrentFrame(idx);
      updateFrameInfo();
      onFrameChange();
    });
  };

  document.getElementById('stopAnim').onclick = () => {
    timeline.stop();
    updateFrameInfo();
    onFrameChange();
    save();
  };

  document.getElementById('exportAnim').onclick = () => {
    const blob = new Blob([timeline.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'animation.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Import JSON (bouton + file input caché)
  document.getElementById('importAnimBtn').onclick = () => {
    document.getElementById('importAnim').click();
  };
  document.getElementById('importAnim').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        timeline.importJSON(evt.target.result);
        updateFrameInfo();
        onFrameChange();
        save();
      } catch (e) {
        alert("Erreur import: " + e.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (pantinCtrl) {
    const rotInput = document.getElementById('rotatePantin');
    const scaleInput = document.getElementById('scalePantin');
    rotInput.oninput = (e) => {
      pantinCtrl.setRotation(parseFloat(e.target.value));
      onFrameChange();
      save();
    };
    scaleInput.oninput = (e) => {
      pantinCtrl.setScale(parseFloat(e.target.value));
      onFrameChange();
      save();
    };
  }

  // Initial affichage
  updateFrameInfo();
}

