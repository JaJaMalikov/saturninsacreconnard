import {
  Box,
  FormControl,
  InputLabel,
  Select,
  Button
} from '@mui/material';

export default function ObjectLibrary() {
  return (
    <Box id="object-controls">
      <FormControl fullWidth margin="normal">
        <InputLabel id="object-asset-label">Ajouter</InputLabel>
        <Select
          native
          labelId="object-asset-label"
          id="object-asset"
          defaultValue="carre.svg"
        >
          <option value="carre.svg">carre</option>
          <option value="faucille.svg">faucille</option>
          <option value="marteau.svg">marteau</option>
        </Select>
        <Button variant="contained" id="add-object" sx={{ mt: 1 }}>
          Ajouter
        </Button>
      </FormControl>

      <FormControl fullWidth margin="normal" className="control-group">
        <InputLabel htmlFor="object-list">Sélection</InputLabel>
        <Select
          native
          id="object-list"
          size={4}
          label="Sélection"
          sx={{ mb: 1 }}
        />
        <Button variant="outlined" id="remove-object">
          Supprimer
        </Button>
      </FormControl>

      <FormControl fullWidth margin="normal" className="control-group">
        <InputLabel id="object-layer-label">Calque</InputLabel>
        <Select
          native
          labelId="object-layer-label"
          id="object-layer"
          defaultValue="front"
        >
          <option value="front">Devant</option>
          <option value="back">Derrière</option>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="normal" className="control-group">
        <InputLabel id="object-attach-label">Coller à</InputLabel>
        <Select
          native
          labelId="object-attach-label"
          id="object-attach"
          defaultValue=""
        >
          <option value="">Aucun</option>
        </Select>
      </FormControl>
    </Box>
  );
}
