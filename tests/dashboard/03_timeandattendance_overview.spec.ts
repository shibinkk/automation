import { test, expect } from '../baseTest';

test.describe('Dashboard - Time and Attendance Overview Validation', () => {
    test('Verify Time and Attendance Tiles and Dialogs', async ({ page }) => {
        test.setTimeout(240000);

        // 1. Navigate to Dashboard
        await page.goto('/dashboard');
        await page.waitForURL(/.*\/dashboard/, { timeout: 120000 });

        // 2. Fetch Total Employee Count from Status (for cross-validation)
        // Using the same logic as 02_dasboard_employee.spec.ts to get the base count
        const statusCountSelector = 'highcharts-chart .highcharts-subtitle div:nth-child(1)';
        const statusCountText = await page.locator(statusCountSelector).first().textContent();
        const globalEmployeeCount = parseInt(statusCountText?.trim() || '0');
        console.log(`Reference Employee Count from Status: ${globalEmployeeCount}`);

        // 3. Focus on Time and Attendance Section
        // The codegen snippets suggest using getByLabel('Overview') or listitems
        const overviewSection = page.getByLabel('Overview');
        await expect(overviewSection).toBeVisible({ timeout: 60000 });

        // 4. Validate "Total Employees" Tile
        // Based on codegen: page.getByRole('listitem').filter({ hasText: 'Total Employees 72' })
        const totalEmployeesTile = page.getByRole('listitem').filter({ hasText: /Total Employees/i });
        await totalEmployeesTile.waitFor({ state: 'visible' });

        const tileText = await totalEmployeesTile.textContent();
        const tileCount = parseInt(tileText?.match(/\d+/)?.[0] || '0');

        console.log(`Time & Attendance - Total Employees Tile: ${tileCount}`);
        // Match with status employee count
        expect(tileCount).toBe(globalEmployeeCount);

        // --- INTERACT WITH TOTAL EMPLOYEES DIALOG ---
        await totalEmployeesTile.click();

        // Wait for dialog to appear
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 60000 });
        await expect(dialog).toContainText(tileCount.toString());

        // Dynamic Search Test: Pick an employee from the table and search for them
        const firstEmployeeName = page.locator('mat-dialog-content table tr td, mat-dialog-content .employee-name, mat-dialog-content .mat-column-employee').first();
        await firstEmployeeName.waitFor({ state: 'visible' });
        const nameToSearch = await firstEmployeeName.textContent() || 'Employee';
        const cleanName = nameToSearch.trim().split('\n')[0]; // Get only the first line/name

        const searchBox = dialog.getByRole('textbox', { name: 'Search' });
        await searchBox.waitFor({ state: 'visible' });
        await searchBox.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(cleanName, { delay: 150 });
        await page.keyboard.press('Enter');
        console.log(`Searched for visible employee: ${cleanName} with delay`);
        await page.waitForTimeout(2000); // Wait for API filter

        // Verify result exists
        await expect(dialog.locator('mat-dialog-content')).toContainText(cleanName);

        // Clear search
        await searchBox.clear();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);

        // Filter Check - targeting the specific icon button next to search
        const filterButton = dialog.locator('button').filter({ has: page.locator('mat-icon:text("filter_alt"), .fa-filter') }).first();
        if (await filterButton.isVisible()) {
            await filterButton.click({ force: true });
            console.log('Clicked filter button');
            await page.waitForTimeout(1000);

            const select = page.locator('mat-select, .mat-select-placeholder, .mat-select-value').first();
            if (await select.isVisible()) {
                await select.click();
                await page.waitForTimeout(500);
                await page.locator('mat-option').first().click();
                await page.getByRole('button', { name: 'Apply Filter' }).click();
                console.log('Filter applied');
                await page.waitForTimeout(1500);
                await page.getByRole('button', { name: 'Clear All', exact: false }).first().click();
                console.log('Filter cleared');
            }
            // Close filter menu/backdrop if open
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
        }

        // Pagination Check - Based on codegen button '2'
        const page2Button = dialog.getByRole('button', { name: '2' }).first();
        if (await page2Button.isVisible()) {
            await page2Button.click();
            console.log('Navigated to page 2');
            await page.waitForTimeout(500);
            await dialog.getByRole('button', { name: '1' }).first().click();
        }

        // Close Dialog - Using a more robust strategy and Escape as fallback
        const closeBtn = dialog.locator('button mat-icon:text("close"), button:has-text("close"), .close-icon').first();
        if (await closeBtn.isVisible()) {
            await closeBtn.click().catch(() => page.keyboard.press('Escape'));
        } else {
            await page.keyboard.press('Escape');
        }
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // 5. Check Other Tiles (Present, Absentees, Late, Yet to Login, On Leave)
        const tiles = [
            { name: 'Total Present', regex: /Total Present/i },
            { name: 'Total Absentees', regex: /Total Absentees/i },
            { name: 'Late Checkin', regex: /Late Checkin/i },
            { name: 'Yet to Login', regex: /Yet to Login/i },
            { name: 'On Leave', regex: /On Leave/i }
        ];

        for (const tileInfo of tiles) {
            const tile = page.getByRole('listitem').filter({ hasText: tileInfo.regex });
            if (await tile.isVisible()) {
                const countText = await tile.textContent();
                const countNumber = parseInt(countText?.match(/\d+/)?.[0] || '0');
                console.log(`${tileInfo.name} Count: ${countNumber}`);

                // Click to open dialog
                await tile.click();
                await expect(page.locator('mat-dialog-container')).toBeVisible();

                // For Total Present, perform the dynamic search verify
                if (tileInfo.name === 'Total Present' && countNumber > 0) {
                    const employeeInDialog = page.locator('mat-dialog-content table tr td').first();
                    if (await employeeInDialog.isVisible()) {
                        const name = (await employeeInDialog.textContent() || '').trim().split('\n')[0];
                        await page.getByRole('textbox', { name: 'Search' }).fill(name);
                        await page.keyboard.press('Enter');
                        await expect(page.locator('mat-dialog-container')).toContainText(name);
                        console.log(`Verified search functionality in ${tileInfo.name} for: ${name}`);
                    }
                }

                // Close dialog
                const dialogClose = page.locator('mat-dialog-container button mat-icon:text("close"), mat-dialog-container button:has-text("close"), .close-icon').first();
                if (await dialogClose.isVisible()) {
                    await dialogClose.click().catch(() => page.keyboard.press('Escape'));
                } else {
                    await page.keyboard.press('Escape');
                }
                await expect(page.locator('mat-dialog-container')).not.toBeVisible();
            }
        }
    });
});
