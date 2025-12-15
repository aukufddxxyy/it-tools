import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import JsonFieldRemover from './json-field-remover.vue';

describe('JsonFieldRemover component', () => {
  let wrapper: any;

  beforeEach(() => {
    // mock vue-i18n to avoid installing plugin in unit tests
    vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (s: string) => s }) }));
    wrapper = shallowMount(JsonFieldRemover, {
      global: {
        stubs: ['CInputText', 'TextareaCopyable', 'n-card', 'n-checkbox', 'c-card', 'c-button'],
      },
    });
  });

  it('detects fields from input', async () => {
    const sample = `[{"a":1,"b":2},{"a":3,"c":4}]`;
    (wrapper.vm as any).input = sample;
    await (wrapper.vm as any).detectFields();
    const paths = (wrapper.vm as any).fields.map((f: any) => f.path);
    expect(paths).toEqual(['a', 'b', 'c']);
  });

  it('produces result without removed fields', async () => {
    const sample = `[{"a":1,"b":2},{"a":3,"c":4}]`;
    (wrapper.vm as any).input = sample;
    await (wrapper.vm as any).detectFields();
    // select field 'b' to remove
    (wrapper.vm as any).selected = ['b'];
    const out = (wrapper.vm as any).result;
    expect(typeof out).toBe('string');
    const parsed = JSON.parse(out);
    expect(parsed[0].b).toBeUndefined();
    expect(parsed[0].a).toBe(1);
  });
});
