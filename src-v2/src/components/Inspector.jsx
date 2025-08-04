import { useContext, useEffect, useState } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Box, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AnimContext } from '../AnimContext';

export default function Inspector() {
  const { timeline, selection, refresh, frameIndex } = useContext(AnimContext);
  const [values, setValues] = useState({ x: 0, y: 0, rotate: 0, scale: 1 });

  useEffect(() => {
    if (!timeline) return;
    if (selection === 'pantin') {
      const frame = timeline.getCurrentFrame();
      setValues({
        x: frame.transform.tx,
        y: frame.transform.ty,
        rotate: frame.transform.rotate,
        scale: frame.transform.scale,
      });
    } else {
      const obj = timeline.getObject(selection);
      if (obj) {
        setValues({ x: obj.x, y: obj.y, rotate: obj.rotate, scale: obj.scale });
      }
    }
  }, [timeline, selection, frameIndex]);

  const handleChange = field => e => {
    const v = parseFloat(e.target.value);
    setValues(prev => ({ ...prev, [field]: v }));
    if (!timeline) return;
    if (selection === 'pantin') {
      const map = { x: 'tx', y: 'ty' };
      const prop = map[field] || field;
      timeline.updateTransform({ [prop]: v });
    } else {
      timeline.updateObject(selection, { [field]: v });
    }
    refresh();
  };

  return (
    <Box>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Inspecteur</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField label="X" type="number" size="small" fullWidth margin="dense" value={values.x} onChange={handleChange('x')} />
          <TextField label="Y" type="number" size="small" fullWidth margin="dense" value={values.y} onChange={handleChange('y')} />
          <TextField label="Rotation" type="number" size="small" fullWidth margin="dense" value={values.rotate} onChange={handleChange('rotate')} />
          <TextField label="Échelle" type="number" size="small" fullWidth margin="dense" value={values.scale} onChange={handleChange('scale')} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
