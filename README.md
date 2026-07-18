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
