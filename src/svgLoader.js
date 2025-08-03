// src/svgLoader.js

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

  target.innerHTML = svgText;
  const svgElement = target.querySelector('svg');
  if (!svgElement) throw new Error("Aucun élément <svg> trouvé dans le fichier chargé.");

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
    if (ch && pr && ch.parentNode !== pr) pr.appendChild(ch);
  });

  const torso = svgElement.getElementById("torse");
  ["tete", "bras_gauche", "bras_droite", "jambe_gauche", "jambe_droite"].forEach(id => {
    const el = svgElement.getElementById(id);
    if (el && torso && torso.parentNode) torso.parentNode.insertBefore(el, torso);
  });

  const joints = [
    ['avant_bras_droite','coude_droite'],
    ['avant_bras_gauche','coude_gauche'],
    ['tibia_droite','genou_droite'],
    ['tibia_gauche','genou_gauche'],
    ['bras_droite','epaule_droite'],
    ['bras_gauche','epaule_gauche'],
    ['jambe_droite','hanche_droite'],
    ['jambe_gauche','hanche_gauche'],
    ['tete','cou']
  ];

  const memberList = Array.from(new Set(joints.map(([seg]) => seg)));

  const pivots = {};
  joints.forEach(([segment, pivotId]) => {
    const pivotEl = svgElement.getElementById(pivotId);
    const segmentEl = svgElement.getElementById(segment);
    if (!pivotEl || !segmentEl || !segmentEl.parentNode) return;

    // Coordonnées globales du centre du pivot au chargement
    const pivotRect = pivotEl.getBoundingClientRect();
    const svgRect = svgElement.getBoundingClientRect();
    const globalPivotPos = {
        x: pivotRect.left + pivotRect.width / 2 - svgRect.left,
        y: pivotRect.top + pivotRect.height / 2 - svgRect.top
    };

    // Matrice pour passer du repère global au repère local du parent
    const parentInverseCTM = segmentEl.parentNode.getCTM().inverse();

    const point = svgElement.createSVGPoint();
    point.x = globalPivotPos.x;
    point.y = globalPivotPos.y;

    // On stocke la coordonnée du pivot dans le repère de son parent
    pivots[segment] = point.matrixTransform(parentInverseCTM);
  });

  return { svgElement, memberList, pivots };
}
