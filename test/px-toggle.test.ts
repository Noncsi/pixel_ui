import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/toggle/px-toggle.js';
import type { PxToggle } from '../src/components/toggle/px-toggle.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  parent: ParentNode = document.body,
): Promise<PxToggle> {
  const el = document.createElement('px-toggle');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  parent.append(el);
  await el.updateComplete;
  return el;
}

function inner(el: PxToggle): HTMLButtonElement {
  const node = el.shadowRoot?.querySelector('button');
  if (!node) throw new Error('button not rendered');
  return node;
}

function state(el: PxToggle): string {
  return el.shadowRoot?.querySelector('[part="state"]')?.textContent?.trim() ?? '';
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-toggle', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-toggle')).toBeDefined();
  });

  it('is a real button reported as a switch', async () => {
    const el = await mount({ label: 'Sound' });
    expect(inner(el).getAttribute('type')).toBe('button');
    expect(inner(el).getAttribute('role')).toBe('switch');
    expect(inner(el).getAttribute('aria-checked')).toBe('false');
    expect(inner(el).getAttribute('aria-label')).toBe('Sound');
  });

  it('starts off', async () => {
    const el = await mount();
    expect(el.checked).toBe(false);
    expect(state(el)).toBe('off');
  });

  it('switches on and off, and says so', async () => {
    const el = await mount({ label: 'Sound' });
    const onChange = vi.fn();
    el.addEventListener('px-toggle-change', onChange);

    inner(el).click();
    await el.updateComplete;

    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);
    expect(inner(el).getAttribute('aria-checked')).toBe('true');
    expect(state(el)).toBe('on');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({ checked: true });

    inner(el).click();
    await el.updateComplete;

    expect(el.checked).toBe(false);
    expect(state(el)).toBe('off');
    expect(onChange.mock.calls[1]?.[0].detail).toEqual({ checked: false });
  });

  it('starts on when it is told to', async () => {
    const el = await mount({ checked: true });
    expect(el.checked).toBe(true);
    expect(state(el)).toBe('on');
  });

  it('ignores clicks while disabled', async () => {
    const el = await mount({ disabled: true });
    const onChange = vi.fn();
    el.addEventListener('px-toggle-change', onChange);

    inner(el).click();
    await el.updateComplete;

    expect(el.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards disabled to the inner button', async () => {
    const el = await mount({ disabled: true });
    expect(inner(el).disabled).toBe(true);

    el.disabled = false;
    await el.updateComplete;
    expect(inner(el).disabled).toBe(false);
  });

  it('draws the label but keeps it out of the accessibility tree twice over', async () => {
    const el = await mount({ label: 'Sound' });
    const label = el.shadowRoot?.querySelector('[part="label"]');

    expect(label?.textContent).toBe('Sound');
    // The button's aria-label is the name; the drawn copy must not be read too.
    expect(label?.getAttribute('aria-hidden')).toBe('true');
    expect(el.shadowRoot?.querySelector('[part="state"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('finds the form it sits in', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = await mount({ name: 'sound' }, form);

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
