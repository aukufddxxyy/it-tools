import { expect, test } from '@playwright/test';

test.describe('Tool - Text compressor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-compressor');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Text compressor - IT Tools');
  });

  test('Compresses multiline text into a single line', async ({ page }) => {
    await page.getByTestId('input').fill('  hello  \nworld\r\n  foo  ');

    // The output is rendered by <textarea-copyable> which uses the second textarea on the page
    const outputTextarea = page.locator('textarea').nth(1);
    await expect(outputTextarea).toHaveValue('hello world foo');
  });
});
