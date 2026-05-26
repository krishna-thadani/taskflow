import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import taskRouter from './routes/tasks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests to ensure frontend can access it
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Base path validation & mapping
app.use('/bfhl/tasks', taskRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred on the server.' });
});

// Connect to DB and start Express server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  TaskFlow Server running on port ${PORT}         `);
      console.log(`  API Base Path: http://localhost:${PORT}/bfhl/tasks`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
