# Quiz Dashboard

A real-time dashboard to monitor student progress during live quizzes.

## Features

- Real-time student progress tracking
- Leaderboard with rankings 
- Quiz statistics (completion rate, average score)
- List of recent assignments
- Responsive design for mobile and desktop

## Deployment Instructions

### Option 1: Deploy on Replit (Recommended)

1. Go to [Replit](https://replit.com) and create an account if you don't have one
2. Click "Create Repl" 
3. Select "Import from GitHub"
4. Enter the repository URL
5. Click "Import from GitHub"
6. After it's imported, click the "Run" button
7. Your dashboard will be available at the URL shown in the Replit webview

### Option 2: Local Deployment

1. Clone this repository
2. Run `npm install`
3. Run `npm start`
4. Access the dashboard at http://localhost:3000

## Configuration

The dashboard connects to your PostgreSQL database with these settings:

```
host: '193.42.244.152'
port: 2345
database: 'postgres'
user: 'postgres'
password: 'psql@2025'
```

If you need to change these settings, edit the database connection in `server.js`.

## How It Works

1. The server polls the database every 5 seconds for active assignments
2. When students join a live quiz, their progress appears in real-time
3. Data is transmitted via WebSockets for instant updates
4. Students are ranked by their total score

This dashboard is best used during live quiz sessions to monitor student progress in real-time.# liveclass-Fina
# liveclass-Fina
# liveclass-Fina
# liveclass-Fina
# liveclass-Fina
# liveclass-Fina
