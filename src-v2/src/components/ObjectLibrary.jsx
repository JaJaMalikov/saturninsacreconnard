import { useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Button, TextField, Typography, Select, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTimeline } from '../context/TimelineContext.jsx';

export default function ObjectLibrary() {
  const { objects, selection, setSelection, currentFrame } = useTimeline();
  const [asset, setAsset] = useState('');
  const [layer, setLayer] = useState('front');

  const handleAdd = async () => {
    if (!objects || !asset) return;
    const id = await objects.addObject(asset, layer);
    if (id) setSelection(id);
    setAsset('');
  };

  const objectIds = currentFrame ? Object.keys(currentFrame.objects) : [];

  const handleSelect = e => {
    const val = e.target.value;
    if (val) {
      setSelection(val);
      objects?.selectObject(val);
    } else {
      setSelection('pantin');
      objects?.selectObject(null);
    }
  };

  return (
    <Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Bibliothèque d'Objets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" gap={1} mb={1}>
            <TextField label="Nom de l'objet" size="small" fullWidth value={asset} onChange={e => setAsset(e.target.value)} />
            <Select size="small" value={layer} onChange={e => setLayer(e.target.value)}>
              <MenuItem value="front">Avant</MenuItem>
              <MenuItem value="back">Arrière</MenuItem>
            </Select>
            <Button variant="contained" onClick={handleAdd}>Ajouter</Button>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Select size="small" value={selection === 'pantin' ? '' : selection} onChange={handleSelect} displayEmpty fullWidth>
              <MenuItem value=""><em>Pantin</em></MenuItem>
              {objectIds.map(id => (
                <MenuItem key={id} value={id}>{id}</MenuItem>
              ))}
            </Select>
            <Button onClick={() => objects?.removeObject(selection)} disabled={selection === 'pantin'}>Supprimer</Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
