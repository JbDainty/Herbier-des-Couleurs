import type { Page } from '@playwright/test';

/** Hints are free and do not open a purchase confirmation. */
export async function requestHint(page: Page) {
  await page.getByRole('button', { name: 'Indice', exact: true }).click();
}
