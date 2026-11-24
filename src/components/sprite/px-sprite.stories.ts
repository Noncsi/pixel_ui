import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-sprite.js';
import '../button/px-button.js';
import '../panel/px-panel.js';
import type { PxSprite } from './px-sprite.js';

/**
 * A six-frame spinning coin, 16px per frame, built here so the stories need
 * no files of their own.
 */
const COIN_WIDTHS = [10, 8, 6, 2, 6, 8];
const COIN = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="16" shape-rendering="crispEdges">${COIN_WIDTHS.map(
    (width, i) =>
      `<rect x="${i * 16 + (16 - width) / 2}" y="3" width="${width}" height="10" fill="#ffcd75"/>`,
  ).join('')}</svg>`,
)}`;

const meta: Meta<PxSprite> = {
  title: 'Components/Sprite',
  component: 'px-sprite',
  args: {
    src: COIN,
    frameWidth: 16,
    frameHeight: 16,
    frames: 6,
    row: 0,
    fps: 8,
    scale: 3,
    paused: false,
    once: false,
    label: 'A spinning coin',
  },
  render: (args) => html`
    <px-sprite
      src=${args.src}
      frame-width=${args.frameWidth}
      frame-height=${args.frameHeight}
      frames=${args.frames}
      row=${args.row}
      fps=${args.fps}
      scale=${args.scale}
      ?paused=${args.paused}
      ?once=${args.once}
      label=${args.label}
    ></px-sprite>
  `,
};

export default meta;
type Story = StoryObj<PxSprite>;

/** One CSS animation stepping across the sheet — no frame loop to fall behind. */
export const Default: Story = {};

export const Paused: Story = { args: { paused: true } };

/** Faster and slower, side by side. */
export const FrameRates: Story = {
  render: () => html`
    <div style="display: flex; gap: 24px; align-items: center">
      ${[2, 8, 24].map(
        (fps) => html`
          <div style="display: grid; gap: 8px; justify-items: center; font-size: 8px">
            <px-sprite
              src=${COIN}
              frame-width="16"
              frame-height="16"
              frames="6"
              fps=${fps}
              scale="3"
            ></px-sprite>
            <span>${fps} fps</span>
          </div>
        `,
      )}
    </div>
  `,
};

/** Scaling sizes the artwork, so the element really takes up the room it draws. */
export const Scales: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; align-items: flex-end">
      ${[1, 2, 4, 6].map(
        (scale) => html`
          <px-sprite
            src=${COIN}
            frame-width="16"
            frame-height="16"
            frames="6"
            scale=${scale}
          ></px-sprite>
        `,
      )}
    </div>
  `,
};

/** Press to play it through once and stop on the last frame. */
export const PlayOnce: Story = {
  render: () => html`
    <div class="demo" style="display: grid; gap: 16px; justify-items: start">
      <px-sprite
        src=${COIN}
        frame-width="16"
        frame-height="16"
        frames="6"
        fps="6"
        scale="3"
        once
        label="A coin, flipped once"
      ></px-sprite>
      <px-button
        size="sm"
        @click=${(event: Event) => {
          const root = (event.target as HTMLElement).closest('.demo');
          const sprite = root?.querySelector('px-sprite');
          if (!sprite) return;
          // Re-creating the element is what restarts a finished animation.
          const fresh = sprite.cloneNode(true);
          sprite.replaceWith(fresh);
        }}
      >
        Flip again
      </px-button>
    </div>
  `,
};

/** On a save slot, which is mostly what animated art is for. */
export const OnASaveSlot: Story = {
  render: () => html`
    <div style="width: 280px">
      <px-panel label="Slot 1">
        <div style="display: flex; gap: 12px; align-items: center">
          <px-sprite
            src=${COIN}
            frame-width="16"
            frame-height="16"
            frames="6"
            scale="3"
          ></px-sprite>
          <div style="display: grid; gap: 6px; font-size: 8px">
            <span>LINK — LEVEL 7</span>
            <span style="color: var(--px-color-text-muted)">12:48 PLAYED</span>
          </div>
        </div>
      </px-panel>
    </div>
  `,
};
