const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkAssignmentStudentTryInfo() {
  try {
    // Check column structure
    const columnInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'v_assignment_student_try_info'
    `);
    
    console.log('Columns in v_assignment_student_try_info:');
    console.log(columnInfo.rows);
    
    // Check if there's any data in the view
    const countData = await pool.query(`
      SELECT COUNT(*) FROM v_assignment_student_try_info
    `);
    
    console.log(`\nNumber of records in v_assignment_student_try_info: ${countData.rows[0].count}`);
    
    // Try to get sample data without any conditions
    const sampleData = await pool.query(`
      SELECT * FROM v_assignment_student_try_info LIMIT 5
    `);
    
    console.log('\nSample data from v_assignment_student_try_info:');
    console.log(sampleData.rows);
    
    // Check the structure of the underlying tables
    const assignmentStudentTryColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'assignment_student_try'
    `);
    
    console.log('\nColumns in assignment_student_try:');
    console.log(assignmentStudentTryColumns.rows);
  } catch (error) {
    console.error('Error checking v_assignment_student_try_info:', error);
  } finally {
    pool.end();
  }
}

checkAssignmentStudentTryInfo();