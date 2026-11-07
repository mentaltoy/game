import test from 'node:test';
import assert from 'node:assert/strict';
import { attachScreenInput, directionAtScreenX } from '../dist/screen-input.js';

class Surface {
  listeners = new Map();
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.listeners.get(type)?.delete(handler); }
  emit(type, props = {}) {
    const event = { button: 0, pointerId: 1, clientX: 120, pointerType: 'touch', buttons: 1, cancelable: true,
      prevented: false, preventDefault() { this.prevented = true; }, ...props };
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
    return event;
  }
}
function fixture({ captureFails = false } = {}) {
  const win = new Surface(), doc = new Surface(), element = new Surface(), values = [], captures = new Set();
  const styles = new Map([['touch-action', 'pan-y']]), priority = new Map([['touch-action', 'important']]);
  doc.defaultView = win; element.ownerDocument = doc;
  element.style = {
    getPropertyValue: key => styles.get(key) || '', getPropertyPriority: key => priority.get(key) || '',
    setProperty: (key, value, rank = '') => { styles.set(key, value); priority.set(key, rank); },
    removeProperty: key => { styles.delete(key); priority.delete(key); }
  };
  element.getBoundingClientRect = () => ({ left: 100, width: 400 });
  element.contains = node => !!node;
  element.setPointerCapture = id => { if (captureFails) throw new Error('Capture unavailable'); captures.add(id); };
  element.hasPointerCapture = id => captures.has(id);
  element.releasePointerCapture = id => { captures.delete(id); element.emit('lostpointercapture', { pointerId: id }); };
  const cleanup = attachScreenInput({ element, onDirection: direction => values.push(direction) });
  return { win, doc, element, values, captures, cleanup };
}

test('halves use the current surface bounds and reject invalid geometry', () => {
  assert.equal(directionAtScreenX(299.9, { left: 100, width: 400 }), -1);
  assert.equal(directionAtScreenX(300, { left: 100, width: 400 }), 1);
  assert.equal(directionAtScreenX(-20, { left: 100, width: 400 }), -1);
  assert.equal(directionAtScreenX(120, { left: 100, width: 0 }), 0);
  assert.equal(directionAtScreenX(NaN, { left: 100, width: 400 }), 0);
});

test('hold, cross the middle, then release outside the surface', () => {
  const f = fixture();
  assert.equal(f.element.emit('pointerdown').prevented, true);
  assert.equal(f.captures.has(1), true);
  f.win.emit('pointermove', { clientX: 440 });
  f.win.emit('pointermove', { clientX: 450 });
  f.win.emit('pointerup', { clientX: 900 });
  assert.deepEqual(f.values, [-1, 1, 0]);
  assert.equal(f.captures.size, 0);
  f.cleanup();
});

test('the newest held finger wins and releasing it resumes the older one', () => {
  const f = fixture();
  f.element.emit('pointerdown', { pointerId: 1, clientX: 120 });
  f.element.emit('pointerdown', { pointerId: 2, clientX: 440, isPrimary: false });
  f.win.emit('pointermove', { pointerId: 1, clientX: 140 });
  assert.deepEqual(f.values, [-1, 1]);
  f.win.emit('pointerup', { pointerId: 2 });
  f.win.emit('pointercancel', { pointerId: 1 });
  assert.deepEqual(f.values, [-1, 1, -1, 0]);
  f.cleanup();
});

test('nested interactive controls keep their default gesture', () => {
  const f = fixture(), icon = { matches: () => false }, button = { matches: () => true };
  const event = f.element.emit('pointerdown', { composedPath: () => [icon, button, f.element, f.doc, f.win] });
  assert.equal(event.prevented, false);
  assert.equal(f.captures.size, 0);
  assert.deepEqual(f.values, []);
  f.cleanup();
});

test('pointer cancellation or lost capture never leaves input held', () => {
  for (const type of ['pointercancel', 'lostpointercapture']) {
    const f = fixture();
    f.element.emit('pointerdown');
    (type === 'lostpointercapture' ? f.element : f.win).emit(type);
    assert.deepEqual(f.values, [-1, 0]);
    assert.equal(f.captures.size, 0);
    f.cleanup();
  }
});

test('blur, page changes and layout changes clear every held pointer', () => {
  for (const [target, type] of [['win', 'blur'], ['win', 'pagehide'], ['win', 'resize'], ['doc', 'visibilitychange'], ['doc', 'fullscreenchange']]) {
    const f = fixture();
    f.element.emit('pointerdown', { pointerId: 1 });
    f.element.emit('pointerdown', { pointerId: 2, clientX: 440 });
    f[target].emit(type);
    assert.deepEqual(f.values, [-1, 1, 0]);
    assert.equal(f.captures.size, 0);
    f.win.emit('pointermove', { pointerId: 1, clientX: 120 });
    assert.equal(f.values.length, 3);
    f.cleanup();
  }
});

test('window release remains safe when pointer capture is unavailable', () => {
  const f = fixture({ captureFails: true });
  f.element.emit('pointerdown');
  f.win.emit('pointermove', { clientX: 450 });
  f.win.emit('pointerup');
  assert.deepEqual(f.values, [-1, 1, 0]);
  f.cleanup();
});

test('secondary mouse buttons are ignored and a missing up event is recovered', () => {
  const f = fixture();
  assert.equal(f.element.emit('pointerdown', { button: 2, pointerType: 'mouse' }).prevented, false);
  f.element.emit('pointerdown', { pointerType: 'mouse' });
  f.win.emit('pointermove', { pointerType: 'mouse', buttons: 0 });
  assert.deepEqual(f.values, [-1, 0]);
  f.cleanup();
});

test('cleanup releases movement, restores styles and detaches all listeners', () => {
  const f = fixture();
  assert.equal(f.element.style.getPropertyValue('touch-action'), 'none');
  f.element.emit('pointerdown');
  f.cleanup(); f.cleanup();
  assert.deepEqual(f.values, [-1, 0]);
  assert.equal(f.element.style.getPropertyValue('touch-action'), 'pan-y');
  assert.equal(f.element.style.getPropertyPriority('touch-action'), 'important');
  f.element.emit('pointerdown'); f.win.emit('pointermove', { clientX: 440 });
  assert.deepEqual(f.values, [-1, 0]);
  for (const target of [f.element, f.doc, f.win]) for (const listeners of target.listeners.values()) assert.equal(listeners.size, 0);
});
