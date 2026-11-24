import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-number.js';
import '../panel/px-panel.js';
import '../button/px-button.js';
import type { PxNumber } from './px-number.js';

const meta: Meta<PxNumber> = {
  title: 'Components/Number',
  component: 'px-number',
  args: {
    label: 'Potions',
    value: 1,
    min: 0,
    max: 99,
    step: 1,
    hideLabel: false,
    disabled: false,
  },
  render: (args) => html`
    <div style="width: 240px">
      <px-number
        label=${args.label}
        value=${args.value}
        min=${args.min}
        max=${args.max}
        step=${args.step}
        ?hide-label=${args.hideLabel}
        ?disabled=${args.disabled}
      ></px-number>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxNumber>;

/** The − and +, or the up and down arrows once the field has focus. */
export const Default: Story = {};

/** At the end of its range, the button that would go past is disabled. */
export const AtTheLimit: Story = { args: { value: 5, min: 0, max: 5 } };

export const Disabled: Story = { args: { disabled: true } };

/** Bigger steps, for something you buy by the handful. */
export const BigSteps: Story = {
  args: { label: 'Arrows', value: 10, step: 10, max: 200 },
};

/** Just the stepper, where the label lives somewhere else. */
export const NoLabel: Story = { args: { hideLabel: true } };

/** What it is for: deciding how many of something to buy. */
export const Shop: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-panel label="General store">
        <div style="display: grid; gap: 12px">
          <px-number label="Potion — 20g" value="1" max="9"></px-number>
          <px-number label="Antidote — 15g" value="0" max="9"></px-number>
          <px-number label="Elixir — 400g" value="0" max="1"></px-number>
        </div>
        <px-button slot="footer" size="sm" variant="secondary">Leave</px-button>
        <px-button slot="footer" size="sm">Buy</px-button>
      </px-panel>
    </div>
  `,
};
