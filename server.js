const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
    const result = await pool.query(`
      SELECT 
        a.id as assignment_id,
        a.description as assignment_name,
        ast.id as student_try_id,
        u."Full_Name" as student_name,
        COUNT(st."ID") as questions_done,
        a.noofquestion as total_questions,
        SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
        SUM(st.score) as total_score,
        MAX(st.currentindex) as current_question_index
      FROM assignment a
      JOIN assignment_student_try ast ON a.id = ast."assignmentID"
      JOIN "Student_try" st ON ast."ID" = st.assignment_student_try_id
      JOIN "Users" u ON ast.hocsinh_id = u."ID"
      WHERE a.id = $1
      GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
      ORDER BY SUM(st.score) DESC
    `, [assignmentId]);
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
      
      const progress = await pool.query(`
        SELECT 
          a.id as assignment_id,
          a.description as assignment_name,
          ast.id as student_try_id,
          u."Full_Name" as student_name,
          COUNT(st."ID") as questions_done,
          a.noofquestion as total_questions,
          SUM(CASE WHEN st."Quiz_result" = '✅' THEN 1 ELSE 0 END) as correct_answers,
          SUM(st.score) as total_score,
          MAX(st.currentindex) as current_question_index
        FROM assignment a
        JOIN assignment_student_try ast ON a.id = ast."assignmentID"
        JOIN "Student_try" st ON ast."ID" = st.assignment_student_try_id
        JOIN "Users" u ON ast.hocsinh_id = u."ID"
        WHERE a.id = $1
        GROUP BY a.id, a.description, ast.id, u."Full_Name", a.noofquestion
        ORDER BY SUM(st.score) DESC
      `, [mostRecentAssignmentId]);
      
      // Emit event with student progress for the most recent assignment
      io.emit('quiz-progress-update', {
        assignment_id: mostRecentAssignmentId,
        progress: progress.rows
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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.REPL_ID) {
    console.log(`Running on Replit - your dashboard is publicly accessible`);
  } else {
    console.log(`Access the dashboard at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  }
});