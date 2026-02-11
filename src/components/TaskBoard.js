import React, { useState, useEffect } from 'react';
import './TaskBoard.css';
import { supabase } from '../supabaseClient';

function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [currentUser] = useState('Jan Kowalski');

  const priorities = {
    high: { label: 'Pilne', color: '#FF6B6B', icon: '🔥' },
    medium: { label: 'Średnie', color: '#F5A623', icon: '⚡' },
    low: { label: 'Niskie', color: '#50E3C2', icon: '💡' }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (newTask.title) {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          assigned_to: null,
          status: 'available'
        }]);

      if (error) {
        console.error('Error adding task:', error);
      } else {
        fetchTasks();
        setNewTask({ title: '', description: '', priority: 'medium' });
        setShowAddForm(false);
      }
    }
  };

  const takeTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: currentUser, status: 'in_progress' })
      .eq('id', taskId);

    if (error) {
      console.error('Error taking task:', error);
    } else {
      fetchTasks();
    }
  };

  const completeTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error completing task:', error);
    } else {
      fetchTasks();
    }
  };

  const releaseTask = async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to: null, status: 'available' })
      .eq('id', taskId);

    if (error) {
      console.error('Error releasing task:', error);
    } else {
      fetchTasks();
    }
  };

  const availableTasks = tasks.filter(t => t.status === 'available');
  const myTasks = tasks.filter(t => t.assigned_to === currentUser);
  const othersTasks = tasks.filter(t => t.status === 'in_progress' && t.assigned_to !== currentUser);

  if (loading) {
    return <div className="task-board-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="task-board-container">
      <div className="task-header">
        <div>
          <h2>✓ Zadania do Wzięcia</h2>
          <p className="user-label">Zalogowany jako: <strong>{currentUser}</strong></p>
        </div>
        <button className="add-task-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj zadanie
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <h3>Nowe zadanie</h3>
          <div className="form-field">
            <label>Priorytet:</label>
            <div className="priority-buttons">
              {Object.entries(priorities).map(([key, val]) => (
                <button
                  key={key}
                  className={`priority-btn ${newTask.priority === key ? 'active' : ''}`}
                  style={{ borderColor: newTask.priority === key ? val.color : '#ddd' }}
                  onClick={() => setNewTask({...newTask, priority: key})}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Tytuł zadania:</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Np. Zrób zdjęcia BMW X5"
            />
          </div>
          <div className="form-field">
            <label>Szczegóły:</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Dodatkowe informacje..."
              rows="3"
            />
          </div>
          <div className="form-buttons">
            <button className="save-btn" onClick={addTask}>Dodaj</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="tasks-columns">
        <div className="task-column">
          <h3>📋 Dostępne zadania ({availableTasks.length})</h3>
          {availableTasks.map(task => (
            <div key={task.id} className="task-card" style={{ borderLeftColor: priorities[task.priority].color }}>
              <div className="task-priority" style={{ color: priorities[task.priority].color }}>
                {priorities[task.priority].icon} {priorities[task.priority].label}
              </div>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <button className="take-btn" onClick={() => takeTask(task.id)}>
                👋 Wezmę to
              </button>
            </div>
          ))}
          {availableTasks.length === 0 && (
            <div className="empty-column">Brak dostępnych zadań</div>
          )}
        </div>

        <div className="task-column">
          <h3>🔨 Moje zadania ({myTasks.length})</h3>
          {myTasks.map(task => (
            <div key={task.id} className="task-card my-task" style={{ borderLeftColor: priorities[task.priority].color }}>
              <div className="task-priority" style={{ color: priorities[task.priority].color }}>
                {priorities[task.priority].icon} {priorities[task.priority].label}
              </div>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <div className="task-actions">
                <button className="complete-btn" onClick={() => completeTask(task.id)}>
                  ✓ Zrobione
                </button>
                <button className="release-btn" onClick={() => releaseTask(task.id)}>
                  ↩️ Zwolnij
                </button>
              </div>
            </div>
          ))}
          {myTasks.length === 0 && (
            <div className="empty-column">Nie masz przypisanych zadań</div>
          )}
        </div>

        <div className="task-column">
          <h3>👥 W realizacji ({othersTasks.length})</h3>
          {othersTasks.map(task => (
            <div key={task.id} className="task-card others-task" style={{ borderLeftColor: priorities[task.priority].color }}>
              <div className="task-priority" style={{ color: priorities[task.priority].color }}>
                {priorities[task.priority].icon} {priorities[task.priority].label}
              </div>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <div className="assigned-info">
                👤 {task.assigned_to}
              </div>
            </div>
          ))}
          {othersTasks.length === 0 && (
            <div className="empty-column">Nikt nie pracuje nad zadaniami</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskBoard;