import { html } from 'lit';
import { herb, potion, scroll } from './art.js';
import type { Screen } from './types.js';

export const shop: Screen = {
  id: 'shop',
  name: 'Shop',
  caption:
    'A till that has to agree with itself. The stepper, the running total and the gold counter are three components kept in step by their own events, and the gold rolls to its new value rather than jumping.',
  size: 'md',
  uses: [
    'px-panel',
    'px-badge',
    'px-number',
    'px-counter',
    'px-divider',
    'px-rating',
    'px-inventory-slot',
    'px-button',
    'px-progress',
    'px-toast-stack',
  ],

  render() {
    return html`
      <px-panel label="General store">
        <px-badge slot="header" variant="xp" label="New stock today">New</px-badge>

        <div class="stack">
          <div class="goods">
            <px-inventory-slot label="Potion" count="12">${potion}</px-inventory-slot>
            <div class="stack tight">
              <strong class="name">Potion</strong>
              <span class="small">Restores 20 HP. 20 gold each.</span>
              <px-rating readonly value="2" label="Rarity" shape="diamond"></px-rating>
            </div>
            <px-number label="Potion" value="1" min="0" max="9" hide-label data-count></px-number>
          </div>

          <px-divider ornament></px-divider>

          <div class="goods">
            <px-inventory-slot label="Herb" count="5">${herb}</px-inventory-slot>
            <div class="stack tight">
              <strong class="name">Herb</strong>
              <span class="small">Cures poison. 8 gold each.</span>
              <px-rating readonly value="1" label="Rarity" shape="diamond"></px-rating>
            </div>
            <px-number label="Herb" value="0" min="0" max="9" hide-label data-count></px-number>
          </div>

          <px-divider ornament></px-divider>

          <div class="goods">
            <px-inventory-slot label="Old map">${scroll}</px-inventory-slot>
            <div class="stack tight">
              <strong class="name">Old map</strong>
              <span class="small">One corner is missing. 120 gold.</span>
              <px-rating readonly value="4" label="Rarity" shape="diamond"></px-rating>
            </div>
            <px-number label="Old map" value="0" min="0" max="1" hide-label data-count></px-number>
          </div>

          <px-progress label="Bag space" value="6" max="20" show-value data-space></px-progress>
        </div>

        <div class="row spread" slot="footer">
          <span class="row">
            <span class="small">Gold</span>
            <px-counter data-gold value="250" separator="," label="Gold"></px-counter>
          </span>
          <span class="row">
            <span class="small" data-total>Total 20g</span>
            <px-button size="sm" data-buy>Buy</px-button>
          </span>
        </div>
      </px-panel>

      <px-toast-stack data-toasts placement="bottom-right" max="3"></px-toast-stack>
    `;
  },

  mount(root) {
    type Counter = HTMLElement & { value: number };
    type Toasts = HTMLElement & { toast(message: string, options?: { variant?: string }): void };

    const prices = [20, 8, 120];
    const counts = [...root.querySelectorAll<Counter>('[data-count]')];
    const gold = root.querySelector<Counter>('[data-gold]');
    const space = root.querySelector<Counter>('[data-space]');
    const total = root.querySelector('[data-total]');
    const toasts = root.querySelector<Toasts>('[data-toasts]');

    const cost = () =>
      counts.reduce((sum, field, index) => sum + field.value * (prices[index] ?? 0), 0);

    const sync = () => {
      const due = cost();
      if (total) total.textContent = `Total ${due}g`;
      if (space) space.value = 6 + counts.reduce((sum, field) => sum + field.value, 0);
    };

    for (const field of counts) field.addEventListener('px-number-change', sync);
    sync();

    root.querySelector('[data-buy]')?.addEventListener('click', () => {
      const due = cost();
      if (!gold) return;

      if (due === 0) {
        toasts?.toast('Nothing in the basket.', { variant: 'info' });
        return;
      }

      if (due > gold.value) {
        toasts?.toast(`You are ${due - gold.value}g short.`, { variant: 'danger' });
        return;
      }

      gold.value -= due;
      toasts?.toast(`Bought. ${due}g gone.`, { variant: 'success' });
      for (const field of counts) field.value = 0;
      sync();
    });
  },
};
