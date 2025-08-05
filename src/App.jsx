import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import './style.css';
import { initApp } from './initApp.js';

export default function App() {
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    localStorage.getItem('inspector-collapsed') === 'true'
  );

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initApp();
    initRef.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('inspector-collapsed', inspectorCollapsed);
  }, [inspectorCollapsed]);

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed(prev => !prev);
  }, []);

  const containerClass = useMemo(
    () => `app-container${inspectorCollapsed ? ' inspector-collapsed' : ''}`,
    [inspectorCollapsed]
  );

  return (
    <div id="app-container" className={containerClass}>
      <aside id="inspector-panel" role="region" aria-label="Contrôles de l'inspecteur">
        <h3>Inspecteur</h3>
        <div id="selection-info">
          <label htmlFor="selected-element-name">Sélection</label>
          <output id="selected-element-name">Pantin</output>
        </div>
        <div id="pantin-controls">
          <div className="control-group">
            <label htmlFor="scale-value">Échelle</label>
            <div className="value-stepper">
              <button type="button" id="scale-minus" aria-label="Diminuer l'échelle">-</button>
              <input type="number" id="scale-value" step="0.1" defaultValue="1.00" />
              <button type="button" id="scale-plus" aria-label="Augmenter l'échelle">+</button>
            </div>
          </div>
          <div className="control-group">
            <label htmlFor="rotate-value">Rotation</label>
            <div className="value-stepper">
              <button type="button" id="rotate-minus" aria-label="Diminuer la rotation">-</button>
              <input type="number" id="rotate-value" step="1" defaultValue="0" />
              <button type="button" id="rotate-plus" aria-label="Augmenter la rotation">+</button>
            </div>
          </div>
        </div>
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
        <div id="onion-skin-controls" role="region" aria-label="Contrôles Onion Skin">
          <h3>Onion Skin</h3>
          <div className="control-group">
            <input type="checkbox" id="onion-skin-toggle" />
            <label htmlFor="onion-skin-toggle">Activer</label>
          </div>
          <div className="control-group">
            <label htmlFor="past-frames">Images passées</label>
            <input type="number" id="past-frames" defaultValue="1" min="0" max="10" />
          </div>
          <div className="control-group">
            <label htmlFor="future-frames">Images futures</label>
            <input type="number" id="future-frames" defaultValue="1" min="0" max="10" />
          </div>
        </div>
      </aside>
      <main id="theatre" role="main"></main>
      <footer id="timeline-panel" role="contentinfo">
        <div id="timeline-controls">
          <button type="button" id="prevFrame" title="Image précédente" aria-label="Image précédente">⏮️</button>
          <button type="button" id="playAnim" title="Lire l'animation" aria-label="Lire l'animation">▶️</button>
          <button type="button" id="stopAnim" title="Arrêter" aria-label="Arrêter">⏹️</button>
          <button type="button" id="loopToggle" title="Boucle activée" aria-label="Activer ou désactiver la boucle">🔁</button>
          <button type="button" id="nextFrame" title="Image suivante" aria-label="Image suivante">⏭️</button>
        </div>
        <div id="timeline-slider-container">
          <label htmlFor="timeline-slider" className="sr-only">Timeline</label>
          <input type="range" id="timeline-slider" min="0" max="0" step="1" defaultValue="0" />
          <output id="frameInfo" htmlFor="timeline-slider" aria-live="polite">1 / 1</output>
        </div>
        <div id="timeline-actions">
          <div className="control-group fps-control">
            <label htmlFor="fps-input">FPS</label>
            <input type="number" id="fps-input" defaultValue="10" min="1" max="60" />
          </div>
          <button type="button" id="addFrame" title="Ajouter une image" aria-label="Ajouter une image">➕</button>
          <button type="button" id="delFrame" title="Supprimer l'image" aria-label="Supprimer l'image">🗑️</button>
        </div>
        <div id="app-actions">
          <button
            type="button"
            id="inspector-toggle-btn"
            title="Afficher/Masquer l'inspecteur"
            aria-label="Afficher/Masquer l'inspecteur"
            onClick={toggleInspector}
          >
            ↔️
          </button>
          <button type="button" id="exportAnim" title="Exporter l'animation" aria-label="Exporter l'animation">💾 Export</button>
          <label htmlFor="importAnim" id="importAnimBtn" className="button" tabIndex="0" aria-label="Importer l'animation">📂 Import</label>
          <input type="file" id="importAnim" accept=".json" style={{display: 'none'}} />
          <button type="button" id="resetStorage" title="Réinitialiser le projet" aria-label="Réinitialiser le projet">⚠️</button>
        </div>
      </footer>
    </div>
  );
}
