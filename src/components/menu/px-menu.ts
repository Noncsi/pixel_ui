import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import { onGamepadAction, type GamepadAction } from '../../utils/gamepad.js';
import { PxMenuItem } from './px-menu-item.js';

export type MenuOrientation = 'vertical' | 'horizontal';

export interface MenuEventDetail {
  /** The chosen row's `value`, or its text when it has none. */
  value: string;
  index: number;
  item: PxMenuItem;
}

/** Ids for rows that don't have one, so aria-activedescendant has a target. */
let autoId = 0;

/**
 * A game menu: a framed list of rows driven by the keyboard, a gamepad or the
 * mouse.
 *
 * The menu itself is the focusable element and keeps the highlight in
 * `aria-activedescendant`, so focus never moves between rows and a screen
 * reader reads the current one as it changes. Arrow keys move the highlight
 * (up and down, or left and right when `orientation="horizontal"`), Home and
 * End jump to the ends, Enter and Space choose a row, Escape backs out.
 * Disabled rows are skipped, and the highlight wraps at the ends unless
 * `no-loop` is set.
 *
 * A gamepad drives it the same way — d-pad or left stick to move, A to
 * choose, B to back out — but only while the menu has focus, so two menus on
 * one page never both move. Call `focus()` when the menu opens.
 *
 * @element px-menu
 *
 * @attr {string} label - Accessible name, also drawn as a heading.
 * @attr {'vertical'|'horizontal'} orientation - Which way the rows run. Default "vertical".
 * @attr {number} index - The highlighted row. Default 0.
 * @attr {boolean} no-loop - Stop at the ends instead of wrapping around.
 * @attr {boolean} hide-label - Keep the heading for screen readers only.
 * @attr {boolean} flat - Drop the frame, for a menu straight on the background.
 *
 * @slot - The `<px-menu-item>` rows.
 *
 * @fires px-menu-active - The highlight moved. `detail: { value, index, item }`.
 * @fires px-menu-select - A row was chosen. `detail: { value, index, item }`.
 * @fires px-menu-cancel - The reader backed out with Escape or B.
 *
 * @csspart base - The panel.
 * @csspart frame - The pixel frame behind it.
 * @csspart label - The heading.
 * @csspart items - The wrapper around the rows.
 */
export class PxMenu extends LitElement {
  static override properties = {
    label: { type: String },
    orientation: { type: String, reflect: true },
    index: { type: Number },
    noLoop: { type: Boolean, attribute: 'no-loop' },
    hideLabel: { type: Boolean, attribute: 'hide-label' },
    flat: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare orientation: MenuOrientation;
  declare index: number;
  declare noLoop: boolean;
  declare hideLabel: boolean;
  declare flat: boolean;

  /** Rebuilt on slotchange; not reactive, since slotchange requests the update. */
  private _items: PxMenuItem[] = [];
  private _stopGamepad: (() => void) | undefined;

  constructor() {
    super();
    this.label = '';
    this.orientation = 'vertical';
    this.index = 0;
    this.noLoop = false;
    this.hideLabel = false;
    this.flat = false;
  }

  /** The rows, in order. */
  get items(): PxMenuItem[] {
    return [...this._items];
  }

  /** The highlighted row, if there is one. */
  get activeItem(): PxMenuItem | null {
    return this._items[this.index] ?? null;
  }

  /** Choose the highlighted row, as Enter or A would. */
  select(): void {
    const item = this.activeItem;
    if (!item || item.disabled) return;
    this._emit('px-menu-select', item);
  }

  /**
   * Move the highlight by `delta` rows, skipping disabled ones and wrapping
   * at the ends unless `no-loop` is set.
   */
  moveBy(delta: number): void {
    const items = this._items;
    if (items.length === 0 || delta === 0) return;

    let next = this.index;
    for (let step = 0; step < items.length; step += 1) {
      next += delta;

      if (next < 0 || next >= items.length) {
        if (this.noLoop) return;
        next = (next + items.length) % items.length;
      }

      if (!items[next]?.disabled) {
        this._setIndex(next);
        return;
      }
    }
  }

  /** Highlight the first or last row that isn't disabled. */
  moveToEnd(end: 'first' | 'last'): void {
    const items = this._items;
    const order = end === 'first' ? items.keys() : [...items.keys()].reverse();
    for (const i of order) {
      if (!items[i]?.disabled) {
        this._setIndex(i);
        return;
      }
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // The menu is one focus stop, not one per row: the highlight is reported
    // through aria-activedescendant instead of by moving focus.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'menu');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');

    // The rows are light-DOM children, so their clicks bubble up to the host
    // in the ordinary tree. Listening here rather than inside the shadow root
    // keeps the menu working wherever slotted events are handled loosely.
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

  protected override updated(): void {
    if (this.label) this.setAttribute('aria-label', this.label);

    const active = this.activeItem;
    for (const [i, item] of this._items.entries()) {
      item.active = i === this.index;
    }

    if (active) this.setAttribute('aria-activedescendant', active.id);
    else this.removeAttribute('aria-activedescendant');
  }

  private _setIndex(next: number): void {
    if (next === this.index) return;
    this.index = next;
    const item = this._items[next];
    if (item) this._emit('px-menu-active', item);
  }

  private _emit(type: 'px-menu-active' | 'px-menu-select', item: PxMenuItem): void {
    this.dispatchEvent(
      new CustomEvent<MenuEventDetail>(type, {
        detail: { value: item.resolvedValue, index: this._items.indexOf(item), item },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent('px-menu-cancel', { bubbles: true, composed: true }));
  }

  protected override firstUpdated(): void {
    // Chrome fires slotchange for a slot's first assignment, but not every DOM
    // implementation does — so read the rows once as soon as the slot exists,
    // and leave slotchange to report the changes after that.
    this._readItems();
  }

  private readonly _onSlotChange = (): void => {
    this._readItems();
  };

  private _readItems(): void {
    const slot = this.renderRoot.querySelector('slot');
    if (!slot) return;

    this._items = slot
      .assignedElements()
      .filter((el): el is PxMenuItem => el instanceof PxMenuItem);

    for (const item of this._items) {
      if (!item.id) item.id = `px-menu-item-${(autoId += 1)}`;
    }

    // A row may have been removed from under the highlight, or the first row
    // may be disabled: land on something choosable before anything is drawn.
    const current = this._items[this.index];
    if (this._items.length > 0 && (!current || current.disabled)) {
      const fallback = this._items.findIndex((item) => !item.disabled);
      this.index = fallback === -1 ? 0 : fallback;
    }

    this.requestUpdate();
  }

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    // A control inside a row — a slider in a detail slot, say — keeps its own
    // keys. Only the menu's own key presses move the highlight.
    if (event.target !== this) return;

    const vertical = this.orientation !== 'horizontal';
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    const forward = vertical ? 'ArrowDown' : 'ArrowRight';

    switch (event.key) {
      case back:
        this.moveBy(-1);
        break;
      case forward:
        this.moveBy(1);
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

    // Only once a key was handled: arrows and Space scroll the page otherwise.
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
    const vertical = this.orientation !== 'horizontal';
    const back = vertical ? 'up' : 'left';
    const forward = vertical ? 'down' : 'right';

    if (action === back) this.moveBy(-1);
    else if (action === forward) this.moveBy(1);
    else if (action === 'confirm') this.select();
    else if (action === 'cancel') this._cancel();
  };

  private _itemFrom(event: Event): PxMenuItem | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const item = target.closest('px-menu-item');
    return item instanceof PxMenuItem && this._items.includes(item) ? item : null;
  }

  private readonly _onPointerOver = (event: PointerEvent): void => {
    const item = this._itemFrom(event);
    if (!item || item.disabled) return;
    this._setIndex(this._items.indexOf(item));
  };

  private readonly _onClick = (event: MouseEvent): void => {
    const item = this._itemFrom(event);
    if (!item || item.disabled) return;
    this._setIndex(this._items.indexOf(item));
    // Clicking hands the menu the keyboard and the gamepad as well.
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
        <div part="items" class="items" role="none">
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

    /* As on the button: the clipped frame is its own layer, so the focus ring
       below isn't cut off by the stepped corners. */
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

    /* The whole menu is one focus stop, so the ring goes round the panel. */
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

    .items {
      position: relative;
      display: grid;
      gap: calc(var(--_unit) * 1);
    }

    :host([orientation='horizontal']) .items {
      display: flex;
      flex-wrap: wrap;
      gap: calc(var(--_unit) * 4);
    }
  `;
}

if (!customElements.get('px-menu')) {
  customElements.define('px-menu', PxMenu);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-menu': PxMenu;
  }
  interface HTMLElementEventMap {
    'px-menu-active': CustomEvent<MenuEventDetail>;
    'px-menu-select': CustomEvent<MenuEventDetail>;
    'px-menu-cancel': CustomEvent<void>;
  }
}
