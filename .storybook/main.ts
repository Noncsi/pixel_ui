import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  // Stories live next to the component they document.
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/web-components-vite',
};

export default config;
