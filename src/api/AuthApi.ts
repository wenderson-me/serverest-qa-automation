import { APIRequestContext, expect } from '@playwright/test';
import { novoUtilizador } from '../utils/dados';

const API_URL = process.env.API_URL ?? 'https://serverest.dev';

export interface UtilizadorDeTeste {
  id: string;
  email: string;
  password: string;
  token: string;
}

export async function criarUtilizadorComLogin(
  request: APIRequestContext,
  administrador: boolean,
): Promise<UtilizadorDeTeste> {
  const utilizador = novoUtilizador(administrador);

  const registo = await request.post(`${API_URL}/usuarios`, { data: utilizador });
  expect(registo.status(), 'registo do utilizador de teste').toBe(201);
  const { _id } = await registo.json();

  const login = await request.post(`${API_URL}/login`, {
    data: { email: utilizador.email, password: utilizador.password },
  });
  expect(login.status(), 'login do utilizador de teste').toBe(200);
  const { authorization } = await login.json();

  return { id: _id, email: utilizador.email, password: utilizador.password, token: authorization };
}

export async function apagarUtilizador(request: APIRequestContext, id: string) {
  await request.delete(`${API_URL}/usuarios/${id}`);
}