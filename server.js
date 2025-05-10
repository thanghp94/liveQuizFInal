const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// PostgreSQL connection
const pool = new Pool({
  host: '193.42.244.152',
  port: 2345,
  database: 'postgres',
  user: 'postgres',
  password: 'psql@2025'
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get active assignments
app.get('/api/active-assignments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        description, 
        "Assignmentname", 
        type,
        noofquestion,
        "update"
      FROM assignment 
      WHERE "update" > NOW() - INTERVAL '3 hours'
      ORDER BY "update" DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// API endpoint to get student progress for a specific assignment
app.get('/api/assignment/:id/progress', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // First check if we can directly find students from v_assignment_student_try_info view
    try {
      const viewResult = await pool.query(`
        SELECT * FROM v_assignment_student_try_info
        WHERE "assignmentID" = $1
      `, [assignmentId]);
      
      console.log('Found students from view:', viewResult.rows.length);
      
      if (viewResult.rows.length > 0) {
        // Map the view data to match the expected format
        const mappedResults = viewResult.rows.map(row => ({
          assignment_id: row.assignmentID,
          assignment_name: row.assignment_name || row.description,
          student_try_id: row.id,
          student_name: row.student_name || row.Full_Name,
          questions_done: row.questions_done || 0,
          total_questions: row.noofquestion || 0,
          correct_answers: row.correct_answers || 0,
          total_score: row.total_score || 0,
          current_question_index: row.currentindex || 0
        }));
        
        return res.json(mappedResults);
      }
    } catch (viewError) {
      console.log('Error using view, falling back to direct query:', viewError.message);
    }
    
    // Try querying for just the assignment and users directly
    const directUserQuery = await pool.query(`
      SELECT 
        a.id as assignment_id,
        a.description as assignment_name,
        ast.id as student_try_id,
        u."Full_Name" as student_name,
        0 as questions_done,
        a.noofquestion as total_questions,
        0 as correct_answers,
        0 as total_score,
        0 as current_question_index
      FROM assignment a
      LEFT JOIN assignment_student_try ast ON a.id = ast."assignmentID"
      LEFT JOIN "Users" u ON ast.hocsinh_id = u."ID"
      WHERE a.id = $1
      GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
    `, [assignmentId]);
    
    console.log('Found students from simplified query:', directUserQuery.rows.length);
    
    if (directUserQuery.rows.length > 0) {
      return res.json(directUserQuery.rows);
    }
    
    // Fall back to direct table query if view doesn't work
    const result = await pool.query(`
      SELECT
        a.id as assignment_id,
        a.description as assignment_name,
        ast.id as student_try_id,
        u."Full_Name" as student_name,
        COUNT(st."ID") as questions_done,
        a.noofquestion as total_questions,
        SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
        SUM(COALESCE(st.score, 0)) as total_score,
        MAX(COALESCE(st.currentindex, 0)) as current_question_index
      FROM assignment a
      LEFT JOIN assignment_student_try ast ON a.id = ast."assignmentID"
      LEFT JOIN "Student_try" st ON ast."ID" = st.assignment_student_try_id
      LEFT JOIN "Users" u ON ast.hocsinh_id = u."ID"
      WHERE a.id = $1
      GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
      ORDER BY SUM(COALESCE(st.score, 0)) DESC
    `, [assignmentId]);
    
    console.log('Found students from complex query:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Function to poll database for updates on active assignments
async function pollActiveAssignments() {
  try {
    // Get active assignments
    const assignments = await pool.query(`
      SELECT 
        id, 
        description, 
        "Assignmentname", 
        type,
        noofquestion,
        "update"
      FROM assignment 
      WHERE "update" > NOW() - INTERVAL '3 hours'
      ORDER BY "update" DESC
    `);
    
    // Emit event with active assignments
    io.emit('active-assignments-update', assignments.rows);
    
    // If there are active assignments, get student progress for the most recent one
    if (assignments.rows.length > 0) {
      const mostRecentAssignmentId = assignments.rows[0].id;
      
      let progressRows = [];
      
      // First try to use the view
      try {
        const viewResult = await pool.query(`
          SELECT * FROM v_assignment_student_try_info 
          WHERE "assignmentID" = $1
        `, [mostRecentAssignmentId]);
        
        console.log('Polling - Found students from view:', viewResult.rows.length);
        
        if (viewResult.rows.length > 0) {
          // Map the view data to match the expected format
          progressRows = viewResult.rows.map(row => ({
            assignment_id: row.assignmentID,
            assignment_name: row.assignment_name || row.description,
            student_try_id: row.id,
            student_name: row.student_name || row.Full_Name,
            questions_done: row.questions_done || 0,
            total_questions: row.noofquestion || 0,
            correct_answers: row.correct_answers || 0,
            total_score: row.total_score || 0,
            current_question_index: row.currentindex || 0
          }));
        }
      } catch (viewError) {
        console.log('Polling - Error using view, falling back to direct query:', viewError.message);
      }
      
      // If we couldn't get data from the view, try simplified query
      if (progressRows.length === 0) {
        try {
          const directUserQuery = await pool.query(`
            SELECT 
              a.id as assignment_id,
              a.description as assignment_name,
              ast.id as student_try_id,
              u."Full_Name" as student_name,
              0 as questions_done,
              a.noofquestion as total_questions,
              0 as correct_answers,
              0 as total_score,
              0 as current_question_index
            FROM assignment a
            LEFT JOIN assignment_student_try ast ON a.id = ast."assignmentID"
            LEFT JOIN "Users" u ON ast.hocsinh_id = u."ID"
            WHERE a.id = $1
            GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
          `, [mostRecentAssignmentId]);
          
          console.log('Polling - Found students from simplified query:', directUserQuery.rows.length);
          
          if (directUserQuery.rows.length > 0) {
            progressRows = directUserQuery.rows;
          }
        } catch (directUserError) {
          console.log('Polling - Error with simplified query:', directUserError.message);
        }
      }
      
      // If we still don't have data, use the full query
      if (progressRows.length === 0) {
        const progress = await pool.query(`
          SELECT 
            a.id as assignment_id,
            a.description as assignment_name,
            ast.id as student_try_id,
            u."Full_Name" as student_name,
            COUNT(st."ID") as questions_done,
            a.noofquestion as total_questions,
            SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
            SUM(COALESCE(st.score, 0)) as total_score,
            MAX(COALESCE(st.currentindex, 0)) as current_question_index
          FROM assignment a
          LEFT JOIN assignment_student_try ast ON a.id = ast."assignmentID"
          LEFT JOIN "Student_try" st ON ast."ID" = st.assignment_student_try_id
          LEFT JOIN "Users" u ON ast.hocsinh_id = u."ID"
          WHERE a.id = $1
          GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
          ORDER BY SUM(COALESCE(st.score, 0)) DESC
        `, [mostRecentAssignmentId]);
        
        console.log('Polling - Found students from complex query:', progress.rows.length);
        progressRows = progress.rows;
      }
      
      // Emit event with student progress for the most recent assignment
      io.emit('quiz-progress-update', {
        assignment_id: mostRecentAssignmentId,
        progress: progressRows
      });
    }
  } catch (error) {
    console.error('Database polling error:', error);
  }
}

// Poll the database every 5 seconds for updates
setInterval(pollActiveAssignments, 5000);

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Immediately try to send data to the new client
  pollActiveAssignments();
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.REPL_ID) {
    console.log(`Running on Replit - your dashboard is publicly accessible`);
  } else {
    console.log(`Access the dashboard at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  }
});