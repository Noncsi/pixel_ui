import { html } from 'lit';
import type { Screen } from './types.js';

export const settings: Screen = {
  id: 'settings',
  name: 'Options',
  caption:
    'Four ways to pick a thing, and the kit is opinionated about which is which: a toggle applies now, a checkbox is submitted later, a segmented row shows every choice, and a dropdown hides them until asked.',
  size: 'md',
  uses: [
    'px-tabs',
    'px-tab',
    'px-tab-panel',
    'px-toggle',
    'px-slider',
    'px-checkbox',
    'px-segmented',
    'px-segment',
    'px-dropdown',
    'px-option',
    'px-collapsible',
    'px-scrollbox',
    'px-keycap',
    'px-badge',
    'px-notice',
  ],

  render() {
    return html`
      <px-tabs data-tabs>
        <px-tab panel="display">Display</px-tab>
        <px-tab panel="audio">Audio</px-tab>
        <px-tab panel="controls">
          Controls
          <px-badge variant="accent" label="One unbound key">1</px-badge>
        </px-tab>

        <px-tab-panel name="display">
          <div class="stack">
            <px-toggle label="Fullscreen" checked></px-toggle>
            <px-toggle label="Scanlines"></px-toggle>
            <px-segmented label="Pixel scale" value="3" full-width>
              <px-segment value="2">2×</px-segment>
              <px-segment value="3">3×</px-segment>
              <px-segment value="4">4×</px-segment>
            </px-segmented>
            <px-dropdown label="Palette" value="twilight">
              <px-option value="twilight">Twilight</px-option>
              <px-option value="sweetie">Sweetie</px-option>
              <px-option value="grayscale">Grayscale</px-option>
              <px-option value="custom" disabled>Custom</px-option>
            </px-dropdown>
          </div>
        </px-tab-panel>

        <px-tab-panel name="audio">
          <div class="stack">
            <px-slider label="Music" value="80" unit="%" show-value></px-slider>
            <px-slider label="Effects" value="95" unit="%" show-value></px-slider>
            <px-slider label="Voices" value="60" unit="%" show-value disabled></px-slider>
            <px-collapsible summary="Advanced">
              <div class="stack">
                <px-checkbox label="Mute when the window loses focus" checked></px-checkbox>
                <px-checkbox label="Mono output">
                  <span slot="hint">For a single speaker or one earbud.</span>
                </px-checkbox>
              </div>
            </px-collapsible>
          </div>
        </px-tab-panel>

        <px-tab-panel name="controls">
          <div class="stack">
            <px-notice variant="warning" heading="One key is unbound">
              Interact has no key. The game will not start a conversation until it does.
            </px-notice>
            <px-scrollbox label="Key bindings">
              <dl class="bindings">
                <dt>Move</dt>
                <dd>
                  <px-keycap label="W">W</px-keycap>
                  <px-keycap label="A">A</px-keycap>
                  <px-keycap label="S">S</px-keycap>
                  <px-keycap label="D">D</px-keycap>
                </dd>
                <dt>Interact</dt>
                <dd><span class="small">Unbound</span></dd>
                <dt>Run</dt>
                <dd><px-keycap label="Shift">Shift</px-keycap></dd>
                <dt>Menu</dt>
                <dd><px-keycap label="Escape">Esc</px-keycap></dd>
                <dt>Attack</dt>
                <dd><px-keycap device="gamepad" label="Gamepad X">X</px-keycap></dd>
                <dt>Jump</dt>
                <dd><px-keycap device="gamepad" label="Gamepad A">A</px-keycap></dd>
                <dt>Map</dt>
                <dd><px-keycap label="M">M</px-keycap></dd>
              </dl>
            </px-scrollbox>
          </div>
        </px-tab-panel>
      </px-tabs>
    `;
  },
};
