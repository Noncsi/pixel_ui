/**
 * One shared reader for the Gamepad API, used by every component that can be
 * driven with a controller.
 *
 * The Gamepad API has no events for button presses — a page has to poll — so
 * this module runs a single animation-frame loop for the whole kit, and only
 * while something is listening. It turns raw button and axis state into the
 * six actions a menu actually needs, fires each one once when it goes down,
 * and repeats the four directions while they are held, the way a held key
 * repeats.
 *
 * Components subscribe while they have focus and drop the subscription when
 * they lose it, so two menus on one page never both move at once.
 */

export type GamepadAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel';

export type GamepadActionListener = (action: GamepadAction) => void;

/** Button indexes from the standard gamepad mapping. */
const BUTTONS: ReadonlyArray<readonly [number, GamepadAction]> = [
  [0, 'confirm'], // A / cross
  [1, 'cancel'], // B / circle
  [12, 'up'], // d-pad
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
];

/** How far a stick has to be pushed before it counts as a direction. */
const DEADZONE = 0.5;

/** A held direction waits this long before repeating, then repeats this often. */
const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 120;

/** Only directions repeat; holding A must not confirm twice. */
const REPEATS: ReadonlySet<GamepadAction> = new Set<GamepadAction>(['up', 'down', 'left', 'right']);

interface HeldAction {
  /** When it went down, for the initial delay. */
  since: number;
  /** When it last fired, for the repeat interval. */
  last: number;
}

const listeners = new Set<GamepadActionListener>();
const held = new Map<GamepadAction, HeldAction>();
let frame: number | undefined;

/** True where this browser can read gamepads at all. */
export function gamepadSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.getGamepads === 'function' &&
    typeof requestAnimationFrame === 'function'
  );
}

/**
 * Listen for gamepad actions. Returns the function that stops listening —
 * call it, or the loop keeps running for the life of the page.
 */
export function onGamepadAction(listener: GamepadActionListener): () => void {
  listeners.add(listener);
  start();

  let live = true;
  return () => {
    if (!live) return;
    live = false;
    listeners.delete(listener);
    if (listeners.size === 0) stop();
  };
}

function start(): void {
  if (frame !== undefined || !gamepadSupported()) return;
  frame = requestAnimationFrame(poll);
}

function stop(): void {
  if (frame === undefined) return;
  cancelAnimationFrame(frame);
  frame = undefined;
  held.clear();
}

function poll(now: number): void {
  frame = requestAnimationFrame(poll);
  const down = read();

  // Forget anything let go of, so it fires again the next time it goes down.
  for (const action of [...held.keys()]) {
    if (!down.has(action)) held.delete(action);
  }

  for (const action of down) {
    const previous = held.get(action);

    if (previous === undefined) {
      held.set(action, { since: now, last: now });
      emit(action);
      continue;
    }

    if (!REPEATS.has(action)) continue;
    if (now - previous.since < REPEAT_DELAY) continue;
    if (now - previous.last < REPEAT_INTERVAL) continue;

    previous.last = now;
    emit(action);
  }
}

/** Every action currently held, across every connected pad. */
function read(): Set<GamepadAction> {
  const down = new Set<GamepadAction>();

  for (const pad of navigator.getGamepads()) {
    if (!pad) continue;

    for (const [index, action] of BUTTONS) {
      if (pad.buttons[index]?.pressed) down.add(action);
    }

    // The left stick does the same job as the d-pad.
    const [x = 0, y = 0] = pad.axes;
    if (y <= -DEADZONE) down.add('up');
    if (y >= DEADZONE) down.add('down');
    if (x <= -DEADZONE) down.add('left');
    if (x >= DEADZONE) down.add('right');
  }

  return down;
}

function emit(action: GamepadAction): void {
  // Copied: a listener is allowed to unsubscribe while being called.
  for (const listener of [...listeners]) listener(action);
}
