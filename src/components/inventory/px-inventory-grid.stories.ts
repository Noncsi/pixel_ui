import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, type TemplateResult } from 'lit';
import './px-inventory-grid.js';
import './px-inventory-slot.js';
import type { PxInventoryGrid } from './px-inventory-grid.js';

/** Eight-pixel sprites, drawn as paths so the stories stay self-contained. */
const ART: Record<string, TemplateResult> = {
  potion: html`<svg viewBox="0 0 8 8" fill="currentColor" style="color: #38b764">
    <path d="M3 0h2v2H3zM2 2h4v6H2z" />
  </svg>`,
  sword: html`<svg viewBox="0 0 8 8" fill="currentColor" style="color: #94b0c2">
    <path d="M3 0h2v5H3zM2 5h4v1H2zM3 6h2v2H3z" />
  </svg>`,
  shield: html`<svg viewBox="0 0 8 8" fill="currentColor" style="color: #41a6f6">
    <path d="M1 1h6v1H1zM1 2h1v4H1zM6 2h1v4H6zM2 6h4v1H2z" />
  </svg>`,
  key: html`<svg viewBox="0 0 8 8" fill="currentColor" style="color: #ffcd75">
    <path d="M1 1h3v3H1zM4 2h3v1H4zM6 3h1v2H6z" />
  </svg>`,
};

/** `count` cells, the first few holding something. */
function cells(count: number, filled: Array<[keyof typeof ART, string, number?]>) {
  return html`
    ${filled.map(
      ([art, label, amount]) => html`
        <px-inventory-slot label=${label} count=${amount ?? 1}>${ART[art]}</px-inventory-slot>
      `,
    )}
    ${Array.from({ length: count - filled.length }, () => html`<px-inventory-slot></px-inventory-slot>`)}
  `;
}

const meta: Meta<PxInventoryGrid> = {
  title: 'Components/Inventory grid',
  component: 'px-inventory-grid',
  args: {
    label: 'Bag',
    columns: 5,
    hideLabel: false,
    flat: false,
  },
  render: (args) => html`
    <px-inventory-grid
      label=${args.label}
      columns=${args.columns}
      ?hide-label=${args.hideLabel}
      ?flat=${args.flat}
    >
      ${cells(10, [
        ['potion', 'Potion', 12],
        ['sword', 'Rusty Sword'],
        ['shield', 'Wooden Shield'],
        ['key', 'Rusty Key', 3],
      ])}
    </px-inventory-grid>
  `,
};

export default meta;
type Story = StoryObj<PxInventoryGrid>;

/** Click it or tab to it, then use all four arrow keys. */
export const Default: Story = {};

/** A narrow bag: up and down still jump exactly one row. */
export const ThreeWide: Story = { args: { columns: 3 } };

/** Locked cells are stepped over by the keyboard as well as the mouse. */
export const WithLockedCells: Story = {
  render: () => html`
    <px-inventory-grid label="Bag" columns="4">
      <px-inventory-slot label="Potion" count="12">${ART['potion']}</px-inventory-slot>
      <px-inventory-slot label="Rusty Sword">${ART['sword']}</px-inventory-slot>
      <px-inventory-slot></px-inventory-slot>
      <px-inventory-slot></px-inventory-slot>
      <px-inventory-slot disabled></px-inventory-slot>
      <px-inventory-slot disabled></px-inventory-slot>
      <px-inventory-slot disabled></px-inventory-slot>
      <px-inventory-slot disabled></px-inventory-slot>
    </px-inventory-grid>
  `,
};

/** No panel, for a bag drawn straight onto the map. */
export const Flat: Story = { args: { flat: true, hideLabel: true } };

/** `--px-inventory-slot-size` resizes the cells without touching the grid. */
export const BigCells: Story = {
  render: () => html`
    <px-inventory-grid label="Bag" columns="4" style="--px-inventory-slot-size: 64px">
      ${cells(8, [
        ['potion', 'Potion', 12],
        ['sword', 'Rusty Sword'],
        ['shield', 'Wooden Shield'],
      ])}
    </px-inventory-grid>
  `,
};
