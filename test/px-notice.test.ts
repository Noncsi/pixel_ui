import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/notice/px-notice.js';
import type { PxNotice } from '../src/components/notice/px-notice.js';

async function mount(
  attrs: Record<string, string | number | boolean> = {},
  children = 'The connection to the server was lost.',
): Promise<PxNotice> {
  const el = document.createElement('px-notice');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.innerHTML = children;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function close(el: PxNotice): HTMLButtonElement | null {
  return el.shadowRoot?.querySelector('[part="close"]') ?? null;
}

function mark(el: PxNotice): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="mark"]') ?? null;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-notice', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-notice')).toBeDefined();
  });

  it('is not a live region unless asked', async () => {
    const el = await mount();

    // One that was on the page all along has nothing to announce: it is read
    // in order like any other text. Making it a live region says otherwise.
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-live')).toBe(false);
  });

  it('is a status when it should wait its turn', async () => {
    const el = await mount({ live: 'polite' });

    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('is an alert when it should interrupt', async () => {
    const el = await mount({ live: 'assertive', variant: 'danger' });

    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('gives the role back when it stops being live', async () => {
    const el = await mount({ live: 'assertive' });
    el.live = 'off';
    await el.updateComplete;

    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-live')).toBe(false);
  });

  it('leads with a glyph per variant, hidden from screen readers', async () => {
    const info = await mount();
    expect(mark(info)?.textContent?.trim()).toBe('i');
    expect(mark(info)?.getAttribute('aria-hidden')).toBe('true');

    const good = await mount({ variant: 'success' });
    expect(mark(good)?.textContent?.trim()).toBe('✓');

    const warn = await mount({ variant: 'warning' });
    expect(mark(warn)?.textContent?.trim()).toBe('!');

    const bad = await mount({ variant: 'danger' });
    expect(mark(bad)?.textContent?.trim()).toBe('×');
  });

  it('has the warning the toast has not', async () => {
    // A warning you need to keep looking at should not vanish after four
    // seconds, which is the whole reason it lives here and not there.
    const el = await mount({ variant: 'warning' });
    expect(el.getAttribute('variant')).toBe('warning');
  });

  it('drops the glyph on request', async () => {
    const el = await mount({ 'no-mark': true });
    expect(mark(el)).toBeNull();
  });

  it('has no dismiss button until it is dismissible', async () => {
    const plain = await mount();
    expect(close(plain)).toBeNull();

    const closable = await mount({ dismissible: true });
    expect(close(closable)?.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('closes on the button and says so once', async () => {
    const el = await mount({ dismissible: true });
    let fired = 0;
    el.addEventListener('px-notice-dismiss', () => (fired += 1));

    close(el)?.click();
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(fired).toBe(1);

    // Already closed: nothing left to report.
    el.dismiss();
    expect(fired).toBe(1);
  });

  it('empties itself out when closed, and fills back in', async () => {
    const el = await mount({ dismissible: true });
    el.dismiss();
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('[part="base"]')).toBeNull();

    el.show();
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="base"]')).not.toBeNull();
  });

  it('shows a heading above the message when given one', async () => {
    const el = await mount({ heading: 'No connection' });
    expect(el.shadowRoot?.querySelector('[part="heading"]')?.textContent?.trim()).toBe(
      'No connection',
    );
  });
});
