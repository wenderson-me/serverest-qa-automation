import { test } from '@playwright/test';
import { UtilizadorDeTeste, apagarUtilizador, criarUtilizadorComLogin } from '../../src/api/AuthApi';
import { listarProdutos } from '../../src/api/ProductsApi';

test.describe('API /produtos: gestão de produtos pelo administrador', () => {
  let admin: UtilizadorDeTeste;

  test.beforeAll(async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
  });

  test.afterAll(async ({ request }) => {
    await apagarUtilizador(request, admin.id);
  });

  test('Validar listagem de produtos pelo administrador autenticado', async ({ request }) => {
    await listarProdutos(request);
  });
});
