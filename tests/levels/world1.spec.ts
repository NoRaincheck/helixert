import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getCursorPos } from '../helpers';

test.describe('World 1 — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    await goToWorld(page, 1);
    await page.locator('#editor-input').focus();
  });

  test('1-0 The Scenic Route: chain w and j', async ({ page }) => {
    await goToLevel(page, 5);
    await page.locator('#editor-input').focus();
    // "The quick brown" / "fox jumps over" / "the lazy dog"
    // w×2 gets to col 10, j×2 gets to line 3 col 10, l gets to col 11
    // Trace: w,w,j,j,l → (2,11)
    await pressKeys(page, ['w', 'w', 'j', 'j', 'l']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(11);
  });

  test('1-1 Express Elevator: ge goes to last line', async ({ page }) => {
    await goToLevel(page, 6);
    await page.locator('#editor-input').focus();
    // ge goes to last line (row 4, col 0)
    await pressKeys(page, ['g', 'e']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(4);
    expect(pos.col).toBe(0);
  });

  test('1-2 Precision Parking: e jumps to end of word', async ({ page }) => {
    await goToLevel(page, 7);
    await page.locator('#editor-input').focus();
    // "Find the destination of this journey"
    // e from col 0: end of "Find" (col 3)
    // e×3: "Find"→(3), "the"→(7), "destination"→(19)
    await pressKeys(page, ['e', 'e', 'e']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(19);
  });

  test('1-2b Precision Parking: repeated e advances each time', async ({ page }) => {
    await goToLevel(page, 7);
    await page.locator('#editor-input').focus();
    // Ensure consecutive e presses each move forward (not stuck at same word)
    await pressKeys(page, ['e', 'e', 'e', 'e']);
    const pos = await getCursorPos(page);
    // 4×e: "Find"(3) → "the"(7) → "destination"(19) → "of"(22)
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(22);
  });

  test('1-3 Downtown Dash: combine w and ge', async ({ page }) => {
    await goToLevel(page, 8);
    await page.locator('#editor-input').focus();
    // Trace: g→(0,0), e→(2,0), w→(2,7), w→(2,10)
    await pressKeys(page, ['g', 'e', 'w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(10);
  });

  test('1-4 Kerb to Kerb: navigate with w and j', async ({ page }) => {
    await goToLevel(page, 9);
    await page.locator('#editor-input').focus();
    // "alpha beta gamma" / "delta epsilon zeta" / "eta theta iota"
    // Trace: j→(1,0), j→(2,0), w→(2,4), w→(2,10), w→(2,14)
    await pressKeys(page, ['j', 'j', 'w', 'w', 'w']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(14);
  });
});
