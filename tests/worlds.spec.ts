import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent, getCursorPos, getMode, getInstructions, getLevelIndicator, isTargetVisible, getTargetContent } from './helpers';

const WORLD_NAMES = [
  'First Steps', 'Navigation', 'The Stock Room', 'The Flavour Shelf',
  'The Express Lane', 'The Order Book', 'The Modes Tour', 'Spot Check', 'The Back Office',
];

test.describe('World tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#world-tabs button');
  });

  test('renders all 9 world tabs', async ({ page }) => {
    const tabs = page.locator('#world-tabs button');
    await expect(tabs).toHaveCount(9);
  });

  test('each tab displays the correct world name', async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      const tab = page.locator(`#world-tabs button[data-world="${i}"]`);
      await expect(tab).toContainText(WORLD_NAMES[i]);
    }
  });

  test('clicking a world tab updates the level indicator', async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      await goToWorld(page, i);
      const indicator = page.locator('#level-indicator');
      await expect(indicator).toContainText(`World ${i}: ${WORLD_NAMES[i]}`);
    }
  });

  test('each world shows 5 level buttons', async ({ page }) => {
    for (let i = 0; i < 9; i++) {
      await goToWorld(page, i);
      const buttons = page.locator('#level-selection button');
      await expect(buttons).toHaveCount(5);
    }
  });

  test('first level loads by default on page load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    const indicator = page.locator('#level-indicator');
    await expect(indicator).toContainText('Level 1 / 5');
  });

  test('status bar shows NORMAL mode on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status-bar');
    const bar = page.locator('#status-bar');
    await expect(bar).toContainText('-- NORMAL --');
  });

  test('editor displays content on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
    const lines = page.locator('#editor-display .line');
    const count = await lines.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('General interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor-display .line');
  });

  test('reset button reloads current level', async ({ page }) => {
    await goToLevel(page, 4); // Rush Hour
    await pressKeys(page, ['j', 'j']);
    const pos = await getCursorPos(page);
    expect(pos.row).toBeGreaterThan(0);
    // Reset should bring cursor back to start
    await page.locator('#reset-btn').click();
    await page.waitForTimeout(200);
    const resetPos = await getCursorPos(page);
    expect(resetPos.row).toBe(0);
  });

  test('level buttons navigate to correct level', async ({ page }) => {
    await goToWorld(page, 3);
    await goToLevel(page, 17); // world 3, level 3 (global index 17)
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('World 3: The Flavour Shelf');
    expect(indicator).toContain('Level 3 / 5');
  });

  test('instructions update when switching levels', async ({ page }) => {
    await goToLevel(page, 0);
    const instr1 = await getInstructions(page);
    expect(instr1).toContain('h');
    await goToLevel(page, 1);
    const instr2 = await getInstructions(page);
    expect(instr2).toContain('g');
    expect(instr2).not.toBe(instr1);
  });

  test('editor displays line numbers', async ({ page }) => {
    await goToLevel(page, 0);
    const lineNumbers = page.locator('#editor-display .line-number');
    const count = await lineNumbers.count();
    expect(count).toBeGreaterThan(0);
    // First line number should be 1
    await expect(lineNumbers.first()).toHaveText('1');
  });

  test('cursor is visible in editor display', async ({ page }) => {
    await goToLevel(page, 0);
    const cursor = page.locator('#editor-display .cursor');
    await expect(cursor).toHaveCount(1);
  });

  test('status bar updates when switching worlds', async ({ page }) => {
    await goToWorld(page, 0);
    const status1 = await page.locator('#status-bar').textContent();
    expect(status1).toContain('NORMAL');
    await goToWorld(page, 1);
    const status2 = await page.locator('#status-bar').textContent();
    expect(status2).toContain('NORMAL');
  });

  test('all 45 levels have content', async ({ page }) => {
    const levelsPerWorld = [0, 5, 10, 15, 20, 25, 30, 35, 40];
    for (let w = 0; w < 9; w++) {
      await goToWorld(page, w);
      for (let l = 0; l < 5; l++) {
        const globalIdx = levelsPerWorld[w] + l;
        await goToLevel(page, globalIdx);
        const content = await getEditorContent(page);
        expect(content.length).toBeGreaterThan(0);
        expect(content.some(line => line.length > 0)).toBe(true);
      }
    }
  });

  test('each level has unique instructions', async ({ page }) => {
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
    // All 45 levels should have unique instructions
    expect(instructions.size).toBe(45);
  });

  test('command log is empty after loading a level', async ({ page }) => {
    await goToLevel(page, 0);
    const log = await page.locator('#command-log').textContent();
    expect(log).toBe('');
  });

  test('target column is hidden when no target content', async ({ page }) => {
    await goToLevel(page, 0); // Level 0 has no targetContent
    const visible = await isTargetVisible(page);
    expect(visible).toBe(false);
  });
});
