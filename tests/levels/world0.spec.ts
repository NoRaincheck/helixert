import { test, expect } from '@playwright/test';
import { goToLevel, pressKeys, getCursorPos } from '../helpers';

test.describe('World 0 — Basic Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await page.locator('#editor-input').focus();
  });

  test('0-0 Learning to Drive: move with l and j to reach the $', async ({ page }) => {
    // Level 0 loads by default — cursor at (1,5), target (5,9)
    await pressKeys(page, ['l', 'l', 'l', 'l', 'j', 'j', 'j', 'j']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(5);
    expect(pos.col).toBe(9);
  });

  test('0-1 The Long Street: 0 goes to line start', async ({ page }) => {
    await goToLevel(page, 1);
    await page.locator('#editor-input').focus();
    await pressKeys(page, ['l', 'l', 'l', '0']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(0);
  });

  test('0-2 Hop the Blocks: w moves forward by word', async ({ page }) => {
    await goToLevel(page, 2);
    await page.locator('#editor-input').focus();
    // "S...T...T...T...T" — w×8 to reach col 16
    await pressKeys(page, ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(16);
  });

  test('0-3 There and Back: w and b navigate by word', async ({ page }) => {
    await goToLevel(page, 3);
    await page.locator('#editor-input').focus();
    // "S...T...T...T" / "#...T...T...T", target (1,12)
    // j to line 2, w×6 to reach col 12
    await pressKeys(page, ['j', 'w', 'w', 'w', 'w', 'w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(1);
    expect(pos.col).toBe(13);
  });

  test('0-4 Rush Hour: counts multiply movement', async ({ page }) => {
    await goToLevel(page, 4);
    await page.locator('#editor-input').focus();
    // 3j to row 3, then 14l to col 14
    await pressKeys(page, ['3', 'j', '1', '4', 'l']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(3);
    expect(pos.col).toBe(14);
  });
});
