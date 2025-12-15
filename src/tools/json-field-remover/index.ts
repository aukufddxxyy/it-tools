import { Trash } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.json-field-remover.title'),
  path: '/json-field-remover',
  description: translate('tools.json-field-remover.description'),
  keywords: ['json', 'fields', 'remove', 'delete', 'object', 'array'],
  component: () => import('./json-field-remover.vue'),
  icon: Trash,
});
