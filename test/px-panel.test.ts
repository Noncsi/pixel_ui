import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/panel/px-panel.js';
import type { PxPanel } from '../src/components/panel/px-panel.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  slots: { header?: boolean; footer?: boolean } = {},
): Promise<PxPanel> {
  const el = document.createElement('px-panel');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  el.append(document.createTextNode('Everything here is overpriced.'));

  for (const name of ['header', 'footer'] as const) {
    if (!slots[name]) continue;
    const node = document.createElement('span');
    node.slot = name;
    node.textContent = name;
    el.append(node);
  }

  document.body.append(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function part(el: PxPanel, name: string): HTMLElement | null {
  return el.shadowRoot?.querySelector(`[part="${name}"]`) ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-panel', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-panel')).toBeDefined();
  });

  it('is a plain box with no name', async () => {
    const el = await mount();

    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(part(el, 'content')?.textContent).toBe('');
    expect(el.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
  });

  it('becomes a named region once it has a label', async () => {
    const el = await mount({ label: 'General store' });

    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('General store');
    expect(part(el, 'label')?.textContent).toBe('General store');
    // The region carries the name; the drawn copy must not be read as well.
    expect(part(el, 'label')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives the name up again when the label goes', async () => {
    const el = await mount({ label: 'General store' });
    el.label = '';
    await el.updateComplete;

    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps the heading for screen readers only when told to', async () => {
    const el = await mount({ label: 'General store', 'hide-label': true });

    expect(part(el, 'label')).toBeNull();
    expect(el.getAttribute('aria-label')).toBe('General store');
  });

  it('folds away a header and a footer with nothing in them', async () => {
    const bare = await mount();
    expect(part(bare, 'header')?.className).toContain('empty');
    expect(part(bare, 'footer')?.className).toContain('empty');

    const full = await mount({ label: 'Shop' }, { header: true, footer: true });
    expect(part(full, 'header')?.className).not.toContain('empty');
    expect(part(full, 'footer')?.className).not.toContain('empty');
  });

  it('opens the header for a label alone', async () => {
    const el = await mount({ label: 'Shop' });
    expect(part(el, 'header')?.className).not.toContain('empty');
  });

  it('opens the header for slotted content alone', async () => {
    const el = await mount({}, { header: true });
    expect(part(el, 'header')?.className).not.toContain('empty');
  });

  it('drops the frame when it is flat', async () => {
    const framed = await mount();
    expect(part(framed, 'frame')).not.toBeNull();

    const flat = await mount({ flat: true });
    expect(part(flat, 'frame')).toBeNull();
    expect(flat.hasAttribute('flat')).toBe(true);
  });

  it('reflects inset, so the surface can sink', async () => {
    const el = await mount({ inset: true });
    expect(el.inset).toBe(true);
    expect(el.hasAttribute('inset')).toBe(true);
  });
});
