import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/rating/px-rating.js';
import type { PxRating, RatingChangeEventDetail } from '../src/components/rating/px-rating.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxRating> {
  const el = document.createElement('px-rating');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function items(el: PxRating): HTMLElement[] {
  return [...(el.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? [])];
}

function glyphs(el: PxRating): string {
  return items(el)
    .map((item) => item.textContent?.trim() ?? '')
    .join('');
}

async function press(el: PxRating, key: string): Promise<void> {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-rating', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-rating')).toBeDefined();
  });

  it('draws one glyph per point, filled up to the value', async () => {
    const el = await mount({ value: 3 });

    expect(items(el)).toHaveLength(5);
    expect(glyphs(el)).toBe('★★★☆☆');
  });

  it('is a slider with one focus stop, not five buttons', async () => {
    const el = await mount({ value: 3, label: 'Difficulty' });

    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-valuenow')).toBe('3');
    expect(el.getAttribute('aria-valuemax')).toBe('5');
    expect(el.getAttribute('aria-valuetext')).toBe('3 of 5 stars');
    // Nothing inside is reachable: the glyphs are the drawing, not controls.
    expect(items(el).some((item) => item.hasAttribute('tabindex'))).toBe(false);
  });

  it('is a picture when readonly, with the reading in its name', async () => {
    const el = await mount({ value: 2, readonly: true, label: 'Rarity' });

    expect(el.getAttribute('role')).toBe('img');
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe('Rarity: 2 of 5 stars');
  });

  it('changes with the arrow keys, and jumps with Home and End', async () => {
    const el = await mount({ value: 3 });

    await press(el, 'ArrowRight');
    expect(el.value).toBe(4);
    await press(el, 'ArrowLeft');
    expect(el.value).toBe(3);
    await press(el, 'End');
    expect(el.value).toBe(5);
    await press(el, 'Home');
    expect(el.value).toBe(1);
  });

  it('stops at the ends rather than wrapping round', async () => {
    const el = await mount({ value: 5 });

    await press(el, 'ArrowRight');
    expect(el.value).toBe(5);

    el.rate(1);
    await press(el, 'ArrowLeft');
    expect(el.value).toBe(1);
  });

  it('will not go below one unless zero is allowed', async () => {
    const el = await mount({ value: 1 });
    expect(el.min).toBe(1);
    el.rate(0);
    expect(el.value).toBe(1);

    const clearable = await mount({ value: 1, 'allow-zero': true });
    expect(clearable.min).toBe(0);
    clearable.rate(0);
    expect(clearable.value).toBe(0);
  });

  it('reports a change once, with the value and the row it is out of', async () => {
    const el = await mount({ value: 1 });
    const seen: RatingChangeEventDetail[] = [];
    el.addEventListener('px-rating-change', (event) => seen.push(event.detail));

    el.rate(4);
    el.rate(4);

    expect(seen).toEqual([{ value: 4, max: 5 }]);
  });

  it('sets the value from a click, and clears on the last filled one', async () => {
    const el = await mount({ value: 0, 'allow-zero': true });

    items(el)[2]?.click();
    await el.updateComplete;
    expect(el.value).toBe(3);

    // Clicking the third again is the only way back to none with a pointer.
    items(el)[2]?.click();
    await el.updateComplete;
    expect(el.value).toBe(0);
  });

  it('shows what the pointer is over without announcing it', async () => {
    const el = await mount({ value: 1 });

    items(el)[3]?.dispatchEvent(new Event('pointerenter'));
    await el.updateComplete;

    expect(glyphs(el)).toBe('★★★★☆');
    // Hovering is not choosing: the value a screen reader is told is the one
    // that is actually set.
    expect(el.value).toBe(1);
    expect(el.getAttribute('aria-valuenow')).toBe('1');

    el.shadowRoot?.querySelector('[part="base"]')?.dispatchEvent(new Event('pointerleave'));
    await el.updateComplete;
    expect(glyphs(el)).toBe('★☆☆☆☆');
  });

  it('refuses to change while readonly or disabled', async () => {
    const locked = await mount({ value: 2, readonly: true });
    locked.rate(5);
    await press(locked, 'ArrowRight');
    expect(locked.value).toBe(2);

    const off = await mount({ value: 2, disabled: true });
    off.rate(5);
    expect(off.value).toBe(2);
  });

  it('draws hearts and diamonds hollow as well as filled', async () => {
    const hearts = await mount({ value: 2, max: 3, shape: 'heart' });
    expect(glyphs(hearts)).toBe('♥♥♡');

    const gems = await mount({ value: 1, max: 2, shape: 'diamond' });
    expect(glyphs(gems)).toBe('◆◇');
  });

  it('keeps a hollow glyph when only a filled one is given', async () => {
    // Repeating the custom glyph would make a half-full row look full.
    const el = await mount({ value: 1, max: 3, glyph: '☠' });
    expect(glyphs(el)).toBe('☠☆☆');
  });

  it('takes a matching pair when both are given', async () => {
    const el = await mount({ value: 1, max: 3, glyph: '☠', 'empty-glyph': '·' });
    expect(glyphs(el)).toBe('☠··');
  });

  it('pulls a value past the end of the row back onto it', async () => {
    const el = await mount({ value: 9, max: 3 });

    expect(el.value).toBe(3);
    expect(el.getAttribute('aria-valuenow')).toBe('3');
  });

  it('shows none out of five even where none cannot be chosen', async () => {
    // allow-zero is about clearing the row by hand, not about whether a game
    // may display an unrated thing.
    const el = await mount({ value: 0, readonly: true });

    expect(el.value).toBe(0);
    expect(glyphs(el)).toBe('☆☆☆☆☆');
    expect(el.getAttribute('aria-label')).toBe('0 of 5 stars');
  });

  it('agrees with the row rather than with the value', async () => {
    // "one of five stars", never "one of five star": it is the five that the
    // noun belongs to.
    const some = await mount({ value: 1, readonly: true });
    expect(some.getAttribute('aria-label')).toBe('1 of 5 stars');

    const only = await mount({ value: 1, max: 1, readonly: true });
    expect(only.getAttribute('aria-label')).toBe('1 of 1 star');
  });

  it('takes a word of its own for what is being counted', async () => {
    const el = await mount({ value: 2, max: 3, shape: 'heart', unit: 'heart', readonly: true });
    expect(el.getAttribute('aria-label')).toBe('2 of 3 hearts');
  });

  it('takes a plural that is not just an s', async () => {
    const el = await mount({
      value: 2,
      max: 3,
      shape: 'heart',
      unit: 'life',
      'unit-plural': 'lives',
      readonly: true,
    });
    expect(el.getAttribute('aria-label')).toBe('2 of 3 lives');

    el.max = 1;
    await el.updateComplete;
    expect(el.getAttribute('aria-label')).toBe('1 of 1 life');
  });

  it('finds the form it is in without element internals', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = document.createElement('px-rating');
    form.append(el);
    await el.updateComplete;

    expect(el.form).toBe(form);
  });
});
