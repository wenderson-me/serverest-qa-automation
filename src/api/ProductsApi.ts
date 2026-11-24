import { APIRequestContext, expect } from '@playwright/test';
import { Produto } from '../utils/dados';

const API_URL = process.env.API_URL ?? 'https://serverest.dev';

export interface ProdutoCriado extends Produto {
    _id: string;
}

export async function listarProdutos(request: APIRequestContext, token: string): Promise<ProdutoCriado[]> {
    const produto = await request.get(`${API_URL}/produtos`,
        { headers: { Authorization: token } }
    );
    expect(produto.status()).toBe(200);

    const body = await produto.json();
    expect(body).toHaveProperty('produtos');
    expect(Array.isArray(body.produtos)).toBe(true);

    return body.produtos;
}

export async function criarProduto(request: APIRequestContext, produto: Produto, token: string) {
    const response = await request.post(`${API_URL}/produtos`, {
        data: produto,
        headers: { Authorization: token },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toBe('Cadastro realizado com sucesso');
    return response;
}

export async function buscarProdutoPorId(request: APIRequestContext, id: string, token: string) {
    const response = await request.get(`${API_URL}/produtos/${id}`,
        { headers: { Authorization: token } }
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('descricao');
    expect(body).toHaveProperty('preco');
    expect(body).toHaveProperty('quantidade');
    expect(body).toHaveProperty('_id');
    return body;
}
