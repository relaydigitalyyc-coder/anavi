import type { Preview } from '@storybook/react-vite';
import '@/index.css';
import { themes } from '@storybook/theming';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'heading-order', enabled: true },
          { id: 'label', enabled: true },
          { id: 'link-name', enabled: true },
        ],
      },
    },
    docs: {
      theme: themes.light,
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#F3F7FC' },
        { name: 'dark', value: '#0A1628' },
        { name: 'surface', value: '#FFFFFF' },
        { name: 'navy', value: '#0A1628' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],
};

export default preview;