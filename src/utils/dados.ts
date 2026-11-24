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
