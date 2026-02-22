import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoCheckboxOutline, 
  IoAlertCircleOutline, 
  IoLocationOutline,
  IoTrendingUpOutline,
  IoDocumentTextOutline,
  IoStarOutline,
  IoListOutline
} from 'react-icons/io5';
import api from '../config/api';
import './Home.css';

const Home = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [importantTasks, setImportantTasks] = useState([]);
  const [importantCount, setImportantCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    loadDashboard();
    setGreetingMessage();
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const loadDashboard = async () => {
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const tasksRes = await api.get(`/tasks?date=${today}`);
      setTodayTasks(tasksRes.data);

      // All tasks - no date filter - get true important count across all dates
      const allTasksRes = await api.get('/tasks');
      const allImportant = allTasksRes.data.filter(t => t.isImportant && !t.completed);
      setImportantCount(allImportant.length);
      setImportantTasks(allImportant.slice(0, 5));

      const alertsRes = await api.get('/alerts');
      const unreadAlerts = alertsRes.data.filter(a => !a.isRead);
      setAlertCount(unreadAlerts.length);
      setAlerts(unreadAlerts.slice(0, 5));

      const placesRes = await api.get('/places');
      setPlaces(placesRes.data.slice(0, 3));

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const completedTasks = todayTasks.filter(t => t.completed).length;
  const completionRate = todayTasks.length > 0 
    ? Math.round((completedTasks / todayTasks.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <div className="home-header">
        <div>
          <h1 className="home-greeting">{greeting}</h1>
          <p className="home-date">{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}</p>
        </div>
      </div>

      <div className="stats-grid">
        <Link to="/tasks" className="stat-card">
          <IoCheckboxOutline className="stat-icon" style={{ color: 'var(--primary-1)' }} />
          <div className="stat-content">
            <div className="stat-value">{completedTasks}/{todayTasks.length}</div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </Link>

        <Link to="/important" className="stat-card">
          <IoStarOutline className="stat-icon" style={{ color: 'var(--primary-5)' }} />
          <div className="stat-content">
            <div className="stat-value">{importantCount}</div>
            <div className="stat-label">Important</div>
          </div>
        </Link>

        <Link to="/alerts" className="stat-card">
          <IoAlertCircleOutline className="stat-icon" style={{ color: 'var(--primary-3)' }} />
          <div className="stat-content">
            <div className="stat-value">{alertCount}</div>
            <div className="stat-label">Alerts</div>
          </div>
        </Link>

        <Link to="/places" className="stat-card">
          <IoLocationOutline className="stat-icon" style={{ color: 'var(--primary-2)' }} />
          <div className="stat-content">
            <div className="stat-value">{places.length}</div>
            <div className="stat-label">Places</div>
          </div>
        </Link>
      </div>

      {/* Today's Tasks - scrollable if many */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Today's Tasks</h2>
          <Link to="/tasks" className="section-link">View All</Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="card empty-card">
            <p>No tasks for today. Tap to add one.</p>
          </div>
        ) : (
          <div className="tasks-preview scrollable-section">
            {todayTasks.map(task => (
              <div key={task._id} className={`task-preview-item ${task.completed ? 'completed' : ''}`}>
                <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                  {task.completed && '✓'}
                </div>
                <div className="task-preview-content">
                  <div className="task-preview-title">{task.title}</div>
                  <div className="task-preview-meta">
                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className="category-badge">{task.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Important Tasks - scrollable */}
      {importantTasks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Important Tasks</h2>
            <Link to="/important" className="section-link">View All ({importantCount})</Link>
          </div>
          <div className="tasks-preview scrollable-section">
            {importantTasks.map(task => (
              <div key={task._id} className="task-preview-item important">
                <IoStarOutline className="important-icon" />
                <div className="task-preview-content">
                  <div className="task-preview-title">{task.title}</div>
                  <div className="task-preview-meta">
                    <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    {task.category && <span className="category-badge">{task.category}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts - scrollable */}
      {alerts.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Alerts</h2>
            <Link to="/alerts" className="section-link">View All ({alertCount})</Link>
          </div>
          <div className="alerts-preview scrollable-section">
            {alerts.map(alert => (
              <div key={alert._id} className="alert-preview-item">
                <IoAlertCircleOutline className="alert-icon" />
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-date">{new Date(alert.alertDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/tasks" className="quick-action-btn">
            <IoCheckboxOutline />
            <span>Add Task</span>
          </Link>
          <Link to="/places" className="quick-action-btn">
            <IoLocationOutline />
            <span>Add Place</span>
          </Link>
          <Link to="/checkin" className="quick-action-btn">
            <IoTrendingUpOutline />
            <span>Daily Check-in</span>
          </Link>
          <Link to="/documents" className="quick-action-btn">
            <IoDocumentTextOutline />
            <span>Add Document</span>
          </Link>
          <Link to="/Checklist" className="quick-action-btn">
            <IoListOutline />
            <span>Checklists</span>
          </Link>
        </div>
      </div>

      {/* Progress Ring */}
      {todayTasks.length > 0 && (
        <div className="section">
          <div className="progress-card">
            <div className="progress-ring">
              <svg width="120" height="120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--gray-800)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={`${completionRate * 3.39} 339`} transform="rotate(-90 60 60)" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-1)" />
                    <stop offset="100%" stopColor="var(--primary-2)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="progress-text">
                <div className="progress-percentage">{completionRate}%</div>
                <div className="progress-label">Complete</div>
              </div>
            </div>
            <div className="progress-details">
              <p className="progress-title">Today's Progress</p>
              <p className="progress-subtitle">You've completed {completedTasks} out of {todayTasks.length} tasks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;