import { html } from 'lit';
import { coinSheet, herb, key, potion, shield, sword } from './art.js';
import type { Screen } from './types.js';

export const explore: Screen = {
  id: 'explore',
  name: 'In the field',
  caption:
    'The heads-up display: resources that are spent and restored, a bag you move around with the arrow keys or a gamepad, and a boss timer that keeps its own time from the clock rather than counting frames.',
  size: 'lg',
  uses: [
    'px-panel',
    'px-health-bar',
    'px-avatar',
    'px-sprite',
    'px-timer',
    'px-counter',
    'px-inventory-grid',
    'px-inventory-slot',
    'px-tooltip',
    'px-button',
    'px-keycap',
    'px-toast-stack',
  ],

  render() {
    return html`
      <div class="stack">
        <px-panel label="Party">
          <div class="hud">
            <px-avatar name="Noemi" size="lg" status="ok" status-label="Healthy" data-hero>
            </px-avatar>
            <div class="stack tight">
              <px-health-bar label="HP" value="80" segments="10" show-value data-hp>
              </px-health-bar>
              <px-health-bar label="Mana" variant="mana" value="45" show-value></px-health-bar>
              <px-health-bar label="XP" variant="xp" value="320" max="500" show-value>
              </px-health-bar>
            </div>
          </div>

          <div class="row spread" slot="footer">
            <span class="row">
              <px-sprite
                data-coin
                frame-width="16"
                frame-height="16"
                frames="6"
                fps="10"
                scale="2"
                label="A spinning coin"
              ></px-sprite>
              <px-counter data-gold value="250" separator="," label="Gold"></px-counter>
            </span>
            <span class="row">
              <span class="small">Enrage in</span>
              <px-timer data-boss value="20" warn-at="5" label="Enrage in"></px-timer>
            </span>
          </div>
        </px-panel>

        <px-panel label="Bag">
          <px-inventory-grid label="Bag" columns="5" data-bag>
            <px-inventory-slot label="Potion" count="12">${potion}</px-inventory-slot>
            <px-inventory-slot label="Rusty Sword">${sword}</px-inventory-slot>
            <px-inventory-slot label="Wooden Shield">${shield}</px-inventory-slot>
            <px-inventory-slot label="Rusty Key" count="3">${key}</px-inventory-slot>
            <px-inventory-slot label="Herb" count="5">${herb}</px-inventory-slot>
            <px-inventory-slot></px-inventory-slot>
            <px-inventory-slot></px-inventory-slot>
            <px-inventory-slot></px-inventory-slot>
            <px-inventory-slot disabled></px-inventory-slot>
            <px-inventory-slot disabled></px-inventory-slot>
          </px-inventory-grid>

          <p class="hint" data-picked>
            Click the bag, then move with
            <px-keycap label="Arrow keys">↑</px-keycap>
            <px-keycap label="Arrow keys">↓</px-keycap>
            <px-keycap label="Arrow keys">←</px-keycap>
            <px-keycap label="Arrow keys">→</px-keycap>
          </p>

          <div class="row" slot="footer">
            <px-tooltip text="Restores 20 HP" placement="top">
              <px-button size="sm" data-heal>Use potion</px-button>
            </px-tooltip>
            <px-button size="sm" variant="danger" data-hit>Take a hit</px-button>
            <px-button size="sm" variant="secondary" data-fight>Start the fight</px-button>
          </div>
        </px-panel>
      </div>

      <px-toast-stack data-toasts placement="bottom-right" max="3"></px-toast-stack>
    `;
  },

  mount(root) {
    type Bar = HTMLElement & { value: number; max: number };
    type Timer = HTMLElement & { reset(seconds: number): void; start(): void; pause(): void };
    type Toasts = HTMLElement & {
      toast(message: string, options?: { variant?: string }): void;
    };

    const hp = root.querySelector<Bar>('[data-hp]');
    const hero = root.querySelector('[data-hero]') as
      (HTMLElement & { status: string; statusLabel: string }) | null;
    const gold = root.querySelector('[data-gold]') as (HTMLElement & { value: number }) | null;
    const boss = root.querySelector<Timer>('[data-boss]');
    const toasts = root.querySelector<Toasts>('[data-toasts]');
    const picked = root.querySelector('[data-picked]');
    const coin = root.querySelector('[data-coin]') as (HTMLElement & { src: string }) | null;

    // The sheet is built here rather than fetched: the site ships no images.
    if (coin) coin.src = coinSheet();

    root.querySelector('[data-bag]')?.addEventListener('px-inventory-select', (event) => {
      const { label } = (event as CustomEvent<{ label: string }>).detail;
      if (picked) picked.textContent = `px-inventory-select fired for "${label}".`;
    });

    root.querySelector('[data-heal]')?.addEventListener('click', () => {
      if (!hp) return;
      hp.value = Math.min(hp.max, hp.value + 20);
      if (gold) gold.value -= 20;
      toasts?.toast('Potion used. 20 HP back, 20 gold gone.', { variant: 'success' });
    });

    root.querySelector('[data-hit]')?.addEventListener('click', () => {
      if (!hp) return;
      hp.value = Math.max(0, hp.value - 25);
    });

    root.querySelector('[data-fight]')?.addEventListener('click', () => {
      if (!hp || !boss) return;
      hp.value = 80;
      if (hero) {
        hero.status = 'ok';
        hero.statusLabel = 'Healthy';
      }
      boss.reset(20);
      boss.start();
    });

    // The bar's own events drive the portrait, so the two stay in step
    // without anything here having to watch a number.
    hp?.addEventListener('px-low', () => {
      if (hero) {
        hero.status = 'warn';
        hero.statusLabel = 'Hurt';
      }
      toasts?.toast('Careful.', { variant: 'info' });
    });

    hp?.addEventListener('px-depleted', () => {
      if (hero) {
        hero.status = 'danger';
        hero.statusLabel = 'Down';
      }
      boss?.pause();
      toasts?.toast('You did not survive.', { variant: 'danger' });
    });

    boss?.addEventListener('px-timer-warn', () =>
      toasts?.toast('The boss is winding up.', { variant: 'info' }),
    );

    boss?.addEventListener('px-timer-end', () => {
      if (hp) hp.value = 0;
    });
  },
};
