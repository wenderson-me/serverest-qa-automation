import { expect, Page } from '@playwright/test';
import { Produto } from '../utils/dados';

export class ProdutosPage {
  constructor(private readonly page: Page) { }

  async abrirFormulario() {
    await this.page.goto('/admin/cadastrarprodutos');
    await expect(this.page.getByTestId('nome')).toBeVisible();
  }

  async abrirListagem() {
    await this.page.goto('/admin/listarprodutos');
    await expect(this.page.getByRole('heading', { name: 'Lista dos Produtos' })).toBeVisible();
  }

  async preencher(produto: Produto) {
    await this.page.getByTestId('nome').fill(produto.nome);
    await this.page.getByTestId('preco').fill(String(produto.preco));
    await this.page.getByTestId('descricao').fill(produto.descricao);
    await this.page.getByTestId('quantity').fill(String(produto.quantidade));
  }

  async cadastrar() {
    await this.page.getByTestId('cadastarProdutos').click();
  }

  linhaDaTabela(nomeDoProduto: string) {
    return this.page.getByRole('table').getByRole('row', { name: nomeDoProduto });
  }

  async excluirProduto(nomeDoProduto: string) {
    await this.linhaDaTabela(nomeDoProduto).getByRole('button', { name: 'Excluir' }).click();
  }

  alerta(texto: string) {
    return this.page.getByRole('alert').filter({ hasText: texto });
  }
}
