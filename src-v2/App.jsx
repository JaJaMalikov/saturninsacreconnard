import React from 'react';
import { Box, Drawer } from '@mui/material';
import Theatre from './components/Theatre';
import Timeline from './components/Timeline';
import Inspector from './components/Inspector';
import ObjectLibrary from './components/ObjectLibrary';

const drawerWidth = 300;

export default function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', p: 2 }
        }}
      >
        <Inspector />
        <ObjectLibrary />
      </Drawer>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Theatre />
        <Timeline />
      </Box>
    </Box>
  );
}
