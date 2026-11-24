import type { Decorator, Preview } from '@storybook/web-components-vite';
import { html } from 'lit';
// The kit's tokens, so stories are themed exactly like a host game would be.
import '../src/styles/tokens.css';

/** Gives every story the pixel background, colour and font the tokens define. */
const withTokens: Decorator = (story, context) => html`
  <div
    data-theme=${context.globals.theme === 'light' ? 'light' : 'dark'}
    style="background: var(--px-color-bg); color: var(--px-color-text);
           font-family: var(--px-font-family); padding: 32px;"
  >
    ${story()}
  </div>
`;

const preview: Preview = {
  decorators: [withTokens],
  globalTypes: {
    theme: {
      description: 'Pixel UI colour theme',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
