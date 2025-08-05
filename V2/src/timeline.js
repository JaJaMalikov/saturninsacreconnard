// src/timeline.js

/**
 * Gestion de la timeline d'animation (frames)
 * Une frame = {
 *   transform: { tx, ty, scale, rotate },
 *   members: { segmentId: { rotate: angleDeg }, ... },
 *   objects: { objectId: { x, y, scale, rotate, layer, attachedTo, src } }
 * }
 */

export class Timeline {
  constructor(memberList, initialFrame = null) {
    this.memberList = memberList;
    this.frames = [initialFrame || this.createEmptyFrame()];
    this.current = 0;
    this.playing = false;
    this._rafId = null;
    this.objectStore = {};
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
    const updated = { ...frame.transform, ...values };
    if ('scale' in values) {
      updated.scale = Math.min(Math.max(updated.scale, 0.1), 10);
    }
    if ('rotate' in values) {
      updated.rotate = ((updated.rotate % 360) + 360) % 360;
    }
    frame.transform = updated;
  }

  addObject(id, data) {
    const { src, width, height, ...transform } = data;
    this.objectStore[id] = { src, width, height };
    this.frames.forEach(f => {
      f.objects[id] = { ...transform };
    });
  }

  updateObject(id, values) {
    const frame = this.getCurrentFrame();
    if (!frame.objects[id]) return;
    const constant = {};
    const transform = { ...frame.objects[id] };
    ['src', 'width', 'height'].forEach(k => {
      if (k in values) constant[k] = values[k];
    });
    Object.assign(transform, values);
    if ('scale' in values) {
      transform.scale = Math.min(Math.max(transform.scale, 0.1), 10);
    }
    if ('rotate' in values) {
      transform.rotate = ((transform.rotate % 360) + 360) % 360;
    }
    frame.objects[id] = transform;
    if (Object.keys(constant).length) {
      this.objectStore[id] = { ...this.objectStore[id], ...constant };
    }
  }

  removeObject(id) {
    delete this.objectStore[id];
    this.frames.forEach(f => {
      delete f.objects[id];
    });
  }

  getObject(id) {
    const frame = this.getCurrentFrame();
    const transform = frame.objects[id];
    if (!transform) return null;
    return { ...this.objectStore[id], ...transform };
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

  loop(callback, fps = 8, options = {}) {
    return this.play(callback, null, fps, { ...options, loop: true });
  }

  stop() {
    this.playing = false;
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  exportJSON() {
    return JSON.stringify({ frames: this.frames, objects: this.objectStore }, null, 2);
  }

  importJSON(json) {
    try {
      const data = JSON.parse(json);
      let arr;
      if (Array.isArray(data)) {
        arr = data;
        this.objectStore = {};
      } else if (data && Array.isArray(data.frames)) {
        arr = data.frames;
        this.objectStore = data.objects || {};
      } else {
        throw new Error('Invalid format');
      }

      // Rétro-compatibilité : convertir l'ancien format
      const migratedFrames = arr.map(f => {
        if (f.members && f.transform) {
          return {
            transform: f.transform,
            members: f.members,
            objects: f.objects || {},
          };
        }
        return this._migrateOldFrame(f);
      });

      migratedFrames.forEach(frame => {
        Object.entries(frame.objects).forEach(([id, obj]) => {
          if (!this.objectStore[id]) {
            const { src, width = 100, height = 100 } = obj;
            this.objectStore[id] = { src, width, height };
          }
          delete obj.src;
          delete obj.width;
          delete obj.height;
        });
      });

      this.frames = migratedFrames;
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
    // Les transformations globales seront celles par défaut
    newFrame.objects = {};
    return newFrame;
  }
}

