import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Stethoscope, Building, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function BookingForm({ currentUser, initialCentre, initialTest, onBookingCreated, onOpenAuth }) {
  const [centres, setCentres] = useState([]);
  const [selectedCentreId, setSelectedCentreId] = useState(initialCentre?.id || '');
  const [selectedTestId, setSelectedTestId] = useState(initialTest?.testId || '');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  // Set default appointment date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setAppointmentDate(dateStr);
  }, []);

  // Fetch centres on mount
  useEffect(() => {
    async function loadCentres() {
      try {
        const res = await api.getCentres();
        setCentres(res.data || []);
        if (!selectedCentreId && res.data?.length > 0) {
          setSelectedCentreId(res.data[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load centres');
      }
    }
    loadCentres();
  }, []);

  // Update selected centre/test when initial props change
  useEffect(() => {
    if (initialCentre) setSelectedCentreId(initialCentre.id);
    if (initialTest) setSelectedTestId(initialTest.testId);
  }, [initialCentre, initialTest]);

  // Find currently selected centre object
  const currentCentre = centres.find((c) => c.id === selectedCentreId);
  const availableTests = currentCentre?.availableTests || [];

  // Default to first test of selected centre if current test is not in centre
  useEffect(() => {
    if (availableTests.length > 0 && !availableTests.some((t) => t.testId === selectedTestId)) {
      setSelectedTestId(availableTests[0].testId);
    }
  }, [selectedCentreId, availableTests]);

  const currentTestOffering = availableTests.find((t) => t.testId === selectedTestId);
  const calculatedPrice = currentTestOffering?.price || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!selectedCentreId || !selectedTestId || !appointmentDate || !appointmentTime) {
      setError('Please fill in all required appointment fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construct ISO timestamp in future
      const scheduledDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
      if (scheduledDateTime <= new Date()) {
        setError('Appointment date and time must be in the future');
        setLoading(false);
        return;
      }

      const res = await api.createBooking({
        centreId: selectedCentreId,
        testId: selectedTestId,
        appointmentTime: scheduledDateTime.toISOString(),
        notes: notes.trim() || undefined,
      });

      setSuccessBooking(res.data);
      if (onBookingCreated) {
        onBookingCreated(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete booking');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccessBooking(null);
    setNotes('');
  };

  if (successBooking) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--success-bg)',
          border: '2px solid var(--success-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <CheckCircle2 size={36} color="var(--success)" />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Appointment Booked!</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Your test has been scheduled with status <span className="badge badge-pending">PENDING</span>.
          Please complete your simulated payment to confirm your slot.
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'left',
          marginBottom: '2rem',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Booking ID:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{successBooking.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Test:</span>
            <span style={{ fontWeight: 600 }}>{successBooking.test?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Centre:</span>
            <span>{successBooking.centre?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Authoritative Total:</span>
            <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>${successBooking.amount.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={resetForm} className="btn btn-secondary">
            Book Another Test
          </button>
          <button onClick={() => onBookingCreated && onBookingCreated(successBooking, true)} className="btn btn-primary">
            Go to My Bookings & Pay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Schedule a Diagnostic Test
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Select your desired medical facility, select tests, and pick a preferred appointment slot.
        </p>
      </div>

      <div className="card">
        {error && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Diagnostic Centre */}
          <div className="form-group">
            <label className="form-label">
              <Building size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Diagnostic Centre
            </label>
            <select
              className="form-control"
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              required
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Diagnostic Test */}
          <div className="form-group">
            <label className="form-label">
              <Stethoscope size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Diagnostic Test
            </label>
            <select
              className="form-control"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              required
            >
              {availableTests.length === 0 ? (
                <option disabled>No tests currently available at this centre</option>
              ) : (
                availableTests.map((t) => (
                  <option key={t.testId} value={t.testId}>
                    {t.name} — ${t.price.toFixed(2)} ({t.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date & Time Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Appointment Date
              </label>
              <input
                type="date"
                className="form-control"
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Time Slot
              </label>
              <select
                className="form-control"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              >
                <option value="08:00">08:00 AM (Early Fasting)</option>
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">02:00 PM</option>
                <option value="16:00">04:00 PM</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes / Fasting requirements */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Patient Instructions / Clinical Notes (Optional)
            </label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g., Patient is diabetic; fasting for 12 hours prior; wheelchair assistance needed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Total & Price summary box */}
          <div style={{
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Server-Authoritative Price:</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified against centre rate card</div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
              ${calculatedPrice.toFixed(2)}
            </span>
          </div>

          {currentUser ? (
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || availableTests.length === 0}>
              <span>{loading ? 'Confirming Appointment...' : 'Confirm Appointment'}</span>
            </button>
          ) : (
            <button type="button" onClick={onOpenAuth} className="btn btn-primary btn-full">
              <span>Sign In to Complete Booking</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
