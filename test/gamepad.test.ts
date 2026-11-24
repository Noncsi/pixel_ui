import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gamepadSupported, onGamepadAction, type GamepadAction } from '../src/utils/gamepad.js';
import { fakeGamepad, type FakeGamepad } from './fake-gamepad.js';

let pad: FakeGamepad;
let actions: GamepadAction[];
let stop: (() => void) | undefined;

function listen(): void {
  stop = onGamepadAction((action) => actions.push(action));
}

beforeEach(() => {
  pad = fakeGamepad();
  actions = [];
});

afterEach(() => {
  stop?.();
  stop = undefined;
  pad.restore();
});

describe('gamepad reader', () => {
  it('reports support when the API and a frame clock are both there', () => {
    expect(gamepadSupported()).toBe(true);
  });

  it('starts polling as soon as something listens, and stops when nothing does', () => {
    expect(pad.polling).toBe(false);

    listen();
    expect(pad.polling).toBe(true);

    stop?.();
    stop = undefined;
    expect(pad.polling).toBe(false);
  });

  it('keeps polling while a second listener is still there', () => {
    listen();
    const stopOther = onGamepadAction(() => {});

    stop?.();
    stop = undefined;
    expect(pad.polling).toBe(true);

    stopOther();
    expect(pad.polling).toBe(false);
  });

  it('fires a button once however long it is held', () => {
    listen();
    pad.press(0);

    pad.frame(0);
    expect(actions).toEqual(['confirm']);

    pad.frame(16);
    pad.frame(2000);
    expect(actions).toEqual(['confirm']);
  });

  it('fires again once the button has been let go of', () => {
    listen();

    pad.press(1);
    pad.frame(0);
    pad.release();
    pad.frame(16);
    pad.press(1);
    pad.frame(32);

    expect(actions).toEqual(['cancel', 'cancel']);
  });

  it('repeats a held direction after the initial delay', () => {
    listen();
    pad.press(13); // d-pad down

    pad.frame(0);
    expect(actions).toEqual(['down']);

    // Still inside the 400ms delay.
    pad.frame(300);
    expect(actions).toEqual(['down']);

    pad.frame(450);
    expect(actions).toEqual(['down', 'down']);

    // Inside the 120ms repeat interval.
    pad.frame(500);
    expect(actions).toEqual(['down', 'down']);

    pad.frame(580);
    expect(actions).toEqual(['down', 'down', 'down']);
  });

  it('reads the left stick as a direction once it is past the deadzone', () => {
    listen();

    pad.stick(0, -1);
    pad.frame(0);
    pad.release();
    pad.frame(16);
    pad.stick(0.8, 0);
    pad.frame(32);

    expect(actions).toEqual(['up', 'right']);
  });

  it('ignores a stick that has barely moved', () => {
    listen();
    pad.stick(0.2, -0.3);

    pad.frame(0);
    pad.frame(16);

    expect(actions).toEqual([]);
  });

  it('maps the d-pad to all four directions', () => {
    listen();

    for (const [button, expected] of [
      [12, 'up'],
      [13, 'down'],
      [14, 'left'],
      [15, 'right'],
    ] as const) {
      pad.press(button);
      pad.frame(0);
      pad.release();
      pad.frame(1);
      expect(actions.at(-1)).toBe(expected);
    }
  });

  it('only unsubscribes once, however often it is called', () => {
    listen();
    const stopOther = onGamepadAction(() => {});

    stop?.();
    stop?.();
    stop = undefined;

    // The second call must not have dropped the other listener's claim.
    expect(pad.polling).toBe(true);
    stopOther();
  });

  it('does nothing at all where the API is missing', () => {
    Object.defineProperty(navigator, 'getGamepads', { value: undefined, configurable: true });

    expect(gamepadSupported()).toBe(false);

    listen();
    expect(pad.polling).toBe(false);
    expect(actions).toEqual([]);
  });
});
