import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-spinner.js';
import '../button/px-button.js';
import '../panel/px-panel.js';
import '../progress/px-progress.js';
import type { PxSpinner } from './px-spinner.js';

const meta: Meta<PxSpinner> = {
  title: 'Components/Spinner',
  component: 'px-spinner',
  args: {
    label: 'Loading',
    showLabel: false,
    duration: 800,
    quiet: false,
  },
  render: (args) => html`
    <px-spinner
      label=${args.label}
      ?show-label=${args.showLabel}
      duration=${args.duration}
      ?quiet=${args.quiet}
    ></px-spinner>
  `,
};

export default meta;
type Story = StoryObj<PxSpinner>;

/** Eight blocks on a three-by-three grid, lit one at a time. No rotation. */
export const Default: Story = {};

/** With the label drawn as well as said. */
export const WithLabel: Story = { args: { showLabel: true, label: 'Saving' } };

/** Slower, for a wait that is going to be a while. */
export const Slow: Story = { args: { duration: 2000, showLabel: true } };

/** `--px-spinner-size` and `--px-spinner-color` re-skin it. */
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 20px">
      <px-spinner style="--px-spinner-size: 12px"></px-spinner>
      <px-spinner></px-spinner>
      <px-spinner style="--px-spinner-size: 48px"></px-spinner>
      <px-spinner style="--px-spinner-color: var(--px-color-mana)"></px-spinner>
    </div>
  `,
};

/** Beside a word, which is the size it is for. */
export const Inline: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 8px; font-size: 8px">
      <px-spinner style="--px-spinner-size: 16px" label="Connecting"></px-spinner>
      <span>Connecting to the server…</span>
    </div>
  `,
};

/** In a button that is waiting on something. */
export const InAButton: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; align-items: center">
      <px-button size="sm" disabled>
        <px-spinner slot="icon" quiet style="--px-spinner-size: 12px"></px-spinner>
        Saving
      </px-button>
      <px-button size="sm" variant="secondary">Cancel</px-button>
    </div>
  `,
};

/** The two ways to say "working", side by side. */
export const NextToAProgressBar: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 300px">
      <px-panel label="Owns the screen">
        <px-progress indeterminate label="Loading the world"></px-progress>
      </px-panel>
      <px-panel label="Does not">
        <div style="display: flex; align-items: center; gap: 8px">
          <px-spinner style="--px-spinner-size: 16px" label="Autosaving"></px-spinner>
          <span>Autosaving</span>
        </div>
      </px-panel>
    </div>
  `,
};

/** `quiet` for a wait already announced somewhere else. */
export const Quiet: Story = { args: { quiet: true } };
