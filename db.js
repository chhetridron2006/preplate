/*
  db.js — PostgreSQL connection and table setup.
  Creates all tables on startup and seeds menu items if empty.
*/

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {

  /* students: registered user accounts */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id            SERIAL PRIMARY KEY,
      full_name     TEXT    NOT NULL,
      student_id    TEXT    NOT NULL UNIQUE,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `);

  /* menu_items: the canteen food the canteen offers */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id          SERIAL PRIMARY KEY,
      name        TEXT    NOT NULL,
      description TEXT    NOT NULL,
      price       INTEGER NOT NULL,
      category    TEXT    NOT NULL DEFAULT 'main',
      available   BOOLEAN NOT NULL DEFAULT true,
      img         TEXT    NOT NULL DEFAULT 'default.jpg',
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `);

  /* orders: one row per student pre-order */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id           SERIAL PRIMARY KEY,
      student_db_id INTEGER REFERENCES students(id),
      student_name TEXT    NOT NULL,
      student_id   TEXT    NOT NULL,
      pickup_time  TEXT    NOT NULL,
      total_price  INTEGER NOT NULL,
      status       TEXT    NOT NULL DEFAULT 'Pending',
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `);

  /* order_items: each food line inside an order */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id           SERIAL PRIMARY KEY,
      order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER REFERENCES menu_items(id),
      item_name    TEXT    NOT NULL,
      quantity     INTEGER NOT NULL,
      unit_price   INTEGER NOT NULL,
      row_total    INTEGER NOT NULL
    )
  `);

  /* Seed menu items if table is empty */
  const count = await pool.query("SELECT COUNT(*) FROM menu_items");
  if (parseInt(count.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO menu_items (name, description, price, category, available, img) VALUES
        ('Ema Datshi',      'Chilli and cheese stew with red rice.',   140, 'main',  true,  'ema.jpg'),
        ('Phaksha Paa',     'Pork with red chilli and vegetables.',    200, 'main',  true,  'phaksha.jpg'),
        ('Kewa Datshi',     'Potato and cheese stew.',                 135, 'main',  true,  'kewa.jpg'),
        ('Jasha Maru',      'Minced chicken with tomato and chilli.',  185, 'main',  true,  'jasha.jpg'),
        ('Momos (Veg)',     'Steamed dumplings, vegetable filling.',    50, 'snack', true,  'vmomo.jpg'),
        ('Momos (Chicken)', 'Steamed dumplings, spiced chicken.',       80, 'snack', false, 'momo.jpg'),
        ('Red Rice',        'Traditional Bhutanese red rice.',          40, 'side',  true,  'red.jpg'),
        ('Butter Tea',      'Traditional salted butter tea.',           40, 'drink', true,  'butter_tea.jpg'),
        ('Mineral Water',   '500ml chilled water.',                     15, 'drink', true,  'water.jpg')
    `);
    console.log("Menu items seeded.");
  }

  console.log("Database tables ready.");
}

module.exports = { pool, initDB };
