import React, { useState } from 'react';
import { Calculator, Clock, DollarSign, Moon } from 'lucide-react';
import './App.css'

function App() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [baseSalary, setBaseSalary] = useState('');

  const hourlyRate = baseSalary ? parseFloat(baseSalary) * 0.0079545 : 0;

  const addEntry = (e) => {
    e.preventDefault();
    if (!date || !hours || !baseSalary) return;

    const newEntry = {
      date,
      hours: parseFloat(hours),
      hourlyRate,
    };

    setEntries([...entries, newEntry]);
    setHours('');
    setBaseSalary('');
  };

  const calculateTotal = () => {
    return entries.reduce((acc, entry) => {
      return acc + (entry.hours * entry.hourlyRate);
    }, 0);
  };

  const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);

  const formatCLP = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  return (
    <div className="app-container">
      <div className="main-container">
        <div className="calculator-card">
          <div className="header">
            <Moon className="icon" />
            <h1>Calculadora de Horas Extras</h1>
          </div>

          <form onSubmit={addEntry} className="form-container">
            <div className="input-group">
              <label>Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Horas Extras</label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Cantidad de horas"
                step="0.5"
                min="0"
                required
              />
            </div>
            <div className="input-group">
              <label>Sueldo Base</label>
              <input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="Sueldo base en CLP"
                required
              />
            </div>
            <button type="submit" className="submit-button">
              <Calculator className="button-icon" />
              Agregar Horas Extras
            </button>
          </form>

          {entries.length > 0 && (
            <div className="results-container">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Horas</th>
                      <th>Valor por Hora</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.date}</td>
                        <td>{entry.hours}</td>
                        <td>{formatCLP(entry.hourlyRate)}</td>
                        <td className="highlight">{formatCLP(entry.hours * entry.hourlyRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="summary">
                <div className="summary-item">
                  <Clock className="summary-icon" />
                  <span>Total Horas: <span className="highlight">{totalHours}</span></span>
                </div>
                <div className="summary-item">
                  <DollarSign className="summary-icon" />
                  <span>Total a Pagar: <span className="highlight">{formatCLP(calculateTotal())}</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;