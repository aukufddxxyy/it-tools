<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { compressText } from './text-compressor.service';

const { t } = useI18n();
</script>

<template>
  <format-transformer
    :transformer="compressText"
    :input-label="t('tools.text-compressor.inputLabel')"
    :input-placeholder="t('tools.text-compressor.inputPlaceholder')"
    :output-label="t('tools.text-compressor.outputLabel')"
  />
</template>
