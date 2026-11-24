import { LitElement, css, html, nothing } from 'lit';
import { pixelFrame } from '../../styles/pixel-frame.js';
import { PxOption } from './px-option.js';

export interface DropdownChangeEventDetail {
  value: string;
  label: string;
  index: number;
}

/**
 * A pixel stand-in for `<select>`: a framed button that opens a list.
 *
 * Navigation moves real focus onto the options rather than pointing at them
 * with `aria-activedescendant` — the options are children of this element and
 * the list that holds them is in the shadow root, and an id can't be followed
 * across that boundary. Moving focus needs no ids at all, and it is what the
 * listbox pattern allows anyway.
 *
 * Closed, the up and down arrows change the value in place, the way a native
 * select does. Open, they move through the list; Enter or Space chooses,
 * Escape backs out, and focus returns to the button either way.
 *
 * @element px-dropdown
 *
 * @attr {string} value - The chosen option's value. Settable.
 * @attr {string} label - Accessible name for the button.
 * @attr {string} placeholder - Shown while nothing is chosen. Default "Select…".
 * @attr {boolean} open - Reflected: whether the list is showing.
 * @attr {boolean} disabled - Greys it out and stops it opening.
 * @attr {boolean} full-width - Stretch to the width of the container.
 *
 * @slot - The `<px-option>` choices.
 *
 * @fires px-dropdown-change - A different option was chosen. `detail: { value, label, index }`.
 * @fires px-dropdown-open - The list opened.
 * @fires px-dropdown-close - The list closed.
 *
 * @csspart trigger - The button.
 * @csspart frame - The pixel frame behind it.
 * @csspart value - The chosen option's text on the button.
 * @csspart arrow - The little arrow.
 * @csspart menu - The list.
 */
export class PxDropdown extends LitElement {
  static override properties = {
    value: { type: String },
    label: { type: String },
    placeholder: { type: String },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    fullWidth: { type: Boolean, attribute: 'full-width', reflect: true },
  };

  declare value: string;
  declare label: string;
  declare placeholder: string;
  declare open: boolean;
  declare disabled: boolean;
  declare fullWidth: boolean;

  private _options: PxOption[] = [];

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.placeholder = 'Select…';
    this.open = false;
    this.disabled = false;
    this.fullWidth = false;
  }

  /** The choices, in order. */
  get options(): PxOption[] {
    return [...this._options];
  }

  /** The chosen option, if the current value matches one. */
  get selectedOption(): PxOption | null {
    return this._options.find((option) => option.resolvedValue === this.value) ?? null;
  }

  /** Open the list and put focus on the chosen option. */
  show(): void {
    if (this.open || this.disabled || this._options.length === 0) return;
    this.open = true;
    this.dispatchEvent(new CustomEvent('px-dropdown-open', { bubbles: true, composed: true }));
    document.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    void this.updateComplete.then(() => {
      const start = this.selectedOption ?? this._firstEnabled();
      start?.focus();
    });
  }

  /** Close the list. Focus goes back to the button unless told otherwise. */
  close(restoreFocus = true): void {
    if (!this.open) return;
    this.open = false;
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    this.dispatchEvent(new CustomEvent('px-dropdown-close', { bubbles: true, composed: true }));
    if (restoreFocus) this.focus();
  }

  /** Choose an option by value. */
  select(value: string): void {
    const index = this._options.findIndex((option) => option.resolvedValue === value);
    const option = this._options[index];
    if (!option || option.disabled) return;
    this._commit(index);
  }

  /** The button is the focusable part, so sending focus here sends it there. */
  override focus(options?: FocusOptions): void {
    const trigger = this.renderRoot.querySelector('button');
    if (trigger) trigger.focus(options);
    else super.focus(options);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onKeyDown);
    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeyDown);
    this.removeEventListener('click', this._onClick);
    document.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
  }

  protected override firstUpdated(): void {
    this._read();
  }

  protected override updated(): void {
    for (const option of this._options) {
      option.selected = option.resolvedValue === this.value;
    }
  }

  private _read(): void {
    const slot = this.renderRoot.querySelector('slot');
    if (!slot) return;

    this._options = slot.assignedElements().filter((el): el is PxOption => el instanceof PxOption);

    // An empty value takes the first choice going, the way a select does.
    if (!this.value) {
      const first = this._firstEnabled();
      if (first) this.value = first.resolvedValue;
    }

    this.requestUpdate();
  }

  private readonly _onSlotChange = (): void => {
    this._read();
  };

  private _firstEnabled(): PxOption | null {
    return this._options.find((option) => !option.disabled) ?? null;
  }

  private _commit(index: number): void {
    const option = this._options[index];
    if (!option || option.disabled) return;

    const next = option.resolvedValue;
    if (next === this.value) return;

    this.value = next;
    this.dispatchEvent(
      new CustomEvent<DropdownChangeEventDetail>('px-dropdown-change', {
        detail: { value: next, label: option.label, index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Step through the options from wherever the highlight is now. */
  private _step(delta: number, from: number): void {
    const options = this._options;
    if (options.length === 0) return;

    let next = from;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + delta + options.length) % options.length;
      const option = options[next];
      if (option && !option.disabled) {
        if (this.open) option.focus();
        else this._commit(next);
        return;
      }
    }
  }

  /** Which option has focus, or the chosen one when the list is shut. */
  private get _focusedIndex(): number {
    const active = document.activeElement;
    const focused = active instanceof PxOption ? this._options.indexOf(active) : -1;
    if (focused !== -1) return focused;

    const selected = this.selectedOption;
    return selected ? this._options.indexOf(selected) : 0;
  }

  private _optionFrom(event: Event): PxOption | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const option = target.closest('px-option');
    return option instanceof PxOption && this._options.includes(option) ? option : null;
  }

  private readonly _onClick = (event: MouseEvent): void => {
    if (this.disabled) return;

    const option = this._optionFrom(event);
    if (option) {
      if (option.disabled) return;
      this._commit(this._options.indexOf(option));
      this.close();
      return;
    }

    // Anywhere else inside the dropdown is the button.
    if (this.open) this.close();
    else this.show();
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (this.disabled) return;

    switch (event.key) {
      // Alt+Down opens and Alt+Up closes, as they do on a native select.
      case 'ArrowDown':
        if (event.altKey) this.show();
        else this._step(1, this._focusedIndex);
        break;
      case 'ArrowUp':
        if (event.altKey && this.open) this.close();
        else if (event.altKey) return;
        else this._step(-1, this._focusedIndex);
        break;
      case 'Home':
      case 'End': {
        if (!this.open) return;
        const order =
          event.key === 'Home' ? this._options.keys() : [...this._options.keys()].reverse();
        for (const i of order) {
          const option = this._options[i];
          if (option && !option.disabled) {
            option.focus();
            break;
          }
        }
        break;
      }
      case 'Enter':
      case ' ':
        if (this.open) {
          const option = this._optionFrom(event);
          if (option && !option.disabled) {
            this._commit(this._options.indexOf(option));
            this.close();
          }
        } else {
          this.show();
        }
        break;
      case 'Escape':
        if (!this.open) return;
        this.close();
        break;
      case 'Tab':
        // Let Tab move on, but don't leave the list hanging open behind it.
        if (this.open) this.close(false);
        return;
      default:
        return;
    }

    event.preventDefault();
  };

  private readonly _onDocumentPointerDown = (event: Event): void => {
    if (event.composedPath().includes(this)) return;
    this.close(false);
  };

  protected override render() {
    const selected = this.selectedOption;

    return html`
      <button
        part="trigger"
        class="trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded=${String(this.open)}
        aria-label=${this.label || nothing}
        ?disabled=${this.disabled}
      >
        <span part="frame" class="frame"></span>
        <span part="value" class="value">${selected ? selected.label : this.placeholder}</span>
        <span part="arrow" class="arrow" aria-hidden="true">▼</span>
      </button>
      <div class="popup" ?hidden=${!this.open}>
        <span class="frame"></span>
        <div part="menu" class="menu" role="listbox" aria-label=${this.label || nothing}>
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

      position: relative;
      display: inline-block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    :host([full-width]) {
      display: block;
    }

    :host([disabled]) {
      opacity: 0.5;
    }

    .trigger {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: calc(var(--_unit) * 3);
      box-sizing: border-box;
      width: 100%;
      min-width: calc(var(--_unit) * 24);
      padding: calc(var(--_unit) * 2) calc(var(--_unit) * 3);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      line-height: 1;
      text-align: left;
      text-transform: uppercase;
      cursor: pointer;
    }

    .trigger:disabled {
      cursor: default;
    }

    /* The clipped frame is its own layer, so the ring below isn't cut off. */
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

    .value,
    .arrow {
      position: relative;
    }

    .arrow {
      color: var(--px-color-text-muted, #94b0c2);
    }

    .trigger:focus-visible {
      outline: var(--_unit) solid var(--px-color-highlight, #ffcd75);
      outline-offset: 0;
    }

    /* The frame is a layer outside the scrolling list: drawn on the list
       itself it would scroll away with the options, and the clip-path would
       cut the list's own scrollbar. */
    .popup {
      position: absolute;
      z-index: 20;
      top: 100%;
      left: 0;
      min-width: 100%;
      margin-top: var(--_unit);
    }

    .popup[hidden] {
      display: none;
    }

    .menu {
      position: relative;
      max-height: calc(var(--_unit) * 50);
      padding: calc(var(--_unit) * 2);
      overflow-y: auto;
    }
  `;
}

if (!customElements.get('px-dropdown')) {
  customElements.define('px-dropdown', PxDropdown);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-dropdown': PxDropdown;
  }
  interface HTMLElementEventMap {
    'px-dropdown-change': CustomEvent<DropdownChangeEventDetail>;
    'px-dropdown-open': CustomEvent<void>;
    'px-dropdown-close': CustomEvent<void>;
  }
}
