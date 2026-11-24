import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/dialog/px-dialog.js';
import type { PxDialog } from '../src/components/dialog/px-dialog.js';

async function mount(
  attrs: Record<string, string | number | boolean> = { label: 'Save game?' },
  body = 'Overwrite slot 1?',
  footer = true,
): Promise<PxDialog> {
  const el = document.createElement('px-dialog');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  el.textContent = body;

  if (footer) {
    const button = document.createElement('button');
    button.slot = 'footer';
    button.textContent = 'Yes';
    el.append(button);
  }

  document.body.append(el);
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
  return el;
}

function native(el: PxDialog): HTMLDialogElement {
  const node = el.shadowRoot?.querySelector('dialog');
  if (!node) throw new Error('dialog not rendered');
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-dialog', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-dialog')).toBeDefined();
  });

  it('is a real dialog underneath, closed to start with', async () => {
    const el = await mount();

    expect(el.open).toBe(false);
    expect(native(el).open).toBe(false);
    expect(native(el).getAttribute('aria-label')).toBe('Save game?');
  });

  it('opens as a modal and says so', async () => {
    const el = await mount();
    const onOpen = vi.fn();
    el.addEventListener('px-dialog-open', onOpen);

    const showModal = vi.spyOn(native(el), 'showModal');

    el.show();
    await el.updateComplete;

    expect(el.open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    expect(native(el).open).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('closes with the value it was given', async () => {
    const el = await mount();
    const onClose = vi.fn();
    el.addEventListener('px-dialog-close', onClose);

    el.show();
    await el.updateComplete;

    el.close('yes');
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(native(el).open).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]?.[0].detail).toEqual({ returnValue: 'yes' });
  });

  it('says so once, not twice, when the native close event arrives after', async () => {
    const el = await mount();
    const onClose = vi.fn();
    el.addEventListener('px-dialog-close', onClose);

    el.show();
    await el.updateComplete;

    el.close('yes');
    await el.updateComplete;
    expect(onClose).toHaveBeenCalledTimes(1);

    // The platform's own event, which a background tab can hold on to for a
    // long time, turns up afterwards. It must not report the close again.
    native(el).dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('follows the native dialog when it closes itself', async () => {
    const el = await mount();
    const onClose = vi.fn();
    el.addEventListener('px-dialog-close', onClose);

    el.show();
    await el.updateComplete;

    // What Escape does, through the platform rather than through us.
    native(el).close();
    await el.updateComplete;

    expect(el.open).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reports a cancelled dialog as dismissed', async () => {
    const el = await mount();
    const onClose = vi.fn();
    el.addEventListener('px-dialog-close', onClose);

    el.show();
    await el.updateComplete;

    native(el).dispatchEvent(new Event('cancel', { cancelable: true }));
    native(el).close();
    await el.updateComplete;

    expect(onClose.mock.calls[0]?.[0].detail).toEqual({ returnValue: 'dismiss' });
  });

  it('refuses to be cancelled when it must be answered', async () => {
    const el = await mount({ label: 'Really quit?', 'no-dismiss': true });
    el.show();
    await el.updateComplete;

    const cancel = new Event('cancel', { cancelable: true });
    native(el).dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(el.open).toBe(true);
  });

  it('closes on a click that lands on the backdrop', async () => {
    const el = await mount();
    el.show();
    await el.updateComplete;

    // A click on the dialog element itself is a click outside its content:
    // the frame and the body cover every pixel of the box.
    native(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(el.open).toBe(false);
  });

  it('ignores a click inside it', async () => {
    const el = await mount();
    el.show();
    await el.updateComplete;

    const frame = el.shadowRoot?.querySelector('[part="frame"]');
    frame?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(el.open).toBe(true);
  });

  it('ignores the backdrop while it must be answered', async () => {
    const el = await mount({ label: 'Really quit?', 'no-dismiss': true });
    el.show();
    await el.updateComplete;

    native(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(el.open).toBe(true);
  });

  it('draws a title and keeps it out of the accessibility tree', async () => {
    const el = await mount();
    const title = el.shadowRoot?.querySelector('[part="title"]');

    expect(title?.textContent).toBe('Save game?');
    expect(title?.getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves the title out when it is told to', async () => {
    const el = await mount({ label: 'Save game?', 'hide-label': true });
    expect(el.shadowRoot?.querySelector('[part="title"]')).toBeNull();
    expect(native(el).getAttribute('aria-label')).toBe('Save game?');
  });

  it('keeps the footer out of the way when nothing is in it', async () => {
    const withButtons = await mount();
    expect(withButtons.shadowRoot?.querySelector('[part="footer"]')?.className).not.toContain(
      'empty',
    );

    const bare = await mount({ label: 'Loading…' }, 'Please wait.', false);
    expect(bare.shadowRoot?.querySelector('[part="footer"]')?.className).toContain('empty');
  });

  it('ignores show and close when they would change nothing', async () => {
    const el = await mount();
    const onOpen = vi.fn();
    const onClose = vi.fn();
    el.addEventListener('px-dialog-open', onOpen);
    el.addEventListener('px-dialog-close', onClose);

    el.close('nothing');
    expect(onClose).not.toHaveBeenCalled();

    el.show();
    await el.updateComplete;
    el.show();
    await el.updateComplete;
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
