import { expect, type Page } from '@playwright/test';

/** Use the real skip control when a test concerns the game after startup. */
export async function passStudio(page: Page) {
  const skip = page.getByTestId('studio-skip');
  const shell = page.getByTestId('game-shell');
  await expect(skip.or(shell).filter({ visible: true })).toBeVisible({ timeout: 20000 });
  // Observe the game's first frame instead of waiting for the newly mounted router to settle.
  if (await skip.isVisible()) await skip.evaluate((node) => (node as HTMLElement).click());
  await expect(shell).toBeVisible({ timeout: 20000 });
}
