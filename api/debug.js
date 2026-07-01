import mysql from 'mysql2/promise';

let pool;

export default async function handler(req, res) {
  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'mdnkewbg_claps_learn',
        password: process.env.DB_PASSWORD || 'gHUn3jXAeDkkcr3naJPj',
        database: process.env.DB_NAME || 'mdnkewbg_claps_learn',
      });
    }

    const [tables] = await pool.execute('SHOW TABLES');
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM teachers');
    
    const [masterRows] = await pool.execute('SELECT * FROM masters LIMIT 10');
    const [masterSingleRows] = await pool.execute('SELECT * FROM master LIMIT 10');

    return res.status(200).json({
      masters_rows: masterRows,
      master_single_rows: masterSingleRows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
