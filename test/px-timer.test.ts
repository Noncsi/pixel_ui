import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/timer/px-timer.js';
import type { PxTimer } from '../src/components/timer/px-timer.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxTimer> {
  const el = document.createElement('px-timer');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function drawn(el: PxTimer): string {
  return el.shadowRoot?.querySelector('[part="base"]')?.textContent?.trim() ?? '';
}

function announced(el: PxTimer): string {
  return el.shadowRoot?.querySelector('.sr-only')?.textContent?.trim() ?? '';
}

/** Let `seconds` of wall clock go by, polling as the component does. */
async function tick(el: PxTimer, seconds: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(seconds * 1000);
  await el.updateComplete;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('px-timer', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-timer')).toBeDefined();
  });

  it('is reported as a timer', async () => {
    const el = await mount({ label: 'Time left' });
    expect(el.getAttribute('role')).toBe('timer');
    expect(el.getAttribute('aria-label')).toBe('Time left');
  });

  it('draws minutes and seconds', async () => {
    expect(drawn(await mount({ value: 5 }))).toBe('0:05');
    expect(drawn(await mount({ value: 65 }))).toBe('1:05');
    expect(drawn(await mount({ value: 600 }))).toBe('10:00');
  });

  it('adds hours once it is that long', async () => {
    expect(drawn(await mount({ value: 3600 }))).toBe('1:00:00');
    expect(drawn(await mount({ value: 3725 }))).toBe('1:02:05');
  });

  it('never shows a negative clock', async () => {
    const el = await mount({ value: -30 });
    expect(el.seconds).toBe(0);
    expect(drawn(el)).toBe('0:00');
  });

  it('counts down once started', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });
    const onTick = vi.fn();
    el.addEventListener('px-timer-tick', onTick);

    el.start();
    await el.updateComplete;
    expect(el.running).toBe(true);

    await tick(el, 3);
    expect(el.seconds).toBe(57);
    expect(drawn(el)).toBe('0:57');
    expect(onTick).toHaveBeenCalledTimes(3);
  });

  it('counts the other way when asked', async () => {
    const el = await mount({ value: 0, direction: 'up' });

    el.start();
    await tick(el, 5);
    expect(el.seconds).toBe(5);
  });

  it('keeps time by the clock, not by how often it ticked', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });
    el.start();

    // A tab in the background gets its timers throttled: one poll, long
    // after it was due. The clock still has to be right.
    await tick(el, 20);
    expect(el.seconds).toBe(40);
  });

  it('stops where it is when paused', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });

    el.start();
    await tick(el, 5);
    el.pause();
    await el.updateComplete;

    await tick(el, 10);
    expect(el.seconds).toBe(55);
    expect(el.running).toBe(false);
  });

  it('carries on from where it was paused', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });

    el.start();
    await tick(el, 5);
    el.pause();
    await tick(el, 10);

    el.start();
    await tick(el, 5);
    expect(el.seconds).toBe(50);
  });

  it('runs out, and says so once', async () => {
    const el = await mount({ value: 2, 'warn-at': 0 });
    const onEnd = vi.fn();
    el.addEventListener('px-timer-end', onEnd);

    el.start();
    await tick(el, 5);

    expect(el.seconds).toBe(0);
    expect(el.running).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0]?.[0].detail).toEqual({ value: 0 });
  });

  it('turns urgent at the warning mark, and says so once', async () => {
    const el = await mount({ value: 12, 'warn-at': 10 });
    const onWarn = vi.fn();
    el.addEventListener('px-timer-warn', onWarn);

    el.start();
    await tick(el, 1);
    expect(el.warning).toBe(false);
    expect(el.hasAttribute('warning')).toBe(false);

    await tick(el, 1);
    expect(el.warning).toBe(true);
    expect(el.hasAttribute('warning')).toBe(true);
    expect(onWarn).toHaveBeenCalledTimes(1);

    await tick(el, 2);
    expect(onWarn).toHaveBeenCalledTimes(1);
  });

  it('never warns on the way up', async () => {
    const el = await mount({ value: 0, direction: 'up', 'warn-at': 10 });
    el.start();
    await tick(el, 15);
    expect(el.warning).toBe(false);
  });

  it('says nothing until there is something worth saying', async () => {
    const el = await mount({ value: 12, 'warn-at': 10, label: 'Time left' });

    // A clock that reads itself out every second is unusable.
    expect(announced(el)).toBe('');

    el.start();
    await tick(el, 3);
    expect(announced(el)).toBe('Time left: 0:09 left');

    await tick(el, 9);
    expect(announced(el)).toBe('Time left: time up');
  });

  it('goes back to the start, and can be given a new one', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });

    el.start();
    await tick(el, 10);

    el.reset();
    await el.updateComplete;
    expect(el.running).toBe(false);
    expect(el.seconds).toBe(50);

    el.reset(30);
    await el.updateComplete;
    expect(el.seconds).toBe(30);
  });

  it('can run out twice, once it has been reset', async () => {
    const el = await mount({ value: 2, 'warn-at': 0 });
    const onEnd = vi.fn();
    el.addEventListener('px-timer-end', onEnd);

    el.start();
    await tick(el, 3);
    expect(onEnd).toHaveBeenCalledTimes(1);

    el.reset(2);
    el.start();
    await tick(el, 3);
    expect(onEnd).toHaveBeenCalledTimes(2);
  });

  it('stops counting when it leaves the page', async () => {
    const el = await mount({ value: 60, 'warn-at': 0 });
    el.start();
    await tick(el, 2);

    el.remove();
    await tick(el, 10);

    expect(el.seconds).toBe(58);
  });
});
