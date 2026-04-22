'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, priority }),
      });
      const newTask = await res.json();
      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setPriority('MEDIUM');
    } catch (error) {
      console.error('Error adding task', error);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
      
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
    } catch (error) {
      console.error('Error toggling task', error);
      fetchTasks();
    }
  };

  const deleteTask = async (id) => {
    try {
      setTasks(tasks.filter(t => t.id !== id));
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting task', error);
      fetchTasks();
    }
  };
  
  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    for (let t of completedTasks) {
      await deleteTask(t.id);
    }
  };

  const activeTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="app-container">
      {/* Desktop Header */}
      <header className="header">
        <div className="desktop-logo-wrap">
          <div className="logo-icon">✓</div>
          <div className="header-content">
            <h1 className="title">Ash Todo</h1>
            <p className="subtitle">Simplify your day</p>
          </div>
        </div>
        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <span style={{color: 'var(--primary)', fontSize: '20px'}}>≚</span> Ash Todo
        </div>
        <div className="mobile-actions">
          <span style={{cursor: 'pointer'}} onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? '☀️' : '🌙'}
          </span>
          <span style={{cursor: 'pointer', marginLeft: '12px'}}>⋮</span>
        </div>
      </div>

      {/* Mobile Add Task Container */}
      <div className="mobile-focus-today">
        <div className="focus-title">Focus today</div>
        <div className="mobile-input-wrap">
          <input 
            type="text" 
            placeholder="Add a new task..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
        </div>
        <div className="mobile-add-controls">
          <div className="priority-buttons">
            <button 
              className={`p-btn low ${priority === 'LOW' ? 'active' : ''}`}
              onClick={() => setPriority('LOW')}
            >Low</button>
            <button 
              className={`p-btn med ${priority === 'MEDIUM' ? 'active' : ''}`}
              onClick={() => setPriority('MEDIUM')}
            >Med</button>
            <button 
              className={`p-btn high ${priority === 'HIGH' ? 'active' : ''}`}
              onClick={() => setPriority('HIGH')}
            >High</button>
          </div>
          <button className="mobile-add-btn" onClick={addTask}>
            + Add
          </button>
        </div>
      </div>

      {/* Desktop Add Task */}
      <div className="add-task-container">
        <span className="add-icon">⊕</span>
        <input 
          type="text" 
          className="task-input" 
          placeholder="Add a new task..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
        />
        <select 
          className="priority-select" 
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">Priority</option>
        </select>
        <button className="add-btn" onClick={addTask}>ADD</button>
      </div>

      {/* Tasks Header (Mobile) */}
      <div className="mobile-active-header">
        <div className="active-tasks-title">Active Tasks ({activeTasksCount})</div>
        {tasks.some(t => t.completed) && (
          <button className="clear-completed" onClick={clearCompleted}>Clear Completed</button>
        )}
      </div>

      {/* Task List */}
      <div className="tasks-list">
        {isLoading ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#9ca3af'}}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#9ca3af'}}>No tasks yet. Enjoy your day!</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
              <div className="task-color-indicator"></div>
              <input 
                type="checkbox" 
                className="task-checkbox" 
                checked={task.completed}
                onChange={() => toggleComplete(task.id, task.completed)}
              />
              <div className="task-content">
                <span className="task-title">{task.title}</span>
                <span className={`priority-badge badge-${task.priority}`}>
                  {task.priority === 'HIGH' ? 'PRIORITY' : task.priority}
                </span>
              </div>
              <button className="delete-btn" onClick={() => deleteTask(task.id)}>🗑</button>
            </div>
          ))
        )}
      </div>

      {/* Desktop Footer */}
      <div className="footer-text">UBUNTU INSPIRED • FOCUSED DESIGN</div>

      {/* Mobile Banner */}
      <div className="mobile-banner">
        <div className="banner-subtitle">WORKSPACE INSPIRATION</div>
        <div className="banner-title">Deep focus leads to great results.</div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav">
        <div className="nav-item active">
          <span className="nav-icon">☑</span>
          <span>Tasks</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">📅</span>
          <span>Calendar</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">⚙</span>
          <span>Settings</span>
        </div>
      </div>
    </div>
  );
}
