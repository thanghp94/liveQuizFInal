// Connect to Socket.io server
const socket = io();

// DOM elements
const assignmentTitle = document.getElementById('assignment-title');
const assignmentDetails = document.getElementById('assignment-details');
const totalStudents = document.getElementById('total-students');
const averageScore = document.getElementById('average-score');
const completionRate = document.getElementById('completion-rate');
const progressTableBody = document.getElementById('progress-table-body');
const assignmentsTableBody = document.getElementById('assignments-table-body');

// Store current assignment ID
let currentAssignmentId = null;

// Listen for active assignments updates
socket.on('active-assignments-update', (assignments) => {
  // Update assignments table
  updateAssignmentsTable(assignments);
  
  // If there are assignments, update the most recent one
  if (assignments.length > 0) {
    const mostRecent = assignments[0];
    
    // Update assignment info
    assignmentTitle.textContent = mostRecent.Assignmentname || mostRecent.description;
    assignmentDetails.textContent = `${mostRecent.type} · ${mostRecent.noofquestion} Questions · Updated: ${formatDateTime(mostRecent.update)}`;
    
    // Store current assignment ID
    currentAssignmentId = mostRecent.id;
  } else {
    // No active assignments
    assignmentTitle.textContent = 'Waiting for active quiz...';
    assignmentDetails.textContent = '';
    totalStudents.textContent = '0';
    averageScore.textContent = '0';
    completionRate.textContent = '0%';
    progressTableBody.innerHTML = '';
    currentAssignmentId = null;
  }
});

// Listen for quiz progress updates
socket.on('quiz-progress-update', (data) => {
  if (data.assignment_id === currentAssignmentId) {
    updateProgressTable(data.progress);
    updateStatistics(data.progress);
  }
});

// Format date and time
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return 'N/A';
  
  const date = new Date(dateTimeStr);
  return date.toLocaleString();
}

// Update the assignments table
function updateAssignmentsTable(assignments) {
  assignmentsTableBody.innerHTML = '';
  
  if (assignments.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">No recent assignments available</td>';
    assignmentsTableBody.appendChild(row);
    return;
  }
  
  assignments.forEach(assignment => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${assignment.Assignmentname || 'Unnamed'}</td>
      <td>${assignment.description || 'No description'}</td>
      <td>${assignment.type || 'N/A'}</td>
      <td>${assignment.noofquestion || '0'}</td>
      <td>${formatDateTime(assignment.update)}</td>
      <td>
        <button class="btn btn-sm btn-view" 
                data-assignment-id="${assignment.id}">
          View Progress
        </button>
      </td>
    `;
    
    // Highlight if it's the current assignment
    if (assignment.id === currentAssignmentId) {
      row.classList.add('table-primary');
    }
    
    assignmentsTableBody.appendChild(row);
  });
  
  // Add event listeners to view buttons
  document.querySelectorAll('.btn-view').forEach(button => {
    button.addEventListener('click', () => {
      const assignmentId = button.getAttribute('data-assignment-id');
      loadAssignmentProgress(assignmentId);
    });
  });
}

// Load progress for a specific assignment
function loadAssignmentProgress(assignmentId) {
  fetch(`/api/assignment/${assignmentId}/progress`)
    .then(response => response.json())
    .then(data => {
      currentAssignmentId = assignmentId;
      
      // Find the assignment in the assignments table
      const assignmentRow = document.querySelector(`[data-assignment-id="${assignmentId}"]`).closest('tr');
      const assignmentName = assignmentRow.cells[0].textContent;
      const assignmentDesc = assignmentRow.cells[1].textContent;
      const assignmentType = assignmentRow.cells[2].textContent;
      const assignmentQuestions = assignmentRow.cells[3].textContent;
      
      // Update assignment info
      assignmentTitle.textContent = assignmentName;
      assignmentDetails.textContent = `${assignmentType} · ${assignmentQuestions} Questions`;
      
      // Update progress and statistics
      updateProgressTable(data);
      updateStatistics(data);
      
      // Highlight the selected assignment
      document.querySelectorAll('#assignments-table-body tr').forEach(row => {
        row.classList.remove('table-primary');
      });
      assignmentRow.classList.add('table-primary');
    })
    .catch(error => {
      console.error('Error loading assignment progress:', error);
    });
}

// Update the progress table
function updateProgressTable(progressData) {
  progressTableBody.innerHTML = '';
  
  if (progressData.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="text-center">No student progress data available</td>';
    progressTableBody.appendChild(row);
    return;
  }
  
  // Sort by score (highest first)
  progressData.sort((a, b) => b.total_score - a.total_score);
  
  progressData.forEach((student, index) => {
    const row = document.createElement('tr');
    
    // Calculate progress percentage
    const progressPercent = student.total_questions > 0 
      ? Math.round((student.questions_done / student.total_questions) * 100) 
      : 0;
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${student.student_name || 'Unknown'}</td>
      <td>${student.questions_done || 0} / ${student.total_questions || 0}</td>
      <td>${student.correct_answers || 0}</td>
      <td>${student.total_score || 0}</td>
      <td>
        <div class="progress">
          <div class="progress-bar bg-success" 
               role="progressbar" 
               style="width: ${progressPercent}%" 
               aria-valuenow="${progressPercent}" 
               aria-valuemin="0" 
               aria-valuemax="100">
            ${progressPercent}%
          </div>
        </div>
      </td>
    `;
    
    // Add data attributes for easier updating
    row.setAttribute('data-student-id', student.student_try_id);
    
    progressTableBody.appendChild(row);
  });
}

// Update statistics
function updateStatistics(progressData) {
  // Total students
  totalStudents.textContent = progressData.length;
  
  if (progressData.length === 0) {
    averageScore.textContent = '0';
    completionRate.textContent = '0%';
    return;
  }
  
  // Average score
  const totalScore = progressData.reduce((sum, student) => sum + parseInt(student.total_score || 0), 0);
  const avgScore = Math.round(totalScore / progressData.length);
  averageScore.textContent = avgScore;
  
  // Completion rate
  let totalQuestions = 0;
  let totalQuestionsAnswered = 0;
  
  progressData.forEach(student => {
    totalQuestions += parseInt(student.total_questions || 0) * 1; // Multiply by 1 for each student
    totalQuestionsAnswered += parseInt(student.questions_done || 0);
  });
  
  const completionPercentage = totalQuestions > 0 
    ? Math.round((totalQuestionsAnswered / totalQuestions) * 100) 
    : 0;
  
  completionRate.textContent = `${completionPercentage}%`;
}