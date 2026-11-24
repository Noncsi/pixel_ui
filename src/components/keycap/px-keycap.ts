import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type KeycapDevice = 'keyboard' | 'gamepad';

/**
 * A key or a controller button, drawn as the thing itself.
 *
 * "Press [SPACE] to jump", "[W][A][S][D] to move", a whole remapping screen.
 * A keyboard cap is a square key with a lit top edge; a gamepad one is the
 * rounded octagon those buttons actually are.
 *
 * It is presentational on purpose: `pressed` is set by the game, not watched
 * for here. A decorative element that started the gamepad polling loop would
 * keep it running for the whole page, which is exactly what the kit's "only
 * while focused" rule is there to avoid.
 *
 * The label is marked up as `<kbd>`, so it is read as input rather than as
 * loose text.
 *
 * @element px-keycap
 *
 * @attr {'keyboard'|'gamepad'} device - Which shape. Default "keyboard".
 * @attr {'sm'|'md'} size - Type scale. Default "sm".
 * @attr {boolean} pressed - Draw it held down.
 * @attr {string} label - Spells the key out for a screen reader, e.g. "Space".
 *
 * @slot - What is written on the cap.
 *
 * @csspart base - The cap.
 * @csspart frame - The pixel frame.
 * @csspart label - The text on it.
 *
 * @cssprop --px-keycap-color - The cap's fill colour.
 */
export class PxKeycap extends LitElement {
  static override properties = {
    device: { type: String, reflect: true },
    size: { type: String, reflect: true },
    pressed: { type: Boolean, reflect: true },
    label: { type: String },
  };

  declare device: KeycapDevice;
  declare size: 'sm' | 'md';
  declare pressed: boolean;
  declare label: string;

  constructor() {
    super();
    this.device = 'keyboard';
    this.size = 'sm';
    this.pressed = false;
    this.label = '';
  }

  protected override updated(): void {
    // "A" on a cap is a letter to look at; "A button" is what it is called.
    if (this.label) this.setAttribute('aria-label', this.label);
    else this.removeAttribute('aria-label');
  }

  protected override render() {
    return html`
      <kbd part="base" class="base">
        <span part="frame" class="frame"></span>
        <span part="label" class="label"><slot></slot></span>
      </kbd>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-keycap-color, var(--px-color-surface, #333c57));
      --_border: var(--px-color-border, #0b0c14);

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    :host([size='md']) {
      font-size: var(--px-font-size-md, 12px);
    }

    .base {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      min-width: calc(var(--_unit) * 7);
      min-height: calc(var(--_unit) * 7);
      padding: calc(var(--_unit) * 1.5) calc(var(--_unit) * 2);
      font: inherit;
      line-height: 1;
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
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
    }

    /* A controller button is the rounded octagon it actually is, rather than
       the square a key is. The fill takes the same shape so the border reads
       evenly all the way round. */
    :host([device='gamepad']) .frame,
    :host([device='gamepad']) .frame::before {
      clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%);
    }

    :host([device='gamepad']) .base {
      min-width: calc(var(--_unit) * 8);
      min-height: calc(var(--_unit) * 8);
      padding: calc(var(--_unit) * 1.5);
    }

    .label {
      position: relative;
      text-transform: uppercase;
    }

    /* Held: the lit edge moves to the bottom and the legend drops one art
       pixel, so the cap looks pushed in without the frame moving. */
    :host([pressed]) .frame::before {
      box-shadow: inset 0 calc(var(--_unit) * -1) 0 rgb(0 0 0 / 0.3);
      filter: brightness(0.85);
    }

    :host([pressed]) .label {
      transform: translateY(var(--_unit));
    }
  `;
}

if (!customElements.get('px-keycap')) {
  customElements.define('px-keycap', PxKeycap);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-keycap': PxKeycap;
  }
}
