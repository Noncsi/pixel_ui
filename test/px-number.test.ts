import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/number/px-number.js';
import type { PxNumber } from '../src/components/number/px-number.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  parent: ParentNode = document.body,
): Promise<PxNumber> {
  const el = document.createElement('px-number');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  parent.append(el);
  await el.updateComplete;
  return el;
}

function field(el: PxNumber): HTMLInputElement {
  const node = el.shadowRoot?.querySelector('input');
  if (!node) throw new Error('input not rendered');
  return node;
}

function button(el: PxNumber, part: 'decrement' | 'increment'): HTMLButtonElement {
  const node = el.shadowRoot?.querySelector(`[part="${part}"]`);
  if (!(node instanceof HTMLButtonElement)) throw new Error(`${part} not rendered`);
  return node;
}

/** Type `text` into the field, as a keyboard would. */
async function type(el: PxNumber, text: string): Promise<void> {
  const input = field(el);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await el.updateComplete;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-number', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-number')).toBeDefined();
  });

  it('is a real number input, which the browser reports as a spinbutton', async () => {
    const el = await mount({ label: 'Potions', min: 1, max: 9, step: 2, value: 3 });
    const input = field(el);

    expect(input.type).toBe('number');
    expect(input.getAttribute('min')).toBe('1');
    expect(input.getAttribute('max')).toBe('9');
    expect(input.getAttribute('step')).toBe('2');
    expect(input.getAttribute('aria-label')).toBe('Potions');
  });

  it('names its step buttons after what they do', async () => {
    const el = await mount({ label: 'Potions', value: 3 });

    expect(button(el, 'decrement').getAttribute('aria-label')).toBe('Decrease Potions');
    expect(button(el, 'increment').getAttribute('aria-label')).toBe('Increase Potions');

    const bare = await mount({ value: 3 });
    expect(button(bare, 'decrement').getAttribute('aria-label')).toBe('Decrease');
  });

  it('steps up and down, and says so', async () => {
    const el = await mount({ value: 3 });
    const onInput = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('px-number-input', onInput);
    el.addEventListener('px-number-change', onChange);

    button(el, 'increment').click();
    await el.updateComplete;

    expect(el.value).toBe(4);
    expect(field(el).value).toBe('4');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({ value: 4 });

    button(el, 'decrement').click();
    await el.updateComplete;
    expect(el.value).toBe(3);
  });

  it('steps by its own step', async () => {
    const el = await mount({ value: 0, step: 5 });

    el.stepUp();
    await el.updateComplete;
    expect(el.value).toBe(5);
  });

  it('stops at the ends, and disables the button that would go past', async () => {
    const el = await mount({ value: 0, min: 0, max: 2 });

    expect(el.atMin).toBe(true);
    expect(button(el, 'decrement').disabled).toBe(true);

    el.stepDown();
    await el.updateComplete;
    expect(el.value).toBe(0);

    el.stepUp();
    el.stepUp();
    await el.updateComplete;

    expect(el.value).toBe(2);
    expect(el.atMax).toBe(true);
    expect(button(el, 'increment').disabled).toBe(true);
  });

  it('says nothing for a step that changes nothing', async () => {
    const el = await mount({ value: 0, min: 0 });
    const onChange = vi.fn();
    el.addEventListener('px-number-change', onChange);

    el.stepDown();
    await el.updateComplete;
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps a value outside the range', async () => {
    const over = await mount({ value: 500, max: 9 });
    expect(over.clampedValue).toBe(9);

    const under = await mount({ value: -5, min: 1 });
    expect(under.clampedValue).toBe(1);
  });

  it('survives a max below its min', async () => {
    const el = await mount({ min: 5, max: 1, value: 5 });
    expect(el.clampedValue).toBe(5);
    expect(el.atMax).toBe(true);
  });

  it('survives a step that makes no sense', async () => {
    const el = await mount({ value: 1, step: 0 });
    el.stepUp();
    await el.updateComplete;
    expect(el.value).toBe(2);
  });

  it('follows what is typed, within the range', async () => {
    const el = await mount({ value: 1, max: 9 });
    const onInput = vi.fn();
    el.addEventListener('px-number-input', onInput);

    await type(el, '7');
    expect(el.value).toBe(7);
    expect(onInput).toHaveBeenCalledTimes(1);

    await type(el, '70');
    expect(el.value).toBe(9);
  });

  it('leaves a half-typed field alone', async () => {
    const el = await mount({ value: 4, min: 0 });

    // Clearing the field to type a new number must not snap it to the
    // minimum under the caret.
    await type(el, '');
    expect(el.value).toBe(4);
  });

  it('tidies the field up when the value is committed', async () => {
    const el = await mount({ value: 4, max: 9 });
    const onChange = vi.fn();
    el.addEventListener('px-number-change', onChange);

    const input = field(el);
    input.value = '';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;

    expect(input.value).toBe('4');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('forwards disabled to everything that can be pressed', async () => {
    const el = await mount({ value: 4, disabled: true });

    expect(field(el).disabled).toBe(true);
    expect(button(el, 'increment').disabled).toBe(true);
    expect(button(el, 'decrement').disabled).toBe(true);
  });

  it('draws its label but keeps it out of the accessibility tree', async () => {
    const el = await mount({ label: 'Potions' });
    const label = el.shadowRoot?.querySelector('[part="label"]');

    expect(label?.textContent).toBe('Potions');
    expect(label?.getAttribute('aria-hidden')).toBe('true');

    const hidden = await mount({ label: 'Potions', 'hide-label': true });
    expect(hidden.shadowRoot?.querySelector('[part="label"]')).toBeNull();
    expect(field(hidden).getAttribute('aria-label')).toBe('Potions');
  });

  it('finds the form it sits in', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({ name: 'quantity' }, form);

    expect(el.form).toBe(form);
  });
});
