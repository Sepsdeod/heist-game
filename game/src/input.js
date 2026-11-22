// The Velvet Vault — keyboard and mouse: which keys are held, where the
// mouse clicked, and the one-shot actions (Enter, Space, P, M).
const KEYS = new Set();

export function installInput(canvas, handlers) {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    KEYS.add(key);
    if (key === 'enter') handlers.onConfirm();
    if (key === ' ') handlers.onSmoke();
    if (key === 'p') handlers.onPause();
    if (key === 'm') handlers.onMute();
  });
  window.addEventListener('keyup', (event) => {
    KEYS.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => KEYS.clear());
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    handlers.onThrowCoin(
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY,
    );
  });
  // Keep the game from scrolling the page when the thief runs.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

// The held movement keys, read fresh every frame by the game loop.
export function readMovement() {
  return {
    up: KEYS.has('w') || KEYS.has('arrowup'),
    down: KEYS.has('s') || KEYS.has('arrowdown'),
    left: KEYS.has('a') || KEYS.has('arrowleft'),
    right: KEYS.has('d') || KEYS.has('arrowright'),
    sneak: KEYS.has('shift'),
  };
}

export function clearKeys() {
  KEYS.clear();
}
