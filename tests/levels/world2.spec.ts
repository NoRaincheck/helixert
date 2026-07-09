import { test, expect } from '@playwright/test';
import { goToLevel, goToWorld, pressKeys, getEditorContent, getCursorPos, getMode, pressEscape, getLevelIndicator } from '../helpers';

test.describe('World 2 — Select & Delete', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await page.locator('#editor-input').focus();
  });

  test('2-0 Select a Line: x selects the entire line', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 10);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['x']);
    // Check that selection spans exist in the DOM
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-1 Restock Run: x+d deletes a line', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 11);
    await page.locator('#editor-input').focus();
    // x selects line, d deletes it
    await pressKeys(page, ['x', 'd']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['Keep this.', 'Keep this too.']);
  });

  test('2-2 Clear the Expired: delete multiple lines', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 12);
    await page.locator('#editor-input').focus();
    // Delete "bread — expired" line
    await pressKeys(page, ['x', 'd']);
    // Delete "cheese — expired" line
    await pressKeys(page, ['x', 'd']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['milk — fresh', 'eggs — fresh', 'butter — fresh']);
  });

  test('2-3 Fix the Chocolate: delete individual characters', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 13);
    await page.locator('#editor-input').focus();
    // Delete 5 exclamation marks
    await pressKeys(page, ['d', 'd', 'd', 'd', 'd']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['chocolate', 'strawberry']);
  });

  test('2-4 Undo Mistake: x+d then u restores', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 14);
    await page.locator('#editor-input').focus();
    // Delete the middle line
    await pressKeys(page, ['x', 'd']);
    // Undo the deletion
    await pressKeys(page, ['u']);
    const content = await getEditorContent(page);
    expect(content).toEqual(['Top line.', 'Do not delete me!', 'Bottom line.']);
  });

  test('2-5 x on expired lines still selects', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 12);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['x']);
    // Check that selection spans exist
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-6 Character selection with v and l', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 13);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['v', 'l', 'l', 'l']);
    // Check that selection spans exist
    const selected = page.locator('#editor-display .selected, #editor-display .selected-cursor');
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2-7 Cursor resets after x selection', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 10);
    await page.locator('#editor-input').focus();
    const posBefore = await getCursorPos(page);
    await pressKeys(page, ['x']);
    const posAfter = await getCursorPos(page);
    // Cursor should still be on the selected line
    expect(posAfter.row).toBe(posBefore.row);
  });

  test('2-8 Selection cleared after delete', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 10);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['x']);
    const selectedBefore = page.locator('#editor-display .selected').count();
    await pressKeys(page, ['d']);
    const selectedAfter = await page.locator('#editor-display .selected').count();
    expect(selectedAfter).toBe(0);
  });

  test('2-9 Delete without selection deletes character under cursor', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 13);
    await page.locator('#editor-input').focus();
    // d without x should delete the character under cursor
    const contentBefore = await getEditorContent(page);
    await pressKeys(page, ['d']);
    const contentAfter = await getEditorContent(page);
    expect(contentAfter[0]).not.toEqual(contentBefore[0]);
  });

  test('2-10 Multiple deletes reduce line count', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 12);
    await page.locator('#editor-input').focus();
    const contentBefore = await getEditorContent(page);
    expect(contentBefore.length).toBe(5);
    await pressKeys(page, ['x', 'd']);
    const contentAfter = await getEditorContent(page);
    expect(contentAfter.length).toBe(4);
  });

  test('2-11 Cursor stays in NORMAL mode after operations', async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 11);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['x', 'd']);
    const mode = await getMode(page);
    expect(mode).toBe('NORMAL');
  });

  test('2-12 World 2 tab shows correct name', async ({ page }) => {
    await goToWorld(page, 2);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('World 2: The Stock Room');
  });
});
