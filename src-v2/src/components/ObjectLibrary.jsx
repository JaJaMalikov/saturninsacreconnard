import { useContext, useEffect, useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, Button, Select, MenuItem, Typography, List, ListItemButton, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AnimContext } from '../AnimContext';

const assets = ['carre.svg', 'faucille.svg', 'marteau.svg'];

export default function ObjectLibrary() {
  const { objects, timeline, selection, setSelection, refresh, frameIndex } = useContext(AnimContext);
  const [asset, setAsset] = useState(assets[0]);
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!timeline) return;
    const frame = timeline.getCurrentFrame();
    setIds(Object.keys(frame.objects));
  }, [timeline, frameIndex]);

  const handleAdd = async () => {
    if (!objects) return;
    await objects.addObject(asset);
    const frame = timeline.getCurrentFrame();
    setIds(Object.keys(frame.objects));
    refresh();
  };

  const handleRemove = () => {
    if (!objects || selection === 'pantin') return;
    objects.removeObject(selection);
    setSelection('pantin');
    const frame = timeline.getCurrentFrame();
    setIds(Object.keys(frame.objects));
    refresh();
  };

  const handleSelect = id => {
    if (!objects) return;
    objects.selectObject(id);
    setSelection(id);
    refresh();
  };

  return (
    <Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Objets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" gap={1} mb={1}>
            <Select size="small" value={asset} onChange={e => setAsset(e.target.value)} sx={{ flexGrow: 1 }}>
              {assets.map(a => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
            <Button variant="contained" onClick={handleAdd}>Ajouter</Button>
          </Box>
          <List dense>
            {ids.map(id => (
              <ListItemButton key={id} selected={selection === id} onClick={() => handleSelect(id)}>
                <ListItemText primary={id} />
              </ListItemButton>
            ))}
          </List>
          <Button disabled={selection === 'pantin'} onClick={handleRemove} color="error" fullWidth>
            Supprimer
          </Button>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
