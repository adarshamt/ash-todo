"use client";

import { useState, useEffect, useRef } from 'react';
import LocationPicker from './components/LocationPicker';

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFinishedTasks, setShowFinishedTasks] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationRadius, setLocationRadius] = useState(150);
  const [isPinningLocation, setIsPinningLocation] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const alertedLocationIds = useRef(new Set());

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
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tasks', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDistanceInMeters = (fromLat, fromLng, toLat, toLng) => {
    const earthRadius = 6371000;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(fromLat)) *
        Math.cos(toRadians(toLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const pinCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not available in this browser.');
      return;
    }

    setIsPinningLocation(true);
    setLocationStatus('Finding your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus(`Pinned current spot for alerts within ${locationRadius}m.`);
        setIsPinningLocation(false);
      },
      (error) => {
        setLocationStatus(error.message || 'Could not pin your location.');
        setIsPinningLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  };

  const enableLocationAlerts = async () => {
    const pendingLocationTasks = tasks.filter(t =>
      !t.completed &&
      !t.locationAlerted &&
      t.locationLat != null &&
      t.locationLng != null
    );

    if (pendingLocationTasks.length === 0) {
      setLocationStatus('Add a pinned location to a todo first.');
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('Location alerts are not available in this browser.');
      return;
    }

    if (window.Notification && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    setIsWatchingLocation(true);
    setLocationStatus('Location alerts are on while this app is open.');
  };

  useEffect(() => {
    if (!isWatchingLocation) return;

    if (!navigator.geolocation) {
      setLocationStatus('Location alerts are not available in this browser.');
      setIsWatchingLocation(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const pendingLocationTasks = tasks.filter(t =>
          !t.completed &&
          !t.locationAlerted &&
          t.locationLat != null &&
          t.locationLng != null
        );

        pendingLocationTasks.forEach((task) => {
          if (alertedLocationIds.current.has(task.id)) return;

          const distance = getDistanceInMeters(
            position.coords.latitude,
            position.coords.longitude,
            task.locationLat,
            task.locationLng
          );
          const radius = task.locationRadius || 150;

          if (distance <= radius) {
            const place = task.locationName || 'your saved location';
            const message = `You are near ${place}: ${task.title}`;

            alertedLocationIds.current.add(task.id);
            setTasks(currentTasks =>
              currentTasks.map(t =>
                t.id === task.id ? { ...t, locationAlerted: true } : t
              )
            );

            if (window.Notification && Notification.permission === 'granted') {
              new Notification('Todo location alert', { body: message });
            }

            window.alert(message);

            fetch(`/api/tasks/${task.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locationAlerted: true }),
            }).catch(() => {
              setLocationStatus('Alert shown, but could not save alert status.');
            });
          }
        });

        setLocationStatus(
          pendingLocationTasks.length > 0
            ? `Watching ${pendingLocationTasks.length} location todo${pendingLocationTasks.length === 1 ? '' : 's'}.`
            : 'No pending location alerts.'
        );
      },
      (error) => {
        setLocationStatus(error.message || 'Could not watch your location.');
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isWatchingLocation, tasks]);

  const addTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          priority,
          locationName,
          locationLat: locationCoords?.lat ?? null,
          locationLng: locationCoords?.lng ?? null,
          locationRadius,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add task');
      
      setTasks([data, ...tasks]);
      setNewTaskTitle('');
      setPriority('MEDIUM');
      setLocationName('');
      setLocationCoords(null);
      setLocationRadius(150);
      setLocationStatus('');
    } catch (error) {
      console.error('Error adding task', error);
      alert(error.message);
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

  const activeTasks = tasks.filter(t => !t.completed);
  const finishedTasks = tasks.filter(t => t.completed);
  const pendingLocationTasks = tasks.filter(t =>
    !t.completed &&
    !t.locationAlerted &&
    t.locationLat != null &&
    t.locationLng != null
  );
  const activeTasksCount = activeTasks.length;
  const locationHelpText = locationStatus ||
    (locationCoords
      ? `Pinned current spot for alerts within ${locationRadius}m.`
      : 'Add a label and pin here for arrival alerts.');

  const updateLocationRadius = (value) => {
    const nextRadius = Number(value);
    setLocationRadius(nextRadius);

    if (locationCoords) {
      setLocationStatus(`Pinned current spot for alerts within ${nextRadius}m.`);
    }
  };

  const renderLocationFields = () => (
    <div className="location-add-panel">
      <input
        type="text"
        className="location-input"
        placeholder="Location label (optional)"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
      />
      <button
        type="button"
        className={`pin-location-btn ${locationCoords ? 'pinned' : ''}`}
        onClick={pinCurrentLocation}
        disabled={isPinningLocation}
      >
        {isPinningLocation ? 'Pinning...' : locationCoords ? 'Pinned here' : 'Pin here'}
      </button>
      <select
        className="radius-select"
        value={locationRadius}
        onChange={(e) => updateLocationRadius(e.target.value)}
      >
        <option value={75}>75m</option>
        <option value={150}>150m</option>
        <option value={300}>300m</option>
        <option value={500}>500m</option>
      </select>
      <div className="location-helper">{locationHelpText}</div>
    </div>
  );

  const renderTask = (task) => (
    <div key={task.id} className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
      <div className="task-color-indicator"></div>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => toggleComplete(task.id, task.completed)}
      />
      <div className="task-content">
        <div className="task-main-line">
          <span className="task-title">{task.title}</span>
          <span className={`priority-badge badge-${task.priority}`}>
            {task.priority === 'HIGH' ? 'PRIORITY' : task.priority}
          </span>
        </div>
        {(task.locationName || task.locationLat != null) && (
          <span className="task-location">
            Near {task.locationName || 'saved pin'} - {task.locationRadius || 150}m
            {task.locationAlerted ? ' - alerted' : ''}
          </span>
        )}
      </div>
      <button
        type="button"
        className="delete-btn"
        aria-label={`Delete ${task.title}`}
        onClick={() => deleteTask(task.id)}
      >
        x
      </button>
    </div>
  );

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
        <LocationPicker
          locationName={locationName}
          setLocationName={setLocationName}
          locationCoords={locationCoords}
          setLocationCoords={setLocationCoords}
          locationRadius={locationRadius}
          setLocationRadius={setLocationRadius}
          setLocationStatus={setLocationStatus}
        />
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
      <div className="desktop-location-fields">
        <LocationPicker
          locationName={locationName}
          setLocationName={setLocationName}
          locationCoords={locationCoords}
          setLocationCoords={setLocationCoords}
          locationRadius={locationRadius}
          setLocationRadius={setLocationRadius}
          setLocationStatus={setLocationStatus}
        />
      </div>

      {pendingLocationTasks.length > 0 && (
        <div className="location-alert-bar">
          <div className="location-alert-copy">
            <strong>Location alerts</strong>
            <span>
              {pendingLocationTasks.length} todo{pendingLocationTasks.length === 1 ? '' : 's'} ready to alert nearby.
            </span>
          </div>
          <button
            type="button"
            className={`location-alert-toggle ${isWatchingLocation ? 'watching' : ''}`}
            onClick={() => isWatchingLocation ? setIsWatchingLocation(false) : enableLocationAlerts()}
          >
            {isWatchingLocation ? 'On' : 'Enable'}
          </button>
        </div>
      )}

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
          <>
            {activeTasks.length > 0 ? (
              activeTasks.map(renderTask)
            ) : (
              <div className="empty-active-message">All active tasks are finished.</div>
            )}

            {finishedTasks.length > 0 && (
              <div className="finished-tasks-wrap">
                <button
                  type="button"
                  className="finished-tasks-toggle"
                  aria-expanded={showFinishedTasks}
                  onClick={() => setShowFinishedTasks(!showFinishedTasks)}
                >
                  <span
                    className={`finished-arrow ${showFinishedTasks ? 'open' : ''}`}
                    aria-hidden="true"
                  ></span>
                  <span>Finished Tasks ({finishedTasks.length})</span>
                </button>

                {showFinishedTasks && (
                  <div className="finished-tasks-list">
                    {finishedTasks.map(renderTask)}
                  </div>
                )}
              </div>
            )}
          </>
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
