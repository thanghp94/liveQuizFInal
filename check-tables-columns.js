const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkTablesColumns() {
  try {
    // Check assignment table columns
    const assignmentColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'assignment'
    `);
    
    console.log('Columns in assignment table:');
    console.log(assignmentColumns.rows);
    
    // Check Student_try table columns
    const studentTryColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Student_try'
    `);
    
    console.log('\nColumns in Student_try table:');
    console.log(studentTryColumns.rows);
    
    // Check Users table columns
    const usersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Users'
    `);
    
    console.log('\nColumns in Users table:');
    console.log(usersColumns.rows);
  } catch (error) {
    console.error('Error checking tables columns:', error);
  } finally {
    pool.end();
  }
}

checkTablesColumns();