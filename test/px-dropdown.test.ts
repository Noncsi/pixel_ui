import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/dropdown/px-dropdown.js';
import '../src/components/dropdown/px-option.js';
import type { PxDropdown } from '../src/components/dropdown/px-dropdown.js';

interface OptionSpec {
  label: string;
  value?: string;
  disabled?: boolean;
}

const CHOICES: OptionSpec[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Normal', value: 'normal' },
  { label: 'Hard', value: 'hard' },
  { label: 'Nightmare', value: 'nightmare', disabled: true },
];

async function settle(el: PxDropdown): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

async function mount(
  choices: OptionSpec[] = CHOICES,
  attrs: Record<string, string | number | boolean> = {},
): Promise<PxDropdown> {
  const el = document.createElement('px-dropdown');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  for (const choice of choices) {
    const option = document.createElement('px-option');
    option.textContent = choice.label;
    if (choice.value) option.setAttribute('value', choice.value);
    if (choice.disabled) option.setAttribute('disabled', '');
    el.append(option);
  }

  document.body.append(el);
  await settle(el);
  return el;
}

function trigger(el: PxDropdown): HTMLButtonElement {
  const node = el.shadowRoot?.querySelector('button');
  if (!node) throw new Error('trigger not rendered');
  return node;
}

function shown(el: PxDropdown): string {
  return el.shadowRoot?.querySelector('[part="value"]')?.textContent?.trim() ?? '';
}

function press(el: PxDropdown, key: string, from: EventTarget = el): void {
  from.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-dropdown', () => {
  it('registers both custom elements', () => {
    expect(customElements.get('px-dropdown')).toBeDefined();
    expect(customElements.get('px-option')).toBeDefined();
  });

  it('takes the first choice when it is given no value', async () => {
    const el = await mount();
    expect(el.value).toBe('easy');
    expect(shown(el)).toBe('Easy');
    expect(el.selectedOption?.label).toBe('Easy');
  });

  it('keeps the value it was given', async () => {
    const el = await mount(CHOICES, { value: 'hard' });
    expect(el.value).toBe('hard');
    expect(shown(el)).toBe('Hard');
  });

  it('shows the placeholder when the value matches nothing', async () => {
    const el = await mount(CHOICES, { value: 'cheats', placeholder: 'Pick one…' });
    expect(shown(el)).toBe('Pick one…');
  });

  it('is a closed listbox button to start with', async () => {
    const el = await mount();

    expect(el.open).toBe(false);
    expect(trigger(el).getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(el.shadowRoot?.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it('marks the chosen option, and only that one', async () => {
    const el = await mount(CHOICES, { value: 'normal' });
    expect(el.options.map((option) => option.selected)).toEqual([false, true, false, false]);
    expect(el.options[1]?.getAttribute('aria-selected')).toBe('true');
  });

  it('opens and closes, and says so', async () => {
    const el = await mount();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    el.addEventListener('px-dropdown-open', onOpen);
    el.addEventListener('px-dropdown-close', onClose);

    el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    expect(onOpen).toHaveBeenCalledTimes(1);

    el.close();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens on Enter, on Space and on alt+down', async () => {
    const el = await mount();

    press(el, 'Enter');
    await el.updateComplete;
    expect(el.open).toBe(true);
    el.close();
    await el.updateComplete;

    press(el, ' ');
    await el.updateComplete;
    expect(el.open).toBe(true);
    el.close();
    await el.updateComplete;

    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }),
    );
    await settle(el);
    expect(el.open).toBe(true);
  });

  it('changes the value in place while it is shut, as a select does', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-dropdown-change', onChange);

    press(el, 'ArrowDown');
    await el.updateComplete;

    // Closed, so the arrow moved the value rather than opening anything.
    expect(el.open).toBe(false);
    expect(el.value).toBe('normal');
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({
      value: 'normal',
      label: 'Normal',
      index: 1,
    });

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('steps over a disabled option', async () => {
    const el = await mount(CHOICES, { value: 'hard' });

    press(el, 'ArrowDown');
    await el.updateComplete;

    // Nightmare is disabled, so it wraps past it to the top.
    expect(el.value).toBe('easy');
  });

  it('moves focus onto the options while it is open', async () => {
    const el = await mount(CHOICES, { value: 'normal' });

    el.show();
    await settle(el);

    expect(document.activeElement).toBe(el.options[1]);

    press(el, 'ArrowDown', el.options[1] ?? el);
    await el.updateComplete;
    expect(document.activeElement).toBe(el.options[2]);
  });

  it('chooses the focused option on Enter and closes', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-dropdown-change', onChange);

    el.show();
    await settle(el);

    press(el, 'ArrowDown', el.options[0] ?? el);
    await el.updateComplete;
    press(el, 'Enter', el.options[1] ?? el);
    await el.updateComplete;

    expect(el.value).toBe('normal');
    expect(el.open).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('chooses a clicked option', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    el.options[2]?.click();
    await el.updateComplete;

    expect(el.value).toBe('hard');
    expect(el.open).toBe(false);
  });

  it('ignores a click on a disabled option', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    el.options[3]?.click();
    await el.updateComplete;

    expect(el.value).toBe('easy');
    expect(el.open).toBe(true);
  });

  it('closes on Escape without changing anything', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    press(el, 'Escape', el.options[0] ?? el);
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(el.value).toBe('easy');
  });

  it('closes when something outside it is pressed', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.open).toBe(false);
  });

  it('stays open when something inside it is pressed', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    el.options[0]?.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    await el.updateComplete;

    expect(el.open).toBe(true);
  });

  it('selects by value, and refuses a disabled one', async () => {
    const el = await mount();

    el.select('hard');
    await el.updateComplete;
    expect(el.value).toBe('hard');

    el.select('nightmare');
    await el.updateComplete;
    expect(el.value).toBe('hard');
  });

  it('does nothing at all while disabled', async () => {
    const el = await mount(CHOICES, { disabled: true });

    el.show();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(trigger(el).disabled).toBe(true);
  });

  it('falls back to an option text when it has no value', async () => {
    const el = await mount([{ label: 'Fullscreen' }, { label: 'Windowed' }]);
    expect(el.value).toBe('Fullscreen');
    expect(el.options[0]?.resolvedValue).toBe('Fullscreen');
  });
});
