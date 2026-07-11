import { expect, test } from "@playwright/test";
import {
  getCursorPos,
  getEditorContent,
  getMode,
  goToLevel,
  goToWorld,
  pressEscape,
  pressKeys,
} from "../helpers";

test.describe("World 6 — Select Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await goToWorld(page, 6);
    await page.locator("#editor-input").focus();
  });

  test("6-0 SELECT mode is reflected in status bar", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v"]);
    const mode = await getMode(page);
    expect(mode).toBe("SELECT");
  });

  test("6-1 Esc exits SELECT mode back to NORMAL", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v"]);
    await pressEscape(page);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("6-2 Selection is cleared after Esc from SELECT", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "l", "l"]);
    const selected = page.locator(
      "#editor-display .selected, #editor-display .selected-cursor",
    );
    const count1 = await selected.count();
    expect(count1).toBeGreaterThan(0);
    await pressEscape(page);
    const count2 = await selected.count();
    expect(count2).toBe(0);
  });

  test("6-3 Movement extends selection in SELECT mode", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "l", "l", "l"]);
    const selected = page.locator("#editor-display .selected");
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test("6-4 Cursor position in SELECT mode follows movement", async ({ page }) => {
    await goToLevel(page, 31);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "l", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(3);
  });

  test("6-5 x in SELECT mode extends to full line", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "x"]);
    const selected = page.locator("#editor-display .selected");
    const count = await selected.count();
    expect(count).toBeGreaterThan(0);
  });

  test("6-6 Level 6-0 content correct on load", async ({ page }) => {
    await goToLevel(page, 30);
    const content = await getEditorContent(page);
    expect(content).toEqual(["Keep this word TARGET and this."]);
  });

  test("6-7 Level 6-1 content correct on load", async ({ page }) => {
    await goToLevel(page, 31);
    const content = await getEditorContent(page);
    expect(content).toEqual(["hello world"]);
  });

  test("6-8 Level 6-2 content correct on load", async ({ page }) => {
    await goToLevel(page, 32);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      "Keep this.",
      "Delete this line.",
      "Keep this too.",
    ]);
  });

  test("6-9 Level 6-3 content correct on load", async ({ page }) => {
    await goToLevel(page, 33);
    const content = await getEditorContent(page);
    expect(content).toEqual(["remove [this text] please"]);
  });

  test("6-10 Level 6-4 content correct on load", async ({ page }) => {
    await goToLevel(page, 34);
    const content = await getEditorContent(page);
    expect(content).toEqual(["the old way is old"]);
  });

  test("6-11 World 6 tab shows correct name", async ({ page }) => {
    await goToWorld(page, 6);
    const tab = page.locator(`#world-tabs button[data-world="6"]`);
    await expect(tab).toContainText("The Modes Tour");
  });

  test("6-12 Movement works in SELECT mode", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(2);
  });

  test("6-13 h moves backward in SELECT mode", async ({ page }) => {
    await goToLevel(page, 30);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["v", "l", "l", "h"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(1);
  });
});
