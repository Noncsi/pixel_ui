import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/counter/px-counter.js';
import type { PxCounter } from '../src/components/counter/px-counter.js';

let nextFrame: ((now: number) => void) | undefined;

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxCounter> {
  const el = document.createElement('px-counter');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function drawn(el: PxCounter): string {
  return el.shadowRoot?.querySelector('[part="base"]')?.textContent?.trim() ?? '';
}

function announced(el: PxCounter): string {
  return el.shadowRoot?.querySelector('.sr-only')?.textContent?.trim() ?? '';
}

/** Run one animation frame at `now` milliseconds. */
async function frame(el: PxCounter, now: number): Promise<void> {
  nextFrame?.(now);
  await el.updateComplete;
}

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: (now: number) => void) => {
    nextFrame = callback;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    nextFrame = undefined;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  // unstubAllGlobals doesn't undo a spy: without this the reduced-motion
  // test's matchMedia mock leaks into every test after it.
  vi.restoreAllMocks();
  nextFrame = undefined;
  document.body.innerHTML = '';
});

describe('px-counter', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-counter')).toBeDefined();
  });

  it('starts on the number it was given, without rolling to it', async () => {
    const el = await mount({ value: 250 });

    expect(el.displayValue).toBe(250);
    expect(el.rolling).toBe(false);
    expect(drawn(el)).toBe('250');
  });

  it('rolls from the old number to the new one', async () => {
    const el = await mount({ value: 0, duration: 1000 });

    el.value = 100;
    await el.updateComplete;
    expect(el.rolling).toBe(true);

    await frame(el, 0);
    expect(el.displayValue).toBe(0);

    await frame(el, 500);
    expect(el.displayValue).toBeGreaterThan(0);
    expect(el.displayValue).toBeLessThan(100);

    await frame(el, 1000);
    expect(el.displayValue).toBe(100);
    expect(el.rolling).toBe(false);
  });

  it('eases out, so the last digits settle', async () => {
    const el = await mount({ value: 0, duration: 1000 });
    el.value = 100;
    await el.updateComplete;

    await frame(el, 0);
    await frame(el, 500);

    // Half way through the time, well past half the distance.
    expect(el.displayValue).toBeGreaterThan(50);
  });

  it('says when it lands', async () => {
    const el = await mount({ value: 0, duration: 1000 });
    const onEnd = vi.fn();
    el.addEventListener('px-counter-end', onEnd);

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);
    expect(onEnd).not.toHaveBeenCalled();

    await frame(el, 1000);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0]?.[0].detail).toEqual({ value: 100 });
  });

  it('jumps to the end when told to', async () => {
    const el = await mount({ value: 0, duration: 1000 });
    const onEnd = vi.fn();
    el.addEventListener('px-counter-end', onEnd);

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);

    el.snap();
    await el.updateComplete;

    expect(el.displayValue).toBe(100);
    expect(el.rolling).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('starts over when the target moves mid-roll', async () => {
    const el = await mount({ value: 0, duration: 1000 });

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);
    await frame(el, 500);
    const halfway = el.displayValue;

    el.value = 200;
    await el.updateComplete;
    await frame(el, 600);

    // Carries on from where it had got to, not from zero.
    expect(el.displayValue).toBeGreaterThanOrEqual(halfway);
    expect(el.rolling).toBe(true);
  });

  it('shows the number at once when no motion is wanted', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const el = await mount({ value: 0, duration: 1000 });

    el.value = 100;
    await el.updateComplete;

    expect(el.displayValue).toBe(100);
    expect(el.rolling).toBe(false);
  });

  it('shows the number at once when the duration is zero', async () => {
    const el = await mount({ value: 0, duration: 0 });

    el.value = 100;
    await el.updateComplete;

    expect(el.displayValue).toBe(100);
    expect(el.rolling).toBe(false);
  });

  it('pads with zeros when asked', async () => {
    const el = await mount({ value: 42, pad: 6 });
    expect(drawn(el)).toBe('000042');
  });

  it('groups thousands when given a separator', async () => {
    const el = await mount({ value: 1234567, separator: ',' });
    expect(drawn(el)).toBe('1,234,567');
  });

  it('takes a prefix', async () => {
    const el = await mount({ value: 12, prefix: '×' });
    expect(drawn(el)).toBe('×12');
  });

  it('keeps a minus sign in front of everything', async () => {
    const el = await mount({ value: -1500, separator: ',', prefix: '$' });
    expect(drawn(el)).toBe('-$1,500');
  });

  it('survives a value that is not a number', async () => {
    const el = await mount({ value: 10 });
    el.value = Number.NaN;
    await el.updateComplete;
    expect(el.safeValue).toBe(0);
  });

  it('hides the rolling digits and announces only where it lands', async () => {
    const el = await mount({ value: 0, duration: 1000, label: 'Gold' });

    expect(el.shadowRoot?.querySelector('[part="base"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(announced(el)).toBe('Gold: 0');

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);

    // Nothing announced while the digits are still moving.
    expect(announced(el)).toBe('');

    await frame(el, 1000);
    expect(announced(el)).toBe('Gold: 100');
  });

  it('still announces when the easing lands a frame early', async () => {
    const el = await mount({ value: 0, duration: 1000, label: 'Gold' });

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);

    // Eased out, 90% of the time is already the whole distance once rounded,
    // so the final frame's assignment changes nothing and schedules nothing.
    await frame(el, 900);
    expect(el.displayValue).toBe(100);
    expect(el.rolling).toBe(true);

    await frame(el, 1000);
    expect(el.rolling).toBe(false);
    expect(announced(el)).toBe('Gold: 100');
  });

  it('announces nothing at all without a label', async () => {
    const el = await mount({ value: 10 });
    expect(el.shadowRoot?.querySelector('.sr-only')).toBeNull();
  });

  it('stops rolling when it leaves the page', async () => {
    const el = await mount({ value: 0, duration: 1000 });

    el.value = 100;
    await el.updateComplete;
    await frame(el, 0);
    expect(el.rolling).toBe(true);

    el.remove();
    expect(el.rolling).toBe(false);
  });
});
