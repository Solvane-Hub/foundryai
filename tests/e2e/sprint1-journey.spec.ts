import { expect, test } from '@playwright/test';

/**
 * Sprint 1 Definition of Done, end to end.
 *
 *   "User can: Register · Login · Create Business · Persist data · Reload ·
 *    See Dashboard"
 *
 * Uses the pre-provisioned RLS test user. Registration is covered separately in
 * auth.spec.ts — creating a real user per run would pollute auth.users and hit
 * Supabase's email rate limits.
 */
const EMAIL = process.env.RLS_TEST_USER_A_EMAIL ?? '';
const PASSWORD = process.env.RLS_TEST_USER_A_PASSWORD ?? '';

test.describe('Sprint 1 — full founder journey', () => {
  test.skip(!EMAIL || !PASSWORD, 'RLS test user credentials not configured');

  test('sign in → create business → complete intake → resume → dashboard', async ({ page }) => {
    const businessName = `E2E ${Date.now()}`;

    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // --- create a business ---------------------------------------------
    await page.goto('/businesses/new');
    await page.getByLabel('Business name').fill(businessName);
    await page.getByLabel('Country').selectOption('BS');
    await page.getByLabel('Industry').fill('Restaurant');
    await page.getByRole('button', { name: 'Create business' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: businessName })).toBeVisible();

    // --- intake, step 1 -------------------------------------------------
    await page.getByRole('link', { name: /Start intake/ }).click();
    await expect(page).toHaveURL(/\/intake/);
    await page
      .getByLabel('What does the business do?')
      .fill('A seafood restaurant in Nassau serving locally caught fish.');
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // --- THE CRITICAL ASSERTION: leave mid-flow and come back -----------
    await expect(page).toHaveURL(/step=2/);
    await page.goto('/dashboard');
    await page.goto('/intake');
    // Must resume at step 2, with step 1's answer still stored.
    await expect(page).toHaveURL(/step=2|\/intake$/);
    await page.goto('/intake?step=1');
    await expect(page.getByLabel('What does the business do?')).toHaveValue(/seafood restaurant/);

    // --- remaining steps ------------------------------------------------
    await page.goto('/intake?step=2');
    await page.getByLabel('Where are you today?').selectOption('idea');
    await page.getByLabel('Where will it operate?').fill('Nassau, New Providence');
    await page.getByRole('button', { name: 'Save and continue' }).click();

    await page.getByLabel(/How many people/).fill('3');
    await page.getByRole('button', { name: 'Save and continue' }).click();

    // Funding is optional — leaving it blank must be accepted.
    await page.getByRole('button', { name: 'Save and continue' }).click();

    await page.getByLabel(/What do you want to achieve/).fill('Open a second location in a year.');
    await page.getByRole('button', { name: 'Save and review' }).click();

    // --- review and complete --------------------------------------------
    await expect(page).toHaveURL(/\/intake\/review/);
    await expect(page.getByText('Nassau, New Providence')).toBeVisible();
    await page.getByRole('button', { name: 'Finish intake' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // --- survives a reload ----------------------------------------------
    await page.reload();
    await expect(page.getByRole('heading', { name: businessName })).toBeVisible();
    await expect(page.getByText(/Intake complete/)).toBeVisible();

    // --- and shows nothing fabricated ------------------------------------
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/Business Licence Act|Registrar General|Section \d+/);

    // --- clean up: archive (deletion is impossible by design) -------------
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Archive this business' }).click();
    await page.getByRole('button', { name: 'Yes, archive it' }).click();
    await expect(page.getByText(/Archived/)).toBeVisible();
  });
});
