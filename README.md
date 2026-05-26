# TaskFlow — Smart Task Manager with Priority Scoring

TaskFlow is a high-performance, visually stunning task management application built using the MERN stack (MongoDB, Express, React, Node.js). It computes task priority scores dynamically on the server based on deadlines and importance levels, and provides real-time statistics via MongoDB aggregation pipeline queries.

---

## Key Features

1. **Smart Priority Engine**: Dynamic server-calculated task priority scoring rounded to 2 decimals. Completed tasks automatically score `0`.
2. **MongoDB Aggregation Dashboard**: Real-time analytics dashboard powered by Mongoose aggregation pipeline facets, calculating task counts, averages, and overdue tasks.
3. **Glassmorphic Dark Mode UI**: A premium, responsive single-page interface using backdrop filters, scale transitions, slide-up animations, and distinct crimson pulsing glow highlights for high priority tasks (score >= 50).
4. **Task Filters**: Combined status filtering (All / Pending / Completed) and minimum importance sliders that re-query the API.
5. **Zero-Setup Database Fallback**: If no MongoDB connection string is specified, the backend automatically spins up and connects to a temporary `mongodb-memory-server` in-memory instance, allowing immediate execution without local database setup.
6. **Automated Test Suite**: Programmatic test script that validates validations, scoring math, queries, modifications, and deletions.

---

## Priority Score Formula

For each pending task:
$$\text{priorityScore} = (\text{importance} \times 10) + \frac{100}{\max(\text{daysUntilDue}, 1)}$$

Where:
- `importance` is an integer from 1 (low) to 5 (critical).
- `daysUntilDue` is the number of full days remaining between now and the `dueDate` (rounded down, minimum 1 to avoid division by zero).
- Completed tasks always score `0`.

---

## Directory Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── models/Task.js        # Mongoose Schema
│   │   ├── routes/tasks.js       # Express Router (includes Aggregation Pipeline)
│   │   ├── db.js                 # Automatic MongoDB Connection Handler
│   │   └── server.js             # Express App Configuration and CORS Setup
│   ├── .env                      # Environment Configuration Template
│   ├── package.json              # Backend Package Config
│   └── test-api.js               # Automated Backend Test Suite
├── frontend/
│   ├── src/
│   │   ├── assets/               # Logos and static items
│   │   ├── components/
│   │   │   ├── Filters.jsx       # Toolbar for filters
│   │   │   ├── StatsDashboard.jsx# Metrics and Distribution Panel
│   │   │   ├── TaskCard.jsx      # Card & Delete Confirm Modal
│   │   │   └── TaskForm.jsx      # Form & Input Validations
│   │   ├── App.jsx               # Core State Controller
│   │   ├── App.css               # Empty CSS Override
│   │   ├── index.css             # Glassmorphic Custom Design System
│   │   └── main.jsx              # App Entrypoint
│   ├── package.json              # Frontend Package Config
│   ├── index.html                # SEO Optimizations
│   └── vite.config.js            # Vite Compiler Configurations
└── README.md                     # Documentation
```

---

## Setup & Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended, tested on v22)
- npm (v10+)

### 1. Running the Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm start
   ```
   *Note: If no `MONGODB_URI` environment variable is defined in the `backend/.env` file, the server will automatically download, start, and connect to a local in-memory MongoDB database instance.*

### 2. Running the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React app in development mode:
   ```bash
   npm run dev
   ```
4. Open the displayed local address in your browser (typically `http://localhost:5173`).

---

## Running the Backend Test Suite

To run the automated tests against a clean backend server instance:
1. Ensure you are in the `backend/` folder.
2. Run the test script:
   ```bash
   npm run test
   ```
This will automatically spawn the Express server on a test port (5001), verify all validations and scoring calculations, test the MongoDB aggregation metrics pipeline, and tear down the server processes when completed.
