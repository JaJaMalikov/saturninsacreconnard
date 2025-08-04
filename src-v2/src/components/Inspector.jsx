import { Accordion, AccordionSummary, AccordionDetails, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function Inspector() {
  return (
    <Box>
      <section id="selection-info">
        <label htmlFor="selected-element-name">Sélection</label>
        <output id="selected-element-name">Pantin</output>
      </section>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Transformations</Typography>
        </AccordionSummary>
        <AccordionDetails id="pantin-controls">
          <Box className="control-group" display="flex" alignItems="center" gap={1}>
            <label htmlFor="scale-value">Échelle</label>
            <button id="scale-minus">-</button>
            <input id="scale-value" type="number" step="0.1" defaultValue="1.00" />
            <button id="scale-plus">+</button>
          </Box>
          <Box className="control-group" display="flex" alignItems="center" gap={1} mt={1}>
            <label htmlFor="rotate-value">Rotation</label>
            <button id="rotate-minus">-</button>
            <input id="rotate-value" type="number" step="1" defaultValue="0" />
            <button id="rotate-plus">+</button>
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Onion Skin</Typography>
        </AccordionSummary>
        <AccordionDetails id="onion-skin-controls">
          <Box className="control-group" display="flex" alignItems="center" gap={1}>
            <input type="checkbox" id="onion-skin-toggle" defaultChecked />
            <label htmlFor="onion-skin-toggle">Activer</label>
          </Box>
          <Box className="control-group" display="flex" alignItems="center" gap={1} mt={1}>
            <label htmlFor="past-frames">Images passées</label>
            <input type="number" id="past-frames" defaultValue="1" min="0" max="10" />
          </Box>
          <Box className="control-group" display="flex" alignItems="center" gap={1} mt={1}>
            <label htmlFor="future-frames">Images futures</label>
            <input type="number" id="future-frames" defaultValue="1" min="0" max="10" />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
