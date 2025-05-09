const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkView() {
  try {
    // First check if the view exists
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' AND table_name = 'v_recent_live_assignment'
    `);
    
    if (viewCheck.rows.length === 0) {
      console.log('View v_recent_live_assignment does not exist');
      
      // List all available views
      console.log('\nAvailable views:');
      const allViews = await pool.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
      `);
      console.log(allViews.rows);
      
    } else {
      // Get column information
      const columnInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'v_recent_live_assignment'
      `);
      
      console.log('Columns in v_recent_live_assignment:');
      console.log(columnInfo.rows);
      
      // Get sample data
      const sampleData = await pool.query(`
        SELECT * FROM v_recent_live_assignment LIMIT 5
      `);
      
      console.log('\nSample data:');
      console.log(sampleData.rows);
    }
  } catch (error) {
    console.error('Error checking view:', error);
  } finally {
    pool.end();
  }
}

checkView();