import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'ec2-54-84-172-253.compute-1.amazonaws.com',
    user: 'mdnkewbg_claps_learn',
    password: 'gHUn3jXAeDkkcr3naJPj',
    database: 'mdnkewbg_claps_learn',
  });

  try {
    const [rows] = await pool.execute('SELECT * FROM teachers LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
