import { expect, test } from "@playwright/test";
import {
  getCommandLog,
  getCursorPos,
  getEditorContent,
  getMode,
  getStatusBar,
  goToLevel,
  goToWorld,
  pressKeys,
} from "../helpers";

test.describe("World 3 — Replace & Swap", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await goToWorld(page, 3);
    await page.locator("#editor-input").focus();
  });

  test("3-0 Replace mode enters on r key", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("3-1 Status bar shows NORMAL after replace operations", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r"]);
    const status = await getStatusBar(page);
    expect(status).toContain("NORMAL");
  });

  test("3-2 Command log is cleared after operations", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r"]);
    const log = await getCommandLog(page);
    expect(log).toBe("");
  });

  test("3-3 Multiple r presses are handled sequentially", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r", "r", "r"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("3-4 Level 3-0 content correct on load", async ({ page }) => {
    await goToLevel(page, 15);
    const content = await getEditorContent(page);
    expect(content).toEqual(["The quik brown fox"]);
  });

  test("3-5 Level 3-1 content correct on load", async ({ page }) => {
    await goToLevel(page, 16);
    const content = await getEditorContent(page);
    expect(content).toEqual(["X-X-X-X-X"]);
  });

  test("3-6 Level 3-2 content correct on load", async ({ page }) => {
    await goToLevel(page, 17);
    const content = await getEditorContent(page);
    expect(content).toEqual(["AB"]);
  });

  test("3-7 Level 3-3 content correct on load", async ({ page }) => {
    await goToLevel(page, 18);
    const content = await getEditorContent(page);
    expect(content).toEqual(["foo---bar"]);
  });

  test("3-8 Level 3-4 content correct on load", async ({ page }) => {
    await goToLevel(page, 19);
    const content = await getEditorContent(page);
    expect(content).toEqual(["aaa bbb ccc"]);
  });

  test("3-9 World 3 tab shows correct icon", async ({ page }) => {
    await goToWorld(page, 3);
    const tab = page.locator(`#world-tabs button[data-world="3"]`);
    await expect(tab).toContainText("The Flavour Shelf");
  });

  test("3-10 Movement works in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    // l should move right
    await pressKeys(page, ["l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(1);
  });

  test("3-11 h moves left in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    // Move right then left
    await pressKeys(page, ["l", "l", "h"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(1);
  });

  test("3-12 w moves by word in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    // "The quik brown fox" — w×3 to "brown"
    await pressKeys(page, ["w", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(9);
  });

  test("3-13 b moves backward by word in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    // w×2 to "quik", then b goes back to "The"
    await pressKeys(page, ["w", "w", "b"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeLessThan(9);
  });
});
