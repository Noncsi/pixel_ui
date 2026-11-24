import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

/**
 * A progress bar: a loading screen, a cast time, a download.
 *
 * This is the one that only goes up. `<px-health-bar>` is for a resource that
 * is spent and restored in play — it has segments, a low threshold, a damage
 * trail and events to match. A progress bar has none of that, and has
 * something that bar can't: `indeterminate`, for when there is no number yet.
 *
 * Under `prefers-reduced-motion` the indeterminate bar stops marching and
 * stands still as a striped track, which still reads as "working" without
 * anything moving.
 *
 * @element px-progress
 *
 * @attr {number} value - How far along. Clamped to 0…max.
 * @attr {number} max - Default 100.
 * @attr {string} label - The text above the bar, and its accessible name.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {boolean} show-value - Show the percentage beside the label.
 * @attr {boolean} indeterminate - There is no number: march instead.
 *
 * @csspart base - The labelled wrapper.
 * @csspart label - The label text.
 * @csspart value - The percentage.
 * @csspart track - The bar's frame and background.
 * @csspart fill - The filled part.
 *
 * @cssprop --px-progress-height - Height of the bar. Default 4 art pixels.
 * @cssprop --px-progress-color - The fill colour.
 */
export class PxProgress extends LitElement {
  static override properties = {
    value: { type: Number },
    max: { type: Number },
    label: { type: String },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    showValue: { type: Boolean, attribute: 'show-value' },
    indeterminate: { type: Boolean, reflect: true },
  };

  declare value: number;
  declare max: number;
  declare label: string;
  declare hideLabel: boolean;
  declare showValue: boolean;
  declare indeterminate: boolean;

  constructor() {
    super();
    this.value = 0;
    this.max = 100;
    this.label = '';
    this.hideLabel = false;
    this.showValue = false;
    this.indeterminate = false;
  }

  /** The value after clamping to 0…max. */
  get clampedValue(): number {
    const value = Number.isFinite(this.value) ? this.value : 0;
    return Math.min(Math.max(value, 0), this.safeMax);
  }

  /** How far along, 0…1. */
  get ratio(): number {
    return this.clampedValue / this.safeMax;
  }

  /** How far along, rounded, as a whole percent. */
  get percent(): number {
    return Math.round(this.ratio * 100);
  }

  private get safeMax(): number {
    return Number.isFinite(this.max) && this.max > 0 ? this.max : 1;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'progressbar');
  }

  protected override updated(): void {
    if (this.label) this.setAttribute('aria-label', this.label);

    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(this.safeMax));

    // An indeterminate bar has no position to report, and saying "0" would be
    // a lie: leaving valuenow off is what tells a screen reader that.
    if (this.indeterminate) this.removeAttribute('aria-valuenow');
    else this.setAttribute('aria-valuenow', String(this.clampedValue));
  }

  protected override render() {
    const showHeader = (this.label && !this.hideLabel) || (this.showValue && !this.indeterminate);

    return html`
      <div part="base" class="base">
        ${
          showHeader
            ? html`<div class="header" aria-hidden="true">
                ${
                  this.label && !this.hideLabel
                    ? html`<span part="label" class="label">${this.label}</span>`
                    : nothing
                }
                ${
                  this.showValue && !this.indeterminate
                    ? html`<span part="value" class="value">${this.percent}%</span>`
                    : nothing
                }
              </div>`
            : nothing
        }
        <div part="track" class="track">
          <span class="frame"></span>
          <span
            part="fill"
            class="fill"
            style=${this.indeterminate ? nothing : `width: ${this.ratio * 100}%`}
          ></span>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_height: var(--px-progress-height, calc(var(--_unit) * 4));
      --_fill: var(--px-progress-color, var(--px-color-accent, #38b764));
      --_empty: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: calc(var(--_unit) * 2);
      margin-bottom: calc(var(--_unit) * 2);
      line-height: 1;
    }

    .label {
      text-transform: uppercase;
    }

    .value {
      color: var(--px-color-text-muted, #94b0c2);
    }

    .track {
      position: relative;
      height: calc(var(--_height) + var(--_unit) * 2);
      overflow: hidden;
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
      background: var(--_empty);
    }

    .fill {
      position: absolute;
      top: var(--_unit);
      bottom: var(--_unit);
      left: var(--_unit);
      max-width: calc(100% - var(--_unit) * 2);
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
      transition: width var(--px-duration-fast, 120ms) steps(4, end);
    }

    /* No number to show: a band of blocks marches across instead. The stripe
       is drawn with a gradient so it stays crisp at any width. */
    :host([indeterminate]) .fill {
      right: var(--_unit);
      width: auto;
      max-width: none;
      background-image: repeating-linear-gradient(
        90deg,
        var(--_fill) 0,
        var(--_fill) calc(var(--_unit) * 2),
        transparent calc(var(--_unit) * 2),
        transparent calc(var(--_unit) * 4)
      );
      background-color: transparent;
      background-size: calc(var(--_unit) * 4) 100%;
      box-shadow: none;
      transition: none;
      animation: march calc(var(--px-duration-slow, 600ms) * 1.5) linear infinite;
    }

    @keyframes march {
      to {
        background-position-x: calc(var(--_unit) * 4);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .fill {
        transition: none;
      }

      /* Still striped, so it still reads as working — it just holds still. */
      :host([indeterminate]) .fill {
        animation: none;
      }
    }
  `;
}

if (!customElements.get('px-progress')) {
  customElements.define('px-progress', PxProgress);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-progress': PxProgress;
  }
}
