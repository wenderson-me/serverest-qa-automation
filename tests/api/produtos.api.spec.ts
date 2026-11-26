import { test, expect } from '@playwright/test';
import { UtilizadorDeTeste, apagarUtilizador, criarUtilizadorComLogin } from '../../src/api/AuthApi';
import { buscarProdutoPorId, criarProduto, deletarProduto, editarProduto, listarProdutos } from '../../src/api/ProductsApi';
import { novoProduto } from '../../src/utils/dados';


test.describe('API Produtos - Gestão de Produtos por Administrador', () => {
  let admin: UtilizadorDeTeste;
  let cliente: UtilizadorDeTeste;

  test.beforeAll(async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
    cliente = await criarUtilizadorComLogin(request, false);
  });

  test.afterAll(async ({ request }) => {
    await apagarUtilizador(request, admin.id);
    await apagarUtilizador(request, cliente.id);
  });

  test('Validar listagem de produtos', async ({ request }) => {
    await listarProdutos(request, admin.token);
  });

  test('Validar criar produto e buscar na listagem', async ({ request }) => {
    const produtoCriado = await criarProduto(request, novoProduto(), admin.token);
    await buscarProdutoPorId(request, produtoCriado._id, admin.token);
    await deletarProduto(request, produtoCriado._id, admin.token);
  });

  test('Validar erro 400 ao criar dois produtos com o mesmo nome', async ({ request }) => {
    const produto = novoProduto();
    const produtoCriado = await criarProduto(request, produto, admin.token);

    const response = await request.post('/produtos', {
      data: produto,
      headers: { Authorization: admin.token },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Já existe produto com esse nome');

    await deletarProduto(request, produtoCriado._id, admin.token);
  });

  test('Validar erro 400 ao buscar produto deletado', async ({ request }) => {
    const produto = novoProduto();
    const produtoCriado = await criarProduto(request, produto, admin.token);
    await deletarProduto(request, produtoCriado._id, admin.token);

    const response = await request.get(`/produtos/${produtoCriado._id}`, {
      headers: {
        Authorization: admin.token,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Produto não encontrado');
  });

  test.describe('Validação dos campos', () => {
    const casosInvalidos = [
      { titulo: 'preço igual a 0', campo: 'preco', valor: 0 },
      { titulo: 'preço negativo (-1)', campo: 'preco', valor: -1 },
      { titulo: 'quantidade negativa (-1)', campo: 'quantidade', valor: -1 },
      { titulo: 'nome em branco', campo: 'nome', valor: '' },
      { titulo: 'descrição em branco', campo: 'descricao', valor: '' },
    ];

    for (const caso of casosInvalidos) {
      test(`Rejeita ${caso.titulo}`, async ({ request }) => {
        const produto = { ...novoProduto(), [caso.campo]: caso.valor };

        const resposta = await request.post('/produtos', {
          data: produto,
          headers: { Authorization: admin.token },
        });
        const body = await resposta.json();

        expect(resposta.status()).toBe(400);
        expect(body).toHaveProperty(caso.campo);
      });
    }

    test('Rejeita produto com todos os campos em branco', async ({ request }) => {
      const resposta = await request.post('/produtos', {
        data: { nome: '', preco: '', descricao: '', quantidade: '' },
        headers: { Authorization: admin.token },
      });
      const body = await resposta.json();

      expect(resposta.status()).toBe(400);
      expect(body).toHaveProperty('nome');
      expect(body).toHaveProperty('preco');
      expect(body).toHaveProperty('descricao');
      expect(body).toHaveProperty('quantidade');
    });
  });

  test.describe('Validação das permissões', () => {
    test('Validar acesso à rota produtos sem token de autenticação devolve 401', async ({ request }) => {
      const resposta = await request.post('/produtos', { data: novoProduto() });

      expect(resposta.status()).toBe(401);
      expect((await resposta.json()).message).toContain('Token de acesso ausente');
    });

    test('Validar acesso à rota produtos com cliente recebe 403', async ({ request }) => {
      const resposta = await request.post('/produtos', {
        data: novoProduto(),
        headers: { Authorization: cliente.token },
      });

      expect(resposta.status()).toBe(403);
      expect((await resposta.json()).message).toBe('Rota exclusiva para administradores');
    });
  });

  test.describe('Edição de produtos', () => {
    test('Validar edição de um produto com dados válidos', async ({ request }) => {
      const produtoCriado = await criarProduto(request, novoProduto(), admin.token);
      const produtoAtualizado = novoProduto();

      await editarProduto(request, produtoCriado._id, produtoAtualizado, admin.token);

      const produtoBuscado = await buscarProdutoPorId(request, produtoCriado._id, admin.token);
      expect(produtoBuscado.nome).toBe(produtoAtualizado.nome);
      expect(produtoBuscado.preco).toBe(produtoAtualizado.preco);
      expect(produtoBuscado.descricao).toBe(produtoAtualizado.descricao);
      expect(produtoBuscado.quantidade).toBe(produtoAtualizado.quantidade);

      await deletarProduto(request, produtoCriado._id, admin.token);
    });

    test('Validar erro 400 ao tentar editar produto com ID inexistente/inválido', async ({ request }) => {
      const resposta = await request.put('/produtos/id-inexistente', {
        data: novoProduto(),
        headers: { Authorization: admin.token },
      });
      const body = await resposta.json();

      expect(resposta.status()).toBe(400);
      expect(body).toHaveProperty('id');
    });

    test('Bloquear edição de produto com campos obrigatórios vazios', async ({ request }) => {
      const produtoCriado = await criarProduto(request, novoProduto(), admin.token);

      const resposta = await request.put(`/produtos/${produtoCriado._id}`, {
        data: { nome: '', preco: '', descricao: '', quantidade: '' },
        headers: { Authorization: admin.token },
      });
      const body = await resposta.json();

      expect(resposta.status()).toBe(400);
      expect(body).toHaveProperty('nome');
      expect(body).toHaveProperty('preco');
      expect(body).toHaveProperty('descricao');
      expect(body).toHaveProperty('quantidade');

      await deletarProduto(request, produtoCriado._id, admin.token);
    });
  });
});
