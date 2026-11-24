import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-badge.js';
import '../tabs/px-tabs.js';
import '../tabs/px-tab.js';
import '../tabs/px-tab-panel.js';
import '../menu/px-menu.js';
import '../menu/px-menu-item.js';
import type { PxBadge } from './px-badge.js';

const meta: Meta<PxBadge> = {
  title: 'Components/Badge',
  component: 'px-badge',
  args: {
    variant: 'neutral',
    label: '',
    max: 0,
    dot: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['neutral', 'accent', 'danger', 'xp'] },
  },
  render: (args) => html`
    <px-badge variant=${args.variant} label=${args.label} max=${args.max} ?dot=${args.dot}>
      3
    </px-badge>
  `,
};

export default meta;
type Story = StoryObj<PxBadge>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; align-items: center">
      <px-badge>3</px-badge>
      <px-badge variant="accent">New</px-badge>
      <px-badge variant="danger">!</px-badge>
      <px-badge variant="xp">+5</px-badge>
    </div>
  `,
};

/** Over the cap, the drawn number stops counting. The label still knows. */
export const Capped: Story = {
  args: { max: 99, label: '143 unread' },
  render: (args) => html`
    <div style="display: flex; gap: 8px; align-items: center">
      <px-badge max=${args.max} label=${args.label} variant="danger">143</px-badge>
      <px-badge max="99" variant="danger">42</px-badge>
    </div>
  `,
};

/** A dot says something changed without saying how much. */
export const Dot: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center">
      <px-badge dot variant="danger" label="Unread messages"></px-badge>
      <px-badge dot variant="accent"></px-badge>
    </div>
  `,
};

/**
 * A bare "3" tells a screen reader nothing. With a label it reads "3 unread"
 * and the digits are hidden from the accessibility tree.
 */
export const Labelled: Story = {
  args: { label: '3 unread', variant: 'danger' },
};

/** Where badges earn their place: on something else. */
export const OnTabs: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-tabs>
        <px-tab panel="items">Items</px-tab>
        <px-tab panel="mail">
          Mail
          <px-badge variant="danger" label="3 unread">3</px-badge>
        </px-tab>
        <px-tab panel="quests">
          Quests
          <px-badge variant="accent" label="1 new">New</px-badge>
        </px-tab>

        <px-tab-panel name="items">Potion ×12, Antidote ×3.</px-tab-panel>
        <px-tab-panel name="mail">Three letters you have been avoiding.</px-tab-panel>
        <px-tab-panel name="quests">Find the stick. Again.</px-tab-panel>
      </px-tabs>
    </div>
  `,
};

/** And on menu rows, where the detail slot is already waiting for them. */
export const OnAMenu: Story = {
  render: () => html`
    <px-menu label="Paused" style="width: 220px">
      <px-menu-item>Continue</px-menu-item>
      <px-menu-item>
        Mail
        <px-badge slot="detail" variant="danger" label="12 unread">12</px-badge>
      </px-menu-item>
      <px-menu-item>
        Shop
        <px-badge slot="detail" variant="accent" label="New stock">New</px-badge>
      </px-menu-item>
    </px-menu>
  `,
};
