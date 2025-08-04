import { Box, IconButton, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTimeline } from '../context/TimelineContext.jsx';

export default function Timeline() {
  const { timeline, playing, play, stop, nextFrame, prevFrame, setFrameIndex, addFrame, deleteFrame } = useTimeline();
  if (!timeline) return null;
  return (
    <Box p={1} sx={{ bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <IconButton size="small" onClick={prevFrame}><SkipPreviousIcon /></IconButton>
        {playing ? (
          <IconButton size="small" onClick={stop}><StopIcon /></IconButton>
        ) : (
          <IconButton size="small" onClick={() => play()}><PlayArrowIcon /></IconButton>
        )}
        <IconButton size="small" onClick={nextFrame}><SkipNextIcon /></IconButton>
        <IconButton size="small" onClick={addFrame}><AddIcon /></IconButton>
        <IconButton size="small" onClick={deleteFrame}><DeleteIcon /></IconButton>
      </Box>
      <Slider size="small" value={timeline.current} min={0} max={timeline.frames.length - 1} onChange={(e, val) => setFrameIndex(val)} />
    </Box>
  );
}
