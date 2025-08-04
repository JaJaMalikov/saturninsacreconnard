import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Inspector() {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Inspecteur d'Objet</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Propriétés de l'objet sélectionné.</Typography>
      </AccordionDetails>
    </Accordion>
  );
}
