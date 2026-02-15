import { test, expect } from '../baseTest';

test.describe('Dashboard - Employee Section Validation', () => {
    test('Verify Employee Sub-modules and Counts', async ({ page }) => {
        test.setTimeout(240000); // 4 minutes timeout

        // 1. Navigate to Dashboard
        await page.goto('/dashboard');

        // Wait for URL to be exactly dashboard (handles redirects)
        await page.waitForURL(/.*\/dashboard/, { timeout: 120000 });

        // Use provided XPaths for maximum specificity as requested
        // Use CSS selectors instead of XPaths for the Status module
        const statusChartSelector = '#mat-tab-content-1-0 > div > app-employee-status > section > div.chart-wrapper > highcharts-chart';
        const countValueSelector = 'highcharts-chart .highcharts-subtitle div:nth-child(1)';

        const statusChart = page.locator(statusChartSelector);
        const countValue = page.locator(countValueSelector);

        // --- STATUS MODULE (First Tab) ---
        // Verify graph is visible
        await statusChart.waitFor({ state: 'visible', timeout: 90000 });
        await expect(statusChart).toBeVisible();

        // Extract the main employee count
        await countValue.waitFor({ state: 'visible', timeout: 60000 });
        const statusCountText = await countValue.textContent();
        const dashboardEmployeeCount = parseInt(statusCountText?.trim() || '0');

        console.log(`Main Dashboard Employee Count: ${dashboardEmployeeCount} `);
        expect(dashboardEmployeeCount).toBeGreaterThan(0);

        // Scope further interactions to the employee tab section
        const employeeSection = page.locator('app-employees-tab-new');

        // --- DEPARTMENTS MODULE ---
        await employeeSection.getByRole('tab', { name: 'Departments' }).click();

        // Wait for the specific tab panel to be selected and visible
        const deptPanel = employeeSection.getByRole('tabpanel', { name: 'Departments' });
        await deptPanel.waitFor({ state: 'visible' });

        const deptChart = deptPanel.locator('highcharts-chart').first();
        await expect(deptChart).toBeVisible();

        // Extract "Total Departments" (e.g., 4)
        const deptCountLocator = deptChart.locator('.highcharts-subtitle div').first();
        const totalDeptText = await deptCountLocator.textContent();
        const totalDepartments = parseInt(totalDeptText?.trim() || '0');
        console.log(`Total Departments: ${totalDeptText} `);

        // Get count from the side list
        const deptListItems = deptPanel.locator('ul li').filter({ hasText: ':' });
        const count = await deptListItems.count();
        expect(count).toBeGreaterThanOrEqual(1);

        for (let i = 0; i < count; i++) {
            const text = await deptListItems.nth(i).textContent();
            console.log(`Department Info: ${text} `);
        }

        // --- BACKGROUND VERIFICATION MODULE ---
        await employeeSection.getByRole('tab', { name: 'Background Verification' }).click();

        const bgvPanel = employeeSection.getByRole('tabpanel', { name: 'Background Verification' });
        await bgvPanel.waitFor({ state: 'visible' });

        const bgvChart = bgvPanel.locator('highcharts-chart').first();
        await expect(bgvChart).toBeVisible();

        const bgvCenter = await bgvChart.locator('.highcharts-subtitle div').first().textContent();
        // This should be 72 (Total Employees)
        expect(parseInt(bgvCenter?.trim() || '0')).toBe(dashboardEmployeeCount);

        // --- NATIONALITY MODULE ---
        await employeeSection.getByRole('tab', { name: 'Nationality' }).click();

        const natPanel = employeeSection.getByRole('tabpanel', { name: 'Nationality' });
        await natPanel.waitFor({ state: 'visible' });

        const natChart = natPanel.locator('highcharts-chart').first();
        await expect(natChart).toBeVisible();

        const nationsCount = await natChart.locator('.highcharts-subtitle div').first().textContent();
        console.log(`Total Countries: ${nationsCount?.trim()}`);

        const natListItems = natPanel.locator('ul li').filter({ hasText: ':' });
        for (let i = 0; i < await natListItems.count(); i++) {
            const text = await natListItems.nth(i).textContent();
            console.log(`Nationality Info: ${text?.trim()}`);
        }

        // --- GENDER MODULE ---
        await employeeSection.getByRole('tab', { name: 'Gender' }).click();

        const genderPanel = employeeSection.getByRole('tabpanel', { name: 'Gender' });
        await genderPanel.waitFor({ state: 'visible' });

        await expect(genderPanel.locator('highcharts-chart').first()).toBeVisible();

        const genderListItems = genderPanel.locator('ul li').filter({ hasText: /Male|Female/ });
        let genderSum = 0;
        for (let i = 0; i < await genderListItems.count(); i++) {
            const text = await genderListItems.nth(i).textContent();
            if (text && text.includes(':')) {
                console.log(`Gender Info: ${text.trim()}`);
                genderSum += parseInt(text.split(':')[1].trim());
            }
        }
        expect(genderSum).toBe(dashboardEmployeeCount);
    });
});
