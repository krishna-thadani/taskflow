import React, { useState, useEffect } from 'react';
import StatsDashboard from './components/StatsDashboard';
import Filters from './components/Filters';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/bfhl/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [minImportance, setMinImportance] = useState(1);

  // Fetch stats and tasks from API
  const fetchData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      // Build query string
      const params = [];
      if (statusFilter !== 'all') {
        params.push(`status=${statusFilter}`);
      }
      if (minImportance > 1) {
        params.push(`minImportance=${minImportance}`);
      }
      const queryString = params.length > 0 ? `?${params.join('&')}` : '';

      // Run parallel fetches for performance
      const [tasksRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}${queryString}`),
        fetch(`${API_BASE_URL}/stats`)
      ]);

      if (!tasksRes.ok) {
        const errJson = await tasksRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch tasks (HTTP ${tasksRes.status})`);
      }
      if (!statsRes.ok) {
        const errJson = await statsRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to fetch stats (HTTP ${statsRes.status})`);
      }

      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Connection error: Unable to reach the backend server.');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch on mount or when filters change
  useEffect(() => {
    fetchData(true);
  }, [statusFilter, minImportance]);

  // Handle task creation
  const handleCreateTask = async (taskData, clearFormCallback, errorCallback) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create task.');
      }

      // Success: Clear the form inputs
      clearFormCallback();
      
      // Re-fetch list and stats without blocking the UI with full-screen loading
      await fetchData(false);
    } catch (err) {
      console.error('Error creating task:', err);
      errorCallback(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task completion
  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update task.');
      }

      // Re-fetch to update sorting and stats
      await fetchData(false);
    } catch (err) {
      console.error('Error completing task:', err);
      setError(err.message || 'Failed to mark task as completed.');
      throw err;
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${taskId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to delete task.');
      }

      // Re-fetch to update list and stats
      await fetchData(false);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task.');
      throw err;
    }
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h1 className="logo-text">
              TaskFlow
              <span className="logo-badge">Smart Engine</span>
            </h1>
          </div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
          Server: <span style={{ color: error ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '700' }}>
            {error ? 'Disconnected' : 'Online'}
          </span>
        </div>
      </header>

      {/* Global Error Banner */}
      {error && !loading && (
        <div className="inline-error">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          <span>{error}</span>
          <button 
            onClick={() => fetchData(true)} 
            style={{ 
              marginLeft: 'auto', 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: '#FFF', 
              padding: '4px 12px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Dashboard at the Top */}
      {stats && <StatsDashboard stats={stats} />}

      {/* Main Content Layout */}
      <div className="main-layout">
        
        {/* Left Side: Filters and Tasks List */}
        <div>
          <Filters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            minImportance={minImportance}
            setMinImportance={setMinImportance}
          />

          <div className="tasks-list-header">
            <h3>Task Catalog</h3>
            <span className="tasks-count-badge">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} found
            </span>
          </div>

          {loading ? (
            <div className="loading-overlay glass-panel">
              <div className="spinner"></div>
              <p>Fetching tasks and recalculating priority scores...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state glass-panel">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
                </svg>
              </div>
              <h4 className="empty-state-title">No Tasks Found</h4>
              <p className="empty-state-desc">
                {statusFilter !== 'all' || minImportance > 1
                  ? 'No tasks match your current filter settings. Try resetting filters.'
                  : 'Start by creating your first task using the creation panel.'}
              </p>
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Sticky Form Panel */}
        <div>
          <TaskForm 
            onSubmitTask={handleCreateTask} 
            isSubmitting={isSubmitting} 
          />
        </div>

      </div>
    </div>
  );
}
