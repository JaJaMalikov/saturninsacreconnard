import { Accordion, AccordionSummary, AccordionDetails, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ObjectLibrary() {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Objets</Typography>
      </AccordionSummary>
      <AccordionDetails id="object-controls">
        <Box className="control-group" mb={1}>
          <label htmlFor="object-asset">Ajouter</label>
          <select id="object-asset">
            <option value="carre.svg">carre</option>
            <option value="faucille.svg">faucille</option>
            <option value="marteau.svg">marteau</option>
          </select>
          <button id="add-object">Ajouter</button>
        </Box>
        <Box className="control-group" mb={1}>
          <label htmlFor="object-list">Sélection</label>
          <select id="object-list" size={4}></select>
          <button id="remove-object">Supprimer</button>
        </Box>
        <Box className="control-group" mb={1}>
          <label htmlFor="object-layer">Calque</label>
          <select id="object-layer">
            <option value="front">Devant</option>
            <option value="back">Derrière</option>
          </select>
        </Box>
        <Box className="control-group">
          <label htmlFor="object-attach">Coller à</label>
          <select id="object-attach">
            <option value="">Aucun</option>
          </select>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
