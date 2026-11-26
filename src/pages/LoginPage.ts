import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async entrar(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.getByTestId('email').fill(email);
    await this.page.getByTestId('senha').fill(password);
    await this.page.getByTestId('entrar').click();
    await expect(this.page).toHaveURL(/\/admin\/home/);
  }
}
