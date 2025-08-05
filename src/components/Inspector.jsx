import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Drawer,
  FormControlLabel,
  InputLabel,
  TextField,
  Checkbox,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ObjectLibrary from './ObjectLibrary.jsx';

export default function Inspector({ open, width = 300 }) {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Inspecteur d'Objet</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box id="selection-info">
              <InputLabel htmlFor="selected-element-name">Sélection</InputLabel>
              <output id="selected-element-name">Pantin</output>
            </Box>
            <Box id="pantin-controls">
              <Box className="control-group">
                <InputLabel htmlFor="scale-value">Échelle</InputLabel>
                <Box className="value-stepper">
                  <Button id="scale-minus" aria-label="Diminuer l'échelle">-</Button>
                  <TextField
                    id="scale-value"
                    type="number"
                    defaultValue="1.00"
                    inputProps={{ step: 0.1 }}
                    size="small"
                  />
                  <Button id="scale-plus" aria-label="Augmenter l'échelle">+</Button>
                </Box>
              </Box>
              <Box className="control-group">
                <InputLabel htmlFor="rotate-value">Rotation</InputLabel>
                <Box className="value-stepper">
                  <Button id="rotate-minus" aria-label="Diminuer la rotation">-</Button>
                  <TextField
                    id="rotate-value"
                    type="number"
                    defaultValue="0"
                    inputProps={{ step: 1 }}
                    size="small"
                  />
                  <Button id="rotate-plus" aria-label="Augmenter la rotation">+</Button>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <ObjectLibrary />

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Paramètres</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box id="onion-skin-controls">
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
                size="small"
                sx={{ my: 1 }}
              />
              <TextField
                id="future-frames"
                label="Images futures"
                type="number"
                defaultValue="1"
                inputProps={{ min: 0, max: 10 }}
                size="small"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
}
