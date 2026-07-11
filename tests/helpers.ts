import { expect, type Page } from "@playwright/test";

/** Focus the editor textarea. */
async function focusEditor(page: Page) {
  await page.locator("#editor-input").focus();
}

/** Click a world tab by its number (0-indexed). */
export async function goToWorld(page: Page, worldNum: number) {
  const tab = page.locator(`#world-tabs button[data-world="${worldNum}"]`);
  await tab.click();
  await page.waitForTimeout(200);
}

/** Click a level button by its global index and refocus the editor. */
export async function goToLevel(page: Page, levelIndex: number) {
  const btn = page.locator(
    `#level-selection button[data-level="${levelIndex}"]`,
  );
  await btn.click();
  await page.waitForTimeout(200);
  await focusEditor(page);
}

/**
 * Press a sequence of keys using Playwright's keyboard API.
 * Each key is pressed individually with a delay to ensure
 * the event handlers process each key before the next one arrives.
 * Uses page.keyboard.press() which sends keys to the focused textarea.
 */
export async function pressKeys(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(50);
  }
  // Wait for final UI render
  await page.waitForTimeout(50);
}

/** Get all visible editor content lines from the DOM. */
export async function getEditorContent(page: Page): Promise<string[]> {
  const lines = await page.locator("#editor-display .line .line-content")
    .allTextContents();
  return lines.map((l) => l.replace(/\u00A0/g, " ").trimEnd());
}

/** Get the current cursor position by finding the .cursor span. */
export async function getCursorPos(
  page: Page,
): Promise<{ row: number; col: number }> {
  return page.evaluate(() => {
    const display = document.getElementById("editor-display");
    if (!display) return { row: 0, col: 0 };
    const lines = display.querySelectorAll(".line");
    for (let r = 0; r < lines.length; r++) {
      const cursorSpan = lines[r].querySelector(
        ".cursor, .insert-cursor, .selected-cursor",
      );
      if (cursorSpan) {
        const lineContent = lines[r].querySelector(".line-content");
        if (!lineContent) return { row: r, col: 0 };
        let col = 0;
        for (const node of Array.from(lineContent.childNodes)) {
          if (node === cursorSpan) break;
          col += (node.textContent || "").length;
        }
        return { row: r, col };
      }
    }
    return { row: 0, col: 0 };
  });
}

/** Get current mode from status bar text. */
export async function getMode(page: Page): Promise<string> {
  const text = await page.locator("#status-bar").textContent();
  const match = text?.match(/-- (\w+) --/);
  return match?.[1] ?? "UNKNOWN";
}

/** Type text into the hidden editor textarea (for INSERT mode typing). */
export async function typeText(page: Page, text: string) {
  await page.locator("#editor-input").pressSequentially(text, { delay: 30 });
}

/** Press Escape key to exit INSERT/SELECT/Search mode. */
export async function pressEscape(page: Page) {
  await page.locator("#editor-input").press("Escape");
  await page.waitForTimeout(50);
}

/** Get the full editor content as a single string (lines joined by newlines). */
export async function getEditorContentString(page: Page): Promise<string> {
  const lines = await getEditorContent(page);
  return lines.join("\n");
}

/** Get the modal title text. */
export async function getModalTitle(page: Page): Promise<string> {
  const title = await page.locator("#modal-title").textContent();
  return title?.trim() ?? "";
}

/** Check if the modal is visible. */
export async function isModalVisible(page: Page): Promise<boolean> {
  return page.locator("#modal").isVisible();
}

/** Get the level indicator text. */
export async function getLevelIndicator(page: Page): Promise<string> {
  return (await page.locator("#level-indicator").textContent())?.trim() ?? "";
}

/** Get the command log text. */
export async function getCommandLog(page: Page): Promise<string> {
  return (await page.locator("#command-log").textContent())?.trim() ?? "";
}

/** Get the instructions text. */
export async function getInstructions(page: Page): Promise<string> {
  return (await page.locator("#instructions").textContent())?.trim() ?? "";
}

/** Get the status bar text. */
export async function getStatusBar(page: Page): Promise<string> {
  return (await page.locator("#status-bar").textContent())?.trim() ?? "";
}

/** Click the "Next Level" button in the modal. */
export async function clickNextLevel(page: Page) {
  await page.locator("#next-level-btn").click();
  await page.waitForTimeout(200);
}

/** Press a key combination (e.g., 'Control+u' for redo). */
export async function pressKeyCombo(page: Page, combo: string) {
  await page.locator("#editor-input").press(combo);
  await page.waitForTimeout(50);
}

/** Get the target content from the target column. */
export async function getTargetContent(page: Page): Promise<string | null> {
  const el = page.locator("#target-content");
  if (await el.isVisible()) {
    return (await el.textContent())?.trim() ?? null;
  }
  return null;
}

/** Check if the target column is visible. */
export async function isTargetVisible(page: Page): Promise<boolean> {
  const el = page.locator("#target-column");
  return el.isVisible();
}
