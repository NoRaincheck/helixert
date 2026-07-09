import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent, getMode, getCommandLog, getStatusBar } from '../helpers';

test.describe('World 5 — Insert Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await goToWorld(page, 5);
    await page.locator('#editor-input').focus();
  });

  test('5-0 INSERT mode is reflected in status bar', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['i']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-1 Esc exits INSERT mode back to NORMAL', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['i']);
    await pressKeys(page, ['Escape']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('5-2 Command log is cleared on Esc from INSERT', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['i']);
    await pressKeys(page, ['Escape']);
    const log = await getCommandLog(page);
    expect(log).toBe('');
  });

  test('5-3 Status bar shows INSERT while in insert mode', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['i']);
    const status = await getStatusBar(page);
    expect(status).toContain('INSERT');
  });

  test('5-4 I key enters INSERT mode at first non-blank', async ({ page }) => {
    await goToLevel(page, 28);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['I']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-5 a enters INSERT mode after cursor', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['a']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-6 A enters INSERT mode at line end', async ({ page }) => {
    await goToLevel(page, 25);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['A']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-7 o opens line below and enters INSERT', async ({ page }) => {
    await goToLevel(page, 27);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['o']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-8 O opens line above and enters INSERT', async ({ page }) => {
    await goToLevel(page, 27);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['O']);
    const mode = await getMode(page);
    expect(mode).toBe('INSERT');
  });

  test('5-9 Level 5-0 content correct on load', async ({ page }) => {
    await goToLevel(page, 25);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'Helix has multiple modes.',
      'You have been in NORMAL mode.',
      'Learning Helix'
    ]);
  });

  test('5-10 Level 5-1 content correct on load', async ({ page }) => {
    await goToLevel(page, 26);
    const content = await getEditorContent(page);
    expect(content).toEqual(['The answer is']);
  });

  test('5-11 Level 5-2 content correct on load', async ({ page }) => {
    await goToLevel(page, 27);
    const content = await getEditorContent(page);
    expect(content).toEqual(['First line.', 'Second line.']);
  });

  test('5-12 Level 5-3 content correct on load', async ({ page }) => {
    await goToLevel(page, 28);
    const content = await getEditorContent(page);
    expect(content).toEqual(['Fix this bug']);
  });

  test('5-13 Level 5-4 content correct on load', async ({ page }) => {
    await goToLevel(page, 29);
    const content = await getEditorContent(page);
    expect(content).toEqual(['I love banannas']);
  });
});
