RightDestiny — API e Banco de Dados

Este repositório contém a aplicação Node.js (Express) com integração ao PostgreSQL (Neon Serverless) e o frontend estático. A API provê autenticação via JWT, favoritos por usuário, registro de buscas e catálogo de opções de hospedagem.

- Base da API: `http://localhost:3000`
- Banco: PostgreSQL (Neon). Variáveis em `.env` (exemplo em `.env.example`).

Para detalhes completos da API e do esquema do banco, consulte:
- `docs/API.md` — Endpoints, exemplos, códigos de erro
- `docs/DATABASE.md` — Tabelas, relacionamentos e scripts

Requisitos
- Node.js 18+
- Conta/instância no Neon (PostgreSQL com SSL)

Configuração rápida
1) Crie um arquivo `.env` a partir de `.env.example` e preencha com suas credenciais do Neon.
2) Instale dependências: `npm install`
3) Aplique as migrations: `npm run migrate`
4) (Opcional) Seeds:
   - Usuário de teste (login): `npm run seed`
   - Opções de hospedagem (Burj Al Arab): `npm run seed:hotels`
5) Inicie a API: `npm start`

Frontend (páginas)
- `5login.html` — Login (salva token `rd_token`)
- `7cadastro.html` — Cadastro de usuário
- `6favoritos.html` — Lista/remover favoritos do usuário autenticado
- `HoteisBurjAlArab.html` — Lista e insere opções de hospedagem do banco

O frontend consome a API via `js/api.js`.

Observações de segurança
- Nunca faça commit do `.env` (já está no `.gitignore`).
- Ajuste `JWT_SECRET` para um valor forte em produção.
- SSL: por compatibilidade com `sslmode=require` do Neon, a conexão usa `ssl: { rejectUnauthorized: false }`. Para verificação com CA, forneça o certificado e troque para `rejectUnauthorized: true`.

Scripts úteis
- `npm run migrate` — aplica SQL de `db/migrations.sql`
- `npm run seed` — cria usuário seed
- `npm run seed:hotels` — cria hotel e opções de exemplo
- `npm start` — inicia a API (`server.js`)

Estrutura
- `server.js` — API Express (auth, favoritos, buscas, hotéis)
- `db/migrations.sql` — criação de tabelas
- `scripts/migrate.js` — runner de migrations
- `scripts/seed.js`, `scripts/seed_hotels.js` — dados de exemplo
- `js/api.js` — cliente JS para o frontend

