import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-rating.js';
import '../avatar/px-avatar.js';
import '../panel/px-panel.js';
import type { PxRating } from './px-rating.js';

const meta: Meta<PxRating> = {
  title: 'Components/Rating',
  component: 'px-rating',
  args: {
    value: 3,
    max: 5,
    shape: 'star',
    label: 'Difficulty',
    readonly: false,
    disabled: false,
    allowZero: false,
  },
  render: (args) => html`
    <px-rating
      value=${args.value}
      max=${args.max}
      shape=${args.shape}
      label=${args.label}
      ?readonly=${args.readonly}
      ?disabled=${args.disabled}
      ?allow-zero=${args.allowZero}
    ></px-rating>
  `,
};

export default meta;
type Story = StoryObj<PxRating>;

/** A control: one tab stop, then the arrow keys, Home and End. */
export const Default: Story = {};

/** A picture. No focus stop, nothing to press, the reading in its name. */
export const Readonly: Story = { args: { readonly: true, label: 'Rarity', value: 4 } };

/** Hearts and diamonds, each with a hollow glyph of its own. */
export const Shapes: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px">
      <px-rating readonly value="4" label="Difficulty"></px-rating>
      <px-rating readonly value="3" shape="heart" label="Lives" unit="life" unit-plural="lives">
      </px-rating>
      <px-rating readonly value="2" shape="diamond" label="Rarity"></px-rating>
    </div>
  `,
};

/** `allow-zero` lets the row be cleared — click the last filled glyph. */
export const Clearable: Story = { args: { allowZero: true, value: 2 } };

/** None out of five is a real reading, whether or not it can be chosen. */
export const Unrated: Story = { args: { readonly: true, value: 0, label: 'Rarity' } };

/** Any length of row. A boss with ten skulls is still one focus stop. */
export const Lengths: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px">
      <px-rating readonly max="3" value="2" label="Short"></px-rating>
      <px-rating readonly max="10" value="7" label="Long"></px-rating>
    </div>
  `,
};

/** `glyph` and `empty-glyph` take a pair of your own. */
export const OwnGlyphs: Story = {
  render: () => html`
    <px-rating
      readonly
      max="4"
      value="3"
      glyph="☠"
      empty-glyph="·"
      label="Threat"
      unit="skull"
    ></px-rating>
  `,
};

/** What it is for: a thing being rated, beside the thing. */
export const InUse: Story = {
  render: () => html`
    <div style="width: 300px">
      <px-panel label="Rusty sword">
        <div style="display: flex; align-items: center; gap: 12px">
          <px-avatar label="Rusty sword" initials="RS"></px-avatar>
          <div style="display: grid; gap: 8px">
            <px-rating readonly value="1" shape="diamond" label="Rarity"></px-rating>
            <px-rating readonly value="2" label="Damage"></px-rating>
          </div>
        </div>
        <div slot="footer" style="display: flex; align-items: center; gap: 12px">
          <span style="color: var(--px-color-text-muted)">Your rating</span>
          <px-rating value="0" allow-zero label="Your rating"></px-rating>
        </div>
      </px-panel>
    </div>
  `,
};

/** `--px-rating-color` and `--px-rating-size` re-skin the row. */
export const Restyled: Story = {
  render: () => html`
    <div style="display: grid; gap: 12px">
      <px-rating readonly value="3" style="--px-rating-color: var(--px-color-mana)"></px-rating>
      <px-rating readonly value="3" shape="heart" style="--px-rating-color: var(--px-color-danger)">
      </px-rating>
      <px-rating readonly value="3" style="--px-rating-size: 28px"></px-rating>
    </div>
  `,
};

/** Greyed out and unresponsive. */
export const Disabled: Story = { args: { disabled: true } };
