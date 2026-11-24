import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-dropdown.js';
import './px-option.js';
import type { PxDropdown } from './px-dropdown.js';

const meta: Meta<PxDropdown> = {
  title: 'Components/Dropdown',
  component: 'px-dropdown',
  args: {
    label: 'Difficulty',
    value: 'normal',
    placeholder: 'Select…',
    disabled: false,
    fullWidth: false,
  },
  render: (args) => html`
    <div style="width: 240px; padding-bottom: 140px">
      <px-dropdown
        label=${args.label}
        value=${args.value}
        placeholder=${args.placeholder}
        ?disabled=${args.disabled}
        ?full-width=${args.fullWidth}
      >
        <px-option value="easy">Easy</px-option>
        <px-option value="normal">Normal</px-option>
        <px-option value="hard">Hard</px-option>
        <px-option value="nightmare" disabled>Nightmare</px-option>
      </px-dropdown>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxDropdown>;

/**
 * Closed, up and down change the value where it stands, as a native select
 * does. Enter, Space or alt+down open the list.
 */
export const Default: Story = {};

export const FullWidth: Story = { args: { fullWidth: true } };

export const Disabled: Story = { args: { disabled: true } };

/** Nothing chosen yet, so the placeholder stands in. */
export const Placeholder: Story = {
  args: { value: 'nothing-matches-this', placeholder: 'Choose a class…' },
};

/** Options carry icons too. */
export const WithIcons: Story = {
  render: () => html`
    <div style="width: 240px; padding-bottom: 160px">
      <px-dropdown label="Weapon" value="sword">
        <px-option value="sword">
          <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
            <path d="M3 0h2v5H3zM2 5h4v1H2zM3 6h2v2H3z" />
          </svg>
          Sword
        </px-option>
        <px-option value="bow">
          <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
            <path d="M2 1h1v6H2zM3 1h2v1H3zM3 6h2v1H3zM5 2h1v4H5z" />
          </svg>
          Bow
        </px-option>
        <px-option value="staff">
          <svg slot="icon" viewBox="0 0 8 8" width="8" height="8" fill="currentColor">
            <path d="M3 0h2v2H3zM3 2h1v6H3z" />
          </svg>
          Staff
        </px-option>
      </px-dropdown>
    </div>
  `,
};

/** A long list scrolls rather than running off the screen. */
export const ManyOptions: Story = {
  render: () => html`
    <div style="width: 240px; padding-bottom: 240px">
      <px-dropdown label="Save slot" value="slot-1">
        ${Array.from(
          { length: 12 },
          (_, i) => html`<px-option value="slot-${i + 1}">Slot ${i + 1}</px-option>`,
        )}
      </px-dropdown>
    </div>
  `,
};
