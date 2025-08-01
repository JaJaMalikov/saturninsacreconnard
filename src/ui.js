// src/ui.js

/**
 * Initialise l’UI de contrôle de la timeline
 *
 * @param {Timeline} timeline - instance de Timeline
 * @param {Function} onFrameChange - callback appelée après chaque modif (ex: pour réappliquer la frame sur le SVG)
 */
export function initUI(timeline, onFrameChange) {
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
  `;

  // Référence rapide
  const frameInfo = document.getElementById('frameInfo');

  // Update de l'affichage frame courante
  function updateFrameInfo() {
    frameInfo.textContent = `Frame ${timeline.current + 1} / ${timeline.frames.length}`;
  }

  // ---- Handlers ----
  document.getElementById('prevFrame').onclick = () => {
    timeline.prevFrame();
    updateFrameInfo();
    onFrameChange();
  };

  document.getElementById('nextFrame').onclick = () => {
    timeline.nextFrame();
    updateFrameInfo();
    onFrameChange();
  };

  document.getElementById('addFrame').onclick = () => {
    timeline.addFrame();
    updateFrameInfo();
    onFrameChange();
  };

  document.getElementById('delFrame').onclick = () => {
    timeline.deleteFrame();
    updateFrameInfo();
    onFrameChange();
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
      } catch (e) {
        alert("Erreur import: " + e.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Initial affichage
  updateFrameInfo();
}

