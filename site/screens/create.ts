import { html } from 'lit';
import type { Screen } from './types.js';

export const create: Screen = {
  id: 'create',
  name: 'New game',
  caption:
    'Thirty options and one preview that is the point of them. Every option is drawn rather than named, and every option is also named, because a grid of twenty coloured squares is unusable without words.',
  size: 'sm',
  uses: ['px-panel', 'px-input', 'px-character-creator', 'px-button', 'px-notice'],

  render() {
    return html`
      <px-panel label="Create your character">
        <div class="stack">
          <px-input label="Name" value="Noemi" maxlength="12" show-count data-name></px-input>
          <px-character-creator label="Appearance" hair="2" hair-color="6" data-look>
          </px-character-creator>
          <px-notice data-notice no-mark>
            Pick something. The preview updates on the same frame as the click.
          </px-notice>
        </div>
        <px-button slot="footer" size="sm" variant="secondary" data-roll>Surprise me</px-button>
        <px-button slot="footer" size="sm" data-begin>Begin</px-button>
      </px-panel>
    `;
  },

  mount(root) {
    const look = root.querySelector('[data-look]') as (HTMLElement & { randomize(): void }) | null;
    const notice = root.querySelector('[data-notice]');
    const name = root.querySelector('[data-name]') as (HTMLElement & { value: string }) | null;
    if (!look || !notice) return;

    look.addEventListener('px-character-change', (event) => {
      const detail = (event as CustomEvent<{ hairName: string; hairColorName: string }>).detail;
      notice.textContent = `${detail.hairName}, ${detail.hairColorName.toLowerCase()}.`;
    });

    root.querySelector('[data-roll]')?.addEventListener('click', () => look.randomize());

    root.querySelector('[data-begin]')?.addEventListener('click', () => {
      const who = name?.value.trim() || 'Nameless';
      notice.setAttribute('variant', 'success');
      notice.textContent = `${who} sets out. There is still no game behind it.`;
    });
  },
};
