import { useContext, useState } from 'react';
import { Box, IconButton, Slider, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import LoopIcon from '@mui/icons-material/Loop';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { AnimContext } from '../AnimContext';

export default function Timeline() {
  const { timeline, frameIndex, setFrameIndex, refresh } = useContext(AnimContext);
  const [loop, setLoop] = useState(true);
  const [fps, setFps] = useState(10);

  const handleSlider = (e, val) => {
    if (!timeline) return;
    timeline.setCurrentFrame(val);
    setFrameIndex(timeline.current);
    refresh();
  };

  const handlePrev = () => {
    if (!timeline) return;
    timeline.prevFrame();
    setFrameIndex(timeline.current);
    refresh();
  };

  const handleNext = () => {
    if (!timeline) return;
    timeline.nextFrame();
    setFrameIndex(timeline.current);
    refresh();
  };

  const handleAdd = () => {
    if (!timeline) return;
    timeline.addFrame();
    setFrameIndex(timeline.current);
    refresh();
  };

  const handleDelete = () => {
    if (!timeline || timeline.frames.length <= 1) return;
    timeline.deleteFrame();
    setFrameIndex(timeline.current);
    refresh();
  };

  const handlePlay = () => {
    if (!timeline) return;
    if (timeline.playing) {
      timeline.stop();
      refresh();
      return;
    }
    const fpsNum = parseInt(fps, 10) || 10;
    timeline.play(
      (frame, idx) => {
        timeline.setCurrentFrame(idx);
        setFrameIndex(idx);
        refresh();
      },
      () => {
        refresh();
      },
      fpsNum,
      { loop }
    );
  };

  const handleStop = () => {
    if (!timeline) return;
    timeline.stop();
    timeline.setCurrentFrame(0);
    setFrameIndex(0);
    refresh();
  };

  return (
    <Box p={1} sx={{ bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <IconButton size="small" onClick={handlePrev}><SkipPreviousIcon /></IconButton>
        <IconButton size="small" onClick={handlePlay}><PlayArrowIcon /></IconButton>
        <IconButton size="small" onClick={handleStop}><StopIcon /></IconButton>
        <IconButton size="small" color={loop ? 'primary' : 'default'} onClick={() => setLoop(!loop)}><LoopIcon /></IconButton>
        <IconButton size="small" onClick={handleNext}><SkipNextIcon /></IconButton>
        <IconButton size="small" onClick={handleAdd}><AddIcon /></IconButton>
        <IconButton size="small" onClick={handleDelete}><DeleteIcon /></IconButton>
        <TextField label="FPS" type="number" size="small" value={fps} onChange={e => setFps(e.target.value)} sx={{ width: 80 }} />
      </Box>
      <Slider size="small" value={frameIndex} min={0} max={Math.max(0, (timeline?.frames.length || 1) - 1)} onChange={handleSlider} />
    </Box>
  );
}
