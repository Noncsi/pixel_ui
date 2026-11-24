import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-save-slot.js';
import '../button/px-button.js';
import '../notice/px-notice.js';
import '../panel/px-panel.js';
import type { PxSaveSlot } from './px-save-slot.js';

/** A tiny portrait, so the stories need no art files. */
const face = (fill: string) => html`
  <svg viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect x="1" y="1" width="6" height="6" fill=${fill} />
    <rect x="2" y="3" width="1" height="1" fill="#0b0c14" />
    <rect x="5" y="3" width="1" height="1" fill="#0b0c14" />
    <rect x="2" y="5" width="4" height="1" fill="#0b0c14" />
  </svg>
`;

const meta: Meta<PxSaveSlot> = {
  title: 'Components/Save slot',
  component: 'px-save-slot',
  args: {
    slotNumber: 1,
    name: 'Noemi',
    level: 12,
    location: 'Dark Forest',
    playtime: 15_132,
    saved: '12 Nov, 21:04',
    empty: false,
    selected: false,
    disabled: false,
  },
  render: (args) => html`
    <div style="width: 320px">
      <px-save-slot
        slot-number=${args.slotNumber}
        name=${args.name}
        level=${args.level}
        location=${args.location}
        playtime=${args.playtime}
        saved=${args.saved}
        ?empty=${args.empty}
        ?selected=${args.selected}
        ?disabled=${args.disabled}
      >
        ${face('#38b764')}
      </px-save-slot>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxSaveSlot>;

/** One button for the whole row, named as one sentence. */
export const Default: Story = {};

/** The chosen row. `aria-current`, not `aria-pressed`. */
export const Selected: Story = { args: { selected: true } };

/** Empty, and still a button: you save into it. */
export const Empty: Story = { args: { empty: true, slotNumber: 3 } };

/** A whole load screen. */
export const LoadScreen: Story = {
  render: () => {
    const pick = (event: Event) => {
      const root = (event.currentTarget as Element).closest('px-panel');
      const chosen = event.target as PxSaveSlot;
      for (const slot of root?.querySelectorAll<PxSaveSlot>('px-save-slot') ?? []) {
        slot.selected = slot === chosen;
      }
    };

    return html`
      <div style="width: 340px">
        <px-panel label="Load game">
          <div style="display: grid; gap: 8px" @px-save-slot-select=${pick}>
            <px-save-slot
              slot-number="1"
              name="Noemi"
              level="12"
              location="Dark Forest"
              playtime="15132"
              saved="12 Nov, 21:04"
              selected
            >
              ${face('#38b764')}
            </px-save-slot>
            <px-save-slot
              slot-number="2"
              name="Noemi"
              level="4"
              location="Village well"
              playtime="2640"
              saved="9 Nov, 18:22"
            >
              ${face('#41a6f6')}
            </px-save-slot>
            <px-save-slot slot-number="3" empty></px-save-slot>
            <px-save-slot slot-number="4" empty></px-save-slot>
          </div>
          <px-button slot="footer" size="sm" variant="secondary">Back</px-button>
          <px-button slot="footer" size="sm">Load</px-button>
        </px-panel>
      </div>
    `;
  },
};

/** Short runs: the clock still reads, and the words still make sense. */
export const Playtimes: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 320px">
      <px-save-slot slot-number="1" name="Just started" location="Bedroom" playtime="20">
        ${face('#ffcd75')}
      </px-save-slot>
      <px-save-slot slot-number="2" name="An hour in" location="The well" playtime="3660">
        ${face('#ffcd75')}
      </px-save-slot>
      <px-save-slot slot-number="3" name="A long one" location="The end" playtime="356400">
        ${face('#ffcd75')}
      </px-save-slot>
    </div>
  `,
};

/** Leave out what a game does not track; the row and its name both shrink. */
export const Sparse: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 320px">
      <px-save-slot slot-number="1" name="Noemi" playtime="15132">${face('#38b764')}</px-save-slot>
      <px-save-slot name="Autosave" location="Dark Forest"></px-save-slot>
    </div>
  `,
};

/** A locked slot: out of the tab order, not just greyed out. */
export const Disabled: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 320px">
      <px-save-slot slot-number="5" empty disabled empty-text="Locked"></px-save-slot>
      <px-notice variant="warning" no-mark>Cloud slots need an account.</px-notice>
    </div>
  `,
};
