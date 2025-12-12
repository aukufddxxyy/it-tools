<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue';
import { useDialog, useMessage, useThemeVars } from 'naive-ui';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();

const svgText = ref('');
const zoom = ref(1.6);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderTimer: number | null = null;
const themeVars = useThemeVars();
const dialog = useDialog();
const message = useMessage();

const canvasStyle = computed(() => ({
  border: `1px solid ${themeVars.textColor1}`,
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
}));
const downloadButtonStyle = computed(() => ({
  border: 'none',
  boxShadow: 'none',
  color: themeVars.primaryColor,
}));
const labelStyle = computed(() => ({ color: themeVars.textColor1, fontWeight: 600 }));

function parseSvgSize(svg: string) {
  try {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return { width: 300, height: 150 };
    }

    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox
        .split(/[ ,]+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      if (parts.length === 4) {
        return { width: parts[2], height: parts[3] };
      }
    }

    const widthAttr = svgEl.getAttribute('width');
    const heightAttr = svgEl.getAttribute('height');
    const w = widthAttr ? Number.parseFloat(widthAttr) : Number.NaN;
    const h = heightAttr ? Number.parseFloat(heightAttr) : Number.NaN;
    if (!Number.isNaN(w) && !Number.isNaN(h)) {
      return { width: w, height: h };
    }
  } catch (e) {
    // ignore parse errors
  }
  return { width: 300, height: 150 };
}

async function renderSvg() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const text = svgText.value || '';
  if (!text.trim()) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const { width, height } = parseSvgSize(text);
  const ratio = window.devicePixelRatio || 1;
  const z = Math.max(0.1, zoom.value || 1);
  // set actual pixel dimensions according to device ratio and zoom
  canvas.width = Math.max(1, Math.round(width * ratio * z));
  canvas.height = Math.max(1, Math.round(height * ratio * z));
  // set CSS size according to zoom (keeps layout responsive)
  canvas.style.width = `${Math.round(width * z)}px`;
  canvas.style.height = `${Math.round(height * z)}px`;

  // apply transform so drawing operations use scaled ratio
  ctx.setTransform(ratio * z, 0, 0, ratio * z, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Ensure SVG has xmlns (some browsers require it when used as image source)
  let svgTextWithNs = text;
  try {
    svgTextWithNs = text.replace(/<svg(\s|>)/i, (m) => {
      if (/xmlns=/.test(m)) {
        return m;
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" ';
    });
  } catch (e) {
    svgTextWithNs = text;
  }

  // use base64 data URL for best compatibility
  let url: string;
  let usedBlob = false;
  try {
    const svg64 = btoa(unescape(encodeURIComponent(svgTextWithNs)));
    url = `data:image/svg+xml;base64,${svg64}`;
  } catch (e) {
    // fallback to plain encoded URI or blob
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgTextWithNs)}`;
  }

  const img = new Image();
  img.onload = () => {
    try {
      ctx.drawImage(img, 0, 0, width, height);
    } catch (e) {
      console.error('Failed to draw SVG', e);
    }
    if (usedBlob) {
      URL.revokeObjectURL(url);
    }
  };
  img.onerror = (e) => {
    console.error('Error loading SVG image', e);
    if (!usedBlob) {
      // last resort: try blob URL
      try {
        const blob = new Blob([svgTextWithNs], { type: 'image/svg+xml;charset=utf-8' });
        url = URL.createObjectURL(blob);
        usedBlob = true;
        img.src = url;
        return;
      } catch (err) {
        // ignore
      }
    }
    if (usedBlob) {
      URL.revokeObjectURL(url);
    }
  };
  img.src = url;
}

watch([svgText, zoom], () => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }
  renderTimer = window.setTimeout(() => {
    renderSvg();
  }, 200) as unknown as number;
});

onMounted(() => {
  renderSvg();
});

onBeforeUnmount(() => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }
});

const { copy } = useCopy({ source: svgText });

function downloadPng() {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }
  const text = svgText.value || '';
  if (!text.trim()) {
    // ask user to confirm downloading an empty image
    dialog.warning({
      title: t('tools.svg-preview.download'),
      content: t(
        'tools.svg-preview.emptyDownloadConfirmation',
        'There is no SVG content. Do you want to download an empty image?',
      ),
      positiveText: t('common.yes', 'Yes'),
      negativeText: t('common.no', 'No'),
      onPositive: () => {
        try {
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = 'svg-preview.png';
          a.click();
        } catch (err) {
          console.error(err);
          message.error(t('tools.svg-preview.downloadError', 'Failed to download image'));
        }
      },
    });
    return;
  }

  try {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'svg-preview.png';
    a.click();
  } catch (err) {
    console.error(err);
    message.error(t('tools.svg-preview.downloadError', 'Failed to download image'));
  }
}
</script>

<template>
  <div flex flex-col gap-4>
    <c-input-text
      v-model:value="svgText"
      multiline
      raw-text
      :placeholder="t('tools.svg-preview.placeholder', 'Paste SVG code here')"
      rows="12"
      autosize
      autofocus
      :label="t('tools.svg-preview.label', 'SVG')"
    />

    <div flex items-start gap-2>
      <div flex-1>
        <div mb-2>
          <strong>{{ t('tools.svg-preview.preview', 'Preview') }}</strong>
        </div>

        <div class="svg-preview-controls" mb-2 flex items-center gap-2>
          <label class="svg-preview-zoom-label" :style="labelStyle">{{ t('tools.svg-preview.zoom.label') }}</label>
          <n-slider v-model:value="zoom" class="svg-zoom-slider" :min="0.2" :max="4" :step="0.1" />
          <n-input-number
            v-model:value="zoom"
            class="svg-zoom-input"
            :min="0.2"
            :max="4"
            :step="0.1"
            :show-button="false"
          />
        </div>

        <canvas ref="canvasRef" class="svg-canvas" :style="canvasStyle"></canvas>
      </div>
      <div class="flex flex-col gap-2">
        <c-button @click="copy()">
          {{ t('tools.svg-preview.copy', 'Copy SVG') }}
        </c-button>
        <c-button :style="downloadButtonStyle" class="svg-download-button" @click="downloadPng()">
          {{ t('tools.svg-preview.download', 'Download PNG') }}
        </c-button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.svg-download-button {
  /* color handled inline via themeVars to avoid runtime v-bind issues */
}
.svg-preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.svg-preview-zoom-label {
  margin-right: 8px;
  font-weight: 600;
}
.svg-zoom-slider {
  width: 200px;
}
.svg-zoom-input {
  width: 80px;
}
.svg-canvas {
  /* border and colors handled inline via themeVars to avoid runtime v-bind issues */
  max-width: 100%;
  height: auto;
  display: block;
}
</style>
