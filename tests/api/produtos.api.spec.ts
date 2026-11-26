import { test, expect } from '@playwright/test';
import { UtilizadorDeTeste, apagarUtilizador, criarUtilizadorComLogin } from '../../src/api/AuthApi';
import { buscarProdutoPorId, criarProduto, deletarProduto, editarProduto, listarProdutos } from '../../src/api/ProductsApi';
import { novoProduto } from '../../src/utils/dados';


test.describe('API Produtos - Gestão de Produtos por Administrador', () => {
  let admin: UtilizadorDeTeste;
  let cliente: UtilizadorDeTeste;
  const produtosParaApagar: string[] = [];

  test.beforeAll(async ({ request }) => {
    admin = await criarUtilizadorComLogin(request, true);
    cliente = await criarUtilizadorComLogin(request, false);
  });

  test.afterEach(async ({ request }) => {
    for (const id of produtosParaApagar.splice(0)) {
      await deletarProduto(request, id, admin.token);
    }
  });

  test.afterAll(async ({ request }) => {
    await apagarUtilizador(request, admin.id);
    await apagarUtilizador(request, cliente.id);
  });

  test('Validar listagem de produtos', async ({ request }) => {
    await listarProdutos(request, admin.token);
  });

  test('Validar criar produto e buscar por ID e na listagem', async ({ request }) => {
    const produto = novoProduto();
    const produtoCriado = await criarProduto(request, produto, admin.token);
    produtosParaApagar.push(produtoCriado._id);
    expect(produtoCriado._id).toBeTruthy();

    const produtoBuscado = await buscarProdutoPorId(request, produtoCriado._id, admin.token);
    expect(produtoBuscado.nome).toBe(produto.nome);
    expect(produtoBuscado.preco).toBe(produto.preco);
    expect(produtoBuscado.descricao).toBe(produto.descricao);
    expect(produtoBuscado.quantidade).toBe(produto.quantidade);

    const listagem = await request.get('/produtos', { params: { nome: produto.nome } });
    expect(listagem.status()).toBe(200);
    const { produtos } = await listagem.json();
    expect(produtos).toContainEqual(expect.objectContaining({ _id: produtoCriado._id, ...produto }));
  });

  test('Validar erro 400 ao criar dois produtos com o mesmo nome', async ({ request }) => {
    const produto = novoProduto();
    const produtoCriado = await criarProduto(request, produto, admin.token);
    produtosParaApagar.push(produtoCriado._id);

    const response = await request.post('/produtos', {
      data: produto,
      headers: { Authorization: admin.token },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Já existe produto com esse nome');
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

  test.fail('Validar documentação do campo imagem no endpoint POST /produtos',
    { annotation: { type: 'bug', description: 'docs/bug-report.md, bug 1' } },
    async ({ request }) => {
      const produtoComImagem = { ...novoProduto(), imagem: 'imagem-produto.png' };

      const cadastro = await request.post('/produtos', {
        data: produtoComImagem,
        headers: { Authorization: admin.token },
      });
      expect(cadastro.status()).toBe(201);
      const { _id } = await cadastro.json();
      produtosParaApagar.push(_id);

      const busca = await request.get(`/produtos/${_id}`);
      expect(busca.status()).toBe(200);
      expect((await busca.json()).imagem).toBe('imagem-produto.png');

      const respostaSwagger = await request.get('/swagger.json');
      expect(respostaSwagger.status()).toBe(200);
      const swagger = await respostaSwagger.json();
      const camposDoProduto = swagger.components.schemas.requestBodyProduto.properties;

      expect(Object.keys(camposDoProduto)).toContain('imagem');
    },
  );

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
      produtosParaApagar.push(produtoCriado._id);
      const produtoAtualizado = novoProduto();

      await editarProduto(request, produtoCriado._id, produtoAtualizado, admin.token);

      const produtoBuscado = await buscarProdutoPorId(request, produtoCriado._id, admin.token);
      expect(produtoBuscado.nome).toBe(produtoAtualizado.nome);
      expect(produtoBuscado.preco).toBe(produtoAtualizado.preco);
      expect(produtoBuscado.descricao).toBe(produtoAtualizado.descricao);
      expect(produtoBuscado.quantidade).toBe(produtoAtualizado.quantidade);
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
      produtosParaApagar.push(produtoCriado._id);

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
    });
  });
});
