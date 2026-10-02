import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle, RefreshCw, X, ShieldAlert, Clock } from 'lucide-react';
import { api } from '../api';

export default function MyBookings({ currentUser, onOpenAuth }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Modal State
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [simulateStatus, setSimulateStatus] = useState('SUCCESS');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const fetchBookings = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getBookings();
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  const handleCancel = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(bookingId);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalBooking) return;

    try {
      setProcessingPayment(true);
      const res = await api.simulatePayment({
        bookingId: paymentModalBooking.id,
        paymentMethod,
        simulateStatus,
      });

      setPaymentResult(res.data);
      await fetchBookings();
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const closePaymentModal = () => {
    setPaymentModalBooking(null);
    setPaymentResult(null);
  };

  if (!currentUser) {
    return (
      <div className="card" style={{ maxWidth: '500px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <ShieldAlert size={48} color="var(--warning)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Authentication Required</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Please sign in to view your scheduled diagnostic appointments and proceed with payments.
        </p>
        <button onClick={onOpenAuth} className="btn btn-primary">
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            My Diagnostic Bookings
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage appointments, inspect current booking status, and process simulated payments.
          </p>
        </div>

        <button onClick={fetchBookings} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'pulse-dot' : ''} />
          <span>Refresh</span>
        </button>
      </div>

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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', marginBottom: '1rem' }}></div>
          <p>Loading your appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Bookings Yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            You haven't scheduled any diagnostic tests yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map((booking) => {
            const appointmentDate = new Date(booking.appointmentTime);
            const statusClass = `badge-${booking.status.toLowerCase()}`;

            return (
              <div key={booking.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {booking.test?.name}
                      </h3>
                      <span className={`badge ${statusClass}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Centre: <strong style={{ color: 'var(--text-primary)' }}>{booking.centre?.name}</strong> ({booking.centre?.city})
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {appointmentDate.toLocaleDateString()} at {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>Booking ID: <code style={{ color: 'var(--text-secondary)' }}>{booking.id.substring(0, 8)}...</code></span>
                    </div>

                    {booking.notes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Notes: "{booking.notes}"
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                      ${booking.amount.toFixed(2)}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {booking.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setPaymentModalBooking(booking)}
                            className="btn btn-primary btn-sm"
                          >
                            <CreditCard size={14} />
                            <span>Simulate Pay</span>
                          </button>

                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger)' }}
                          >
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {booking.status === 'CONFIRMED' && (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Paid & Confirmed
                        </span>
                      )}

                      {booking.status === 'FAILED' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={14} /> Payment Failed
                        </span>
                      )}

                      {booking.status === 'CANCELLED' && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simulated Payment Modal */}
      {paymentModalBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={closePaymentModal}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Simulate Payment Processing
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Requirement 4: Mock payment endpoint (<code>POST /payments/</code>).
            </p>

            {paymentResult ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                {paymentResult.payment.status === 'SUCCESS' ? (
                  <CheckCircle size={56} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
                ) : (
                  <XCircle size={56} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                )}

                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Payment {paymentResult.payment.status}!
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Booking status updated to <span className={`badge badge-${paymentResult.booking.status.toLowerCase()}`}>{paymentResult.booking.status}</span>.
                </p>

                <div className="terminal-box" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div>Transaction ID: {paymentResult.payment.transactionId}</div>
                  <div>Amount: ${paymentResult.payment.amount.toFixed(2)}</div>
                  <div>Method: {paymentResult.payment.paymentMethod}</div>
                  <div>Provider Ref: {paymentResult.payment.providerReference}</div>
                  {paymentResult.payment.errorMessage && (
                    <div style={{ color: 'var(--danger)' }}>Decline Reason: {paymentResult.payment.errorMessage}</div>
                  )}
                </div>

                <button onClick={closePaymentModal} className="btn btn-primary btn-full">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Booking:</span>
                    <span>{paymentModalBooking.test?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Facility:</span>
                    <span>{paymentModalBooking.centre?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>Payable Total:</span>
                    <strong style={{ color: '#10b981', fontSize: '1rem' }}>${paymentModalBooking.amount.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI (Instant settlement)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="SIMULATED">Simulated Gateway</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Simulate Outcome (For Evaluation & Testing)</label>
                  <select
                    className="form-control"
                    value={simulateStatus}
                    onChange={(e) => setSimulateStatus(e.target.value)}
                  >
                    <option value="SUCCESS">SUCCESS (Transitions booking to CONFIRMED)</option>
                    <option value="FAILED">FAILED (Transitions booking to FAILED)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={processingPayment}>
                  <span>{processingPayment ? 'Processing Transaction...' : `Simulate Pay $${paymentModalBooking.amount.toFixed(2)}`}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
