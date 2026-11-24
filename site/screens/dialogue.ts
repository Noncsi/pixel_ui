import { html } from 'lit';
import { face } from './art.js';
import type { Screen } from './types.js';

interface Line {
  speaker: string;
  text: string;
  choices?: string[];
}

const SCRIPT: Line[] = [
  { speaker: 'Old man', text: 'It is dangerous to go alone! Take this.' },
  { speaker: 'You', text: '...a stick?' },
  { speaker: 'Old man', text: 'It is a weapon. I am being supportive.' },
  {
    speaker: 'Old man',
    text: 'Well? Are you taking it or not?',
    choices: ['Take the stick', 'Ask about the well'],
  },
  { speaker: 'You', text: 'Fine. Thank you for the stick.' },
];

export const dialogue: Screen = {
  id: 'dialogue',
  name: 'Dialogue',
  caption:
    'Typed a character at a time, with a longer pause after a full stop. Clicking once finishes the line instead of skipping it, and the line is announced once when it lands rather than sixty times while it types.',
  size: 'md',
  uses: [
    'px-dialogue-box',
    'px-speech-bubble',
    'px-avatar',
    'px-button',
    'px-segmented',
    'px-segment',
  ],

  render() {
    return html`
      <div class="stack">
        <div class="bubble-row">
          <px-speech-bubble data-bark speaker="Old man" placement="bottom">
            Hey! Over here.
          </px-speech-bubble>
          <px-avatar name="Old Man" size="lg"></px-avatar>
        </div>

        <px-dialogue-box data-box speaker="Old man">
          ${face('#94b0c2', '#f4f4f4')}
        </px-dialogue-box>

        <px-segmented label="Text speed" value="normal" full-width data-speed>
          <px-segment value="slow">Slow</px-segment>
          <px-segment value="normal">Normal</px-segment>
          <px-segment value="fast">Fast</px-segment>
        </px-segmented>

        <div class="row spread">
          <p class="hint" data-status>Click the box, or press Enter, to go on.</p>
          <px-button size="sm" variant="secondary" data-restart>Start over</px-button>
        </div>
      </div>
    `;
  },

  mount(root) {
    type Box = HTMLElement & { text: string; speaker: string; speed: number };
    const box = root.querySelector<Box>('[data-box]');
    const bark = root.querySelector('[data-bark]');
    const status = root.querySelector('[data-status]');
    if (!box) return;

    let index = -1;

    const clearChoices = () => {
      for (const old of box.querySelectorAll('[slot="choices"]')) old.remove();
    };

    const say = (next: number) => {
      index = next % SCRIPT.length;
      const line = SCRIPT[index] as Line;

      clearChoices();
      box.speaker = line.speaker;
      box.text = line.text;

      for (const label of line.choices ?? []) {
        const button = document.createElement('px-button');
        button.setAttribute('slot', 'choices');
        button.setAttribute('size', 'sm');
        button.textContent = label;
        button.addEventListener('click', () => {
          if (bark) bark.textContent = `"${label}" — and the story moves on.`;
          say(index + 1);
        });
        box.append(button);
      }
    };

    root.querySelector('[data-restart]')?.addEventListener('click', () => {
      if (bark) bark.textContent = 'Hey! Over here.';
      say(0);
    });

    box.addEventListener('px-dialogue-advance', () => say(index + 1));
    box.addEventListener('px-typing-end', (event) => {
      const { skipped } = (event as CustomEvent<{ skipped: boolean }>).detail;
      if (status) {
        status.textContent = skipped
          ? 'px-typing-end fired with skipped: true — the click finished the line rather than skipping it.'
          : 'px-typing-end fired. The finished line is announced once, here.';
      }
    });

    root.querySelector('[data-speed]')?.addEventListener('px-segmented-change', (event) => {
      const { value } = (event as CustomEvent<{ value: string }>).detail;
      box.speed = value === 'slow' ? 12 : value === 'fast' ? 90 : 30;
    });

    say(0);
  },
};
