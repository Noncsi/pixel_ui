import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-divider.js';
import '../panel/px-panel.js';
import '../menu/px-menu.js';
import '../menu/px-menu-item.js';
import type { PxDivider } from './px-divider.js';

const meta: Meta<PxDivider> = {
  title: 'Components/Divider',
  component: 'px-divider',
  args: {
    label: '',
    vertical: false,
    ornament: false,
  },
  render: (args) => html`
    <div style="width: 280px">
      <p style="font-size: 8px; margin: 0">Above the line.</p>
      <px-divider label=${args.label} ?vertical=${args.vertical} ?ornament=${args.ornament}>
      </px-divider>
      <p style="font-size: 8px; margin: 0">Below it.</p>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxDivider>;

/** Two art pixels: a dark line with a lighter one under it. */
export const Default: Story = {};

/** With words, the rule breaks either side of them. */
export const Labelled: Story = { args: { label: 'Options' } };

/** Or a diamond, where the break alone is the point. */
export const Ornament: Story = { args: { ornament: true } };

/** Standing up, to divide a row. Words are left off: there is nowhere to put them. */
export const Vertical: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; font-size: 8px; height: 40px">
      <span>Gold 250</span>
      <px-divider vertical></px-divider>
      <span>Keys 3</span>
      <px-divider vertical></px-divider>
      <span>Level 7</span>
    </div>
  `,
};

/** Where it earns its place: breaking a panel into sections. */
export const InAPanel: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-panel label="Options">
        <div style="font-size: 8px">Brightness, contrast, scaling.</div>
        <px-divider label="Audio"></px-divider>
        <div style="font-size: 8px">Master, music, effects.</div>
        <px-divider label="Danger" style="--px-divider-color: var(--px-color-danger)"></px-divider>
        <div style="font-size: 8px">Delete save.</div>
      </px-panel>
    </div>
  `,
};

/** And breaking up a menu. */
export const InAMenu: Story = {
  render: () => html`
    <px-menu label="Paused" style="width: 220px">
      <px-menu-item>Continue</px-menu-item>
      <px-menu-item>Save</px-menu-item>
      <px-divider></px-divider>
      <px-menu-item>Options</px-menu-item>
      <px-menu-item value="quit">Quit</px-menu-item>
    </px-menu>
  `,
};
