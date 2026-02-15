import { test as setup, expect } from '@playwright/test';
import path from 'path';

setup('login setup', async ({ page }) => {
    setup.setTimeout(180000);

    await page.goto('/', { waitUntil: 'load' });
    await page.fill('#user-name', process.env.USER_EMAIL!);
    await page.fill('#password-input', process.env.USER_PASSWORD!);

    await page.getByRole('button', { name: 'SIGN IN' }).click();

    // Wait for dashboard safely
    await page.waitForURL(/dashboard/, { timeout: 120000 });
    await page.getByText('Total Employees').waitFor({ timeout: 60000 });

    // Save session
    await page.context().storageState({ path: 'storagestate.json' });
});