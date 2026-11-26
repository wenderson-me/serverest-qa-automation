import { APIRequestContext, expect } from '@playwright/test';
import { API_URL } from '../config/env';
import { Produto } from '../utils/dados';

export interface ProdutoCriado extends Produto {
    _id: string;
}

export async function listarProdutos(request: APIRequestContext, token: string): Promise<ProdutoCriado[]> {
    const response = await request.get(`${API_URL}/produtos`,
        { headers: { Authorization: token } }
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('quantidade');
    expect(body).toHaveProperty('produtos');
    expect(Array.isArray(body.produtos)).toBe(true);
    expect(body.produtos).toHaveLength(body.quantidade);

    for (const item of body.produtos) {
        expect(item).toHaveProperty('_id');
        expect(item).toHaveProperty('nome');
        expect(item).toHaveProperty('preco');
        expect(item).toHaveProperty('descricao');
        expect(item).toHaveProperty('quantidade');
    }

    return body.produtos;
}

export async function criarProduto(
    request: APIRequestContext,
    produto: Produto,
    token: string,
): Promise<{ message: string; _id: string }> {
    const response = await request.post(`${API_URL}/produtos`, {
        data: produto,
        headers: { Authorization: token },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toEqual('Cadastro realizado com sucesso');
    expect(body._id).toBeTruthy();
    return body;
}

export async function buscarProdutoPorId(request: APIRequestContext, id: string, token: string): Promise<ProdutoCriado> {
    const response = await request.get(`${API_URL}/produtos/${id}`,
        { headers: { Authorization: token } }
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body._id).toEqual(id);
    expect(body).toHaveProperty('nome');
    expect(body).toHaveProperty('descricao');
    expect(body).toHaveProperty('preco');
    expect(body).toHaveProperty('quantidade');
    return body;
}

export async function deletarProduto(request: APIRequestContext, id: string, token: string) {
    const response = await request.delete(`${API_URL}/produtos/${id}`,
        { headers: { Authorization: token } }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toEqual('Registro excluído com sucesso');
}

export async function deletarProdutoPorNome(request: APIRequestContext, nome: string, token: string) {
    const response = await request.get(`${API_URL}/produtos`, { params: { nome } });
    if (response.status() !== 200) return;

    const { produtos } = await response.json();
    for (const produto of produtos) {
        if (produto.nome === nome) {
            await deletarProduto(request, produto._id, token);
        }
    }
}

export async function editarProduto(request: APIRequestContext, id: string, produto: Partial<Produto>, token: string) {
    const response = await request.put(`${API_URL}/produtos/${id}`, {
        data: produto,
        headers: { Authorization: token },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toEqual('Registro alterado com sucesso');
    return body;
}
