import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';

export type HealthBarVariant = 'health' | 'mana' | 'xp';

export interface HealthBarEventDetail {
  value: number;
  max: number;
}

/**
 * A segmented pixel-art resource bar: health, mana or XP.
 *
 * When the value drops, the fill snaps down and a pale "damage trail" drains
 * after it, the way most action games show a hit. When it rises, the fill
 * grows instead. All motion is disabled under prefers-reduced-motion.
 *
 * @element px-health-bar
 *
 * @attr {number} value - Current amount. Clamped to 0…max.
 * @attr {number} max - Maximum amount. Default 100.
 * @attr {string} label - Accessible name, also shown above the bar.
 * @attr {'health'|'mana'|'xp'} variant - Colour scheme. Default "health".
 * @attr {number} segments - Number of notches drawn across the bar. 0 = none.
 * @attr {number} low-threshold - Fraction (0…1) under which the bar is "low". Default 0.25.
 * @attr {boolean} show-value - Show "value / max" next to the label.
 * @attr {boolean} hide-label - Keep the label for screen readers only.
 * @attr {boolean} low - Reflected, read-only: set while the bar is under the threshold.
 *
 * @fires px-low - The value crossed under the low threshold.
 * @fires px-depleted - The value reached zero.
 *
 * @csspart base - The labelled wrapper.
 * @csspart label - The label text.
 * @csspart value - The "value / max" text.
 * @csspart track - The bar's frame and background.
 * @csspart trail - The damage trail behind the fill.
 * @csspart fill - The coloured fill.
 *
 * @cssprop --px-health-bar-height - Height of the bar. Default 4 art pixels.
 * @cssprop --px-health-bar-color - Overrides the variant's fill colour.
 */
export class PxHealthBar extends LitElement {
  static override properties = {
    value: { type: Number },
    max: { type: Number },
    label: { type: String },
    variant: { type: String, reflect: true },
    segments: { type: Number },
    lowThreshold: { type: Number, attribute: 'low-threshold' },
    showValue: { type: Boolean, attribute: 'show-value' },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
  };

  // `declare` keeps TypeScript's class fields from shadowing Lit's reactive
  // accessors, so this works without decorators or special build settings.
  declare value: number;
  declare max: number;
  declare label: string;
  declare variant: HealthBarVariant;
  declare segments: number;
  declare lowThreshold: number;
  declare showValue: boolean;
  declare hideLabel: boolean;

  /** Set in willUpdate, read in the same render: no need to be reactive. */
  private _healing = false;
  private _wasLow = false;
  private _wasDepleted = false;

  constructor() {
    super();
    this.value = 100;
    this.max = 100;
    this.label = '';
    this.variant = 'health';
    this.segments = 0;
    this.lowThreshold = 0.25;
    this.showValue = false;
    this.hideLabel = false;
  }

  /** The value after clamping to 0…max. */
  get clampedValue(): number {
    const v = Number.isFinite(this.value) ? this.value : 0;
    return Math.min(Math.max(v, 0), this.safeMax);
  }

  /** Fill ratio, 0…1. */
  get ratio(): number {
    return this.clampedValue / this.safeMax;
  }

  get isLow(): boolean {
    return this.clampedValue > 0 && this.ratio <= this.lowThreshold;
  }

  private get safeMax(): number {
    return Number.isFinite(this.max) && this.max > 0 ? this.max : 1;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('value')) {
      const previous = changed.get('value');
      this._healing = typeof previous === 'number' && this.value > previous;
    }
  }

  protected override firstUpdated(): void {
    // A bar that starts low or empty is the initial state, not an event.
    this._wasLow = this.isLow;
    this._wasDepleted = this.clampedValue === 0;
  }

  protected override updated(): void {
    const low = this.isLow;
    const depleted = this.clampedValue === 0;
    this.toggleAttribute('low', low);

    // Events fire on the transition, not on every update while low.
    if (low && !this._wasLow) this.emit('px-low');
    if (depleted && !this._wasDepleted) this.emit('px-depleted');
    this._wasLow = low;
    this._wasDepleted = depleted;
  }

  private emit(type: 'px-low' | 'px-depleted'): void {
    this.dispatchEvent(
      new CustomEvent<HealthBarEventDetail>(type, {
        detail: { value: this.clampedValue, max: this.safeMax },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    const value = this.clampedValue;
    const max = this.safeMax;
    const percent = `${this.ratio * 100}%`;
    const segmentStyle =
      this.segments > 1 ? `--_segment: calc(100% / ${Math.floor(this.segments)});` : '';
    const showHeader = (this.label && !this.hideLabel) || this.showValue;

    return html`
      <div part="base" class="base">
        ${
          showHeader
            ? html`<div class="header" aria-hidden="true">
                <span part="label" class="label">${this.hideLabel ? nothing : this.label}</span>
                ${
                  this.showValue
                    ? html`<span part="value" class="value">${value} / ${max}</span>`
                    : nothing
                }
              </div>`
            : nothing
        }
        <div
          part="track"
          class="track ${this.segments > 1 ? 'segmented' : ''} ${this._healing ? 'healing' : ''}"
          style=${segmentStyle}
          role="meter"
          aria-label=${this.label || this.variant}
          aria-valuemin="0"
          aria-valuemax=${max}
          aria-valuenow=${value}
          aria-valuetext=${`${value} of ${max}`}
        >
          <div part="trail" class="trail" style="width: ${percent}"></div>
          <div part="fill" class="fill" style="width: ${percent}"></div>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_height: var(--px-health-bar-height, calc(var(--_unit) * 4));
      --_color: var(--px-health-bar-color, var(--px-color-health, #38b764));
      --_border: var(--px-color-border, #0b0c14);
      --_fast: var(--px-duration-fast, 120ms);
      --_slow: var(--px-duration-slow, 600ms);

      display: block;
      min-width: calc(var(--_unit) * 16);
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([variant='mana']) {
      --_color: var(--px-health-bar-color, var(--px-color-mana, #41a6f6));
    }

    :host([variant='xp']) {
      --_color: var(--px-health-bar-color, var(--px-color-xp, #ffcd75));
    }

    :host([low]) .fill {
      background: var(--px-color-danger, #b13e53);
      animation: pulse calc(var(--_slow) * 1.5) steps(2, jump-none) infinite;
    }

    .header {
      display: flex;
      justify-content: space-between;
      gap: calc(var(--_unit) * 2);
      margin-bottom: var(--_unit);
      line-height: 1;
      text-transform: uppercase;
    }

    .value {
      color: var(--px-color-text-muted, #94b0c2);
      font-variant-numeric: tabular-nums;
    }

    /* The frame is the track's own background showing through a padding of
       one art pixel, with the corners stepped off by clip-path. */
    .track {
      position: relative;
      height: var(--_height);
      padding: var(--_unit);
      background: var(--_border);
      ${pixelFrame}
    }

    .track::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--px-color-surface, #333c57);
    }

    .fill,
    .trail {
      position: absolute;
      top: var(--_unit);
      bottom: var(--_unit);
      left: var(--_unit);
      max-width: calc(100% - var(--_unit) * 2);
    }

    .fill {
      background: var(--_color);
      /* A one-pixel highlight along the top sells the pixel-art look. */
      box-shadow: inset 0 var(--_unit) 0 rgb(255 255 255 / 0.25);
      transition: width var(--_fast) steps(4, end);
    }

    .trail {
      background: var(--px-color-damage, #f4f4f4);
      transition: width var(--_slow) steps(8, end) calc(var(--_slow) / 2);
    }

    /* Healing: the fill grows slowly and the trail just keeps up with it. */
    .healing .fill {
      transition: width var(--_slow) steps(8, end);
    }

    .healing .trail {
      transition: none;
    }

    .segmented::after {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: repeating-linear-gradient(
        to right,
        transparent 0 calc(var(--_segment) - var(--_unit)),
        var(--_border) calc(var(--_segment) - var(--_unit)) var(--_segment)
      );
      pointer-events: none;
    }

    @keyframes pulse {
      50% {
        filter: brightness(1.4);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .fill,
      .trail {
        transition: none;
      }
      :host([low]) .fill {
        animation: none;
      }
    }
  `;
}

if (!customElements.get('px-health-bar')) {
  customElements.define('px-health-bar', PxHealthBar);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-health-bar': PxHealthBar;
  }
  interface HTMLElementEventMap {
    'px-low': CustomEvent<HealthBarEventDetail>;
    'px-depleted': CustomEvent<HealthBarEventDetail>;
  }
}
