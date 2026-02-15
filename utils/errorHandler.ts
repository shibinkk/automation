import { Page } from '@playwright/test';
import fs from 'fs';

export async function checkForAppError(
    page: Page,
    testName: string

) {

    const dir = 'reports/screenshots';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const errorLocator = page.locator('text=Something went wrong');

    if (await errorLocator.isVisible().catch(() => false)) {

        await page.screenshot({
            path: `${dir}/${testName}-app-error.png`,
            fullPage: true
        });

        throw new Error('Application error detected');

    }
}