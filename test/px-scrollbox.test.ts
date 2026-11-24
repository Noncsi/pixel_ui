import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/scrollbox/px-scrollbox.js';
import type { PxScrollbox } from '../src/components/scrollbox/px-scrollbox.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  text = 'The caves to the north are not safe. Nobody who went in came back out.',
): Promise<PxScrollbox> {
  const el = document.createElement('px-scrollbox');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = text;
  document.body.append(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function scroller(el: PxScrollbox): HTMLElement {
  const node = el.shadowRoot?.querySelector('[part="content"]');
  if (!(node instanceof HTMLElement)) throw new Error('content not rendered');
  return node;
}

/**
 * happy-dom lays nothing out, so the scroll geometry has to be stated. These
 * are the three numbers the component actually reads.
 */
function layout(el: PxScrollbox, scrollTop: number, clientHeight = 100, scrollHeight = 400): void {
  const node = scroller(el);
  for (const [name, value] of Object.entries({ scrollTop, clientHeight, scrollHeight })) {
    Object.defineProperty(node, name, { value, configurable: true, writable: true });
  }
}

function hints(el: PxScrollbox): string[] {
  return [...(el.shadowRoot?.querySelectorAll('[part="hint"]') ?? [])].map(
    (node) => node.className,
  );
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-scrollbox', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-scrollbox')).toBeDefined();
  });

  it('is a tab stop, because a region that scrolls has to be', async () => {
    const el = await mount();
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('is a named region only once it has a name', async () => {
    const bare = await mount();
    expect(bare.hasAttribute('role')).toBe(false);

    const named = await mount({ label: 'Quest log' });
    expect(named.getAttribute('role')).toBe('region');
    expect(named.getAttribute('aria-label')).toBe('Quest log');
  });

  it('gives the name up again when the label goes', async () => {
    const el = await mount({ label: 'Quest log' });
    el.label = '';
    await el.updateComplete;

    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('shows nothing when everything already fits', async () => {
    const el = await mount();
    layout(el, 0, 400, 400);
    el.measure();
    await el.updateComplete;

    expect(el.atTop).toBe(true);
    expect(el.atBottom).toBe(true);
    expect(hints(el)).toHaveLength(0);
    expect(el.hasAttribute('more-above')).toBe(false);
    expect(el.hasAttribute('more-below')).toBe(false);
  });

  it('points down from the top of a long box', async () => {
    const el = await mount();
    layout(el, 0);
    el.measure();
    await el.updateComplete;

    expect(el.atTop).toBe(true);
    expect(el.atBottom).toBe(false);
    expect(hints(el)).toEqual(['hint bottom']);
    expect(el.hasAttribute('more-below')).toBe(true);
  });

  it('points both ways from the middle', async () => {
    const el = await mount();
    layout(el, 150);
    el.measure();
    await el.updateComplete;

    expect(el.atTop).toBe(false);
    expect(el.atBottom).toBe(false);
    expect(hints(el)).toEqual(['hint top', 'hint bottom']);
    expect(el.hasAttribute('more-above')).toBe(true);
    expect(el.hasAttribute('more-below')).toBe(true);
  });

  it('points up from the bottom', async () => {
    const el = await mount();
    layout(el, 300);
    el.measure();
    await el.updateComplete;

    expect(el.atBottom).toBe(true);
    expect(hints(el)).toEqual(['hint top']);
  });

  it('gives a pixel of slack at either end', async () => {
    const el = await mount();

    // Sub-pixel layout rarely lands exactly on the end; an arrow that never
    // goes away is worse than no arrow.
    layout(el, 0.5);
    el.measure();
    await el.updateComplete;
    expect(el.atTop).toBe(true);

    layout(el, 299.5);
    el.measure();
    await el.updateComplete;
    expect(el.atBottom).toBe(true);
  });

  it('re-measures when it is scrolled', async () => {
    const el = await mount();
    layout(el, 150);
    scroller(el).dispatchEvent(new Event('scroll'));
    await el.updateComplete;

    expect(el.atTop).toBe(false);
  });

  it('jumps to either end', async () => {
    const el = await mount();
    layout(el, 150);

    el.scrollToTop();
    await el.updateComplete;
    expect(scroller(el).scrollTop).toBe(0);
    expect(el.atTop).toBe(true);

    el.scrollToBottom();
    await el.updateComplete;
    expect(scroller(el).scrollTop).toBe(400);
  });

  it('drops the frame when it is flat', async () => {
    const framed = await mount();
    expect(framed.shadowRoot?.querySelector('[part="frame"]')).not.toBeNull();

    const flat = await mount({ flat: true });
    expect(flat.shadowRoot?.querySelector('[part="frame"]')).toBeNull();
  });

  it('scrolls its content natively rather than reimplementing it', async () => {
    const el = await mount();
    expect(scroller(el).querySelector('slot')).not.toBeNull();
  });
});
