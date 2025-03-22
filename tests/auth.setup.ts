import path from 'node:path';
import { generateId } from 'ai';
import { getUnixTime } from 'date-fns';
import { expect, test as setup } from '@playwright/test';

const authFile = path.join(__dirname, '../playwright/.auth/session.json');

setup('authenticate', async ({ page }) => {
  const testEmployeeId = `test-${getUnixTime(new Date())}`;
  const testPassword = generateId(16);

  // Instead of registration, directly log in with credentials
  // that you know exist in your test environment
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('johndoe').click();
  await page.getByPlaceholder('johndoe').fill(testEmployeeId);
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Instead of checking for registration success, check for login success
  // You may need to adjust this based on your login success indicator
  await expect(page).toHaveURL('/');

  await page.context().storageState({ path: authFile });
});
