import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/spinner/px-spinner.js';
import type { PxSpinner } from '../src/components/spinner/px-spinner.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxSpinner> {
  const el = document.createElement('px-spinner');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function blocks(el: PxSpinner): HTMLElement[] {
  return [...(el.shadowRoot?.querySelectorAll<HTMLElement>('[part="block"]') ?? [])];
}

function said(el: PxSpinner): HTMLElement | null {
  return el.shadowRoot?.querySelector('[role="status"]') ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-spinner', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-spinner')).toBeDefined();
  });

  it('says it is busy, about whatever it stands in for', async () => {
    const el = await mount();
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('puts the label in the live region rather than on it', async () => {
    const el = await mount({ label: 'Saving' });

    // A live region is read by what is in it. An aria-label is not in it, so
    // a spinner named that way would announce nothing at all.
    expect(said(el)?.textContent?.trim()).toBe('Saving');
    expect(said(el)?.hasAttribute('aria-label')).toBe(false);
  });

  it('waits for something by default', async () => {
    const el = await mount();
    expect(el.label).toBe('Loading');
    expect(said(el)?.textContent?.trim()).toBe('Loading');
  });

  it('can be told to say nothing', async () => {
    const el = await mount({ quiet: true, label: 'Saving' });

    expect(said(el)).toBeNull();
    // Still busy: the wait is real, it is just announced somewhere else.
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('is a ring of eight blocks, hidden from screen readers', async () => {
    const el = await mount();

    expect(blocks(el)).toHaveLength(8);
    expect(el.shadowRoot?.querySelector('[part="ring"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('spaces the eight delays one step apart over a turn', async () => {
    const el = await mount({ duration: 800 });
    const delays = blocks(el).map((block) => block.style.animationDelay);

    // Every delay is negative, so the ring is already turning on the first
    // frame instead of lighting up one block at a time from a standstill.
    expect(delays).toEqual([
      '-800ms',
      '-700ms',
      '-600ms',
      '-500ms',
      '-400ms',
      '-300ms',
      '-200ms',
      '-100ms',
    ]);
    expect(blocks(el)[0]?.style.animationDuration).toBe('800ms');
  });

  it('puts the blocks on a three by three grid with the middle out', async () => {
    const el = await mount();
    const cells = blocks(el).map((block) => `${block.style.gridColumn},${block.style.gridRow}`);

    expect(cells).toEqual(['1,1', '2,1', '3,1', '3,2', '3,3', '2,3', '1,3', '1,2']);
    expect(cells).not.toContain('2,2');
  });

  it('draws the label beside the ring only when asked', async () => {
    const quiet = await mount({ label: 'Saving' });
    expect(quiet.shadowRoot?.querySelector('[part="label"]')).toBeNull();

    const shown = await mount({ label: 'Saving', 'show-label': true });
    const drawn = shown.shadowRoot?.querySelector('[part="label"]');
    expect(drawn?.textContent?.trim()).toBe('Saving');
    // Drawn and said are two copies of one word, so only one of them talks.
    expect(drawn?.getAttribute('aria-hidden')).toBe('true');
  });

  it('refuses a negative turn rather than running backwards', async () => {
    const el = await mount({ duration: -500 });
    expect(blocks(el)[0]?.style.animationDuration).toBe('0ms');
  });
});
