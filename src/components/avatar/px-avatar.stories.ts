import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-avatar.js';
import '../panel/px-panel.js';
import '../health-bar/px-health-bar.js';
import type { PxAvatar } from './px-avatar.js';

/** A face, built here so the stories need no files of their own. */
const FACE = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges">
    <rect width="8" height="8" fill="#1a1c2c"/>
    <rect x="1" y="1" width="6" height="6" fill="#94b0c2"/>
    <rect x="1" y="1" width="6" height="2" fill="#f4f4f4"/>
    <rect x="2" y="4" width="1" height="1" fill="#1a1c2c"/>
    <rect x="5" y="4" width="1" height="1" fill="#1a1c2c"/>
    <rect x="3" y="6" width="2" height="1" fill="#1a1c2c"/>
  </svg>`,
)}`;

const meta: Meta<PxAvatar> = {
  title: 'Components/Avatar',
  component: 'px-avatar',
  args: {
    src: FACE,
    alt: '',
    name: 'Old Man',
    size: 'md',
    status: 'none',
    statusLabel: '',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    status: { control: 'inline-radio', options: ['none', 'ok', 'warn', 'danger'] },
  },
  render: (args) => html`
    <px-avatar
      src=${args.src}
      alt=${args.alt}
      name=${args.name}
      size=${args.size}
      status=${args.status}
      status-label=${args.statusLabel}
    ></px-avatar>
  `,
};

export default meta;
type Story = StoryObj<PxAvatar>;

export const Default: Story = {};

/** No picture yet: the name's initials stand in rather than a hole. */
export const Initials: Story = { args: { src: '', name: 'Old Man' } };

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: flex-end">
      ${(['sm', 'md', 'lg'] as const).map(
        (size) => html`<px-avatar src=${FACE} name="Old Man" size=${size}></px-avatar>`,
      )}
    </div>
  `,
};

/** The pip carries the one thing a portrait is always asked to carry. */
export const Statuses: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center">
      <px-avatar src=${FACE} name="Link" status="ok" status-label="Healthy"></px-avatar>
      <px-avatar src=${FACE} name="Zelda" status="warn" status-label="Poisoned"></px-avatar>
      <px-avatar src=${FACE} name="Old Man" status="danger" status-label="Down"></px-avatar>
    </div>
  `,
};

/** Unnamed, it is decoration, and is hidden from assistive technology. */
export const Decorative: Story = { args: { name: '', alt: '' } };

/** A party list, which is what portraits are mostly for. */
export const Party: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-panel label="Party">
        <div style="display: grid; gap: 12px">
          ${(
            [
              ['Link', 'ok', 'Healthy', 86],
              ['Zelda', 'warn', 'Poisoned', 34],
              ['Old Man', 'danger', 'Down', 0],
            ] as Array<[string, 'ok' | 'warn' | 'danger', string, number]>
          ).map(
            ([name, status, statusLabel, hp]) => html`
              <div style="display: flex; gap: 12px; align-items: center">
                <px-avatar
                  src=${FACE}
                  name=${name}
                  size="sm"
                  status=${status}
                  status-label=${statusLabel}
                ></px-avatar>
                <px-health-bar
                  style="flex: 1"
                  label=${name}
                  value=${hp}
                  segments="10"
                  show-value
                ></px-health-bar>
              </div>
            `,
          )}
        </div>
      </px-panel>
    </div>
  `,
};
