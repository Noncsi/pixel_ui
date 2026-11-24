import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-panel.js';
import '../button/px-button.js';
import '../health-bar/px-health-bar.js';
import type { PxPanel } from './px-panel.js';

const meta: Meta<PxPanel> = {
  title: 'Components/Panel',
  component: 'px-panel',
  args: {
    label: 'General store',
    hideLabel: false,
    inset: false,
    flat: false,
  },
  render: (args) => html`
    <div style="width: 300px">
      <px-panel
        label=${args.label}
        ?hide-label=${args.hideLabel}
        ?inset=${args.inset}
        ?flat=${args.flat}
      >
        Everything here is overpriced and you know it. The shopkeeper knows it too.
      </px-panel>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxPanel>;

/** The surface every other component in the kit is drawn on. */
export const Default: Story = {};

/** Sunk into the page instead of standing out of it: for lists and text. */
export const Inset: Story = { args: { inset: true, label: 'Quest log' } };

/** Both at once is how a screen is usually put together. */
export const Nested: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="Character">
        <px-panel inset hide-label label="Stats">
          <div style="display: grid; gap: 12px">
            <px-health-bar label="HP" value="72" segments="10" show-value></px-health-bar>
            <px-health-bar label="Mana" variant="mana" value="30" show-value></px-health-bar>
          </div>
        </px-panel>
      </px-panel>
    </div>
  `,
};

/** The `header` slot sits beside the heading; `footer` runs along the bottom. */
export const WithHeaderAndFooter: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="Bag">
        <span slot="header" style="color: var(--px-color-text-muted)">4 / 20</span>
        Potion ×12, Antidote ×3, Rusty Sword, Wooden Shield.
        <px-button slot="footer" size="sm" variant="secondary">Sort</px-button>
        <px-button slot="footer" size="sm">Close</px-button>
      </px-panel>
    </div>
  `,
};

/** No heading, no slots: just the frame and whatever is in it. */
export const Bare: Story = {
  args: { label: '' },
};

/** `flat` keeps the spacing and drops the frame. */
export const Flat: Story = { args: { flat: true } };

/** `--px-panel-fill` and `--px-panel-padding` re-skin it per use. */
export const Restyled: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; width: 300px">
      <px-panel label="Danger" style="--px-panel-fill: var(--px-color-danger)">
        The floor here is suspiciously clean.
      </px-panel>
      <px-panel label="Roomy" style="--px-panel-padding: 32px">
        More air around the words.
      </px-panel>
    </div>
  `,
};
