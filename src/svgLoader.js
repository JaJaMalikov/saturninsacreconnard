// src/svgLoader.js

/**
 * Charge le SVG dans un conteneur HTML et prépare :
 *  - memberList : liste des ids des groupes animables
 *  - pivots : objet { id: { x, y } } pour chaque membre (point pivot exact, pas centre bbox)
 *  - svgDoc : document SVG manipulable
 *  - joints : liste des [segment, pivot, extrémité]
 *
 * @param {string} containerId - id de l'élément conteneur où injecter le SVG
 * @param {string} url - chemin du fichier SVG
 * @returns {Promise<{svgDoc, memberList, pivots, joints, pivotMap}>}
 */
export async function loadSVG(containerId = "pantin", url = "manu.svg") {
  const container = document.getElementById(containerId);
  if (!container) throw new Error(`Élément #${containerId} introuvable`);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Échec chargement ${url}`);
  const text = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");
  const svgEl = document.importNode(doc.documentElement, true);
  svgEl.setAttribute("id", containerId);
  container.replaceWith(svgEl);

  return prepare(svgEl);

  function prepare(svgElement) {
      const svgDoc = svgElement.ownerDocument;
      const root = svgElement;

      // -- Re-parenting comme dans ton code d'origine --
      [
        ["main_droite", "avant_bras_droite"],
        ["main_gauche", "avant_bras_gauche"],
        ["pied_droite", "tibia_droite"],
        ["pied_gauche", "tibia_gauche"],
      ].forEach(([childId, parentId]) => {
        const ch = svgDoc.getElementById(childId);
        const pr = svgDoc.getElementById(parentId);
        if (ch && pr && ch.parentNode !== pr) pr.appendChild(ch);
      });

      // -- Layering pour placer membres devant le torse --
      const torso = svgDoc.getElementById("torse");
      ["tete", "bras_gauche", "bras_droite", "jambe_gauche", "jambe_droite"].forEach(id => {
        const el = svgDoc.getElementById(id);
        if (el && torso && torso.parentNode) torso.parentNode.insertBefore(el, torso);
      });

      // -- Table joints (repris de ta base) --
      const joints = [
        ['avant_bras_droite','coude_droite','main_droite'],
        ['avant_bras_gauche','coude_gauche','main_gauche'],
        ['tibia_droite','genou_droite','pied_droite'],
        ['tibia_gauche','genou_gauche','pied_gauche'],
        ['bras_droite','epaule_droite','coude_droite'],
        ['bras_gauche','epaule_gauche','coude_gauche'],
        ['jambe_droite','hanche_droite','genou_droite'],
        ['jambe_gauche','hanche_gauche','genou_gauche'],
        ['tete','cou','tete']
      ];

      // -- Détection automatique des membres animables : les segments/joints --
      const memberList = Array.from(
        new Set(joints.map(([seg]) => seg))
      );

      const pivotMap = {};

      // -- Calcul précis des pivots --
      // Pour chaque segment, le pivot est la position du node pivot (son centre bbox ou son centre "visuel" si c'est un cercle)
      const pivots = {};
      joints.forEach(([segment, pivot, extr]) => {
        const pivEl = svgDoc.getElementById(pivot);
        if (!pivEl) return;
        let pt;
        // Si c'est un cercle, le pivot est (cx, cy)
        if (pivEl.tagName === "circle" || pivEl.tagName === "ellipse") {
          pt = { 
            x: parseFloat(pivEl.getAttribute('cx')), 
            y: parseFloat(pivEl.getAttribute('cy')) 
          };
        } else {
          // Sinon, on prend le centre du bbox
          let box = pivEl.getBBox();
          pt = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }
        pivots[segment] = pt;
        pivotMap[segment] = pivot;
      });

      return { svgDoc, memberList, pivots, joints, pivotMap };
    }
}

