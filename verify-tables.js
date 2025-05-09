const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function verifyTables() {
  try {
    // Check if we can count records in v_recent_live_assignments
    const assignmentCount = await pool.query(`
      SELECT COUNT(*) FROM v_recent_live_assignments
    `);
    console.log('Count of records in v_recent_live_assignments:');
    console.log(assignmentCount.rows[0]);
    
    // Check if we can count records in v_assignment_student_try_info
    const studentTryCount = await pool.query(`
      SELECT COUNT(*) FROM v_assignment_student_try_info
    `);
    console.log('\nCount of records in v_assignment_student_try_info:');
    console.log(studentTryCount.rows[0]);
    
    // Check if we can count records in student_try
    const studentTryRawCount = await pool.query(`
      SELECT COUNT(*) FROM student_try
    `);
    console.log('\nCount of records in student_try:');
    console.log(studentTryRawCount.rows[0]);
    
    // List all live assignments (if any)
    const liveAssignments = await pool.query(`
      SELECT * FROM v_recent_live_assignments 
      LIMIT 5
    `);
    console.log('\nSample from v_recent_live_assignments:');
    console.log(liveAssignments.rows);
    
    // List all tables in the database to confirm schema
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    console.log('\nAll tables in the public schema:');
    console.log(allTables.rows);
  } catch (error) {
    console.error('Error verifying tables:', error);
  } finally {
    pool.end();
  }
}

verifyTables();