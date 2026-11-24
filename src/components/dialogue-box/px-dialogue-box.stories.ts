import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-dialogue-box.js';
import type { PxDialogueBox } from './px-dialogue-box.js';
import '../button/px-button.js';

const LINE = 'It is dangerous to go alone! Take this, and mind the caves to the north.';

/** A three-colour portrait, drawn on the same 8-pixel grid as the tokens. */
const portrait = html`
  <svg slot="portrait" viewBox="0 0 8 8" shape-rendering="crispEdges">
    <rect width="8" height="8" fill="#1a1c2c" />
    <rect x="1" y="1" width="6" height="6" fill="#94b0c2" />
    <rect x="1" y="1" width="6" height="2" fill="#f4f4f4" />
    <rect x="2" y="4" width="1" height="1" fill="#1a1c2c" />
    <rect x="5" y="4" width="1" height="1" fill="#1a1c2c" />
    <rect x="3" y="6" width="2" height="1" fill="#1a1c2c" />
  </svg>
`;

const meta: Meta<PxDialogueBox> = {
  title: 'Components/Dialogue box',
  component: 'px-dialogue-box',
  args: {
    text: LINE,
    speaker: 'Old man',
    speed: 30,
    punctuationPause: 250,
  },
  argTypes: {
    speed: { control: { type: 'range', min: 5, max: 120, step: 5 } },
    punctuationPause: { control: { type: 'range', min: 0, max: 1000, step: 50 } },
  },
  render: (args) => html`
    <px-dialogue-box
      speaker=${args.speaker}
      .text=${args.text}
      .speed=${args.speed}
      .punctuationPause=${args.punctuationPause}
    ></px-dialogue-box>
  `,
};

export default meta;
type Story = StoryObj<PxDialogueBox>;

export const Typing: Story = {};

/** Without a speaker it is just a narrator's box. */
export const Narration: Story = {
  args: { speaker: '', text: 'The cave mouth breathes cold air. Something further in shifts.' },
};

export const WithPortrait: Story = {
  render: (args) => html`
    <px-dialogue-box speaker=${args.speaker} .text=${args.text} .speed=${args.speed}>
      ${portrait}
    </px-dialogue-box>
  `,
};

export const Slow: Story = { args: { speed: 8 } };

/** Choices replace the continue arrow, and clicking one is their own business. */
export const WithChoices: Story = {
  args: { speaker: 'Shopkeeper', text: 'Fifty gold for the lantern. Do we have a deal?' },
  render: (args) => html`
    <px-dialogue-box speaker=${args.speaker} .text=${args.text} .speed=${args.speed}>
      ${portrait}
      <px-button slot="choices" size="sm">Buy it</px-button>
      <px-button slot="choices" size="sm" variant="secondary">Haggle</px-button>
      <px-button slot="choices" size="sm" variant="danger">Leave</px-button>
    </px-dialogue-box>
  `,
};

/** Click the box to skip the typing, then again for the next line. */
export const Conversation: Story = {
  render: () => {
    const script: Array<{ speaker: string; text: string }> = [
      { speaker: 'Old man', text: 'It is dangerous to go alone! Take this.' },
      { speaker: 'You', text: '...a stick?' },
      { speaker: 'Old man', text: 'It is a very good stick.' },
    ];
    let index = 0;

    const next = (event: Event): void => {
      const box = event.currentTarget as PxDialogueBox;
      index = (index + 1) % script.length;
      box.speaker = script[index].speaker;
      box.text = script[index].text;
    };

    return html`
      <px-dialogue-box
        speaker=${script[0].speaker}
        .text=${script[0].text}
        @px-dialogue-advance=${next}
      >
        ${portrait}
      </px-dialogue-box>
    `;
  },
};
