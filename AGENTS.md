# AGENTS.md

Purpose: quick, evidence-based onboarding for agentic coding assistants in this repo.

Repository summary

- Vue 3 + Vite app (TypeScript) with pnpm.
- Tool catalog lives under src/tools; UI components under src/ui and src/components.

If you’re looking for Cursor/Copilot rules

- No .cursorrules or .cursor/rules/\*\* found.
- No .github/copilot-instructions.md found.

---

## 1) Essential commands

Package manager

- pnpm (see package.json: "packageManager": "pnpm@10.17.1" and pnpm-lock.yaml)

Install

- pnpm install

Dev server

- pnpm dev

Build / preview

- pnpm build
- pnpm preview --port 5050

Lint / typecheck

- pnpm lint
- pnpm typecheck

Tests (unit / e2e / coverage)

- pnpm test (alias to test:unit)
- pnpm run test:unit
- pnpm run test:e2e
- pnpm run test:e2e:dev
- pnpm run coverage

Other scripts

- pnpm run script:create:tool my-tool-name
- pnpm run script:create:ui

---

## 2) Single-test patterns

Unit (Vitest)

- This repo uses Vitest; run a single test via Vitest CLI options.
  Example patterns (Vitest standard):
  - pnpm vitest path/to/test-file
  - pnpm vitest -t "test name"
    (No repo-specific single-test script found.)

E2E (Playwright)

- playright.config.ts is set up with testDir: ./src and testMatch: \*.e2e.(spec.)ts.
- Run a single spec or test using Playwright CLI options:
  - pnpm run test:e2e -- path/to/spec.e2e.spec.ts
  - pnpm run test:e2e -- --grep "test name"
    (No repo-specific single-test script found.)

---

## 3) CI / automation references

CI workflow (GitHub Actions)

- .github/workflows/ci.yml
  - pnpm i
  - pnpm lint
  - pnpm test
  - pnpm typecheck
  - pnpm build

E2E workflow

- .github/workflows/e2e-tests.yml
  - pnpm install
  - pnpm build
  - pnpm exec playwright install --with-deps
  - pnpm run test:e2e --shard=${{ matrix.shard }}

Docker build

- Dockerfile runs pnpm build in build stage.

---

## 4) Formatting & linting rules (evidence-based)

Prettier (.prettierrc)

- singleQuote: true
- semi: true
- tabWidth: 2
- trailingComma: all
- printWidth: 120

ESLint (.eslintrc.cjs)

- curly: ["error", "all"] (always use braces)
- @typescript-eslint/semi: ["error", "always"]
- @typescript-eslint/no-use-before-define enabled; allowNamedExports: true, functions: false
- no-restricted-imports: do not import useClipboard from @vueuse/core
  - Use local useCopy from src/composable/copy.ts instead

Auto-import globals (.eslintrc-auto-import.json)

- Vue / VueUse / vue-router / vue-i18n APIs are globally available for linting.
- Still import explicitly when clarity matters or when not auto-imported.

---

## 5) TypeScript + project structure

TypeScript configuration

- Root tsconfig.json references:
  - tsconfig.app.json (app code)
  - tsconfig.vite-config.json (Vite config)
  - tsconfig.vitest.json (tests)
- App tsconfig uses alias "@/_" -> "./src/_".

Vite config highlights (vite.config.ts)

- Auto-imports Vue / vue-router / @vueuse/core / vue-i18n / naive-ui hooks
- Components auto-registered from src/ and .md
- Vitest config excludes \*_/_.e2e.spec.ts

---

## 6) Code style conventions (from repo examples)

Imports

- Use named imports; group logically.
- Use "import type" for type-only imports (see src/tools/index.ts).
- Alias tool imports as `tool as <name>` in src/tools/index.ts:
  - import { tool as uuidGenerator } from './uuid-generator';

Naming

- Composables use `useX` naming (useCopy, useValidation, useToolStore).
- Types / interfaces use PascalCase.
- Variables and functions use camelCase.

Error handling

- Prefer throwing Error objects (throw new Error('...')) in production code.
- Use shared helpers for normalization:
  - getErrorMessageIfThrows in src/utils/error.ts
- Validation wraps errors and treats thrown values as failures
  (see src/composable/validation.ts).

Vue SFC patterns

- Use <script setup lang="ts">.
- Use Composition API (computed, ref, watch, etc.).
- Less is used for scoped styles in many components.

---

## 7) Testing notes

Unit tests

- Vitest with jsdom environment (package.json: test:unit).

E2E tests

- Playwright config at playwright.config.ts.
- Base URL default: http://localhost:5050 (unless BASE_URL is set).
- testIdAttribute is "data-test-id".

---

## 8) Common pitfalls & repo-specific rules

- Do NOT use @vueuse/core useClipboard directly; use local useCopy.
- Keep semicolons; curly braces required for all blocks.
- Follow Prettier rules (single quotes, trailing commas, print width 120).

---

## 9) When adding a new tool

- Use script: pnpm run script:create:tool my-tool-name
- Tools live in src/tools and are listed in src/tools/index.ts by category.
- Add tool to correct category array in toolsByCategory.

---

## 10) Evidence references (key files)

- package.json (scripts + tooling)
- README.md (developer commands)
- .prettierrc, .eslintrc.cjs, .eslintrc-auto-import.json
- tsconfig.json / tsconfig.app.json / tsconfig.vitest.json / tsconfig.vite-config.json
- vite.config.ts
- playwright.config.ts
- src/tools/index.ts (import style + tool registration)
- src/composable/validation.ts (error handling + validation patterns)
- src/utils/error.ts (error normalization helper)
- src/composable/copy.ts (useCopy, restricted import)
