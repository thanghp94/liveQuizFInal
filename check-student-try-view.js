const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkStudentTryView() {
  try {
    // Get column information
    const columnInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'v_assignment_student_try_info'
    `);
    
    console.log('Columns in v_assignment_student_try_info:');
    console.log(columnInfo.rows);
    
    // Get sample data
    const sampleData = await pool.query(`
      SELECT * FROM v_assignment_student_try_info LIMIT 5
    `);
    
    console.log('\nSample data:');
    console.log(sampleData.rows);
  } catch (error) {
    console.error('Error checking view:', error);
  } finally {
    pool.end();
  }
}

checkStudentTryView();