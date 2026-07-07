import { type Page, expect } from '@playwright/test';

/** Focus the editor textarea. */
async function focusEditor(page: Page) {
  await page.locator('#editor-input').focus();
}

/** Click a world tab by its number (0-indexed). */
export async function goToWorld(page: Page, worldNum: number) {
  const tab = page.locator(`#world-tabs button[data-world="${worldNum}"]`);
  await tab.click();
  await page.waitForTimeout(200);
}

/** Click a level button by its global index and refocus the editor. */
export async function goToLevel(page: Page, levelIndex: number) {
  const btn = page.locator(`#level-selection button[data-level="${levelIndex}"]`);
  await btn.click();
  await page.waitForTimeout(200);
  await focusEditor(page);
}

/**
 * Press a sequence of keys by dispatching ALL events in a single browser
 * evaluate call with async delays between each. This avoids per-key
 * round-trip overhead that causes dropped events.
 */
export async function pressKeys(page: Page, keys: string[]) {
  await page.evaluate(async (keyList: string[]) => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    for (const key of keyList) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await delay(15);
    }
  }, keys);
  // Wait for final UI render
  await page.waitForTimeout(50);
}

/** Get all visible editor content lines from the DOM. */
export async function getEditorContent(page: Page): Promise<string[]> {
  const lines = await page.locator('#editor-display .line .line-content').allTextContents();
  return lines.map(l => l.replace(/\u00A0/g, ' ').trimEnd());
}

/** Get the current cursor position by finding the .cursor span. */
export async function getCursorPos(page: Page): Promise<{ row: number; col: number }> {
  return page.evaluate(() => {
    const display = document.getElementById('editor-display');
    if (!display) return { row: 0, col: 0 };
    const lines = display.querySelectorAll('.line');
    for (let r = 0; r < lines.length; r++) {
      const cursorSpan = lines[r].querySelector('.cursor, .insert-cursor, .selected-cursor');
      if (cursorSpan) {
        const lineContent = lines[r].querySelector('.line-content');
        if (!lineContent) return { row: r, col: 0 };
        let col = 0;
        for (const node of Array.from(lineContent.childNodes)) {
          if (node === cursorSpan) break;
          col += (node.textContent || '').length;
        }
        return { row: r, col };
      }
    }
    return { row: 0, col: 0 };
  });
}

/** Get current mode from status bar text. */
export async function getMode(page: Page): Promise<string> {
  const text = await page.locator('#status-bar').textContent();
  const match = text?.match(/-- (\w+) --/);
  return match?.[1] ?? 'UNKNOWN';
}
