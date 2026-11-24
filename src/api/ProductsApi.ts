import { APIRequestContext, expect } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'https://serverest.dev';

export interface Produto {
  _id: string;
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

export async function listarProdutos(request: APIRequestContext): Promise<Produto[]> {
  const resposta = await request.get(`${API_URL}/produtos`);
  expect(resposta.status(), 'listagem de produtos').toBe(200);

  const body = await resposta.json();
  expect(body).toHaveProperty('produtos');
  expect(Array.isArray(body.produtos)).toBe(true);

  for (const produto of body.produtos) {
    expect(produto).toHaveProperty('nome');
    expect(produto).toHaveProperty('preco');
    expect(produto).toHaveProperty('descricao');
    expect(produto).toHaveProperty('quantidade');
    expect(produto).toHaveProperty('_id');
  }

  return body.produtos;
}
