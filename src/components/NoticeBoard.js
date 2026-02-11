import React, { useState, useEffect } from 'react';
import './NoticeBoard.css';
import { supabase } from '../supabaseClient';

function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', type: 'info' });

  const noticeTypes = {
    important: { label: 'Ważne', color: '#FF6B6B', icon: '⚠️' },
    event: { label: 'Wydarzenie', color: '#4A90E2', icon: '📅' },
    info: { label: 'Informacja', color: '#7ED321', icon: 'ℹ️' }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error);
    } else {
      setNotices(data);
    }
    setLoading(false);
  };

  const addNotice = async () => {
    if (newNotice.title && newNotice.content) {
      const { error } = await supabase
        .from('notices')
        .insert([{
          ...newNotice,
          author: 'Admin',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) {
        console.error('Error adding notice:', error);
      } else {
        fetchNotices();
        setNewNotice({ title: '', content: '', type: 'info' });
        setShowAddForm(false);
      }
    }
  };

  const deleteNotice = async (id) => {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notice:', error);
    } else {
      setNotices(notices.filter(n => n.id !== id));
    }
  };

  if (loading) {
    return <div className="notice-board-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="notice-board-container">
      <div className="board-header">
        <h2>📌 Tablica Ogłoszeń</h2>
        <button className="add-notice-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj ogłoszenie
        </button>
      </div>

      {showAddForm && (
        <div className="add-notice-form">
          <h3>Nowe ogłoszenie</h3>
          <div className="form-field">
            <label>Typ:</label>
            <div className="type-buttons">
              {Object.entries(noticeTypes).map(([key, val]) => (
                <button
                  key={key}
                  className={`type-btn ${newNotice.type === key ? 'active' : ''}`}
                  style={{ borderColor: newNotice.type === key ? val.color : '#ddd' }}
                  onClick={() => setNewNotice({...newNotice, type: key})}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Tytuł:</label>
            <input
              type="text"
              value={newNotice.title}
              onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
              placeholder="Np. Spotkanie zespołu"
            />
          </div>
          <div className="form-field">
            <label>Treść:</label>
            <textarea
              value={newNotice.content}
              onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
              placeholder="Szczegóły ogłoszenia..."
              rows="4"
            />
          </div>
          <div className="form-buttons">
            <button className="save-btn" onClick={addNotice}>Opublikuj</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="notices-grid">
        {notices.map(notice => (
          <div 
            key={notice.id} 
            className="notice-card"
            style={{ borderLeftColor: noticeTypes[notice.type].color }}
          >
            <div className="notice-header">
              <span className="notice-icon" style={{ color: noticeTypes[notice.type].color }}>
                {noticeTypes[notice.type].icon}
              </span>
              <span className="notice-type" style={{ color: noticeTypes[notice.type].color }}>
                {noticeTypes[notice.type].label}
              </span>
              <button className="delete-notice" onClick={() => deleteNotice(notice.id)}>×</button>
            </div>
            <h3>{notice.title}</h3>
            <p>{notice.content}</p>
            <div className="notice-footer">
              <span>👤 {notice.author}</span>
              <span>📅 {new Date(notice.date).toLocaleDateString('pl-PL')}</span>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="empty-state">Brak ogłoszeń</div>
        )}
      </div>
    </div>
  );
}

export default NoticeBoard;