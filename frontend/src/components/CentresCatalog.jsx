import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Search, Stethoscope, Tag, Calendar, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function CentresCatalog({ onSelectTestForBooking }) {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [error, setError] = useState(null);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCity) params.append('city', selectedCity);

      const res = await api.getCentres(params.toString());
      setCentres(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load diagnostic centres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, [selectedCity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCentres();
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Diagnostic Centres & Test Catalog
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Browse certified diagnostic centres, compare local test rates, and schedule an appointment in seconds.
        </p>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        background: 'var(--bg-card)',
        padding: '0.85rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by centre name, test, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: '200px' }}
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">All Cities</option>
          <option value="New York">New York</option>
          <option value="Brooklyn">Brooklyn</option>
          <option value="Queens">Queens</option>
        </select>

        <button type="submit" className="btn btn-primary">
          <span>Search</span>
        </button>
      </form>

      {/* Error Notice */}
      {error && (
        <div style={{
          padding: '1rem',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--danger)',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', marginBottom: '1rem' }}></div>
          <p>Loading diagnostic centres and test pricing...</p>
        </div>
      ) : centres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <p>No diagnostic centres found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid-2">
          {centres.map((centre) => (
            <div key={centre.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{centre.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <MapPin size={15} color="var(--primary)" />
                    <span>{centre.address}, {centre.city}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Phone size={14} />
                    <span>{centre.contactNumber}</span>
                  </div>
                </div>
                <span className="badge badge-confirmed">
                  <CheckCircle2 size={12} />
                  <span>Certified</span>
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-accent)', marginBottom: '0.75rem' }}>
                  Available Diagnostic Tests ({centre.availableTests.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {centre.availableTests.map((t) => (
                    <div
                      key={t.centreTestId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {t.name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(14, 165, 233, 0.1)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                            {t.category}
                          </span>
                          {t.sampleRequired && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Sample: {t.sampleRequired}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                            ${t.price.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => onSelectTestForBooking(centre, t)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Calendar size={13} />
                          <span>Book</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
