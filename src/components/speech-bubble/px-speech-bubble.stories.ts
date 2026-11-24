import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-speech-bubble.js';
import '../avatar/px-avatar.js';
import type { PxSpeechBubble } from './px-speech-bubble.js';

const meta: Meta<PxSpeechBubble> = {
  title: 'Components/Speech bubble',
  component: 'px-speech-bubble',
  args: {
    placement: 'bottom',
    align: 'center',
    speaker: '',
    noTail: false,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  render: (args) => html`
    <div style="padding: 40px">
      <px-speech-bubble
        placement=${args.placement}
        align=${args.align}
        speaker=${args.speaker}
        ?no-tail=${args.noTail}
      >
        It is dangerous to go alone! Take this.
      </px-speech-bubble>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxSpeechBubble>;

/** The tail points at whoever is talking: `placement` is the side it leaves from. */
export const Default: Story = {};

export const WithSpeaker: Story = { args: { speaker: 'Old man' } };

/** All four sides. */
export const Placements: Story = {
  render: () => html`
    <div
      style="padding: 48px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px; justify-items: center"
    >
      ${(['top', 'bottom', 'left', 'right'] as const).map(
        (placement) => html`
          <px-speech-bubble placement=${placement}>Tail on the ${placement}.</px-speech-bubble>
        `,
      )}
    </div>
  `,
};

/** And anywhere along the side, for a bubble that sits off to one edge. */
export const Alignments: Story = {
  render: () => html`
    <div style="padding: 40px; display: grid; gap: 40px; justify-items: start">
      ${(['start', 'center', 'end'] as const).map(
        (align) => html`
          <px-speech-bubble align=${align}>Tail at the ${align}.</px-speech-bubble>
        `,
      )}
    </div>
  `,
};

/** No tail at all, for a sign or a caption. */
export const NoTail: Story = {
  args: { noTail: true },
  render: () => html`
    <div style="padding: 24px">
      <px-speech-bubble no-tail>
        "CAVES TO THE NORTH. DO NOT." The rest has worn away.
      </px-speech-bubble>
    </div>
  `,
};

/** Over a character's head, which is what it is for. */
export const OverACharacter: Story = {
  render: () => html`
    <div style="padding: 24px; display: grid; gap: 8px; justify-items: center; width: 220px">
      <px-speech-bubble speaker="Old man" placement="bottom">
        It is dangerous to go alone!
      </px-speech-bubble>
      <px-avatar name="Old Man" size="lg"></px-avatar>
    </div>
  `,
};
