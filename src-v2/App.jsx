import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Theatre from './components/Theatre.jsx';
import Timeline from './components/Timeline.jsx';
import Inspector from './components/Inspector.jsx';
import ObjectLibrary from './components/ObjectLibrary.jsx';

const drawerWidth = 320;

export default function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, position: 'relative' },
          }}
        >
          <Inspector />
          <ObjectLibrary />
        </Drawer>
        <Box sx={{ flexGrow: 1 }}>
          <Theatre />
        </Box>
      </Box>
      <Box component="footer">
        <Timeline />
      </Box>
    </Box>
  );
}
