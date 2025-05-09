const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function getStudentProgress() {
  try {
    // Get recent assignments with student progress data
    const query = `
      SELECT 
        a.id as assignment_id,
        a.description as assignment_name,
        ast.id as student_try_id,
        u.Fullname as student_name,
        COUNT(st.id) as questions_completed,
        a.noofquestion as total_questions,
        SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
        SUM(st.score) as total_score
      FROM assignment a
      JOIN assignment_student_try ast ON a.id = ast."assignmentID"
      JOIN "Student_try" st ON ast.id = st.assignment_student_try_id
      JOIN "Users" u ON ast.hocsinh_id = u.userID
      WHERE a."update" > NOW() - INTERVAL '24 hours'
      GROUP BY a.id, a.description, ast.id, u.Fullname, a.noofquestion
      ORDER BY a."update" DESC, total_score DESC
      LIMIT 100
    `;
    
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} student progress records`);
    console.log('\nSample student progress data:');
    for (let i = 0; i < Math.min(10, result.rows.length); i++) {
      console.log(result.rows[i]);
    }
    
    // If no results, try a broader query without the time filter
    if (result.rows.length === 0) {
      console.log('\nNo recent assignments found. Trying broader query without time filter...');
      
      const broadQuery = `
        SELECT 
          a.id as assignment_id,
          a.description as assignment_name,
          ast.id as student_try_id,
          u.Fullname as student_name,
          COUNT(st.id) as questions_completed,
          a.noofquestion as total_questions,
          SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
          SUM(st.score) as total_score
        FROM assignment a
        JOIN assignment_student_try ast ON a.id = ast."assignmentID"
        JOIN "Student_try" st ON ast.id = st.assignment_student_try_id
        JOIN "Users" u ON ast.hocsinh_id = u.userID
        GROUP BY a.id, a.description, ast.id, u.Fullname, a.noofquestion
        ORDER BY a."update" DESC, total_score DESC
        LIMIT 10
      `;
      
      const broadResult = await pool.query(broadQuery);
      
      console.log(`Found ${broadResult.rows.length} student progress records (broader query)`);
      if (broadResult.rows.length > 0) {
        console.log('\nSample student progress data (broader query):');
        for (let i = 0; i < Math.min(5, broadResult.rows.length); i++) {
          console.log(broadResult.rows[i]);
        }
      }
    }
  } catch (error) {
    console.error('Error getting student progress:', error);
  } finally {
    pool.end();
  }
}

getStudentProgress();