import { vi } from 'vitest';

/**
 * A stand-in for a connected controller, plus hand control of the animation
 * frame the gamepad reader polls on.
 *
 * The real Gamepad API has no events, so the only way to test anything built
 * on it is to pretend to be both the pad and the clock: set what is held, then
 * step the loop frame by frame with the timestamps you want.
 */
export interface FakeGamepad {
  /** Hold exactly these standard-mapping buttons (none, to let go). */
  press(...buttons: number[]): void;
  /** Push the left stick, each axis -1…1. */
  stick(x: number, y: number): void;
  /** Let go of every button and centre the stick. */
  release(): void;
  /** Run one frame of the polling loop, `now` ms in. */
  frame(now: number): void;
  /** Whether another frame is scheduled, i.e. the loop is still running. */
  readonly polling: boolean;
  /** Put the real requestAnimationFrame and navigator back. */
  restore(): void;
}

/** Buttons 0…16 of the standard mapping. */
const BUTTON_COUNT = 17;

export function fakeGamepad(): FakeGamepad {
  let buttons = new Set<number>();
  let axes = [0, 0];
  let next: ((now: number) => void) | undefined;

  const original = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');

  const pad = (): Gamepad =>
    ({
      id: 'fake pad (standard)',
      index: 0,
      connected: true,
      mapping: 'standard',
      timestamp: 0,
      axes: [...axes],
      buttons: Array.from({ length: BUTTON_COUNT }, (_, i) => ({
        pressed: buttons.has(i),
        touched: buttons.has(i),
        value: buttons.has(i) ? 1 : 0,
      })),
    }) as unknown as Gamepad;

  Object.defineProperty(navigator, 'getGamepads', {
    value: () => [pad()],
    configurable: true,
    writable: true,
  });

  vi.stubGlobal('requestAnimationFrame', (callback: (now: number) => void) => {
    next = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    next = undefined;
  });

  return {
    press(...pressed: number[]) {
      buttons = new Set(pressed);
    },
    stick(x: number, y: number) {
      axes = [x, y];
    },
    release() {
      buttons = new Set();
      axes = [0, 0];
    },
    frame(now: number) {
      next?.(now);
    },
    get polling() {
      return next !== undefined;
    },
    restore() {
      vi.unstubAllGlobals();
      if (original) Object.defineProperty(navigator, 'getGamepads', original);
      else Reflect.deleteProperty(navigator, 'getGamepads');
    },
  };
}
