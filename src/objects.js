// src/objects.js

import { debugLog } from './debug.js';

/**
 * Initialise la gestion des objets additionnels.
 * Les objets sont chargés depuis le dossier assets/objets et peuvent
 * être ajoutés dans la scène, sélectionnés et manipulés.
 *
 * @param {SVGSVGElement} svgElement - L'élément SVG principal.
 * @param {SVGElement} pantinRoot - Groupe racine du pantin.
 * @param {Object} selection - Gestionnaire de sélection depuis main.js.
 * @param {Function} refreshUI - Fonction pour rafraîchir l'inspecteur.
 */
export function initObjects(svgElement, pantinRoot, selection, refreshUI) {
  const directory = 'assets/objets/';
  const selectEl = document.getElementById('object-select');
  const addBtn = document.getElementById('add-object-btn');
  const behindChk = document.getElementById('object-behind');
  const attachChk = document.getElementById('object-attach');

  if (!selectEl || !addBtn) {
    debugLog('Object controls not found in DOM.');
    return;
  }

  // Récupère la liste des fichiers via l'index généré par le serveur
  async function populateList() {
    try {
      const res = await fetch(directory);
      const txt = await res.text();
      const regex = /href="([^\"]+\.(svg|png))"/g;
      let m;
      while ((m = regex.exec(txt)) !== null) {
        const opt = document.createElement('option');
        opt.value = m[1];
        opt.textContent = m[1];
        selectEl.appendChild(opt);
      }
    } catch (e) {
      console.warn('Impossible de charger la liste des objets:', e);
    }
  }

  function applyTransform(el) {
    const t = el._transform;
    el.setAttribute(
      'transform',
      `translate(${t.tx},${t.ty}) rotate(${t.rotate}) scale(${t.scale})`
    );
  }

  function makeDraggable(el) {
    let dragging = false;
    let startPt;
    const getCoords = evt => {
      const pt = svgElement.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svgElement.getScreenCTM().inverse());
    };

    el.style.cursor = 'move';

    const onMove = e => {
      if (!dragging) return;
      const pt = getCoords(e);
      const t = el._transform;
      t.tx += pt.x - startPt.x;
      t.ty += pt.y - startPt.y;
      startPt = pt;
      applyTransform(el);
    };

    const endDrag = e => {
      dragging = false;
      svgElement.removeEventListener('pointermove', onMove);
    };

    el.addEventListener('pointerdown', e => {
      dragging = true;
      startPt = getCoords(e);
      svgElement.addEventListener('pointermove', onMove);
      e.stopPropagation();
      selection.selectObject(el);
      refreshUI();
    });
    svgElement.addEventListener('pointerup', endDrag);
    svgElement.addEventListener('pointerleave', endDrag);
  }

  async function addObject() {
    const name = selectEl.value;
    if (!name) return;
    let el;
    try {
      if (name.endsWith('.svg')) {
        const res = await fetch(directory + name);
        const txt = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(txt, 'image/svg+xml');
        el = doc.documentElement;
      } else {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', directory + name);
      }
    } catch (e) {
      console.error('Erreur chargement objet', e);
      return;
    }

    el.classList.add('scene-object');
    el.dataset.name = name;
    el._transform = { tx: 0, ty: 0, scale: 1, rotate: 0 };
    applyTransform(el);

    makeDraggable(el);

    if (attachChk.checked) {
      if (behindChk.checked) pantinRoot.insertBefore(el, pantinRoot.firstChild);
      else pantinRoot.appendChild(el);
    } else {
      if (behindChk.checked) svgElement.insertBefore(el, pantinRoot);
      else svgElement.appendChild(el);
    }

    selection.selectObject(el);
    refreshUI();
  }

  addBtn.addEventListener('click', addObject);
  populateList();
}

