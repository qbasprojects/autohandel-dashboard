import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Calendar from './components/Calendar';
import AssistantNotes from './components/AssistantNotes';
import DetailingQueue from './components/DetailingQueue';
import NoticeBoard from './components/NoticeBoard';
import TaskBoard from './components/TaskBoard';
import AutoDNAReports from './components/AutoDNAReports';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null);

  const modules = [
    { id: 'calendar', name: 'Kalendarz Sprzedaży', icon: '📅', color: '#4A90E2' },
    { id: 'notes', name: 'Notatki Asystenta', icon: '📝', color: '#F5A623' },
    { id: 'detailing', name: 'Kolejka Detailingu', icon: '🚗', color: '#7ED321' },
    { id: 'board', name: 'Tablica Ogłoszeń', icon: '📌', color: '#BD10E0' },
    { id: 'tasks', name: 'Zadania', icon: '✓', color: '#50E3C2' },
    { id: 'autodna', name: 'Raporty AutoDNA', icon: '📊', color: '#FF6B6B' },
  ];

  useEffect(() => {
    // Sprawdź czy użytkownik jest zalogowany
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Nasłuchuj na zmiany sesji
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveModule(null);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <h2 style={{ color: 'white' }}>Ładowanie...</h2>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (activeModule) {
    return (
      <div className="fullscreen-module">
        <button className="back-button" onClick={() => setActiveModule(null)}>
          ← Powrót do dashboardu
        </button>
        <div className="module-content">
          {activeModule === 'calendar' && <Calendar />}
          {activeModule === 'notes' && <AssistantNotes />}
          {activeModule === 'detailing' && <DetailingQueue />}
          {activeModule === 'board' && <NoticeBoard />}
          {activeModule === 'tasks' && <TaskBoard />}
          {activeModule === 'autodna' && <AutoDNAReports />}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1>🚗 AutoHandel Dashboard</h1>
        <div className="user-info">
          <span>Zalogowany: {user.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Wyloguj</button>
        </div>
      </header>
      
      <div className="dashboard-grid">
        {modules.map(module => (
          <div
            key={module.id}
            className="dashboard-tile"
            style={{ borderColor: module.color }}
            onClick={() => setActiveModule(module.id)}
          >
            <div className="tile-icon" style={{ color: module.color }}>
              {module.icon}
            </div>
            <div className="tile-name">{module.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;