import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-checkbox.js';
import '../panel/px-panel.js';
import '../toggle/px-toggle.js';
import type { PxCheckbox } from './px-checkbox.js';

const meta: Meta<PxCheckbox> = {
  title: 'Components/Checkbox',
  component: 'px-checkbox',
  args: {
    label: 'Hard mode',
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    hideLabel: false,
  },
  render: (args) => html`
    <div style="width: 280px">
      <px-checkbox
        label=${args.label}
        ?checked=${args.checked}
        ?indeterminate=${args.indeterminate}
        ?disabled=${args.disabled}
        ?required=${args.required}
        ?hide-label=${args.hideLabel}
      ></px-checkbox>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxCheckbox>;

/** One answer among several, submitted later. */
export const Default: Story = {};

/** Ticked. The tick is drawn pixel by pixel, not taken from a font. */
export const Checked: Story = { args: { checked: true } };

/** A dash, not a faded tick: "some of these" is a different answer. */
export const Indeterminate: Story = { args: { indeterminate: true, label: 'All mods' } };

/** The `hint` slot says what ticking it will actually do. */
export const WithHint: Story = {
  render: () => html`
    <div style="width: 280px">
      <px-checkbox label="Permadeath">
        <span slot="hint">One life. No saves. The save file is deleted when you die.</span>
      </px-checkbox>
    </div>
  `,
};

/** A list with a parent that knows how much of it is ticked. */
export const PartTickedList: Story = {
  render: () => {
    const names = ['Bigger backpack', 'Fast travel', 'Weather', 'Fishing'];

    const sync = (root: Element) => {
      const all = root.querySelector<PxCheckbox>('[data-all]');
      const kids = [...root.querySelectorAll<PxCheckbox>('[data-mod]')];
      if (!all) return;
      const on = kids.filter((kid) => kid.checked).length;
      all.checked = on > 0;
      all.indeterminate = on > 0 && on < kids.length;
    };

    return html`
      <div
        style="width: 280px"
        @px-checkbox-change=${(event: Event) => {
          const root = event.currentTarget as Element;
          const target = event.target as PxCheckbox;
          if (target.hasAttribute('data-all')) {
            for (const kid of root.querySelectorAll<PxCheckbox>('[data-mod]')) {
              kid.checked = target.checked;
            }
          }
          sync(root);
        }}
      >
        <px-panel label="Mods">
          <px-checkbox data-all label="Everything" checked indeterminate></px-checkbox>
          <div style="padding-left: 16px">
            ${names.map(
              (name, index) =>
                html`<px-checkbox data-mod label=${name} ?checked=${index < 2}></px-checkbox>`,
            )}
          </div>
        </px-panel>
      </div>
    `;
  },
};

/** Beside the control it is most often confused with. */
export const NotAToggle: Story = {
  render: () => html`
    <div style="display: grid; gap: 16px; width: 300px">
      <px-panel label="Takes effect now">
        <px-toggle label="Fullscreen" checked></px-toggle>
        <px-toggle label="Music"></px-toggle>
      </px-panel>
      <px-panel label="Submitted later">
        <px-checkbox label="Hard mode"></px-checkbox>
        <px-checkbox label="I have read the terms" required></px-checkbox>
      </px-panel>
    </div>
  `,
};

/** Greyed out and unresponsive, ticked or not. */
export const Disabled: Story = {
  render: () => html`
    <div style="width: 280px">
      <px-checkbox label="Cloud saves" disabled></px-checkbox>
      <px-checkbox label="Beta branch" checked disabled></px-checkbox>
    </div>
  `,
};

/** `--px-checkbox-color` re-skins the fill behind the tick. */
export const Restyled: Story = {
  args: { checked: true },
  render: () => html`
    <div style="width: 280px">
      <px-checkbox label="Mana" checked style="--px-checkbox-color: var(--px-color-mana)">
      </px-checkbox>
      <px-checkbox label="Danger" checked style="--px-checkbox-color: var(--px-color-danger)">
      </px-checkbox>
    </div>
  `,
};
