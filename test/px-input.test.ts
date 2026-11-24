import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/input/px-input.js';
import type { PxInput } from '../src/components/input/px-input.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  parent: ParentNode = document.body,
): Promise<PxInput> {
  const el = document.createElement('px-input');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  parent.append(el);
  await el.updateComplete;
  return el;
}

function field(el: PxInput): HTMLInputElement {
  const node = el.shadowRoot?.querySelector('input');
  if (!node) throw new Error('input not rendered');
  return node;
}

/** Type `text` into the field, as a keyboard would. */
async function type(el: PxInput, text: string): Promise<void> {
  const input = field(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
}

function count(el: PxInput): string {
  return el.shadowRoot?.querySelector('[part="count"]')?.textContent?.replace(/\s+/g, '') ?? '';
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-input', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-input')).toBeDefined();
  });

  it('is a real input underneath', async () => {
    const el = await mount({ label: 'Name', placeholder: 'AAA', maxlength: 8 });
    const input = field(el);

    expect(input.type).toBe('text');
    expect(input.getAttribute('placeholder')).toBe('AAA');
    expect(input.getAttribute('maxlength')).toBe('8');
    expect(input.getAttribute('aria-label')).toBe('Name');
  });

  it('leaves out what it was not given', async () => {
    const el = await mount();
    expect(field(el).hasAttribute('placeholder')).toBe(false);
    expect(field(el).hasAttribute('maxlength')).toBe(false);
  });

  it('can be a password field', async () => {
    const el = await mount({ type: 'password' });
    expect(field(el).type).toBe('password');
  });

  it('follows what is typed, and says so', async () => {
    const el = await mount();
    const onInput = vi.fn();
    el.addEventListener('px-input', onInput);

    await type(el, 'Noemi');

    expect(el.value).toBe('Noemi');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput.mock.calls[0]?.[0].detail).toEqual({ value: 'Noemi' });
  });

  it('says nothing when the text did not actually change', async () => {
    const el = await mount({ value: 'Noemi' });
    const onInput = vi.fn();
    el.addEventListener('px-input', onInput);

    await type(el, 'Noemi');
    expect(onInput).not.toHaveBeenCalled();
  });

  it('reports the commit separately from the typing', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-input-change', onChange);

    await type(el, 'Zelda');
    expect(onChange).not.toHaveBeenCalled();

    field(el).dispatchEvent(new Event('change', { bubbles: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({ value: 'Zelda' });
  });

  it('folds the value itself when it is set to upper case', async () => {
    const el = await mount({ uppercase: true });

    await type(el, 'link');

    // Not only drawn in caps: what you read back is what was on screen.
    expect(el.value).toBe('LINK');
    expect(field(el).value).toBe('LINK');
  });

  it('clips to maxlength, whatever it is handed', async () => {
    const el = await mount({ maxlength: 3 });

    await type(el, 'ABCDEFGH');

    expect(el.value).toBe('ABC');
    expect(field(el).value).toBe('ABC');
  });

  it('counts characters only when asked, and only with a limit', async () => {
    const el = await mount({ maxlength: 8, 'show-count': true });
    expect(count(el)).toBe('0/8');

    await type(el, 'Noemi');
    expect(count(el)).toBe('5/8');

    el.showCount = false;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="count"]')).toBeNull();

    const noLimit = await mount({ 'show-count': true });
    expect(noLimit.shadowRoot?.querySelector('[part="count"]')).toBeNull();
  });

  it('shows an outside change to the value', async () => {
    const el = await mount();
    el.value = 'Ganon';
    await el.updateComplete;
    expect(field(el).value).toBe('Ganon');
  });

  it('empties itself on clear, and says so', async () => {
    const el = await mount({ value: 'Noemi' });
    const onInput = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('px-input', onInput);
    el.addEventListener('px-input-change', onChange);

    el.clear();
    await el.updateComplete;

    expect(el.value).toBe('');
    expect(field(el).value).toBe('');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    el.clear();
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it('forwards disabled and readonly', async () => {
    const el = await mount({ disabled: true, readonly: true });
    expect(field(el).disabled).toBe(true);
    expect(field(el).hasAttribute('readonly')).toBe(true);

    el.disabled = false;
    el.readonly = false;
    await el.updateComplete;
    expect(field(el).disabled).toBe(false);
    expect(field(el).hasAttribute('readonly')).toBe(false);
  });

  it('draws its label but keeps it out of the accessibility tree', async () => {
    const el = await mount({ label: 'Name' });
    const label = el.shadowRoot?.querySelector('[part="label"]');

    expect(label?.textContent).toBe('Name');
    expect(label?.getAttribute('aria-hidden')).toBe('true');

    const hidden = await mount({ label: 'Name', 'hide-label': true });
    expect(hidden.shadowRoot?.querySelector('[part="label"]')).toBeNull();
    expect(field(hidden).getAttribute('aria-label')).toBe('Name');
  });

  it('finds the form it sits in', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({ name: 'playerName' }, form);

    expect(el.form).toBe(form);
  });

  it('has no form outside one', async () => {
    const el = await mount();
    expect(el.form).toBeNull();
  });
});
