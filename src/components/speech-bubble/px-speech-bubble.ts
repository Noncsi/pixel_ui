import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type BubblePlacement = 'top' | 'bottom' | 'left' | 'right';
export type BubbleAlign = 'start' | 'center' | 'end';

/**
 * A pointed bubble for something said out in the world: a shopkeeper calling
 * after you, a sign, a barked "!" over a guard's head.
 *
 * `<px-dialogue-box>` is the panel at the bottom of the screen that types a
 * conversation out. This is the other kind — it points at whoever is talking,
 * says its piece and goes, and has no typing, portrait or advance arrow. Put
 * it where you want it; it doesn't follow anything on its own.
 *
 * `placement` is the side the tail comes out of, so a bubble above a
 * character has `placement="bottom"`.
 *
 * @element px-speech-bubble
 *
 * @attr {'top'|'bottom'|'left'|'right'} placement - Which side the tail is on. Default "bottom".
 * @attr {'start'|'center'|'end'} align - Where along that side. Default "center".
 * @attr {string} speaker - Who is talking. Shown above the words when set.
 * @attr {boolean} no-tail - Drop the tail, leaving a plain framed bubble.
 *
 * @slot - What is said.
 *
 * @csspart base - The bubble.
 * @csspart frame - The pixel frame.
 * @csspart speaker - The speaker's name.
 * @csspart tail - The pointer.
 *
 * @cssprop --px-speech-bubble-max-width - How wide it may get. Default 180px.
 */
export class PxSpeechBubble extends LitElement {
  static override properties = {
    placement: { type: String, reflect: true },
    align: { type: String, reflect: true },
    speaker: { type: String },
    noTail: { type: Boolean, attribute: 'no-tail', reflect: true },
  };

  declare placement: BubblePlacement;
  declare align: BubbleAlign;
  declare speaker: string;
  declare noTail: boolean;

  constructor() {
    super();
    this.placement = 'bottom';
    this.align = 'center';
    this.speaker = '';
    this.noTail = false;
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <div class="body">
          ${this.speaker ? html`<p part="speaker" class="speaker">${this.speaker}</p>` : nothing}
          <div class="text"><slot></slot></div>
        </div>
      </div>
      ${this.noTail ? nothing : html`<span part="tail" class="tail" aria-hidden="true"></span>`}
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      position: relative;
      display: inline-block;
      max-width: var(--px-speech-bubble-max-width, 180px);
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: relative;
      padding: calc(var(--_unit) * 3);
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
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.15);
    }

    .body {
      position: relative;
    }

    .speaker {
      margin: 0 0 calc(var(--_unit) * 2);
      color: var(--px-color-highlight, #ffcd75);
      text-transform: uppercase;
    }

    .text {
      line-height: 1.8;
    }

    /* The tail is its own element outside the clipped frame: stepped like
       everything else here, and in the border colour with the fill stepped
       inside it, so it reads as part of the same shape. */
    .tail {
      position: absolute;
      width: calc(var(--_unit) * 4);
      height: calc(var(--_unit) * 3);
      background: var(--_border);
      clip-path: polygon(0 0, 100% 0, 100% 33.33%, 50% 33.33%, 50% 100%, 0 100%);
    }

    :host([placement='bottom']) .tail {
      top: 100%;
      margin-top: calc(var(--_unit) * -1);
    }

    :host([placement='top']) .tail {
      bottom: 100%;
      margin-bottom: calc(var(--_unit) * -1);
      transform: scaleY(-1);
    }

    :host([placement='right']) .tail,
    :host([placement='left']) .tail {
      width: calc(var(--_unit) * 3);
      height: calc(var(--_unit) * 4);
      clip-path: polygon(0 0, 33.33% 0, 33.33% 50%, 100% 50%, 100% 100%, 0 100%);
    }

    :host([placement='right']) .tail {
      left: 100%;
      margin-left: calc(var(--_unit) * -1);
      transform: scaleX(-1);
    }

    :host([placement='left']) .tail {
      right: 100%;
      margin-right: calc(var(--_unit) * -1);
    }

    /* Where along the edge the tail sits. */
    :host([placement='top']) .tail,
    :host([placement='bottom']) .tail {
      left: 50%;
      margin-left: calc(var(--_unit) * -2);
    }

    :host([placement='top'][align='start']) .tail,
    :host([placement='bottom'][align='start']) .tail {
      left: calc(var(--_unit) * 3);
      margin-left: 0;
    }

    :host([placement='top'][align='end']) .tail,
    :host([placement='bottom'][align='end']) .tail {
      left: auto;
      right: calc(var(--_unit) * 3);
      margin-left: 0;
    }

    :host([placement='left']) .tail,
    :host([placement='right']) .tail {
      top: 50%;
      margin-top: calc(var(--_unit) * -2);
    }

    :host([placement='left'][align='start']) .tail,
    :host([placement='right'][align='start']) .tail {
      top: calc(var(--_unit) * 3);
      margin-top: 0;
    }

    :host([placement='left'][align='end']) .tail,
    :host([placement='right'][align='end']) .tail {
      top: auto;
      bottom: calc(var(--_unit) * 3);
      margin-top: 0;
    }
  `;
}

if (!customElements.get('px-speech-bubble')) {
  customElements.define('px-speech-bubble', PxSpeechBubble);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-speech-bubble': PxSpeechBubble;
  }
}
