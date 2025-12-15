<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { detectFieldsWithSamples, parseJsonArray, removeFieldsFromArray } from './json-field-remover.service';
import CInputText from '@/components/InputCopyable.vue';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import { useCopy } from '@/composable/copy';

function formatCell(v: any) {
  if (v === null || v === undefined) {
    return '';
  }
  if (typeof v === 'object') {
    return JSON.stringify(v);
  }
  return String(v);
}

const { t } = useI18n();

const defaultValue = `[
  { "id": 1, "name": "Alice", "meta": { "a": 1 } },
  { "id": 2, "name": "Bob", "age": 30 }
]`;

const input = ref(defaultValue);
const parseError = ref('');
const parsed = ref<any[]>([]);
const fields = ref<{ path: string; sample: any }[]>([]);
const selected = ref<string[]>([]);
const search = ref('');

const filteredFields = computed(() => {
  if (!search.value) {
    return fields.value;
  }
  const q = search.value.toLowerCase();
  return fields.value.filter((f) => f.path.toLowerCase().includes(q) || String(f.sample).toLowerCase().includes(q));
});

function detectFields() {
  parseError.value = '';
  try {
    const value = parseJsonArray(input.value);
    parsed.value = value;
    fields.value = detectFieldsWithSamples(value);
    selected.value = [];
    if (fields.value.length === 0) {
      parseError.value = t('tools.json-field-remover.noFields');
    }
  } catch (e) {
    parsed.value = [];
    fields.value = [];
    parseError.value = t('tools.json-field-remover.invalidJson');
  }
}

// auto-detect fields when input changes (debounced)
let detectTimer: number | null = null;
watch(
  input,
  () => {
    if (detectTimer) {
      window.clearTimeout(detectTimer);
    }
    detectTimer = window.setTimeout(() => {
      detectFields();
      detectTimer = null;
    }, 250);
  },
  { immediate: false },
);

function toggleField(field: string, checked: boolean) {
  if (checked) {
    if (!selected.value.includes(field)) {
      selected.value.push(field);
    }
  } else {
    selected.value = selected.value.filter((s) => s !== field);
  }
}

function selectAll() {
  selected.value = fields.value.map((f) => f.path);
}

function clearSelection() {
  selected.value = [];
}

function invertSelection() {
  const newSel = new Set(selected.value);
  for (const f of fields.value) {
    if (newSel.has(f.path)) {
      newSel.delete(f.path);
    } else {
      newSel.add(f.path);
    }
  }
  selected.value = Array.from(newSel).sort();
}

const result = computed(() => {
  if (!parsed.value || parsed.value.length === 0) {
    return '[]';
  }
  if (!selected.value || selected.value.length === 0) {
    return JSON.stringify(parsed.value, null, 2);
  }
  const res = removeFieldsFromArray(parsed.value, selected.value);
  return JSON.stringify(res, null, 2);
});

const { copy } = useCopy({ source: result });

const resultArray = computed(() => {
  try {
    const parsed = JSON.parse(result.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
});

const tableColumns = computed(() => {
  const cols = new Set<string>();
  for (const item of resultArray.value) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      Object.keys(item).forEach((k) => cols.add(k));
    }
  }
  return Array.from(cols);
});

const tableRows = computed(() => resultArray.value || []);
</script>

<template>
  <div class="json-remover-wrapper">
    <c-card class="json-remover-card">
      <CInputText v-model:value="input" multiline rows="12" :label="t('tools.json-field-remover.inputLabel')" />

      <div mt-3 flex justify-between items-center>
        <div flex items-center gap-3>
          <c-button secondary @click="selectAll">
            {{ t('tools.json-field-remover.selectAll') }}
          </c-button>
          <c-button tertiary @click="invertSelection">
            {{ t('tools.json-field-remover.invert') }}
          </c-button>
          <c-button tertiary @click="clearSelection">
            {{ t('tools.json-field-remover.clear') }}
          </c-button>
        </div>
        <div>
          <c-button @click="copy()">
            {{ t('tools.json-field-remover.copy', 'Copy') }}
          </c-button>
        </div>
      </div>

      <div mt-4>
        <div v-if="parseError" mb-2 class="text-negative">
          {{ parseError }}
        </div>

        <div v-if="fields.length">
          <div mb-2>
            {{ t('tools.json-field-remover.fields') }}
          </div>

          <div mb-3>
            <CInputText v-model:value="search" :placeholder="t('tools.json-field-remover.searchPlaceholder')" />
          </div>

          <div class="fields-grid">
            <n-card v-for="f in filteredFields" :key="f.path" size="small" class="field-card">
              <div justify-space-between flex items-start gap-2>
                <div style="flex: 1">
                  <div strong>
                    {{ f.path }}
                  </div>
                </div>
                <n-checkbox :checked="selected.includes(f.path)" @update:checked="(val) => toggleField(f.path, val)" />
              </div>
            </n-card>
          </div>
        </div>
      </div>

      <div v-if="tableColumns.length" mt-4>
        <div class="table-scroll">
          <n-table>
            <thead>
              <tr>
                <th v-for="col in tableColumns" :key="col">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in tableRows" :key="idx">
                <td v-for="col in tableColumns" :key="col">
                  {{ formatCell(row[col]) }}
                </td>
              </tr>
            </tbody>
          </n-table>
        </div>
      </div>
    </c-card>
  </div>
</template>

<style scoped lang="less">
/* small spacing tweaks */
.fields-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 100%;
  overflow-x: hidden; /* prevent grid from causing page horizontal scroll */
}
.field-card {
  box-sizing: border-box;
  flex: 0 1 220px; /* don't grow to avoid pushing container wider */
  min-width: 160px;
  overflow: hidden;
  word-break: break-word;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-scroll table {
  /* allow the table to grow wider than its container so horizontal scrolling appears */
  width: max-content;
  min-width: 100%;
  table-layout: auto;
  border-collapse: collapse;
}
.table-scroll th,
.table-scroll td {
  /* let cells size to their content and wrap if needed instead of forcing truncation */
  max-width: none;
  overflow: visible;
  text-overflow: initial;
  white-space: normal;
}
.json-remover-card {
  overflow: visible;
  max-width: 100%;
  min-width: 0;
}
.json-remover-wrapper {
  width: 100%;
  max-width: 100vw; /* never exceed viewport */
  overflow-x: auto; /* horizontal scroll here */
  flex: 0 0 100%;
}
</style>
