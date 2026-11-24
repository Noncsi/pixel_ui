import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export interface DialogueTypingEventDetail {
  text: string;
  /** True when the reader cut the typing short instead of waiting it out. */
  skipped: boolean;
}

/** Characters that end a sentence, and get the full pause after them. */
const SENTENCE_END = new Set(['.', '!', '?', '…']);
/** Characters that only draw breath, and get half of it. */
const CLAUSE_END = new Set([',', ';', ':']);

/**
 * A dialogue box that types its line out one character at a time.
 *
 * The whole line is always in the DOM — the untyped tail is just invisible —
 * so the box never reflows as it fills, and a line that wraps to three lines
 * is three lines tall from the start. Clicking or pressing the continue button
 * finishes the line early, and asks for the next one once it is done.
 *
 * Screen readers get the finished line in one piece from a live region rather
 * than a character at a time, and under `prefers-reduced-motion` the line
 * appears whole.
 *
 * @element px-dialogue-box
 *
 * @attr {string} text - The line to type. Setting it starts the typing again.
 * @attr {string} speaker - Who is talking. Shown above the line when set.
 * @attr {number} speed - Characters per second. Default 30.
 * @attr {number} punctuation-pause - Extra ms after a sentence ends. Default 250.
 * @attr {boolean} typing - Reflected, read-only: set while the line is being typed.
 *
 * @slot portrait - A pixel portrait, shown to the left of the text.
 * @slot choices - Buttons shown once the line is done; replaces the continue arrow.
 *
 * @fires px-typing-start - A line started typing. `detail: { text, skipped: false }`.
 * @fires px-typing-end - The line is fully shown. `detail: { text, skipped }`.
 * @fires px-dialogue-advance - The reader asked for the next line.
 *
 * @csspart base - The box.
 * @csspart frame - The pixel frame behind it.
 * @csspart speaker - The speaker's name.
 * @csspart text - The line itself.
 * @csspart advance - The continue button.
 *
 * @cssprop --px-dialogue-box-lines - Height of the text area, in lines. Default 3.
 */
export class PxDialogueBox extends LitElement {
  static override properties = {
    text: { type: String },
    speaker: { type: String },
    speed: { type: Number },
    punctuationPause: { type: Number, attribute: 'punctuation-pause' },
    typing: { type: Boolean, reflect: true },
    _shown: { state: true },
    _hasChoices: { state: true },
  };

  declare text: string;
  declare speaker: string;
  declare speed: number;
  declare punctuationPause: number;
  declare typing: boolean;

  /** How many characters of `text` are visible. */
  declare private _shown: number;
  declare private _hasChoices: boolean;

  private _timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.text = '';
    this.speaker = '';
    this.speed = 30;
    this.punctuationPause = 250;
    this.typing = false;
    this._shown = 0;
    this._hasChoices = false;
  }

  /** True once every character is on screen. */
  get done(): boolean {
    return this._shown >= this.text.length;
  }

  /** Show the rest of the line at once. */
  skip(): void {
    if (this.done) return;
    this._stop();
    this._shown = this.text.length;
    this.typing = false;
    this._emitEnd(true);
  }

  /** Type the current line again from the first character. */
  restart(): void {
    this._start();
  }

  /** Ask for the next line, as a click on the box would. */
  advance(): void {
    this.dispatchEvent(new CustomEvent('px-dialogue-advance', { bubbles: true, composed: true }));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stop();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // A new line always starts over, including when it is set to the same
    // string again through the property.
    if (changed.has('text')) this._start();
  }

  private _start(): void {
    this._stop();
    this._shown = 0;

    if (!this.text) {
      this.typing = false;
      return;
    }

    this.typing = true;
    this.dispatchEvent(
      new CustomEvent<DialogueTypingEventDetail>('px-typing-start', {
        detail: { text: this.text, skipped: false },
        bubbles: true,
        composed: true,
      }),
    );

    // Asked for no motion: the line is simply there.
    if (this._prefersReducedMotion()) {
      this._shown = this.text.length;
      this.typing = false;
      this._emitEnd(false);
      return;
    }

    this._schedule();
  }

  private _schedule(): void {
    const perCharacter = this.speed > 0 ? 1000 / this.speed : 0;
    const justTyped = this.text[this._shown - 1] ?? '';
    const pause = SENTENCE_END.has(justTyped)
      ? this.punctuationPause
      : CLAUSE_END.has(justTyped)
        ? this.punctuationPause / 2
        : 0;

    this._timer = setTimeout(() => {
      this._shown += 1;
      if (this.done) {
        this.typing = false;
        this._emitEnd(false);
        return;
      }
      this._schedule();
    }, perCharacter + pause);
  }

  private _stop(): void {
    clearTimeout(this._timer);
    this._timer = undefined;
  }

  private _emitEnd(skipped: boolean): void {
    this.dispatchEvent(
      new CustomEvent<DialogueTypingEventDetail>('px-typing-end', {
        detail: { text: this.text, skipped },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _prefersReducedMotion(): boolean {
    // Read every time rather than cached, so a change of setting is picked up.
    return typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  private _onClick(event: MouseEvent): void {
    // A click on a slotted choice is that button's business, not the box's.
    const fromChoices = event
      .composedPath()
      .some((node) => node instanceof HTMLElement && node.slot === 'choices');
    if (fromChoices) return;

    if (!this.done) this.skip();
    else if (!this._hasChoices) this.advance();
  }

  private _onChoicesSlotChange(event: Event): void {
    const slot = event.target as HTMLSlotElement;
    this._hasChoices = slot.assignedElements().length > 0;
  }

  protected override render() {
    const shown = this.text.slice(0, this._shown);
    const rest = this.text.slice(this._shown);
    const showArrow = this.done && !this._hasChoices && this.text.length > 0;

    return html`
      <div
        part="base"
        class="base ${this.done && this._hasChoices ? 'passive' : ''}"
        @click=${this._onClick}
      >
        <span part="frame" class="frame"></span>
        <slot name="portrait"></slot>
        <div class="body">
          ${
            this.speaker
              ? html`<p part="speaker" class="speaker" aria-hidden="true">${this.speaker}</p>`
              : nothing
          }
          <p part="text" class="line" aria-hidden="true">
            <span class="typed">${shown}</span><span class="rest">${rest}</span>
          </p>
          <p class="sr-only" aria-live="polite">
            ${this.done && this.text ? `${this.speaker ? `${this.speaker}: ` : ''}${this.text}` : ''}
          </p>
          <div class="footer">
            <slot name="choices" @slotchange=${this._onChoicesSlotChange}></slot>
            ${
              showArrow
                ? html`<button part="advance" class="advance" aria-label="Continue">▼</button>`
                : nothing
            }
          </div>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);
      --_line-height: 1.8;

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: relative;
      display: flex;
      gap: calc(var(--_unit) * 3);
      padding: calc(var(--_unit) * 4);
      cursor: pointer;
    }

    /* With choices on screen, the box itself is no longer what you click. */
    .base.passive {
      cursor: default;
    }

    /* Like the button: the clipped frame is a layer of its own, so nothing
       inside the box has its focus ring cut off by the stepped corners. */
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
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.15);
    }

    .body,
    slot::slotted(*) {
      position: relative;
    }

    .body {
      flex: 1;
      min-width: 0;
    }

    slot[name='portrait']::slotted(*) {
      display: block;
      width: calc(var(--_unit) * 12);
      height: calc(var(--_unit) * 12);
      image-rendering: pixelated;
    }

    .speaker {
      margin: 0 0 calc(var(--_unit) * 2);
      color: var(--px-color-highlight, #ffcd75);
      text-transform: uppercase;
    }

    /* The box is as tall as its longest line from the first character on: the
       untyped tail holds the space open, it just can't be seen. */
    .line {
      margin: 0;
      min-height: calc(var(--px-dialogue-box-lines, 3) * var(--_line-height) * 1em);
      line-height: var(--_line-height);
    }

    .rest {
      visibility: hidden;
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: calc(var(--_unit) * 2);
      min-height: calc(var(--_unit) * 4);
      margin-top: calc(var(--_unit) * 2);
    }

    .advance {
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      cursor: pointer;
      animation: blink calc(var(--px-duration-slow, 600ms) * 1.5) steps(2, jump-none) infinite;
    }

    .advance:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    /* Read by assistive technology, invisible to everyone else. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @keyframes blink {
      50% {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .advance {
        animation: none;
      }
    }
  `;
}

if (!customElements.get('px-dialogue-box')) {
  customElements.define('px-dialogue-box', PxDialogueBox);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-dialogue-box': PxDialogueBox;
  }
  interface HTMLElementEventMap {
    'px-typing-start': CustomEvent<DialogueTypingEventDetail>;
    'px-typing-end': CustomEvent<DialogueTypingEventDetail>;
    'px-dialogue-advance': CustomEvent<void>;
  }
}
