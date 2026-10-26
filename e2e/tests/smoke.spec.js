import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Mentora/i);
});

test('courses page loads', async ({ page }) => {
  await page.goto('/courses');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/\/courses/);
});