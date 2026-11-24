import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-character-creator.js';
import '../button/px-button.js';
import '../input/px-input.js';
import '../notice/px-notice.js';
import '../panel/px-panel.js';
import type { CharacterChangeEventDetail, PxCharacterCreator } from './px-character-creator.js';

const meta: Meta<PxCharacterCreator> = {
  title: 'Components/Character creator',
  component: 'px-character-creator',
  args: {
    hair: 1,
    hairColor: 2,
    label: 'Create your character',
    disabled: false,
    hidePreview: false,
  },
  render: (args) => html`
    <div style="width: 320px">
      <px-character-creator
        hair=${args.hair}
        hair-color=${args.hairColor}
        label=${args.label}
        ?disabled=${args.disabled}
        ?hide-preview=${args.hidePreview}
      ></px-character-creator>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxCharacterCreator>;

/** Three choices, thirty-two options, one preview that is the point of them. */
export const Default: Story = {};

/** Every option is drawn, so the picker shows what you are going to get. */
export const Chosen: Story = {
  args: { hair: 8, hairColor: 15 },
};

/** The ten silhouettes, told apart at a glance rather than by number. */
export const EveryHairstyle: Story = {
  render: () => html`
    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; width: 340px">
      ${Array.from(
        { length: 10 },
        (_, index) => html`
          <px-character-creator
            hide-preview
            hair=${index + 1}
            hair-color="6"
            style="--px-character-size: 56px"
          ></px-character-creator>
        `,
      )}
    </div>
  `,
};

/** Rolled from script with `randomize()`. */
export const Random: Story = {
  render: () => {
    const roll = (event: Event) => {
      const root = (event.currentTarget as Element).closest('div');
      root?.querySelector<PxCharacterCreator>('px-character-creator')?.randomize();
    };

    return html`
      <div style="display: grid; gap: 12px; width: 320px; justify-items: center">
        <px-character-creator label="Create your character"></px-character-creator>
        <px-button size="sm" @click=${roll}>Surprise me</px-button>
      </div>
    `;
  },
};

/** The whole screen it belongs on. */
export const NewGameScreen: Story = {
  render: () => {
    const describe = (event: CustomEvent<CharacterChangeEventDetail>) => {
      const root = (event.currentTarget as Element).closest('px-panel');
      const out = root?.querySelector('[data-summary]');
      if (out) out.textContent = `${event.detail.hairName}, ${event.detail.hairColorName}`;
    };

    return html`
      <div style="width: 340px">
        <px-panel label="New game">
          <div style="display: grid; gap: 16px" @px-character-change=${describe}>
            <px-input label="Name" value="Noemi" placeholder="Who are you?"></px-input>
            <px-character-creator label="Appearance"></px-character-creator>
            <p
              data-summary
              style="margin: 0; text-align: center; color: var(--px-color-text-muted)"
            >
              Buzz, Dark brown
            </p>
          </div>
          <px-button slot="footer" size="sm" variant="secondary">Back</px-button>
          <px-button slot="footer" size="sm">Begin</px-button>
        </px-panel>
      </div>
    `;
  },
};

/** `--px-character-skin` and `--px-character-clothes` re-skin the body. */
export const Restyled: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px">
      <px-character-creator
        hide-preview
        hair="6"
        hair-color="1"
        style="--px-character-skin: #8d5524; --px-character-clothes: var(--px-color-danger)"
      ></px-character-creator>
      <px-character-creator
        hide-preview
        hair="2"
        hair-color="11"
        style="--px-character-skin: #f1c27d; --px-character-clothes: var(--px-color-accent)"
      ></px-character-creator>
    </div>
  `,
};

/** Bigger, for a screen that is only this. */
export const Large: Story = {
  args: { hair: 4, hairColor: 17 },
  render: (args) => html`
    <div style="width: 320px">
      <px-character-creator
        hair=${args.hair}
        hair-color=${args.hairColor}
        style="--px-character-size: 160px"
      ></px-character-creator>
    </div>
  `,
};

/** Greyed out and unresponsive. */
export const Disabled: Story = { args: { disabled: true } };
