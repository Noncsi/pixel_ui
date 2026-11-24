import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-input.js';
import '../button/px-button.js';
import '../panel/px-panel.js';
import type { PxInput } from './px-input.js';

const meta: Meta<PxInput> = {
  title: 'Components/Input',
  component: 'px-input',
  args: {
    label: 'Name',
    value: '',
    placeholder: '',
    maxlength: 0,
    type: 'text',
    uppercase: false,
    showCount: false,
    disabled: false,
    readonly: false,
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['text', 'password'] },
  },
  render: (args) => html`
    <div style="width: 280px">
      <px-input
        label=${args.label}
        value=${args.value}
        placeholder=${args.placeholder}
        maxlength=${args.maxlength}
        type=${args.type}
        ?uppercase=${args.uppercase}
        ?show-count=${args.showCount}
        ?disabled=${args.disabled}
        ?readonly=${args.readonly}
      ></px-input>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxInput>;

export const Default: Story = {};

/** Arcade name entry: three characters, folded to caps as you type. */
export const NameEntry: Story = {
  args: { label: 'Enter name', maxlength: 3, uppercase: true, showCount: true, placeholder: 'AAA' },
};

/** The counter needs a `maxlength` to count against. */
export const WithCount: Story = {
  args: { label: 'Save as', maxlength: 12, showCount: true, value: 'Slot one' },
};

export const Password: Story = { args: { label: 'Code', type: 'password', value: 'hunter2' } };

export const Disabled: Story = { args: { label: 'Seed', value: 'locked', disabled: true } };

export const ReadOnly: Story = { args: { label: 'Seed', value: '8675309', readonly: true } };

/** Just the field, where the label lives somewhere else. */
export const NoLabel: Story = {
  args: { hideLabel: true, placeholder: 'Search items…' },
};

/** What it is actually for: a little form on a panel. */
export const OnAPanel: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="New game">
        <div style="display: grid; gap: 12px">
          <px-input label="Name" maxlength="8" uppercase show-count placeholder="LINK"></px-input>
          <px-input label="Seed" placeholder="random"></px-input>
        </div>
        <px-button slot="footer" size="sm" variant="secondary">Back</px-button>
        <px-button slot="footer" size="sm">Start</px-button>
      </px-panel>
    </div>
  `,
};
