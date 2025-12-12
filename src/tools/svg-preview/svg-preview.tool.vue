<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, computed } from 'vue';
import { useDialog, useMessage, useThemeVars } from 'naive-ui';
import { useCopy } from '@/composable/copy';

const { t } = useI18n();

const svgText = ref('');
const zoom = ref(1.6);
// when true, compute zoom automatically to fit SVG into canvas; becomes false when user adjusts zoom
const zoomAuto = ref(true);
const backgroundColor = ref('#ffffff');
const canvasRef = ref<HTMLCanvasElement | null>(null);
let renderTimer: number | null = null;
const themeVars = useThemeVars();
const dialog = useDialog();
const message = useMessage();

const canvasSize = ref(300);
const canvasStyle = computed(() => ({
  border: `1px solid ${themeVars.textColor1}`,
  width: `${canvasSize.value}px`,
  height: `${canvasSize.value}px`,
  display: 'block',
  borderRadius: '8px',
  overflow: 'hidden',
}));
const downloadButtonStyle = computed(() => ({
  border: 'none',
  boxShadow: 'none',
  color: themeVars.primaryColor,
}));
const labelStyle = computed(() => ({ color: themeVars.textColor1, fontWeight: 600 }));
const presetColors = ['#ffffff', '#000000', '#f8fafc', '#fce7f3', '#fff7ed', '#eef2ff', '#ecfccb', 'transparent'];

function setBg(c: string) {
  backgroundColor.value = c;
  // immediate re-render to reflect background change
  try {
    renderSvg();
  } catch (e) {
    // ignore
  }
}

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
    // clear and fill with background color
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor.value || 'white';
    // fill full pixel canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const { width, height } = parseSvgSize(text);
  const ratio = window.devicePixelRatio || 1;
  // compute auto-fit scale to fit the svg into the CSS canvas size
  const baseSize = Math.max(50, Math.round(canvasSize.value || 300));
  const baseSizeCss = baseSize; // CSS pixels
  const fitScale = (() => {
    try {
      const w = Math.max(1, width || 1);
      const h = Math.max(1, height || 1);
      const raw = Math.min(baseSizeCss / w, baseSizeCss / h) * 0.95; // padding
      const clamped = Math.max(0.01, Math.min(raw, 8));
      // round to 0.01 precision
      const rounded = Math.round(clamped * 100) / 100;
      return rounded;
    } catch (e) {
      return 1;
    }
  })();

  // choose effective zoom: auto-fit when zoomAuto is true, otherwise use manual zoom.value
  const z = zoomAuto.value ? fitScale : Math.max(0.01, Math.min(8, zoom.value || 1));
  // keep slider in sync when auto mode is active
  if (zoomAuto.value) {
    zoom.value = z;
  }
  // canvas pixel size (account for device pixel ratio), keep square
  canvas.width = Math.max(1, Math.round(baseSize * ratio));
  canvas.height = canvas.width;
  // CSS size (square) — also kept in canvasStyle binding
  canvas.style.width = `${baseSize}px`;
  canvas.style.height = `${baseSize}px`;

  // clear full pixel canvas using identity transform
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Ensure SVG has xmlns (some browsers require it when used as image source).
  // Only insert when the original text does NOT already contain an xmlns attribute.
  let svgTextWithNs = text;
  try {
    if (!/xmlns\s*=/.test(text)) {
      svgTextWithNs = text.replace(/<svg(\s|>)/i, '<svg xmlns="http://www.w3.org/2000/svg" ');
    } else {
      svgTextWithNs = text;
    }
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
      // draw centered: compute scaled svg size and offsets in CSS pixels
      const scaledW = width * z;
      const scaledH = height * z;
      const baseSizeCss = canvas.width / ratio; // CSS pixels (canvas CSS size)
      const tx = (baseSizeCss - scaledW) / 2;
      const ty = (baseSizeCss - scaledH) / 2;

      // fill background in pixel coords
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = backgroundColor.value || 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // draw image scaled (scale only maps CSS->device pixels)
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.drawImage(img, tx, ty, scaledW, scaledH);
      ctx.restore();
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

function markZoomManual() {
  zoomAuto.value = false;
}

watch([svgText, zoom, backgroundColor, canvasSize], () => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }
  renderTimer = window.setTimeout(() => {
    renderSvg();
  }, 200) as unknown as number;
});

// when user pastes/changes svgText, re-enable auto-zoom so the new svg fits by default
watch(svgText, () => {
  zoomAuto.value = true;
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
        <div class="svg-preview-controls" mb-2>
          <div class="control-row">
            <label class="svg-preview-zoom-label" :style="labelStyle">{{ t('tools.svg-preview.zoom.label') }}</label>
              <n-slider v-model:value="zoom" class="svg-zoom-slider" :min="0.01" :max="8" :step="0.01" @update:value="markZoomManual" />
            <n-input-number
              v-model:value="zoom"
              class="svg-zoom-input"
              :min="0.01"
              :max="8"
              :step="0.01"
              :show-button="false"
              @change="markZoomManual"
            />

            <div style="width: 12px"></div>

            <label class="svg-preview-zoom-label" :style="labelStyle">{{
              t('tools.svg-preview.canvas.label', 'Canvas')
            }}</label>
            <n-input-number
              v-model:value="canvasSize"
              class="svg-zoom-input"
              :min="50"
              :max="2000"
              :step="10"
              :show-button="false"
            />
          </div>

          <div class="control-row">
            <label class="svg-preview-zoom-label" :style="labelStyle">{{
              t('tools.svg-preview.background.label', 'Background')
            }}</label>
            <div class="color-wrapper">
              <n-color-picker v-model:value="backgroundColor" size="small" placement="bottom-end" />
            </div>
            <div class="svg-presets" flex gap-2>
              <button
                v-for="c in presetColors"
                :key="c"
                type="button"
                class="preset-swatch"
                :class="{ 'preset-transparent': c === 'transparent' }"
                :style="c === 'transparent' ? {} : { background: c }"
                @click="() => setBg(c)"
                :title="c"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div flex justify-center gap-3>
      <c-button @click="copy()">
        {{ t('tools.svg-preview.copy', 'Copy SVG') }}
      </c-button>
      <c-button :style="downloadButtonStyle" class="svg-download-button" @click="downloadPng()">
        {{ t('tools.svg-preview.download', 'Download PNG') }}
      </c-button>
    </div>
  </div>
  <div>
    <div class="right-canvas" style="flex: 1; display: flex; align-items: center; justify-content: center">
      <canvas ref="canvasRef" class="svg-canvas" :style="canvasStyle"></canvas>
    </div>
  </div>
</template>

<style lang="less" scoped>
.svg-download-button {
  /* color handled inline via themeVars to avoid runtime v-bind issues */
}
.svg-preview-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
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

.svg-canvas {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d1d5db;
}
.svg-presets {
  display: flex;
  gap: 8px;
  align-items: center;
}
.preset-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.preset-transparent {
  background-image: linear-gradient(45deg, #e9e9e9 25%, transparent 25%),
    linear-gradient(-45deg, #e9e9e9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9e9e9 75%),
    linear-gradient(-45deg, transparent 75%, #e9e9e9 75%);
  background-size: 8px 8px;
  background-position:
    0 0,
    0 4px,
    4px -4px,
    -4px 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.left-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 320px;
}
.svg-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.right-canvas {
  padding-left: 16px;
}
.color-wrapper {
  width: 120px;
}
.color-wrapper ::v-deep .n-color-picker {
  width: 100%;
}
</style>
