import React, { useState, useEffect } from 'react';
import './AutoDNAReports.css';
import { supabase } from '../supabaseClient';

function AutoDNAReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVin, setSearchVin] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReport, setNewReport] = useState({ vin: '', brand: '', model: '', report_link: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('autodna_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data);
    }
    setLoading(false);
  };

  const addReport = async () => {
    if (newReport.vin && newReport.brand && newReport.model && newReport.report_link) {
      const { error } = await supabase
        .from('autodna_reports')
        .insert([{
          ...newReport,
          added_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) {
        console.error('Error adding report:', error);
      } else {
        fetchReports();
        setNewReport({ vin: '', brand: '', model: '', report_link: '' });
        setShowAddForm(false);
      }
    }
  };

  const deleteReport = async (id) => {
    const { error } = await supabase
      .from('autodna_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting report:', error);
    } else {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  const filteredReports = reports.filter(r =>
    r.vin.toLowerCase().includes(searchVin.toLowerCase()) ||
    r.brand.toLowerCase().includes(searchVin.toLowerCase()) ||
    r.model.toLowerCase().includes(searchVin.toLowerCase())
  );

  if (loading) {
    return <div className="autodna-container"><p>Ładowanie...</p></div>;
  }

  return (
    <div className="autodna-container">
      <div className="autodna-header">
        <h2>📊 Raporty AutoDNA</h2>
        <button className="add-report-btn" onClick={() => setShowAddForm(!showAddForm)}>
          + Dodaj raport
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Szukaj po VIN, marce lub modelu..."
          value={searchVin}
          onChange={(e) => setSearchVin(e.target.value)}
        />
      </div>

      {showAddForm && (
        <div className="add-report-form">
          <h3>Dodaj nowy raport</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="VIN"
              value={newReport.vin}
              onChange={(e) => setNewReport({...newReport, vin: e.target.value})}
            />
            <input
              type="text"
              placeholder="Marka"
              value={newReport.brand}
              onChange={(e) => setNewReport({...newReport, brand: e.target.value})}
            />
            <input
              type="text"
              placeholder="Model"
              value={newReport.model}
              onChange={(e) => setNewReport({...newReport, model: e.target.value})}
            />
            <input
              type="text"
              placeholder="Link do raportu AutoDNA"
              value={newReport.report_link}
              onChange={(e) => setNewReport({...newReport, report_link: e.target.value})}
            />
          </div>
          <div className="form-buttons">
            <button className="save-btn" onClick={addReport}>Dodaj</button>
            <button className="cancel-btn" onClick={() => setShowAddForm(false)}>Anuluj</button>
          </div>
        </div>
      )}

      <div className="reports-grid">
        {filteredReports.map(report => (
          <div key={report.id} className="report-card">
            <div className="report-header">
              <div className="car-info">
                <h3>{report.brand} {report.model}</h3>
                <span className="vin-badge">{report.vin}</span>
              </div>
              <button className="delete-report" onClick={() => deleteReport(report.id)}>×</button>
            </div>
            <div className="report-date">
              Dodano: {new Date(report.added_date).toLocaleDateString('pl-PL')}
            </div>
            <a 
              href={report.report_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="open-report-btn"
            >
              📄 Otwórz raport AutoDNA
            </a>
          </div>
        ))}
        {filteredReports.length === 0 && (
          <div className="empty-state">
            {searchVin ? 'Nie znaleziono raportów' : 'Brak raportów'}
          </div>
        )}
      </div>

      <div className="autodna-info">
        <h4>💡 Jak dodać raport?</h4>
        <ol>
          <li>Wejdź na <a href="https://autodna.pl" target="_blank" rel="noopener noreferrer">autodna.pl</a></li>
          <li>Zaloguj się na firmowe konto</li>
          <li>Wklej VIN i wygeneruj raport</li>
          <li>Skopiuj link do raportu i dodaj tutaj</li>
        </ol>
      </div>
    </div>
  );
}

export default AutoDNAReports;