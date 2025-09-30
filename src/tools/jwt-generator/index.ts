import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.jwt-generator.title'),
  path: '/jwt-generator',
  description: translate('tools.jwt-generator.description'),
  keywords: ['token', 'random', 'string', 'alphanumeric', 'symbols', 'number', 'letters', 'lowercase', 'uppercase', 'password'],
  component: () => import('./jwt-generator.tool.vue'),
  icon: ArrowsShuffle,
});
