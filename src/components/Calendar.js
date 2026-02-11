import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { supabase } from '../supabaseClient';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    employee: '',
    type: 'meeting',
    client: '',
    time: '10:00',
    day: 1,
    duration: 1
  });

  const employees = [
    'Jan Kowalski',
    'Anna Zielińska', 
    'Piotr Wiśniewski',
    'Maria Dąbrowska',
    'Tomasz Lewandowski'
  ];

  const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

  const eventTypes = {
    meeting: { label: 'Spotkanie z klientem', color: '#4A90E2' },
    vacation: { label: 'Urlop', color: '#F5A623' },
    training: { label: 'Szkolenie', color: '#7ED321' },
    substitute: { label: 'Zastępstwo', color: '#BD10E0' }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data);
    }
    setLoading(false);
  };

  const addEvent = async () => {
    if (newEvent.employee && (newEvent.type !== 'meeting' || newEvent.client)) {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([newEvent])
        .select();

      if (error) {
        console.error('Error adding event:', error);
      } else {
        setEvents([...events, ...data]);
        setNewEvent({ employee: '', type: 'meeting', client: '', time: '10:00', day: 1, duration: 1 });
        setShowAddForm(false);
      }
    }
  };

  const deleteEvent = async (id) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
    } else {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  if (loading) {
    return <div className="calendar-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>📅 Kalendarz Sprzedaży - Tydzień 03-08 lutego 2026</h2>
        <button className="add-event-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj wpis
        </button>
      </div>

      {showAddForm && (
        <div className="add-event-form">
          <h3>Dodaj nowy wpis</h3>
          <div className="form-grid">
            <div>
              <label>Pracownik:</label>
              <select value={newEvent.employee} onChange={(e) => setNewEvent({...newEvent, employee: e.target.value})}>
                <option value="">Wybierz pracownika</option>
                {employees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>

            <div>
              <label>Typ:</label>
              <select value={newEvent.type} onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}>
                {Object.entries(eventTypes).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {newEvent.type === 'meeting' && (
              <div>
                <label>Klient:</label>
                <input 
                  type="text" 
                  value={newEvent.client}
                  onChange={(e) => setNewEvent({...newEvent, client: e.target.value})}
                  placeholder="Imię i nazwisko klienta"
                />
              </div>
            )}

            <div>
              <label>Dzień:</label>
              <select value={newEvent.day} onChange={(e) => setNewEvent({...newEvent, day: parseInt(e.target.value)})}>
                {days.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
              </select>
            </div>

            <div>
              <label>Godzina:</label>
              <select value={newEvent.time} onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}>
                {hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}
              </select>
            </div>

            <div>
              <label>Długość (godz):</label>
              <input 
                type="number" 
                min="1" 
                max="8"
                value={newEvent.duration}
                onChange={(e) => setNewEvent({...newEvent, duration: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="form-buttons">
            <button className="save-btn" onClick={addEvent}>Zapisz</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="calendar-grid">
        <div className="time-column">
          <div className="header-cell"></div>
          {hours.map(hour => (
            <div key={hour} className="time-cell">{hour}</div>
          ))}
        </div>

        {days.map((day, dayIdx) => (
          <div key={day} className="day-column">
            <div className="header-cell">{day}</div>
            {hours.map((hour) => (
              <div key={hour} className="hour-cell">
                {events
                  .filter(e => e.day === dayIdx && e.time === hour)
                  .map(event => (
                    <div 
                      key={event.id} 
                      className="event-card"
                      style={{ 
                        backgroundColor: eventTypes[event.type].color,
                        height: `${event.duration * 60}px`
                      }}
                    >
                      <div className="event-employee">{event.employee}</div>
                      <div className="event-details">
                        {event.type === 'meeting' ? `🤝 ${event.client}` : eventTypes[event.type].label}
                      </div>
                      <button className="delete-event" onClick={() => deleteEvent(event.id)}>×</button>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;