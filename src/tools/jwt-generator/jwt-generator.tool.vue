<script setup lang="ts">
import JSON5 from 'json5';
import * as jose from 'jose';
import { useCopy } from '@/composable/copy';
import type { UseValidationRule } from '@/composable/validation';

const algs = ['HS256', 'HS384', 'HS512'] as const;

type Encoding = 'JWT';

const rules: UseValidationRule<string>[] = [
  {
    validator: (v: string) => v === '' || JSON5.parse(v),
    message: 'Provided JSON is not valid.',
  },
];

const { t } = useI18n();
const alg = ref<(typeof algs)[number]>('HS256');
const encoding = ref<Encoding>('JWT');
const payload = ref('');
const secret = ref('');
const jwt = ref('');

watch(
  [alg, encoding, payload, secret],
  async () => {
    if (!payload.value || !secret.value) {
      jwt.value = '';
      return;
    }

    const parsedPayload = JSON5.parse(payload.value);
    const decodedSecret = new TextEncoder().encode(secret.value);

    console.error('Decoded secret:', decodedSecret);

    try {
      const token = await new jose.SignJWT(parsedPayload)
        .setProtectedHeader({ alg: alg.value, typ: 'JWT' })
        .setIssuedAt(parsedPayload.iat || undefined)
        .setExpirationTime(parsedPayload.exp || undefined)
        .sign(decodedSecret);
      jwt.value = token;
    } catch (e) {
      jwt.value = `Error: ${(e as Error).message}`;
    }
  },
  { immediate: true },
);

const { copy } = useCopy({ source: jwt });
</script>

<template>
  <div flex flex-col gap-4>
    <div flex gap-2>
      <c-select
        v-model:value="alg"
        :label="t('tools.jwt-generator.algorithm.label')"
        flex-1
        :placeholder="t('tools.jwt-generator.algorithm.placeholder')"
        :options="algs.map((a) => ({ label: a, value: a }))"
      />
      <c-select
        v-model:value="encoding"
        :label="t('tools.jwt-generator.encoding.label')"
        flex-1
        :placeholder="t('tools.jwt-generator.encoding.placeholder')"
        :options="[
          {
            label: 'JWT',
            value: 'JWT',
          },
        ]"
      />
    </div>
    <c-input-text
      v-model:value="payload"
      multiline
      raw-text
      :placeholder="t('tools.jwt-generator.payload.placeholder')"
      rows="8"
      autosize
      autofocus
      :label="t('tools.jwt-generator.payload.label')"
      :input-validation-rules="rules"
    />

    <c-input-text
      v-model:value="secret"
      raw-text
      :placeholder="t('tools.jwt-generator.secret.placeholder')"
      :label="t('tools.jwt-generator.secret.label')"
      clearable
    />

    <c-input-text
      v-model:value="jwt"
      :label="t('tools.jwt-generator.jwt.label')"
      :placeholder="t('tools.jwt-generator.jwt.placeholder')"
      rows="5"
      multiline
      raw-text
      autofocus
      mb-3
    />
    <div flex justify-center>
      <c-button @click="copy()"> {{ t('tools.jwt-generator.jwt.copied') }} </c-button>
    </div>
  </div>
</template>
