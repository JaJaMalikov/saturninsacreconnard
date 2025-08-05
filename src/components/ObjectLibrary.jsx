import React from 'react';

export default function ObjectLibrary() {
  return (
    <div id="object-controls" role="region" aria-label="Objets">
      <h3>Objets</h3>
      <div className="control-group">
        <label htmlFor="object-asset">Ajouter</label>
        <select id="object-asset">
          <option value="carre.svg">carre</option>
          <option value="faucille.svg">faucille</option>
          <option value="marteau.svg">marteau</option>
        </select>
        <button type="button" id="add-object">Ajouter</button>
      </div>
      <div className="control-group">
        <label htmlFor="object-list">Sélection</label>
        <select id="object-list" size="4"></select>
        <button type="button" id="remove-object">Supprimer</button>
      </div>
      <div className="control-group">
        <label htmlFor="object-layer">Calque</label>
        <select id="object-layer">
          <option value="front">Devant</option>
          <option value="back">Derrière</option>
        </select>
      </div>
      <div className="control-group">
        <label htmlFor="object-attach">Coller à</label>
        <select id="object-attach">
          <option value="">Aucun</option>
        </select>
      </div>
    </div>
  );
}
