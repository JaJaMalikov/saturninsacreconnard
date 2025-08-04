import { useEffect, useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTimeline } from '../context/TimelineContext.jsx';

export default function Inspector() {
  const { timeline, currentFrame, selection, updateSelectionTransform } = useTimeline();
  const [values, setValues] = useState({ x: 0, y: 0, rotate: 0, scale: 1 });

  useEffect(() => {
    if (!timeline || !currentFrame) return;
    const data = selection === 'pantin' ? currentFrame.transform : timeline.getObject(selection);
    if (data) {
      setValues({
        x: selection === 'pantin' ? data.tx : data.x,
        y: selection === 'pantin' ? data.ty : data.y,
        rotate: data.rotate,
        scale: data.scale,
      });
    }
  }, [timeline, currentFrame, selection]);

  const handleChange = field => e => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    setValues(v => ({ ...v, [field]: val }));
    const mapPantin = { x: 'tx', y: 'ty', rotate: 'rotate', scale: 'scale' };
    const mapObj = { x: 'x', y: 'y', rotate: 'rotate', scale: 'scale' };
    updateSelectionTransform({ [selection === 'pantin' ? mapPantin[field] : mapObj[field]]: val });
  };

  return (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Inspecteur ({selection})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField label="Position X" type="number" size="small" fullWidth margin="dense" value={values.x} onChange={handleChange('x')} />
          <TextField label="Position Y" type="number" size="small" fullWidth margin="dense" value={values.y} onChange={handleChange('y')} />
          <TextField label="Rotation" type="number" size="small" fullWidth margin="dense" value={values.rotate} onChange={handleChange('rotate')} />
          <TextField label="Échelle" type="number" size="small" fullWidth margin="dense" value={values.scale} onChange={handleChange('scale')} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
