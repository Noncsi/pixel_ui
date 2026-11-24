import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-counter.js';
import '../button/px-button.js';
import '../panel/px-panel.js';
import type { PxCounter } from './px-counter.js';

/** Find the counter beside the button that was pressed. */
function counterFor(event: Event) {
  const root = (event.target as HTMLElement).closest('.demo');
  return root?.querySelector('px-counter') ?? null;
}

const meta: Meta<PxCounter> = {
  title: 'Components/Counter',
  component: 'px-counter',
  args: {
    value: 250,
    duration: 600,
    pad: 0,
    separator: '',
    prefix: '',
    label: 'Gold',
  },
  render: (args) => html`
    <div class="demo" style="display: grid; gap: 16px; justify-items: start">
      <px-counter
        value=${args.value}
        duration=${args.duration}
        pad=${args.pad}
        separator=${args.separator}
        prefix=${args.prefix}
        label=${args.label}
      ></px-counter>
      <px-button
        size="sm"
        @click=${(event: Event) => {
          const counter = counterFor(event);
          if (counter) counter.value += Math.ceil(Math.random() * 400);
        }}
      >
        Win some gold
      </px-button>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxCounter>;

/** Press the button: it counts up from where it was, easing out. */
export const Default: Story = {};

/** Zero-padded, the way an arcade score board does it. */
export const Padded: Story = { args: { value: 1250, pad: 8, label: 'Score' } };

/** Grouped thousands, for a number that gets big. */
export const Grouped: Story = { args: { value: 1234567, separator: ',', label: 'Score' } };

/** A prefix for a count or a currency. */
export const WithPrefix: Story = { args: { value: 42, prefix: '×', label: 'Potions' } };

/** A long roll, so the easing is easy to see. */
export const SlowRoll: Story = { args: { value: 0, duration: 2500, label: 'Gold' } };

/** `duration="0"` skips the roll, as `prefers-reduced-motion` does. */
export const NoRoll: Story = { args: { duration: 0 } };

/** The end of a battle, which is what this is for. */
export const BattleResults: Story = {
  render: () => html`
    <div class="demo" style="width: 280px">
      <px-panel label="Victory">
        <div style="display: grid; gap: 12px">
          ${(
            [
              ['Gold', 1240, '', ','],
              ['XP', 580, '', ''],
              ['Score', 97500, '', ','],
            ] as Array<[string, number, string, string]>
          ).map(
            ([label, value, prefix, separator]) => html`
              <div style="display: flex; justify-content: space-between; align-items: baseline">
                <span style="font-size: 8px; text-transform: uppercase">${label}</span>
                <px-counter
                  value=${value}
                  duration="1200"
                  prefix=${prefix}
                  separator=${separator}
                  label=${label}
                ></px-counter>
              </div>
            `,
          )}
        </div>
      </px-panel>
    </div>
  `,
};
