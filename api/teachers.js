import mysql from 'mysql2/promise';

// Reuse connection pool if possible to avoid creating new connections for every lambda invocation
let pool;

export default async function handler(req, res) {
  // Only allow GET requests
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
        connectionLimit: 10,
        queueLimit: 0,
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, teacher_name, teacher_code, type, subject, medium FROM teachers WHERE LOWER(TRIM(status)) = 'active' OR status = '1' OR status IS NULL ORDER BY id ASC"
    );

    // Set Edge Caching headers
    // s-maxage=3600 instructs Vercel Edge Network to cache the response for 1 hour (3600 seconds)
    // stale-while-revalidate=86400 serves stale content while re-fetching if the cache is older than 1 hour
    res.setHeader('Cache-Control', 'max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
    
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message,
      code: error.code
    });
  }
}
