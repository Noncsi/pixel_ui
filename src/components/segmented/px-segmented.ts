import { LitElement, css, html } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import { PxSegment } from './px-segment.js';

export interface SegmentedChangeEventDetail {
  value: string;
  label: string;
  index: number;
}

/**
 * A row of choices with all of them on screen: EASY | NORMAL | HARD.
 *
 * It is the third way the kit offers to pick one of a few things, and they
 * are not interchangeable. `<px-dropdown>` hides the choices until asked,
 * which is right when there are many. `<px-slider>` is for a range. This is
 * for two to four options that are worth showing side by side, which is most
 * of an options screen.
 *
 * It is a radio group, so the arrow keys move **and** choose as they go, and
 * only the chosen segment is a tab stop — Tab enters the group once and
 * leaves it, rather than walking through every option.
 *
 * @element px-segmented
 *
 * @attr {string} value - The chosen segment's value. Settable.
 * @attr {string} label - Accessible name for the group.
 * @attr {boolean} full-width - Stretch to the width of the container.
 * @attr {boolean} disabled - Greys it out and stops it responding.
 *
 * @slot - The `<px-segment>` choices.
 *
 * @fires px-segmented-change - A different segment was chosen. `detail: { value, label, index }`.
 *
 * @csspart base - The row.
 * @csspart frame - The pixel frame behind it.
 *
 * @cssprop --px-segmented-color - The fill on the chosen segment.
 */
export class PxSegmented extends LitElement {
  static override properties = {
    value: { type: String },
    label: { type: String },
    fullWidth: { type: Boolean, attribute: 'full-width', reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare label: string;
  declare fullWidth: boolean;
  declare disabled: boolean;

  private _segments: PxSegment[] = [];

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.fullWidth = false;
    this.disabled = false;
  }

  /** The choices, in order. */
  get segments(): PxSegment[] {
    return [...this._segments];
  }

  /** The chosen segment, if the current value matches one. */
  get selectedSegment(): PxSegment | null {
    return this._segments.find((segment) => segment.resolvedValue === this.value) ?? null;
  }

  /** Choose a segment by value. */
  select(value: string): void {
    const index = this._segments.findIndex((segment) => segment.resolvedValue === value);
    this._commit(index);
  }

  /** Move the choice along the row, skipping disabled segments and wrapping. */
  moveBy(delta: number): void {
    const segments = this._segments;
    if (segments.length === 0 || delta === 0) return;

    const from = this.selectedSegment ? segments.indexOf(this.selectedSegment) : 0;
    let next = from;
    for (let step = 0; step < segments.length; step += 1) {
      next = (next + delta + segments.length) % segments.length;
      if (!segments[next]?.disabled) {
        this._commit(next, true);
        return;
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'radiogroup');

    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('click', this._onClick);
  }

  protected override firstUpdated(): void {
    this._read();
  }

  protected override updated(): void {
    if (this.label) this.setAttribute('aria-label', this.label);

    const selected = this.selectedSegment;
    for (const segment of this._segments) {
      segment.selected = segment === selected;
    }

    // Nothing is chosen and so nothing is a tab stop: let the first segment
    // take the focus, or the group would be unreachable by keyboard.
    if (!selected) this._segments[0]?.setAttribute('tabindex', '0');
  }

  private _read(): void {
    const slot = this.renderRoot.querySelector('slot');
    if (!slot) return;

    this._segments = slot
      .assignedElements()
      .filter((el): el is PxSegment => el instanceof PxSegment);

    // An empty value takes the first choice going, as a radio group with a
    // default checked option would.
    if (!this.value) {
      const first = this._segments.find((segment) => !segment.disabled);
      if (first) this.value = first.resolvedValue;
    }

    this.requestUpdate();
  }

  private readonly _onSlotChange = (): void => {
    this._read();
  };

  private _commit(index: number, focus = false): void {
    const segment = this._segments[index];
    if (!segment || segment.disabled) return;

    const next = segment.resolvedValue;
    if (next !== this.value) {
      this.value = next;
      this.dispatchEvent(
        new CustomEvent<SegmentedChangeEventDetail>('px-segmented-change', {
          detail: { value: next, label: segment.label, index },
          bubbles: true,
          composed: true,
        }),
      );
    }

    // Choosing moves the one tab stop with it, so focus has to follow or it
    // would be left on an element that is no longer focusable.
    if (focus) void this.updateComplete.then(() => segment.focus());
  }

  private _segmentFrom(event: Event): PxSegment | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const segment = target.closest('px-segment');
    return segment instanceof PxSegment && this._segments.includes(segment) ? segment : null;
  }

  private readonly _onClick = (event: MouseEvent): void => {
    if (this.disabled) return;
    const segment = this._segmentFrom(event);
    if (!segment) return;
    this._commit(this._segments.indexOf(segment));
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    // Only the row's own keys: a control inside a segment keeps its arrows.
    if (!this._segmentFrom(event)) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        this.moveBy(-1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        this.moveBy(1);
        break;
      case ' ': {
        const segment = this._segmentFrom(event);
        if (segment) this._commit(this._segments.indexOf(segment));
        break;
      }
      default:
        return;
    }

    event.preventDefault();
  };

  protected override render() {
    return html`
      <div part="base" class="base">
        <span part="frame" class="frame"></span>
        <div class="row">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-bg, #1a1c2c);
      --_border: var(--px-color-border, #0b0c14);

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
    }

    :host([hidden]) {
      display: none;
    }

    :host([full-width]) {
      display: block;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    .base {
      position: relative;
      padding: var(--_unit);
    }

    .frame {
      position: absolute;
      inset: 0;
      background: var(--_border);
      ${pixelFrame}
    }

    /* Sunk, so the chosen segment reads as a block sitting in a channel. */
    .frame::before {
      content: '';
      position: absolute;
      inset: var(--_unit);
      background: var(--_fill);
      box-shadow: inset 0 var(--_unit) 0 rgb(0 0 0 / 0.35);
    }

    .row {
      position: relative;
      display: flex;
      align-items: stretch;
    }
  `;
}

if (!customElements.get('px-segmented')) {
  customElements.define('px-segmented', PxSegmented);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-segmented': PxSegmented;
  }
  interface HTMLElementEventMap {
    'px-segmented-change': CustomEvent<SegmentedChangeEventDetail>;
  }
}
