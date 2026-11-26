import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  apagarUtilizador,
  criarUtilizadorComLogin,
  UtilizadorDeTeste,
} from '../../src/api/AuthApi';
import { deletarProdutoPorNome, criarProduto } from '../../src/api/ProductsApi';
import { API_URL } from '../../src/config/env';
import { novoProduto } from '../../src/utils/dados';
import { LoginPage } from '../../src/pages/LoginPage';
import { ProdutosPage } from '../../src/pages/ProdutosPage';

test.describe('Frontend: gestão de produtos pelo administrador', () => {
  let admin: UtilizadorDeTeste;
  const produtosParaApagar: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
  });

  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).entrar(admin.email, admin.password);
  });

  test.afterEach(async ({ request }) => {
    for (const nome of produtosParaApagar.splice(0)) {
      await deletarProdutoPorNome(request, nome, admin.token);
    }
  });

  test.afterAll(async ({ request }) => {
    await apagarUtilizador(request, admin.id);
  });

  test('Deve registrar um produto pelo formulário e exibir na listagem', async ({ page }) => {
    const produto = novoProduto();
    produtosParaApagar.push(produto.nome);
    const produtosPage = new ProdutosPage(page);

    await produtosPage.abrirFormulario();
    await produtosPage.preencher(produto);
    await produtosPage.cadastrar();

    await expect(page).toHaveURL(/\/admin\/listarprodutos/);
    const linha = produtosPage.linhaDaTabela(produto.nome);
    await expect(linha).toBeVisible();
    await expect(linha).toContainText(String(produto.preco));
    await expect(linha).toContainText(produto.descricao);
    await expect(linha).toContainText(String(produto.quantidade));
  });

  test('Deve apresentar os erros de campo obrigatório ao enviar o formulário vazio', async ({ page }) => {
    const produtosPage = new ProdutosPage(page);

    await produtosPage.abrirFormulario();
    await produtosPage.cadastrar();

    await expect(produtosPage.alerta('Nome é obrigatório')).toBeVisible();
    await expect(produtosPage.alerta('Preco é obrigatório')).toBeVisible();
    await expect(produtosPage.alerta('Descricao é obrigatório')).toBeVisible();
    await expect(produtosPage.alerta('Quantidade é obrigatório')).toBeVisible();
  });

  test('Não deve cadastrar o produto quando preço e quantidade são preenchidos e apagados', async ({ page }) => {
    const produtosPage = new ProdutosPage(page);
    await produtosPage.abrirFormulario();

    for (const campo of ['preco', 'quantity']) {
      await page.getByTestId(campo).fill('5');
      await page.getByTestId(campo).fill('');
    }
    await produtosPage.cadastrar();

    await expect(produtosPage.alerta('Nome é obrigatório')).toBeVisible();
    await expect(produtosPage.alerta('Preco deve ser um número')).toBeVisible();
    await expect(produtosPage.alerta('Descricao é obrigatório')).toBeVisible();
    await expect(produtosPage.alerta('Quantidade deve ser um número')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/cadastrarprodutos/);
    await expect(page.getByRole('heading', { name: 'Cadastro de Produtos' })).toBeVisible();
  });

  test('Deve apresentar alerta quando já existe um produto com o mesmo nome', async ({ page, request }) => {
    const produto = novoProduto();
    produtosParaApagar.push(produto.nome);
    await criarProduto(request, produto, admin.token);

    const produtosPage = new ProdutosPage(page);
    await produtosPage.abrirFormulario();
    await produtosPage.preencher(produto);
    await produtosPage.cadastrar();

    await expect(produtosPage.alerta('Já existe produto com esse nome')).toBeVisible();
  });

  test('Deve listar um produto e permitir excluí-lo pela listagem', async ({ page, request }) => {
    const produto = novoProduto();
    produtosParaApagar.push(produto.nome);
    await criarProduto(request, produto, admin.token);

    const produtosPage = new ProdutosPage(page);
    await produtosPage.abrirListagem();

    const linha = produtosPage.linhaDaTabela(produto.nome);
    await expect(linha).toBeVisible();

    await produtosPage.excluirProduto(produto.nome);
    await expect(linha).not.toBeVisible();
  });

  test('Deve registrar um produto com imagem e retornar a imagem na API', async ({ page, request }) => {
    const produto = novoProduto();
    produtosParaApagar.push(produto.nome);
    const produtosPage = new ProdutosPage(page);

    await produtosPage.abrirFormulario();
    await produtosPage.preencher(produto);
    await page.getByTestId('imagem').setInputFiles(join(__dirname, 'arquivo', 'imagem-produto.png'));
    await produtosPage.cadastrar();
    await expect(page).toHaveURL(/\/admin\/listarprodutos/);

    const resposta = await request.get(`${API_URL}/produtos`, { params: { nome: produto.nome } });
    expect(resposta.status()).toBe(200);
    const [produtoGuardado] = (await resposta.json()).produtos;

    expect(produtoGuardado.imagem).toContain('imagem-produto.png');
  });
});
