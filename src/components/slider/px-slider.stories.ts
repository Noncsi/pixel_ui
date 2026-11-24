import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-slider.js';
import type { PxSlider } from './px-slider.js';

const meta: Meta<PxSlider> = {
  title: 'Components/Slider',
  component: 'px-slider',
  args: {
    label: 'Music',
    value: 80,
    min: 0,
    max: 100,
    step: 1,
    unit: '%',
    showValue: true,
    hideLabel: false,
    disabled: false,
  },
  render: (args) => html`
    <div style="width: 240px">
      <px-slider
        label=${args.label}
        value=${args.value}
        min=${args.min}
        max=${args.max}
        step=${args.step}
        unit=${args.unit}
        ?show-value=${args.showValue}
        ?hide-label=${args.hideLabel}
        ?disabled=${args.disabled}
      ></px-slider>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxSlider>;

/** Drag it, or focus it and use the arrow keys, Home, End and Page Up/Down. */
export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

/** Big steps land the handle on each notch. */
export const Stepped: Story = {
  args: { label: 'Difficulty', min: 1, max: 5, step: 1, value: 3, unit: '' },
};

/** Just the track, where the row's label lives somewhere else. */
export const TrackOnly: Story = {
  args: { hideLabel: true, showValue: false },
};

/** The audio page of an options screen. */
export const Settings: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; width: 260px">
      <px-slider label="Master" value="100" unit="%" show-value></px-slider>
      <px-slider label="Music" value="80" unit="%" show-value></px-slider>
      <px-slider label="Effects" value="65" unit="%" show-value></px-slider>
      <px-slider label="Voices" value="40" unit="%" show-value disabled></px-slider>
    </div>
  `,
};

/** `--px-slider-color` and `--px-slider-height` restyle it per use. */
export const Restyled: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; width: 260px">
      <px-slider
        label="Mana"
        value="70"
        show-value
        style="--px-slider-color: var(--px-color-mana)"
      ></px-slider>
      <px-slider
        label="Chunky"
        value="30"
        show-value
        style="--px-slider-height: 32px; --px-slider-color: var(--px-color-xp)"
      ></px-slider>
    </div>
  `,
};
