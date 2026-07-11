import { expect, test } from "@playwright/test";
import {
  getCursorPos,
  getLevelIndicator,
  getMode,
  goToLevel,
  goToWorld,
  pressKeys,
} from "../helpers";

test.describe("World 0 — Basic Movement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await page.locator("#editor-input").focus();
  });

  test("0-0 Learning to Drive: move with l and j to reach the $", async ({ page }) => {
    // Level 0 loads by default — cursor at (1,5), target (5,9)
    await pressKeys(page, ["l", "l", "l", "l", "j", "j", "j", "j"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(5);
    expect(pos.col).toBe(9);
  });

  test("0-1 The Long Street: gh goes to line start, gl to line end", async ({ page }) => {
    await goToLevel(page, 1);
    await page.locator("#editor-input").focus();
    // gl goes to end of line — col 38 is the target
    await pressKeys(page, ["g", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(38);
  });

  test("0-2 Hop the Blocks: w moves forward by word", async ({ page }) => {
    await goToLevel(page, 2);
    await page.locator("#editor-input").focus();
    // "S...T...T...T...T" — w×8 to reach col 16
    await pressKeys(page, ["w", "w", "w", "w", "w", "w", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(16);
  });

  test("0-3 There and Back: w and b navigate by word", async ({ page }) => {
    await goToLevel(page, 3);
    await page.locator("#editor-input").focus();
    // "S...T...T...T" / "#...T...T...T", target (1,12)
    // j to line 2, w×6 to reach col 12
    await pressKeys(page, ["j", "w", "w", "w", "w", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(1);
    expect(pos.col).toBe(13);
  });

  test("0-4 Rush Hour: counts multiply movement", async ({ page }) => {
    await goToLevel(page, 4);
    await page.locator("#editor-input").focus();
    // 3j to row 3, then 14l to col 14
    await pressKeys(page, ["3", "j", "1", "4", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(3);
    expect(pos.col).toBe(14);
  });

  test("0-5 k moves up", async ({ page }) => {
    await goToLevel(page, 0);
    await page.locator("#editor-input").focus();
    // j×4 goes to row 5 (last line), k×2 goes back to row 3
    await pressKeys(page, ["j", "j", "j", "j", "k", "k"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(3);
  });

  test("0-6 h moves left", async ({ page }) => {
    await goToLevel(page, 0);
    await page.locator("#editor-input").focus();
    // l×3 goes to col 8, h×2 goes back to col 6
    await pressKeys(page, ["l", "l", "l", "h", "h"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(6);
  });

  test("0-7 Count with l multiplies movement", async ({ page }) => {
    await goToLevel(page, 0);
    await page.locator("#editor-input").focus();
    // 5l moves 5 columns right
    await pressKeys(page, ["5", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(10);
  });

  test("0-8 Cursor stays in NORMAL mode after movement", async ({ page }) => {
    await goToLevel(page, 0);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["j", "j", "l", "l"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("0-9 gh goes to line start", async ({ page }) => {
    await goToLevel(page, 1);
    await page.locator("#editor-input").focus();
    // Move to end first, then gh goes to start
    await pressKeys(page, ["g", "l", "g", "h"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(0);
  });

  test("0-10 Movement across empty lines preserves column", async ({ page }) => {
    await goToLevel(page, 4);
    await page.locator("#editor-input").focus();
    // Move down through lines with empty lines in between
    await pressKeys(page, ["j", "j", "j", "j"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(4);
    expect(pos.col).toBe(0);
  });

  test("0-11 World 0 tab shows correct name", async ({ page }) => {
    await goToWorld(page, 0);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain("World 0: First Steps");
  });
});
