import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/marquee/px-marquee.js';
import type { PxMarquee } from '../src/components/marquee/px-marquee.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  content = 'Thanks for playing.',
): Promise<PxMarquee> {
  const el = document.createElement('px-marquee');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = content;
  document.body.append(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function copy(el: PxMarquee): HTMLElement | null {
  return el.shadowRoot?.querySelector('.copy') ?? null;
}

function track(el: PxMarquee): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="track"]') ?? null;
}

/** happy-dom lays nothing out, so one copy's width has to be stated. */
async function width(el: PxMarquee, pixels: number): Promise<void> {
  const original = el.shadowRoot?.querySelector('.original');
  if (!original) throw new Error('original not rendered');

  Object.defineProperty(original, 'offsetWidth', { value: pixels, configurable: true });
  el.measure();
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-marquee', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-marquee')).toBeDefined();
  });

  it('keeps the real content in the light DOM', async () => {
    const el = await mount();
    expect(el.textContent).toBe('Thanks for playing.');
    expect(el.shadowRoot?.querySelector('.original slot')).not.toBeNull();
  });

  it('clones the content so the loop has no seam', async () => {
    const el = await mount();
    expect(copy(el)?.textContent).toBe('Thanks for playing.');
  });

  it('hides the clone from assistive technology', async () => {
    const el = await mount();
    // Otherwise the line would be read out twice.
    expect(copy(el)?.getAttribute('aria-hidden')).toBe('true');
  });

  it('re-clones when the content changes', async () => {
    const el = await mount();
    el.textContent = 'Press start.';
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(copy(el)?.textContent).toBe('Press start.');
  });

  it('clones markup, not just words', async () => {
    const el = await mount({}, '');
    const strong = document.createElement('strong');
    strong.textContent = 'CREDITS';
    el.append(strong);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await el.updateComplete;

    expect(copy(el)?.querySelector('strong')?.textContent).toBe('CREDITS');
  });

  it('travels one copy plus the gap', async () => {
    const el = await mount({ gap: 40 });
    await width(el, 200);

    expect(el.distance).toBe(240);
    expect(track(el)?.getAttribute('style')).toContain('--_distance: 240px');
  });

  it('works the time out from the distance, so every line crawls alike', async () => {
    const el = await mount({ gap: 0, speed: 100 });
    await width(el, 200);
    expect(el.duration).toBe(2000);

    const longer = await mount({ gap: 0, speed: 100 });
    await width(longer, 400);
    // Twice the line, twice as long on screen — not twice as fast.
    expect(longer.duration).toBe(4000);
  });

  it('puts the time in the style for the animation to use', async () => {
    const el = await mount({ gap: 0, speed: 100 });
    await width(el, 200);
    expect(track(el)?.getAttribute('style')).toContain('animation-duration: 2000ms');
  });

  it('survives a speed that makes no sense', async () => {
    const el = await mount({ speed: 0 });
    await width(el, 200);
    expect(el.duration).toBeGreaterThan(0);
  });

  it('survives a gap that makes no sense', async () => {
    const el = await mount({ gap: -40 });
    await width(el, 200);
    expect(el.distance).toBe(200);
  });

  it('goes the other way when asked', async () => {
    const el = await mount({ direction: 'right' });
    expect(el.getAttribute('direction')).toBe('right');
  });

  it('holds still when paused', async () => {
    const el = await mount();
    expect(el.paused).toBe(false);

    el.pause();
    await el.updateComplete;
    expect(el.hasAttribute('paused')).toBe(true);

    el.play();
    await el.updateComplete;
    expect(el.hasAttribute('paused')).toBe(false);
  });

  it('can be told not to stop for the pointer', async () => {
    const el = await mount({ 'no-pause': true });
    expect(el.noPause).toBe(true);
    expect(el.hasAttribute('no-pause')).toBe(true);
  });
});
