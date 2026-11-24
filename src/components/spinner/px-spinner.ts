import { LitElement, css, html, nothing } from 'lit';

/** The eight cells of a 3×3 grid with the middle left out, clockwise. */
const RING = [
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [3, 3],
  [2, 3],
  [1, 3],
  [1, 2],
] as const;

/**
 * A small marker that something is happening: a button waiting on the server,
 * a slot loading, a corner of the HUD saving in the background.
 *
 * `<px-progress indeterminate>` is the other way to say "working", and the
 * difference is room. A bar wants a line of its own and a label above it;
 * this fits beside a word. Neither knows how far along it is — reach for the
 * bar when the wait owns the screen, and for this when it does not.
 *
 * A spinner is a live region, and a live region is read by its **contents**,
 * not by its accessible name, so the label is real text inside it rather than
 * an `aria-label`. It is announced once when the spinner appears, which is
 * what you want: a wait that says "loading" every frame is unusable.
 *
 * Under `prefers-reduced-motion` the ring stops and stands still with every
 * block lit, which still reads as "working" with nothing moving.
 *
 * @element px-spinner
 *
 * @attr {string} label - What is being waited for. Default "Loading".
 * @attr {boolean} show-label - Draw the label beside the ring as well.
 * @attr {number} duration - One turn of the ring, in ms. Default 800.
 * @attr {boolean} quiet - Say nothing: for a wait already announced elsewhere.
 *
 * @csspart base - The wrapper.
 * @csspart ring - The ring of blocks.
 * @csspart block - One block of the ring. All eight: use `:nth-child()`.
 * @csspart label - The drawn label.
 *
 * @cssprop --px-spinner-size - How big the ring is. Default 6 art pixels.
 * @cssprop --px-spinner-color - The lit block's colour.
 */
export class PxSpinner extends LitElement {
  static override properties = {
    label: { type: String },
    showLabel: { type: Boolean, attribute: 'show-label' },
    duration: { type: Number },
    quiet: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare showLabel: boolean;
  declare duration: number;
  declare quiet: boolean;

  constructor() {
    super();
    this.label = 'Loading';
    this.showLabel = false;
    this.duration = 800;
    this.quiet = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Busy is the one thing a spinner says, and it says it about whatever it
    // is standing in for, so it is set on the host rather than inside.
    this.setAttribute('aria-busy', 'true');
  }

  protected override render() {
    const turn = Math.max(0, this.duration);
    const step = turn / RING.length;

    return html`
      <div part="base" class="base">
        <div part="ring" class="ring" aria-hidden="true">
          ${RING.map(
            ([column, row], index) => html`
              <span
                part="block"
                class="block"
                style="grid-column: ${column}; grid-row: ${row}; animation-duration: ${turn}ms;
                       animation-delay: ${Math.round(step * (index - RING.length))}ms"
              ></span>
            `,
          )}
        </div>
        ${
          this.showLabel
            ? html`<span part="label" class="label" aria-hidden="true">${this.label}</span>`
            : nothing
        }
        <!-- The live region's text. Not aria-label: a live region is read by
             what is in it, and a name is not in it. -->
        ${this.quiet ? nothing : html`<span class="said" role="status">${this.label}</span>`}
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_size: var(--px-spinner-size, calc(var(--_unit) * 6));
      --_lit: var(--px-spinner-color, var(--px-color-highlight, #ffcd75));
      --_dim: var(--px-color-text-muted, #94b0c2);

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      display: flex;
      align-items: center;
      gap: calc(var(--_unit) * 2);
    }

    /* Three by three with the middle empty: eight blocks on the art grid, and
       no rotation anywhere, which is the only way a ring of pixels turns
       without going soft at the corners. */
    .ring {
      flex: none;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      width: var(--_size);
      height: var(--_size);
    }

    .block {
      background: var(--_dim);
      opacity: 0.3;
      animation-name: px-spinner-turn;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }

    /* Lit for one eighth of the turn, so with the eight delays a step apart
       exactly one block is lit at a time. */
    @keyframes px-spinner-turn {
      0%,
      12.5% {
        background: var(--_lit);
        opacity: 1;
      }
      12.51%,
      100% {
        background: var(--_dim);
        opacity: 0.3;
      }
    }

    .label {
      text-transform: uppercase;
      color: var(--px-color-text-muted, #94b0c2);
    }

    /* Said, never drawn. Not display:none, which takes it out of the
       accessibility tree and so out of the live region entirely. */
    .said {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .block {
        animation: none;
        background: var(--_lit);
        opacity: 1;
      }
    }
  `;
}

if (!customElements.get('px-spinner')) {
  customElements.define('px-spinner', PxSpinner);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-spinner': PxSpinner;
  }
}
