import React from 'react';
import Box from '@mui/material/Box';

export default function Timeline({ onToggleInspector }) {
  return (
    <Box id="timeline-panel" component="footer" role="contentinfo">
      <div id="timeline-controls">
        <button type="button" id="prevFrame" title="Image précédente" aria-label="Image précédente">⏮️</button>
        <button type="button" id="playAnim" title="Lire l'animation" aria-label="Lire l'animation">▶️</button>
        <button type="button" id="stopAnim" title="Arrêter" aria-label="Arrêter">⏹️</button>
        <button type="button" id="loopToggle" title="Boucle activée" aria-label="Activer ou désactiver la boucle">🔁</button>
        <button type="button" id="nextFrame" title="Image suivante" aria-label="Image suivante">⏭️</button>
      </div>
      <div id="timeline-slider-container">
        <label htmlFor="timeline-slider" className="sr-only">Timeline</label>
        <input type="range" id="timeline-slider" min="0" max="0" step="1" defaultValue="0" />
        <output id="frameInfo" htmlFor="timeline-slider" aria-live="polite">1 / 1</output>
      </div>
      <div id="timeline-actions">
        <div className="control-group fps-control">
          <label htmlFor="fps-input">FPS</label>
          <input type="number" id="fps-input" defaultValue="10" min="1" max="60" />
        </div>
        <button type="button" id="addFrame" title="Ajouter une image" aria-label="Ajouter une image">➕</button>
        <button type="button" id="delFrame" title="Supprimer l'image" aria-label="Supprimer l'image">🗑️</button>
      </div>
      <div id="app-actions">
        <button
          type="button"
          id="inspector-toggle-btn"
          title="Afficher/Masquer l'inspecteur"
          aria-label="Afficher/Masquer l'inspecteur"
          onClick={onToggleInspector}
        >
          ↔️
        </button>
        <button type="button" id="exportAnim" title="Exporter l'animation" aria-label="Exporter l'animation">💾 Export</button>
        <label htmlFor="importAnim" id="importAnimBtn" className="button" tabIndex="0" aria-label="Importer l'animation">📂 Import</label>
        <input type="file" id="importAnim" accept=".json" style={{display: 'none'}} />
        <button type="button" id="resetStorage" title="Réinitialiser le projet" aria-label="Réinitialiser le projet">⚠️</button>
      </div>
    </Box>
  );
}
