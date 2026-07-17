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
    expect(content).toEqual(["The qyick brown fox"]);
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
    await pressKeys(page, ["l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(6);
  });

  test("3-11 h moves left in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["l", "l", "h"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(6);
  });

  test("3-12 w moves by word in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["w", "w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(9);
  });

  test("3-13 b moves backward by word in World 3 levels", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["w", "w", "b"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeLessThan(12);
  });

  test("3-14 Swap the Cones: v+l+d+p swaps AB to BA", async ({ page }) => {
    await goToLevel(page, 17);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "d", "p"]);
    const content = await getEditorContent(page);
    expect(content).toEqual(["BA"]);
  });

  test("3-15 Swap the Cones: cursor lands after paste", async ({ page }) => {
    await goToLevel(page, 17);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "d", "p"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(1);
  });

  test("3-16 d without selection deletes single char", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    const contentBefore = await getEditorContent(page);
    expect(contentBefore[0]).toContain("qyick");
    await pressKeys(page, ["d"]);
    const contentAfter = await getEditorContent(page);
    expect(contentAfter[0]).not.toContain("qyick");
    expect(contentAfter[0]).toContain("qick");
  });


  test("3-18 d+l+p swaps characters in normal mode", async ({ page }) => {
    await goToLevel(page, 17);
    await page.locator("#editor-input").focus();
    // "AB" → d (delete 'A', yank), l (move right), p (paste 'A')
    await pressKeys(page, ["d", "l", "p"]);
    const content = await getEditorContent(page);
    expect(content).toEqual(["BA"]);
  });

  test("3-17 p does nothing when yank register is empty", async ({ page }) => {
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["p"]);
    const content = await getEditorContent(page);
    expect(content).toEqual(["The qyick brown fox"]);
  });
});
