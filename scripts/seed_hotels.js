const { Pool } = require('pg');
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
    const slug = 'burj-al-arab';
    const name = 'Burj Al Arab';
    let hotelId;
    const h = await pool.query('select id from hotels where slug=$1', [slug]);
    if (h.rowCount) {
      hotelId = h.rows[0].id;
    } else {
      const ins = await pool.query('insert into hotels(slug, name, city, country) values($1,$2,$3,$4) returning id', [slug, name, 'Dubai', 'UAE']);
      hotelId = ins.rows[0].id;
    }

    const options = [
      { title: 'Suíte Deluxe', description: 'Vista para o mar, café da manhã incluso', price: 3500, currency: 'AED', capacity: 2, image_url: null },
      { title: 'Suíte Família', description: 'Dois quartos, ideal para famílias', price: 5200, currency: 'AED', capacity: 4, image_url: null },
      { title: 'Royal Suite', description: 'Luxo máximo com serviço de mordomo', price: 25000, currency: 'AED', capacity: 2, image_url: null },
    ];

    for (const o of options) {
      await pool.query(
        `insert into hotel_options(hotel_id, title, description, price, currency, capacity, image_url)
         values($1,$2,$3,$4,$5,$6,$7)`,
        [hotelId, o.title, o.description, o.price, o.currency, o.capacity, o.image_url]
      );
    }
    console.log('Seed de opções do Burj Al Arab criado.');
  } catch (e) {
    console.error('Seed hotels error:', e.message);
    process.exit(1);
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    await pool.end();
  }
}

run();

