import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/health-bar/px-health-bar.js';
import type { PxHealthBar } from '../src/components/health-bar/px-health-bar.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxHealthBar> {
  const el = document.createElement('px-health-bar');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function meter(el: PxHealthBar): HTMLElement {
  const node = el.shadowRoot?.querySelector<HTMLElement>('[role="meter"]');
  if (!node) throw new Error('meter not rendered');
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-health-bar', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-health-bar')).toBeDefined();
  });

  it('exposes its value to assistive technology', async () => {
    const el = await mount({ value: 40, max: 80, label: 'Player HP' });
    const m = meter(el);

    expect(m.getAttribute('aria-label')).toBe('Player HP');
    expect(m.getAttribute('aria-valuemin')).toBe('0');
    expect(m.getAttribute('aria-valuemax')).toBe('80');
    expect(m.getAttribute('aria-valuenow')).toBe('40');
    expect(m.getAttribute('aria-valuetext')).toBe('40 of 80');
  });

  it('falls back to the variant as an accessible name', async () => {
    const el = await mount({ variant: 'mana' });
    expect(meter(el).getAttribute('aria-label')).toBe('mana');
  });

  it('clamps the value into 0…max', async () => {
    const el = await mount({ value: 150 });
    expect(el.clampedValue).toBe(100);

    el.value = -20;
    await el.updateComplete;
    expect(el.clampedValue).toBe(0);
  });

  it('survives a nonsensical max', async () => {
    const el = await mount({ value: 5, max: 0 });
    expect(el.ratio).toBe(1);
  });

  it('sizes the fill to the ratio', async () => {
    const el = await mount({ value: 25 });
    const fill = el.shadowRoot?.querySelector<HTMLElement>('[part="fill"]');
    expect(fill?.style.width).toBe('25%');
  });

  it('reflects the low state as an attribute', async () => {
    const el = await mount({ value: 50 });
    expect(el.hasAttribute('low')).toBe(false);

    el.value = 20;
    await el.updateComplete;
    expect(el.hasAttribute('low')).toBe(true);
  });

  it('respects a custom low threshold', async () => {
    const el = await mount({ value: 40, 'low-threshold': 0.5 });
    expect(el.hasAttribute('low')).toBe(true);
  });

  it('fires px-low once, on the way down', async () => {
    const el = await mount({ value: 80 });
    const onLow = vi.fn();
    el.addEventListener('px-low', onLow);

    el.value = 20;
    await el.updateComplete;
    el.value = 10;
    await el.updateComplete;

    expect(onLow).toHaveBeenCalledTimes(1);
    expect(onLow.mock.calls[0]?.[0].detail).toEqual({ value: 20, max: 100 });
  });

  it('fires px-depleted when it reaches zero, and not when it starts there', async () => {
    const empty = await mount({ value: 0 });
    const onEmptyStart = vi.fn();
    empty.addEventListener('px-depleted', onEmptyStart);
    empty.max = 50;
    await empty.updateComplete;
    expect(onEmptyStart).not.toHaveBeenCalled();

    const el = await mount({ value: 30 });
    const onDepleted = vi.fn();
    el.addEventListener('px-depleted', onDepleted);
    el.value = 0;
    await el.updateComplete;
    expect(onDepleted).toHaveBeenCalledTimes(1);
  });

  it('shows the label and value only when asked', async () => {
    const plain = await mount({ label: 'HP' });
    expect(plain.shadowRoot?.querySelector('[part="value"]')).toBeNull();
    expect(plain.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('HP');

    const hidden = await mount({ label: 'HP', 'hide-label': true, 'show-value': true, value: 7 });
    expect(hidden.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('');
    expect(hidden.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('7 / 100');
    expect(meter(hidden).getAttribute('aria-label')).toBe('HP');
  });
});
