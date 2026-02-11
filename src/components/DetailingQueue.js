import React, { useState, useEffect } from 'react';
import './DetailingQueue.css';
import { supabase } from '../supabaseClient';

function DetailingQueue() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCar, setNewCar] = useState({ brand: '', model: '', vin: '', size: 'średnie' });
  const [showHistory, setShowHistory] = useState(false);
  const [manualAssignment, setManualAssignment] = useState(null);

  const detailers = ['Marek Kowalski', 'Piotr Nowak'];

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    const { data, error } = await supabase
      .from('detailing_cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cars:', error);
    } else {
      setCars(data);
    }
    setLoading(false);
  };

  const autoAssignCars = async () => {
    const waitingCars = cars.filter(c => c.status === 'waiting');
    const assigned = [...waitingCars];
    
    assigned.sort((a, b) => {
      const sizes = { 'duże': 3, 'średnie': 2, 'małe': 1 };
      return sizes[b.size] - sizes[a.size];
    });

    for (let i = 0; i < assigned.length; i++) {
      const car = assigned[i];
      const detailer = detailers[i % 2];
      
      await supabase
        .from('detailing_cars')
        .update({ assigned_to: detailer })
        .eq('id', car.id);
    }

    fetchCars();
  };

  const addCar = async () => {
    if (newCar.brand && newCar.model && newCar.vin) {
      const { error } = await supabase
        .from('detailing_cars')
        .insert([{
          ...newCar,
          status: 'waiting',
          assigned_to: null,
          completed_at: null,
          completed_by: null
        }]);

      if (error) {
        console.error('Error adding car:', error);
      } else {
        fetchCars();
        setNewCar({ brand: '', model: '', vin: '', size: 'średnie' });
        setShowAddForm(false);
      }
    }
  };

  const completeCar = async (carId, detailer) => {
    const { error } = await supabase
      .from('detailing_cars')
      .update({ 
        status: 'completed',
        completed_at: new Date().toLocaleString('pl-PL'),
        completed_by: detailer
      })
      .eq('id', carId);

    if (error) {
      console.error('Error completing car:', error);
    } else {
      fetchCars();
    }
  };

  const manualAssign = async (carId, detailer) => {
    const { error } = await supabase
      .from('detailing_cars')
      .update({ assigned_to: detailer })
      .eq('id', carId);

    if (error) {
      console.error('Error assigning car:', error);
    } else {
      fetchCars();
      setManualAssignment(null);
    }
  };

  const waitingCars = cars.filter(c => c.status === 'waiting');
  const completedCars = cars.filter(c => c.status === 'completed');

  const getStatsByDetailer = (detailer) => {
    const completed = completedCars.filter(c => c.completed_by === detailer);
    return {
      total: completed.length,
      małe: completed.filter(c => c.size === 'małe').length,
      średnie: completed.filter(c => c.size === 'średnie').length,
      duże: completed.filter(c => c.size === 'duże').length,
    };
  };

  const getQueueByDetailer = (detailer) => {
    return waitingCars.filter(c => c.assigned_to === detailer);
  };

  if (loading) {
    return <div className="detailing-queue-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="detailing-queue-container">
      <div className="queue-header">
        <h2>🚗 Kolejka Detailingu</h2>
        <div className="header-buttons">
          <button className="auto-assign-btn" onClick={autoAssignCars}>
            ⚡ Auto-przydział
          </button>
          <button className="add-car-btn" onClick={() => setShowAddForm(!showAddForm)}>
            + Dodaj auto
          </button>
          <button className="history-btn" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '📋 Kolejka' : '📊 Historia'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="add-car-form">
          <h3>Dodaj auto do kolejki</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Marka (np. BMW)"
              value={newCar.brand}
              onChange={(e) => setNewCar({...newCar, brand: e.target.value})}
            />
            <input
              type="text"
              placeholder="Model (np. X5)"
              value={newCar.model}
              onChange={(e) => setNewCar({...newCar, model: e.target.value})}
            />
            <input
              type="text"
              placeholder="VIN"
              value={newCar.vin}
              onChange={(e) => setNewCar({...newCar, vin: e.target.value})}
            />
            <select value={newCar.size} onChange={(e) => setNewCar({...newCar, size: e.target.value})}>
              <option value="małe">Małe</option>
              <option value="średnie">Średnie</option>
              <option value="duże">Duże</option>
            </select>
          </div>
          <div className="form-buttons">
            <button className="save-btn" onClick={addCar}>Dodaj</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      {!showHistory ? (
        <div className="queue-view">
          <div className="detailers-grid">
            {detailers.map(detailer => {
              const queue = getQueueByDetailer(detailer);
              const stats = getStatsByDetailer(detailer);
              
              return (
                <div key={detailer} className="detailer-column">
                  <div className="detailer-header">
                    <h3>{detailer}</h3>
                    <div className="detailer-stats">
                      <span>W kolejce: {queue.length}</span>
                      <span className="stats-breakdown">
                        Wykonane: {stats.total} (M:{stats.małe} Ś:{stats.średnie} D:{stats.duże})
                      </span>
                    </div>
                  </div>

                  <div className="cars-list">
                    {queue.length === 0 && (
                      <div className="empty-queue">Brak aut w kolejce</div>
                    )}
                    {queue.map((car, idx) => (
                      <div key={car.id} className={`car-card size-${car.size}`}>
                        <div className="car-info">
                          <div className="car-number">#{idx + 1}</div>
                          <div className="car-details">
                            <strong>{car.brand} {car.model}</strong>
                            <span className="car-vin">VIN: {car.vin}</span>
                            <span className={`car-size ${car.size}`}>
                              {car.size === 'małe' && '🚗'} 
                              {car.size === 'średnie' && '🚙'}
                              {car.size === 'duże' && '🚐'}
                              {' '}{car.size.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="car-actions">
                          <button 
                            className="reassign-btn"
                            onClick={() => setManualAssignment(car.id)}
                          >
                            ↔️
                          </button>
                          <button 
                            className="complete-btn"
                            onClick={() => completeCar(car.id, detailer)}
                          >
                            ✓ Gotowe
                          </button>
                        </div>
                        
                        {manualAssignment === car.id && (
                          <div className="reassign-popup">
                            <p>Przypisz do:</p>
                            {detailers.map(d => (
                              <button key={d} onClick={() => manualAssign(car.id, d)}>
                                {d}
                              </button>
                            ))}
                            <button onClick={() => setManualAssignment(null)}>✕</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {waitingCars.filter(c => !c.assigned_to).length > 0 && (
            <div className="unassigned-section">
              <h3>⚠️ Nieprzypisane auta ({waitingCars.filter(c => !c.assigned_to).length})</h3>
              <p>Kliknij "⚡ Auto-przydział" aby automatycznie rozdzielić</p>
              <div className="unassigned-list">
                {waitingCars.filter(c => !c.assigned_to).map(car => (
                  <div key={car.id} className="unassigned-car">
                    {car.brand} {car.model} - {car.size}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="history-view">
          <h3>📊 Historia wykonanych aut (Luty 2026)</h3>
          
          <div className="history-stats">
            {detailers.map(detailer => {
              const stats = getStatsByDetailer(detailer);
              return (
                <div key={detailer} className="detailer-history-card">
                  <h4>{detailer}</h4>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Razem:</span>
                      <span className="stat-value">{stats.total}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🚗 Małe:</span>
                      <span className="stat-value">{stats.małe}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🚙 Średnie:</span>
                      <span className="stat-value">{stats.średnie}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">🚐 Duże:</span>
                      <span className="stat-value">{stats.duże}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="completed-list">
            <h4>Ostatnio ukończone:</h4>
            {completedCars.slice().reverse().map(car => (
              <div key={car.id} className="completed-car-card">
                <div className="completed-car-info">
                  <strong>{car.brand} {car.model}</strong>
                  <span>VIN: {car.vin}</span>
                  <span className={`car-size ${car.size}`}>{car.size}</span>
                </div>
                <div className="completed-meta">
                  <span className="completed-by">👤 {car.completed_by}</span>
                  <span className="completed-time">🕐 {car.completed_at}</span>
                </div>
              </div>
            ))}
            {completedCars.length === 0 && (
              <div className="empty-state">Brak ukończonych aut</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailingQueue;