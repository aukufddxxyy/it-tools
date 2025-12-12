import { ImageOutlined } from '@vicons/material';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.svg-preview.title'),
  path: '/svg-preview',
  description: translate('tools.svg-preview.description'),
  keywords: ['svg', 'preview', 'canvas', 'image'],
  component: () => import('./svg-preview.tool.vue'),
  icon: ImageOutlined,
});
