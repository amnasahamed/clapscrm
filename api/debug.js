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
    
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [roles] = await pool.execute('SELECT * FROM roles');
    const [masterCount] = await pool.execute('SELECT COUNT(*) as count FROM masters');

    return res.status(200).json({
      teacher_table_count: count[0].count,
      user_table_count: userCount[0].count,
      master_table_count: masterCount[0].count,
      roles: roles
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
