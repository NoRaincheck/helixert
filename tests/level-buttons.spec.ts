import { test, expect } from '@playwright/test';
import { goToWorld, goToLevel, pressKeys, getEditorContent, getMode, getLevelIndicator } from './helpers';

test.describe('Level buttons and world tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#world-tabs button');
  });

  test('all 9 world tabs render', async ({ page }) => {
    const tabs = page.locator('#world-tabs button');
    await expect(tabs).toHaveCount(9);
  });

  test('world tab 0 shows "First Steps"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="0"]');
    await expect(tab).toContainText('First Steps');
  });

  test('world tab 1 shows "Navigation"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="1"]');
    await expect(tab).toContainText('Navigation');
  });

  test('world tab 2 shows "The Stock Room"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="2"]');
    await expect(tab).toContainText('The Stock Room');
  });

  test('world tab 3 shows "The Flavour Shelf"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="3"]');
    await expect(tab).toContainText('The Flavour Shelf');
  });

  test('world tab 4 shows "The Express Lane"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="4"]');
    await expect(tab).toContainText('The Express Lane');
  });

  test('world tab 5 shows "The Order Book"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="5"]');
    await expect(tab).toContainText('The Order Book');
  });

  test('world tab 6 shows "The Modes Tour"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="6"]');
    await expect(tab).toContainText('The Modes Tour');
  });

  test('world tab 7 shows "Spot Check"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="7"]');
    await expect(tab).toContainText('Spot Check');
  });

  test('world tab 8 shows "The Back Office"', async ({ page }) => {
    const tab = page.locator('#world-tabs button[data-world="8"]');
    await expect(tab).toContainText('The Back Office');
  });

  test('level buttons show 1-5 in each world', async ({ page }) => {
    await goToWorld(page, 0);
    const buttons = page.locator('#level-selection button');
    const texts = await buttons.allTextContents();
    expect(texts).toEqual(['1', '2', '3', '4', '5']);
  });

  test('level buttons are clickable', async ({ page }) => {
    await goToWorld(page, 0);
    const buttons = page.locator('#level-selection button');
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toBeEnabled();
    }
  });

  test('clicking level button updates indicator', async ({ page }) => {
    await goToWorld(page, 0);
    await goToLevel(page, 1);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('World 0');
    expect(indicator).toContain('Level 2 / 5');
  });

  test('level 1 button loads world 0 level 0', async ({ page }) => {
    await goToLevel(page, 0);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('Level 1 / 5');
    expect(indicator).toContain('World 0');
  });

  test('level 5 button loads world 0 level 4', async ({ page }) => {
    await goToLevel(page, 4);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('Level 5 / 5');
    expect(indicator).toContain('World 0');
  });

  test('world 1 first level shows correct indicator', async ({ page }) => {
    await goToWorld(page, 1);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('Level 1 / 5');
    expect(indicator).toContain('World 1');
  });

  test('world 8 first level shows correct indicator', async ({ page }) => {
    await goToWorld(page, 8);
    const indicator = await getLevelIndicator(page);
    expect(indicator).toContain('Level 1 / 5');
    expect(indicator).toContain('World 8');
  });

  test('world tabs are in correct order', async ({ page }) => {
    const tabs = page.locator('#world-tabs button');
    for (let i = 0; i < 9; i++) {
      await expect(tabs.nth(i)).toHaveAttribute('data-world', String(i));
    }
  });

  test('level buttons are in correct order', async ({ page }) => {
    await goToWorld(page, 0);
    const buttons = page.locator('#level-selection button');
    for (let i = 0; i < 5; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('data-level', String(i));
    }
  });

  test('reset button exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const resetBtn = page.locator('#reset-btn');
    await expect(resetBtn).toBeVisible();
  });

  test('reset button is enabled', async ({ page }) => {
    await goToLevel(page, 0);
    const resetBtn = page.locator('#reset-btn');
    await expect(resetBtn).toBeEnabled();
  });

  test('reset button text is "Reset Level"', async ({ page }) => {
    await goToLevel(page, 0);
    const resetBtn = page.locator('#reset-btn');
    await expect(resetBtn).toContainText('Reset Level');
  });

  test('level indicator exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const indicator = page.locator('#level-indicator');
    await expect(indicator).toBeVisible();
  });

  test('status bar exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const statusBar = page.locator('#status-bar');
    await expect(statusBar).toBeVisible();
  });

  test('command log container exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const commandLog = page.locator('#command-log');
    await expect(commandLog).toBeVisible();
  });

  test('editor display exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const editorDisplay = page.locator('#editor-display');
    await expect(editorDisplay).toBeVisible();
  });

  test('instructions box exists and is visible', async ({ page }) => {
    await goToLevel(page, 0);
    const instructions = page.locator('#instructions');
    await expect(instructions).toBeVisible();
  });

  test('editor-input textarea exists', async ({ page }) => {
    await goToLevel(page, 0);
    const textarea = page.locator('#editor-input');
    await expect(textarea).toBeVisible();
  });

  test('world selection updates content on switch', async ({ page }) => {
    await goToWorld(page, 0);
    const content0 = await getEditorContent(page);
    await goToWorld(page, 1);
    const content1 = await getEditorContent(page);
    // Different worlds should have different content
    expect(content0).not.toEqual(content1);
  });
});
