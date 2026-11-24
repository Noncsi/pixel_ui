import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/keycap/px-keycap.js';
import type { PxKeycap } from '../src/components/keycap/px-keycap.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  text = 'W',
): Promise<PxKeycap> {
  const el = document.createElement('px-keycap');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = text;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-keycap', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-keycap')).toBeDefined();
  });

  it('marks the legend up as keyboard input', async () => {
    const el = await mount();
    const base = el.shadowRoot?.querySelector('[part="base"]');

    expect(base?.tagName).toBe('KBD');
    expect(el.textContent).toBe('W');
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
  });

  it('is a keyboard key unless told otherwise', async () => {
    const el = await mount();
    expect(el.device).toBe('keyboard');
    expect(el.getAttribute('device')).toBe('keyboard');
  });

  it('can be a controller button instead', async () => {
    const el = await mount({ device: 'gamepad' }, 'A');
    expect(el.device).toBe('gamepad');
    expect(el.getAttribute('device')).toBe('gamepad');
  });

  it('spells the key out when the legend would not do', async () => {
    const el = await mount({ label: 'Space bar' }, '␣');
    expect(el.getAttribute('aria-label')).toBe('Space bar');
  });

  it('leaves the legend to speak for itself without a label', async () => {
    const el = await mount();
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('gives the name up again when the label goes', async () => {
    const el = await mount({ label: 'Space bar' }, '␣');
    el.label = '';
    await el.updateComplete;
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('reflects pressed, so a game can show a key being held', async () => {
    const el = await mount();
    expect(el.hasAttribute('pressed')).toBe(false);

    el.pressed = true;
    await el.updateComplete;
    expect(el.hasAttribute('pressed')).toBe(true);
  });

  it('takes a larger size', async () => {
    const el = await mount({ size: 'md' });
    expect(el.getAttribute('size')).toBe('md');
  });

  it('watches no gamepad of its own', async () => {
    // It is presentational on purpose: an element that subscribed would keep
    // the polling loop running for the whole page.
    const el = await mount({ device: 'gamepad' }, 'A');
    expect(el.pressed).toBe(false);
  });
});
