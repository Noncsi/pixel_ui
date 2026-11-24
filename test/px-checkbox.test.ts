import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/checkbox/px-checkbox.js';
import type {
  CheckboxChangeEventDetail,
  PxCheckbox,
} from '../src/components/checkbox/px-checkbox.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  children = '',
): Promise<PxCheckbox> {
  const el = document.createElement('px-checkbox');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  if (children) el.innerHTML = children;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function button(el: PxCheckbox): HTMLButtonElement {
  const found = el.shadowRoot?.querySelector('button');
  if (!found) throw new Error('no button');
  return found as HTMLButtonElement;
}

function hint(el: PxCheckbox): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="hint"]') ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('px-checkbox', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-checkbox')).toBeDefined();
  });

  it('is a checkbox, named by its label', async () => {
    const el = await mount({ label: 'Hard mode' });

    expect(button(el).getAttribute('role')).toBe('checkbox');
    expect(button(el).getAttribute('aria-checked')).toBe('false');
    expect(button(el).getAttribute('aria-label')).toBe('Hard mode');
  });

  it('ticks and clears on a click', async () => {
    const el = await mount({ label: 'Hard mode' });

    button(el).click();
    await el.updateComplete;
    expect(el.checked).toBe(true);
    expect(button(el).getAttribute('aria-checked')).toBe('true');

    button(el).click();
    await el.updateComplete;
    expect(el.checked).toBe(false);
  });

  it('reports the change, and says the state is settled', async () => {
    const el = await mount({ indeterminate: true });
    const seen: CheckboxChangeEventDetail[] = [];
    el.addEventListener('px-checkbox-change', (event) => seen.push(event.detail));

    button(el).click();
    await el.updateComplete;

    expect(seen).toEqual([{ checked: true, indeterminate: false }]);
  });

  it('says mixed while indeterminate, whatever checked is', async () => {
    const el = await mount({ indeterminate: true });
    expect(el.state).toBe('mixed');
    expect(button(el).getAttribute('aria-checked')).toBe('mixed');

    el.checked = true;
    await el.updateComplete;
    // Still mixed: a half-ticked list does not stop being half-ticked because
    // the box underneath happens to be set.
    expect(button(el).getAttribute('aria-checked')).toBe('mixed');
  });

  it('leaves indeterminate by ticking, the way the platform does', async () => {
    const el = await mount({ indeterminate: true });

    button(el).click();
    await el.updateComplete;

    expect(el.indeterminate).toBe(false);
    expect(el.checked).toBe(true);
  });

  it('draws a tick only when it is settled and ticked', async () => {
    const el = await mount({ checked: true, indeterminate: true });
    expect(el.matches('[checked]:not([indeterminate])')).toBe(false);

    el.indeterminate = false;
    await el.updateComplete;
    expect(el.matches('[checked]:not([indeterminate])')).toBe(true);
  });

  it('flips with toggle(), and takes a value when given one', async () => {
    const el = await mount();

    el.toggle();
    expect(el.checked).toBe(true);
    el.toggle();
    expect(el.checked).toBe(false);

    el.toggle(true);
    el.toggle(true);
    expect(el.checked).toBe(true);
  });

  it('ignores clicks while disabled', async () => {
    const el = await mount({ disabled: true });
    let fired = 0;
    el.addEventListener('px-checkbox-change', () => (fired += 1));

    button(el).click();
    await el.updateComplete;

    expect(el.checked).toBe(false);
    expect(fired).toBe(0);
  });

  it('finds the form it is in without element internals', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const el = document.createElement('px-checkbox');
    form.append(el);
    await el.updateComplete;

    expect(el.form).toBe(form);
  });

  it('passes required on to assistive technology', async () => {
    const el = await mount({ required: true });
    expect(button(el).getAttribute('aria-required')).toBe('true');
  });

  it('keeps the hint out of the way until there is one', async () => {
    const bare = await mount({ label: 'Hard mode' });
    expect(hint(bare)?.hasAttribute('hidden')).toBe(true);

    const described = await mount(
      { label: 'Hard mode' },
      '<span slot="hint">No saves, one life.</span>',
    );
    expect(hint(described)?.hasAttribute('hidden')).toBe(false);
  });

  it('describes itself with the hint rather than hiding it', async () => {
    const el = await mount({ label: 'Hard mode' }, '<span slot="hint">No saves.</span>');

    // The label is already the name, so the drawn copy is hidden; the hint is
    // the part that is not said anywhere else, so it is pointed at instead.
    expect(el.shadowRoot?.querySelector('[part="label"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(button(el).getAttribute('aria-describedby')).toBe(hint(el)?.id);
    expect(hint(el)?.hasAttribute('aria-hidden')).toBe(false);
  });
});
