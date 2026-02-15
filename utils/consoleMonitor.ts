import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export function monitorConsoleErrors(
    page: Page,
    testName: string

) {

    const dir = 'reports/console-errors';

    if (!fs.existsSync(dir)) {

        fs.mkdirSync(dir, { recursive: true });
    }

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            const log = `Console Error: ${msg.text()}       
----------------------------------
`;

            fs.appendFileSync(
                path.join(dir, `${testName}.log`),
                log
            );
        }
    });
}