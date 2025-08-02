// src/timeline.js

/**
 * Gestion de la timeline d'animation (frames)
 * Un frame = { segmentId: { rotate: angleDeg }, ... }
 * L'ensemble est un tableau : animation[frameIndex] = { ... }
 */

export class Timeline {
  constructor(memberList, initialFrame = null) {
    // memberList : array des IDs des segments animables
    this.memberList = memberList;
    this.frames = [initialFrame || this.createEmptyFrame()];
    this.current = 0;
    this.playing = false;
    this._interval = null;
  }

  createEmptyFrame() {
    // Génère un frame vierge (tous les membres à rotation 0)
    const frame = {};
    this.memberList.forEach(id => frame[id] = { rotate: 0 });
    return frame;
  }

  getCurrentFrame() {
    return this.frames[this.current];
  }

  setCurrentFrame(index) {
    if (index < 0 || index >= this.frames.length) return;
    this.current = index;
    return this.getCurrentFrame();
  }

  updateMember(id, value) {
    // Modifie la rotation d'un membre à la frame courante
    if (!this.memberList.includes(id)) return;
    this.frames[this.current][id] = { ...this.frames[this.current][id], ...value };
  }

  addFrame(duplicate = true) {
    // Ajoute une nouvelle frame (clone de la courante par défaut)
    let newFrame = duplicate
      ? JSON.parse(JSON.stringify(this.getCurrentFrame()))
      : this.createEmptyFrame();
    this.frames.splice(this.current + 1, 0, newFrame);
    this.current++;
    return this.getCurrentFrame();
  }

  deleteFrame(index = this.current) {
    if (this.frames.length <= 1) return; // Minimum 1 frame
    this.frames.splice(index, 1);
    if (this.current >= this.frames.length) this.current = this.frames.length - 1;
    return this.getCurrentFrame();
  }

  nextFrame() {
    if (this.current < this.frames.length - 1) this.current++;
    return this.getCurrentFrame();
  }

  prevFrame() {
    if (this.current > 0) this.current--;
    return this.getCurrentFrame();
  }

  play(callback, onEnd, fps = 8) {
    // callback(frame, index)
    if (this.playing) return;
    this.playing = true;
    let i = this.current;
    this._interval = setInterval(() => {
      if (i >= this.frames.length) {
        this.stop();
        if (typeof onEnd === 'function') onEnd();
        return;
      }
      callback(this.frames[i], i);
      i++;
    }, 1000 / fps);
  }

  stop() {
    this.playing = false;
    clearInterval(this._interval);
    this._interval = null;
  }

  exportJSON() {
    return JSON.stringify(this.frames, null, 2);
  }

  importJSON(json) {
    try {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr)) throw "Invalid format";
      // On vérifie que chaque frame a bien tous les membres
      arr.forEach(f => {
        this.memberList.forEach(id => {
          if (!f[id]) f[id] = { rotate: 0 };
        });
      });
      this.frames = arr;
      this.current = 0;
    } catch (e) {
      throw new Error("Échec import : " + e);
    }
  }
}

