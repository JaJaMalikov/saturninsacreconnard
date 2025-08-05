import React from 'react';
import { Box, Button, IconButton, TextField } from '@mui/material';
import { useAppContext } from '../AppContext.jsx';

export default function Timeline() {
  const { toggleInspector } = useAppContext();
  return (
    <Box id="timeline-panel" component="footer">
      <Box id="timeline-controls">
        <IconButton id="prevFrame" title="Image précédente" aria-label="Image précédente">⏮️</IconButton>
        <IconButton id="playAnim" title="Lire l'animation" aria-label="Lire l'animation">▶️</IconButton>
        <IconButton id="stopAnim" title="Arrêter" aria-label="Arrêter">⏹️</IconButton>
        <IconButton id="loopToggle" title="Boucle activée" aria-label="Activer ou désactiver la boucle">🔁</IconButton>
        <IconButton id="nextFrame" title="Image suivante" aria-label="Image suivante">⏭️</IconButton>
      </Box>
      <Box id="timeline-slider-container">
        <input type="range" id="timeline-slider" min="0" max="0" step="1" defaultValue="0" />
        <output id="frameInfo" htmlFor="timeline-slider" aria-live="polite">1 / 1</output>
      </Box>
      <Box id="timeline-actions">
        <Box className="control-group fps-control">
          <label htmlFor="fps-input">FPS</label>
          <TextField id="fps-input" defaultValue="10" type="number" inputProps={{ min: 1, max: 60 }} size="small" />
        </Box>
        <IconButton id="addFrame" title="Ajouter une image" aria-label="Ajouter une image">➕</IconButton>
        <IconButton id="delFrame" title="Supprimer l'image" aria-label="Supprimer l'image">🗑️</IconButton>
      </Box>
      <Box id="app-actions">
        <IconButton
          id="inspector-toggle-btn"
          title="Afficher/Masquer l'inspecteur"
          aria-label="Afficher/Masquer l'inspecteur"
          onClick={toggleInspector}
        >
          ↔️
        </IconButton>
        <Button id="exportAnim" title="Exporter l'animation" aria-label="Exporter l'animation">💾 Export</Button>
        <label htmlFor="importAnim" id="importAnimBtn" className="button" tabIndex="0" aria-label="Importer l'animation">
          📂 Import
        </label>
        <input type="file" id="importAnim" accept=".json" style={{ display: 'none' }} />
        <IconButton id="resetStorage" title="Réinitialiser le projet" aria-label="Réinitialiser le projet">⚠️</IconButton>
      </Box>
    </Box>
  );
}
