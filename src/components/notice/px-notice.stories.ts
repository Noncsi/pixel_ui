import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-notice.js';
import '../button/px-button.js';
import type { PxNotice } from './px-notice.js';

const meta: Meta<PxNotice> = {
  title: 'Components/Notice',
  component: 'px-notice',
  args: {
    variant: 'info',
    heading: '',
    live: 'off',
    dismissible: false,
    open: true,
    noMark: false,
  },
  render: (args) => html`
    <div style="width: 320px">
      <px-notice
        variant=${args.variant}
        heading=${args.heading}
        live=${args.live}
        ?dismissible=${args.dismissible}
        ?open=${args.open}
        ?no-mark=${args.noMark}
      >
        The connection to the server was lost. Your progress is saved locally.
      </px-notice>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxNotice>;

/** A state that holds, sitting in the layout where it can be reread. */
export const Default: Story = {};

/** All four. The warning is the one `<px-toast>` does not have. */
export const Variants: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px; width: 320px">
      <px-notice>Autosave is on. The game saves when you change area.</px-notice>
      <px-notice variant="success">Your save was uploaded to the cloud.</px-notice>
      <px-notice variant="warning">
        This save is from an older version. Some quests may not continue.
      </px-notice>
      <px-notice variant="danger">No connection. Cloud saves are paused.</px-notice>
    </div>
  `,
};

/** A heading for a notice that needs a name before its explanation. */
export const WithHeading: Story = {
  args: { heading: 'No connection', variant: 'danger' },
};

/** The `actions` slot, for a notice you can do something about. */
export const WithActions: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-notice variant="warning" heading="Older save">
        This save is from version 0.8. Loading it will convert it, and it will not open in 0.8
        again.
        <px-button slot="actions" size="sm">Convert and load</px-button>
        <px-button slot="actions" size="sm" variant="secondary">Cancel</px-button>
      </px-notice>
    </div>
  `,
};

/** Dismissible, for something the player can acknowledge and move past. */
export const Dismissible: Story = {
  args: { dismissible: true, variant: 'success', heading: 'New area unlocked' },
};

/** `live` only matters for a notice that arrives after the page did. */
export const AnnouncedOnArrival: Story = {
  render: () => {
    const show = (event: Event) => {
      const root = (event.currentTarget as Element).closest('div');
      const notice = root?.querySelector<PxNotice>('px-notice');
      if (!notice) return;
      notice.show();
    };

    return html`
      <div style="display: grid; gap: 12px; width: 320px">
        <px-button size="sm" @click=${show}>Lose the connection</px-button>
        <px-notice variant="danger" live="assertive" dismissible ?open=${false}>
          No connection. Cloud saves are paused.
        </px-notice>
        <p style="font-size: 8px; color: var(--px-color-text-muted); line-height: 1.8">
          This one is an alert because it arrives. A notice that was on the page all along is read
          in order like any other text, and is not a live region at all.
        </p>
      </div>
    `;
  },
};

/** `no-mark` for somewhere the glyph is noise. */
export const WithoutTheGlyph: Story = { args: { noMark: true } };

/** `--px-notice-color` overrides the variant's accent. */
export const Restyled: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-notice style="--px-notice-color: var(--px-color-mana)" heading="Mana">
        Spells cost twice as much in here.
      </px-notice>
    </div>
  `,
};
