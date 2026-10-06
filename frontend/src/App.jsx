import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

export default function App() {
  const [formData, setFormData] = useState({
    crop_type: 'Wheat',
    soil_ph: 6.5,
    rainfall: 800,
    temperature: 24.5,
    fertilizer: 120,
    target_yield: 4.0
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/history');
      const formatted = res.data.reverse().map((item, index) => ({
        name: `Entry ${index + 1}`,
        predicted: item.predicted_yield,
        target: item.target_yield,
        crop: item.crop_type
      }));
      setHistory(formatted);
    } catch (err) {
      console.error("Could not fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'crop_type' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/predict', formData);
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Backend connection failed. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const farmPlots = [
    { id: 1, name: "North Field Plot A", lat: 18.5204, lng: 73.8567, status: "Optimal", color: "green" },
    { id: 2, name: "East Terrace Plot B", lat: 18.5300, lng: 73.8700, status: "Moderate Deficit", color: "orange" },
    { id: 3, name: "South Valley Plot C", lat: 18.5100, lng: 73.8400, status: "Low Yield Alert", color: "red" }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, sans-serif', color: '#1f2937' }}>
      <header style={{ marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '28px', margin: 0, color: '#166534' }}>🌱 Crop Yield Prediction & Advisory Platform</h1>
        <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>Optimize harvests with machine learning-driven recommendations</p>
      </header>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <section style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '16px' }}>Input Farm Conditions</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Crop Type</label>
              <select 
                name="crop_type" 
                value={formData.crop_type} 
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="Wheat">Wheat</option>
                <option value="Rice">Rice</option>
                <option value="Maize">Maize</option>
                <option value="Barley">Barley</option>
                <option value="Soybean">Soybean</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Soil pH (0 - 14)</label>
                <input type="number" step="0.1" name="soil_ph" value={formData.soil_ph} onChange={handleChange} required style={{ width: '90%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Rainfall (mm)</label>
                <input type="number" step="1" name="rainfall" value={formData.rainfall} onChange={handleChange} required style={{ width: '90%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Temperature (°C)</label>
                <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} required style={{ width: '90%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Fertilizer (kg/ha)</label>
                <input type="number" step="1" name="fertilizer" value={formData.fertilizer} onChange={handleChange} required style={{ width: '90%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Target Yield (Tonnes/Hectare)</label>
              <input type="number" step="0.1" name="target_yield" value={formData.target_yield} onChange={handleChange} style={{ width: '95%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ marginTop: '8px', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              {loading ? "Analyzing Field Data..." : "Run Yield Prediction"}
            </button>
          </form>
        </section>

        <section style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '16px' }}>Advisory & Results</h2>
          {result ? (
            <div>
              <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', color: '#166534', fontWeight: 600 }}>Predicted Harvest</span>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14532d' }}>
                  {result.predicted_yield_tonnes_per_hectare} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>t/ha</span>
                </div>
              </div>

              {result.alert && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                  {result.alert}
                </div>
              )}

              <h4 style={{ margin: '12px 0 8px 0', fontSize: '16px' }}>Agronomic Recommendations:</h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {result.recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: '6px', fontSize: '14px', color: '#374151' }}>{rec}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Fill out the conditions on the left and click "Run Yield Prediction" to generate advice.</p>
          )}
        </section>
      </div>

      <section style={{ marginTop: '32px', background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '16px' }}>Historical Yield Trend Comparison</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit=" t/ha" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="#16a34a" strokeWidth={2} name="Predicted Yield" />
              <Line type="monotone" dataKey="target" stroke="#2563eb" strokeDasharray="5 5" name="Target Yield" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section style={{ marginTop: '32px', background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', marginTop: 0, marginBottom: '16px' }}>Farm Plot Overview (Leaflet)</h2>
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer center={[18.5204, 73.8567]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {farmPlots.map(plot => (
              <CircleMarker
                key={plot.id}
                center={[plot.lat, plot.lng]}
                radius={12}
                pathOptions={{ color: plot.color, fillColor: plot.color, fillOpacity: 0.7 }}
              >
                <Popup>
                  <strong>{plot.name}</strong><br />
                  Yield Status: {plot.status}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>
    </div>
  );
}