import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/components/dialogue-box/px-dialogue-box.js';
import type { PxDialogueBox } from '../src/components/dialogue-box/px-dialogue-box.js';

const LINE = 'It is dangerous to go alone.';

async function mount(attrs: Record<string, string | number> = {}): Promise<PxDialogueBox> {
  const el = document.createElement('px-dialogue-box');
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  document.body.append(el);
  await el.updateComplete;
  return el;
}

/** The text the reader can actually see. */
function visible(el: PxDialogueBox): string {
  return el.shadowRoot?.querySelector('.typed')?.textContent ?? '';
}

/** Lets the typewriter run for `ms`, then waits for the render it caused. */
async function tick(el: PxDialogueBox, ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms);
  await el.updateComplete;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('px-dialogue-box', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-dialogue-box')).toBeDefined();
  });

  it('types the line out over time', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });

    expect(visible(el)).toBe('');
    expect(el.typing).toBe(true);

    await tick(el, 50);
    expect(visible(el)).toBe('It is');

    await tick(el, 50);
    expect(visible(el)).toBe('It is dang');
    expect(el.done).toBe(false);
  });

  it('holds the whole line in the DOM from the start, so nothing reflows', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });
    await tick(el, 50);

    const rest = el.shadowRoot?.querySelector('.rest')?.textContent ?? '';
    expect(visible(el) + rest).toBe(LINE);
  });

  it('pauses longer after a sentence ends', async () => {
    const el = await mount({ text: 'Oh. No', speed: 100, 'punctuation-pause': 500 });

    await tick(el, 30);
    expect(visible(el)).toBe('Oh.');

    // Without the pause the next character would already be here.
    await tick(el, 100);
    expect(visible(el)).toBe('Oh.');

    // The space lands at 10ms + the 500ms pause, and the rest follows at the
    // ordinary rate.
    await tick(el, 415);
    expect(visible(el)).toBe('Oh. ');

    await tick(el, 100);
    expect(visible(el)).toBe('Oh. No');
  });

  it('announces the finished line to assistive technology, not every keystroke', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0, speaker: 'Old man' });
    const live = () => el.shadowRoot?.querySelector('[aria-live]')?.textContent?.trim() ?? '';

    await tick(el, 50);
    expect(live()).toBe('');
    expect(el.shadowRoot?.querySelector('.line')?.getAttribute('aria-hidden')).toBe('true');

    el.skip();
    await el.updateComplete;
    expect(live()).toBe(`Old man: ${LINE}`);
  });

  it('reports the start and the end of a line', async () => {
    const el = await mount({ speed: 100, 'punctuation-pause': 0 });
    const onStart = vi.fn();
    const onEnd = vi.fn();
    el.addEventListener('px-typing-start', onStart);
    el.addEventListener('px-typing-end', onEnd);

    el.text = LINE;
    await el.updateComplete;
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0]?.[0].detail).toEqual({ text: LINE, skipped: false });
    expect(onEnd).not.toHaveBeenCalled();

    await tick(el, 1000);
    expect(el.done).toBe(true);
    expect(el.typing).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0]?.[0].detail).toEqual({ text: LINE, skipped: false });
  });

  it('shows the rest at once when skipped', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });
    const onEnd = vi.fn();
    el.addEventListener('px-typing-end', onEnd);

    await tick(el, 50);
    el.skip();
    await el.updateComplete;

    expect(visible(el)).toBe(LINE);
    expect(el.done).toBe(true);
    expect(el.typing).toBe(false);
    expect(onEnd.mock.calls[0]?.[0].detail).toEqual({ text: LINE, skipped: true });

    // The timer is gone: nothing types on past the end.
    await tick(el, 1000);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('starts over when the line changes', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });
    await tick(el, 1000);
    expect(el.done).toBe(true);

    el.text = 'Take this.';
    await el.updateComplete;
    expect(visible(el)).toBe('');
    expect(el.typing).toBe(true);

    await tick(el, 1000);
    expect(visible(el)).toBe('Take this.');
  });

  it('skips on the first click and asks for the next line on the second', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });
    const onAdvance = vi.fn();
    el.addEventListener('px-dialogue-advance', onAdvance);
    const box = el.shadowRoot?.querySelector<HTMLElement>('.base');

    await tick(el, 50);
    box?.click();
    await el.updateComplete;
    expect(el.done).toBe(true);
    expect(onAdvance).not.toHaveBeenCalled();

    box?.click();
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('offers a continue button once the line is done', async () => {
    const el = await mount({ text: LINE, speed: 100, 'punctuation-pause': 0 });
    const advance = () => el.shadowRoot?.querySelector<HTMLButtonElement>('[part="advance"]');
    const onAdvance = vi.fn();
    el.addEventListener('px-dialogue-advance', onAdvance);

    expect(advance()).toBeNull();

    await tick(el, 1000);
    expect(advance()?.getAttribute('aria-label')).toBe('Continue');

    advance()?.click();
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('leaves the choices to the choice buttons', async () => {
    const el = await mount({ text: 'Well?', speed: 100, 'punctuation-pause': 0 });
    const choice = document.createElement('button');
    choice.slot = 'choices';
    el.append(choice);
    await tick(el, 1000);

    const onAdvance = vi.fn();
    el.addEventListener('px-dialogue-advance', onAdvance);

    choice.click();
    expect(onAdvance).not.toHaveBeenCalled();
    expect(el.shadowRoot?.querySelector('[part="advance"]')).toBeNull();
  });

  it('shows the line whole when motion is not wanted', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    const el = await mount({ text: LINE, speed: 1 });

    expect(visible(el)).toBe(LINE);
    expect(el.typing).toBe(false);
    expect(el.done).toBe(true);
  });
});
