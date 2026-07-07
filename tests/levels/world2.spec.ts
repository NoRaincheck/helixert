import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent } from '../helpers';

test.describe('World 2 — Select & Delete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await goToWorld(page, 2);
    await page.locator('#editor-input').focus();
  });

  test('2-0 Select a Line: x selects the entire line', async ({ page }) => {
    await goToLevel(page, 10);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['x']);
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-1 Restock Run: x+d deletes the selected line', async ({ page }) => {
    await goToLevel(page, 11);
    await page.locator('#editor-input').focus();
    // x selects line 1 ("DELETE this line."), d deletes it
    await pressKeys(page, ['x', 'd']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['Keep this.', 'Keep this too.']);
  });

  test('2-2 Clear the Expired: x selects each expired line', async ({ page }) => {
    await goToLevel(page, 12);
    await page.locator('#editor-input').focus();
    // x on row 1 selects the "bread — expired" line
    await pressKeys(page, ['x']);
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-3 Fix the Chocolate: x selects characters', async ({ page }) => {
    await goToLevel(page, 13);
    await page.locator('#editor-input').focus();
    // x selects the current line
    await pressKeys(page, ['x']);
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-4 Undo Mistake: x+d+u restores deleted line', async ({ page }) => {
    await goToLevel(page, 14);
    await page.locator('#editor-input').focus();
    // x selects line 1 ("Do not delete me!"), d deletes it, u undoes
    await pressKeys(page, ['x', 'd', 'u']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['Top line.', 'Do not delete me!', 'Bottom line.']);
  });
});
