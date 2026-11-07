const INTERACTIVE = [
  'button', 'a[href]', 'input', 'select', 'textarea', 'option', 'label', 'summary',
  'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]', '[role="link"]', '[role="textbox"]', '[role="checkbox"]',
  '[role="radio"]', '[role="switch"]', '[role="slider"]', '[role="combobox"]',
  '[role="menuitem"]', '[role="tab"]', '[data-screen-input-ignore]',
  '[tabindex]:not(canvas):not([tabindex="-1"])'
].join(',');

export function directionAtScreenX(clientX, bounds) {
  if (!Number.isFinite(clientX) || !Number.isFinite(bounds?.left) || !Number.isFinite(bounds?.width) || bounds.width <= 0) return 0;
  return clientX < bounds.left + bounds.width / 2 ? -1 : 1;
}

function isControl(event, element) {
  const path = event.composedPath?.();
  if (path?.length) {
    for (const node of path) {
      if (node === element) break;
      if (node.matches?.(INTERACTIVE)) return true;
    }
    return false;
  }
  const control = event.target?.closest?.(INTERACTIVE);
  return !!control && control !== element && element.contains(control);
}

/**
 * Hold either half of the supplied game surface. The last finger pressed owns
 * direction until released; an older held finger can then resume. Keyboard
 * and accessible button inputs remain independent of this pointer channel.
 * Returns a cleanup function that releases captures and emits neutral input.
 */
export function attachScreenInput({ element, onDirection }) {
  if (!element?.addEventListener || typeof onDirection !== 'function') {
    throw new TypeError('A game surface and an onDirection callback are required.');
  }
  const doc = element.ownerDocument, win = doc?.defaultView;
  if (!doc || !win) throw new TypeError('The game surface must belong to a document.');
  const pointers = new Map(), removers = [];
  let sequence = 0, direction = 0, disposed = false;
  const previousTouchAction = element.style.getPropertyValue('touch-action');
  const previousTouchPriority = element.style.getPropertyPriority('touch-action');
  // Set before the gesture starts: preventDefault alone cannot stop native
  // scrolling after the browser has already claimed a touch sequence.
  element.style.setProperty('touch-action', 'none');

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    removers.push(() => target.removeEventListener(type, handler, options));
  }
  function publish() {
    let newest = null;
    for (const pointer of pointers.values()) if (!newest || pointer.order > newest.order) newest = pointer;
    const next = newest ? directionAtScreenX(newest.x, element.getBoundingClientRect()) : 0;
    if (next === direction) return;
    direction = next;
    onDirection(next);
  }
  function releaseCapture(pointerId) {
    try {
      if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
    } catch { /* Capture may already have been cancelled by the browser. */ }
  }
  function reset() {
    const ids = [...pointers.keys()];
    pointers.clear();
    for (const id of ids) releaseCapture(id);
    publish();
  }
  function pointerDown(event) {
    if (disposed || event.button !== 0 || isControl(event, element)) return;
    if (!directionAtScreenX(event.clientX, element.getBoundingClientRect())) return;
    if (event.cancelable) event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, order: ++sequence });
    try { element.setPointerCapture(event.pointerId); } catch { /* Window listeners retain release safety. */ }
    publish();
  }
  function pointerMove(event) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    // Recover if a mouse button was released outside the browser and no up
    // event reached this document. Touch/pen sequences use their own cancel.
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) {
      pointerEnd(event);
      return;
    }
    if (event.cancelable) event.preventDefault();
    pointer.x = event.clientX;
    publish();
  }
  function pointerEnd(event) {
    if (!pointers.delete(event.pointerId)) return;
    releaseCapture(event.pointerId);
    publish();
  }
  function contextMenu(event) {
    if (isControl(event, element)) return;
    if (event.cancelable) event.preventDefault();
    reset();
  }

  listen(element, 'pointerdown', pointerDown, { passive: false });
  // Captured events bubble here. These also cover browsers that reject
  // capture, so a release outside the element cannot leave movement stuck.
  listen(win, 'pointermove', pointerMove, { passive: false });
  listen(win, 'pointerup', pointerEnd);
  listen(win, 'pointercancel', pointerEnd);
  listen(element, 'lostpointercapture', pointerEnd);
  listen(element, 'contextmenu', contextMenu);
  listen(win, 'blur', reset);
  listen(win, 'pagehide', reset);
  listen(win, 'resize', reset);
  listen(doc, 'visibilitychange', reset);
  listen(doc, 'fullscreenchange', reset);

  return function cleanup() {
    if (disposed) return;
    disposed = true;
    reset();
    for (const remove of removers) remove();
    if (element.style.getPropertyValue('touch-action') === 'none') {
      if (previousTouchAction) element.style.setProperty('touch-action', previousTouchAction, previousTouchPriority);
      else element.style.removeProperty('touch-action');
    }
  };
}
