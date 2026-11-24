import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-scrollbox.js';
import '../panel/px-panel.js';
import '../button/px-button.js';
import type { PxScrollbox } from './px-scrollbox.js';

const LOG = [
  'Left home with a stick.',
  'Met an old man who insisted the stick was a weapon.',
  'The caves to the north are not safe. Nobody who went in came back out.',
  'Found a potion. Drank it immediately. Regretted nothing.',
  'The shopkeeper knows the prices are absurd. He does not care.',
  'Learned that the shield is for blocking, not for throwing.',
  'Still carrying the stick.',
];

const meta: Meta<PxScrollbox> = {
  title: 'Components/Scrollbox',
  component: 'px-scrollbox',
  args: {
    label: 'Quest log',
    flat: false,
  },
  render: (args) => html`
    <div style="width: 300px">
      <px-scrollbox label=${args.label} ?flat=${args.flat}>
        ${LOG.map((line) => html`<p style="margin: 0 0 12px">${line}</p>`)}
      </px-scrollbox>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxScrollbox>;

/** Scroll it: an arrow appears at whichever end has more to read. */
export const Default: Story = {};

/** Short enough to fit, so neither arrow shows. */
export const Fits: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-scrollbox label="Note">
        <p style="margin: 0">"CAVES TO THE NORTH. DO NOT." The rest has worn away.</p>
      </px-scrollbox>
    </div>
  `,
};

/** `--px-scrollbox-height` sets how tall it gets before it starts scrolling. */
export const Taller: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-scrollbox label="Quest log" style="--px-scrollbox-height: 260px">
        ${LOG.map((line) => html`<p style="margin: 0 0 12px">${line}</p>`)}
      </px-scrollbox>
    </div>
  `,
};

/** No frame, for a box that sits inside one already. */
export const Flat: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="Journal">
        <px-scrollbox flat label="Entries">
          ${LOG.map((line) => html`<p style="margin: 0 0 12px">${line}</p>`)}
        </px-scrollbox>
      </px-panel>
    </div>
  `,
};

/** A log that grows: the arrows keep up without being told to. */
export const GrowingLog: Story = {
  render: () => html`
    <div class="demo" style="width: 300px; display: grid; gap: 12px">
      <px-scrollbox label="Battle log" style="--px-scrollbox-height: 120px">
        <div class="lines">
          <p style="margin: 0 0 8px">The slime attacks. It misses.</p>
        </div>
      </px-scrollbox>
      <px-button
        size="sm"
        @click=${(event: Event) => {
          const root = (event.target as HTMLElement).closest('.demo');
          const lines = root?.querySelector('.lines');
          const box = root?.querySelector('px-scrollbox');
          if (!lines || !box) return;
          const line = document.createElement('p');
          line.style.margin = '0 0 8px';
          line.textContent = `You hit the slime for ${Math.ceil(Math.random() * 9)} damage.`;
          lines.append(line);
          box.scrollToBottom();
        }}
      >
        Attack
      </px-button>
    </div>
  `,
};
