import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/menu/px-menu.js';
import '../src/components/menu/px-menu-item.js';
import type { PxMenu } from '../src/components/menu/px-menu.js';
import type { PxMenuItem } from '../src/components/menu/px-menu-item.js';
import { fakeGamepad, type FakeGamepad } from './fake-gamepad.js';

interface RowSpec {
  label: string;
  value?: string;
  disabled?: boolean;
}

const ROWS: RowSpec[] = [
  { label: 'Continue' },
  { label: 'Load game' },
  { label: 'Options' },
  { label: 'Quit', value: 'quit' },
];

/**
 * slotchange is a microtask behind the first render, so settling means
 * letting the task queue drain before waiting on Lit again.
 */
async function settle(el: PxMenu): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

async function mount(
  rows: RowSpec[] = ROWS,
  attrs: Record<string, string | number | boolean> = {},
): Promise<PxMenu> {
  const el = document.createElement('px-menu');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  for (const row of rows) {
    const item = document.createElement('px-menu-item');
    item.textContent = row.label;
    if (row.value !== undefined) item.setAttribute('value', row.value);
    if (row.disabled) item.setAttribute('disabled', '');
    el.append(item);
  }

  document.body.append(el);
  await settle(el);
  return el;
}

function press(el: PxMenu, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function labels(el: PxMenu): string[] {
  return el.items.map((item) => (item.textContent ?? '').trim());
}

let pad: FakeGamepad | undefined;

afterEach(() => {
  pad?.restore();
  pad = undefined;
  document.body.innerHTML = '';
});

describe('px-menu', () => {
  it('registers both custom elements', () => {
    expect(customElements.get('px-menu')).toBeDefined();
    expect(customElements.get('px-menu-item')).toBeDefined();
  });

  it('collects its rows from the slot', async () => {
    const el = await mount();
    expect(labels(el)).toEqual(['Continue', 'Load game', 'Options', 'Quit']);
  });

  it('is one focus stop with the highlight in aria-activedescendant', async () => {
    const el = await mount();

    expect(el.getAttribute('role')).toBe('menu');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.items[0]?.getAttribute('role')).toBe('menuitem');
    // No row is a focus stop of its own.
    expect(el.items.some((item) => item.hasAttribute('tabindex'))).toBe(false);

    const first = el.items[0];
    expect(first?.id).toBeTruthy();
    expect(el.getAttribute('aria-activedescendant')).toBe(first?.id);
  });

  it('marks only the active row', async () => {
    const el = await mount();
    expect(el.items.map((item) => item.active)).toEqual([true, false, false, false]);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.items.map((item) => item.active)).toEqual([false, true, false, false]);
  });

  it('moves the highlight with the arrow keys and says so', async () => {
    const el = await mount();
    const onActive = vi.fn();
    el.addEventListener('px-menu-active', onActive);

    press(el, 'ArrowDown');
    await el.updateComplete;

    expect(el.index).toBe(1);
    expect(onActive).toHaveBeenCalledTimes(1);
    expect(onActive.mock.calls[0]?.[0].detail).toMatchObject({ value: 'Load game', index: 1 });

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('wraps around at the ends', async () => {
    const el = await mount();

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(3);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('stops at the ends with no-loop', async () => {
    const el = await mount(ROWS, { 'no-loop': true });

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(0);

    press(el, 'End');
    await el.updateComplete;
    expect(el.index).toBe(3);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(3);
  });

  it('skips disabled rows', async () => {
    const el = await mount([
      { label: 'Continue' },
      { label: 'Load game', disabled: true },
      { label: 'Options' },
    ]);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(2);

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('starts on the first row that can actually be chosen', async () => {
    const el = await mount([
      { label: 'Continue', disabled: true },
      { label: 'New game' },
      { label: 'Options' },
    ]);

    expect(el.index).toBe(1);
    expect(el.activeItem?.textContent).toBe('New game');
  });

  it('jumps to the ends with Home and End', async () => {
    const el = await mount();

    press(el, 'End');
    await el.updateComplete;
    expect(el.index).toBe(3);

    press(el, 'Home');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('chooses the highlighted row with Enter and with Space', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);

    press(el, 'Enter');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].detail).toMatchObject({ value: 'Continue', index: 0 });

    press(el, ' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('reports the row value where there is one, and its text where there is not', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);

    press(el, 'End');
    await el.updateComplete;
    press(el, 'Enter');

    expect(onSelect.mock.calls[0]?.[0].detail.value).toBe('quit');
  });

  it('keeps the detail slot out of the value it works out for itself', async () => {
    const el = await mount([{ label: 'Difficulty' }]);
    const detail = document.createElement('span');
    detail.slot = 'detail';
    detail.textContent = 'normal';
    el.items[0]?.append(detail);

    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);
    press(el, 'Enter');

    expect(onSelect.mock.calls[0]?.[0].detail.value).toBe('Difficulty');
  });

  it('refuses to choose a disabled row', async () => {
    const el = await mount([{ label: 'Continue', disabled: true }]);
    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);

    press(el, 'Enter');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('backs out on Escape', async () => {
    const el = await mount();
    const onCancel = vi.fn();
    el.addEventListener('px-menu-cancel', onCancel);

    press(el, 'Escape');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('leaves keys it does not handle alone', async () => {
    const el = await mount();

    const handled = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    el.dispatchEvent(handled);
    expect(handled.defaultPrevented).toBe(true);

    const ignored = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    el.dispatchEvent(ignored);
    expect(ignored.defaultPrevented).toBe(false);
  });

  it('uses left and right when it runs horizontally', async () => {
    const el = await mount(ROWS, { orientation: 'horizontal' });

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(1);

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(1);

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('highlights and chooses a clicked row', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);

    const options: PxMenuItem | undefined = el.items[2];
    options?.click();
    await el.updateComplete;

    expect(el.index).toBe(2);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].detail).toMatchObject({ value: 'Options', index: 2 });
  });

  it('ignores a click on a disabled row', async () => {
    const el = await mount([{ label: 'Continue' }, { label: 'Load game', disabled: true }]);
    const onSelect = vi.fn();
    el.addEventListener('px-menu-select', onSelect);

    el.items[1]?.click();
    await el.updateComplete;

    expect(el.index).toBe(0);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('drops a row that goes away and keeps the highlight somewhere real', async () => {
    const el = await mount();

    press(el, 'End');
    await el.updateComplete;
    expect(el.index).toBe(3);

    el.items[3]?.remove();
    await settle(el);

    expect(el.items).toHaveLength(3);
    expect(el.activeItem).not.toBeNull();
    expect(el.index).toBeLessThan(3);
  });

  it('takes the gamepad only while it has focus', async () => {
    pad = fakeGamepad();
    const el = await mount();

    expect(pad.polling).toBe(false);

    el.dispatchEvent(new FocusEvent('focus'));
    expect(pad.polling).toBe(true);

    pad.press(13); // d-pad down
    pad.frame(0);
    await el.updateComplete;
    expect(el.index).toBe(1);

    pad.release();
    el.dispatchEvent(new FocusEvent('blur'));
    expect(pad.polling).toBe(false);
  });

  it('chooses with A and backs out with B', async () => {
    pad = fakeGamepad();
    const el = await mount();
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    el.addEventListener('px-menu-select', onSelect);
    el.addEventListener('px-menu-cancel', onCancel);

    el.dispatchEvent(new FocusEvent('focus'));

    pad.press(0);
    pad.frame(0);
    expect(onSelect).toHaveBeenCalledTimes(1);

    pad.press(1);
    pad.frame(16);
    expect(onCancel).toHaveBeenCalledTimes(1);

    el.dispatchEvent(new FocusEvent('blur'));
  });

  it('lets go of the gamepad when it leaves the page', async () => {
    pad = fakeGamepad();
    const el = await mount();

    el.dispatchEvent(new FocusEvent('focus'));
    expect(pad.polling).toBe(true);

    el.remove();
    expect(pad.polling).toBe(false);
  });
});
