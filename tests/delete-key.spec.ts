import { expect, test } from "@playwright/test";
import {
  getCursorPos,
  getEditorContent,
  getMode,
  goToLevel,
  goToWorld,
  pressKeys,
} from "./helpers";

test.describe("Delete key in INSERT mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await goToWorld(page, 5);
    await page.locator("#editor-input").focus();
  });

  test("removes the character at the cursor", async ({ page }) => {
    await goToLevel(page, 27); // ["First line.", "Second line."], cursor {0,5}
    await pressKeys(page, ["i"]);
    expect(await getMode(page)).toBe("INSERT");

    await pressKeys(page, ["Delete"]);

    expect(await getEditorContent(page)).toEqual([
      "Firstline.",
      "Second line.",
    ]);
    const pos = await getCursorPos(page);
    expect(pos).toEqual({ row: 0, col: 5 });
  });

  test("at end of line merges with the next line", async ({ page }) => {
    await goToLevel(page, 27); // ["First line.", "Second line."]
    await pressKeys(page, ["A"]); // cursor to end of line 0, INSERT

    await pressKeys(page, ["Delete"]);

    expect(await getEditorContent(page)).toEqual(["First line.Second line."]);
    const pos = await getCursorPos(page);
    expect(pos).toEqual({ row: 0, col: 11 });
  });

  test("at end of buffer is a no-op", async ({ page }) => {
    await goToLevel(page, 26); // ["The answer is"], cursor at end
    await pressKeys(page, ["i"]);
    expect(await getMode(page)).toBe("INSERT");

    await pressKeys(page, ["Delete"]);

    expect(await getEditorContent(page)).toEqual(["The answer is"]);
    const pos = await getCursorPos(page);
    expect(pos).toEqual({ row: 0, col: 13 });
  });

  test("can be undone", async ({ page }) => {
    await goToLevel(page, 27); // ["First line.", "Second line."], cursor {0,5}
    await pressKeys(page, ["i", "Delete"]);
    expect(await getEditorContent(page)).toEqual([
      "Firstline.",
      "Second line.",
    ]);

    await pressKeys(page, ["Escape"]);
    await pressKeys(page, ["u"]);

    expect(await getEditorContent(page)).toEqual([
      "First line.",
      "Second line.",
    ]);
  });
});
