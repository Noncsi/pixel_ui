import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-dialog.js';
import '../button/px-button.js';
import type { PxDialog } from './px-dialog.js';

/** Find the dialog beside the button that was pressed. */
function dialogFor(event: Event) {
  const root = (event.target as HTMLElement).closest('.demo');
  return root?.querySelector('px-dialog') ?? null;
}

const meta: Meta<PxDialog> = {
  title: 'Components/Dialog',
  component: 'px-dialog',
  args: {
    label: 'Save game?',
    hideLabel: false,
    noDismiss: false,
  },
  render: (args) => html`
    <div class="demo">
      <px-button size="sm" @click=${(event: Event) => dialogFor(event)?.show()}>
        Open dialog
      </px-button>

      <px-dialog label=${args.label} ?hide-label=${args.hideLabel} ?no-dismiss=${args.noDismiss}>
        Overwrite slot 1? The save there is from two hours ago.

        <px-button
          slot="footer"
          size="sm"
          variant="secondary"
          @click=${(event: Event) => dialogFor(event)?.close('no')}
        >
          Cancel
        </px-button>
        <px-button
          slot="footer"
          size="sm"
          @click=${(event: Event) => dialogFor(event)?.close('yes')}
        >
          Save
        </px-button>
      </px-dialog>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxDialog>;

/** Escape and a click on the backdrop both dismiss it. */
export const Default: Story = {};

/** `no-dismiss`: no Escape, no backdrop click. It has to be answered. */
export const MustBeAnswered: Story = {
  args: { label: 'Really quit?', noDismiss: true },
  render: (args) => html`
    <div class="demo">
      <px-button size="sm" variant="danger" @click=${(event: Event) => dialogFor(event)?.show()}>
        Quit
      </px-button>

      <px-dialog label=${args.label} no-dismiss>
        You have unsaved progress. Everything since the last save will be lost.

        <px-button
          slot="footer"
          size="sm"
          variant="secondary"
          @click=${(event: Event) => dialogFor(event)?.close('stay')}
        >
          Stay
        </px-button>
        <px-button
          slot="footer"
          size="sm"
          variant="danger"
          @click=${(event: Event) => dialogFor(event)?.close('quit')}
        >
          Quit
        </px-button>
      </px-dialog>
    </div>
  `,
};

/** No footer at all: the gap under the body goes with it. */
export const MessageOnly: Story = {
  render: () => html`
    <div class="demo">
      <px-button size="sm" @click=${(event: Event) => dialogFor(event)?.show()}>
        Read the sign
      </px-button>

      <px-dialog label="A weathered sign">
        "CAVES TO THE NORTH. DO NOT." The rest has worn away.
      </px-dialog>
    </div>
  `,
};

/** Wider, for a shop or an inventory screen. */
export const Wide: Story = {
  render: () => html`
    <div class="demo">
      <px-button size="sm" @click=${(event: Event) => dialogFor(event)?.show()}>
        Open shop
      </px-button>

      <px-dialog label="General store" style="--px-dialog-width: 420px">
        Everything here is overpriced and you know it. The shopkeeper knows it too.

        <px-button slot="footer" size="sm" @click=${(event: Event) => dialogFor(event)?.close('')}>
          Leave
        </px-button>
      </px-dialog>
    </div>
  `,
};
