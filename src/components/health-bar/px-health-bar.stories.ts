import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-health-bar.js';
import type { PxHealthBar } from './px-health-bar.js';

const meta: Meta<PxHealthBar> = {
  title: 'Components/Health bar',
  component: 'px-health-bar',
  args: {
    label: 'HP',
    value: 70,
    max: 100,
    variant: 'health',
    segments: 0,
    lowThreshold: 0.25,
    showValue: true,
    hideLabel: false,
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    variant: { control: 'inline-radio', options: ['health', 'mana', 'xp'] },
    segments: { control: { type: 'number', min: 0, max: 20 } },
    lowThreshold: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
  render: (args) => html`
    <px-health-bar
      label=${args.label}
      .value=${args.value}
      .max=${args.max}
      variant=${args.variant}
      .segments=${args.segments}
      .lowThreshold=${args.lowThreshold}
      ?show-value=${args.showValue}
      ?hide-label=${args.hideLabel}
    ></px-health-bar>
  `,
};

export default meta;
type Story = StoryObj<PxHealthBar>;

export const Health: Story = {};

export const Mana: Story = { args: { label: 'Mana', variant: 'mana', value: 45 } };

export const Experience: Story = {
  args: { label: 'XP', variant: 'xp', value: 320, max: 500 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 500, step: 10 } } },
};

export const Segmented: Story = { args: { segments: 10 } };

export const Low: Story = { args: { value: 15 } };
