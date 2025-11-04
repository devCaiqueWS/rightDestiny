const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

// Configuração do Pool para Neon
const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  // Neon com sslmode=require precisa de SSL; desabilitando verificação de CA
  ssl: { rejectUnauthorized: false },
});

// Util: gerar token JWT
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Middleware: autenticação via Bearer token
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice('Bearer '.length)
    : null;
  if (!token) return res.status(401).json({ ok: false, error: 'Sem token' });
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
}

// Endpoint de saúde que testa uma query simples
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select now() as now,
              current_user as user,
              current_database() as db,
              version() as version`
    );
    res.json({ ok: true, info: rows[0] });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Exemplo: executar SELECT 1
app.get('/api/ping', async (req, res) => {
  try {
    const { rows } = await pool.query('select 1 as pong');
    res.json({ ok: true, result: rows[0] });
  } catch (err) {
    console.error('Ping error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Auth: registrar usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email e senha são obrigatórios' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'insert into users(email, password_hash, name) values($1,$2,$3) returning id, email, name, created_at',
      [email, hash, name || null]
    );
    const user = rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    res.status(201).json({ ok: true, token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ ok: false, error: 'Email já cadastrado' });
    }
    console.error('Register error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Auth: login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email e senha são obrigatórios' });
    }
    const { rows } = await pool.query('select id, email, password_hash, name, created_at from users where email=$1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });
    const token = signToken({ userId: user.id, email: user.email });
    delete user.password_hash;
    res.json({ ok: true, token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Perfil do usuário logado
app.get('/api/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('select id, email, name, created_at from users where id=$1', [req.user.userId]);
    const me = rows[0];
    res.json({ ok: true, user: me });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Hotéis: listar opções por slug
app.get('/api/hotels/:slug/options', async (req, res) => {
  try {
    const slug = req.params.slug;
    const { rows } = await pool.query(
      `select ho.id,
              ho.title,
              ho.description,
              ho.price,
              ho.currency,
              ho.capacity,
              ho.image_url,
              h.slug,
              h.name as hotel_name
         from hotel_options ho
         join hotels h on h.id = ho.hotel_id
        where h.slug = $1
        order by ho.price asc, ho.created_at desc`,
      [slug]
    );
    res.json({ ok: true, items: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Hotéis: inserir opção (cria o hotel se não existir)
app.post('/api/hotels/:slug/options', auth, async (req, res) => {
  try {
    const slug = req.params.slug;
    const { title, description, price, currency, capacity, image_url, hotel_name, city, country } = req.body || {};
    if (!title || price == null) {
      return res.status(400).json({ ok: false, error: 'title e price são obrigatórios' });
    }
    // Garante existência do hotel
    const hotel = await pool.query('select id from hotels where slug=$1', [slug]);
    let hotelId = hotel.rows[0]?.id;
    if (!hotelId) {
      const name = hotel_name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const created = await pool.query(
        'insert into hotels(slug, name, city, country) values($1,$2,$3,$4) returning id',
        [slug, name, city || null, country || null]
      );
      hotelId = created.rows[0].id;
    }
    const { rows } = await pool.query(
      `insert into hotel_options(hotel_id, title, description, price, currency, capacity, image_url)
       values($1,$2,$3,$4,$5,$6,$7)
       returning *`,
      [hotelId, title, description || null, price, currency || 'USD', capacity || null, image_url || null]
    );
    res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Favoritos: listar do usuário
app.get('/api/favorites', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('select * from favorites where user_id=$1 order by created_at desc', [req.user.userId]);
    res.json({ ok: true, items: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Favoritos: adicionar (upsert por user+item_key+item_type)
app.post('/api/favorites', auth, async (req, res) => {
  try {
    const { item_key, item_type, title, url, image_url } = req.body || {};
    if (!item_key || !item_type) {
      return res.status(400).json({ ok: false, error: 'item_key e item_type são obrigatórios' });
    }
    const { rows } = await pool.query(
      `insert into favorites(user_id, item_key, item_type, title, url, image_url)
       values($1,$2,$3,$4,$5,$6)
       on conflict(user_id, item_key, item_type)
       do update set title=excluded.title, url=excluded.url, image_url=excluded.image_url
       returning *`,
      [req.user.userId, item_key, item_type, title || null, url || null, image_url || null]
    );
    res.status(201).json({ ok: true, item: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Favoritos: remover
app.delete('/api/favorites/:id', auth, async (req, res) => {
  try {
    await pool.query('delete from favorites where id=$1 and user_id=$2', [req.params.id, req.user.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Favoritos: remover por chave (item_type + item_key)
app.delete('/api/favorites/by-key/:item_type/:item_key', auth, async (req, res) => {
  try {
    const { item_type, item_key } = req.params;
    await pool.query('delete from favorites where user_id=$1 and item_type=$2 and item_key=$3', [req.user.userId, item_type, item_key]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Logs de busca
app.post('/api/search-logs', async (req, res) => {
  try {
    const { query_text, cidade } = req.body || {};
    await pool.query('insert into search_logs(query_text, cidade) values($1,$2)', [query_text || null, cidade || null]);
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, async () => {
  try {
    await pool.query('select 1');
    console.log(`Conectado ao Neon e servidor ouvindo em http://localhost:${port}`);
  } catch (err) {
    console.error('Falha ao conectar ao Neon:', err.message);
  }
});
