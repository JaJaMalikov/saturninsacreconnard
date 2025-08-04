// src/timeline.js

/**
 * Gestion de la timeline d'animation (frames)
 * Une frame = {
 *   transform: { tx, ty, scale, rotate },
 *   members: { segmentId: { rotate: angleDeg }, ... }
 * }
 */

export class Timeline {
  constructor(memberList, initialFrame = null) {
    this.memberList = memberList;
    this.objects = [];
    this.frames = [initialFrame || this.createEmptyFrame()];
    this.current = 0;
    this.playing = false;
    this._rafId = null;
  }

  createEmptyFrame() {
    const members = {};
    this.memberList.forEach(id => (members[id] = { rotate: 0 }));
    return {
      transform: { tx: 0, ty: 0, scale: 1, rotate: 0 },
      members,
      objects: {},
    };
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
    if (!this.memberList.includes(id)) return;
    const frame = this.getCurrentFrame();
    frame.members[id] = { ...frame.members[id], ...value };
  }

  updateTransform(values) {
    const frame = this.getCurrentFrame();
    frame.transform = { ...frame.transform, ...values };
  }

  addObject(obj) {
    this.objects.push(obj);
    this.frames.forEach(f => {
      f.objects[obj.id] = { tx: 0, ty: 0, scale: 1, rotate: 0 };
    });
  }

  removeObject(id) {
    this.objects = this.objects.filter(o => o.id !== id);
    this.frames.forEach(f => delete f.objects[id]);
  }

  updateObject(id, values) {
    const frame = this.getCurrentFrame();
    frame.objects[id] = { ...frame.objects[id], ...values };
  }

  addFrame(duplicate = true) {
    let newFrame;
    if (duplicate) {
      const currentFrame = this.getCurrentFrame();
      newFrame = typeof structuredClone === 'function'
        ? structuredClone(currentFrame)
        : JSON.parse(JSON.stringify(currentFrame));
    } else {
      newFrame = this.createEmptyFrame();
    }
    this.frames.splice(this.current + 1, 0, newFrame);
    this.current++;
    return this.getCurrentFrame();
  }

  deleteFrame(index = this.current) {
    if (this.frames.length <= 1) return;
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

  play(callback, onEnd, fps = 8, options = {}) {
    if (this.playing) return;
    const { loop = false, rewind = false, reverse = false } = options;
    this.playing = true;
    const direction = reverse ? -1 : 1;
    let i = this.current;
    const frameDuration = 1000 / fps;
    let lastTime = performance.now();

    const step = time => {
      if (!this.playing) return;
      if (time - lastTime >= frameDuration) {
        if (i < 0 || i >= this.frames.length) {
          if (loop) {
            i = reverse ? this.frames.length - 1 : 0;
          } else {
            this.stop();
            if (rewind) this.current = reverse ? this.frames.length - 1 : 0;
            if (typeof onEnd === 'function') onEnd();
            return;
          }
        }
        callback(this.frames[i], i);
        i += direction;
        lastTime = time;
      }
      this._rafId = requestAnimationFrame(step);
    };

    this._rafId = requestAnimationFrame(step);
  }

  stop() {
    this.playing = false;
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  exportJSON() {
    return JSON.stringify({
      objects: this.objects,
      frames: this.frames,
    }, null, 2);
  }

  importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        // Ancien format : tableau de frames
        const migratedFrames = data.map(f => {
          if (f.members && f.transform) return { ...f, objects: {} };
          return this._migrateOldFrame(f);
        });
        this.frames = migratedFrames;
        this.objects = [];
      } else {
        this.objects = data.objects || [];
        this.frames = (data.frames || []).map(f => ({
          transform: f.transform || { tx: 0, ty: 0, scale: 1, rotate: 0 },
          members: f.members || {},
          objects: f.objects || {},
        }));
      }
      // S'assurer que chaque frame a les objets existants
      this.frames.forEach(f => {
        this.objects.forEach(o => {
          if (!f.objects[o.id]) f.objects[o.id] = { tx: 0, ty: 0, scale: 1, rotate: 0 };
        });
      });
      this.current = 0;
    } catch (e) {
      throw new Error('Échec import : ' + e);
    }
  }

  _migrateOldFrame(oldFrame) {
    const newFrame = this.createEmptyFrame();
    this.memberList.forEach(id => {
      if (oldFrame[id] && typeof oldFrame[id].rotate !== 'undefined') {
        newFrame.members[id] = { rotate: oldFrame[id].rotate };
      }
    });
    return newFrame;
  }
}

