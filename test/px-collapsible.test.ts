import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/collapsible/px-collapsible.js';
import type {
  CollapsibleToggleEventDetail,
  PxCollapsible,
} from '../src/components/collapsible/px-collapsible.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  children = 'Three potions, a rope and a very old map.',
): Promise<PxCollapsible> {
  const el = document.createElement('px-collapsible');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.innerHTML = children;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function heading(el: PxCollapsible): HTMLButtonElement {
  const found = el.shadowRoot?.querySelector('[part="heading"]');
  if (!found) throw new Error('no heading button');
  return found as HTMLButtonElement;
}

function region(el: PxCollapsible): HTMLElement {
  const found = el.shadowRoot?.querySelector('[part="content"]');
  if (!found) throw new Error('no content region');
  return found as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-collapsible', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-collapsible')).toBeDefined();
  });

  it('starts shut, and says so', async () => {
    const el = await mount({ summary: 'Bag' });

    expect(el.open).toBe(false);
    expect(heading(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on a click and reports it', async () => {
    const el = await mount({ summary: 'Bag' });
    const seen: CollapsibleToggleEventDetail[] = [];
    el.addEventListener('px-collapsible-toggle', (event) => seen.push(event.detail));

    heading(el).click();
    await el.updateComplete;

    expect(el.open).toBe(true);
    expect(heading(el).getAttribute('aria-expanded')).toBe('true');
    expect(seen).toEqual([{ open: true }]);
  });

  it('says nothing when told what it already is', async () => {
    const el = await mount({ summary: 'Bag', open: true });
    let fired = 0;
    el.addEventListener('px-collapsible-toggle', () => (fired += 1));

    el.show();
    el.toggle(true);
    await el.updateComplete;

    expect(fired).toBe(0);

    el.hide();
    expect(fired).toBe(1);
  });

  it('is a named region the heading button controls', async () => {
    const el = await mount({ summary: 'Bag' });

    expect(region(el).getAttribute('role')).toBe('region');
    // Both ids live in the same shadow root, which is the only reason these
    // two references work at all.
    expect(heading(el).getAttribute('aria-controls')).toBe(region(el).id);
    expect(region(el).getAttribute('aria-labelledby')).toBe(heading(el).id);
  });

  it('puts the summary in a heading at the level asked for', async () => {
    const el = await mount({ summary: 'Bag', level: 2 });
    const wrap = el.shadowRoot?.querySelector('[role="heading"]');

    expect(wrap?.getAttribute('aria-level')).toBe('2');
    expect(wrap?.contains(heading(el))).toBe(true);
    expect(heading(el).textContent).toContain('Bag');
  });

  it('clamps a level that is not a heading level', async () => {
    const low = await mount({ summary: 'Bag', level: 0 });
    expect(low.shadowRoot?.querySelector('[role="heading"]')?.getAttribute('aria-level')).toBe('1');

    const high = await mount({ summary: 'Bag', level: 9 });
    expect(high.shadowRoot?.querySelector('[role="heading"]')?.getAttribute('aria-level')).toBe(
      '6',
    );
  });

  it('turns the marker rather than leaving it pointing the wrong way', async () => {
    const el = await mount({ summary: 'Bag' });
    const marker = () => el.shadowRoot?.querySelector('[part="marker"]')?.textContent?.trim();

    expect(marker()).toBe('▶');
    el.show();
    await el.updateComplete;
    expect(marker()).toBe('▼');
  });

  it('keeps the marker out of the heading name', async () => {
    const el = await mount({ summary: 'Bag' });
    expect(el.shadowRoot?.querySelector('[part="marker"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('ignores clicks while disabled', async () => {
    const el = await mount({ summary: 'Bag', disabled: true });
    let fired = 0;
    el.addEventListener('px-collapsible-toggle', () => (fired += 1));

    heading(el).click();
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(fired).toBe(0);
  });

  it('does not coordinate with its neighbours', async () => {
    // Stacking them is how an accordion is built, and the kit leaves the
    // one-at-a-time rule to the game that wants it.
    const first = await mount({ summary: 'Bag' });
    const second = await mount({ summary: 'Quests' });

    first.show();
    second.show();
    await Promise.all([first.updateComplete, second.updateComplete]);

    expect([first.open, second.open]).toEqual([true, true]);
  });
});
