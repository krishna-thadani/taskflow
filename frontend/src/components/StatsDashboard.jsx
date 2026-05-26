import React from 'react';

export default function StatsDashboard({ stats }) {
  if (!stats) return null;

  const {
    totalTasks = 0,
    pendingTasks = 0,
    completedTasks = 0,
    overdueTasks = 0,
    averageImportance = 0,
    tasksByImportance = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
  } = stats;

  // Find max count for normalized distribution bar widths
  const maxImportanceCount = Math.max(...Object.values(tasksByImportance), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="stats-container">
        {/* Total Tasks */}
        <div className="stat-card glass-panel">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-val">{totalTasks}</div>
          <div className="stat-details">All items in database</div>
        </div>

        {/* Pending Tasks */}
        <div className="stat-card stat-pending glass-panel">
          <div className="stat-label">Pending</div>
          <div className="stat-val">{pendingTasks}</div>
          <div className="stat-details">Tasks to be done</div>
        </div>

        {/* Completed Tasks */}
        <div className="stat-card stat-completed glass-panel">
          <div className="stat-label">Completed</div>
          <div className="stat-val">{completedTasks}</div>
          <div className="stat-details">
            {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% completion rate` : '0% completion rate'}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="stat-card stat-overdue glass-panel">
          <div className="stat-label">Overdue</div>
          <div className="stat-val" style={{ color: overdueTasks > 0 ? '#EF4444' : '#FFFFFF' }}>
            {overdueTasks}
          </div>
          <div className="stat-details">Pending & past due date</div>
        </div>

        {/* Average Importance */}
        <div className="stat-card stat-avg glass-panel">
          <div className="stat-label">Avg Importance</div>
          <div className="stat-val">{averageImportance.toFixed(2)}</div>
          <div className="stat-details">Scale of 1 (low) - 5 (crit)</div>
        </div>
      </div>

      {/* Importance Distribution Subcard */}
      <div className="stats-subcard glass-panel">
        <h4 style={{ fontSize: '15px', color: '#FFFFFF', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tasks by Importance Level
        </h4>
        <div className="importance-distribution">
          {['5', '4', '3', '2', '1'].map((level) => {
            const count = tasksByImportance[level] || 0;
            const percentage = (count / maxImportanceCount) * 100;
            const labelMap = {
              '5': '5 - Critical',
              '4': '4 - High',
              '3': '3 - Medium',
              '2': '2 - Low',
              '1': '1 - Trivial'
            };

            return (
              <div key={level} className="distribution-row">
                <div className="distribution-label">{labelMap[level]}</div>
                <div className="distribution-bar-bg">
                  <div 
                    className="distribution-bar-fill" 
                    style={{ 
                      width: `${percentage}%`,
                      background: level === '5' ? 'var(--color-danger)' : 
                                  level === '4' ? 'var(--color-warning)' : 
                                  'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
                    }}
                  />
                </div>
                <div className="distribution-val">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
