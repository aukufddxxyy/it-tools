# Text Compressor Tool Design

**Goal:** Add a new tool that compresses text into a single line by removing newline characters, trimming leading/trailing spaces or tabs on each line, and inserting a single space between lines to avoid word concatenation.

**Architecture:** Implement as a standard text-transform tool using the shared `FormatTransformer` component. Keep transformation logic in a pure service function for easy unit testing. Register the tool in the existing tool index and localization files.

**Tech Stack:** Vue 3 + Vite + TypeScript, shared tool UI (`FormatTransformer`), Vitest for unit tests, Playwright for E2E.

---

## Scope & Behavior

**Input:** Arbitrary text (may include `\n`, `\r\n`, `\r`).

**Output:** Single-line text, computed as:

1. Split by all newline variants (`\r\n|\r|\n`).
2. For each line, trim **leading and trailing** spaces/tabs only (do not collapse inner whitespace).
3. Join the trimmed lines with a **single space** between lines.
4. Final output should not introduce extra spaces beyond the single separators; if all lines are empty/whitespace, output is an empty string.

**Non-goals:** No additional options (e.g., removing double spaces), no extra UI controls, no additional formatting beyond newline removal and line-edge trimming.

## UI / UX

Use the shared `FormatTransformer` component (same as other simple text tools). Provide localized labels and placeholder text. No custom controls.

Suggested labels:

- Input label: “Your text with newlines”
- Input placeholder: “Paste your multiline text here...”
- Output label: “Compressed text (single line)”

## Files & Changes

### Create (via scaffold script)

- `src/tools/text-compressor/text-compressor.vue`
- `src/tools/text-compressor/index.ts`
- `src/tools/text-compressor/text-compressor.service.ts`
- `src/tools/text-compressor/text-compressor.service.test.ts`
- `src/tools/text-compressor/text-compressor.e2e.spec.ts`

### Modify

- `src/tools/text-compressor/text-compressor.service.ts`
  - Add `compressText(text: string): string` implementing the exact behavior.
- `src/tools/text-compressor/text-compressor.vue`
  - Wire `compressText` into `FormatTransformer`.
- `src/tools/text-compressor/index.ts`
  - Define tool metadata (name, description, keywords, icon, createdAt, path).
- `src/tools/index.ts`
  - Add the tool import (script already inserts), then add to the “Text” category array.
- `locales/en.yml`
  - Add tool `title` and `description` under `tools:`.

## Testing

### Unit (Vitest)

Add tests for:

- Mixed newline variants → single-line output
- Leading/trailing spaces/tabs removed per line
- Inner spaces preserved
- Empty/whitespace-only input → empty string

### E2E (Playwright)

- Navigate to `/text-compressor`
- Fill input with multiline text
- Assert output equals expected single-line text with single spaces

## Open Questions

None.
