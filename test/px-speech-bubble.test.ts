import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/speech-bubble/px-speech-bubble.js';
import type { PxSpeechBubble } from '../src/components/speech-bubble/px-speech-bubble.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  text = 'It is dangerous to go alone!',
): Promise<PxSpeechBubble> {
  const el = document.createElement('px-speech-bubble');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = text;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function tail(el: PxSpeechBubble): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="tail"]') ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-speech-bubble', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-speech-bubble')).toBeDefined();
  });

  it('points downwards from the middle unless told otherwise', async () => {
    const el = await mount();

    expect(el.getAttribute('placement')).toBe('bottom');
    expect(el.getAttribute('align')).toBe('center');
  });

  it('keeps what is said in the light DOM', async () => {
    const el = await mount();

    expect(el.textContent).toBe('It is dangerous to go alone!');
    expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
  });

  it('has a tail, which is decoration', async () => {
    const el = await mount();

    expect(tail(el)).not.toBeNull();
    // The tail is a shape, not something to read out.
    expect(tail(el)?.getAttribute('aria-hidden')).toBe('true');
  });

  it('drops the tail when it is asked to', async () => {
    const el = await mount({ 'no-tail': true });
    expect(tail(el)).toBeNull();
    expect(el.hasAttribute('no-tail')).toBe(true);
  });

  it('takes a tail on any of the four sides', async () => {
    for (const placement of ['top', 'bottom', 'left', 'right'] as const) {
      const el = await mount({ placement });
      expect(el.getAttribute('placement')).toBe(placement);
      expect(tail(el)).not.toBeNull();
    }
  });

  it('takes a tail anywhere along that side', async () => {
    for (const align of ['start', 'center', 'end'] as const) {
      const el = await mount({ align });
      expect(el.getAttribute('align')).toBe(align);
    }
  });

  it('shows no name unless there is one', async () => {
    const el = await mount();
    expect(el.shadowRoot?.querySelector('[part="speaker"]')).toBeNull();
  });

  it('shows who is talking when it is told', async () => {
    const el = await mount({ speaker: 'Old man' });
    expect(el.shadowRoot?.querySelector('[part="speaker"]')?.textContent).toBe('Old man');
  });

  it('types nothing and asks for nothing', async () => {
    const el = await mount();

    // This is the other kind of dialogue: no typing, no portrait, no advance
    // arrow. Those belong to <px-dialogue-box>.
    expect(el.shadowRoot?.querySelector('[part="advance"]')).toBeNull();
    expect(el.shadowRoot?.querySelector('slot[name="portrait"]')).toBeNull();
  });
});
