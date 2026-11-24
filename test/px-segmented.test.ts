import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/segmented/px-segmented.js';
import '../src/components/segmented/px-segment.js';
import type { PxSegmented } from '../src/components/segmented/px-segmented.js';

interface SegmentSpec {
  label: string;
  value?: string;
  disabled?: boolean;
}

const CHOICES: SegmentSpec[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Normal', value: 'normal' },
  { label: 'Hard', value: 'hard' },
];

async function settle(el: PxSegmented): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

async function mount(
  choices: SegmentSpec[] = CHOICES,
  attrs: Record<string, string | number | boolean> = {},
): Promise<PxSegmented> {
  const el = document.createElement('px-segmented');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  for (const choice of choices) {
    const segment = document.createElement('px-segment');
    segment.textContent = choice.label;
    if (choice.value) segment.setAttribute('value', choice.value);
    if (choice.disabled) segment.setAttribute('disabled', '');
    el.append(segment);
  }

  document.body.append(el);
  await settle(el);
  return el;
}

function press(el: PxSegmented, key: string): void {
  const from = el.selectedSegment ?? el.segments[0];
  from?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-segmented', () => {
  it('registers both custom elements', () => {
    expect(customElements.get('px-segmented')).toBeDefined();
    expect(customElements.get('px-segment')).toBeDefined();
  });

  it('is a radio group of radios', async () => {
    const el = await mount(CHOICES, { label: 'Difficulty' });

    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('aria-label')).toBe('Difficulty');
    expect(el.segments[0]?.getAttribute('role')).toBe('radio');
  });

  it('takes the first choice when it is given no value', async () => {
    const el = await mount();

    expect(el.value).toBe('easy');
    expect(el.selectedSegment?.label).toBe('Easy');
    expect(el.segments.map((s) => s.selected)).toEqual([true, false, false]);
    expect(el.segments[0]?.getAttribute('aria-checked')).toBe('true');
  });

  it('keeps the value it was given', async () => {
    const el = await mount(CHOICES, { value: 'hard' });
    expect(el.selectedSegment?.label).toBe('Hard');
  });

  it('leaves one tab stop for the whole group', async () => {
    const el = await mount();
    expect(el.segments.map((s) => s.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    el.select('normal');
    await el.updateComplete;
    expect(el.segments.map((s) => s.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('moves and chooses together, the way a radio group does', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-segmented-change', onChange);

    press(el, 'ArrowRight');
    await el.updateComplete;

    expect(el.value).toBe('normal');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toEqual({
      value: 'normal',
      label: 'Normal',
      index: 1,
    });

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('takes up and down as well as left and right', async () => {
    const el = await mount();

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.value).toBe('normal');

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('wraps around at the ends', async () => {
    const el = await mount();

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.value).toBe('hard');

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('steps over a disabled segment', async () => {
    const el = await mount([
      { label: 'Easy', value: 'easy' },
      { label: 'Normal', value: 'normal', disabled: true },
      { label: 'Hard', value: 'hard' },
    ]);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.value).toBe('hard');
  });

  it('starts on the first segment that is not disabled', async () => {
    const el = await mount([
      { label: 'Easy', value: 'easy', disabled: true },
      { label: 'Normal', value: 'normal' },
    ]);

    expect(el.value).toBe('normal');
  });

  it('chooses a clicked segment', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-segmented-change', onChange);

    el.segments[2]?.click();
    await el.updateComplete;

    expect(el.value).toBe('hard');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('says nothing when the same segment is chosen again', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-segmented-change', onChange);

    el.segments[0]?.click();
    await el.updateComplete;
    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores a click on a disabled segment', async () => {
    const el = await mount([
      { label: 'Easy', value: 'easy' },
      { label: 'Normal', value: 'normal', disabled: true },
    ]);

    el.segments[1]?.click();
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('does nothing at all while the group is disabled', async () => {
    const el = await mount(CHOICES, { disabled: true });

    el.segments[2]?.click();
    press(el, 'ArrowRight');
    await el.updateComplete;

    expect(el.value).toBe('easy');
  });

  it('refuses a value that is not there', async () => {
    const el = await mount();
    el.select('nightmare');
    await el.updateComplete;
    expect(el.value).toBe('easy');
  });

  it('falls back to a segment text when it has no value', async () => {
    const el = await mount([{ label: 'On' }, { label: 'Off' }]);

    expect(el.value).toBe('On');
    expect(el.segments[0]?.resolvedValue).toBe('On');

    el.segments[1]?.click();
    await el.updateComplete;
    expect(el.value).toBe('Off');
  });

  it('leaves keys it does not handle alone', async () => {
    const el = await mount();
    const segment = el.segments[0];

    const handled = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    segment?.dispatchEvent(handled);
    expect(handled.defaultPrevented).toBe(true);

    const ignored = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    segment?.dispatchEvent(ignored);
    expect(ignored.defaultPrevented).toBe(false);
  });
});
