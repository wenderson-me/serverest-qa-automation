import { test } from '@playwright/test';
import { UtilizadorDeTeste, apagarUtilizador, criarUtilizadorComLogin } from '../../src/api/AuthApi';
import { buscarProdutoPorId, criarProduto, listarProdutos } from '../../src/api/ProductsApi';
import { novoProduto } from '../../src/utils/dados';


test.describe('API /produtos: gestão de produtos pelo administrador', () => {
  let admin: UtilizadorDeTeste;

  test.beforeAll(async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
  });

  test.afterAll(async ({ request }) => {
    await apagarUtilizador(request, admin.id);
  });

  test('Validar listagem de produtos', async ({ request }) => {
    await listarProdutos(request, admin.token);
  });

  test('Criar um novo produto e validar na listagem', async ({ request }) => {
    const registo = await criarProduto(request, novoProduto(), admin.token);
    await buscarProdutoPorId(request, registo._id, admin.token);
  });
});
