import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent, getCursorPos, getMode, getCommandLog, getStatusBar } from '../helpers';

test.describe('World 4 — Find & Till', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await goToWorld(page, 4);
    await page.locator('#editor-input').focus();
  });

  test('4-0 Level 4-0 content correct on load', async ({ page }) => {
    await goToLevel(page, 20);
    const content = await getEditorContent(page);
    expect(content).toEqual(['email: user@example.com']);
  });

  test('4-1 Level 4-1 content correct on load', async ({ page }) => {
    await goToLevel(page, 21);
    const content = await getEditorContent(page);
    expect(content).toEqual(['function(param) { return param; }']);
  });

  test('4-2 Level 4-2 content correct on load', async ({ page }) => {
    await goToLevel(page, 22);
    const content = await getEditorContent(page);
    expect(content).toEqual(['(content here)']);
  });

  test('4-3 f prefix is processed in NORMAL mode', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['f']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('4-4 Status bar shows NORMAL after find operations', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['f']);
    const status = await getStatusBar(page);
    expect(status).toContain('NORMAL');
  });

  test('4-5 Command log shows f prefix when buffered', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['f']);
    const log = await getCommandLog(page);
    expect(log).toContain('f');
  });

  test('4-6 Level 4-3 content correct on load', async ({ page }) => {
    await goToLevel(page, 23);
    const content = await getEditorContent(page);
    expect(content).toEqual(['I love chocate']);
  });

  test('4-7 Level 4-4 content correct on load', async ({ page }) => {
    await goToLevel(page, 24);
    const content = await getEditorContent(page);
    expect(content).toEqual(['fix ths and ths and ths']);
  });

  test('4-8 World 4 tab shows correct name', async ({ page }) => {
    await goToWorld(page, 4);
    const tab = page.locator(`#world-tabs button[data-world="4"]`);
    await expect(tab).toContainText('The Express Lane');
  });

  test('4-9 Cursor position after f key', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    // f+@ should jump to @ symbol
    await pressKeys(page, ['f', '@']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(11);
  });

  test('4-10 Movement works in World 4 levels', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    // l should move right
    await pressKeys(page, ['l', 'l', 'l']);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(3);
  });

  test('4-11 w moves by word in World 4 levels', async ({ page }) => {
    await goToLevel(page, 20);
    await page.locator('#editor-input').focus();
    // "email: user@example.com" — w×2 to "user"
    await pressKeys(page, ['w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(7);
  });

  test('4-12 F prefix is processed in NORMAL mode', async ({ page }) => {
    await goToLevel(page, 21);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['F']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('4-13 t prefix is processed in NORMAL mode', async ({ page }) => {
    await goToLevel(page, 22);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['t']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });
});
