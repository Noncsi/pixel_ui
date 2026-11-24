import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-button.js';
import type { PxButton } from './px-button.js';

/** The label is slotted content rather than a property, so it rides along. */
type ButtonArgs = PxButton & { label: string };

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  component: 'px-button',
  args: {
    label: 'Start game',
    variant: 'primary',
    size: 'md',
    disabled: false,
    toggle: false,
    pressed: false,
    fullWidth: false,
  },
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  render: (args) => html`
    <px-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
      ?toggle=${args.toggle}
      ?pressed=${args.pressed}
      ?full-width=${args.fullWidth}
    >
      ${args.label}
    </px-button>
  `,
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Primary: Story = {};

export const Secondary: Story = { args: { label: 'Options', variant: 'secondary' } };

export const Danger: Story = { args: { label: 'Delete save', variant: 'danger' } };

export const Small: Story = { args: { label: 'Equip', size: 'sm' } };

export const Disabled: Story = { args: { label: 'Continue', disabled: true } };

export const FullWidth: Story = { args: { label: 'New game', fullWidth: true } };

/** Click it: `pressed` flips and `px-toggle` fires. */
export const Toggle: Story = { args: { label: 'Sound', toggle: true } };

/** Anything in the `icon` slot sits before the label, unsmoothed. */
export const WithIcon: Story = {
  render: (args) => html`
    <px-button variant=${args.variant} size=${args.size}>
      <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
        <path d="M1 0h1v1H1zM2 1h1v1H2zM3 2h1v1H3zM4 3h1v1H4zM3 4h1v1H3zM2 5h1v1H2zM1 6h1v1H1z" />
      </svg>
      ${args.label}
    </px-button>
  `,
  args: { label: 'Next' },
};

/** Every variant side by side, the way a menu would stack them. */
export const Menu: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; width: 200px;">
      <px-button full-width>Continue</px-button>
      <px-button full-width variant="secondary">Options</px-button>
      <px-button full-width variant="danger">Quit</px-button>
    </div>
  `,
};
