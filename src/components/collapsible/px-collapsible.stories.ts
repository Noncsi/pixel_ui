import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import './px-collapsible.js';
import '../badge/px-badge.js';
import '../checkbox/px-checkbox.js';
import '../panel/px-panel.js';
import '../slider/px-slider.js';
import '../toggle/px-toggle.js';
import type { PxCollapsible } from './px-collapsible.js';

const meta: Meta<PxCollapsible> = {
  title: 'Components/Collapsible',
  component: 'px-collapsible',
  args: {
    summary: 'Bag',
    open: false,
    disabled: false,
    flat: false,
    level: 3,
  },
  render: (args) => html`
    <div style="width: 300px">
      <px-collapsible
        summary=${args.summary}
        ?open=${args.open}
        ?disabled=${args.disabled}
        ?flat=${args.flat}
        level=${args.level}
      >
        Three potions, a rope, and a very old map with one corner missing.
      </px-collapsible>
    </div>
  `,
};

export default meta;
type Story = StoryObj<PxCollapsible>;

/** Shut, with the arrow pointing at what is hidden. */
export const Default: Story = {};

/** Open. The fold goes 0fr to 1fr, which is how you animate an unknown height. */
export const Open: Story = { args: { open: true } };

/** Stack them and you have an accordion — with no one-at-a-time rule. */
export const Stacked: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 320px">
      <px-collapsible summary="Display" open>
        <div style="display: grid; gap: 8px">
          <px-toggle label="Fullscreen" checked></px-toggle>
          <px-toggle label="Scanlines"></px-toggle>
        </div>
      </px-collapsible>
      <px-collapsible summary="Audio">
        <div style="display: grid; gap: 8px">
          <px-slider label="Music" value="70"></px-slider>
          <px-slider label="Effects" value="90"></px-slider>
        </div>
      </px-collapsible>
      <px-collapsible summary="Accessibility">
        <div style="display: grid; gap: 8px">
          <px-checkbox label="Hold instead of tap"></px-checkbox>
          <px-checkbox label="Bigger text" checked></px-checkbox>
        </div>
      </px-collapsible>
    </div>
  `,
};

/** One open at a time, if a game wants it: four lines in its own handler. */
export const OneAtATime: Story = {
  render: () => html`
    <div
      style="display: grid; gap: 8px; width: 320px"
      @px-collapsible-toggle=${(event: CustomEvent<{ open: boolean }>) => {
        if (!event.detail.open) return;
        const root = event.currentTarget as Element;
        for (const other of root.querySelectorAll<PxCollapsible>('px-collapsible')) {
          if (other !== event.target) other.hide();
        }
      }}
    >
      <px-collapsible summary="Act I" open
        >The village, the well, the thing in the well.</px-collapsible
      >
      <px-collapsible summary="Act II"
        >The road north, and who is following you down it.</px-collapsible
      >
      <px-collapsible summary="Act III">Spoilers.</px-collapsible>
    </div>
  `,
};

/** The `aside` slot keeps a count beside the heading, where it stays readable shut. */
export const WithAside: Story = {
  render: () => html`
    <div style="display: grid; gap: 8px; width: 320px">
      <px-collapsible summary="Quests">
        <px-badge slot="aside" variant="xp">3</px-badge>
        Find the innkeeper's cat. Again.
      </px-collapsible>
      <px-collapsible summary="Mail" open>
        <px-badge slot="aside" variant="danger">1</px-badge>
        A letter with no name on it.
      </px-collapsible>
    </div>
  `,
};

/** `level` puts the heading where it belongs in the page's outline. */
export const HeadingLevel: Story = {
  args: { summary: 'Chapter two', level: 2, open: true },
};

/** `flat` drops the frame, for sections already inside a panel. */
export const Flat: Story = {
  render: () => html`
    <div style="width: 320px">
      <px-panel label="Settings">
        <px-collapsible flat summary="Controls" open>
          <px-checkbox label="Invert the Y axis"></px-checkbox>
        </px-collapsible>
        <px-collapsible flat summary="Network">Nothing here works yet.</px-collapsible>
      </px-panel>
    </div>
  `,
};

/** Greyed out and unresponsive, open or shut. */
export const Disabled: Story = { args: { disabled: true, summary: 'Locked' } };
