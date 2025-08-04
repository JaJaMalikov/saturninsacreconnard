import { Box, Drawer, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Inspector from './components/Inspector'
import ObjectLibrary from './components/ObjectLibrary'
import Theatre from './components/Theatre'
import Timeline from './components/Timeline'

const drawerWidth = 280

export default function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }
        }}
      >
        <Box sx={{ overflow: 'auto' }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Inspecteur</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Inspector />
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Bibliothèque d'objets</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ObjectLibrary />
            </AccordionDetails>
          </Accordion>
        </Box>
      </Drawer>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Theatre />
        <Timeline />
      </Box>
    </Box>
  )
}
