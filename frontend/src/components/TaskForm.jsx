import React, { useState } from 'react';

export default function TaskForm({ onSubmitTask, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(3); // default 3 (Medium)
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      setError('Title must be between 3 and 100 characters.');
      return;
    }

    if (description && description.length > 500) {
      setError('Description cannot exceed 500 characters.');
      return;
    }

    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    const selectedDate = new Date(dueDate);
    if (isNaN(selectedDate.getTime())) {
      setError('Please select a valid due date.');
      return;
    }

    if (selectedDate <= new Date()) {
      setError('Due date must be in the future.');
      return;
    }

    onSubmitTask({
      title: title.trim(),
      description: description.trim(),
      importance,
      dueDate: selectedDate.toISOString()
    }, () => {
      // Success callback to clear form
      setTitle('');
      setDescription('');
      setImportance(3);
      setDueDate('');
      setError('');
    }, (errMessage) => {
      // Error callback
      setError(errMessage || 'Failed to create task.');
    });
  };

  return (
    <div className="task-form-panel glass-panel">
      <h3 className="form-title">
        <svg style={{ width: '20px', height: '20px', fill: 'var(--color-primary)' }} viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        Create New Task
      </h3>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="inline-error" style={{ fontSize: '13px', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="task-title">Task Title *</label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="e.g., Submit project report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-desc">Description</label>
          <textarea
            id="task-desc"
            className="form-input"
            placeholder="e.g., Final draft for board review"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            style={{ resize: 'none' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Importance Level *</label>
          <div className="importance-selector">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                className={`importance-btn ${importance === level ? 'active' : ''}`}
                onClick={() => setImportance(level)}
                disabled={isSubmitting}
                title={`Level ${level}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-duedate">Due Date *</label>
          <input
            id="task-duedate"
            type="datetime-local"
            className="form-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              Creating...
            </>
          ) : (
            'Add Task'
          )}
        </button>
      </form>
    </div>
  );
}
