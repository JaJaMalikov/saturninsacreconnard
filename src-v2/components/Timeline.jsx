import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { useAnimation } from '../context/AnimationContext.jsx';

export default function Timeline() {
  const { timeline, currentFrame, setCurrentFrame } = useAnimation();

  const handleChange = (_, value) => {
    timeline.setCurrentFrame(value);
    setCurrentFrame(value);
  };

  const addFrame = () => {
    timeline.addFrame();
    setCurrentFrame(timeline.current);
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Slider
          value={currentFrame}
          min={0}
          step={1}
          max={timeline.frames.length - 1}
          onChange={handleChange}
          sx={{ flexGrow: 1 }}
        />
        <Button variant="contained" size="small" onClick={addFrame}>
          Ajouter une frame
        </Button>
      </Stack>
    </Box>
  );
}
