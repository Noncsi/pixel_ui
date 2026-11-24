import { afterEach, describe, expect, it } from 'vitest';
import '../src/components/avatar/px-avatar.js';
import type { PxAvatar } from '../src/components/avatar/px-avatar.js';

async function mount(attrs: Record<string, string | number | boolean> = {}): Promise<PxAvatar> {
  const el = document.createElement('px-avatar');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function base(el: PxAvatar): HTMLElement | null {
  return el.shadowRoot?.querySelector('[part="base"]') ?? null;
}

function srText(el: PxAvatar): string {
  return el.shadowRoot?.querySelector('.sr-only')?.textContent?.trim() ?? '';
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-avatar', () => {
  it('registers the custom element', () => {
    expect(customElements.get('px-avatar')).toBeDefined();
  });

  it('draws a picture when it is given one', async () => {
    const el = await mount({ src: '/hero.png', alt: 'The hero' });
    const image = el.shadowRoot?.querySelector('[part="image"]');

    expect(image?.getAttribute('src')).toBe('/hero.png');
    // The name is on the wrapper, so the img must not repeat it.
    expect(image?.getAttribute('alt')).toBe('');
    expect(base(el)?.getAttribute('role')).toBe('img');
    expect(base(el)?.getAttribute('aria-label')).toBe('The hero');
  });

  it('falls back to initials when there is no picture yet', async () => {
    const el = await mount({ name: 'Old Man' });

    expect(el.shadowRoot?.querySelector('[part="image"]')).toBeNull();
    expect(el.shadowRoot?.querySelector('[part="initials"]')?.textContent).toBe('OM');
    expect(base(el)?.getAttribute('aria-label')).toBe('Old Man');
  });

  it('takes one letter from a single name', async () => {
    const el = await mount({ name: 'Link' });
    expect(el.initials).toBe('L');
  });

  it('takes the first and last of a longer name', async () => {
    const el = await mount({ name: 'the old man of the cave' });
    expect(el.initials).toBe('TC');
  });

  it('has no initials to show without a name', async () => {
    const el = await mount();
    expect(el.initials).toBe('');
  });

  it('names itself from alt before name', async () => {
    const el = await mount({ name: 'Link', alt: 'Link, asleep' });
    expect(el.accessibleName).toBe('Link, asleep');
  });

  it('counts as decoration when it has no name at all', async () => {
    const el = await mount({ src: '/decor.png' });

    expect(base(el)?.getAttribute('aria-hidden')).toBe('true');
    expect(base(el)?.hasAttribute('role')).toBe(false);
    expect(base(el)?.hasAttribute('aria-label')).toBe(false);
  });

  it('shows no pip unless there is a status', async () => {
    const el = await mount({ name: 'Link' });
    expect(el.shadowRoot?.querySelector('[part="status"]')).toBeNull();
  });

  it('shows a pip for a status', async () => {
    for (const status of ['ok', 'warn', 'danger'] as const) {
      const el = await mount({ name: 'Link', status });
      expect(el.shadowRoot?.querySelector('[part="status"]')).not.toBeNull();
      expect(el.getAttribute('status')).toBe(status);
    }
  });

  it('says what the pip means, since a colour says nothing', async () => {
    const el = await mount({ name: 'Link', status: 'danger', 'status-label': 'Poisoned' });
    expect(srText(el)).toBe('Poisoned');
  });

  it('leaves an unexplained pip silent rather than guessing', async () => {
    const el = await mount({ name: 'Link', status: 'danger' });
    expect(el.shadowRoot?.querySelector('.sr-only')).toBeNull();
  });

  it('takes the three sizes', async () => {
    const el = await mount({ name: 'Link' });
    expect(el.getAttribute('size')).toBe('md');

    for (const size of ['sm', 'lg'] as const) {
      const sized = await mount({ name: 'Link', size });
      expect(sized.getAttribute('size')).toBe(size);
    }
  });
});
