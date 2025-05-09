const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

async function getQuizProgress() {
  try {
    // Query to get student quiz progress from base tables
    const query = `
      SELECT 
        a."ID" as assignment_id,
        a.description as assignment_name,
        ast."ID" as student_try_id,
        u."Fullname" as student_name,
        COUNT(st."ID") as questions_done,
        a.noofquestion as total_questions,
        SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
        SUM(st.score) as total_score,
        MAX(st.currentindex) as current_question_index
      FROM assignment a
      JOIN assignment_student_try ast ON a."ID" = ast."assignmentID"
      JOIN "Student_try" st ON ast."ID" = st.assignment_student_try_id
      JOIN "Users" u ON ast.hocsinh_id = u."userID"
      GROUP BY a."ID", a.description, ast."ID", u."Fullname", a.noofquestion
      ORDER BY SUM(st.score) DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    console.log(`Found ${result.rows.length} student quiz progress records`);
    console.log('\nSample quiz progress data:');
    
    // Display the first 5 records for brevity
    for (let i = 0; i < Math.min(5, result.rows.length); i++) {
      console.log(result.rows[i]);
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error getting quiz progress:', error);
    return [];
  } finally {
    pool.end();
  }
}

getQuizProgress();