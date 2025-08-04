import { useEffect, useState } from 'react';
import { Box, CssBaseline, Drawer } from '@mui/material';
import Inspector from './components/Inspector';
import ObjectLibrary from './components/ObjectLibrary';
import Timeline from './components/Timeline';

const drawerWidth = 300;

export default function App() {
  const [drawerOpen] = useState(true);

  useEffect(() => {
    import('@legacy/main.js').then(() => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    });
  }, []);

  return (
    <Box id="app-container" sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Drawer
          id="inspector-panel"
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
        <Box component="main" id="theatre" sx={{ flexGrow: 1 }} />
      </Box>
      <Box id="timeline-panel">
        <Timeline />
      </Box>
    </Box>
  );
}
