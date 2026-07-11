import { expect, test } from "@playwright/test";
import {
  getCommandLog,
  getCursorPos,
  getEditorContent,
  getMode,
  goToLevel,
  goToWorld,
  pressKeys,
} from "./helpers";

test.describe("Reset Level button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await page.locator("#editor-input").focus();
  });

  test("textarea does not block the reset button", async ({ page }) => {
    const textarea = page.locator("#editor-input");
    const pointerEvents = await textarea.evaluate(
      (el) => getComputedStyle(el).pointerEvents,
    );
    expect(pointerEvents).toBe("none");
  });

  test("reset button is visible and enabled", async ({ page }) => {
    const btn = page.locator("#reset-btn");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("reset restores initial content after text change", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15); // World 3, "Wrong Scoop"
    await page.locator("#editor-input").focus();

    // Replace 'k' at cursor with 'z' (r then z)
    await pressKeys(page, ["r", "z"]);
    let content = await getEditorContent(page);
    expect(content).toEqual(["The quiz brown fox"]);

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    content = await getEditorContent(page);
    expect(content).toEqual(["The quik brown fox"]);
  });

  test("reset restores initial cursor position", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15); // World 3, "Wrong Scoop" — setup cursor at col 7
    await page.locator("#editor-input").focus();

    // Move cursor away from starting position
    await pressKeys(page, ["l", "l", "l", "l", "l"]);
    let pos = await getCursorPos(page);
    expect(pos.col).toBe(12);

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    pos = await getCursorPos(page);
    expect(pos.row).toBe(0);
    expect(pos.col).toBe(7);
  });

  test("reset clears mode back to NORMAL", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Enter SELECT mode then reset
    await pressKeys(page, ["v"]);
    let mode = await getMode(page);
    expect(mode).toBe("SELECT");

    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("reset clears command log", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Type some keys that show in the log
    await pressKeys(page, ["g"]);
    let log = await getCommandLog(page);
    expect(log).toBe("g");

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    log = await getCommandLog(page);
    expect(log).toBe("");
  });

  test("reset works after replace pending is set", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Press 'r' to enter replace pending state
    await pressKeys(page, ["r"]);

    // Click reset before completing the replace
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    // Content should be unchanged and mode should be NORMAL
    const content = await getEditorContent(page);
    expect(content).toEqual(["The quik brown fox"]);
    const mode = await getMode(page);
    expect(mode).toBe("NORMAL");
  });

  test("reset works on World 3 level 3-1 (Restamp the Row)", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 16);
    await page.locator("#editor-input").focus();

    // Replace first X (col 0) with O, move right twice (past dash) to next X
    await pressKeys(page, ["r", "o", "l", "l", "r", "o"]);
    let content = await getEditorContent(page);
    expect(content).toEqual(["o-o-X-X-X"]);

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    content = await getEditorContent(page);
    expect(content).toEqual(["X-X-X-X-X"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(0);
  });

  test("reset works after undo operations", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Make a change
    await pressKeys(page, ["r", "z"]);
    let content = await getEditorContent(page);
    expect(content).toEqual(["The quiz brown fox"]);

    // Undo it
    await pressKeys(page, ["u"]);
    content = await getEditorContent(page);
    expect(content).toEqual(["The quik brown fox"]);

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    // Should still be original content
    content = await getEditorContent(page);
    expect(content).toEqual(["The quik brown fox"]);
    const pos = await getCursorPos(page);
    expect(pos.col).toBe(7);
  });

  test("reset works on World 0", async ({ page }) => {
    // World 0 is the default — level 0 is already visible
    await goToLevel(page, 0);
    await page.locator("#editor-input").focus();
    const initialContent = await getEditorContent(page);

    // Move cursor
    await pressKeys(page, ["l", "l", "l"]);
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    const content = await getEditorContent(page);
    expect(content).toEqual(initialContent);
  });

  test("reset works on World 2", async ({ page }) => {
    await goToWorld(page, 2);
    await goToLevel(page, 10);
    await page.locator("#editor-input").focus();
    const initialContent = await getEditorContent(page);

    await pressKeys(page, ["x"]);
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    const content = await getEditorContent(page);
    expect(content).toEqual(initialContent);
  });

  test("reset does not affect completed level tracking", async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Solve the level: insert 'c' at cursor (col 7) to turn "quik" → "quick"
    await pressKeys(page, ["i"]);
    await page.keyboard.press("c");
    await page.waitForTimeout(50);
    await pressKeys(page, ["Escape"]);
    await page.waitForTimeout(600); // wait for modal

    // Dismiss completion modal (Enter goes to next level)
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    // Go back to level 15
    await goToLevel(page, 15);
    await page.locator("#editor-input").focus();

    // Click reset
    await page.locator("#reset-btn").click();
    await page.waitForTimeout(200);

    // Switch to a different level so button shows "completed" not "current"
    await goToLevel(page, 16);
    await page.waitForTimeout(200);

    // Level 15 should still be marked completed after reset
    const levelBtn = page.locator(
      '#level-selection button[data-level="15"]',
    );
    await expect(levelBtn).toHaveClass(/completed/);
  });
});
