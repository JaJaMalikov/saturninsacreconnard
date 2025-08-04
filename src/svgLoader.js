// src/svgLoader.js
import { debugLog } from './debug.js';

/**
 * Charge le fichier SVG, l'injecte dans le DOM et prépare les éléments.
 * @param {string} url - URL du fichier SVG (ex: "manu.svg")
 * @param {string} targetId - ID de l'élément où injecter le SVG (ex: "theatre")
 * @returns {Promise<{svgElement, memberList, pivots}>}
 */
export async function loadSVG(url, targetId) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const svgText = await response.text();

  const target = document.getElementById(targetId);
  if (!target) throw new Error(`Element cible #${targetId} introuvable`);

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  if (!svgElement) throw new Error('Aucun élément <svg> trouvé dans le fichier chargé.');
  svgElement.querySelectorAll('script').forEach(s => s.remove());

  target.innerHTML = '';
  target.appendChild(svgElement);

  svgElement.setAttribute('width', '100%');
  svgElement.setAttribute('height', '100%');
  svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  [
    ["main_droite", "avant_bras_droite"],
    ["main_gauche", "avant_bras_gauche"],
    ["pied_droite", "tibia_droite"],
    ["pied_gauche", "tibia_gauche"],
  ].forEach(([childId, parentId]) => {
    const ch = svgElement.getElementById(childId);
    const pr = svgElement.getElementById(parentId);
    if (ch && pr) {
      if (ch.parentNode !== pr) {
        pr.appendChild(ch);
        debugLog(`Reparented ${childId} under ${parentId}`);
      }
    } else {
      console.warn(`Missing element for reparenting: child=${childId}, parent=${parentId}`);
    }
  });

  const torso = svgElement.getElementById('torse');
  ['tete', 'bras_gauche', 'bras_droite', 'jambe_gauche', 'jambe_droite'].forEach(id => {
    const el = svgElement.getElementById(id);
    if (el && torso && torso.parentNode) {
      torso.parentNode.insertBefore(el, torso);
      debugLog(`Moved ${id} before torse`);
    } else {
      console.warn(`Unable to reinsert ${id} before torse`);
    }
  });

  const joints = [
    ['avant_bras_droite', 'coude_droite'],
    ['avant_bras_gauche', 'coude_gauche'],
    ['tibia_droite', 'genou_droite'],
    ['tibia_gauche', 'genou_gauche'],
    ['bras_droite', 'epaule_droite'],
    ['bras_gauche', 'epaule_gauche'],
    ['jambe_droite', 'hanche_droite'],
    ['jambe_gauche', 'hanche_gauche'],
    ['tete', 'cou'],
  ];

  const memberList = Array.from(new Set(joints.map(([seg]) => seg)));

  const pivots = {};
  joints.forEach(([segment, pivotId]) => {
    const pivotEl = svgElement.getElementById(pivotId);
    const segmentEl = svgElement.getElementById(segment);
    if (!pivotEl || !segmentEl || !segmentEl.parentNode) return;

    // Coordonnées globales du centre du pivot au chargement
    const pivotBox = pivotEl.getBBox();
    const pivotPoint = svgElement.createSVGPoint();
    pivotPoint.x = pivotBox.x + pivotBox.width / 2;
    pivotPoint.y = pivotBox.y + pivotBox.height / 2;
    const globalPivot = pivotPoint.matrixTransform(pivotEl.getCTM());

    const parentInverseCTM = segmentEl.parentNode.getCTM().inverse();

    pivots[segment] = globalPivot.matrixTransform(parentInverseCTM);
  });

  return { svgElement, memberList, pivots };
}
