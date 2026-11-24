import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/progress/px-progress.js';
import type { PxProgress } from '../src/components/progress/px-progress.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxProgress> {
  const el = document.createElement('px-progress');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function fill(el: PxProgress): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="fill"]') ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-progress', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-progress')).toBeDefined();
  });

  it('is a progressbar that reports where it is', async () => {
    const el = await mount({ value: 40, label: 'Loading' });

    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-label')).toBe('Loading');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('40');
  });

  it('starts empty', async () => {
    const el = await mount();
    expect(el.value).toBe(0);
    expect(el.ratio).toBe(0);
    expect(el.percent).toBe(0);
  });

  it('clamps a value outside the range', async () => {
    const over = await mount({ value: 400 });
    expect(over.clampedValue).toBe(100);
    expect(over.ratio).toBe(1);

    const under = await mount({ value: -20 });
    expect(under.clampedValue).toBe(0);
    expect(under.ratio).toBe(0);
  });

  it('works to a max of its own', async () => {
    const el = await mount({ value: 3, max: 12 });
    expect(el.ratio).toBeCloseTo(0.25);
    expect(el.percent).toBe(25);
    expect(el.getAttribute('aria-valuemax')).toBe('12');
  });

  it('survives a max that makes no sense', async () => {
    const el = await mount({ value: 5, max: 0 });
    expect(Number.isFinite(el.ratio)).toBe(true);
    expect(el.getAttribute('aria-valuemax')).toBe('1');
  });

  it('survives a value that is not a number', async () => {
    const el = await mount();
    el.value = Number.NaN;
    await el.updateComplete;
    expect(el.clampedValue).toBe(0);
  });

  it('fills to the ratio', async () => {
    const el = await mount({ value: 25 });
    expect(fill(el)?.getAttribute('style')).toContain('width: 25%');

    el.value = 60;
    await el.updateComplete;
    expect(fill(el)?.getAttribute('style')).toContain('width: 60%');
  });

  it('shows the percentage only when asked', async () => {
    const el = await mount({ value: 40 });
    expect(el.shadowRoot?.querySelector('[part="value"]')).toBeNull();

    el.showValue = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('40%');
  });

  it('rounds the percentage to something readable', async () => {
    const el = await mount({ value: 1, max: 3, 'show-value': true });
    expect(el.percent).toBe(33);
    expect(el.shadowRoot?.querySelector('[part="value"]')?.textContent).toBe('33%');
  });

  it('draws no label row when there is nothing to put in it', async () => {
    const bare = await mount({ value: 40 });
    expect(bare.shadowRoot?.querySelector('.header')).toBeNull();

    const labelled = await mount({ value: 40, label: 'Loading' });
    expect(labelled.shadowRoot?.querySelector('.header')).not.toBeNull();
  });

  it('keeps the label for screen readers only when told to', async () => {
    const el = await mount({ label: 'Loading', 'hide-label': true });

    expect(el.shadowRoot?.querySelector('[part="label"]')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('Loading');
  });

  describe('indeterminate', () => {
    it('reports no position at all, rather than zero', async () => {
      const el = await mount({ value: 40, indeterminate: true });

      expect(el.hasAttribute('aria-valuenow')).toBe(false);
      expect(el.getAttribute('aria-valuemax')).toBe('100');
    });

    it('leaves the fill to the stylesheet', async () => {
      const el = await mount({ value: 40, indeterminate: true });
      expect(fill(el)?.getAttribute('style')).toBeNull();
    });

    it('has no percentage to show', async () => {
      const el = await mount({ value: 40, indeterminate: true, 'show-value': true });
      expect(el.shadowRoot?.querySelector('[part="value"]')).toBeNull();
    });

    it('reports its position again once it knows one', async () => {
      const el = await mount({ value: 40, indeterminate: true });

      el.indeterminate = false;
      await el.updateComplete;

      expect(el.getAttribute('aria-valuenow')).toBe('40');
      expect(fill(el)?.getAttribute('style')).toContain('width: 40%');
    });
  });
});
