import { generateId } from 'ai';
import { getUnixTime } from 'date-fns';
import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

const testEmployeeId = `test-${getUnixTime(new Date())}`;
const testPassword = generateId(16);

class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login');
    await expect(this.page.getByRole('heading')).toContainText('Sign In');
  }

  async login(employeeId: string, password: string) {
    await this.gotoLogin();
    await this.page.getByPlaceholder('johndoe').click();
    await this.page.getByPlaceholder('johndoe').fill(employeeId);
    await this.page.getByLabel('Password').click();
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async expectToastToContain(text: string) {
    await expect(this.page.getByTestId('toast')).toContainText(text);
  }
}

test.describe
  .serial('authentication', () => {
    let authPage: AuthPage;

    test.beforeEach(async ({ page }) => {
      authPage = new AuthPage(page);
    });

    test('redirect to login page when unauthenticated', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading')).toContainText('Sign In');
    });

    test('log into account', async ({ page }) => {
      await authPage.login(testEmployeeId, testPassword);

      await page.waitForURL('/');
      await expect(page).toHaveURL('/');
      await expect(page.getByPlaceholder('Send a message...')).toBeVisible();
    });
  });
