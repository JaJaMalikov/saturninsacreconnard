import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ObjectLibrary() {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Bibliothèque d'Objets</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Liste des objets disponibles.</Typography>
      </AccordionDetails>
    </Accordion>
  );
}
