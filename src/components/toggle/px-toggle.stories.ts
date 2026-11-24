import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-toggle.js';
import type { PxToggle } from './px-toggle.js';

const meta: Meta<PxToggle> = {
  title: 'Components/Toggle',
  component: 'px-toggle',
  args: {
    label: 'Sound',
    checked: false,
    disabled: false,
    hideLabel: false,
  },
  render: (args) => html`
    <div style="width: 200px">
      <px-toggle
        label=${args.label}
        ?checked=${args.checked}
        ?disabled=${args.disabled}
        ?hide-label=${args.hideLabel}
      ></px-toggle>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxToggle>;

export const Default: Story = {};

export const On: Story = { args: { checked: true } };

export const Disabled: Story = { args: { label: 'Cheats', disabled: true } };

/** A column of them is what an options screen is mostly made of. */
export const Settings: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 220px">
      <px-toggle label="Sound" checked></px-toggle>
      <px-toggle label="Music" checked></px-toggle>
      <px-toggle label="Screen shake"></px-toggle>
      <px-toggle label="Speedrun timer"></px-toggle>
      <px-toggle label="Cheats" disabled></px-toggle>
    </div>
  `,
};

/** `--px-toggle-color` re-colours the "on" fill without touching the tokens. */
export const Recoloured: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 220px">
      <px-toggle label="Mana regen" checked style="--px-toggle-color: var(--px-color-mana)">
      </px-toggle>
      <px-toggle label="Hard mode" checked style="--px-toggle-color: var(--px-color-danger)">
      </px-toggle>
    </div>
  `,
};
