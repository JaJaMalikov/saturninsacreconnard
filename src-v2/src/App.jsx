import { useState } from 'react';
import { Box, CssBaseline, Drawer } from '@mui/material';
import Inspector from './components/Inspector';
import ObjectLibrary from './components/ObjectLibrary';
import Theatre from './components/Theatre';
import Timeline from './components/Timeline';
import { AnimContext } from './AnimContext';

const drawerWidth = 300;

export default function App() {
  const [drawerOpen] = useState(true);
  const [timeline, setTimeline] = useState(null);
  const [objects, setObjects] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [selection, setSelection] = useState('pantin');
  const [refresh, setRefresh] = useState(() => () => {});

  const contextValue = {
    timeline,
    setTimeline,
    objects,
    setObjects,
    frameIndex,
    setFrameIndex,
    selection,
    setSelection,
    refresh,
    setRefresh,
  };

  return (
    <AnimContext.Provider value={contextValue}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        <Drawer
          variant="permanent"
          open={drawerOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', p: 2 },
          }}
        >
          <Inspector />
          <ObjectLibrary />
        </Drawer>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Theatre />
          </Box>
          <Timeline />
        </Box>
      </Box>
    </AnimContext.Provider>
  );
}
