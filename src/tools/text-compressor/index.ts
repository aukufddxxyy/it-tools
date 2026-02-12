import { FileText } from '@vicons/tabler';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.text-compressor.title'),
  path: '/text-compressor',
  description: translate('tools.text-compressor.description'),
  keywords: ['text', 'compressor', 'compress', 'newline', 'single', 'line', 'remove', 'trim', 'flatten'],
  component: () => import('./text-compressor.vue'),
  icon: FileText,
  createdAt: new Date('2026-02-12'),
});
