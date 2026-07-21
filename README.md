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
# Bloco que declara todos os containers (serviços) da aplicação
services:

  # "app" é o serviço da API Express
  app:
    build: .                       # constrói a imagem a partir do Dockerfile no diretório atual
    container_name: express_app    # nome fixo do container (em vez do gerado automaticamente)

    # Mapeamento de portas no formato HOST:CONTAINER
    ports:
      - "${PORT}:${PORT}"          # expõe a porta do container no host (valor vem do .env)

    volumes:
      - .:/usr/src/app             # bind mount do código — permite hot reload sem rebuild
      - /usr/src/app/node_modules  # volume anônimo — protege o node_modules da imagem

    environment:
      - NODE_ENV=${NODE_ENV}       # ambiente de execução (development / production)
      - PORT=${PORT}               # porta em que o Express escuta dentro do container
      # host = "db" (nome do serviço), porta interna do Postgres sempre 5432
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

    depends_on:
      db:                          # só sobe depois que o serviço "db"...
        condition: service_healthy # ...passar no healthcheck (aceitar conexões)

  # "db" é o serviço do banco de dados
  db:
    image: postgres:16-alpine      # imagem oficial do Postgres (variante Alpine, leve)
    container_name: express_db     # nome fixo do container do banco
    restart: unless-stopped        # reinicia sozinho, exceto se parado manualmente

    ports:
      - "5432:5432"                # só necessário para acessar do host (DBeaver, psql)

    environment:
      - POSTGRES_USER=${DB_USER}       # usuário criado na inicialização do banco
      - POSTGRES_DB=${DB_NAME}         # database criado na inicialização
      - POSTGRES_PASSWORD=${DB_PASSWORD} # senha do usuário acima

    volumes:
      - pgdata:/var/lib/postgresql/data  # volume nomeado — dados sobrevivem a "docker compose down"

    # Checa periodicamente se o Postgres já está pronto para conexões
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]  # comando de verificação
      interval: 5s                 # intervalo entre cada checagem
      timeout: 5s                  # tempo máximo de espera por checagem
      retries: 5                   # tentativas antes de marcar como "unhealthy"
      start_period: 10s            # carência inicial antes de começar a contar falhas

# Declaração dos volumes nomeados usados acima
volumes:
  pgdata:                          # volume persistente dos dados do Postgres
```

> As variáveis (`PORT`, `NODE_ENV`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) vêm do `.env` do Passo 5.

Suba tudo com:

```bash
docker compose up --build
```

---

## Links de apoio

Referências para consultar caso trave em algum passo:

- **Express (docs oficiais, v5):** https://expressjs.com/en/5x/api/
- **Swagger + Express + TypeScript (tutorial):** https://medium.com/@devsfutureinc/how-to-create-a-express-typescript-swagger-node-js-template-6387a2a02afd
- **tsx (docs oficiais):** https://tsx.hirok.io/
- **Docker Compose — referência de `services`:** https://docs.docker.com/reference/compose-file/services/
- **Iniciar projeto Node + Express + TypeScript (guia genérico):** https://dev.to/carlosorioli/iniciando-um-projeto-nodejs-express-com-typescript-4bfl
