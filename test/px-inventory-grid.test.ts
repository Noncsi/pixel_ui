import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/inventory/px-inventory-grid.js';
import '../src/components/inventory/px-inventory-slot.js';
import type { PxInventoryGrid } from '../src/components/inventory/px-inventory-grid.js';
import { fakeGamepad, type FakeGamepad } from './fake-gamepad.js';

interface CellSpec {
  label?: string;
  count?: number;
  disabled?: boolean;
  filled?: boolean;
}

/** Two rows of five: the first four hold something, the rest are empty. */
function bag(): CellSpec[] {
  return [
    { label: 'Potion', count: 12, filled: true },
    { label: 'Antidote', count: 3, filled: true },
    { label: 'Rusty Sword', filled: true },
    { label: 'Wooden Shield', filled: true },
    {},
    {},
    {},
    {},
    {},
    {},
  ];
}

async function settle(el: PxInventoryGrid): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

async function mount(
  cells: CellSpec[] = bag(),
  attrs: Record<string, string | number | boolean> = {},
): Promise<PxInventoryGrid> {
  const el = document.createElement('px-inventory-grid');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  for (const cell of cells) {
    const slot = document.createElement('px-inventory-slot');
    if (cell.label) slot.setAttribute('label', cell.label);
    if (cell.count) slot.setAttribute('count', String(cell.count));
    if (cell.disabled) slot.setAttribute('disabled', '');
    if (cell.filled) {
      const art = document.createElement('span');
      art.textContent = '*';
      slot.append(art);
    }
    el.append(slot);
  }

  document.body.append(el);
  await settle(el);
  return el;
}

function press(el: PxInventoryGrid, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

let pad: FakeGamepad | undefined;

afterEach(() => {
  pad?.restore();
  pad = undefined;
  document.body.innerHTML = '';
});

describe('px-inventory-grid', () => {
  it('registers both custom elements', () => {
    expect(customElements.get('px-inventory-grid')).toBeDefined();
    expect(customElements.get('px-inventory-slot')).toBeDefined();
  });

  it('collects its cells and highlights the first', async () => {
    const el = await mount();

    expect(el.slots).toHaveLength(10);
    expect(el.index).toBe(0);
    expect(el.activeSlot?.label).toBe('Potion');
    expect(el.getAttribute('aria-activedescendant')).toBe(el.slots[0]?.id);
  });

  it('is one focus stop, reported as a listbox of options', async () => {
    const el = await mount();

    expect(el.getAttribute('role')).toBe('listbox');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.slots[0]?.getAttribute('role')).toBe('option');
    expect(el.slots.some((slot) => slot.hasAttribute('tabindex'))).toBe(false);
  });

  it('marks only the highlighted cell', async () => {
    const el = await mount();
    expect(el.slots[0]?.active).toBe(true);
    expect(el.slots[0]?.getAttribute('aria-selected')).toBe('true');

    press(el, 'ArrowRight');
    await el.updateComplete;

    expect(el.slots[0]?.active).toBe(false);
    expect(el.slots[1]?.active).toBe(true);
  });

  it('steps along the bag with left and right', async () => {
    const el = await mount();
    const onActive = vi.fn();
    el.addEventListener('px-inventory-active', onActive);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(1);
    expect(onActive.mock.calls[0]?.[0].detail).toMatchObject({ index: 1, label: 'Antidote, 3' });

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('jumps a whole row with up and down', async () => {
    const el = await mount(bag(), { columns: 5 });

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(5);

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('wraps around in both directions', async () => {
    const el = await mount(bag(), { columns: 5 });

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.index).toBe(9);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(4);

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(9);
  });

  it('survives a columns value that makes no sense', async () => {
    const el = await mount(bag(), { columns: 0 });

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(1);
  });

  it('skips a locked cell', async () => {
    const el = await mount([
      { label: 'Potion', filled: true },
      { label: 'Locked', disabled: true },
      { label: 'Sword', filled: true },
    ]);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(2);
  });

  it('starts on the first cell that is not locked', async () => {
    const el = await mount([
      { label: 'Locked', disabled: true },
      { label: 'Potion', filled: true },
    ]);
    expect(el.index).toBe(1);
  });

  it('jumps to the ends with Home and End', async () => {
    const el = await mount();

    press(el, 'End');
    await el.updateComplete;
    expect(el.index).toBe(9);

    press(el, 'Home');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('chooses a cell with Enter and with Space', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('px-inventory-select', onSelect);

    press(el, 'Enter');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].detail).toMatchObject({ index: 0, label: 'Potion, 12' });

    press(el, ' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('refuses to choose a locked cell', async () => {
    const el = await mount([{ label: 'Locked', disabled: true }]);
    const onSelect = vi.fn();
    el.addEventListener('px-inventory-select', onSelect);

    press(el, 'Enter');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('backs out on Escape', async () => {
    const el = await mount();
    const onCancel = vi.fn();
    el.addEventListener('px-inventory-cancel', onCancel);

    press(el, 'Escape');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('highlights and chooses a clicked cell', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('px-inventory-select', onSelect);

    el.slots[3]?.click();
    await el.updateComplete;

    expect(el.index).toBe(3);
    expect(onSelect.mock.calls[0]?.[0].detail).toMatchObject({ index: 3, label: 'Wooden Shield' });
  });

  it('takes the gamepad only while it has focus', async () => {
    pad = fakeGamepad();
    const el = await mount(bag(), { columns: 5 });

    expect(pad.polling).toBe(false);
    el.dispatchEvent(new FocusEvent('focus'));
    expect(pad.polling).toBe(true);

    pad.press(13); // d-pad down
    pad.frame(0);
    await el.updateComplete;
    expect(el.index).toBe(5);

    pad.release();
    el.dispatchEvent(new FocusEvent('blur'));
    expect(pad.polling).toBe(false);
  });
});

describe('px-inventory-slot', () => {
  it('knows when it is empty, art or no art', async () => {
    const el = await mount();

    expect(el.slots[0]?.empty).toBe(false);
    expect(el.slots[0]?.hasAttribute('empty')).toBe(false);
    expect(el.slots[9]?.empty).toBe(true);
    expect(el.slots[9]?.hasAttribute('empty')).toBe(true);
  });

  it('names itself, with the count where there is more than one', async () => {
    const el = await mount();

    expect(el.slots[0]?.accessibleName).toBe('Potion, 12');
    expect(el.slots[2]?.accessibleName).toBe('Rusty Sword');
    expect(el.slots[0]?.getAttribute('aria-label')).toBe('Potion, 12');
  });

  it('says so when there is nothing in it', async () => {
    const el = await mount();
    expect(el.slots[9]?.accessibleName).toBe('Empty slot');
  });

  it('only draws a count above one', async () => {
    const el = await mount();
    expect(el.slots[0]?.shadowRoot?.querySelector('[part="count"]')?.textContent).toBe('12');
    expect(el.slots[2]?.shadowRoot?.querySelector('[part="count"]')).toBeNull();
  });
});
