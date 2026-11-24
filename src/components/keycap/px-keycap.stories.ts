import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-keycap.js';
import '../panel/px-panel.js';
import type { PxKeycap } from './px-keycap.js';

const meta: Meta<PxKeycap> = {
  title: 'Components/Keycap',
  component: 'px-keycap',
  args: {
    device: 'keyboard',
    size: 'sm',
    pressed: false,
    label: '',
  },
  argTypes: {
    device: { control: 'inline-radio', options: ['keyboard', 'gamepad'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  render: (args) => html`
    <px-keycap device=${args.device} size=${args.size} ?pressed=${args.pressed} label=${args.label}>
      W
    </px-keycap>
  `,
};

export default meta;
type Story = StoryObj<PxKeycap>;

export const Default: Story = {};

/** Held down: the lit edge moves to the bottom and the legend drops a pixel. */
export const Pressed: Story = { args: { pressed: true } };

/** A controller button is the rounded octagon it actually is. */
export const Gamepad: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; align-items: center">
      ${['A', 'B', 'X', 'Y'].map(
        (button) =>
          html`<px-keycap device="gamepad" label="${button} button"> ${button} </px-keycap>`,
      )}
    </div>
  `,
};

/** Both shapes, side by side. */
export const BothDevices: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center">
      <px-keycap>Esc</px-keycap>
      <px-keycap device="gamepad" label="B button">B</px-keycap>
    </div>
  `,
};

/** What it is actually for: a line of prompts. */
export const InASentence: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; font-size: 8px; line-height: 2.4">
      <div>
        <px-keycap>W</px-keycap>
        <px-keycap>A</px-keycap>
        <px-keycap>S</px-keycap>
        <px-keycap>D</px-keycap>
        to move
      </div>
      <div>Press <px-keycap label="Space bar">Space</px-keycap> to jump</div>
      <div>Hold <px-keycap device="gamepad" label="A button">A</px-keycap> to run</div>
    </div>
  `,
};

/** A remapping screen: the legends are whatever the game has bound. */
export const Controls: Story = {
  render: () => html`
    <div style="width: 280px">
      <px-panel label="Controls">
        <div style="display: grid; gap: 10px">
          ${(
            [
              ['Move', ['W', 'A', 'S', 'D']],
              ['Jump', ['Space']],
              ['Attack', ['J']],
              ['Menu', ['Esc']],
            ] as Array<[string, string[]]>
          ).map(
            ([action, keys]) => html`
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span style="text-transform: uppercase">${action}</span>
                <span style="display: flex; gap: 4px">
                  ${keys.map((key) => html`<px-keycap>${key}</px-keycap>`)}
                </span>
              </div>
            `,
          )}
        </div>
      </px-panel>
    </div>
  `,
};

/** `--px-keycap-color` re-skins a cap, for a key that is bound or clashing. */
export const Recoloured: Story = {
  render: () => html`
    <div style="display: flex; gap: 8px; align-items: center">
      <px-keycap style="--px-keycap-color: var(--px-color-accent)">J</px-keycap>
      <px-keycap style="--px-keycap-color: var(--px-color-danger)">K</px-keycap>
    </div>
  `,
};
