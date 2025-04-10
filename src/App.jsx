import React, { useState, useEffect } from 'react';
import { Calculator, Clock, DollarSign, Moon, LogIn, LogOut, User } from 'lucide-react';
import './App.css';
import { supabase } from './lib/supabaseCliente';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horasExtras, setHorasExtras] = useState('');
  const [sueldoBase, setSueldoBase] = useState('');
  const [tipoHoras, setTipoHoras] = useState('diurnas');

  const valorHora = sueldoBase ? parseFloat(sueldoBase) * 0.0079545 : 0;

  // Efecto para manejar la sesión del usuario
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setLoading(true);
        
        // Verificar sesión al cargar
        const { data: { session } } = await supabase.auth.getSession();
        
        // Manejar redirección después de login
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        if (session) {
          setUser(session.user);
          await getRegistros(session.user.id);
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        await getRegistros(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRegistros([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Obtener registros del usuario
  const getRegistros = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('horas_extras')
        .select('*')
        .eq('usuario_id', userId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Error al obtener registros:', error);
    }
  };

  // Manejar login con Google
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      alert('Error al iniciar sesión. Por favor intenta nuevamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Manejar logout
  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setRegistros([]);
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      alert('Error al cerrar sesión. Por favor intenta nuevamente.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Agregar nuevo registro
  const agregarRegistro = async (e) => {
    e.preventDefault();
    if (!fecha || !horasExtras || !sueldoBase) return;

    try {
      const nuevoRegistro = {
        usuario_id: user.id,
        fecha,
        horas: parseFloat(horasExtras),
        sueldo_base: parseFloat(sueldoBase),
        valor_hora: valorHora,
        total_pago: parseFloat(horasExtras) * valorHora,
        tipo_horas: tipoHoras,
        estado: 'pendiente'
      };

      const { data, error } = await supabase
        .from('horas_extras')
        .insert([nuevoRegistro])
        .select();

      if (error) throw error;
      
      setRegistros([data[0], ...registros]);
      setHorasExtras('');
      setSueldoBase('');
    } catch (error) {
      console.error('Error al agregar registro:', error);
      alert('Error al guardar el registro. Por favor intenta nuevamente.');
    }
  };

  // Funciones de ayuda
  const calcularTotal = () => registros.reduce((acc, r) => acc + r.total_pago, 0);
  const totalHoras = registros.reduce((acc, r) => acc + r.horas, 0);
  const formatCLP = (amount) => new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount);

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Calculadora de Horas Extras</h1>
          <p>Inicia sesión para acceder a tu calculadora</p>
          <button 
            onClick={handleLogin} 
            className="login-button"
            disabled={authLoading}
          >
            {authLoading ? 'Cargando...' : (
              <>
                <LogIn className="button-icon" />
                Iniciar sesión con Google
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Moon className="icon" />
            <h1>Calculadora de Horas Extras</h1>
          </div>
          <div className="user-info">
            <img 
              src={user.user_metadata?.avatar_url} 
              alt="Avatar" 
              className="user-avatar"
              referrerPolicy="no-referrer"
            />
            <span>{user.email}</span>
            <button 
              onClick={handleLogout} 
              className="logout-button"
              disabled={authLoading}
            >
              {authLoading ? 'Cerrando...' : (
                <>
                  <LogOut className="button-icon" />
                  Cerrar sesión
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="calculator-card">
          <form onSubmit={agregarRegistro} className="form-container">
            <div className="input-group">
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Horas Extras</label>
              <input
                type="number"
                value={horasExtras}
                onChange={(e) => setHorasExtras(e.target.value)}
                placeholder="Cantidad de horas"
                step="0.5"
                min="0"
                required
              />
            </div>
            <div className="input-group">
              <label>Sueldo Base (CLP)</label>
              <input
                type="number"
                value={sueldoBase}
                onChange={(e) => setSueldoBase(e.target.value)}
                placeholder="Ingresa tu sueldo base"
                required
              />
            </div>
            <div className="input-group">
              <label>Tipo de Horas</label>
              <select
                value={tipoHoras}
                onChange={(e) => setTipoHoras(e.target.value)}
                className="hours-select"
              >
                <option value="diurnas">Diurnas</option>
                <option value="nocturnas">Nocturnas</option>
                <option value="festivas">Festivas</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>
            <button type="submit" className="submit-button">
              <Calculator className="button-icon" />
              Agregar Registro
            </button>
          </form>

          {registros.length > 0 && (
            <div className="results-container">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Horas</th>
                      <th>Tipo</th>
                      <th>Valor Hora</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((registro, index) => (
                      <tr key={index}>
                        <td>{registro.fecha}</td>
                        <td>{registro.horas}</td>
                        <td>{registro.tipo_horas}</td>
                        <td>{formatCLP(registro.valor_hora)}</td>
                        <td className="highlight">{formatCLP(registro.total_pago)}</td>
                        <td>
                          <span className={`status-badge ${registro.estado}`}>
                            {registro.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="summary">
                <div className="summary-item">
                  <Clock className="summary-icon" />
                  <span>Total Horas: <span className="highlight">{totalHoras}</span></span>
                </div>
                <div className="summary-item">
                  <DollarSign className="summary-icon" />
                  <span>Total a Pagar: <span className="highlight">{formatCLP(calcularTotal())}</span></span>
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