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
    
    return res.status(200).json({
      tables,
      teacher_count: count[0].count
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
