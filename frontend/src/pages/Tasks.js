import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoCheckmarkOutline, IoTrashOutline, IoChevronBackOutline, IoChevronForwardOutline, IoStar, IoStarOutline, IoCalendarOutline, IoPencilOutline } from 'react-icons/io5';
import api from '../config/api';
import './Tasks.css';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MiniCalendar = ({ selectedDate, onSelectDate, taskDates }) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const today = new Date();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div className="mini-calendar">
      <div className="mini-cal-header">
        <button className="mini-cal-nav" onClick={prevMonth}><IoChevronBackOutline /></button>
        <span className="mini-cal-title">{MONTHS[viewMonth]} {viewYear}</span>
        <button className="mini-cal-nav" onClick={nextMonth}><IoChevronForwardOutline /></button>
      </div>
      <div className="mini-cal-days-row">{DAYS.map((d, i) => <span key={i} className="mini-cal-day-label">{d}</span>)}</div>
      <div className="mini-cal-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const dateObj = new Date(viewYear, viewMonth, day);
          const isToday = dateObj.toDateString() === today.toDateString();
          const isSelected = dateObj.toDateString() === selectedDate.toDateString();
          const isPast = dateObj < today && !isToday;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const hasTasks = taskDates.has(dateStr);
          return (
            <button key={i} className={`mini-cal-cell ${isToday?'today':''} ${isSelected?'selected':''} ${isPast?'past':''}`} onClick={() => onSelectDate(dateObj)}>
              {day}
              {hasTasks && <span className="task-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EMPTY_TASK = { title: '', description: '', priority: 'Medium', category: 'Personal' };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [allTaskDates, setAllTaskDates] = useState(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState(EMPTY_TASK);
  // Edit state
  const [editingTask, setEditingTask] = useState(null); // the full task object
  const [editForm, setEditForm] = useState(EMPTY_TASK);

  useEffect(() => { loadTasks(); }, [selectedDate]); // eslint-disable-line
  useEffect(() => { loadAllTaskDates(); }, []); // eslint-disable-line

  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadAllTaskDates = async () => {
    try {
      const res = await api.get('/tasks');
      const dates = new Set(res.data.map(t => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }));
      setAllTaskDates(dates);
    } catch (e) {}
  };

  const loadTasks = async () => {
    try {
      const response = await api.get(`/tasks?date=${toLocalDateStr(selectedDate)}`);
      setTasks(response.data);
    } catch (error) { console.error('Error loading tasks:', error); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'today') setSelectedDate(new Date());
    else if (tab === 'tomorrow') setSelectedDate(new Date(Date.now() + 86400000));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post('/tasks', { ...newTask, date: toLocalDateStr(selectedDate) });
      setNewTask(EMPTY_TASK);
      setShowAddTask(false);
      loadTasks(); loadAllTaskDates();
    } catch (error) { console.error('Error adding task:', error); }
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({ title: task.title, description: task.description || '', priority: task.priority, category: task.category });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;
    try {
      await api.put(`/tasks/${editingTask._id}`, editForm);
      setEditingTask(null);
      loadTasks();
    } catch (error) { console.error('Error updating task:', error); }
  };

  const toggleTask = async (taskId) => {
    try { await api.patch(`/tasks/${taskId}/toggle`); loadTasks(); }
    catch (error) { console.error('Error toggling task:', error); }
  };

  const toggleImportant = async (taskId) => {
    try { await api.patch(`/tasks/${taskId}/important`); loadTasks(); }
    catch (error) { console.error('Error toggling important:', error); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); loadTasks(); loadAllTaskDates(); }
    catch (error) { console.error('Error deleting task:', error); }
  };

  const isToday = activeTab === 'today';
  const isTomorrow = activeTab === 'tomorrow';
  const isSomeday = activeTab === 'someday';
  const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const completedCount = tasks.filter(t => t.completed).length;

  const TaskForm = ({ value, onChange, onSubmit, onCancel, title, submitLabel }) => (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <form onSubmit={onSubmit}>
          <div className="input-group">
            <input type="text" className="input" placeholder="Task title" value={value.title}
              onChange={e => onChange({...value, title: e.target.value})} autoFocus />
          </div>
          <div className="input-group">
            <textarea className="input" placeholder="Description (optional)" value={value.description}
              onChange={e => onChange({...value, description: e.target.value})} rows="2" />
          </div>
          <div className="input-group">
            <label className="input-label">Priority</label>
            <select className="input" value={value.priority} onChange={e => onChange({...value, priority: e.target.value})}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input" value={value.category} onChange={e => onChange({...value, category: e.target.value})}>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="page tasks-page">
      <div className="page-header">
        <h1 className="page-title">Tasks</h1>
        <p className="page-subtitle">{dateLabel}</p>
      </div>

      <div className="date-selector">
        <button className={`date-btn ${isToday?'active':''}`} onClick={() => handleTabChange('today')}>Today</button>
        <button className={`date-btn ${isTomorrow?'active':''}`} onClick={() => handleTabChange('tomorrow')}>Tomorrow</button>
        <button className={`date-btn calendar-btn ${isSomeday?'active':''}`} onClick={() => handleTabChange('someday')}><IoCalendarOutline /> Someday</button>
      </div>

      {isSomeday && <MiniCalendar selectedDate={selectedDate} onSelectDate={d => setSelectedDate(d)} taskDates={allTaskDates} />}

      {tasks.length > 0 && <div className="tasks-count-bar"><span>{completedCount}/{tasks.length} done</span></div>}

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No tasks yet</h3>
            <p className="empty-state-text">Add your first task for {dateLabel}</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task._id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-checkbox-wrapper" onClick={() => toggleTask(task._id)}>
                <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                  {task.completed && <IoCheckmarkOutline />}
                </div>
              </div>
              <div className="task-details">
                <div className="task-title">{task.title}</div>
                {task.description && <div className="task-description">{task.description}</div>}
                <div className="task-meta">
                  <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <span className="category-badge">{task.category}</span>
                </div>
              </div>
              <button className="task-delete" onClick={() => openEdit(task)} title="Edit" style={{ color: 'var(--gray-400)' }}>
                <IoPencilOutline />
              </button>
              <button className="task-delete" onClick={() => toggleImportant(task._id)} style={{ color: task.isImportant ? '#f59e0b' : 'inherit' }}>
                {task.isImportant ? <IoStar /> : <IoStarOutline />}
              </button>
              <button className="task-delete" onClick={() => deleteTask(task._id)}>
                <IoTrashOutline />
              </button>
            </div>
          ))
        )}
      </div>

      {!showAddTask && !editingTask && (
        <button className="fab" onClick={() => setShowAddTask(true)}><IoAddOutline /></button>
      )}

      {showAddTask && (
        <TaskForm value={newTask} onChange={setNewTask} onSubmit={handleAddTask}
          onCancel={() => { setShowAddTask(false); setNewTask(EMPTY_TASK); }}
          title={`New Task · ${dateLabel}`} submitLabel="Add Task" />
      )}

      {editingTask && (
        <TaskForm value={editForm} onChange={setEditForm} onSubmit={handleEditSave}
          onCancel={() => setEditingTask(null)}
          title="Edit Task" submitLabel="Save Changes" />
      )}
    </div>
  );
};

export default Tasks;