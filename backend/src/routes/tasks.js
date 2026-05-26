import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';

const router = express.Router();

// Helper to compute priority score
export function computePriorityScore(task) {
  if (task.status === 'completed') {
    return 0;
  }
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffMs = dueDate.getTime() - now.getTime();
  // Difference in full days rounded down.
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.max(diffDays, 1);
  const score = (task.importance * 10) + (100 / daysUntilDue);
  return Math.round(score * 100) / 100;
}

// Helper to format a task document to JSON including priorityScore
function formatTask(taskDoc) {
  const taskObj = taskDoc.toObject();
  taskObj.priorityScore = computePriorityScore(taskObj);
  return taskObj;
}

// GET /bfhl/tasks/stats (Analytics aggregation endpoint)
// Must be registered before GET /bfhl/tasks/:id to avoid conflict
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const stats = await Task.aggregate([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                pendingTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                averageImportance: { $avg: '$importance' },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'pending'] },
                          { $lt: ['$dueDate', now] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          importanceCounts: [
            {
              $group: {
                _id: '$importance',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];
    const summary = result.summary[0] || {
      totalTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      averageImportance: 0,
      overdueTasks: 0
    };

    const tasksByImportance = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    if (result.importanceCounts) {
      result.importanceCounts.forEach(item => {
        if (item._id >= 1 && item._id <= 5) {
          tasksByImportance[String(item._id)] = item.count;
        }
      });
    }

    res.status(200).json({
      totalTasks: summary.totalTasks,
      pendingTasks: summary.pendingTasks,
      completedTasks: summary.completedTasks,
      averageImportance: summary.averageImportance ? Math.round(summary.averageImportance * 100) / 100 : 0,
      overdueTasks: summary.overdueTasks,
      tasksByImportance
    });
  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({ error: 'Unexpected server error while computing stats.' });
  }
});

// GET /bfhl/tasks (List all tasks sorted by priorityScore descending)
router.get('/', async (req, res) => {
  try {
    const { status, minImportance } = req.query;
    const filter = {};

    if (status) {
      if (status !== 'pending' && status !== 'completed') {
        return res.status(400).json({ error: 'Status query filter must be either "pending" or "completed".' });
      }
      filter.status = status;
    }

    if (minImportance) {
      const importanceVal = parseInt(minImportance, 10);
      if (isNaN(importanceVal) || importanceVal < 1 || importanceVal > 5) {
        return res.status(400).json({ error: 'minImportance must be an integer between 1 and 5.' });
      }
      filter.importance = { $gte: importanceVal };
    }

    const tasks = await Task.find(filter);
    const tasksWithScore = tasks.map(formatTask);

    // Sort by priorityScore descending
    tasksWithScore.sort((a, b) => b.priorityScore - a.priorityScore);

    res.status(200).json(tasksWithScore);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Unexpected server error while fetching tasks.' });
  }
});

// POST /bfhl/tasks (Create a new task)
router.post('/', async (req, res) => {
  try {
    const { title, description, importance, dueDate, status } = req.body;

    // Validation
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required and must be a string.' });
    }
    if (title.length < 3 || title.length > 100) {
      return res.status(400).json({ error: 'Title must be between 3 and 100 characters.' });
    }

    if (description !== undefined && description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string.' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description cannot exceed 500 characters.' });
    }

    if (importance === undefined || importance === null) {
      return res.status(400).json({ error: 'Importance is required.' });
    }
    const impNum = Number(importance);
    if (!Number.isInteger(impNum) || impNum < 1 || impNum > 5) {
      return res.status(400).json({ error: 'Importance must be an integer between 1 and 5.' });
    }

    if (!dueDate) {
      return res.status(400).json({ error: 'Due date is required.' });
    }
    const dueTime = new Date(dueDate);
    if (isNaN(dueTime.getTime())) {
      return res.status(400).json({ error: 'Due date is invalid.' });
    }
    if (dueTime <= new Date()) {
      return res.status(400).json({ error: 'Due date must be a future date on creation.' });
    }

    if (status && status !== 'pending' && status !== 'completed') {
      return res.status(400).json({ error: 'Status must be either "pending" or "completed".' });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      importance: impNum,
      dueDate: dueTime,
      status: status || 'pending'
    });

    const savedTask = await newTask.save();
    res.status(201).json(formatTask(savedTask));
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Unexpected server error while creating task.' });
  }
});

// PATCH /bfhl/tasks/:id (Update task fields)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Task ID is malformed or invalid.' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, importance, dueDate, status } = req.body;

    // Validate updates if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
        return res.status(400).json({ error: 'Title must be a string between 3 and 100 characters.' });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string.' });
      }
      if (description && description.length > 500) {
        return res.status(400).json({ error: 'Description cannot exceed 500 characters.' });
      }
      task.description = description ? description.trim() : '';
    }

    if (importance !== undefined) {
      const impNum = Number(importance);
      if (!Number.isInteger(impNum) || impNum < 1 || impNum > 5) {
        return res.status(400).json({ error: 'Importance must be an integer between 1 and 5.' });
      }
      task.importance = impNum;
    }

    if (dueDate !== undefined) {
      const dueTime = new Date(dueDate);
      if (isNaN(dueTime.getTime())) {
        return res.status(400).json({ error: 'Due date is invalid.' });
      }
      // Note: Typically updates might not require the date to be in the future
      // if it was already in the past, but we validate if it is set to a past date
      if (dueTime <= new Date()) {
        return res.status(400).json({ error: 'Updated due date must be a future date.' });
      }
      task.dueDate = dueTime;
    }

    if (status !== undefined) {
      if (status !== 'pending' && status !== 'completed') {
        return res.status(400).json({ error: 'Status must be either "pending" or "completed".' });
      }
      task.status = status;
    }

    const updatedTask = await task.save();
    res.status(200).json(formatTask(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Unexpected server error while updating task.' });
  }
});

// DELETE /bfhl/tasks/:id (Delete task by ID)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Task ID is malformed or invalid.' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await Task.deleteOne({ _id: id });
    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Unexpected server error while deleting task.' });
  }
});

export default router;
