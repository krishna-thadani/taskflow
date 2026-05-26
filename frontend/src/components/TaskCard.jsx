import React, { useState } from 'react';

// Helper for human-readable due date
function getHumanReadableDueDate(dateStr, isCompleted) {
  if (isCompleted) {
    return 'Completed';
  }

  const now = new Date();
  const dueDate = new Date(dateStr);
  
  // Calculate difference in time
  const diffMs = dueDate.getTime() - now.getTime();
  // Difference in full days rounded down
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    return absDays === 0 ? 'overdue today' : `${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`;
  } else if (diffDays === 0) {
    return 'due today';
  } else if (diffDays === 1) {
    return 'due tomorrow';
  } else {
    return `in ${diffDays} days`;
  }
}

export default function TaskCard({ task, onComplete, onDelete }) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const { _id, title, description, importance, dueDate, status, priorityScore = 0 } = task;

  const isCompleted = status === 'completed';
  const isHighPriority = priorityScore >= 50;
  
  // Check if task is past due date (and not completed)
  const isOverdue = !isCompleted && new Date(dueDate) < new Date();
  const humanReadableDate = getHumanReadableDueDate(dueDate, isCompleted);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(_id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(_id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <>
      <div className={`task-card glass-panel ${isCompleted ? 'task-completed' : ''} ${isHighPriority ? 'task-high-priority' : ''}`}>
        
        {/* Title and Priority Score */}
        <div className="task-card-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h4 className="task-title">{title}</h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span className={`status-badge ${isCompleted ? 'status-completed' : 'status-pending'}`}>
                {status}
              </span>
              {isHighPriority && (
                <span className="priority-high-badge">
                  High Priority
                </span>
              )}
            </div>
          </div>
          <div className="score-badge" title="Priority Score">
            Score: {priorityScore.toFixed(2)}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="task-description">{description}</p>
        )}

        {/* Metadata */}
        <div className="task-metadata">
          {/* Importance stars */}
          <div className="meta-item">
            <span className="filter-label" style={{ fontSize: '11px', marginRight: '4px' }}>Importance:</span>
            <div className="importance-stars">
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} className="star">
                  {idx < importance ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className={`meta-item ${isOverdue ? 'date-overdue' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/>
            </svg>
            <span>
              {isCompleted ? 'Completed' : `${new Date(dueDate).toLocaleDateString()} (${humanReadableDate})`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="task-actions">
          {!isCompleted && (
            <button 
              className="btn-action btn-action-complete" 
              onClick={handleComplete}
              disabled={isCompleting || isDeleting}
            >
              {isCompleting ? 'Completing...' : 'Mark as Complete'}
            </button>
          )}
          <button 
            className="btn-action btn-action-delete" 
            onClick={() => setShowConfirmDelete(true)}
            disabled={isCompleting || isDeleting}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ background: '#111827' }}>
            <h3 className="modal-header">Confirm Deletion</h3>
            <p className="modal-body">
              Are you sure you want to delete the task <strong>"{title}"</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                className="btn-action" 
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-action btn-action-delete" 
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ background: 'var(--color-danger)', color: '#FFFFFF', borderColor: 'var(--color-danger)' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
