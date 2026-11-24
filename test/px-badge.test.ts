import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/badge/px-badge.js';
import type { PxBadge } from '../src/components/badge/px-badge.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  text = '3',
): Promise<PxBadge> {
  const el = document.createElement('px-badge');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  if (text) el.textContent = text;
  document.body.append(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function base(el: PxBadge): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="base"]') ?? null;
}

/**
 * What is actually on screen. The uncapped count is slotted light DOM, so it
 * isn't in the shadow root's textContent; the capped form replaces it.
 */
function drawn(el: PxBadge): string {
  const capped = el.shadowRoot?.querySelector('.capped');
  if (capped) return capped.textContent?.trim() ?? '';
  if (el.shadowRoot?.querySelector('.base.dot')) return '';
  return (el.textContent ?? '').trim();
}

function srText(el: PxBadge): string {
  return el.shadowRoot?.querySelector('.sr-only')?.textContent?.trim() ?? '';
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-badge', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-badge')).toBeDefined();
  });

  it('draws whatever it is given', async () => {
    const el = await mount();
    expect(el.textContent).toBe('3');
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
  });

  it('is neutral unless told otherwise', async () => {
    const el = await mount();
    expect(el.getAttribute('variant')).toBe('neutral');
  });

  it('takes the other colours', async () => {
    for (const variant of ['accent', 'danger', 'xp'] as const) {
      const el = await mount({ variant });
      expect(el.getAttribute('variant')).toBe(variant);
    }
  });

  it('reads the digits out when it has nothing better to say', async () => {
    const el = await mount();

    // No label: the content is the name, so it must not be hidden.
    expect(base(el)?.hasAttribute('aria-hidden')).toBe(false);
    expect(srText(el)).toBe('');
  });

  it('says what it means instead of the digits when given a label', async () => {
    const el = await mount({ label: '3 unread' });

    expect(base(el)?.getAttribute('aria-hidden')).toBe('true');
    expect(srText(el)).toBe('3 unread');
    // The label is text, not aria-label: that is unreliable on an element
    // with no role of its own.
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('caps a count that is over the limit', async () => {
    const el = await mount({ max: 99 }, '143');
    expect(drawn(el)).toBe('99+');
  });

  it('leaves a count inside the limit alone', async () => {
    const el = await mount({ max: 99 }, '42');
    expect(drawn(el)).toBe('42');
  });

  it('keeps the real count in the DOM when it caps what is drawn', async () => {
    const el = await mount({ max: 9 }, '143');

    expect(drawn(el)).toBe('9+');
    // Still there to read back, and still what a label would describe.
    expect(el.textContent).toBe('143');
  });

  it('re-caps when the limit changes', async () => {
    const el = await mount({ max: 0 }, '143');
    expect(drawn(el)).toBe('143');

    el.max = 99;
    await el.updateComplete;
    expect(drawn(el)).toBe('99+');

    el.max = 0;
    await el.updateComplete;
    expect(drawn(el)).toBe('143');
  });

  it('leaves text that is not a count alone', async () => {
    const el = await mount({ max: 99 }, 'NEW');
    expect(drawn(el)).toBe('NEW');
  });

  it('draws a dot with nothing in it', async () => {
    const el = await mount({ dot: true }, '');

    expect(base(el)?.className).toContain('dot');
    expect(drawn(el)).toBe('');
    expect(base(el)?.getAttribute('aria-hidden')).toBe(null);
  });

  it('lets a dot be named, for the times it means something', async () => {
    const el = await mount({ dot: true, label: 'Unread messages' }, '');

    expect(srText(el)).toBe('Unread messages');
    expect(base(el)?.getAttribute('aria-hidden')).toBe('true');
  });

  it('never caps a dot, since there is nothing to cap', async () => {
    const el = await mount({ dot: true, max: 9 }, '143');
    expect(drawn(el)).toBe('');
  });
});
