const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function checkAllAssignments() {
  try {
    // Get all assignments from v_recent_live_assignments
    const assignments = await pool.query(`
      SELECT * FROM v_recent_live_assignments 
      ORDER BY "update" DESC
    `);
    
    console.log('All assignments from v_recent_live_assignments:');
    console.log(`Found ${assignments.rows.length} assignments`);
    
    // Display the first 3 assignments for brevity
    for (let i = 0; i < Math.min(3, assignments.rows.length); i++) {
      console.log(`\nAssignment ${i+1}:`);
      console.log(assignments.rows[i]);
    }
    
    if (assignments.rows.length > 0) {
      // Get the first assignment ID
      const firstAssignmentId = assignments.rows[0].id;
      
      console.log(`\nChecking student progress for assignment ID: ${firstAssignmentId}`);
      
      // Get student progress data for this assignment
      const studentProgress = await pool.query(`
        SELECT * FROM v_assignment_student_try_info
        WHERE "assignmentID" = $1
        ORDER BY total_score DESC
      `, [firstAssignmentId]);
      
      console.log(`\nStudent progress (${studentProgress.rows.length} records):`);
      
      // Display the first 5 student records for brevity
      for (let i = 0; i < Math.min(5, studentProgress.rows.length); i++) {
        console.log(`\nStudent ${i+1}:`);
        console.log(studentProgress.rows[i]);
      }
    }
  } catch (error) {
    console.error('Error checking assignments:', error);
  } finally {
    pool.end();
  }
}

checkAllAssignments();