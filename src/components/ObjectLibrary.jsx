import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ObjectLibrary() {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Bibliothèque d'Objets</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box id="object-controls">
          <Box className="control-group">
            <InputLabel id="object-asset-label">Ajouter</InputLabel>
            <Select
              native
              id="object-asset"
              labelId="object-asset-label"
              defaultValue="carre.svg"
              fullWidth
              size="small"
            >
              <option value="carre.svg">carre</option>
              <option value="faucille.svg">faucille</option>
              <option value="marteau.svg">marteau</option>
            </Select>
            <Button id="add-object" sx={{ mt: 1 }} fullWidth>
              Ajouter
            </Button>
          </Box>
          <Box className="control-group">
            <InputLabel id="object-list-label">Sélection</InputLabel>
            <Select
              native
              id="object-list"
              labelId="object-list-label"
              size="small"
              fullWidth
            />
            <Button id="remove-object" sx={{ mt: 1 }} fullWidth>
              Supprimer
            </Button>
          </Box>
          <Box className="control-group">
            <InputLabel id="object-layer-label">Calque</InputLabel>
            <Select
              id="object-layer"
              labelId="object-layer-label"
              defaultValue="front"
              fullWidth
              size="small"
            >
              <MenuItem value="front">Devant</MenuItem>
              <MenuItem value="back">Derrière</MenuItem>
            </Select>
          </Box>
          <Box className="control-group">
            <InputLabel id="object-attach-label">Coller à</InputLabel>
            <Select
              native
              id="object-attach"
              labelId="object-attach-label"
              defaultValue=""
              fullWidth
              size="small"
            >
              <option value="">Aucun</option>
            </Select>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
