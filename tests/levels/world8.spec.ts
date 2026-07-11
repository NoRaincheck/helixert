import { expect, test } from "@playwright/test";
import {
  getCommandLog,
  getCursorPos,
  getEditorContent,
  getMode,
  getStatusBar,
  goToLevel,
  goToWorld,
  pressKeyCombo,
  pressKeys,
} from "../helpers";

test.describe("World 8 — Advanced Techniques", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await goToWorld(page, 8);
    await page.locator("#editor-input").focus();
  });

  test("8-0 Dot repeat key is processed in NORMAL mode", async ({ page }) => {
    await goToLevel(page, 40);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["."]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("8-1 Undo key is processed in NORMAL mode", async ({ page }) => {
    await goToLevel(page, 40);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["u"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("8-2 Status bar shows NORMAL after advanced operations", async ({ page }) => {
    await goToLevel(page, 40);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r", "o"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("8-3 Command log is cleared after operations", async ({ page }) => {
    await goToLevel(page, 40);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["r", "o"]);
    const log = await getCommandLog(page);
    expect(log).toBe("");
  });

  test("8-4 Level 8-0 content correct on load", async ({ page }) => {
    await goToLevel(page, 40);
    const content = await getEditorContent(page);
    expect(content).toEqual(["X X X X X"]);
  });

  test("8-5 Level 8-1 content correct on load", async ({ page }) => {
    await goToLevel(page, 41);
    const content = await getEditorContent(page);
    expect(content).toEqual(["Original text here"]);
  });

  test("8-6 Level 8-2 content correct on load", async ({ page }) => {
    await goToLevel(page, 42);
    const content = await getEditorContent(page);
    expect(content).toEqual(["(nested (brackets) here)"]);
  });

  test("8-7 Level 8-3 content correct on load", async ({ page }) => {
    await goToLevel(page, 43);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      "one two three four five",
      "six seven eight nine ten",
      "TARGET is here",
    ]);
  });

  test("8-8 Level 8-4 content correct on load", async ({ page }) => {
    await goToLevel(page, 44);
    const content = await getEditorContent(page);
    expect(content).toEqual([
      "fix the typos: helx is awsome",
      "and search for the target word",
    ]);
  });

  test("8-9 World 8 tab shows correct name", async ({ page }) => {
    await goToWorld(page, 8);
    const tab = page.locator(`#world-tabs button[data-world="8"]`);
    await expect(tab).toContainText("The Back Office");
  });

  test("8-10 Movement works in World 8 levels", async ({ page }) => {
    await goToLevel(page, 40);
    await page.locator("#editor-input").focus();
    // l should move right
    await pressKeys(page, ["l", "l", "l"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(3);
  });

  test("8-11 w moves by word in World 8 levels", async ({ page }) => {
    await goToLevel(page, 43);
    await page.locator("#editor-input").focus();
    // "one two three four five" — w×2 to "three"
    await pressKeys(page, ["w", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(8);
  });

  test("8-12 % key is processed in NORMAL mode", async ({ page }) => {
    await goToLevel(page, 42);
    await page.locator("#editor-input").focus();
    await pressKeys(page, ["%"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("8-13 Count with w multiplies movement", async ({ page }) => {
    await goToLevel(page, 43);
    await page.locator("#editor-input").focus();
    // 3w jumps 3 words
    await pressKeys(page, ["3", "w"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBeGreaterThanOrEqual(10);
  });

  test("8-14 j moves down in World 8 levels", async ({ page }) => {
    await goToLevel(page, 43);
    await page.locator("#editor-input").focus();
    // j moves down
    await pressKeys(page, ["j"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(1);
  });

  test("8-15 k moves up in World 8 levels", async ({ page }) => {
    await goToLevel(page, 43);
    await page.locator("#editor-input").focus();
    // j to line 2, k back to line 1
    await pressKeys(page, ["j", "k"]);
    const pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
  });
});
