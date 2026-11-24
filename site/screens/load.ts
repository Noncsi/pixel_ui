import { html } from 'lit';
import { face } from './art.js';
import type { Screen } from './types.js';

export const load: Screen = {
  id: 'load',
  name: 'Load game',
  caption:
    'Each row is one button, named as one sentence: "Slot 1: Noemi, level 12, Dark Forest, 4 hours 12 minutes". The playtime is spelled out in words, because a screen reader says 4:12 as a time of day.',
  size: 'md',
  uses: ['px-panel', 'px-save-slot', 'px-notice', 'px-spinner', 'px-button', 'px-dialog'],

  render() {
    return html`
      <px-panel label="Load game">
        <div class="stack" data-slots>
          <px-save-slot
            slot-number="1"
            name="Noemi"
            level="12"
            location="Dark Forest"
            playtime="15132"
            saved="12 Nov, 21:04"
            selected
          >
            ${face('#e8b796', '#c05a28')}
          </px-save-slot>
          <px-save-slot
            slot-number="2"
            name="Noemi"
            level="4"
            location="Village well"
            playtime="2640"
            saved="9 Nov, 18:22"
          >
            ${face('#e8b796', '#41a6f6')}
          </px-save-slot>
          <px-save-slot slot-number="3" empty></px-save-slot>
        </div>

        <px-notice data-warning variant="warning" heading="Older save" hidden>
          Slot 2 is from version 0.8. Loading it will convert it.
        </px-notice>

        <div class="row" slot="footer">
          <span class="row" data-loading hidden>
            <px-spinner style="--px-spinner-size: 16px" label="Loading the save"></px-spinner>
            <span class="small">Loading…</span>
          </span>
          <px-button size="sm" variant="danger" data-delete>Delete</px-button>
          <px-button size="sm" data-load>Load</px-button>
        </div>
      </px-panel>

      <px-dialog label="Delete this save?" data-confirm>
        Slot 1 has four hours in it. This cannot be undone.
        <px-button slot="footer" size="sm" variant="secondary" data-answer="keep">Keep</px-button>
        <px-button slot="footer" size="sm" variant="danger" data-answer="delete">Delete</px-button>
      </px-dialog>
    `;
  },

  mount(root) {
    type Slot = HTMLElement & { selected: boolean; slotNumber: number; empty: boolean };
    const slots = [...root.querySelectorAll<Slot>('px-save-slot')];
    const warning = root.querySelector('[data-warning]') as HTMLElement | null;
    const loading = root.querySelector('[data-loading]') as HTMLElement | null;
    const loadButton = root.querySelector('[data-load]') as
      (HTMLElement & { disabled: boolean }) | null;
    const dialog = root.querySelector('[data-confirm]') as
      (HTMLElement & { show(): void; close(value?: string): void }) | null;

    const chosen = () => slots.find((slot) => slot.selected);
    const sync = () => {
      const slot = chosen();
      if (warning) warning.hidden = slot?.slotNumber !== 2;
      if (loadButton) loadButton.disabled = !slot || slot.empty;
    };

    root.querySelector('[data-slots]')?.addEventListener('px-save-slot-select', (event) => {
      for (const slot of slots) slot.selected = slot === event.target;
      sync();
    });
    sync();

    root.querySelector('[data-load]')?.addEventListener('click', () => {
      const slot = chosen();
      if (!slot || slot.empty || !loading || !loadButton) return;

      loading.hidden = false;
      loadButton.disabled = true;
      window.setTimeout(() => {
        loading.hidden = true;
        loadButton.disabled = false;
      }, 1400);
    });

    root.querySelector('[data-delete]')?.addEventListener('click', () => dialog?.show());
    for (const button of root.querySelectorAll<HTMLElement>('[data-answer]')) {
      button.addEventListener('click', () => dialog?.close(button.dataset.answer));
    }
  },
};
