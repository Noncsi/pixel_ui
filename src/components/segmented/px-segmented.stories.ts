import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-segmented.js';
import './px-segment.js';
import '../panel/px-panel.js';
import type { PxSegmented } from './px-segmented.js';

const meta: Meta<PxSegmented> = {
  title: 'Components/Segmented',
  component: 'px-segmented',
  args: {
    label: 'Difficulty',
    value: 'normal',
    fullWidth: false,
    disabled: false,
  },
  render: (args) => html`
    <px-segmented
      label=${args.label}
      value=${args.value}
      ?full-width=${args.fullWidth}
      ?disabled=${args.disabled}
    >
      <px-segment value="easy">Easy</px-segment>
      <px-segment value="normal">Normal</px-segment>
      <px-segment value="hard">Hard</px-segment>
    </px-segmented>
  `,
};

export default meta;
type Story = StoryObj<PxSegmented>;

/** Tab in once, then the arrow keys move and choose together. */
export const Default: Story = {};

export const FullWidth: Story = { args: { fullWidth: true } };

export const Disabled: Story = { args: { disabled: true } };

/** Two choices is the commonest case, and the clearest. */
export const TwoUp: Story = {
  render: () => html`
    <px-segmented label="Window mode" value="fullscreen">
      <px-segment value="fullscreen">Fullscreen</px-segment>
      <px-segment value="windowed">Windowed</px-segment>
    </px-segmented>
  `,
};

/** A choice that isn't unlocked yet is stepped over by the keyboard too. */
export const WithDisabledSegment: Story = {
  render: () => html`
    <px-segmented label="Difficulty" value="normal">
      <px-segment value="easy">Easy</px-segment>
      <px-segment value="normal">Normal</px-segment>
      <px-segment value="hard">Hard</px-segment>
      <px-segment value="nightmare" disabled>Nightmare</px-segment>
    </px-segmented>
  `,
};

/** Icons instead of words, where the choice is a shape. */
export const WithIcons: Story = {
  render: () => html`
    <px-segmented label="Speed" value="normal">
      <px-segment value="slow">
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M2 1h1v6H2z" />
        </svg>
        Slow
      </px-segment>
      <px-segment value="normal">
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M1 1h1v6H1zM4 1h1v6H4z" />
        </svg>
        Normal
      </px-segment>
      <px-segment value="fast">
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M1 1h1v6H1zM3 1h1v6H3zM5 1h1v6H5z" />
        </svg>
        Fast
      </px-segment>
    </px-segmented>
  `,
};

/** Where it earns its place: a page of options, all visible at once. */
export const OptionsScreen: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="Display">
        <div style="display: grid; gap: 14px">
          <px-segmented full-width label="Window mode" value="fullscreen">
            <px-segment value="fullscreen">Fullscreen</px-segment>
            <px-segment value="windowed">Windowed</px-segment>
          </px-segmented>
          <px-segmented full-width label="Scaling" value="2x">
            <px-segment value="1x">1×</px-segment>
            <px-segment value="2x">2×</px-segment>
            <px-segment value="3x">3×</px-segment>
          </px-segmented>
        </div>
      </px-panel>
    </div>
  `,
};

/** `--px-segmented-color` changes the fill on the chosen segment. */
export const Recoloured: Story = {
  render: () => html`
    <px-segmented label="Team" value="green" style="--px-segmented-color: var(--px-color-accent)">
      <px-segment value="green">Green</px-segment>
      <px-segment value="blue">Blue</px-segment>
    </px-segmented>
  `,
};
