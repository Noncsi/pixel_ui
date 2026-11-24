import { html } from 'lit';
import type { Screen } from './types.js';

export const title: Screen = {
  id: 'title',
  name: 'Title',
  caption:
    'The first screen a game shows. One focus stop in the menu, arrow keys and a gamepad to move it, and a ticker along the bottom that stops when you point at it.',
  size: 'sm',
  uses: [
    'px-panel',
    'px-menu',
    'px-menu-item',
    'px-badge',
    'px-divider',
    'px-keycap',
    'px-marquee',
  ],

  render() {
    return html`
      <div class="stack">
        <px-panel label="Pixel Quest">
          <px-badge slot="header" variant="xp" label="Version">v0.1</px-badge>

          <px-menu label="Main menu" data-menu>
            <px-menu-item value="new">New game</px-menu-item>
            <px-menu-item value="continue">
              Continue
              <span slot="detail">Slot 1 · 4:12</span>
            </px-menu-item>
            <px-menu-item value="options">Options</px-menu-item>
            <px-menu-item value="extras" disabled>
              Extras
              <span slot="detail">Locked</span>
            </px-menu-item>
            <px-menu-item value="quit">Quit</px-menu-item>
          </px-menu>

          <px-divider ornament></px-divider>

          <p class="hint" data-hint>
            <px-keycap label="Up arrow">↑</px-keycap>
            <px-keycap label="Down arrow">↓</px-keycap>
            to move,
            <!-- Spelled out rather than ⏎: Press Start 2P has the arrows but
                 not the return symbols, and the fallback font draws them at
                 a size that reads as an empty key. -->
            <px-keycap label="Enter">Enter</px-keycap>
            to choose
          </p>
        </px-panel>

        <px-marquee speed="30" data-ticker>
          ★ A DEMO WITH NO GAME BEHIND IT ★ EVERY SCREEN HERE IS BUILT FROM THE KIT ★ NOTHING IS A
          SCREENSHOT ★
        </px-marquee>
      </div>
    `;
  },

  mount(root) {
    const hint = root.querySelector('[data-hint]');
    const menu = root.querySelector('[data-menu]');
    if (!hint || !menu) return;

    // The hint reports what the menu says, so the screen proves the events
    // are real rather than just drawing a menu that looks like one.
    menu.addEventListener('px-menu-select', (event) => {
      const { value } = (event as CustomEvent<{ value: string }>).detail;
      hint.textContent = `px-menu-select fired with value "${value}". There is no game behind it.`;
    });
  },
};
