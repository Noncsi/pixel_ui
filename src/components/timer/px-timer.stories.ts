import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-timer.js';
import '../button/px-button.js';
import '../panel/px-panel.js';
import type { PxTimer } from './px-timer.js';

/** Find the timer beside the button that was pressed. */
function timerFor(event: Event) {
  const root = (event.target as HTMLElement).closest('.demo');
  return root?.querySelector('px-timer') ?? null;
}

const meta: Meta<PxTimer> = {
  title: 'Components/Timer',
  component: 'px-timer',
  args: {
    value: 30,
    running: false,
    direction: 'down',
    warnAt: 10,
    label: 'Time left',
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['down', 'up'] },
  },
  render: (args) => html`
    <div class="demo" style="display: grid; gap: 16px; justify-items: start">
      <px-timer
        value=${args.value}
        ?running=${args.running}
        direction=${args.direction}
        warn-at=${args.warnAt}
        label=${args.label}
      ></px-timer>
      <div style="display: flex; gap: 8px">
        <px-button size="sm" @click=${(event: Event) => timerFor(event)?.start()}>Start</px-button>
        <px-button
          size="sm"
          variant="secondary"
          @click=${(event: Event) => timerFor(event)?.pause()}
        >
          Pause
        </px-button>
        <px-button
          size="sm"
          variant="secondary"
          @click=${(event: Event) => timerFor(event)?.reset(30)}
        >
          Reset
        </px-button>
      </div>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxTimer>;

/** Press Start. Under ten seconds it turns urgent and starts pulsing. */
export const Default: Story = {};

/** Already urgent, so the warning state is easy to look at. */
export const Warning: Story = { args: { value: 8 } };

/** Counting up, for a run timer. It never warns. */
export const CountingUp: Story = { args: { value: 0, direction: 'up', label: 'Time' } };

/** Long enough to need hours. */
export const WithHours: Story = { args: { value: 3725, warnAt: 0, label: 'Played' } };

/** No warning state at all. */
export const NoWarning: Story = { args: { value: 15, warnAt: 0 } };

/** Where a timer usually lives: on the thing it is timing. */
export const OnAPanel: Story = {
  render: () => html`
    <div class="demo" style="width: 280px">
      <px-panel label="Boss">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <span style="font-size: 8px; text-transform: uppercase">Enrage in</span>
          <px-timer value="12" warn-at="10" label="Enrage in" running></px-timer>
        </div>
        <px-button
          slot="footer"
          size="sm"
          @click=${(event: Event) => {
            const timer = timerFor(event);
            timer?.reset(12);
            timer?.start();
          }}
        >
          Again
        </px-button>
      </px-panel>
    </div>
  `,
};
