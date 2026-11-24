import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/slider/px-slider.js';
import type { PxSlider } from '../src/components/slider/px-slider.js';
import { fakeGamepad, type FakeGamepad } from './fake-gamepad.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxSlider> {
  const el = document.createElement('px-slider');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function input(el: PxSlider): HTMLInputElement {
  const node = el.shadowRoot?.querySelector('input');
  if (!node) throw new Error('input not rendered');
  return node;
}

/** Drag the native control to `value`, as a pointer or an arrow key would. */
function drag(el: PxSlider, value: number, commit = false): void {
  const node = input(el);
  node.value = String(value);
  node.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  if (commit) node.dispatchEvent(new Event('change', { bubbles: true }));
}

let pad: FakeGamepad | undefined;

afterEach(() => {
  pad?.restore();
  pad = undefined;
  document.body.innerHTML = '';
});

describe('px-slider', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-slider')).toBeDefined();
  });

  it('is a real range input underneath', async () => {
    const el = await mount({ label: 'Music', min: 0, max: 10, step: 2, value: 6 });
    const node = input(el);

    expect(node.type).toBe('range');
    expect(node.getAttribute('min')).toBe('0');
    expect(node.getAttribute('max')).toBe('10');
    expect(node.getAttribute('step')).toBe('2');
    expect(node.value).toBe('6');
    expect(node.getAttribute('aria-label')).toBe('Music');
  });

  it('defaults to the middle of 0…100', async () => {
    const el = await mount();
    expect(el.value).toBe(50);
    expect(el.ratio).toBeCloseTo(0.5);
  });

  it('clamps a value outside the range', async () => {
    const high = await mount({ value: 400 });
    expect(high.clampedValue).toBe(100);
    expect(high.ratio).toBe(1);

    const low = await mount({ value: -20 });
    expect(low.clampedValue).toBe(0);
    expect(low.ratio).toBe(0);
  });

  it('works out the ratio from a range that does not start at zero', async () => {
    const el = await mount({ min: 10, max: 20, value: 12 });
    expect(el.ratio).toBeCloseTo(0.2);
  });

  it('survives a max that is not above the min', async () => {
    const el = await mount({ min: 5, max: 5, value: 5 });
    expect(Number.isFinite(el.ratio)).toBe(true);
    expect(el.clampedValue).toBe(5);
  });

  it('reports a drag as it happens and again when it is let go of', async () => {
    const el = await mount({ value: 20 });
    const onInput = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('px-slider-input', onInput);
    el.addEventListener('px-slider-change', onChange);

    drag(el, 70);
    await el.updateComplete;

    expect(el.value).toBe(70);
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onInput.mock.calls[0]?.[0].detail).toEqual({ value: 70 });
    expect(onChange).not.toHaveBeenCalled();

    drag(el, 70, true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({ value: 70 });
  });

  it('moves the fill and the handle with the value', async () => {
    const el = await mount({ value: 25 });
    const track = el.shadowRoot?.querySelector('[part="track"]');

    expect(track?.getAttribute('style')).toContain('--_ratio: 0.25');

    el.value = 75;
    await el.updateComplete;
    expect(track?.getAttribute('style')).toContain('--_ratio: 0.75');
  });

  it('shows the value with its unit only when asked', async () => {
    const el = await mount({ value: 80, unit: '%' });
    expect(el.shadowRoot?.querySelector('[part="value"]')).toBeNull();

    el.showValue = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="value"]')?.textContent?.trim()).toBe('80%');
  });

  it('spells the value out for a screen reader when it has a unit', async () => {
    const el = await mount({ value: 80, unit: '%' });
    expect(input(el).getAttribute('aria-valuetext')).toBe('80%');

    const plain = await mount({ value: 80 });
    expect(input(plain).hasAttribute('aria-valuetext')).toBe(false);
  });

  it('forwards disabled to the input', async () => {
    const el = await mount({ disabled: true });
    expect(input(el).disabled).toBe(true);

    el.disabled = false;
    await el.updateComplete;
    expect(input(el).disabled).toBe(false);
  });

  it('nudges one step per gamepad press while it has focus', async () => {
    pad = fakeGamepad();
    const el = await mount({ value: 50, step: 5 });
    const onInput = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('px-slider-input', onInput);
    el.addEventListener('px-slider-change', onChange);

    expect(pad.polling).toBe(false);
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(pad.polling).toBe(true);

    pad.press(15); // d-pad right
    pad.frame(0);
    await el.updateComplete;

    expect(el.value).toBe(55);
    // An arrow key on a range input both moves and commits; so does a nudge.
    expect(onInput).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    pad.release();
    pad.frame(16);
    pad.press(14); // d-pad left
    pad.frame(32);
    await el.updateComplete;
    expect(el.value).toBe(50);

    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(pad.polling).toBe(false);
  });

  it('will not be nudged past its range', async () => {
    pad = fakeGamepad();
    const el = await mount({ value: 100, step: 10 });
    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    pad.press(15);
    pad.frame(0);
    await el.updateComplete;

    expect(el.value).toBe(100);
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });

  it('takes no gamepad at all while disabled', async () => {
    pad = fakeGamepad();
    const el = await mount({ disabled: true });

    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(pad.polling).toBe(false);
  });

  it('lets go of the gamepad when it leaves the page', async () => {
    pad = fakeGamepad();
    const el = await mount();

    el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(pad.polling).toBe(true);

    el.remove();
    expect(pad.polling).toBe(false);
  });
});
