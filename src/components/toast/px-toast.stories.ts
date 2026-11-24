import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-toast.js';
import './px-toast-stack.js';
import '../button/px-button.js';
import type { PxToast, ToastVariant } from './px-toast.js';
import type { ToastPlacement } from './px-toast-stack.js';

/** Find the stack this button belongs to, without hanging onto a reference. */
function stackFor(event: Event) {
  const root = (event.target as HTMLElement).closest('.demo');
  return root?.querySelector('px-toast-stack') ?? null;
}

const meta: Meta<PxToast> = {
  title: 'Components/Toast',
  component: 'px-toast',
  args: {
    variant: 'info',
    duration: 4000,
    noClose: false,
    open: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['info', 'success', 'danger'] },
  },
  render: (args) => html`
    <px-toast
      ?open=${args.open}
      variant=${args.variant}
      duration=${args.duration}
      ?no-close=${args.noClose}
    >
      Game saved
    </px-toast>
  `,
};

export default meta;
type Story = StoryObj<PxToast>;

/** One toast on its own, with the bar draining along the bottom. */
export const Default: Story = {};

export const Success: Story = { args: { variant: 'success' } };

export const Danger: Story = { args: { variant: 'danger' } };

/** `duration="0"` stays until it is dismissed. */
export const Persistent: Story = { args: { duration: 0 } };

/** All three, side by side. */
export const Variants: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px">
      <px-toast open duration="0" variant="info">Autosaving…</px-toast>
      <px-toast open duration="0" variant="success">
        <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
          <path d="M1 4h1v1H1zM2 5h1v1H2zM3 4h1v1H3zM4 3h1v1H4zM5 2h1v1H5zM6 1h1v1H6z" />
        </svg>
        Item acquired: Rusty Sword
      </px-toast>
      <px-toast open duration="0" variant="danger">You died. Again.</px-toast>
    </div>
  `,
};

/** The stack is what a game actually talks to. Press the buttons. */
export const Stack: Story = {
  render: () => html`
    <div class="demo" style="min-height: 220px">
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        ${(
          [
            ['info', 'Autosaving…'],
            ['success', 'Item acquired: Rusty Sword'],
            ['danger', 'You died. Again.'],
          ] as Array<[ToastVariant, string]>
        ).map(
          ([variant, message]) => html`
            <px-button
              size="sm"
              variant=${variant === 'info' ? 'secondary' : variant === 'danger' ? 'danger' : 'primary'}
              @click=${(event: Event) => stackFor(event)?.toast(message, { variant })}
            >
              ${variant}
            </px-button>
          `,
        )}
        <px-button
          size="sm"
          variant="secondary"
          @click=${(event: Event) => stackFor(event)?.clear()}
        >
          Clear
        </px-button>
      </div>
      <px-toast-stack placement="bottom-right" max="4"></px-toast-stack>
    </div>
  `,
};

/** Every corner and edge the stack can sit on. */
export const Placements: Story = {
  render: () => html`
    <div class="demo" style="min-height: 220px">
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        ${(
          [
            'top-left',
            'top',
            'top-right',
            'bottom-left',
            'bottom',
            'bottom-right',
          ] as ToastPlacement[]
        ).map(
          (placement) => html`
            <px-button
              size="sm"
              variant="secondary"
              @click=${(event: Event) => {
                const stack = stackFor(event);
                if (!stack) return;
                stack.placement = placement;
                stack.toast(placement, { duration: 2500 });
              }}
            >
              ${placement}
            </px-button>
          `,
        )}
      </div>
      <px-toast-stack></px-toast-stack>
    </div>
  `,
};
