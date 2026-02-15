import { Page } from '@playwright/test';
import fs from 'fs';

export function monitorFailedAPIs(page: Page, testName: string) {
    const dir = 'reports/api-failures';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    page.on('response', async (response) => {
        if (response.status() >= 400) {
            const log = `
URL: ${response.url()}
Status: ${response.status()}
Method: ${response.request().method()} 
----------------------------------
`;
            fs.appendFileSync(`${dir}/${testName}.log`, log);
        }
    });
}
