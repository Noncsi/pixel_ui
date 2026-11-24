import { afterEach, describe, expect, it } from 'vitest';
import { GRID } from '../src/components/character-creator/character-art.js';
import '../src/components/character-creator/px-character-creator.js';
import type {
  CharacterChangeEventDetail,
  PxCharacterCreator,
} from '../src/components/character-creator/px-character-creator.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
): Promise<PxCharacterCreator> {
  const el = document.createElement('px-character-creator');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function group(el: PxCharacterCreator, key: string): HTMLElement {
  const found = el.shadowRoot?.querySelector<HTMLElement>(`[data-group="${key}"]`);
  if (!found) throw new Error(`no ${key} group`);
  return found;
}

function options(el: PxCharacterCreator, key: string): HTMLButtonElement[] {
  return [...group(el, key).querySelectorAll<HTMLButtonElement>('[role="radio"]')];
}

function checked(el: PxCharacterCreator, key: string): HTMLButtonElement | undefined {
  return options(el, key).find((option) => option.getAttribute('aria-checked') === 'true');
}

async function press(el: PxCharacterCreator, key: string, from: HTMLElement): Promise<void> {
  from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-character-creator', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-character-creator')).toBeDefined();
  });

  it('starts on a character rather than on nothing', async () => {
    const el = await mount();
    expect(el.value).toEqual({ hair: 1, hairColor: 2 });
  });

  it('offers ten hairstyles and twenty colours, and nothing else', async () => {
    const el = await mount();

    expect(options(el, 'hair')).toHaveLength(10);
    expect(options(el, 'hair-color')).toHaveLength(20);
    // One body, so there is no body to pick.
    expect(el.shadowRoot?.querySelectorAll('[role="radiogroup"]')).toHaveLength(2);
  });

  it('makes each choice a radio group with one tab stop', async () => {
    const el = await mount();

    for (const key of ['hair', 'hair-color']) {
      expect(group(el, key).getAttribute('role')).toBe('radiogroup');
      const stops = options(el, key).filter((option) => option.tabIndex === 0);
      expect(stops).toHaveLength(1);
      expect(stops[0]).toBe(checked(el, key));
    }
  });

  it('names the group from a heading in the same shadow root', async () => {
    const el = await mount();
    const labelledBy = group(el, 'hair').getAttribute('aria-labelledby');
    const heading = el.shadowRoot?.getElementById(labelledBy ?? '');

    expect(heading?.textContent?.trim()).toBe('Hair');
  });

  it('names every option, because a picture of hair is not a name', async () => {
    const el = await mount();

    expect(options(el, 'hair')[3]?.getAttribute('aria-label')).toBe('Spiky');
    expect(options(el, 'hair-color')[5]?.getAttribute('aria-label')).toBe('Ginger');
  });

  it('chooses on a click and reports what changed', async () => {
    const el = await mount();
    const seen: CharacterChangeEventDetail[] = [];
    el.addEventListener('px-character-change', (event) => seen.push(event.detail));

    options(el, 'hair')[3]?.click();
    await el.updateComplete;

    expect(el.hair).toBe(4);
    expect(seen).toEqual([
      {
        hair: 4,
        hairColor: 2,
        hairName: 'Spiky',
        hairColorName: 'Dark brown',
        hairColorValue: '#3b2412',
      },
    ]);
  });

  it('says nothing when the same option is clicked again', async () => {
    const el = await mount({ hair: 4 });
    let fired = 0;
    el.addEventListener('px-character-change', () => (fired += 1));

    options(el, 'hair')[3]?.click();
    await el.updateComplete;

    expect(fired).toBe(0);
  });

  it('has no body attribute to set', async () => {
    const el = await mount();

    // One body is one body: nothing takes a gender, and setting the
    // attribute by hand changes nothing rather than half-working.
    el.setAttribute('gender', 'female');
    await el.updateComplete;

    expect(Object.keys(el.value)).toEqual(['hair', 'hairColor']);
    expect((el as unknown as Record<string, unknown>)['gender']).toBeUndefined();
  });

  it('moves and chooses with the left and right arrows, wrapping', async () => {
    const el = await mount({ hair: 1 });
    const first = options(el, 'hair')[0] as HTMLElement;

    await press(el, 'ArrowRight', first);
    expect(el.hair).toBe(2);

    await press(el, 'ArrowLeft', group(el, 'hair'));
    expect(el.hair).toBe(1);

    // Wrapping, so the end of the row is one press from the start.
    await press(el, 'ArrowLeft', group(el, 'hair'));
    expect(el.hair).toBe(10);
  });

  it('moves the colour grid by a row, not by one', async () => {
    const el = await mount({ 'hair-color': 3 });

    // Twenty swatches in two rows of ten: down from the third is the
    // thirteenth, and pretending it is a line would make it a long journey.
    await press(el, 'ArrowDown', group(el, 'hair-color'));
    expect(el.hairColor).toBe(13);

    await press(el, 'ArrowUp', group(el, 'hair-color'));
    expect(el.hairColor).toBe(3);
  });

  it('jumps to the ends with Home and End', async () => {
    const el = await mount();

    await press(el, 'End', group(el, 'hair-color'));
    expect(el.hairColor).toBe(20);

    await press(el, 'Home', group(el, 'hair-color'));
    expect(el.hairColor).toBe(1);
  });

  it('leaves keys it does not handle to the page', async () => {
    const el = await mount();
    const event = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true,
      cancelable: true,
    });
    group(el, 'hair').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps each group to its own arrows', async () => {
    const el = await mount({ hair: 3, 'hair-color': 5 });

    await press(el, 'ArrowRight', group(el, 'hair'));

    expect(el.hair).toBe(4);
    expect(el.hairColor).toBe(5);
  });

  it('pulls a value typed out of range back in', async () => {
    const wild = await mount({ hair: 99, 'hair-color': 0 });

    expect(wild.hair).toBe(10);
    expect(wild.hairColor).toBe(1);
  });

  it('describes the whole character in one sentence', async () => {
    const el = await mount({ hair: 7, 'hair-color': 6 });

    expect(el.description).toBe('Character with ponytail hair in ginger');
    expect(el.shadowRoot?.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      el.description,
    );
  });

  it('draws the preview from runs rather than from pixels', async () => {
    const el = await mount();
    const rects = el.shadowRoot?.querySelectorAll('[role="img"] rect') ?? [];

    expect(rects.length).toBeGreaterThan(0);
    // A rectangle per pixel would be 1024; runs should be a small fraction.
    expect(rects.length).toBeLessThan((GRID * GRID) / 8);
  });

  it('draws the preview and every tile as the whole sprite', async () => {
    const el = await mount();
    const box = (node: Element | null | undefined) =>
      node?.querySelector('svg')?.getAttribute('viewBox');
    const whole = `0 0 ${GRID} ${GRID}`;

    // Nothing is cropped at this size: the hair runs the full width of the
    // sprite, so there is nothing at the sides to crop away.
    expect(box(el.shadowRoot?.querySelector('[role="img"]'))).toBe(whole);
    expect(options(el, 'hair').map(box)).toEqual(Array(10).fill(whole));
  });

  it('draws every picker option on a body, in the chosen colour', async () => {
    const el = await mount({ 'hair-color': 19 });
    const moss = '#38b764';

    for (const option of options(el, 'hair')) {
      const fills = [...option.querySelectorAll('rect')].map((rect) => rect.getAttribute('fill'));
      // The hairstyle is picked by how it will actually look, so the swatch
      // shows the colour that is chosen rather than a stand-in grey.
      expect(fills).toContain(moss);
    }
  });

  it('hides the preview without losing the controls', async () => {
    const el = await mount({ 'hide-preview': true });

    expect(el.shadowRoot?.querySelector('[part="preview"]')).toBeNull();
    expect(options(el, 'hair')).toHaveLength(10);
  });

  it('ignores clicks and keys while disabled', async () => {
    const el = await mount({ disabled: true });
    let fired = 0;
    el.addEventListener('px-character-change', () => (fired += 1));

    options(el, 'hair')[5]?.click();
    await press(el, 'ArrowRight', group(el, 'hair'));

    expect(el.hair).toBe(1);
    expect(fired).toBe(0);
  });

  it('takes both at once through value', async () => {
    const el = await mount();
    el.value = { hair: 8, hairColor: 12 };
    await el.updateComplete;

    expect(el.value).toEqual({ hair: 8, hairColor: 12 });
    expect(checked(el, 'hair')).toBe(options(el, 'hair')[7]);
  });

  it('rolls a legal character at random', async () => {
    const el = await mount();

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const rolled = el.randomize();
      expect(rolled.hair).toBeGreaterThanOrEqual(1);
      expect(rolled.hair).toBeLessThanOrEqual(10);
      expect(rolled.hairColor).toBeGreaterThanOrEqual(1);
      expect(rolled.hairColor).toBeLessThanOrEqual(20);
    }
  });

  it('finds the form it is in without element internals', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = document.createElement('px-character-creator');
    form.append(el);
    await el.updateComplete;

    expect(el.form).toBe(form);
  });

  it('exposes the lists so a game can build its own picker', async () => {
    const { PxCharacterCreator } =
      await import('../src/components/character-creator/px-character-creator.js');

    expect(PxCharacterCreator.hairStyles).toHaveLength(10);
    expect(PxCharacterCreator.hairColors).toHaveLength(20);
  });
});
