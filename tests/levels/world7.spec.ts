import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent, getCursorPos, getMode, pressEscape, getStatusBar } from '../helpers';

test.describe('World 7 — Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await goToWorld(page, 7);
    await page.locator('#editor-input').focus();
  });

  test('7-0 Search mode is reflected in status bar', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['/']);
    const status = await getStatusBar(page);
    expect(status).toContain('/');
  });

  test('7-1 Escape exits search mode', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['/']);
    await pressEscape(page);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('7-2 Backward search (?) shows ? in status bar', async ({ page }) => {
    await goToLevel(page, 37);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['?']);
    const status = await getStatusBar(page);
    expect(status).toContain('?');
  });

  test('7-3 Level 7-0 content correct on load', async ({ page }) => {
    await goToLevel(page, 35);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'find the target here',
      'another line',
      'target appears again',
    ]);
  });

  test('7-4 Level 7-1 content correct on load', async ({ page }) => {
    await goToLevel(page, 36);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'target first',
      'no match here',
      'target second',
    ]);
  });

  test('7-5 Level 7-2 content correct on load', async ({ page }) => {
    await goToLevel(page, 37);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'alpha here',
      'beta gamma',
      'alpha there',
    ]);
  });

  test('7-6 Level 7-3 content correct on load', async ({ page }) => {
    await goToLevel(page, 38);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'keep this',
      'remove me',
      'keep this too',
    ]);
  });

  test('7-7 Level 7-4 content correct on load', async ({ page }) => {
    await goToLevel(page, 39);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      'foo bar baz',
      'qux foo quux',
      'corge grault foo',
    ]);
  });

  test('7-8 World 7 tab shows correct name', async ({ page }) => {
    await goToWorld(page, 7);
    const tab = page.locator(`#world-tabs button[data-world="7"]`);
    await expect(tab).toContainText('Spot Check');
  });

  test('7-9 Cursor stays at start after search without Enter', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['/']);
    const pos = await getCursorPos(page);
    // Cursor should still be at initial position
    expect(pos.row).toBe(2);
  });

  test('7-10 Movement works in World 7 levels', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    // l should move right
    await pressKeys(page, ['l', 'l', 'l']);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(3);
  });

  test('7-11 w moves by word in World 7 levels', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    // "find the target here" — w×2 to "target"
    await pressKeys(page, ['w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(9);
  });

  test('7-12 n key is processed in NORMAL mode', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['n']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('7-13 N key (uppercase) is processed in NORMAL mode', async ({ page }) => {
    await goToLevel(page, 35);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['N']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });
});
