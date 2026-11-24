import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface SaveSlotSelectEventDetail {
  slotNumber: number;
  empty: boolean;
}

/**
 * One row of the save or load screen: who the save belongs to, how far they
 * got, and how long it took.
 *
 * The whole row is one button, because that is the thing being chosen. An
 * empty slot is still a button — you save into it — and only `disabled`
 * takes it out of the tab order.
 *
 * The chosen row carries `aria-current`, not `aria-pressed`. A save slot is
 * not a toggle you push in and out; `aria-pressed` would have every row in
 * the list announcing "not pressed", where `aria-current` says "current" on
 * the one row it is true of and nothing on the rest.
 *
 * The interesting part is its name. Four or five scraps of text drawn in a
 * grid read fine with eyes and terribly one at a time, so the row composes
 * them into one sentence: "Slot 2: Noemi, level 12, Dark Forest, 4 hours 12
 * minutes". The drawn copies are hidden, so nothing is said twice, and the
 * playtime is spelled out in words rather than read as the clock face
 * "4:12", which a screen reader says as four twelve.
 *
 * @element px-save-slot
 *
 * @attr {number} slot-number - The number shown, from 1. 0 leaves it off.
 * @attr {string} name - Whose save it is.
 * @attr {number} level - Their level. 0 leaves it off.
 * @attr {string} location - Where they are.
 * @attr {number} playtime - Seconds played.
 * @attr {string} saved - When it was saved. Free text: the kit formats no dates.
 * @attr {boolean} empty - Nothing saved here. Reflected.
 * @attr {boolean} selected - The chosen row. Reflected.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 * @attr {string} empty-text - What an empty slot reads. Default "Empty".
 *
 * @slot - A portrait or thumbnail; images are rendered unsmoothed.
 *
 * @fires px-save-slot-select - It was chosen. `detail: { slotNumber, empty }`.
 *
 * @csspart base - The button.
 * @csspart frame - The pixel frame.
 * @csspart number - The slot number.
 * @csspart art - The portrait.
 * @csspart name - The character's name.
 * @csspart detail - The level-and-location line.
 * @csspart playtime - The clock.
 * @csspart saved - The saved-at line.
 *
 * @cssprop --px-save-slot-art-size - The portrait's size. Default 12 art pixels.
 */
export class PxSaveSlot extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override properties = {
    slotNumber: { type: Number, attribute: 'slot-number' },
    name: { type: String },
    level: { type: Number },
    location: { type: String },
    playtime: { type: Number },
    saved: { type: String },
    empty: { type: Boolean, reflect: true },
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    emptyText: { type: String, attribute: 'empty-text' },
  };

  declare slotNumber: number;
  declare name: string;
  declare level: number;
  declare location: string;
  declare playtime: number;
  declare saved: string;
  declare empty: boolean;
  declare selected: boolean;
  declare disabled: boolean;
  declare emptyText: string;

  constructor() {
    super();
    this.slotNumber = 0;
    this.name = '';
    this.level = 0;
    this.location = '';
    this.playtime = 0;
    this.saved = '';
    this.empty = false;
    this.selected = false;
    this.disabled = false;
    this.emptyText = 'Empty';
  }

  /** The playtime as a clock: hours and minutes, e.g. "4:12". */
  get clock(): string {
    const total = Math.max(0, Math.floor(this.playtime) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }

  /** The playtime in words, which is what a screen reader should hear. */
  get playtimeText(): string {
    const total = Math.max(0, Math.floor(this.playtime) || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    // "0:00" is a clock face; "less than a minute" is what it means.
    return parts.length > 0 ? parts.join(' ') : 'less than a minute';
  }

  /** The whole row as one sentence. */
  get accessibleName(): string {
    const slot = this.slotNumber > 0 ? `Slot ${this.slotNumber}` : '';

    if (this.empty) return [slot, this.emptyText].filter(Boolean).join(', ');

    const parts = [
      this.name,
      this.level > 0 ? `level ${this.level}` : '',
      this.location,
      this.playtime > 0 ? this.playtimeText : '',
      this.saved,
    ].filter(Boolean);

    // The slot number is the heading of the row, so it takes a colon; the
    // rest is a list.
    const rest = parts.join(', ');
    if (!slot) return rest;
    return rest ? `${slot}: ${rest}` : slot;
  }

  /** Choose it, as a click would. */
  select(): void {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent<SaveSlotSelectEventDetail>('px-save-slot-select', {
        detail: { slotNumber: this.slotNumber, empty: this.empty },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onClick(): void {
    this.select();
  }

  protected override render() {
    const detail = [this.level > 0 ? `Lv ${this.level}` : '', this.location]
      .filter(Boolean)
      .join(' · ');

    return html`
      <button
        part="base"
        class="base"
        type="button"
        aria-label=${this.accessibleName}
        aria-current=${this.selected ? 'true' : nothing}
        ?disabled=${this.disabled}
        @click=${this._onClick}
      >
        <span part="frame" class="frame"></span>
        <!-- Every drawn scrap is hidden: aria-label above says all of it
             once, in an order that makes sense read aloud. -->
        <span class="row" aria-hidden="true">
          ${
            this.slotNumber > 0
              ? html`<span part="number" class="number">${this.slotNumber}</span>`
              : nothing
          }
          <!-- Drawn even with nothing in it: a save screen is a list, and a
               list whose rows change height depending on which ones are
               empty reads as broken. -->
          <span part="art" class="art"><slot></slot></span>
          <span class="text">
            ${
              this.empty
                ? html`<span class="blank">${this.emptyText}</span>`
                : html`
                    <span part="name" class="name">${this.name}</span>
                    ${detail ? html`<span part="detail" class="detail">${detail}</span>` : nothing}
                    ${this.saved ? html`<span part="saved" class="saved">${this.saved}</span>` : nothing}
                  `
            }
          </span>
          ${
            this.empty || this.playtime <= 0
              ? nothing
              : html`<span part="playtime" class="playtime">${this.clock}</span>`
          }
        </span>
      </button>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_art: var(--px-save-slot-art-size, calc(var(--_unit) * 12));
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    .base {
      position: relative;
      display: block;
      width: 100%;
      padding: var(--_unit);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }

    .base:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.12);
    }

    /* An empty slot is a hole in the screen rather than a card on it, the
       same way an empty inventory cell is. */
    :host([empty]) .frame::before {
      background: var(--px-color-bg, #1a1c2c);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    :host([selected]) .frame {
      background: var(--px-color-highlight, #ffcd75);
    }

    .row {
      position: relative;
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
      padding: calc(var(--_unit) * 2);
    }

    .number {
      flex: none;
      align-self: flex-start;
      color: var(--px-color-text-muted, #94b0c2);
    }

    .art {
      flex: none;
      display: grid;
      place-items: center;
      width: var(--_art);
      height: var(--_art);
      background: var(--px-color-bg, #1a1c2c);
      box-shadow: inset 0 0 0 var(--_unit) var(--_border);
    }

    .text {
      flex: 1;
      min-width: 0;
      display: grid;
      gap: var(--_unit);
    }

    .name {
      text-transform: uppercase;
    }

    .detail,
    .saved {
      color: var(--px-color-text-muted, #94b0c2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .blank {
      color: var(--px-color-text-muted, #94b0c2);
      text-transform: uppercase;
      letter-spacing: var(--_unit);
    }

    .playtime {
      flex: none;
      align-self: flex-start;
      color: var(--px-color-text-muted, #94b0c2);
    }

    :host([selected]) .name,
    :host([selected]) .blank {
      color: var(--px-color-highlight, #ffcd75);
    }

    ::slotted(img),
    ::slotted(svg) {
      display: block;
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  `;
}

if (!customElements.get('px-save-slot')) {
  customElements.define('px-save-slot', PxSaveSlot);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-save-slot': PxSaveSlot;
  }
  interface HTMLElementEventMap {
    'px-save-slot-select': CustomEvent<SaveSlotSelectEventDetail>;
  }
}
