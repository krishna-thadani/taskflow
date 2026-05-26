import React from 'react';

export default function Filters({ statusFilter, setStatusFilter, minImportance, setMinImportance }) {
  return (
    <div className="filters-panel glass-panel">
      {/* Status Toggle */}
      <div className="filter-group">
        <span className="filter-label">Filter by Status</span>
        <div className="status-toggle-container">
          <button
            type="button"
            className={`status-toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`status-toggle-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`status-toggle-btn ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Importance Range Slider */}
      <div className="filter-group" style={{ minWidth: '240px', flexGrow: 1, justifyContent: 'flex-end' }}>
        <label className="filter-label" htmlFor="importance-range" style={{ whiteSpace: 'nowrap' }}>
          Min Importance: <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{minImportance}</span>
        </label>
        <input
          id="importance-range"
          type="range"
          min="1"
          max="5"
          step="1"
          value={minImportance}
          onChange={(e) => setMinImportance(parseInt(e.target.value, 10))}
          style={{
            flexGrow: 1,
            maxWidth: '150px',
            accentColor: 'var(--color-primary)',
            cursor: 'pointer'
          }}
        />
        <button
          type="button"
          onClick={() => setMinImportance(1)}
          disabled={minImportance === 1}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: 'var(--color-text-secondary)',
            padding: '2px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
