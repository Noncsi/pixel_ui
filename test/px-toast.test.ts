import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/toast/px-toast.js';
import '../src/components/toast/px-toast-stack.js';
import type { PxToast } from '../src/components/toast/px-toast.js';
import type { PxToastStack } from '../src/components/toast/px-toast-stack.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  message = 'Game saved',
): Promise<PxToast> {
  const el = document.createElement('px-toast');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = message;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

async function mountStack(attrs: Record<string, string | number> = {}): Promise<PxToastStack> {
  const el = document.createElement('px-toast-stack');
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function closeButton(el: PxToast): HTMLButtonElement | null {
  return el.shadowRoot?.querySelector('[part="close"]') ?? null;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('px-toast', () => {
  it('registers both custom elements', () => {
    expect(customElements.get('px-toast')).toBeDefined();
    expect(customElements.get('px-toast-stack')).toBeDefined();
  });

  it('starts closed and polite', async () => {
    const el = await mount();
    expect(el.open).toBe(false);
    expect(el.getAttribute('role')).toBe('status');
  });

  it('interrupts when it is a danger toast', async () => {
    const el = await mount({ variant: 'danger' });
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('changes its urgency with its variant', async () => {
    const el = await mount();
    el.variant = 'danger';
    await el.updateComplete;
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('shows and hides, and says so', async () => {
    const el = await mount();
    const onShow = vi.fn();
    const onHide = vi.fn();
    el.addEventListener('px-toast-show', onShow);
    el.addEventListener('px-toast-hide', onHide);

    el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(onShow).toHaveBeenCalledTimes(1);

    el.hide();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('takes itself off screen when the time is up', async () => {
    const el = await mount({ duration: 2000 });
    el.show();
    await el.updateComplete;

    vi.advanceTimersByTime(1999);
    expect(el.open).toBe(true);

    vi.advanceTimersByTime(1);
    expect(el.open).toBe(false);
  });

  it('stays put when the duration is zero', async () => {
    const el = await mount({ duration: 0 });
    el.show();
    await el.updateComplete;

    vi.advanceTimersByTime(60_000);
    expect(el.open).toBe(true);
  });

  it('holds still while the pointer is on it', async () => {
    const el = await mount({ duration: 2000 });
    el.show();
    await el.updateComplete;

    vi.advanceTimersByTime(1000);
    el.dispatchEvent(new Event('pointerenter'));

    // A full duration goes by with the pointer on it, and nothing happens.
    vi.advanceTimersByTime(5000);
    expect(el.open).toBe(true);

    el.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(999);
    expect(el.open).toBe(true);

    vi.advanceTimersByTime(1);
    expect(el.open).toBe(false);
  });

  it('holds still while the keyboard is in it', async () => {
    const el = await mount({ duration: 2000 });
    el.show();
    await el.updateComplete;

    el.dispatchEvent(new Event('focusin', { bubbles: true }));
    vi.advanceTimersByTime(5000);
    expect(el.open).toBe(true);
  });

  it('starts the clock again each time it is shown', async () => {
    const el = await mount({ duration: 1000 });

    el.show();
    await el.updateComplete;
    vi.advanceTimersByTime(1000);
    expect(el.open).toBe(false);

    el.show();
    await el.updateComplete;
    vi.advanceTimersByTime(999);
    expect(el.open).toBe(true);
  });

  it('is dismissed by its button', async () => {
    const el = await mount({ duration: 0 });
    el.show();
    await el.updateComplete;

    const button = closeButton(el);
    expect(button?.getAttribute('aria-label')).toBe('Dismiss');

    button?.click();
    await el.updateComplete;
    expect(el.open).toBe(false);
  });

  it('drops the button when told to', async () => {
    const el = await mount({ 'no-close': true });
    el.show();
    await el.updateComplete;
    expect(closeButton(el)).toBeNull();
  });

  it('only draws the draining bar while it is open', async () => {
    const el = await mount({ duration: 3000 });
    expect(el.shadowRoot?.querySelector('[part="timer"]')).toBeNull();

    el.show();
    await el.updateComplete;
    const timer = el.shadowRoot?.querySelector('[part="timer"]');
    expect(timer?.getAttribute('style')).toContain('3000ms');
  });

  it('stops its clock when it leaves the page', async () => {
    const el = await mount({ duration: 1000 });
    el.show();
    await el.updateComplete;

    el.remove();
    vi.advanceTimersByTime(2000);

    // The timer was dropped on disconnect, so nothing hid it behind our back.
    expect(el.open).toBe(true);
    expect(el.isConnected).toBe(false);
  });
});

describe('px-toast-stack', () => {
  it('creates, shows and clears up a toast', async () => {
    const stack = await mountStack();
    const toast = stack.toast('Item acquired!');
    await toast.updateComplete;

    expect(toast.textContent).toBe('Item acquired!');
    expect(toast.open).toBe(true);
    expect(stack.toasts).toHaveLength(1);

    vi.advanceTimersByTime(4000);
    expect(stack.toasts).toHaveLength(0);
    expect(toast.isConnected).toBe(false);
  });

  it('passes the options through', async () => {
    const stack = await mountStack();
    const toast = stack.toast('You died', { variant: 'danger', duration: 0, noClose: true });
    await toast.updateComplete;

    expect(toast.variant).toBe('danger');
    expect(toast.getAttribute('role')).toBe('alert');
    expect(toast.duration).toBe(0);
    expect(toast.noClose).toBe(true);
  });

  it('takes a dismissed toast out of the DOM', async () => {
    const stack = await mountStack();
    const toast = stack.toast('Game saved', { duration: 0 });
    await toast.updateComplete;

    toast.hide();
    expect(stack.toasts).toHaveLength(0);
  });

  it('lets the oldest go once there are too many', async () => {
    const stack = await mountStack({ max: 2 });
    stack.toast('One', { duration: 0 });
    stack.toast('Two', { duration: 0 });
    stack.toast('Three', { duration: 0 });

    expect(stack.toasts.map((t) => t.textContent)).toEqual(['Two', 'Three']);
  });

  it('keeps every toast when max is zero', async () => {
    const stack = await mountStack({ max: 0 });
    for (let i = 0; i < 8; i += 1) stack.toast(`Message ${i}`, { duration: 0 });

    expect(stack.toasts).toHaveLength(8);
  });

  it('clears the lot', async () => {
    const stack = await mountStack();
    stack.toast('One', { duration: 0 });
    stack.toast('Two', { duration: 0 });

    stack.clear();
    expect(stack.toasts).toHaveLength(0);
  });

  it('sits bottom right unless told otherwise', async () => {
    const stack = await mountStack();
    expect(stack.getAttribute('placement')).toBe('bottom-right');
  });
});
