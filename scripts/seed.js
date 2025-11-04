const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const email = 'muriquilante@gmail.com';
    const name = 'Usuário Teste';
    const password = '123456b';
    const hash = await bcrypt.hash(password, 10);
    const { rowCount } = await pool.query('select 1 from users where email=$1', [email]);
    if (rowCount === 0) {
      await pool.query('insert into users(email, password_hash, name) values($1,$2,$3)', [email, hash, name]);
      console.log('Usuário seed criado:', email);
    } else {
      console.log('Usuário seed já existe:', email);
    }
  } catch (e) {
    console.error('Seed error:', e.message);
    process.exit(1);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    await pool.end();
  }
}

run();

