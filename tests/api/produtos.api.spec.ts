import { expect, test } from '@playwright/test';
import { UtilizadorDeTeste, criarUtilizadorComLogin } from '../../src/api/AuthApi';

test.describe('API Login', () => {
  let admin: UtilizadorDeTeste;

  test('Login com sucesso', async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
    expect(admin.token).toBeTruthy();
  });
});
