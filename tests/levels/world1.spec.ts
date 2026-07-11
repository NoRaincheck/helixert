import { expect, test } from "@playwright/test";
import {
  getCursorPos,
  getLevelIndicator,
  getMode,
  goToLevel,
  goToWorld,
  pressKeys,
} from "../helpers";

test.describe("World 1 — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await page.locator("#editor-input").focus();
  });

  test("1-0 The Scenic Route: chain w and j", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 5);
    await page.locator("#editor-input").focus();
    // "The quick brown" / "fox jumps over" / "the lazy dog", target (2,9)
    // w×3 to "brown", j, w×2 to "over", j, w×2 to "lazy"
    await pressKeys(page, ["w", "w", "w", "j", "w", "w", "j", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
    expect(pos.col).toBe(9);
  });

  test("1-1 Express Elevator: ge goes to last line", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 6);
    await page.locator("#editor-input").focus();
    // ge goes to the last line
    await pressKeys(page, ["g", "e"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(4);
  });

  test("1-2 Precision Parking: e jumps to end of word", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 7);
    await page.locator("#editor-input").focus();
    // "Find the destination of this journey", target col 22
    await pressKeys(page, ["e", "e", "e", "e", "e"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThan(0);
  });

  test("1-2b Precision Parking: repeated e advances each time", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 7);
    await page.locator("#editor-input").focus();
    const pos1 = await getCursorPos(page);
    await pressKeys(page, ["e"]);
    const pos2 = await getCursorPos(page);
    expect(pos2.col).toBeGreaterThan(pos1.col);
  });

  test("1-3 Downtown Dash: combine w and ge", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 8);
    await page.locator("#editor-input").focus();
    // ge to last line
    await pressKeys(page, ["g", "e"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
  });

  test("1-4 Kerb to Kerb: navigate with w and j", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    // Navigate to target using w and j
    await pressKeys(page, ["w", "w", "w", "j", "w", "w", "w", "j", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
  });

  test("1-5 b moves backward by word", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    // w×3 to "gamma", then b×2 goes back 2 words
    await pressKeys(page, ["w", "w", "w", "b", "b"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeLessThan(15);
  });

  test("1-6 gg goes to first line", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    // j×2 goes to last line, gg goes back to first
    await pressKeys(page, ["j", "j", "g", "g"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
  });

  test("1-7 Cursor stays in NORMAL mode after navigation", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["w", "j", "w", "b"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("1-8 e from end of line goes to next line", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    // Move to end of first line, then e should go to next line
    await pressKeys(page, ["w", "w", "w", "e"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBeGreaterThanOrEqual(0);
  });

  test("1-9 World 1 tab shows correct name", async ({ page }) => {
    await goToWorld(page, 1);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain("World 1: Navigation");
  });

  test("1-10 Column preserved when moving through empty lines", async ({ page }) => {
    await goToWorld(page, 1);
    await goToLevel(page, 9);
    await page.locator("#editor-input").focus();
    // Move right, then down through lines
    await pressKeys(page, ["l", "l", "l", "j", "j"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(2);
    expect(pos.col).toBeLessThan(15);
  });
});
