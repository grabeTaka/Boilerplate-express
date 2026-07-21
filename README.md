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
    connection: {
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD ?? "root",
      database: process.env.DB_NAME ?? "express_db",
    },
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
- **`exactOptionalPropertyTypes`** (ligado no `tsconfig`) rejeita `undefined` em campos opcionais. Como `process.env.X` é `string | undefined`, use `?? "valor"` nos campos pra garantir `string`.
- **Host do banco:** no host use `localhost`; dentro do Docker o Postgres é o serviço `db`. Resolva com a env `DB_HOST` — adicione `- DB_HOST=db` no `environment:` do serviço `app` (Passo 6). No host, sem `DB_HOST`, cai no fallback `localhost`.

> As mensagens `Failed to load external module ts-node/register…` são inofensivas — o Node 24 carrega `.ts` nativamente, então o Knex ignora esses loaders antigos e segue.

**Criar e rodar migrations:**

```bash
npx knex migrate:make add_products_table -x ts   # cria a migration em .ts
npx knex migrate:latest                           # aplica as migrations pendentes
npx knex migrate:down                             # desfaz a última migration
```

> Precisa do Postgres no ar. Se aparecer `connect ECONNREFUSED 127.0.0.1:5432`, o banco não está de pé — suba com `docker compose up -d db` (Passo 6) antes.

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
