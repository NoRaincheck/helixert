import { test, expect } from '@playwright/test';
import { goToWorld } from './helpers';

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
