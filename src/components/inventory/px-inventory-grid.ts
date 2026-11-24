import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import { onGamepadAction, type GamepadAction } from '../../utils/gamepad.js';
import { PxInventorySlot } from './px-inventory-slot.js';

export interface InventoryEventDetail {
  index: number;
  slot: PxInventorySlot;
  /** The slot's name, counted where there is more than one. */
  label: string;
}

/**
 * A bag: a framed grid of slots, driven in two dimensions.
 *
 * Write one `<px-inventory-slot>` per cell, empty ones included — that way
 * the bag is the shape it says it is, and an empty slot is a place things can
 * go rather than a hole in the layout.
 *
 * Like `<px-menu>`, the grid is one focus stop and reports the highlighted
 * cell through `aria-activedescendant`, so focus never moves between slots.
 * Left and right step through the bag in order; up and down jump a whole row.
 * Both wrap. A gamepad drives it the same way while the grid has focus.
 *
 * It is reported as a listbox rather than a grid: the ARIA grid pattern wants
 * rows, and a bag has none — it has a run of cells that happens to be drawn
 * `columns` wide.
 *
 * @element px-inventory-grid
 *
 * @attr {string} label - Accessible name, also drawn as a heading.
 * @attr {number} columns - Cells across. Default 5.
 * @attr {number} index - The highlighted cell. Default 0.
 * @attr {boolean} hide-label - Keep the heading for screen readers only.
 * @attr {boolean} flat - Drop the frame.
 *
 * @slot - The `<px-inventory-slot>` cells.
 *
 * @fires px-inventory-active - The highlight moved. `detail: { index, slot, label }`.
 * @fires px-inventory-select - A cell was chosen. `detail: { index, slot, label }`.
 * @fires px-inventory-cancel - The player backed out with Escape or B.
 *
 * @csspart base - The panel.
 * @csspart frame - The pixel frame behind it.
 * @csspart label - The heading.
 * @csspart grid - The grid itself.
 *
 * @cssprop --px-inventory-slot-size - Size of one cell. Default 12 art pixels.
 */
export class PxInventoryGrid extends LitElement {
  static override properties = {
    label: { type: String },
    columns: { type: Number },
    index: { type: Number },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    flat: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare columns: number;
  declare index: number;
  declare hideLabel: boolean;
  declare flat: boolean;

  private _slots: PxInventorySlot[] = [];
  private _stopGamepad: (() => void) | undefined;

  constructor() {
    super();
    this.label = '';
    this.columns = 5;
    this.index = 0;
    this.hideLabel = false;
    this.flat = false;
  }

  /** The cells, in order. */
  get slots(): PxInventorySlot[] {
    return [...this._slots];
  }

  /** The highlighted cell, if there is one. */
  get activeSlot(): PxInventorySlot | null {
    return this._slots[this.index] ?? null;
  }

  /** Choose the highlighted cell, as Enter or A would. */
  select(): void {
    const slot = this.activeSlot;
    if (!slot || slot.disabled) return;
    this._emit('px-inventory-select', slot);
  }

  /**
   * Move the highlight by `delta` cells, skipping locked ones and wrapping
   * around the bag. A delta of ±1 steps along; ±`columns` jumps a row.
   */
  moveBy(delta: number): void {
    const slots = this._slots;
    if (slots.length === 0 || delta === 0) return;

    let next = this.index;
    for (let step = 0; step < slots.length; step += 1) {
      next = (next + delta + slots.length) % slots.length;
      if (!slots[next]?.disabled) {
        this._setIndex(next);
        return;
      }
    }
  }

  /** Highlight the first or last cell that isn't locked. */
  moveToEnd(end: 'first' | 'last'): void {
    const order = end === 'first' ? this._slots.keys() : [...this._slots.keys()].reverse();
    for (const i of order) {
      if (!this._slots[i]?.disabled) {
        this._setIndex(i);
        return;
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listbox');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('click', this._onClick);
    this.addEventListener('pointerover', this._onPointerOver);
    this.addEventListener('focus', this._onFocus);
    this.addEventListener('blur', this._onBlur);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('pointerover', this._onPointerOver);
    this.removeEventListener('focus', this._onFocus);
    this.removeEventListener('blur', this._onBlur);
    this._releaseGamepad();
  }

  protected override firstUpdated(): void {
    this._read();
  }

  protected override updated(): void {
    if (this.label) this.setAttribute('aria-label', this.label);

    for (const [i, slot] of this._slots.entries()) {
      slot.active = i === this.index;
    }

    const active = this.activeSlot;
    if (active) this.setAttribute('aria-activedescendant', active.id);
    else this.removeAttribute('aria-activedescendant');
  }

  private _read(): void {
    const slot = this.renderRoot.querySelector('slot');
    if (!slot) return;

    this._slots = slot
      .assignedElements()
      .filter((el): el is PxInventorySlot => el instanceof PxInventorySlot);

    const current = this._slots[this.index];
    if (this._slots.length > 0 && (!current || current.disabled)) {
      const fallback = this._slots.findIndex((cell) => !cell.disabled);
      this.index = fallback === -1 ? 0 : fallback;
    }

    this.requestUpdate();
  }

  private readonly _onSlotChange = (): void => {
    this._read();
  };

  private _setIndex(next: number): void {
    if (next === this.index) return;
    this.index = next;
    const slot = this._slots[next];
    if (slot) this._emit('px-inventory-active', slot);
  }

  private _emit(type: 'px-inventory-active' | 'px-inventory-select', slot: PxInventorySlot): void {
    this.dispatchEvent(
      new CustomEvent<InventoryEventDetail>(type, {
        detail: { index: this._slots.indexOf(slot), slot, label: slot.accessibleName },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent('px-inventory-cancel', { bubbles: true, composed: true }));
  }

  /** How far a row is, never less than one cell. */
  private get _row(): number {
    return Number.isFinite(this.columns) && this.columns > 0 ? Math.floor(this.columns) : 1;
  }

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this) return;

    switch (event.key) {
      case 'ArrowLeft':
        this.moveBy(-1);
        break;
      case 'ArrowRight':
        this.moveBy(1);
        break;
      case 'ArrowUp':
        this.moveBy(-this._row);
        break;
      case 'ArrowDown':
        this.moveBy(this._row);
        break;
      case 'Home':
        this.moveToEnd('first');
        break;
      case 'End':
        this.moveToEnd('last');
        break;
      case 'Enter':
      case ' ':
        this.select();
        break;
      case 'Escape':
        this._cancel();
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private readonly _onFocus = (): void => {
    if (this._stopGamepad) return;
    this._stopGamepad = onGamepadAction(this._onGamepadAction);
  };

  private readonly _onBlur = (): void => {
    this._releaseGamepad();
  };

  private _releaseGamepad(): void {
    this._stopGamepad?.();
    this._stopGamepad = undefined;
  }

  private readonly _onGamepadAction = (action: GamepadAction): void => {
    if (action === 'left') this.moveBy(-1);
    else if (action === 'right') this.moveBy(1);
    else if (action === 'up') this.moveBy(-this._row);
    else if (action === 'down') this.moveBy(this._row);
    else if (action === 'confirm') this.select();
    else if (action === 'cancel') this._cancel();
  };

  private _slotFrom(event: Event): PxInventorySlot | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const cell = target.closest('px-inventory-slot');
    return cell instanceof PxInventorySlot && this._slots.includes(cell) ? cell : null;
  }

  private readonly _onPointerOver = (event: PointerEvent): void => {
    const cell = this._slotFrom(event);
    if (!cell || cell.disabled) return;
    this._setIndex(this._slots.indexOf(cell));
  };

  private readonly _onClick = (event: MouseEvent): void => {
    const cell = this._slotFrom(event);
    if (!cell || cell.disabled) return;
    this._setIndex(this._slots.indexOf(cell));
    this.focus();
    this.select();
  };

  protected override render() {
    return html`
      <div part="base" class="base" role="none">
        ${this.flat ? nothing : html`<span part="frame" class="frame"></span>`}
        ${
          this.label && !this.hideLabel
            ? html`<p part="label" class="label" aria-hidden="true">${this.label}</p>`
            : nothing
        }
        <div part="grid" class="grid" role="none" style="--_columns: ${this._row}">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_fill: var(--px-color-surface, #333c57);
      --_border: var(--px-color-border, #0b0c14);

      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
      outline: none;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: relative;
      padding: calc(var(--_unit) * 4);
    }

    :host([flat]) .base {
      padding: 0;
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

    :host(:focus-visible) .base {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: var(--_unit);
    }

    .label {
      position: relative;
      margin: 0 0 calc(var(--_unit) * 3);
      color: var(--px-color-text-muted, #94b0c2);
      text-transform: uppercase;
    }

    :host([hide-label]) .label {
      display: none;
    }

    .grid {
      position: relative;
      display: grid;
      grid-template-columns: repeat(var(--_columns, 5), max-content);
      gap: calc(var(--_unit) * 2);
    }
  `;
}

if (!customElements.get('px-inventory-grid')) {
  customElements.define('px-inventory-grid', PxInventoryGrid);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-inventory-grid': PxInventoryGrid;
  }
  interface HTMLElementEventMap {
    'px-inventory-active': CustomEvent<InventoryEventDetail>;
    'px-inventory-select': CustomEvent<InventoryEventDetail>;
    'px-inventory-cancel': CustomEvent<void>;
  }
}
