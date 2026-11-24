import { LitElement, css, html } from 'lit';
import { PxTab } from './px-tab.js';
import { PxTabPanel } from './px-tab-panel.js';

export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsChangeEventDetail {
  /** The panel's `name`, or '' where the tabs are matched by position. */
  name: string;
  index: number;
  tab: PxTab;
}

/**
 * A tab strip and the panels behind it: an inventory, a character sheet, the
 * pages of an options screen.
 *
 * Tabs and panels are both children of this element, which is what lets them
 * point at each other — `aria-controls` and `aria-labelledby` can't reach
 * across a shadow root, so the wiring is done where the ids actually resolve.
 * A tab is matched to its panel by `panel="name"`, or by position when a tab
 * doesn't say.
 *
 * The arrow keys move along the strip and select as they go, Home and End
 * jump to the ends, and disabled tabs are stepped over. Only the selected tab
 * is a tab stop, so Tab leaves the strip rather than walking through it.
 *
 * @element px-tabs
 *
 * @attr {'horizontal'|'vertical'} orientation - Which way the strip runs. Default "horizontal".
 * @attr {number} index - The selected tab. Default 0.
 *
 * @slot - The `<px-tab-panel>`s.
 * @slot nav - The `<px-tab>`s. They put themselves here.
 *
 * @fires px-tab-change - A different tab was selected. `detail: { name, index, tab }`.
 *
 * @csspart base - The whole thing.
 * @csspart nav - The tab strip.
 * @csspart body - The wrapper around the panels.
 */
export class PxTabs extends LitElement {
  static override properties = {
    orientation: { type: String, reflect: true },
    index: { type: Number },
  };

  declare orientation: TabsOrientation;
  declare index: number;

  private _tabs: PxTab[] = [];
  private _panels: PxTabPanel[] = [];

  constructor() {
    super();
    this.orientation = 'horizontal';
    this.index = 0;
  }

  /** The tabs, in order. */
  get tabs(): PxTab[] {
    return [...this._tabs];
  }

  /** The panels, in order. */
  get panels(): PxTabPanel[] {
    return [...this._panels];
  }

  /** The selected tab, if there is one. */
  get activeTab(): PxTab | null {
    return this._tabs[this.index] ?? null;
  }

  /** The selected panel, if there is one. */
  get activePanel(): PxTabPanel | null {
    return this._panelFor(this.index);
  }

  /** Select a tab by the panel name it points at. */
  show(panel: string): void {
    const found = this._tabs.findIndex((tab, i) => this._nameFor(tab, i) === panel);
    if (found !== -1 && !this._tabs[found]?.disabled) this._setIndex(found);
  }

  /** Select a tab by position, skipping it if it is disabled. */
  select(index: number): void {
    if (!this._tabs[index] || this._tabs[index].disabled) return;
    this._setIndex(index);
  }

  /** Move the selection along the strip, wrapping and skipping disabled tabs. */
  moveBy(delta: number): void {
    const tabs = this._tabs;
    if (tabs.length === 0 || delta === 0) return;

    let next = this.index;
    for (let step = 0; step < tabs.length; step += 1) {
      next = (next + delta + tabs.length) % tabs.length;
      if (!tabs[next]?.disabled) {
        this._setIndex(next, true);
        return;
      }
    }
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
  }

  protected override firstUpdated(): void {
    // Not every DOM implementation fires slotchange for a slot's first
    // assignment, so read both slots once the shadow root exists.
    this._read();
  }

  protected override updated(): void {
    const vertical = this.orientation === 'vertical';

    for (const [i, tab] of this._tabs.entries()) {
      const panel = this._panelFor(i);
      tab.selected = i === this.index && !tab.disabled;
      tab.toggleAttribute('vertical', vertical);

      if (panel) {
        panel.active = tab.selected;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      }
    }
  }

  private _read(): void {
    const slots = this.renderRoot.querySelectorAll('slot');
    for (const slot of slots) {
      const assigned = slot.assignedElements();
      if (slot.name === 'nav') {
        this._tabs = assigned.filter((el): el is PxTab => el instanceof PxTab);
      } else {
        this._panels = assigned.filter((el): el is PxTabPanel => el instanceof PxTabPanel);
      }
    }

    // Land on something selectable: the first tab may be disabled, or the one
    // that was selected may have been taken away.
    const current = this._tabs[this.index];
    if (this._tabs.length > 0 && (!current || current.disabled)) {
      const fallback = this._tabs.findIndex((tab) => !tab.disabled);
      this.index = fallback === -1 ? 0 : fallback;
    }

    this.requestUpdate();
  }

  private readonly _onSlotChange = (): void => {
    this._read();
  };

  /** The panel a tab points at, or the one in the same position. */
  private _panelFor(index: number): PxTabPanel | null {
    const tab = this._tabs[index];
    if (!tab) return null;
    if (!tab.panel) return this._panels[index] ?? null;
    return this._panels.find((panel) => panel.name === tab.panel) ?? null;
  }

  private _nameFor(tab: PxTab, index: number): string {
    return tab.panel || (this._panelFor(index)?.name ?? '');
  }

  private _setIndex(next: number, focus = false): void {
    if (next !== this.index) {
      this.index = next;
      const tab = this._tabs[next];
      if (tab) {
        this.dispatchEvent(
          new CustomEvent<TabsChangeEventDetail>('px-tab-change', {
            detail: { name: this._nameFor(tab, next), index: next, tab },
            bubbles: true,
            composed: true,
          }),
        );
      }
    }

    // Selection moves the one tab stop with it, so focus has to follow or it
    // would be left on an element that is no longer focusable.
    if (focus) void this.updateComplete.then(() => this._tabs[this.index]?.focus());
  }

  private _tabFrom(event: Event): PxTab | null {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    const tab = target.closest('px-tab');
    return tab instanceof PxTab && this._tabs.includes(tab) ? tab : null;
  }

  private readonly _onClick = (event: MouseEvent): void => {
    const tab = this._tabFrom(event);
    if (!tab || tab.disabled) return;
    this._setIndex(this._tabs.indexOf(tab));
  };

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    // Only the strip's own keys: a control inside a panel keeps its arrows.
    if (!this._tabFrom(event)) return;

    const vertical = this.orientation === 'vertical';
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
        this._toEnd('first');
        break;
      case 'End':
        this._toEnd('last');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  private _toEnd(end: 'first' | 'last'): void {
    const order = end === 'first' ? this._tabs.keys() : [...this._tabs.keys()].reverse();
    for (const i of order) {
      if (!this._tabs[i]?.disabled) {
        this._setIndex(i, true);
        return;
      }
    }
  }

  protected override render() {
    return html`
      <div part="base" class="base">
        <div part="nav" class="nav" role="tablist" aria-orientation=${this.orientation}>
          <slot name="nav" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div part="body" class="body">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      --_unit: var(--px-unit, 4px);
      --_border: var(--px-color-border, #0b0c14);

      display: block;
      font-family: var(--px-font-family, ui-monospace, monospace);
      font-size: var(--px-font-size-sm, 8px);
      color: var(--px-color-text, #f4f4f4);
    }

    :host([hidden]) {
      display: none;
    }

    .nav {
      display: flex;
      /* The rule under the strip is the panel's top edge: the selected tab's
         own bar sits on top of it. */
      box-shadow: inset 0 calc(var(--_unit) * -1) 0 var(--_border);
    }

    slot[name='nav']::slotted(*) {
      flex: none;
    }

    :host([orientation='vertical']) .base {
      display: flex;
      align-items: stretch;
      gap: calc(var(--_unit) * 3);
    }

    :host([orientation='vertical']) .nav {
      flex-direction: column;
      box-shadow: inset calc(var(--_unit) * -1) 0 0 var(--_border);
    }

    :host([orientation='vertical']) .body {
      flex: 1;
      min-width: 0;
    }
  `;
}

if (!customElements.get('px-tabs')) {
  customElements.define('px-tabs', PxTabs);
}

declare global {
  interface HTMLElementTagNameMap {
    'px-tabs': PxTabs;
  }
  interface HTMLElementEventMap {
    'px-tab-change': CustomEvent<TabsChangeEventDetail>;
  }
}
