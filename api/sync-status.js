import mysql from 'mysql2/promise';

let pool;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'mdnkewbg_claps_learn',
        password: process.env.DB_PASSWORD || 'gHUn3jXAeDkkcr3naJPj',
        database: process.env.DB_NAME || 'mdnkewbg_claps_learn',
        charset: 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
      });
    }

    const [rows] = await pool.execute(
      "SELECT MAX(created_at) as lastSync FROM teachers"
    );

    res.setHeader('Cache-Control', 'max-age=60, s-maxage=60, stale-while-revalidate=120');
    
    return res.status(200).json({ lastSync: rows[0]?.lastSync || null });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message,
      code: error.code
    });
  }
}
