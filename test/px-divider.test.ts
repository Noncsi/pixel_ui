import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/divider/px-divider.js';
import type { PxDivider } from '../src/components/divider/px-divider.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxDivider> {
  const el = document.createElement('px-divider');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function label(el: PxDivider): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="label"]') ?? null;
}

function rules(el: PxDivider): number {
  return el.shadowRoot?.querySelectorAll('.rule').length ?? 0;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-divider', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-divider')).toBeDefined();
  });

  it('is a separator, and says which way it runs', async () => {
    const el = await mount();
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');

    const upright = await mount({ vertical: true });
    expect(upright.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('is one unbroken rule with nothing to say', async () => {
    const el = await mount();
    expect(rules(el)).toBe(1);
    expect(label(el)).toBeNull();
  });

  it('breaks either side of a label', async () => {
    const el = await mount({ label: 'Options' });

    expect(rules(el)).toBe(2);
    expect(label(el)?.textContent?.trim()).toBe('Options');
  });

  it('carries the label as its name, and draws it only once', async () => {
    const el = await mount({ label: 'Options' });

    // The separator's own name is what a screen reader reads; the drawn
    // copy must not be read as well.
    expect(el.getAttribute('aria-label')).toBe('Options');
    expect(label(el)?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives the name up again when the label goes', async () => {
    const el = await mount({ label: 'Options' });
    el.label = '';
    await el.updateComplete;

    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(rules(el)).toBe(1);
  });

  it('puts a diamond in the middle when asked', async () => {
    const el = await mount({ ornament: true });

    expect(rules(el)).toBe(2);
    expect(label(el)?.textContent?.trim()).toBe('◆');
  });

  it('prefers a real label to the ornament', async () => {
    const el = await mount({ ornament: true, label: 'Options' });
    expect(label(el)?.textContent?.trim()).toBe('Options');
  });

  it('leaves the words off a vertical rule rather than turning them sideways', async () => {
    const el = await mount({ vertical: true, label: 'Options' });

    expect(label(el)).toBeNull();
    expect(rules(el)).toBe(1);
    // Still named, even though there is nowhere to draw it.
    expect(el.getAttribute('aria-label')).toBe('Options');
  });
});
