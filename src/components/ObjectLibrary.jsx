import React from 'react';
import Box from '@mui/material/Box';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ObjectLibrary() {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
        <Typography>Bibliothèque d'Objets</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box id="object-controls" role="region" aria-label="Objets">
          <div className="control-group">
            <label htmlFor="object-asset">Ajouter</label>
            <select id="object-asset">
              <option value="carre.svg">carre</option>
              <option value="faucille.svg">faucille</option>
              <option value="marteau.svg">marteau</option>
            </select>
            <button type="button" id="add-object">Ajouter</button>
          </div>
          <div className="control-group">
            <label htmlFor="object-list">Sélection</label>
            <select id="object-list" size="4"></select>
            <button type="button" id="remove-object">Supprimer</button>
          </div>
          <div className="control-group">
            <label htmlFor="object-layer">Calque</label>
            <select id="object-layer">
              <option value="front">Devant</option>
              <option value="back">Derrière</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="object-attach">Coller à</label>
            <select id="object-attach">
              <option value="">Aucun</option>
            </select>
          </div>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
