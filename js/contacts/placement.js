/** A CSS-hidden mobile pill has hidden=false but an empty layout rectangle on desktop. */
export function telephonePlacement(consultRect, triggerRect, viewportWidth, viewportHeight, propWidth) {
  const useConsult = consultRect && consultRect.width > 0 && consultRect.height > 0;
  const anchor = useConsult ? consultRect : triggerRect;
  const half = propWidth / 2 + 8;
  const desired = useConsult ? anchor.left + anchor.width / 2 : viewportWidth / 2;
  return {
    x: Math.max(half, Math.min(viewportWidth - half, desired)),
    bottom: Math.max(14, viewportHeight - anchor.top),
  };
}
