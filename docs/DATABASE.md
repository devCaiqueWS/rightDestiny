Banco de Dados — RightDestiny

PostgreSQL (Neon). Migrations em `db/migrations.sql`.

Extensões
- `pgcrypto` — para `gen_random_uuid()`

Tabelas
- `users`
  - `id uuid PK default gen_random_uuid()`
  - `email text not null unique`
  - `password_hash text not null`
  - `name text`
  - `created_at timestamptz not null default now()`

- `favorites`
  - `id uuid PK default gen_random_uuid()`
  - `user_id uuid not null references users(id) on delete cascade`
  - `item_key text not null` (chave do item — ex.: slug/URL/id)
  - `item_type text not null` (ex.: `hotel`, `tour`, `destino`)
  - `title text`
  - `url text`
  - `image_url text`
  - `created_at timestamptz not null default now()`
  - `unique(user_id, item_key, item_type)`

- `search_logs`
  - `id uuid PK default gen_random_uuid()`
  - `query_text text`
  - `cidade text`
  - `created_at timestamptz not null default now()`

- `hotels`
  - `id uuid PK default gen_random_uuid()`
  - `slug text not null unique`
  - `name text not null`
  - `city text`
  - `country text`
  - `image_url text`
  - `created_at timestamptz not null default now()`

- `hotel_options`
  - `id uuid PK default gen_random_uuid()`
  - `hotel_id uuid not null references hotels(id) on delete cascade`
  - `title text not null`
  - `description text`
  - `price numeric(12,2) not null`
  - `currency text not null default 'USD'`
  - `capacity int`
  - `image_url text`
  - `created_at timestamptz not null default now()`

Relacionamentos
- `favorites.user_id -> users.id` (1:N)
- `hotel_options.hotel_id -> hotels.id` (1:N)

Boas práticas e índices (sugestões)
- Índices por uso:
  - `favorites(user_id)`; `favorites(user_id, item_type)` se filtrar por tipo
  - `hotel_options(hotel_id)`
- Em produção, considerar `created_at` para ordenações frequentes.

Migrations/Seeds
- SQL das tabelas: `db/migrations.sql`
- Aplicar: `npm run migrate`
- Usuário de teste: `npm run seed`
- Hotéis de exemplo: `npm run seed:hotels`

Ambiente (.env)
- `PGHOST` — host Neon (pooler)
- `PGDATABASE` — database
- `PGUSER` — usuário
- `PGPASSWORD` — senha
- `PGPORT=5432`
- `PGSSLMODE=require`
- `PGCHANNELBINDING=require`
- `JWT_SECRET` — segredo do JWT (altere em produção)
- `JWT_EXPIRES_IN=7d` — expiração do token

