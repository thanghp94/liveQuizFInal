const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  // Connect to 'postgres' database initially
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkDatabases() {
  try {
    // List all databases
    const result = await pool.query(`
      SELECT datname FROM pg_database WHERE datistemplate = false
    `);
    
    console.log('Available databases:');
    console.log(result.rows);
  } catch (error) {
    console.error('Error checking databases:', error);
  } finally {
    pool.end();
  }
}

checkDatabases();