import React, { useState, useEffect } from 'react';
import './AssistantNotes.css';
import { supabase } from '../supabaseClient';

function AssistantNotes() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTask, setNewTask] = useState({
    category: 'asap',
    description: '',
    deadline: getTodayDate(),
    license_plate: '',
    inspection_deadline: ''
  });
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNote, setCompletionNote] = useState('');

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  const categories = {
    asap: { label: 'Do zrobienia ASAP', icon: '🔥', color: '#FF6B6B' },
    charging: { label: 'Auta do naładowania', icon: '🔌', color: '#4A90E2' },
    refueling: { label: 'Auta do zatankowania', icon: '⛽', color: '#F5A623' },
    inspection: { label: 'Badania techniczne', icon: '🔧', color: '#BD10E0' },
    other: { label: 'Inne', icon: '📋', color: '#7ED321' }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('assistant_tasks')
      .select('*')
      .order('deadline', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const addTask = async () => {
    if (newTask.description.trim()) {
      const taskData = {
        category: newTask.category,
        description: newTask.description,
        deadline: newTask.deadline,
        completed: false,
        completed_at: null,
        completion_note: null
      };

      // Dodaj dodatkowe pola dla określonych kategorii
      if (newTask.category === 'charging' || newTask.category === 'refueling') {
        taskData.license_plate = newTask.license_plate;
      }
      if (newTask.category === 'inspection') {
        taskData.license_plate = newTask.license_plate;
        taskData.inspection_deadline = newTask.inspection_deadline;
      }

      const { error } = await supabase
        .from('assistant_tasks')
        .insert([taskData]);

      if (error) {
        console.error('Error adding task:', error);
      } else {
        fetchTasks();
        setNewTask({ 
          category: 'asap', 
          description: '', 
          deadline: getTodayDate(),
          license_plate: '',
          inspection_deadline: ''
        });
        setShowAddForm(false);
      }
    }
  };

  const startCompleting = (task) => {
    setCompletingTask(task.id);
    setCompletionNote('');
  };

  const completeTask = async (taskId) => {
    const { error } = await supabase
      .from('assistant_tasks')
      .update({ 
        completed: true,
        completed_at: new Date().toLocaleString('pl-PL'),
        completion_note: completionNote || null
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error completing task:', error);
    } else {
      fetchTasks();
      setCompletingTask(null);
      setCompletionNote('');
    }
  };

  const uncompleteTask = async (taskId) => {
    const { error } = await supabase
      .from('assistant_tasks')
      .update({ 
        completed: false,
        completed_at: null,
        completion_note: null
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error uncompleting task:', error);
    } else {
      fetchTasks();
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('assistant_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const getTasksByCategory = (category) => {
    return pendingTasks.filter(t => t.category === category);
  };

  if (loading) {
    return <div className="assistant-notes-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="assistant-notes-container">
      <div className="notes-header">
        <h2>📝 Notatki dla Asystenta</h2>
        <button className="add-task-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj zadanie
        </button>
      </div>

      {showAddForm && (
        <div className="add-task-form">
          <h3>Nowe zadanie dla asystenta</h3>
          
          <div className="form-field">
            <label>Kategoria:</label>
            <div className="category-buttons">
              {Object.entries(categories).map(([key, val]) => (
                <button
                  key={key}
                  className={`category-btn ${newTask.category === key ? 'active' : ''}`}
                  style={{ 
                    borderColor: newTask.category === key ? val.color : '#ddd',
                    backgroundColor: newTask.category === key ? val.color + '20' : 'white'
                  }}
                  onClick={() => setNewTask({...newTask, category: key})}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          {(newTask.category === 'charging' || newTask.category === 'refueling' || newTask.category === 'inspection') && (
            <div className="form-field">
              <label>Numer rejestracyjny:</label>
              <input
                type="text"
                value={newTask.license_plate}
                onChange={(e) => setNewTask({...newTask, license_plate: e.target.value.toUpperCase()})}
                placeholder="np. WGD 12345"
              />
            </div>
          )}

          {newTask.category === 'inspection' && (
            <div className="form-field">
              <label>Termin badania:</label>
              <input
                type="date"
                value={newTask.inspection_deadline}
                onChange={(e) => setNewTask({...newTask, inspection_deadline: e.target.value})}
              />
            </div>
          )}

          <div className="form-field">
            <label>Opis zadania:</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder={
                newTask.category === 'charging' ? 'np. Stacja nr 2' :
                newTask.category === 'refueling' ? 'np. Zatankuj do pełna' :
                newTask.category === 'inspection' ? 'np. Badanie + wymiana oleju' :
                'Szczegóły zadania...'
              }
              rows="3"
            />
          </div>

          <div className="form-field">
            <label>Termin wykonania:</label>
            <input 
              type="date" 
              value={newTask.deadline}
              onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
            />
          </div>

          <div className="form-buttons">
            <button className="save-btn" onClick={addTask}>Dodaj zadanie</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="categories-section">
        {Object.entries(categories).map(([catKey, catVal]) => {
          const catTasks = getTasksByCategory(catKey);
          if (catTasks.length === 0) return null;

          return (
            <div key={catKey} className="category-group">
              <h3 style={{ color: catVal.color }}>
                {catVal.icon} {catVal.label} ({catTasks.length})
              </h3>
              <div className="tasks-grid">
                {catTasks.map(task => (
                  <div key={task.id} className="task-card-new" style={{ borderLeftColor: catVal.color }}>
                    {task.license_plate && (
                      <div className="license-plate">{task.license_plate}</div>
                    )}
                    <div className="task-description">{task.description}</div>
                    {task.inspection_deadline && (
                      <div className="inspection-date">
                        📅 Badanie do: {new Date(task.inspection_deadline).toLocaleDateString('pl-PL')}
                      </div>
                    )}
                    <div className="task-deadline">
                      ⏰ Do: {new Date(task.deadline).toLocaleDateString('pl-PL')}
                    </div>

                    {completingTask === task.id ? (
                      <div className="completion-form">
                        <textarea
                          placeholder="Opcjonalnie: krótki opis wykonania..."
                          value={completionNote}
                          onChange={(e) => setCompletionNote(e.target.value)}
                          rows="2"
                        />
                        <div className="completion-buttons">
                          <button className="confirm-btn" onClick={() => completeTask(task.id)}>
                            ✓ Potwierdź
                          </button>
                          <button className="cancel-completion-btn" onClick={() => setCompletingTask(null)}>
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="task-actions">
                        <button className="complete-task-btn" onClick={() => startCompleting(task)}>
                          ✓ Zrobione
                        </button>
                        <button className="delete-task-btn" onClick={() => deleteTask(task.id)}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {pendingTasks.length === 0 && (
          <div className="empty-state">✨ Wszystkie zadania wykonane!</div>
        )}
      </div>

      <div className="completed-section">
        <div className="completed-header" onClick={() => setShowCompleted(!showCompleted)}>
          <h3>✅ Wykonane zadania ({completedTasks.length})</h3>
          <button className="toggle-btn">{showCompleted ? '▼' : '▶'}</button>
        </div>

        {showCompleted && (
          <div className="completed-list">
            {completedTasks.slice().reverse().map(task => (
              <div key={task.id} className="completed-task-card">
                <div className="completed-task-header">
                  <span className="completed-category" style={{ color: categories[task.category]?.color }}>
                    {categories[task.category]?.icon} {categories[task.category]?.label}
                  </span>
                  {task.license_plate && (
                    <span className="license-plate-small">{task.license_plate}</span>
                  )}
                </div>
                <div className="completed-task-description">{task.description}</div>
                {task.completion_note && (
                  <div className="completion-note">📌 {task.completion_note}</div>
                )}
                <div className="completed-task-meta">
                  <span>🕐 {task.completed_at}</span>
                  <div className="completed-actions">
                    <button className="uncomplete-btn" onClick={() => uncompleteTask(task.id)}>
                      ↩️ Cofnij
                    </button>
                    <button className="delete-completed-btn" onClick={() => deleteTask(task.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssistantNotes;