import {
  Box,
  IconButton,
  TextField,
  Button,
  Typography
} from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LoopIcon from '@mui/icons-material/Loop';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export default function Timeline({ onToggleInspector }) {
  return (
    <Box
      id="timeline-panel"
      component="footer"
      sx={{ flexShrink: 0, p: 1, borderTop: 1, borderColor: 'divider' }}
    >
      <Box id="timeline-controls">
        <IconButton id="prevFrame" aria-label="Image précédente">
          <SkipPreviousIcon />
        </IconButton>
        <IconButton id="playAnim" aria-label="Lire l'animation">
          <PlayArrowIcon />
        </IconButton>
        <IconButton id="stopAnim" aria-label="Arrêter">
          <StopIcon />
        </IconButton>
        <IconButton id="loopToggle" aria-label="Activer ou désactiver la boucle">
          <LoopIcon />
        </IconButton>
        <IconButton id="nextFrame" aria-label="Image suivante">
          <SkipNextIcon />
        </IconButton>
      </Box>

      <Box id="timeline-slider-container" sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
        <label htmlFor="timeline-slider" className="sr-only">Timeline</label>
        <input type="range" id="timeline-slider" min="0" max="0" step="1" defaultValue="0" />
        <Typography component="output" id="frameInfo" sx={{ ml: 1 }}>
          1 / 1
        </Typography>
      </Box>

      <Box id="timeline-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box className="control-group fps-control" sx={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="fps-input">FPS</label>
          <TextField
            id="fps-input"
            type="number"
            defaultValue="10"
            inputProps={{ min: 1, max: 60 }}
            size="small"
            sx={{ width: 60, ml: 1 }}
          />
        </Box>
        <IconButton id="addFrame" aria-label="Ajouter une image">
          <AddIcon />
        </IconButton>
        <IconButton id="delFrame" aria-label="Supprimer l'image">
          <DeleteIcon />
        </IconButton>
      </Box>

      <Box id="app-actions" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          id="inspector-toggle-btn"
          aria-label="Afficher/Masquer l'inspecteur"
          onClick={onToggleInspector}
        >
          <MenuIcon />
        </IconButton>
        <Button
          id="exportAnim"
          variant="outlined"
          startIcon={<SaveIcon />}
          aria-label="Exporter l'animation"
        >
          Export
        </Button>
        <Button
          component="label"
          id="importAnimBtn"
          variant="outlined"
          startIcon={<UploadFileIcon />}
          aria-label="Importer l'animation"
        >
          Import
          <input type="file" id="importAnim" accept=".json" hidden />
        </Button>
        <IconButton id="resetStorage" aria-label="Réinitialiser le projet">
          <RestartAltIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
