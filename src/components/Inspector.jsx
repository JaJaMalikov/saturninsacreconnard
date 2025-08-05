import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  TextField,
  
  FormControlLabel,
  Checkbox
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ObjectLibrary from './ObjectLibrary.jsx';

export default function Inspector() {
  return (
    <Box id="inspector-panel" sx={{ width: 300 }} role="region" aria-label="Panneau Inspecteur">
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Inspecteur d'Objet</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box id="selection-info" sx={{ mb: 2 }}>
            <Typography component="label" htmlFor="selected-element-name">
              Sélection
            </Typography>
            <Typography component="output" id="selected-element-name" sx={{ ml: 1 }}>
              Pantin
            </Typography>
          </Box>
          <Box id="pantin-controls">
            <Box className="control-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="scale-value">Échelle</Typography>
              <Box className="value-stepper">
                <IconButton id="scale-minus" aria-label="Diminuer l'échelle">
                  <RemoveIcon />
                </IconButton>
                <TextField
                  id="scale-value"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  defaultValue="1.00"
                  size="small"
                />
                <IconButton id="scale-plus" aria-label="Augmenter l'échelle">
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
            <Box className="control-group" sx={{ mb: 2 }}>
              <Typography component="label" htmlFor="rotate-value">Rotation</Typography>
              <Box className="value-stepper">
                <IconButton id="rotate-minus" aria-label="Diminuer la rotation">
                  <RemoveIcon />
                </IconButton>
                <TextField
                  id="rotate-value"
                  type="number"
                  inputProps={{ step: 1 }}
                  defaultValue="0"
                  size="small"
                />
                <IconButton id="rotate-plus" aria-label="Augmenter la rotation">
                  <AddIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Bibliothèque d'Objets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ObjectLibrary />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Paramètres</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box id="onion-skin-controls">
            <Typography variant="h6">Onion Skin</Typography>
            <FormControlLabel
              control={<Checkbox id="onion-skin-toggle" />}
              label="Activer"
            />
            <TextField
              id="past-frames"
              label="Images passées"
              type="number"
              defaultValue="1"
              inputProps={{ min: 0, max: 10 }}
              sx={{ my: 1 }}
            />
            <TextField
              id="future-frames"
              label="Images futures"
              type="number"
              defaultValue="1"
              inputProps={{ min: 0, max: 10 }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
