const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkStudentTry() {
  try {
    // Get column information
    const columnInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'student_try'
    `);
    
    console.log('Columns in student_try:');
    console.log(columnInfo.rows);
    
    // Get sample data
    const sampleData = await pool.query(`
      SELECT * FROM student_try LIMIT 5
    `);
    
    console.log('\nSample data:');
    console.log(sampleData.rows);
  } catch (error) {
    console.error('Error checking view:', error);
  } finally {
    pool.end();
  }
}

checkStudentTry();