import React, { useState, useEffect } from 'react';
import { IoStarOutline, IoStar, IoTrashOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import api from '../config/api';
import toast from 'react-hot-toast';
import './Important.css';

const Important = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      const importantTasks = response.data.filter(t => t.isImportant);
      setTasks(importantTasks);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load tasks');
      setLoading(false);
    }
  };

  const toggleComplete = async (taskId, currentStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { completed: !currentStatus });
      loadTasks();
      toast.success(currentStatus ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const toggleImportant = async (taskId, currentStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { isImportant: !currentStatus });
      loadTasks();
      toast.success(currentStatus ? 'Removed from important' : 'Marked as important');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted');
        loadTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page important-page">
      <div className="page-header">
        <h1 className="page-title">Important Tasks</h1>
        <p className="page-subtitle">{incompleteTasks.length} tasks remaining</p>
      </div>

      {incompleteTasks.length > 0 && (
        <div className="section">
          <h2 className="section-title">Active</h2>
          <div className="tasks-list">
            {incompleteTasks.map((task) => (
              <div key={task._id} className="important-task-card">
                <div className="task-card-left">
                  <button
                    className="checkbox-btn"
                    onClick={() => toggleComplete(task._id, task.completed)}
                  >
                    <div className={`checkbox ${task.completed ? 'checked' : ''}`}>
                      {task.completed && <IoCheckmarkCircleOutline />}
                    </div>
                  </button>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    <div className="task-meta">
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span className="category-badge">{task.category}</span>
                      {task.date && (
                        <span className="date-badge">
                          {new Date(task.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="action-icon-btn star-btn active"
                    onClick={() => toggleImportant(task._id, task.isImportant)}
                  >
                    <IoStar />
                  </button>
                  <button
                    className="action-icon-btn delete-btn"
                    onClick={() => handleDelete(task._id)}
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="section">
          <h2 className="section-title">Completed</h2>
          <div className="tasks-list">
            {completedTasks.map((task) => (
              <div key={task._id} className="important-task-card completed">
                <div className="task-card-left">
                  <button
                    className="checkbox-btn"
                    onClick={() => toggleComplete(task._id, task.completed)}
                  >
                    <div className={`checkbox ${task.completed ? 'checked' : ''}`}>
                      {task.completed && <IoCheckmarkCircleOutline />}
                    </div>
                  </button>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    <div className="task-meta">
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span className="category-badge">{task.category}</span>
                    </div>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    className="action-icon-btn star-btn active"
                    onClick={() => toggleImportant(task._id, task.isImportant)}
                  >
                    <IoStar />
                  </button>
                  <button
                    className="action-icon-btn delete-btn"
                    onClick={() => handleDelete(task._id)}
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="empty-state">
          <IoStarOutline className="empty-state-icon" />
          <h3 className="empty-state-title">No important tasks</h3>
          <p className="empty-state-text">Star tasks to mark them as important</p>
        </div>
      )}
    </div>
  );
};

export default Important;