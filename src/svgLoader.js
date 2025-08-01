// src/svgLoader.js

/**
 * Charge le SVG dans l'élément cible et prépare :
 *  - memberList : liste des ids des groupes animables
 *  - pivots : objet { id: { x, y } } pour chaque membre (point pivot exact, pas centre bbox)
 *  - svgDoc : document SVG manipulable
 *  - joints : liste des [segment, pivot, extrémité]
 *
 * @param {string} containerId - id de l'élément qui contiendra le SVG
 * @param {string} url        - chemin du fichier SVG
 * @returns {Promise<{svgDoc, memberList, pivots, joints}>}
 */
export function loadSVG(containerId = "pantin", url = "manu.svg") {
  return new Promise((resolve, reject) => {
    const container = document.getElementById(containerId);
    if (!container) return reject(new Error(`Élément #${containerId} introuvable`));

    fetch(url)
      .then(r => r.text())
      .then(text => {
        container.innerHTML = text;
        const svgDoc = container.querySelector('svg');
        if (!svgDoc) throw new Error('SVG introuvable');
        prepare(svgDoc);
      })
      .catch(err => reject(err));

    function prepare(svgDoc) {
      const root = svgDoc;

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
      });

      resolve({ svgDoc, memberList, pivots, joints });
    }
  });
}

