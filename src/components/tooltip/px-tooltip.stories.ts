import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-tooltip.js';
import '../button/px-button.js';
import type { PxTooltip } from './px-tooltip.js';

const meta: Meta<PxTooltip> = {
  title: 'Components/Tooltip',
  component: 'px-tooltip',
  args: {
    text: 'Restores 20 HP',
    placement: 'top',
    delay: 0,
    disabled: false,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
  },
  render: (args) => html`
    <div style="padding: 60px; display: flex; justify-content: center">
      <px-tooltip
        text=${args.text}
        placement=${args.placement}
        delay=${args.delay}
        ?disabled=${args.disabled}
      >
        <px-button size="sm">Potion</px-button>
      </px-tooltip>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxTooltip>;

/** Hover it, or tab to the button — the tooltip answers to both. */
export const Default: Story = {};

/** It doesn't flip away from an edge: the side you pick is the side you get. */
export const Placements: Story = {
  render: () => html`
    <div
      style="padding: 70px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; justify-items: center"
    >
      ${(['top', 'bottom', 'left', 'right'] as const).map(
        (placement) => html`
          <px-tooltip text="Goes ${placement}" placement=${placement}>
            <px-button size="sm" variant="secondary">${placement}</px-button>
          </px-tooltip>
        `,
      )}
    </div>
  `,
};

/** A delay keeps tooltips from flashing as the pointer crosses a row of them. */
export const WithDelay: Story = {
  args: { delay: 500, text: 'Shows after half a second' },
};

/** Long text wraps at `--px-tooltip-max-width`. */
export const LongText: Story = {
  args: {
    text: 'A chipped iron sword. Still sharper than your last one, which was a stick.',
  },
};

/** Anything can be the trigger, not just a button. */
export const OnAnything: Story = {
  render: () => html`
    <div style="padding: 60px; display: flex; gap: 24px; align-items: center">
      <px-tooltip text="12 of 99" placement="bottom">
        <span tabindex="0" style="font-size: 8px">POTIONS ×12</span>
      </px-tooltip>
      <px-tooltip text="Equipped" placement="bottom">
        <svg tabindex="0" viewBox="0 0 8 8" width="24" height="24" fill="currentColor">
          <path d="M3 0h2v5H3zM2 5h4v1H2zM3 6h2v2H3z" />
        </svg>
      </px-tooltip>
    </div>
  `,
};
