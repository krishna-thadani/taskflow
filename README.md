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

## Setup & Running

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended, tested on v22)
- npm (v10+)

### Unified Running Mode (Single Link / Production)
In this mode, the Express backend serves the React frontend assets directly. This aligns both the frontend and backend under a single port (`5000`), resolving all CORS issues.

1. Navigate to the `frontend/` folder and build the React production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Navigate to the `backend/` folder and start the unified server:
   ```bash
   cd ../backend
   npm start
   ```
3. Open your browser and navigate to **`http://localhost:5000/`** to see both the UI and the API.

---

### Separate Development Mode (For Code Changes)
If you want to edit code with hot reloading (HMR) enabled:

1. **Start the Backend API**:
   ```bash
   cd backend
   npm start
   ```
   *(Starts Express on `http://localhost:5000`)*

2. **Start the Frontend Dev Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Starts Vite on `http://localhost:5173` with HMR)*

3. Open your browser and navigate to **`http://localhost:5173/`**.

---

## Running the Backend Test Suite

To run the automated tests against a clean backend server instance:
1. Ensure you are in the `backend/` folder.
2. Run the test script:
   ```bash
   npm run test
   ```
This will automatically spawn the Express server on a test port (5001), verify all validations and scoring calculations, test the MongoDB aggregation metrics pipeline, and tear down the server processes when completed.
