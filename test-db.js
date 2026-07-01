import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'ec2-54-84-172-253.compute-1.amazonaws.com',
    user: 'mdnkewbg_claps_learn',
    password: 'gHUn3jXAeDkkcr3naJPj',
    database: 'mdnkewbg_claps_learn',
    connectTimeout: 20000,
  });

  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    console.log("Users:", userCount[0].count);
    
    // Also let's check roles
    const [roles] = await pool.execute('SELECT * FROM roles');
    console.log("Roles:", JSON.stringify(roles, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
