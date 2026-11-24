import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-marquee.js';
import '../panel/px-panel.js';
import type { PxMarquee } from './px-marquee.js';

const LINE =
  'THANKS FOR PLAYING — PROGRAMMING: NOEMI — ART: NOEMI — MUSIC: A SINGLE LOOPING TRACK — TESTING: NOBODY';

const meta: Meta<PxMarquee> = {
  title: 'Components/Marquee',
  component: 'px-marquee',
  args: {
    speed: 30,
    direction: 'left',
    gap: 40,
    paused: false,
    noPause: false,
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['left', 'right'] },
  },
  render: (args) => html`
    <div style="width: 280px">
      <px-marquee
        speed=${args.speed}
        direction=${args.direction}
        gap=${args.gap}
        ?paused=${args.paused}
        ?no-pause=${args.noPause}
      >
        ${LINE}
      </px-marquee>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxMarquee>;

/** Hover it and it stops, because that is the one thing you want from it. */
export const Default: Story = {};

export const Paused: Story = { args: { paused: true } };

/** The other way. */
export const Rightwards: Story = { args: { direction: 'right' } };

/**
 * Speed is pixels a second, not a duration: a long line and a short one
 * crawl at the same pace rather than one tearing past.
 */
export const SameSpeedDifferentLengths: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 280px">
      <px-marquee speed="40">SHORT LINE</px-marquee>
      <px-marquee speed="40">${LINE}</px-marquee>
    </div>
  `,
};

export const Speeds: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 280px">
      ${[15, 30, 90].map(
        (speed) => html`<px-marquee speed=${speed}>${speed} PIXELS A SECOND — ${LINE}</px-marquee>`,
      )}
    </div>
  `,
};

/** It carries markup, not just words. */
export const WithMarkup: Story = {
  render: () => html`
    <div style="width: 280px">
      <px-marquee speed="40">
        <span style="color: var(--px-color-xp)">★</span>
        NEW HIGH SCORE
        <span style="color: var(--px-color-xp)">★</span>
        97,500 — NOEMI
      </px-marquee>
    </div>
  `,
};

/** A name too long for the space it is in, which is the quiet use for this. */
export const LongItemName: Story = {
  render: () => html`
    <div style="width: 180px">
      <px-panel label="Equipped">
        <px-marquee speed="20">THE ABSOLUTELY ENORMOUS SWORD OF UNREASONABLE LENGTH</px-marquee>
      </px-panel>
    </div>
  `,
};
