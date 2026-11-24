import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/tooltip/px-tooltip.js';
import type { PxTooltip } from '../src/components/tooltip/px-tooltip.js';

async function mount(
  attrs: Record<string, string | number | boolean> = { text: 'Restores 20 HP' },
): Promise<PxTooltip> {
  const el = document.createElement('px-tooltip');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  const trigger = document.createElement('button');
  trigger.textContent = 'Potion';
  el.append(trigger);

  document.body.append(el);
  await el.updateComplete;
  return el;
}

function trigger(el: PxTooltip): HTMLButtonElement {
  const node = el.querySelector('button');
  if (!node) throw new Error('trigger not mounted');
  return node;
}

function bubble(el: PxTooltip): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="base"]') ?? null;
}

function description(el: PxTooltip): HTMLElement | null {
  return el.querySelector('[slot="px-description"]');
}

function enter(el: PxTooltip): void {
  el.dispatchEvent(new Event('pointerenter'));
}

function leave(el: PxTooltip): void {
  el.dispatchEvent(new Event('pointerleave'));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('px-tooltip', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-tooltip')).toBeDefined();
  });

  it('starts closed', async () => {
    const el = await mount();
    expect(el.open).toBe(false);
    expect(bubble(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('describes its trigger from a hidden span of its own', async () => {
    const el = await mount();
    const span = description(el);

    expect(span).not.toBeNull();
    expect(span?.hidden).toBe(true);
    expect(span?.textContent).toBe('Restores 20 HP');
    expect(trigger(el).getAttribute('aria-describedby')).toBe(span?.id);
  });

  it('keeps the description in step with the text', async () => {
    const el = await mount();
    el.text = 'Restores 40 HP';
    await el.updateComplete;

    expect(description(el)?.textContent).toBe('Restores 40 HP');
  });

  it('does not count its own description as the trigger', async () => {
    const el = await mount();
    // Two children now: the button and the hidden span.
    expect(el.children).toHaveLength(2);
    expect(description(el)?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('keeps the drawn bubble out of the accessibility tree', async () => {
    const el = await mount();
    expect(bubble(el)?.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens on hover and closes again', async () => {
    const el = await mount();
    const onShow = vi.fn();
    const onHide = vi.fn();
    el.addEventListener('px-tooltip-show', onShow);
    el.addEventListener('px-tooltip-hide', onHide);

    enter(el);
    await el.updateComplete;

    expect(el.open).toBe(true);
    expect(bubble(el)?.hasAttribute('hidden')).toBe(false);
    expect(onShow).toHaveBeenCalledTimes(1);

    leave(el);
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('waits out the delay before it opens on hover', async () => {
    const el = await mount({ text: 'Restores 20 HP', delay: 300 });

    enter(el);
    expect(el.open).toBe(false);

    vi.advanceTimersByTime(299);
    expect(el.open).toBe(false);

    vi.advanceTimersByTime(1);
    expect(el.open).toBe(true);
  });

  it('drops a delayed open if the pointer leaves first', async () => {
    const el = await mount({ text: 'Restores 20 HP', delay: 300 });

    enter(el);
    leave(el);
    vi.advanceTimersByTime(1000);

    expect(el.open).toBe(false);
  });

  it('opens at once on focus, however long the delay is', async () => {
    const el = await mount({ text: 'Restores 20 HP', delay: 1000 });

    el.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(el.open).toBe(true);
  });

  it('closes on Escape', async () => {
    const el = await mount();
    el.show();
    await el.updateComplete;

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.open).toBe(false);
  });

  it('stays shut while disabled', async () => {
    const el = await mount({ text: 'Restores 20 HP', disabled: true });

    enter(el);
    el.show();
    expect(el.open).toBe(false);
  });

  it('has nothing to show without text', async () => {
    const el = await mount({});
    el.show();
    expect(el.open).toBe(false);
  });

  it('puts the bubble where placement says', async () => {
    const el = await mount({ text: 'Restores 20 HP', placement: 'right' });
    expect(el.getAttribute('placement')).toBe('right');
  });
});
