import { test as base } from '@playwright/test';
import { monitorFailedAPIs } from '../utils/apiMonitor';
import { monitorConsoleErrors } from '../utils/consoleMonitor';

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        monitorFailedAPIs(page, testInfo.title);
        monitorConsoleErrors(page, testInfo.title);
        await use(page);
    },
});

export { expect } from '@playwright/test';