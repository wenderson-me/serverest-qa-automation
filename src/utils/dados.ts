export interface Produto {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

function sufixoUnico(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function novoUtilizador(administrador: boolean) {
  const sufixo = sufixoUnico();
  return {
    nome: `QA ${sufixo}`,
    email: `qa.${sufixo}@teste.pt`,
    password: `Senha@${sufixo}`,
    administrador: administrador ? 'true' : 'false',
  };
}

export function novoProduto(): Produto {
  const sufixo = sufixoUnico();
  return {
    nome: `Teclado Mecanico ${sufixo}`,
    preco: 120,
    descricao: `Produto de teste automatizado ${sufixo}`,
    quantidade: 15,
  };
}