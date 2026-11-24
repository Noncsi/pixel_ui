import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-progress.js';
import type { PxProgress } from './px-progress.js';

const meta: Meta<PxProgress> = {
  title: 'Components/Progress',
  component: 'px-progress',
  args: {
    label: 'Loading',
    value: 40,
    max: 100,
    showValue: true,
    hideLabel: false,
    indeterminate: false,
  },
  render: (args) => html`
    <div style="width: 280px">
      <px-progress
        label=${args.label}
        value=${args.value}
        max=${args.max}
        ?show-value=${args.showValue}
        ?hide-label=${args.hideLabel}
        ?indeterminate=${args.indeterminate}
      ></px-progress>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxProgress>;

/** The one that only goes up. Use `<px-health-bar>` for a resource. */
export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Full: Story = { args: { value: 100 } };

/** No number yet: a band of blocks marches instead, and no position is reported. */
export const Indeterminate: Story = {
  args: { label: 'Generating world', indeterminate: true },
};

/** Just the bar, for a loading screen that has its own heading. */
export const BarOnly: Story = {
  args: { hideLabel: true, showValue: false, value: 65 },
};

/** A scale of its own, for "3 of 12 found". */
export const CountedOut: Story = {
  args: { label: 'Shards found', value: 3, max: 12, showValue: true },
};

/** A loading screen, start to finish. */
export const LoadingScreen: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 300px">
      <px-progress label="Textures" value="100" show-value></px-progress>
      <px-progress label="Sounds" value="72" show-value></px-progress>
      <px-progress label="World" indeterminate></px-progress>
      <px-progress label="Save data" value="0" show-value></px-progress>
    </div>
  `,
};

/** `--px-progress-color` and `--px-progress-height` restyle it per use. */
export const Restyled: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 300px">
      <px-progress
        label="Cast"
        value="55"
        style="--px-progress-color: var(--px-color-mana)"
      ></px-progress>
      <px-progress
        label="Chunky"
        value="30"
        style="--px-progress-height: 24px; --px-progress-color: var(--px-color-xp)"
      ></px-progress>
    </div>
  `,
};
