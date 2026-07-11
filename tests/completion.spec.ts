import { expect, test } from "@playwright/test";
import {
  clickNextLevel,
  getCommandLog,
  getCursorPos,
  getEditorContent,
  getInstructions,
  getLevelIndicator,
  getMode,
  getStatusBar,
  goToLevel,
  goToWorld,
  isModalVisible,
  pressKeys,
} from "./helpers";

test.describe("Completion system", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.waitForSelector("#editor-display .line");
    await page.locator("#editor-input").focus();
  });

  test("modal title exists on page", async ({ page }) => {
    const title = page.locator("#modal-title");
    await expect(title).toHaveText(/Level Complete|Level Complete!/);
  });

  test("modal has next level button", async ({ page }) => {
    const btn = page.locator("#next-level-btn");
    await expect(btn).toBeVisible();
  });

  test("celebration has restart button element", async ({ page }) => {
    const btn = page.locator("#celebration-restart");
    await expect(btn).toHaveAttribute("id", "celebration-restart");
  });

  test("celebration title element exists", async ({ page }) => {
    const title = page.locator(".celebration-title");
    await expect(title).toHaveText("MASTERED!");
  });

  test("celebration text element exists", async ({ page }) => {
    const text = page.locator(".celebration-text");
    await expect(text).toHaveText(/You've conquered all/);
  });

  test("next level button is enabled", async ({ page }) => {
    const btn = page.locator("#next-level-btn");
    await expect(btn).toBeEnabled();
  });

  test("celebration restart button is enabled", async ({ page }) => {
    const btn = page.locator("#celebration-restart");
    await expect(btn).toBeEnabled();
  });

  test("modal content container exists", async ({ page }) => {
    const modalContent = page.locator("#modal-content");
    await expect(modalContent).toHaveAttribute("id", "modal-content");
  });

  test("modal message container exists", async ({ page }) => {
    const message = page.locator("#modal-message");
    await expect(message).toHaveAttribute("id", "modal-message");
  });

  test("modal background exists", async ({ page }) => {
    const bg = page.locator("#modal");
    await expect(bg).toHaveAttribute("id", "modal");
  });

  test("celebration overlay exists", async ({ page }) => {
    const overlay = page.locator("#celebration");
    await expect(overlay).toHaveAttribute("id", "celebration");
  });

  test("celebration overlay has overlay element", async ({ page }) => {
    const overlay = page.locator("#celebration .celebration-overlay");
    await expect(overlay).toHaveClass(/celebration-overlay/);
  });

  test("modal has z-50 class", async ({ page }) => {
    const modal = page.locator("#modal");
    const style = await modal.getAttribute("class");
    expect(style).toContain("z-50");
  });

  test("celebration has z-50 class", async ({ page }) => {
    const celebration = page.locator("#celebration");
    const style = await celebration.getAttribute("class");
    expect(style).toContain("z-50");
  });

  test("celebration has hidden class by default", async ({ page }) => {
    const celebration = page.locator("#celebration");
    const style = await celebration.getAttribute("class");
    expect(style).toContain("hidden");
  });

  test("modal has opacity-0 by default", async ({ page }) => {
    const modal = page.locator("#modal");
    const style = await modal.getAttribute("class");
    expect(style).toContain("opacity-0");
  });

  test("all 9 worlds have 5 levels each", async ({ page }) => {
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      const buttons = page.locator("#level-selection button");
      await expect(buttons).toHaveCount(5);
    }
  });

  test("level indicator shows current level number", async ({ page }) => {
    await goToLevel(page, 0);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain("Level 1 / 5");
  });

  test("level indicator shows correct world name", async ({ page }) => {
    await goToWorld(page, 3);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain("World 3: The Flavour Shelf");
  });

  test("level indicator updates when switching worlds", async ({ page }) => {
    await goToWorld(page, 0);
    let indicator = await getLevelIndicator(page);
    expect(indicator).toContain("World 0");
    await goToWorld(page, 5);
    indicator = await getLevelIndicator(page);
    expect(indicator).toContain("World 5");
  });

  test("instructions are unique for each level", async ({ page }) => {
    const instructions = new Set<string>();
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      for (let l = 0; l < 5; l++) {
        const globalIdx = levelsPerWorld[w] + l;
        await goToLevel(page, globalIdx);
        const instr = await getInstructions(page);
        expect(instr.length).toBeGreaterThan(0);
        instructions.add(instr);
      }
    }
    expect(instructions.size).toBe(45);
  });

  test("all levels have non-empty content", async ({ page }) => {
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      for (let l = 0; l < 5; l++) {
        const globalIdx = levelsPerWorld[w] + l;
        await goToLevel(page, globalIdx);
        const content = await getEditorContent(page);
        expect(content.length).toBeGreaterThan(0);
        expect(content.some((line) => line.length > 0)).toBe(true);
      }
    }
  });

  test("command log is empty after level load", async ({ page }) => {
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      for (let l = 0; l < 5; l++) {
        const globalIdx = levelsPerWorld[w] + l;
        await goToLevel(page, globalIdx);
        const log = await getCommandLog(page);
        expect(log).toBe("");
      }
    }
  });

  test("status bar shows NORMAL after loading any level", async ({ page }) => {
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      for (let l = 0; l < 5; l++) {
        const globalIdx = levelsPerWorld[w] + l;
        await goToLevel(page, globalIdx);
        const status = await getStatusBar(page);
        expect(status).toContain("NORMAL");
      }
    }
  });
});
