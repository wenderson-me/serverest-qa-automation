# ServeRest QA Automation — Playwright + TypeScript

Automação de testes **E2E** e de **API** para a funcionalidade de **gestão de produtos por um administrador** na aplicação [ServeRest](https://front.serverest.dev) (`https://serverest.dev`), desenvolvida com **Playwright** e **TypeScript**.

- **Relatório de execução (GitHub Pages):** https://wenderson-me.github.io/serverest-qa-automation/
- **Reporte de bugs e melhorias:** [docs/bug-report.md](docs/bug-report.md)

---

## Como executar

### Pré-requisitos
- Node.js 20.12+ (recomendado Node 22 LTS)
- Google Chrome instalado (ou instalar via `npx playwright install chrome`)

### Instalação e comandos

```bash
# Instalar dependências
npm ci

# Executar toda a suíte (API + E2E)
npm test

# Executar apenas testes de API ou apenas E2E
npm run test:api
npm run test:e2e

# Abrir o modo interativo do Playwright
npm run test:ui

# Abrir o relatório HTML da última execução
npm run report

# Validar tipagem TypeScript
npm run typecheck
```

Opcionalmente, é possível sobrescrever as URLs padrão criando um arquivo `.env` na raiz a partir de [.env.example](.env.example).

---

## Organização do projeto e escolhas técnicas

```text
├── .github/workflows/ci.yml        # Pipeline CI no GitHub Actions + publicação do relatório no Pages
├── docs/
│   ├── bug-report.md               # Relatório de bugs e melhorias encontrados
│   └── evidencias/                 # Prints utilizados como evidência no bug report
├── src/
│   ├── api/
│   │   ├── AuthApi.ts              # Cadastro, login e limpeza de usuários via API
│   │   └── ProductsApi.ts          # Helpers tipados para listar, criar, buscar, editar e excluir produtos
│   ├── pages/
│   │   ├── LoginPage.ts            # Page Object da tela de login
│   │   └── ProdutosPage.ts         # Page Object de cadastro e listagem de produtos
│   └── utils/
│       └── dados.ts                # Gerador de massa dinâmica (usuários e produtos únicos)
├── tests/
│   ├── api/produtos.api.spec.ts    # Testes de API (/produtos)
│   └── e2e/produtos.e2e.spec.ts    # Testes E2E (frontend de gestão de produtos)
└── playwright.config.ts            # Projetos separados (api / e2e) com baseURL próprio
```

### Principais decisões
- **Isolamento de massa em ambiente compartilhado:** cada execução cria seus próprios usuários e produtos com sufixo único (`dados.ts`) e remove os registros ao final (`afterEach` / `afterAll`), permitindo execução em paralelo sem conflitos.
- **Preparação via API:** cadastro de usuário, login e pré-condições de produto são feitos via API para deixar os testes mais rápidos e independentes de outras telas.
- **Separação em projetos no Playwright:** `playwright.config.ts` separa `api` e `e2e` com `baseURL` independente, além de `screenshot` e `trace` retidos automaticamente em caso de falha.
- **Page Object Model (POM) enxuto:** `LoginPage` e `ProdutosPage` centralizam seletores (`getByTestId` / `getByRole`) e ações da UI sem abstrações desnecessárias.
- **CI/CD no GitHub Actions:** executa `typecheck` e toda a suíte em cada `push`/`pull_request` na `main`, salvando evidências e publicando o relatório HTML no GitHub Pages.

---

## Técnicas de testes de caixa preta utilizadas

- **Particionamento de Equivalência:** divisão entre entradas válidas (produto completo) e inválidas (nome, preço, descrição e quantidade vazios, produto duplicado, ID em formato inválido).
- **Análise de Valor Limite:** validação dos limites numéricos na API (`preco = 0`, `preco = -1`, `quantidade = -1`).
- **Tabela de Decisão:** regras de permissão em `POST /produtos` conforme autenticação e perfil:
  - Sem token → `401`
  - Usuário comum (cliente) → `403`
  - Administrador → `201`
- **Transição de Estado / Fluxo completo:** criação → busca/listagem → edição (`PUT`) → exclusão → validação de que o produto não é mais encontrado.

---

## Uso de IA

A IA foi utilizada como apoio durante o desenvolvimento para configuração inicial do repositório e do workflow de CI/CD no GitHub Actions, revisão de tipagem em TypeScript, simplificação de trechos de código e padronização da escrita do relatório de bugs. Todas as decisões de escopo, cenários de teste, validações exploratórias e evidências foram conduzidas, revisadas e executadas manualmente no ambiente do ServeRest.

---

## Bugs e comportamentos observados

O detalhamento completo, passos de reprodução e evidências estão em **[docs/bug-report.md](docs/bug-report.md)**:

1. **Campo `imagem` não documentado no Swagger da API:** `POST /produtos` aceita e persiste `imagem`, mas o campo não aparece na documentação oficial da API.
2. **Listagem de produtos sem paginação (melhoria):** a tela `/admin/listarprodutos` carrega todos os produtos do ambiente em uma única tabela longa.
3. **Mensagens de validação inconsistentes para campos vazios:** campos obrigatórios vazios mostram mensagens diferentes (`"é obrigatório"` vs. `"deve ser um número"` / `"não pode ficar em branco"`) dependendo de o usuário ter digitado e apagado antes.
4. **Botão "Editar" não funcional na listagem:** o botão aparece habilitado na coluna Ações, mas não executa nenhuma ação ao ser clicado, embora a API já possua `PUT /produtos/{id}`.
