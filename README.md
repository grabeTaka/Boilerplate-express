# Boilerplate Express — Passo a passo

Guia de reprodução de um boilerplate de API **Express + TypeScript**.

> **Propósito:** este README **não** é sobre subir a aplicação, e sim um **passo a passo de como reproduzir o boilerplate do zero**.

---

## Passo 1 — Iniciar o repositório

```bash
npm init -y
```

**Ajustes no `package.json`:**

- **`"type": "module"`** — este boilerplate usa **ES Modules** (ESM), com `import`/`export` e imports relativos **explícitos com a extensão `.ts`** (ex.: `import app from './app.ts'`). O `"module"` é o que habilita essa sintaxe; combinado com o `tsx` (Passo 4), o `.ts` é resolvido em runtime sem precisar compilar.

  > Não use `"commonjs"` aqui: importar `./app.ts` com extensão só faz sentido no mundo ESM + `tsx`.
- Preencha também **`"main"`**, **`"name"`**, **`"license"`** e **`"engines"`** (fixe a versão do Node que você usa).

**Crie um `.gitignore`** cobrindo pelo menos:

```gitignore
node_modules/
dist/
.env
coverage/
*.log
```

---

## Passo 2 — Adicionar o TypeScript

```bash
npm i -D typescript @types/node
npx tsc --init
```

No `tsconfig.json`, habilite:

```jsonc
{
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

---

## Passo 3 — Adicionar o Express e a estrutura

```bash
npm i express
npm i -D @types/express
```

**Estrutura inicial:**

```
src/
├── server.ts    # sobe o HTTP server (app.listen)
└── app.ts       # cria e configura a aplicação
```

**`src/app.ts`**

```ts
import express, { type Express, type Request, type Response } from 'express';

const app: Express = express();

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Serve is running' });
});

export default app;
```

**`src/server.ts`**

```ts
import app from './app.ts';

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.info(`server running on port ${port}!`);
});
```

---

## Passo 4 — Ambiente de desenvolvimento (hot reload)

Configure o script `start:dev` no `package.json`:

```json
{
  "scripts": {
    "start:dev": "tsx watch ./src/server.ts"
  }
}
```

Rode com:

```bash
npm run start:dev
```

---

## Passo 5 — Adicionar variáveis de ambiente

```bash
npm i dotenv
```

---

## Passo 6 — Docker e Docker Compose

Empacote a API em um contêiner e suba junto com um Postgres usando Compose.

**`Dockerfile`**

```dockerfile
# Use uma imagem oficial do Node.js baseada no Alpine (versão leve)
FROM node:24-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie apenas os arquivos de dependência primeiro para aproveitar o cache
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install

# Copie todo o resto dos arquivos do projeto para o contêiner
COPY . .

# Exponha a porta que o seu Express está utilizando
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:dev"]
```

**`docker-compose.yml`**

```yaml
services:

  app:
    build: .
    container_name: express_app

    ports:
      - "${PORT}:${PORT}"

    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules

    environment:
      - NODE_ENV=${NODE_ENV}
      - PORT=${PORT}
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: express_db
    restart: unless-stopped

    ports:
      - "5432:5432"

    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}

    volumes:
      - pgdata:/var/lib/postgresql/data

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
```

> As variáveis (`PORT`, `NODE_ENV`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) vêm do `.env` do Passo 5.

Suba tudo com:

```bash
docker compose up --build
```

---

## Passo 7 — Knex (query builder + migrations)

Instale o Knex e o driver do Postgres:

```bash
npm i knex pg
npm i -D @types/pg
```

**`knexfile.ts`** (na raiz do projeto)

```ts
import 'dotenv/config';
import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
}

export default config;
```

**Pontos que costumam travar:**

- **ESM:** como o projeto usa `"type": "module"`, o export **precisa** ser `export default config;`. Usar `module.exports = config;` quebra com `ReferenceError: module is not defined in ES module scope`.
- **`import 'dotenv/config'`** no topo garante que o knexfile enxergue o `.env`.
- **Connection string única:** a conexão vem de `process.env.DATABASE_URL` (mesmo modelo do `src/config/database.ts`) — o knex faz o parse de usuário, senha, host, porta e banco a partir dela.
- **Host do banco:** dentro do Docker a `DATABASE_URL` aponta pro serviço `db` (`@db:5432`). Esse hostname **não** resolve no host — pra rodar migrations, use o container (`docker compose exec app npx knex migrate:latest`) ou aponte a `DATABASE_URL` pra `localhost`.

> As mensagens `Failed to load external module ts-node/register…` são inofensivas — o Node 24 carrega `.ts` nativamente, então o Knex ignora esses loaders antigos e segue.

**Criar e rodar migrations:**

```bash
npx knex migrate:make add_products_table -x ts   # cria a migration em .ts
npx knex migrate:latest                           # aplica as migrations pendentes
npx knex migrate:down                             # desfaz a última migration
```

> Precisa do Postgres no ar. Se aparecer `connect ECONNREFUSED 127.0.0.1:5432`, o banco não está de pé — suba com `docker compose up -d db` (Passo 6) antes.

---

## Passo 8 — Query builder do Knex (no repository)

O `knex` é injetado no repository pelo construtor (Injeção de Dependência), então todas as queries partem de `this.knex`. A instância é criada uma única vez em `src/config/database.ts` e conectada em `src/modules/product/routes/index.ts` (composition root). Todo acesso ao banco fica isolado no repository — os use cases e controllers nunca falam com o knex direto.

> Dica de tipagem: use `this.knex<ProductRow>('products')` para o knex tipar as linhas retornadas de acordo com as colunas da tabela.

### Os métodos que já existem no `ProductRepository`

**`insert` + `returning` (create)** — insere e devolve a linha criada. Em Postgres o `.returning('*')` traz todas as colunas de volta (inclusive `id`, `created_at`…). O resultado é sempre um array, por isso o destructuring `[row]`:

```ts
async create(data: ProductInput): Promise<Product> {
    const [row] = await this.knex<ProductRow>('products')
        .insert(ProductFactory.toDatabase(data))
        .returning('*');
    return ProductFactory.toDomain(row);
}
```

**`where` + `update` + `returning` (update)** — filtra pelo `id` e atualiza. `.where({ id })` gera `WHERE id = ?`:

```ts
async update(id: number, data: ProductInput): Promise<Product> {
    const [row] = await this.knex<ProductRow>('products')
        .where({ id })
        .update(ProductFactory.toDatabase(data))
        .returning('*');
    return ProductFactory.toDomain(row);
}
```

**`where` + `del` (delete)** — remove e devolve o que foi apagado:

```ts
async delete(id: number): Promise<Product> {
    const [row] = await this.knex<ProductRow>('products')
        .where({ id })
        .del()
        .returning('*');
    return ProductFactory.toDomain(row);
}
```

**`where` + `select` + `limit` (findOne)** — busca um registro. `.limit(1)` garante no máximo uma linha:

```ts
async findOne(id: number): Promise<Product> {
    const [row] = await this.knex<ProductRow>('products')
        .where({ id })
        .select('*')
        .limit(1);
    return ProductFactory.toDomain(row);
}
```

**`where(objeto)` dinâmico (findAll com filtros)** — passar um objeto pro `.where()` gera `col = val AND …` para cada chave. A factory monta esse objeto só com os filtros preenchidos, então um objeto vazio (`{}`) vira "sem filtro" e retorna tudo:

```ts
async findAll(filters: ProductFilters = {}): Promise<Product[]> {
    const rows = await this.knex<ProductRow>('products')
        .where(ProductFactory.toDatabaseFilters(filters))
        .select('*');
    return ProductFactory.toDomainList(rows);
}
```

### Extensões comuns (pra quando o repository crescer)

**Busca parcial (`ILIKE`, case-insensitive)** — quando igualdade exata não basta:

```ts
this.knex<ProductRow>('products').whereILike('name', `%${termo}%`);
```

**Ordenação e paginação:**

```ts
this.knex<ProductRow>('products')
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(20)
    .offset(40); // página 3 (20 por página)
```

**Vários `where` encadeados / operadores:**

```ts
this.knex<ProductRow>('products')
    .where('name', 'ilike', '%camisa%')
    .andWhere('id', '>', 100)
    .whereIn('id', [1, 2, 3])
    .whereNotNull('name');
```

**Contagem / agregação:**

```ts
const [{ count }] = await this.knex<ProductRow>('products').count('* as count');
```

**Transação** — todas as operações passam ou nenhuma persiste:

```ts
await this.knex.transaction(async (trx) => {
    const [product] = await trx<ProductRow>('products')
        .insert({ name: 'x' })
        .returning('*');
    await trx('audit_log').insert({ action: 'create', product_id: product.id });
});
```

**`first()`** — atalho pra pegar só a primeira linha (evita o `[row]` + `.limit(1)`):

```ts
const row = await this.knex<ProductRow>('products').where({ id }).first();
```

**SQL cru (`raw`)** — escape hatch pra quando o builder não cobre o caso. Use bindings (`?`) pra evitar SQL injection:

```ts
const { rows } = await this.knex.raw('SELECT * FROM products WHERE name = ?', [nome]);
```

> Para inspecionar o SQL gerado sem rodar, encadeie `.toSQL()` ou dê `console.log` na query — o knex tem um `toString()` legível.

---

## Passo 9 — Middlewares (tratamento de erros e auth)

Os middlewares ficam em `src/shared/middleware/` e resolvem duas coisas: **centralizar o tratamento de erros** (em vez de repetir `try/catch` em toda rota) e **rodar verificações antes da rota** (ex: exigir autenticação). Um middleware é só uma função `(req, res, next)`; chamar `next()` passa a bola pro próximo, e `next(err)` pula direto pro tratamento de erro.

### Middleware de erro (`errorHandler.ts`)

O error handler do Express é reconhecido pela assinatura de **4 parâmetros** (`err, req, res, next`) e precisa ser o **último** `app.use`, depois de todas as rotas. Junto vem o `AppError`, pra lançar erros com status HTTP significativo:

```ts
// src/shared/middleware/errorHandler.ts
export class AppError extends Error {
    constructor(public readonly statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
    }
}

export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
};
```

Registrado no `app.ts`, **por último**:

```ts
app.use('/api/products', productRouter)
app.use(errorHandler) // depois de todas as rotas
```

Agora as camadas de negócio podem lançar erros com significado, sem tratar status na rota:

```ts
const product = await this.repository.findOne(id);
if (!product) throw new AppError(404, "Product not found");
// cliente recebe: 404 { "message": "Product not found" }
```

### Encaminhando erros async (`asyncHandler.ts`)

No **Express 4**, erros de handlers `async` **não chegam sozinhos** ao error handler — só o que passa por `next(err)`. O `asyncHandler` é um wrapper que captura a rejeição da Promise e faz esse `next()` automaticamente, dispensando `try/catch` nas rotas:

```ts
// src/shared/middleware/asyncHandler.ts
export const asyncHandler =
    (handler) =>
    (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
```

Uso na rota — só o caminho feliz; qualquer erro cai no `errorHandler`:

```ts
productRouter.get('/:id', asyncHandler(async (req, res) => {
    const result = await productController.findOne(Number(req.params.id));
    res.status(200).json(result);
}));
```

> No Express 5 isso passou a ser automático e o wrapper deixaria de ser necessário; como o runtime aqui é o 4, ele ainda é.

### Middleware que roda antes da rota (`ensureAuth.ts`)

Verifica se a requisição traz o header `Authorization`. Se não vier, encaminha um `401` pro error handler; se vier, segue com `next()`. Como é síncrono, **não** precisa do `asyncHandler`:

```ts
// src/shared/middleware/ensureAuth.ts
export const ensureAuth = (req, _res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return next(new AppError(401, "Missing authorization header"));
    }
    return next();
};
```

Dá pra aplicar em três granularidades:

```ts
productRouter.get('/', ensureAuth, handler); // 1. só nesta rota
productRouter.use(ensureAuth);               // 2. em todas as rotas do router
app.use(ensureAuth);                         // 3. na app inteira (cuidado com rotas públicas, ex: /api/health)
```

No projeto ele está no nível do router de produtos (opção 2). Teste rápido:

```bash
curl -i http://localhost:3000/api/products                          # 401
curl -i http://localhost:3000/api/products -H "Authorization: Bearer abc123"  # passa
```

> Ele só verifica a **presença** do header — não valida o token. Validar (formato `Bearer`, JWT, etc.) é o passo seguinte quando for implementar autenticação de verdade.

**O fluxo completo de um erro:**

```
rota async lança / ensureAuth barra
      ↓
asyncHandler (.catch) ou next(new AppError(...))
      ↓
next(err)  →  Express detecta "next com argumento"
      ↓
errorHandler  →  AppError usa seu status; qualquer outro vira 500
```

**Links úteis (como construir um middleware):**

- **Escrever middlewares (guia oficial):** https://expressjs.com/en/guide/writing-middleware.html
- **Usar/registrar middlewares (guia oficial):** https://expressjs.com/en/guide/using-middleware.html
- **Tratamento de erros no Express (guia oficial):** https://expressjs.com/en/guide/error-handling.html
- **API de `app.use` / `router` (referência v5):** https://expressjs.com/en/5x/api/#app.use
- **`next()` e o fluxo de handlers (referência v5):** https://expressjs.com/en/5x/api/#req

---

## Passo 10 — Serviços externos (axios)

Para consumir APIs de terceiros o boilerplate usa o **axios**. A ideia é a mesma do knex no repository: **uma instância única configurada num só lugar**, injetada nos services pelo construtor (Injeção de Dependência). Assim a regra de negócio não conhece o axios direto — fica testável e o transporte é trocável.

Instale o axios:

```bash
npm i axios
```

### O cliente HTTP (`src/config/http.ts`)

Centraliza a configuração da chamada externa numa instância criada com `axios.create`. Toda `baseURL`, `timeout` e headers padrão ficam aqui — os services só chamam `this.http.get('/rota')`:

```ts
// src/config/http.ts
import 'dotenv/config';
import axios, { type AxiosInstance } from 'axios';

const httpClient: AxiosInstance = axios.create({
  baseURL: process.env.EXTERNAL_API_URL ?? 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default httpClient;
```

**Por que uma instância (`axios.create`) e não o `axios` global:**

- **`baseURL`** — os services usam só o caminho relativo (`/todos/1`); trocar o host da API externa é mexer em uma linha (ou no `.env`).
- **`timeout`** — sem ele uma API externa lenta trava a requisição indefinidamente. 5s é um ponto de partida razoável.
- **`headers`** — cabeçalhos padrão (`Content-Type`, e mais tarde tokens de auth) aplicados a todas as chamadas.
- **`import 'dotenv/config'`** no topo garante que o `EXTERNAL_API_URL` seja lido do `.env` (mesmo modelo do `knexfile.ts` e do `src/config/database.ts`).

> A `baseURL` cai num fallback (`jsonplaceholder.typicode.com`) quando `EXTERNAL_API_URL` não está definida — útil pra rodar o exemplo sem configurar nada.

### O service que consome a API (`src/shared/service/`)

O service recebe o `AxiosInstance` pelo construtor e traduz a resposta crua (`{ data }`) para o domínio. Tipar o retorno (`this.http.get<Todo>`) faz o axios devolver `data` já tipado:

```ts
// src/shared/service/index.ts
import type { AxiosInstance } from 'axios';
import type { Todo, TodoInput, TodoServiceInterface } from './interface.ts';

export class TodoService implements TodoServiceInterface {
    constructor(private readonly http: AxiosInstance) {}

    async getTodo(id: number): Promise<Todo> {
        const { data } = await this.http.get<Todo>(`/todos/${id}`);
        return data;
    }

    async createTodo(data: TodoInput): Promise<Todo> {
        const { data: created } = await this.http.post<Todo>('/todos', data);
        return created;
    }
}
```

Uma **interface** define o formato do recurso externo e o contrato do service — os use cases dependem da interface, não da classe concreta:

```ts
// src/shared/service/interface.ts
export interface Todo {
    id: number;
    userId: number;
    title: string;
    completed: boolean;
}

export type TodoInput = Omit<Todo, 'id'>;

export interface TodoServiceInterface {
    getTodo(id: number): Promise<Todo>;
    createTodo(data: TodoInput): Promise<Todo>;
}
```

### Ligando tudo (composition root)

A instância única é criada uma vez e injetada no service — mesmo lugar onde o router é montado (como o knex é passado ao repository no Passo 8):

```ts
import httpClient from '../../config/http.ts';
import { TodoService } from '../../shared/service/index.ts';

const todoService = new TodoService(httpClient);
```

### Padrões comuns (pra quando o service crescer)

**Query params** — o axios serializa o objeto `params` na URL (`?completed=true&_limit=10`):

```ts
this.http.get<Todo[]>('/todos', { params: { completed: true, _limit: 10 } });
```

**Auth por requisição / headers extras:**

```ts
this.http.get<Todo>(`/todos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
});
```

**Tratando o erro e convertendo pro `AppError`** — o axios lança em status >= 400; `isAxiosError` dá acesso a `response.status`. Combina com o `errorHandler` do Passo 9:

```ts
import axios from 'axios';
import { AppError } from '../middleware/errorHandler.ts';

try {
    const { data } = await this.http.get<Todo>(`/todos/${id}`);
    return data;
} catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new AppError(404, 'Todo not found');
    }
    throw new AppError(502, 'External service unavailable');
}
```

**Header de auth pra todas as chamadas (interceptor)** — injeta o token antes de cada requisição, sem repetir em cada método:

```ts
httpClient.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
    return config;
});
```

> Lembre de adicionar `EXTERNAL_API_URL` (e um eventual `EXTERNAL_API_TOKEN`) ao `.env` do Passo 5.

---

## Links de apoio

Referências para consultar caso trave em algum passo:

- **Express (docs oficiais, v5):** https://expressjs.com/en/5x/api/
- **Swagger + Express + TypeScript (tutorial):** https://medium.com/@devsfutureinc/how-to-create-a-express-typescript-swagger-node-js-template-6387a2a02afd
- **tsx (docs oficiais):** https://tsx.hirok.io/
- **Docker Compose — referência de `services`:** https://docs.docker.com/reference/compose-file/services/
- **Knex.js (docs oficiais):** https://knexjs.org/guide/
- **Axios (docs oficiais):** https://axios-http.com/docs/intro
- **Tutorial Knex.js com TypeScript + PostgreSQL (LuizTools):** https://www.luiztools.com.br/post/tutorial-de-knex-js-com-typescript-postgresql/
- **Iniciar projeto Node + Express + TypeScript (guia genérico):** https://dev.to/carlosorioli/iniciando-um-projeto-nodejs-express-com-typescript-4bfl
