import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/save-slot/px-save-slot.js';
import type {
  PxSaveSlot,
  SaveSlotSelectEventDetail,
} from '../src/components/save-slot/px-save-slot.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxSaveSlot> {
  const el = document.createElement('px-save-slot');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const FULL = {
  'slot-number': 2,
  name: 'Noemi',
  level: 12,
  location: 'Dark Forest',
  playtime: 15_132,
};

function button(el: PxSaveSlot): HTMLButtonElement {
  const found = el.shadowRoot?.querySelector('button');
  if (!found) throw new Error('no button');
  return found as HTMLButtonElement;
}

function part(el: PxSaveSlot, name: string): HTMLElement | null {
  return el.shadowRoot?.querySelector(`[part="${name}"]`) ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-save-slot', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-save-slot')).toBeDefined();
  });

  it('is one button, because the row is the thing being chosen', async () => {
    const el = await mount(FULL);
    expect(button(el).type).toBe('button');
    expect(el.shadowRoot?.querySelectorAll('button')).toHaveLength(1);
  });

  it('composes the whole row into one sentence', async () => {
    const el = await mount(FULL);

    expect(el.accessibleName).toBe('Slot 2: Noemi, level 12, Dark Forest, 4 hours 12 minutes');
    expect(button(el).getAttribute('aria-label')).toBe(el.accessibleName);
  });

  it('hides every drawn copy, so nothing is said twice', async () => {
    const el = await mount(FULL);
    expect(el.shadowRoot?.querySelector('.row')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws the clock and says the words', async () => {
    const el = await mount(FULL);

    // "4:12" is read aloud as four twelve, which is a time of day.
    expect(el.clock).toBe('4:12');
    expect(el.playtimeText).toBe('4 hours 12 minutes');
    expect(part(el, 'playtime')?.textContent?.trim()).toBe('4:12');
  });

  it('pads the minutes and counts them in the singular', async () => {
    const one = await mount({ playtime: 3660 });
    expect(one.clock).toBe('1:01');
    expect(one.playtimeText).toBe('1 hour 1 minute');

    const noHours = await mount({ playtime: 42 * 60 });
    expect(noHours.clock).toBe('0:42');
    expect(noHours.playtimeText).toBe('42 minutes');

    const exact = await mount({ playtime: 7200 });
    expect(exact.playtimeText).toBe('2 hours');
  });

  it('says what a clock of zeroes means', async () => {
    const el = await mount({ playtime: 20 });
    expect(el.clock).toBe('0:00');
    expect(el.playtimeText).toBe('less than a minute');
  });

  it('leaves out what it was not given', async () => {
    const el = await mount({ 'slot-number': 1, name: 'Noemi' });

    expect(el.accessibleName).toBe('Slot 1: Noemi');
    expect(part(el, 'detail')).toBeNull();
    expect(part(el, 'playtime')).toBeNull();
    expect(part(el, 'saved')).toBeNull();
  });

  it('is still a button when it is empty', async () => {
    const el = await mount({ 'slot-number': 3, empty: true });

    expect(el.accessibleName).toBe('Slot 3, Empty');
    expect(button(el).disabled).toBe(false);
  });

  it('keeps the portrait box when empty, so a list of them lines up', async () => {
    const full = await mount(FULL);
    const blank = await mount({ 'slot-number': 3, empty: true });

    expect(part(full, 'art')).not.toBeNull();
    expect(part(blank, 'art')).not.toBeNull();
    // There is just nothing in it.
    expect(blank.querySelector('*')).toBeNull();
  });

  it('takes its own word for empty', async () => {
    const el = await mount({ 'slot-number': 3, empty: true, 'empty-text': 'No data' });
    expect(el.accessibleName).toBe('Slot 3, No data');
  });

  it('reports what was chosen', async () => {
    const el = await mount(FULL);
    const seen: SaveSlotSelectEventDetail[] = [];
    el.addEventListener('px-save-slot-select', (event) => seen.push(event.detail));

    button(el).click();

    expect(seen).toEqual([{ slotNumber: 2, empty: false }]);
  });

  it('says which it is when the slot is empty', async () => {
    const el = await mount({ 'slot-number': 4, empty: true });
    const seen: SaveSlotSelectEventDetail[] = [];
    el.addEventListener('px-save-slot-select', (event) => seen.push(event.detail));

    el.select();

    expect(seen).toEqual([{ slotNumber: 4, empty: true }]);
  });

  it('is current rather than pressed', async () => {
    const el = await mount({ ...FULL, selected: true });

    // aria-pressed would have every other row announcing "not pressed".
    expect(button(el).getAttribute('aria-current')).toBe('true');
    expect(button(el).hasAttribute('aria-pressed')).toBe(false);

    el.selected = false;
    await el.updateComplete;
    expect(button(el).hasAttribute('aria-current')).toBe(false);
  });

  it('ignores clicks while disabled', async () => {
    const el = await mount({ ...FULL, disabled: true });
    let fired = 0;
    el.addEventListener('px-save-slot-select', () => (fired += 1));

    el.select();
    button(el).click();

    expect(fired).toBe(0);
  });

  it('draws the level and the place on one line', async () => {
    const el = await mount(FULL);
    expect(part(el, 'detail')?.textContent?.trim()).toBe('Lv 12 · Dark Forest');
  });

  it('takes the saved-at line as given, formatting no dates', async () => {
    const el = await mount({ ...FULL, saved: '12 Nov, 21:04' });

    expect(part(el, 'saved')?.textContent?.trim()).toBe('12 Nov, 21:04');
    expect(el.accessibleName).toContain('12 Nov, 21:04');
  });
});
