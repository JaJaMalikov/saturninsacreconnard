/**
 * Initialise l’UI et la connecte à la timeline.
 * @param {Timeline} timeline - L'instance de la timeline.
 * @param {Function} onFrameChange - Callback pour rafraîchir le SVG.
 * @param {Function} onSave - Callback pour sauvegarder l'état.
 */
export function initUI(timeline, onFrameChange, onSave) {
  const frameInfo = document.getElementById('frameInfo');
  const timelineSlider = document.getElementById('timeline-slider');

  // Met à jour tous les éléments de l'UI en fonction de l'état de la timeline.
  function updateUI() {
    const frameCount = timeline.frames.length;
    const currentIndex = timeline.current;

    // Info textuelle
    frameInfo.textContent = `${currentIndex + 1} / ${frameCount}`;

    // Curseur de la timeline
    timelineSlider.max = frameCount - 1;
    timelineSlider.value = currentIndex;

    // Appel pour rafraîchir le SVG et les sliders de l'inspecteur
    onFrameChange();
  }

  // --- Connexion des événements --- //

  // Curseur principal
  timelineSlider.addEventListener('input', () => {
    timeline.setCurrentFrame(parseInt(timelineSlider.value, 10));
    updateUI();
  });
  timelineSlider.addEventListener('change', onSave); // Sauvegarde quand on relâche

  // Boutons de lecture
  document.getElementById('prevFrame').onclick = () => {
    timeline.prevFrame();
    updateUI();
    onSave();
  };

  document.getElementById('nextFrame').onclick = () => {
    timeline.nextFrame();
    updateUI();
    onSave();
  };

  document.getElementById('playAnim').onclick = () => {
    const playBtn = document.getElementById('playAnim');
    playBtn.textContent = '⏸️'; // Change l'icône pour Pause

    timeline.play(
      (frame, index) => {
        timeline.setCurrentFrame(index);
        updateUI();
      },
      () => {
        playBtn.textContent = '▶️'; // Rétablit l'icône Play à la fin
        onSave();
      },
      10 // fps
    );
  };

  document.getElementById('stopAnim').onclick = () => {
    timeline.stop();
    document.getElementById('playAnim').textContent = '▶️';
    // Pas de changement de frame au stop, l'utilisateur peut vouloir s'arrêter sur une frame précise
  };

  // Actions sur les frames
  document.getElementById('addFrame').onclick = () => {
    timeline.addFrame();
    updateUI();
    onSave();
  };

  document.getElementById('delFrame').onclick = () => {
    if (timeline.frames.length > 1) {
      timeline.deleteFrame();
      updateUI();
      onSave();
    }
  };

  // Actions de l'application
  document.getElementById('exportAnim').onclick = () => {
    const blob = new Blob([timeline.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('importAnimBtn').onclick = () => {
    document.getElementById('importAnim').click();
  };

  document.getElementById('importAnim').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        timeline.importJSON(evt.target.result);
        updateUI();
        onSave();
      } catch (err) {
        alert(`Erreur lors de l'importation : ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Permet de réimporter le même fichier
  };

  document.getElementById('resetStorage').onclick = () => {
    if (confirm("Voulez-vous vraiment réinitialiser le projet ?\nCette action est irréversible.")) {
      localStorage.removeItem('animation');
      window.location.reload();
    }
  };

  // Premier affichage
  updateUI();
}