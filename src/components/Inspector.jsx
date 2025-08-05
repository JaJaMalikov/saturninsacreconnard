import React from 'react';
import Drawer from '@mui/material/Drawer';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ObjectLibrary from './ObjectLibrary.jsx';

export default function Inspector({ open, onClose }) {
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ id: 'inspector-panel', sx: { width: 250 } }}
    >
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<span>⌄</span>}>
          Inspecteur d'Objet
        </AccordionSummary>
        <AccordionDetails>
          <div id="selection-info">
            <label htmlFor="selected-element-name">Sélection</label>
            <output id="selected-element-name">Pantin</output>
          </div>
          <div id="pantin-controls">
            <div className="control-group">
              <label htmlFor="scale-value">Échelle</label>
              <div className="value-stepper">
                <button type="button" id="scale-minus" aria-label="Diminuer l'échelle">-</button>
                <input type="number" id="scale-value" step="0.1" defaultValue="1.00" />
                <button type="button" id="scale-plus" aria-label="Augmenter l'échelle">+</button>
              </div>
            </div>
            <div className="control-group">
              <label htmlFor="rotate-value">Rotation</label>
              <div className="value-stepper">
                <button type="button" id="rotate-minus" aria-label="Diminuer la rotation">-</button>
                <input type="number" id="rotate-value" step="1" defaultValue="0" />
                <button type="button" id="rotate-plus" aria-label="Augmenter la rotation">+</button>
              </div>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<span>⌄</span>}>
          Bibliothèque d'Objets
        </AccordionSummary>
        <AccordionDetails>
          <ObjectLibrary />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<span>⌄</span>}>
          Paramètres
        </AccordionSummary>
        <AccordionDetails>
          <div id="onion-skin-controls" role="region" aria-label="Contrôles Onion Skin">
            <div className="control-group">
              <input type="checkbox" id="onion-skin-toggle" />
              <label htmlFor="onion-skin-toggle">Activer</label>
            </div>
            <div className="control-group">
              <label htmlFor="past-frames">Images passées</label>
              <input type="number" id="past-frames" defaultValue="1" min="0" max="10" />
            </div>
            <div className="control-group">
              <label htmlFor="future-frames">Images futures</label>
              <input type="number" id="future-frames" defaultValue="1" min="0" max="10" />
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </Drawer>
  );
}
