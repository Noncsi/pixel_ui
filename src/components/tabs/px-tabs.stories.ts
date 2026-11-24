import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-tabs.js';
import './px-tab.js';
import './px-tab-panel.js';
import '../health-bar/px-health-bar.js';
import type { PxTabs } from './px-tabs.js';

const meta: Meta<PxTabs> = {
  title: 'Components/Tabs',
  component: 'px-tabs',
  args: {
    orientation: 'horizontal',
    index: 0,
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  render: (args) => html`
    <div style="width: 320px">
      <px-tabs orientation=${args.orientation}>
        <px-tab panel="items">Items</px-tab>
        <px-tab panel="gear">Gear</px-tab>
        <px-tab panel="magic">Magic</px-tab>

        <px-tab-panel name="items">Potion ×12, Antidote ×3, a suspicious mushroom.</px-tab-panel>
        <px-tab-panel name="gear">Rusty Sword, Wooden Shield, one boot.</px-tab-panel>
        <px-tab-panel name="magic">Fire, Ice, and something you can't pronounce.</px-tab-panel>
      </px-tabs>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxTabs>;

/** Click a tab, or focus one and use the arrow keys. */
export const Default: Story = {};

/** The strip runs down the side, and up/down move along it. */
export const Vertical: Story = { args: { orientation: 'vertical' } };

/** A tab that isn't available yet is skipped by the keyboard too. */
export const WithDisabledTab: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-tabs>
        <px-tab panel="items">Items</px-tab>
        <px-tab panel="gear">Gear</px-tab>
        <px-tab panel="magic" disabled>Magic</px-tab>

        <px-tab-panel name="items">Potion ×12, Antidote ×3.</px-tab-panel>
        <px-tab-panel name="gear">Rusty Sword, Wooden Shield.</px-tab-panel>
        <px-tab-panel name="magic">You haven't learned any spells.</px-tab-panel>
      </px-tabs>
    </div>
  `,
};

/** Icons sit before the label, unsmoothed. */
export const WithIcons: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-tabs>
        <px-tab panel="items">
          <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
            <path d="M2 1h4v1H2zM1 2h6v5H1z" />
          </svg>
          Items
        </px-tab>
        <px-tab panel="gear">
          <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
            <path d="M3 0h2v5H3zM2 5h4v1H2zM3 6h2v2H3z" />
          </svg>
          Gear
        </px-tab>

        <px-tab-panel name="items">Potion ×12, Antidote ×3.</px-tab-panel>
        <px-tab-panel name="gear">Rusty Sword, Wooden Shield.</px-tab-panel>
      </px-tabs>
    </div>
  `,
};

/** Panels hold anything — here, the rest of the kit. */
export const CharacterSheet: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-tabs>
        <px-tab panel="stats">Stats</px-tab>
        <px-tab panel="story">Story</px-tab>

        <px-tab-panel name="stats">
          <div style="display: grid; gap: 12px; padding-top: 4px">
            <px-health-bar label="HP" value="72" segments="10" show-value></px-health-bar>
            <px-health-bar label="Mana" variant="mana" value="30" show-value></px-health-bar>
            <px-health-bar label="XP" variant="xp" value="320" max="500" show-value></px-health-bar>
          </div>
        </px-tab-panel>
        <px-tab-panel name="story">
          Left home with a stick. Met an old man. Still has the stick.
        </px-tab-panel>
      </px-tabs>
    </div>
  `,
};
