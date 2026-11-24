import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-menu.js';
import './px-menu-item.js';
import type { PxMenu } from './px-menu.js';

const meta: Meta<PxMenu> = {
  title: 'Components/Menu',
  component: 'px-menu',
  args: {
    label: 'Paused',
    orientation: 'vertical',
    noLoop: false,
    hideLabel: false,
    flat: false,
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  render: (args) => html`
    <px-menu
      label=${args.label}
      orientation=${args.orientation}
      ?no-loop=${args.noLoop}
      ?hide-label=${args.hideLabel}
      ?flat=${args.flat}
    >
      <px-menu-item>Continue</px-menu-item>
      <px-menu-item>Load game</px-menu-item>
      <px-menu-item>Options</px-menu-item>
      <px-menu-item value="quit">Quit</px-menu-item>
    </px-menu>
  `,
};

export default meta;
type Story = StoryObj<PxMenu>;

/** Click it or tab to it, then use the arrow keys, Enter and Escape. */
export const Default: Story = {};

/** A row that can't be chosen yet is skipped by every kind of navigation. */
export const WithDisabledRow: Story = {
  render: () => html`
    <px-menu label="Paused">
      <px-menu-item disabled>Continue</px-menu-item>
      <px-menu-item>New game</px-menu-item>
      <px-menu-item>Options</px-menu-item>
    </px-menu>
  `,
};

/** Left and right move the highlight instead of up and down. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal', label: 'Inventory' },
  render: (args) => html`
    <px-menu label=${args.label} orientation="horizontal">
      <px-menu-item>Items</px-menu-item>
      <px-menu-item>Gear</px-menu-item>
      <px-menu-item>Magic</px-menu-item>
      <px-menu-item>Map</px-menu-item>
    </px-menu>
  `,
};

/** No panel, for a menu sitting straight on a title screen. */
export const Flat: Story = {
  render: () => html`
    <px-menu flat label="Pixel Quest" hide-label>
      <px-menu-item>Press start</px-menu-item>
      <px-menu-item>Options</px-menu-item>
    </px-menu>
  `,
};

/** The `detail` slot carries each row's current setting. */
export const OptionsScreen: Story = {
  render: () => html`
    <px-menu label="Options" style="width: 240px">
      <px-menu-item>
        Sound
        <span slot="detail">on</span>
      </px-menu-item>
      <px-menu-item>
        Music
        <span slot="detail">80%</span>
      </px-menu-item>
      <px-menu-item>
        Difficulty
        <span slot="detail">normal</span>
      </px-menu-item>
      <px-menu-item disabled>
        Cheats
        <span slot="detail">locked</span>
      </px-menu-item>
    </px-menu>
  `,
};

/** An icon in each row, drawn unsmoothed at the row's own size. */
export const WithIcons: Story = {
  render: () => html`
    <px-menu label="Equip">
      <px-menu-item>
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M3 0h2v5H3zM2 5h4v1H2zM3 6h2v2H3z" />
        </svg>
        Sword
      </px-menu-item>
      <px-menu-item>
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M1 1h6v1H1zM1 2h1v4H1zM6 2h1v4H6zM2 6h4v1H2z" />
        </svg>
        Shield
      </px-menu-item>
    </px-menu>
  `,
};
