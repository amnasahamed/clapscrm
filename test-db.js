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
    const [masterRows] = await pool.execute('SELECT * FROM masters LIMIT 2');
    const [masterSingleRows] = await pool.execute('SELECT * FROM master LIMIT 2');
    
    console.log("MASTERS:", JSON.stringify(masterRows, null, 2));
    console.log("MASTER:", JSON.stringify(masterSingleRows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
