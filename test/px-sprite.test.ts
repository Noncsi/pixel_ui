import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/sprite/px-sprite.js';
import type { PxSprite } from '../src/components/sprite/px-sprite.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxSprite> {
  const el = document.createElement('px-sprite');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function style(el: PxSprite): string {
  return el.shadowRoot?.querySelector('[part="base"]')?.getAttribute('style') ?? '';
}

function base(el: PxSprite): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="base"]') ?? null;
}

const SHEET = { src: '/coin.png', 'frame-width': 16, 'frame-height': 16, frames: 6 };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-sprite', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-sprite')).toBeDefined();
  });

  it('lays the sheet out one frame wide', async () => {
    const el = await mount(SHEET);
    const css = style(el);

    expect(css).toContain('width: 16px');
    expect(css).toContain('height: 16px');
    expect(css).toContain('url("/coin.png")');
    // Six frames of sixteen pixels.
    expect(css).toContain('background-size: 96px auto');
  });

  it('scales the artwork rather than transforming the box', async () => {
    const el = await mount({ ...SHEET, scale: 3 });
    const css = style(el);

    // A transform would leave the element's box at one-times size and
    // everything beside it laid out around a sprite that isn't there.
    expect(css).toContain('width: 48px');
    expect(css).toContain('height: 48px');
    expect(css).toContain('background-size: 288px auto');
    expect(css).not.toContain('transform');
  });

  it('steps through the frames instead of sliding between them', async () => {
    const el = await mount(SHEET);
    expect(style(el)).toContain('steps(6)');
    expect(style(el)).toContain('infinite');
  });

  it('works out the length of a loop from the frame rate', async () => {
    const el = await mount({ ...SHEET, fps: 12 });
    expect(el.duration).toBe(500);
    expect(style(el)).toContain('500ms');
  });

  it('survives a frame rate that makes no sense', async () => {
    const el = await mount({ ...SHEET, fps: 0 });
    expect(el.duration).toBeGreaterThan(0);
  });

  it('survives a frame count that makes no sense', async () => {
    const el = await mount({ ...SHEET, frames: 0 });
    expect(el.safeFrames).toBe(1);
  });

  it('does not animate a single frame', async () => {
    const el = await mount({ ...SHEET, frames: 1 });
    expect(style(el)).not.toContain('animation');
  });

  it('plays through once when told to', async () => {
    const el = await mount({ ...SHEET, once: true });
    expect(style(el)).toContain('1 forwards');
    expect(style(el)).not.toContain('infinite');
  });

  it('picks a row out of a sheet that has several', async () => {
    const el = await mount({ ...SHEET, row: 2 });
    expect(style(el)).toContain('background-position: 0 -32px');
  });

  it('offsets the row by the scaled height', async () => {
    const el = await mount({ ...SHEET, row: 2, scale: 2 });
    expect(style(el)).toContain('background-position: 0 -64px');
  });

  it('holds still when paused', async () => {
    const el = await mount(SHEET);
    expect(el.paused).toBe(false);

    el.pause();
    await el.updateComplete;
    expect(el.hasAttribute('paused')).toBe(true);

    el.play();
    await el.updateComplete;
    expect(el.hasAttribute('paused')).toBe(false);
  });

  it('is named when it means something', async () => {
    const el = await mount({ ...SHEET, label: 'A spinning coin' });

    expect(base(el)?.getAttribute('role')).toBe('img');
    expect(base(el)?.getAttribute('aria-label')).toBe('A spinning coin');
    expect(base(el)?.hasAttribute('aria-hidden')).toBe(false);
  });

  it('counts as decoration when it is not named', async () => {
    const el = await mount(SHEET);

    expect(base(el)?.getAttribute('aria-hidden')).toBe('true');
    expect(base(el)?.hasAttribute('role')).toBe(false);
  });

  it('draws nothing at all without a sheet', async () => {
    const el = await mount({ frames: 4 });
    expect(style(el)).not.toContain('background-image');
  });
});
