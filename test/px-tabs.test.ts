import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/components/tabs/px-tabs.js';
import '../src/components/tabs/px-tab.js';
import '../src/components/tabs/px-tab-panel.js';
import type { PxTabs } from '../src/components/tabs/px-tabs.js';

interface TabSpec {
  label: string;
  panel?: string;
  disabled?: boolean;
}

const TABS: TabSpec[] = [
  { label: 'Items', panel: 'items' },
  { label: 'Gear', panel: 'gear' },
  { label: 'Magic', panel: 'magic' },
];

async function settle(el: PxTabs): Promise<void> {
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 0));
  await el.updateComplete;
}

async function mount(
  tabs: TabSpec[] = TABS,
  attrs: Record<string, string | number | boolean> = {},
  named = true,
): Promise<PxTabs> {
  const el = document.createElement('px-tabs');
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) el.setAttribute(name, '');
    else if (value !== false) el.setAttribute(name, String(value));
  }

  for (const spec of tabs) {
    const tab = document.createElement('px-tab');
    tab.textContent = spec.label;
    if (named && spec.panel) tab.setAttribute('panel', spec.panel);
    if (spec.disabled) tab.setAttribute('disabled', '');
    el.append(tab);
  }

  for (const spec of tabs) {
    const panel = document.createElement('px-tab-panel');
    if (named && spec.panel) panel.setAttribute('name', spec.panel);
    panel.textContent = `${spec.label} content`;
    el.append(panel);
  }

  document.body.append(el);
  await settle(el);
  return el;
}

function press(el: PxTabs, key: string): void {
  const tab = el.tabs[el.index];
  tab?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('px-tabs', () => {
  it('registers all three custom elements', () => {
    expect(customElements.get('px-tabs')).toBeDefined();
    expect(customElements.get('px-tab')).toBeDefined();
    expect(customElements.get('px-tab-panel')).toBeDefined();
  });

  it('puts each tab in the strip without being asked', async () => {
    const el = await mount();
    expect(el.tabs).toHaveLength(3);
    expect(el.tabs.every((tab) => tab.slot === 'nav')).toBe(true);
    expect(el.panels).toHaveLength(3);
  });

  it('gives the strip a tablist and the tabs their roles', async () => {
    const el = await mount();
    const list = el.shadowRoot?.querySelector('[role="tablist"]');

    expect(list?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.tabs[0]?.getAttribute('role')).toBe('tab');
    expect(el.panels[0]?.getAttribute('role')).toBe('tabpanel');
  });

  it('points each tab and panel at the other', async () => {
    const el = await mount();
    const [tab] = el.tabs;
    const [panel] = el.panels;

    expect(tab?.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.getAttribute('aria-labelledby')).toBe(tab?.id);
  });

  it('selects the first tab and shows only its panel', async () => {
    const el = await mount();

    expect(el.index).toBe(0);
    expect(el.tabs.map((tab) => tab.selected)).toEqual([true, false, false]);
    expect(el.panels.map((panel) => panel.active)).toEqual([true, false, false]);
    expect(el.activePanel?.textContent).toBe('Items content');
  });

  it('leaves one tab stop for the whole strip', async () => {
    const el = await mount();
    expect(el.tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(el.tabs[0]?.getAttribute('aria-selected')).toBe('true');

    el.select(1);
    await el.updateComplete;
    expect(el.tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('moves along the strip with the arrow keys and selects as it goes', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-tab-change', onChange);

    press(el, 'ArrowRight');
    await el.updateComplete;

    expect(el.index).toBe(1);
    expect(el.activePanel?.textContent).toBe('Gear content');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].detail).toMatchObject({ name: 'gear', index: 1 });

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('wraps around at the ends', async () => {
    const el = await mount();

    press(el, 'ArrowLeft');
    await el.updateComplete;
    expect(el.index).toBe(2);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('jumps to the ends with Home and End', async () => {
    const el = await mount();

    press(el, 'End');
    await el.updateComplete;
    expect(el.index).toBe(2);

    press(el, 'Home');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('steps over a disabled tab', async () => {
    const el = await mount([
      { label: 'Items', panel: 'items' },
      { label: 'Gear', panel: 'gear', disabled: true },
      { label: 'Magic', panel: 'magic' },
    ]);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(2);
  });

  it('starts on the first tab that is not disabled', async () => {
    const el = await mount([
      { label: 'Items', panel: 'items', disabled: true },
      { label: 'Gear', panel: 'gear' },
    ]);

    expect(el.index).toBe(1);
    expect(el.activeTab?.textContent).toBe('Gear');
  });

  it('refuses to select a disabled tab', async () => {
    const el = await mount([
      { label: 'Items', panel: 'items' },
      { label: 'Gear', panel: 'gear', disabled: true },
    ]);

    el.select(1);
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('uses up and down when it runs vertically', async () => {
    const el = await mount(TABS, { orientation: 'vertical' });

    expect(el.shadowRoot?.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe(
      'vertical',
    );

    press(el, 'ArrowDown');
    await el.updateComplete;
    expect(el.index).toBe(1);

    press(el, 'ArrowRight');
    await el.updateComplete;
    expect(el.index).toBe(1);

    press(el, 'ArrowUp');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('marks its tabs vertical so they can draw the right edge', async () => {
    const el = await mount(TABS, { orientation: 'vertical' });
    expect(el.tabs.every((tab) => tab.hasAttribute('vertical'))).toBe(true);
  });

  it('selects a clicked tab', async () => {
    const el = await mount();
    const onChange = vi.fn();
    el.addEventListener('px-tab-change', onChange);

    el.tabs[2]?.click();
    await el.updateComplete;

    expect(el.index).toBe(2);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ignores a click on a disabled tab', async () => {
    const el = await mount([
      { label: 'Items', panel: 'items' },
      { label: 'Gear', panel: 'gear', disabled: true },
    ]);

    el.tabs[1]?.click();
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('selects by panel name', async () => {
    const el = await mount();

    el.show('magic');
    await el.updateComplete;

    expect(el.index).toBe(2);
    expect(el.activePanel?.getAttribute('name')).toBe('magic');
  });

  it('ignores a name that is not there', async () => {
    const el = await mount();
    el.show('cheats');
    await el.updateComplete;
    expect(el.index).toBe(0);
  });

  it('matches tabs to panels by position when neither is named', async () => {
    const el = await mount(TABS, {}, false);

    el.select(1);
    await el.updateComplete;

    expect(el.activePanel?.textContent).toBe('Gear content');
    expect(el.tabs[1]?.getAttribute('aria-controls')).toBe(el.panels[1]?.id);
  });

  it('leaves keys it does not handle alone', async () => {
    const el = await mount();
    const tab = el.tabs[0];

    const handled = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    tab?.dispatchEvent(handled);
    expect(handled.defaultPrevented).toBe(true);

    const ignored = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    tab?.dispatchEvent(ignored);
    expect(ignored.defaultPrevented).toBe(false);
  });

  it('keeps a panel out of the tab order while it is hidden', async () => {
    const el = await mount();
    expect(el.panels.map((panel) => panel.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });
});
