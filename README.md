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

## Links de apoio

Referências para consultar caso trave em algum passo:

- **Express (docs oficiais, v5):** https://expressjs.com/en/5x/api/
- **Swagger + Express + TypeScript (tutorial):** https://medium.com/@devsfutureinc/how-to-create-a-express-typescript-swagger-node-js-template-6387a2a02afd
- **tsx (docs oficiais):** https://tsx.hirok.io/
- **Docker Compose — referência de `services`:** https://docs.docker.com/reference/compose-file/services/
- **Knex.js (docs oficiais):** https://knexjs.org/guide/
- **Tutorial Knex.js com TypeScript + PostgreSQL (LuizTools):** https://www.luiztools.com.br/post/tutorial-de-knex-js-com-typescript-postgresql/
- **Iniciar projeto Node + Express + TypeScript (guia genérico):** https://dev.to/carlosorioli/iniciando-um-projeto-nodejs-express-com-typescript-4bfl
