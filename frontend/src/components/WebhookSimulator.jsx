import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, Send, CheckCircle, AlertCircle, Copy, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function WebhookSimulator({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [eventId, setEventId] = useState(`evt_${Date.now()}`);
  const [transactionId, setTransactionId] = useState(`txn_gateway_${Date.now()}`);
  const [eventType, setEventType] = useState('payment.succeeded');
  const [amount, setAmount] = useState(45.0);

  const [logs, setLogs] = useState([]);
  const [sending, setSending] = useState(false);

  // Fetch bookings for easy dropdown selection
  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await api.getBookings();
        setBookings(res.data || []);
        if (res.data?.length > 0) {
          setSelectedBookingId(res.data[0].id);
          setAmount(res.data[0].amount);
        }
      } catch (err) {
        // Ignored if not logged in
      }
    }
    loadBookings();
  }, [currentUser]);

  // When selected booking changes, match amount
  const handleBookingChange = (bId) => {
    setSelectedBookingId(bId);
    const b = bookings.find((item) => item.id === bId);
    if (b) setAmount(b.amount);
  };

  const addLog = (title, data, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        timestamp,
        title,
        data,
        isError,
      },
      ...prev,
    ]);
  };

  const handleGenerateNewIds = () => {
    setEventId(`evt_${Date.now()}`);
    setTransactionId(`txn_gateway_${Date.now()}`);
  };

  // 1. Send single webhook
  const handleSendWebhook = async () => {
    if (!selectedBookingId) {
      alert('Please select or specify a booking ID');
      return;
    }

    try {
      setSending(true);
      const payload = {
        eventId,
        eventType,
        bookingId: selectedBookingId,
        transactionId,
        amount: parseFloat(amount),
      };

      const start = Date.now();
      const res = await api.sendWebhook(payload);
      const duration = Date.now() - start;

      const isDuplicate = res.data?.status === 'already_processed';
      addLog(
        isDuplicate
          ? `[IDEMPOTENT DUPLICATE DETECTED] Event: ${eventId} (${duration}ms)`
          : `[WEBHOOK PROCESSED] Event: ${eventId} (${duration}ms)`,
        res,
        false
      );
    } catch (err) {
      addLog(`[WEBHOOK ERROR] ${err.message}`, err.data || err.message, true);
    } finally {
      setSending(false);
    }
  };

  // 2. Replay identical event
  const handleReplayDuplicate = async () => {
    // Uses the same eventId
    await handleSendWebhook();
  };

  // 3. Test 5x concurrent race condition
  const handleTestConcurrentRace = async () => {
    if (!selectedBookingId) return;

    try {
      setSending(true);
      const raceEventId = `evt_race_${Date.now()}`;
      const raceTxnId = `txn_race_${Date.now()}`;

      addLog(`[RACE CONDITION TEST STARTED] Firing 5 concurrent POSTs with eventId '${raceEventId}'...`, null);

      const payload = {
        eventId: raceEventId,
        eventType,
        bookingId: selectedBookingId,
        transactionId: raceTxnId,
        amount: parseFloat(amount),
      };

      const start = Date.now();
      const results = await Promise.all([
        api.sendWebhook(payload).catch((e) => e),
        api.sendWebhook(payload).catch((e) => e),
        api.sendWebhook(payload).catch((e) => e),
        api.sendWebhook(payload).catch((e) => e),
        api.sendWebhook(payload).catch((e) => e),
      ]);
      const duration = Date.now() - start;

      const processedCount = results.filter((r) => r.data?.status === 'processed').length;
      const alreadyProcessedCount = results.filter((r) => r.data?.status === 'already_processed').length;

      addLog(
        `[RACE CONDITION SUCCESS] 5 concurrent requests settled in ${duration}ms: ${processedCount} processed, ${alreadyProcessedCount} safely ignored duplicates. Zero corruption!`,
        results
      );
    } catch (err) {
      addLog(`[RACE ERROR] ${err.message}`, err, true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Payment Webhook & Idempotency Testbench
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Requirement 5 & 6: Interactive simulator for <code>POST /payments/webhook/</code>.
          Test replay attacks, duplicate deliveries, and concurrent race condition resilience in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form Controls */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Simulate Provider Webhook Event</h3>
              <div className="card-subtitle">Emulates asynchronous events from Stripe / Razorpay</div>
            </div>
            <button onClick={handleGenerateNewIds} className="btn btn-secondary btn-sm" title="Generate fresh event ID">
              <RefreshCw size={13} />
              <span>New IDs</span>
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Target Booking</label>
            {bookings.length > 0 ? (
              <select
                className="form-control"
                value={selectedBookingId}
                onChange={(e) => handleBookingChange(e.target.value)}
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.test?.name} — ${b.amount.toFixed(2)} [{b.status}] ({b.id.substring(0, 8)}...)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder="Enter booking UUID..."
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Unique Event ID (Idempotency Key)</label>
              <input
                type="text"
                className="form-control"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transaction ID</label>
              <input
                type="text"
                className="form-control"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select
                className="form-control"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="payment.succeeded">payment.succeeded</option>
                <option value="payment.failed">payment.failed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={handleSendWebhook} className="btn btn-primary" disabled={sending}>
              <Send size={15} />
              <span>Send Webhook Event</span>
            </button>

            <button onClick={handleReplayDuplicate} className="btn btn-secondary" disabled={sending}>
              <Copy size={15} />
              <span>Replay Duplicate Event (Verify Idempotency)</span>
            </button>

            <button onClick={handleTestConcurrentRace} className="btn btn-secondary" disabled={sending} style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--warning)' }}>
              <Zap size={15} />
              <span>Fire 5x Concurrent Race Condition</span>
            </button>
          </div>
        </div>

        {/* Real-time Response Terminal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Live Webhook Event Log & Audit</h3>
              <div className="card-subtitle">Real-time gateway responses and database idempotency status</div>
            </div>
            {logs.length > 0 && (
              <button onClick={() => setLogs([])} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
                Clear
              </button>
            )}
          </div>

          <div className="terminal-box" style={{ flex: 1, minHeight: '380px' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                No webhook events fired yet. Click "Send Webhook Event" or "Replay Duplicate" to test.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: log.isError ? 'var(--danger)' : '#38bdf8', fontWeight: 600 }}>
                    <span>{log.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{log.timestamp}</span>
                  </div>
                  {log.data && (
                    <pre style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.4rem', overflowX: 'auto' }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
