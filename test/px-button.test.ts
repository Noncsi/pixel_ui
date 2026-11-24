import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/button/px-button.js';
import type { PxButton } from '../src/components/button/px-button.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  label = 'Start',
  parent: ParentNode = document.body,
): Promise<PxButton> {
  const el = document.createElement('px-button');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = label;
  parent.append(el);
  await el.updateComplete;
  return el;
}

function inner(el: PxButton): HTMLButtonElement {
  const node = el.shadowRoot?.querySelector('button');
  if (!node) throw new Error('button not rendered');
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-button', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-button')).toBeDefined();
  });

  it('wraps a real button and keeps the label in the light DOM', async () => {
    const el = await mount();
    expect(inner(el).getAttribute('type')).toBe('button');
    expect(el.textContent).toBe('Start');
    expect(el.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('slot[name="icon"]')).not.toBeNull();
  });

  it('starts as a plain button, not a toggle', async () => {
    const el = await mount();
    expect(inner(el).hasAttribute('aria-pressed')).toBe(false);
  });

  it('forwards disabled to the inner button', async () => {
    const el = await mount({ disabled: true });
    expect(inner(el).disabled).toBe(true);

    el.disabled = false;
    await el.updateComplete;
    expect(inner(el).disabled).toBe(false);
  });

  it('flips a toggle button and reports it', async () => {
    const el = await mount({ toggle: true });
    const onToggle = vi.fn();
    el.addEventListener('px-toggle', onToggle);

    expect(inner(el).getAttribute('aria-pressed')).toBe('false');

    inner(el).click();
    await el.updateComplete;
    expect(el.pressed).toBe(true);
    expect(el.hasAttribute('pressed')).toBe(true);
    expect(inner(el).getAttribute('aria-pressed')).toBe('true');
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0]?.[0].detail).toEqual({ pressed: true });

    inner(el).click();
    await el.updateComplete;
    expect(el.pressed).toBe(false);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('ignores clicks while disabled', async () => {
    const el = await mount({ toggle: true, disabled: true });
    const onToggle = vi.fn();
    el.addEventListener('px-toggle', onToggle);

    inner(el).click();
    await el.updateComplete;

    expect(el.pressed).toBe(false);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('submits the form it sits in', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({ type: 'submit' }, 'Save', form);
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;

    expect(el.form).toBe(form);
    inner(el).click();
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it('resets the form it sits in', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({ type: 'reset' }, 'Cancel', form);
    const reset = vi.fn();
    form.reset = reset;

    inner(el).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('leaves forms alone unless asked', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({}, 'Jump', form);
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;

    inner(el).click();
    expect(requestSubmit).not.toHaveBeenCalled();
    expect(el.form).toBe(form);
  });

  it('has no form outside one', async () => {
    const el = await mount();
    expect(el.form).toBeNull();
  });

  it('lets a click bubble out of the shadow root', async () => {
    const el = await mount();
    const onClick = vi.fn();
    el.addEventListener('click', onClick);

    inner(el).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
