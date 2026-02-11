import React, { useState, useEffect } from 'react';
import './TaskBoard.css';
import { supabase } from '../supabaseClient';

function TaskBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    due_time: ''
  });
  const [currentUser] = useState('Jan Kowalski'); // Tymczasowo hardcoded

  const employees = [
    'Jan Kowalski',
    'Anna Zielińska',
    'Piotr Wiśniewski',
    'Maria Dąbrowska',
    'Tomasz Lewandowski',
    'Kierownik',
    'Asystent'
  ];

  const priorities = {
    high: { label: 'Pilne', color: '#FF6B6B', icon: '🔥', order: 1 },
    medium: { label: 'Średnie', color: '#F5A623', icon: '⚡', order: 2 },
    low: { label: 'Niskie', color: '#50E3C2', icon: '💡', order: 3 }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      // Sortuj po priorytecie (pilne na górze)
      const sorted = data.sort((a, b) => {
        return priorities[a.priority].order - priorities[b.priority].order;
      });
      setTasks(sorted);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (newTask.title) {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assigned_to: newTask.assigned_to || null,
        assigned_by: currentUser,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        status: newTask.assigned_to ? 'assigned' : 'available'
      };

      const { error } = await supabase
        .from('tasks')
        .insert([taskData]);

      if (error) {
        console.error('Error adding task:', error);
      } else {
        fetchTasks();
        setNewTask({ 
          title: '', 
          description: '', 
          priority: 'medium',
          assigned_to: '',
          due_date: '',
          due_time: ''
        });
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

  // Zadania do wzięcia (ogólne + przypisane do mnie ale jeszcze nie wzięte)
  const availableTasks = tasks.filter(t => 
    t.status === 'available' || 
    (t.assigned_to === currentUser && t.status === 'assigned')
  );
  
  // Moje zadania w trakcie
  const myTasks = tasks.filter(t => t.assigned_to === currentUser && t.status === 'in_progress');
  
  // Zadania innych osób
  const othersTasks = tasks.filter(t => 
    t.status === 'in_progress' && t.assigned_to && t.assigned_to !== currentUser
  );

  const formatDueDate = (date, time) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr = '';
    if (d.toDateString() === today.toDateString()) {
      dateStr = '🔥 Dzisiaj';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      dateStr = '⚡ Jutro';
    } else {
      dateStr = d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    }

    return time ? `${dateStr} o ${time}` : dateStr;
  };

  if (loading) {
    return <div className="task-board-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="task-board-container">
      <div className="task-header">
        <div>
          <h2>✓ Zadania</h2>
          <p className="user-label">Zalogowany jako: <strong>{currentUser}</strong></p>
        </div>
        <button className="add-task-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj zadanie
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <h3>Nowe zadanie</h3>
          
          <div className="form-row">
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
              <label>Przypisz do:</label>
              <select 
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
              >
                <option value="">Ogólne (kto ma czas)</option>
                {employees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
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

          <div className="form-row">
            <div className="form-field">
              <label>Termin (data):</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              />
            </div>

            <div className="form-field">
              <label>Godzina:</label>
              <input
                type="time"
                value={newTask.due_time}
                onChange={(e) => setNewTask({...newTask, due_time: e.target.value})}
              />
            </div>
          </div>

          <div className="form-buttons">
            <button className="save-btn" onClick={addTask}>Dodaj zadanie</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="tasks-columns">
        <div className="task-column">
          <h3>📋 Do wzięcia ({availableTasks.length})</h3>
          {availableTasks.map(task => (
            <div key={task.id} className="task-card" style={{ borderLeftColor: priorities[task.priority].color }}>
              <div className="task-priority" style={{ color: priorities[task.priority].color }}>
                {priorities[task.priority].icon} {priorities[task.priority].label}
              </div>
              {task.assigned_to && (
                <div className="assigned-badge">
                  👤 Dla: {task.assigned_to}
                </div>
              )}
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              {(task.due_date || task.due_time) && (
                <div className="due-date">
                  📅 {formatDueDate(task.due_date, task.due_time)}
                </div>
              )}
              <div className="task-meta">
                Dodane przez: {task.assigned_by || 'System'}
              </div>
              {(!task.assigned_to || task.assigned_to === currentUser) && (
                <button className="take-btn" onClick={() => takeTask(task.id)}>
                  👋 Biorę się za to
                </button>
              )}
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
              {(task.due_date || task.due_time) && (
                <div className="due-date">
                  📅 {formatDueDate(task.due_date, task.due_time)}
                </div>
              )}
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
          <h3>👥 W realizacji u innych ({othersTasks.length})</h3>
          {othersTasks.map(task => (
            <div key={task.id} className="task-card others-task" style={{ borderLeftColor: priorities[task.priority].color }}>
              <div className="task-priority" style={{ color: priorities[task.priority].color }}>
                {priorities[task.priority].icon} {priorities[task.priority].label}
              </div>
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              {(task.due_date || task.due_time) && (
                <div className="due-date">
                  📅 {formatDueDate(task.due_date, task.due_time)}
                </div>
              )}
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