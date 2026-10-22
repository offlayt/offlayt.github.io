import { reducedMotion as motionReduced } from '../core/media.js';
import { clamp } from '../core/math.js';
import { stepPendulum } from './physics.js';
import { SurfaceLighting } from './lighting.js';

export class HangingLamp {
  constructor(scene) {
    this.scene = scene;
    this.lamp = scene.querySelector('.lamp');
    this.cordPaths = [...scene.querySelectorAll('.lamp-cord path')];
    this.anchorEl = scene.querySelector('.lamp-anchor');
    this.lastScroll = window.scrollY;
    this.anchorFraction = Number(scene.dataset.lampAnchor || 0.5);
    this.defaultLength = Number(scene.dataset.lampLength || 240);
    this.minLength = Number(scene.dataset.lampMin || 140);
    this.configMax = Number(scene.dataset.lampMax || 410);
    this.length = this.defaultLength;
    this.angle = 0;
    this.angularVelocity = 0;
    this.tilt = 0;
    this.tiltVelocity = 0;
    this.releaseSpeedX = 0;
    this.lastMovementAt = 0;
    this.lit = this.lamp.classList.contains('is-lit');
    this.heroActive = true;
    this.moved = false;
    this.dragging = false;
    this.frame = 0;
    this.lastTime = 0;
    this.lastPointerTime = 0;
    this.pointerSamples = [];
    this.customLength = false;
    this.visible = false;
    this.renderFrame = 0;
    this.lighting = new SurfaceLighting(scene, () => this.requestRender());
    this.measure();
    this.render();
    this.lamp.addEventListener('pointerdown', (event) => this.startDrag(event));
    this.lamp.addEventListener('pointermove', (event) => this.moveDrag(event));
    this.lamp.addEventListener('pointerup', (event) => this.endDrag(event));
    this.lamp.addEventListener('pointercancel', (event) => this.endDrag(event, true));
    this.lamp.addEventListener('keydown', (event) => this.onKey(event));
    this.lamp.addEventListener('click', (event) => {
      if (this.moved) {
        event.preventDefault();
        this.moved = false;
        return;
      }
      this.setLit(!this.lit);
    });
    scene.querySelector('.reset-lamp')?.addEventListener('click', () => this.reset());
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.measure();
        this.render();
      });
      this.resizeObserver.observe(scene);
    } else {
      window.addEventListener('resize', () => {
        this.measure();
        this.render();
      });
    }
    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.animate();
        else this.pause();
      });
      this.visibilityObserver.observe(scene);
    } else {
      this.visible = true;
    }
    // Scrolling gives the original pendulum a small impulse, not a new model.
    window.addEventListener(
      'scroll',
      () => {
        const delta = window.scrollY - this.lastScroll;
        this.lastScroll = window.scrollY;
        if (!this.dragging && !motionReduced.matches) {
          this.angularVelocity = clamp(
            this.angularVelocity + clamp(delta * 0.0008, -0.15, 0.15),
            -2.6,
            2.6,
          );
          this.animate();
        }
        this.requestRender();
      },
      { passive: true },
    );
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.animate();
    });
  }
  measure() {
    this.width = this.scene.clientWidth;
    this.height = this.scene.clientHeight;
    this.lampWidth = this.lamp.offsetWidth;
    this.lampHeight = this.lamp.offsetHeight;
    // The glass center sits low in the image; the socket has separate mass below.
    this.massOffset = this.lampHeight * 0.78;
    this.lightOffset = this.lampHeight * 0.69;
    const sceneBox = this.scene.getBoundingClientRect();
    const mobile = window.matchMedia('(max-width: 850px)').matches;
    const fromHeader =
      this.scene.dataset.lampOrigin === 'header' &&
      !(mobile && this.scene.dataset.lampMobileOrigin === 'scene');
    this.anchorX =
      this.width *
      (mobile ? Number(this.scene.dataset.lampMobileAnchor || 0.82) : this.anchorFraction);
    this.originY = fromHeader
      ? document.querySelector('.header').getBoundingClientRect().bottom - sceneBox.top
      : 0;
    this.anchorEl.style.transform = `translate3d(${this.anchorX - 13}px, ${this.originY - 7}px, 0)`;
    this.maxLength = Math.max(
      this.minLength,
      Math.min(this.configMax, this.height - this.originY - this.lampHeight),
    );
    if (!this.customLength)
      this.length = fromHeader ? this.height * (mobile ? 0.28 : 0.4) : this.defaultLength;
    this.length = clamp(this.length, this.minLength, this.maxLength);
    this.limitAngle();
    this.limitBodyAngle();
  }
  angleBounds() {
    // Leave room for the bulb's glass even when it is turned sideways.
    const edge = this.lampWidth / 2 + this.lampHeight * 0.32;
    const left = Math.max(0, this.anchorX - edge);
    const right = Math.max(0, this.width - edge - this.anchorX);
    return {
      left: Math.min(0.7, Math.asin(clamp(left / this.length, 0, 1))),
      right: Math.min(0.7, Math.asin(clamp(right / this.length, 0, 1))),
    };
  }
  limitAngle() {
    const bounds = this.angleBounds();
    if (this.angle < -bounds.left) {
      this.angle = -bounds.left;
      this.angularVelocity = Math.max(0, this.angularVelocity) * 0.18;
    }
    if (this.angle > bounds.right) {
      this.angle = bounds.right;
      this.angularVelocity = Math.min(0, this.angularVelocity) * 0.18;
    }
  }
  limitBodyAngle() {
    const socketX = this.anchorX + Math.sin(this.angle) * this.length;
    const halfWidth = this.lampWidth / 2;
    const left = Math.min(0.62, Math.asin(clamp((socketX - halfWidth) / this.lampHeight, 0, 1)));
    const right = Math.min(
      0.62,
      Math.asin(clamp((this.width - socketX - halfWidth) / this.lampHeight, 0, 1)),
    );
    if (this.tilt < -left) {
      this.tilt = -left;
      this.tiltVelocity = Math.max(0, this.tiltVelocity);
    }
    if (this.tilt > right) {
      this.tilt = right;
      this.tiltVelocity = Math.min(0, this.tiltVelocity);
    }
  }
  render() {
    if (!this.width || !this.height) return;
    const x = this.anchorX + Math.sin(this.angle) * this.length;
    const y = this.originY + Math.cos(this.angle) * this.length;
    const bulbX = x + Math.sin(this.tilt) * this.lightOffset;
    const bulbY = y + Math.cos(this.tilt) * this.lightOffset;
    // CSS rotation uses the opposite sign for a vector pointing down.
    // Keep the glass and its light on the same side of the socket.
    this.lamp.style.transform = `translate3d(${x - this.lampWidth / 2}px, ${y}px, 0) rotate(${-this.tilt}rad)`;
    // A taut cord is straight; both ends stay fixed to the anchor and socket.
    const cordShape = `M ${this.anchorX} ${this.originY} L ${x} ${y + 2}`;
    this.cordPaths.forEach((path) => path.setAttribute('d', cordShape));
    this.scene.style.setProperty('--light-x', `${bulbX}px`);
    this.scene.style.setProperty('--light-y', `${bulbY}px`);
    this.lighting.render(bulbX, bulbY, this.lit);
  }
  requestRender() {
    if (this.renderFrame) return;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = 0;
      this.render();
    });
  }
  pause() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lamp.classList.remove('is-swinging');
  }
  setHeroActive(active) {
    if (this.heroActive === active) return;
    this.heroActive = active;
    this.setLit(active);
  }

  setLit(lit) {
    lit = Boolean(lit) && this.heroActive;
    this.lit = lit;
    this.lamp.classList.toggle('is-lit', lit);
    this.scene.classList.toggle('is-off', !lit);
    this.lamp.setAttribute('aria-pressed', String(lit));
    this.lamp.setAttribute(
      'aria-label',
      `${lit ? 'Выключить' : 'Включить'} лампочку; перетащите, чтобы раскачать`,
    );
    this.requestRender();
  }
  startDrag(event) {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    event.preventDefault();
    this.pause();
    this.dragging = true;
    const rect = this.scene.getBoundingClientRect();
    this.grabOffsetX =
      event.clientX - rect.left - (this.anchorX + Math.sin(this.angle) * this.length);
    this.grabOffsetY =
      event.clientY - rect.top - (this.originY + Math.cos(this.angle) * this.length);
    this.lastPointerTime = performance.now();
    this.dragSceneLeft = rect.left;
    this.dragSceneTop = rect.top;
    this.angularVelocity = 0;
    this.releaseSpeedX = 0;
    this.pointerSamples = [{ x: event.clientX, y: event.clientY, time: this.lastPointerTime }];
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.lastMovementAt = this.lastPointerTime;
    this.moved = false;
    this.lamp.classList.add('is-dragging');
    this.lamp.setPointerCapture(event.pointerId);
    this.moveDrag(event);
  }
  moveDrag(event) {
    if (!this.dragging) return;
    const pointerX = clamp(
      event.clientX - this.dragSceneLeft - this.grabOffsetX,
      this.lampWidth / 2,
      this.width - this.lampWidth / 2,
    );
    const pointerY = clamp(
      event.clientY - this.dragSceneTop - this.grabOffsetY,
      this.originY + this.minLength * 0.72,
      this.height - this.lampHeight,
    );
    const dx = pointerX - this.anchorX;
    const dy = pointerY - this.originY;
    this.length = clamp(Math.hypot(dx, dy), this.minLength, this.maxLength);
    const bounds = this.angleBounds();
    const nextAngle = clamp(Math.atan2(dx, dy), -bounds.left, bounds.right);
    const now = performance.now();
    if (Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > 6) this.moved = true;
    const last = this.pointerSamples[this.pointerSamples.length - 1];
    if (Math.hypot(event.clientX - last.x, event.clientY - last.y) > 0.5) {
      while (this.pointerSamples.length > 1 && now - this.pointerSamples[0].time > 110)
        this.pointerSamples.shift();
      const first = this.pointerSamples[0];
      this.pointerSamples.push({ x: event.clientX, y: event.clientY, time: now });
      this.releaseSpeedX = clamp(
        (event.clientX - first.x) / Math.max(0.012, (now - first.time) / 1000),
        -1800,
        1800,
      );
      this.lastMovementAt = now;
    }
    this.angularVelocity = clamp(this.releaseSpeedX / (this.length + this.massOffset), -3.2, 3.2);
    this.customLength = true;
    this.angle = nextAngle;
    // Under the pointer the bulb follows the pull directly; inertia starts on release.
    if (this.moved) this.tilt = clamp(this.angle, -0.62, 0.62);
    this.limitBodyAngle();
    this.requestRender();
  }
  endDrag(event, cancelled = false) {
    if (!this.dragging) return;
    const last = this.pointerSamples[this.pointerSamples.length - 1];
    if (!cancelled && Math.hypot(event.clientX - last.x, event.clientY - last.y) > 1)
      this.moveDrag(event);
    this.dragging = false;
    this.lamp.classList.remove('is-dragging');
    if (this.lamp.hasPointerCapture(event.pointerId))
      this.lamp.releasePointerCapture(event.pointerId);
    cancelAnimationFrame(this.renderFrame);
    this.renderFrame = 0;
    if (cancelled) this.releaseSpeedX = 0;
    const freshness = Math.exp(-Math.max(0, performance.now() - this.lastMovementAt - 50) / 160);
    // The socket and glass leave the hand with the same tangential motion.
    // Their different masses separate the motion only after release.
    this.angularVelocity = clamp(
      (this.releaseSpeedX * freshness * 0.8) / (this.length + this.massOffset),
      -2.6,
      2.6,
    );
    this.tiltVelocity = this.angularVelocity;
    if (motionReduced.matches) {
      this.angularVelocity = 0;
      this.tiltVelocity = 0;
      this.tilt = this.angle;
      this.render();
      return;
    }
    this.render();
    this.animate();
  }
  onKey(event) {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') {
      this.reset();
      return;
    }
    if (event.key === 'ArrowUp') {
      this.length = clamp(this.length - 20, this.minLength, this.maxLength);
      this.customLength = true;
    }
    if (event.key === 'ArrowDown') {
      this.length = clamp(this.length + 20, this.minLength, this.maxLength);
      this.customLength = true;
    }
    if (event.key === 'ArrowLeft') {
      this.angularVelocity = clamp(this.angularVelocity - 0.7, -2.6, 2.6);
      this.tiltVelocity = this.angularVelocity;
    }
    if (event.key === 'ArrowRight') {
      this.angularVelocity = clamp(this.angularVelocity + 0.7, -2.6, 2.6);
      this.tiltVelocity = this.angularVelocity;
    }
    if (motionReduced.matches) {
      if (event.key === 'ArrowLeft') this.angle -= 0.06;
      if (event.key === 'ArrowRight') this.angle += 0.06;
      this.angularVelocity = 0;
      this.limitAngle();
      this.tilt = this.angle;
      this.tiltVelocity = 0;
      this.limitBodyAngle();
      this.render();
    } else {
      this.render();
      this.animate();
    }
  }
  animate() {
    if (this.frame || this.dragging || !this.visible || document.hidden || motionReduced.matches)
      return;
    if (
      Math.abs(this.angle) < 0.002 &&
      Math.abs(this.angularVelocity) < 0.02 &&
      Math.abs(this.tilt) < 0.002 &&
      Math.abs(this.tiltVelocity) < 0.02
    )
      return;
    this.lamp.classList.add('is-swinging');
    this.lastTime = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.032, (now - this.lastTime) / 1000);
      this.lastTime = now;
      stepPendulum(this, dt);
      this.limitAngle();
      this.limitBodyAngle();
      this.render();
      if (
        Math.abs(this.angle) < 0.002 &&
        Math.abs(this.angularVelocity) < 0.02 &&
        Math.abs(this.tilt) < 0.002 &&
        Math.abs(this.tiltVelocity) < 0.02
      ) {
        this.angle = 0;
        this.angularVelocity = 0;
        this.tilt = 0;
        this.tiltVelocity = 0;
        this.frame = 0;
        this.lamp.classList.remove('is-swinging');
        this.render();
      } else {
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }
  reset() {
    this.pause();
    this.angle = 0;
    this.angularVelocity = 0;
    this.tilt = 0;
    this.tiltVelocity = 0;
    this.customLength = false;
    this.length = clamp(this.defaultLength, this.minLength, this.maxLength);
    this.measure();
    this.render();
  }
}
