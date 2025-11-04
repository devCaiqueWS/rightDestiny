-- Habilita extensões úteis (opcional)
create extension if not exists pgcrypto; -- para gen_random_uuid()

-- Usuários
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now()
);

-- Favoritos (itens salvos pelos usuários)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  item_key text not null,          -- identificador do item (slug, url ou id)
  item_type text not null,         -- ex: 'hotel' | 'tour' | 'lugar'
  title text,
  url text,
  image_url text,
  created_at timestamptz not null default now(),
  unique(user_id, item_key, item_type)
);

-- Logs de busca
create table if not exists search_logs (
  id uuid primary key default gen_random_uuid(),
  query_text text,
  cidade text,
  created_at timestamptz not null default now()
);

-- Hotéis e opções de hospedagem
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text,
  country text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists hotel_options (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2) not null,
  currency text not null default 'USD',
  capacity int,
  image_url text,
  created_at timestamptz not null default now()
);

