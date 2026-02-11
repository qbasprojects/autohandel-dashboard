import React, { useState, useEffect } from 'react';
import './AssistantNotes.css';
import { supabase } from '../supabaseClient';

function AssistantNotes() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    deadline: getTodayDate()
  });

  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

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
      const { data, error } = await supabase
        .from('assistant_tasks')
        .insert([{
          description: newTask.description,
          deadline: newTask.deadline,
          completed: false,
          completed_at: null
        }])
        .select();

      if (error) {
        console.error('Error adding task:', error);
      } else {
        setTasks([...tasks, ...data]);
        setNewTask({ description: '', deadline: getTodayDate() });
        setShowAddForm(false);
      }
    }
  };

  const toggleTask = async (id, currentCompleted) => {
    const { error } = await supabase
      .from('assistant_tasks')
      .update({ 
        completed: !currentCompleted,
        completed_at: !currentCompleted ? new Date().toLocaleString('pl-PL') : null
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setTasks(tasks.map(task => 
        task.id === id 
          ? { ...task, completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toLocaleString('pl-PL') : null }
          : task
      ));
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

  const setQuickDeadline = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setNewTask({ ...newTask, deadline: date.toISOString().split('T')[0] });
  };

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const groupTasksByDate = (taskList) => {
    const grouped = {};
    taskList.forEach(task => {
      if (!grouped[task.deadline]) {
        grouped[task.deadline] = [];
      }
      grouped[task.deadline].push(task);
    });
    return grouped;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '🔥 Dzisiaj';
    if (date.toDateString() === tomorrow.toDateString()) return '⚡ Jutro';
    
    return date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
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
            <label>Opis zadania:</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Np. Wyślij opony pod adres ul. Kwiatowa 15..."
              rows="3"
            />
          </div>

          <div className="deadline-section">
            <label>Termin wykonania:</label>
            <div className="quick-deadline-buttons">
              <button onClick={() => setQuickDeadline(0)} className="quick-btn">Dzisiaj</button>
              <button onClick={() => setQuickDeadline(1)} className="quick-btn">Jutro</button>
              <button onClick={() => setQuickDeadline(2)} className="quick-btn">Pojutrze</button>
            </div>
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

      <div className="tasks-sections">
        <div className="pending-section">
          <h3>⏳ Do zrobienia ({pendingTasks.length})</h3>
          {Object.entries(groupTasksByDate(pendingTasks))
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, dateTasks]) => (
              <div key={date} className="date-group">
                <div className="date-header">{formatDate(date)}</div>
                {dateTasks.map(task => (
                  <div key={task.id} className="task-card pending">
                    <div className="task-content">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id, task.completed)}
                        className="task-checkbox"
                      />
                      <span className="task-description">{task.description}</span>
                    </div>
                    <button className="delete-task" onClick={() => deleteTask(task.id)}>
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ))}
          {pendingTasks.length === 0 && (
            <div className="empty-state">✨ Wszystkie zadania wykonane!</div>
          )}
        </div>

        <div className="completed-section">
          <h3>✅ Wykonane ({completedTasks.length})</h3>
          {completedTasks.map(task => (
            <div key={task.id} className="task-card completed">
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="task-checkbox"
                />
                <div>
                  <span className="task-description">{task.description}</span>
                  <div className="completed-time">Wykonano: {task.completed_at}</div>
                </div>
              </div>
              <button className="delete-task" onClick={() => deleteTask(task.id)}>
                🗑️
              </button>
            </div>
          ))}
          {completedTasks.length === 0 && (
            <div className="empty-state">Brak wykonanych zadań</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssistantNotes;