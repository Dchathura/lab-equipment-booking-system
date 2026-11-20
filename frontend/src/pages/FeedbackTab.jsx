import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const getLoggedInUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed && (parsed.email || parsed.full_name || parsed.id)) {
        return {
          id: parsed.id || null,
          full_name: parsed.full_name || parsed.name || (parsed.email ? parsed.email.split('@')[0] : 'Student'),
          email: (parsed.email || '').toLowerCase(),
          role: parsed.role || 'STUDENT'
        };
      }
    }
  } catch (e) {
    console.error(e);
  }

  try {
    const token = localStorage.getItem('token');
    if (token && token.split('.').length === 3) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id || null,
        full_name: payload.full_name || (payload.email ? payload.email.split('@')[0] : 'Student'),
        email: (payload.email || '').toLowerCase(),
        role: payload.role || 'STUDENT'
      };
    }
  } catch (e) {
    console.error(e);
  }

  return { id: null, full_name: 'Student', email: '', role: 'STUDENT' };
};

export default function FeedbackTab({ isAdmin }) {
  const currentUser = useMemo(() => getLoggedInUser(), []);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [category, setCategory] = useState('Equipment Condition');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const [history, setHistory] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const normalizeRecord = (row) => ({
    id: row.id,
    user_id: row.user_id ?? null,
    userEmail: (row.user_email || row.email || '').toLowerCase(),
    studentName: row.student_name || row.studentName || 'Unknown User',
    target: row.target_equipment || row.target || 'General Lab Feedback',
    category: row.category || 'Equipment Condition',
    rating: Number(row.rating) || 5,
    comment: row.observations || row.comment || '',
    status: row.status || 'Pending Review',
    date: row.created_at ? String(row.created_at).split('T')[0] : (row.date || new Date().toISOString().split('T')[0])
  });

  const fetchFeedbacks = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const res = await axios.get(`${API_BASE}/api/feedbacks`, getAuthConfig());
      const rows = Array.isArray(res.data) ? res.data.map(normalizeRecord) : [];
      setHistory(rows);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setErrorText(err.response?.data?.error || 'Could not load feedback records from server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentList = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/equipment`);
      if (Array.isArray(res.data)) {
        setEquipmentOptions(res.data);
      }
    } catch (err) {
      console.error('Equipment list load skipped:', err);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchEquipmentList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || submitting) return;

    setSubmitting(true);
    setErrorText('');

    const displayName = currentUser.full_name || (currentUser.email ? currentUser.email.split('@')[0] : 'Student');
    const payload = {
      user_id: currentUser.id,
      user_email: currentUser.email,
      student_name: displayName,
      target_equipment: selectedEquipment || 'General Lab Feedback',
      category,
      rating,
      observations: comment.trim()
    };

    try {
      const res = await axios.post(`${API_BASE}/api/feedbacks`, payload, getAuthConfig());
      const created = normalizeRecord({
        ...res.data,
        user_id: res.data?.user_id ?? currentUser.id,
        user_email: currentUser.email,
        student_name: res.data?.student_name || displayName
      });
      setHistory((prev) => [created, ...prev]);
      setSubmitted(true);
      setComment('');
      setSelectedEquipment('');
      setRating(5);
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error('Submit feedback failed:', err);
      setErrorText(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`${API_BASE}/api/feedbacks/${id}/review`, { status: newStatus }, getAuthConfig());
      setHistory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      console.error('Status update failed:', err);
      setErrorText(err.response?.data?.error || 'Failed to update feedback status.');
    }
  };

  // Filter records: Admin sees all; Students see ONLY their own submitted feedbacks
  const visibleRecords = useMemo(() => {
    return history.filter((item) => {
      if (!isAdmin) {
        const matchesId =
          currentUser.id !== null &&
          item.user_id !== null &&
          Number(item.user_id) === Number(currentUser.id);
        const matchesEmail =
          currentUser.email &&
          item.userEmail &&
          item.userEmail === currentUser.email;
        const matchesNameFallback =
          !matchesId &&
          !matchesEmail &&
          item.user_id === null &&
          currentUser.full_name &&
          item.studentName.toLowerCase() === currentUser.full_name.toLowerCase();

        if (!matchesId && !matchesEmail && !matchesNameFallback) {
          return false;
        }
      }

      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const hay = `${item.studentName} ${item.userEmail} ${item.target} ${item.category} ${item.comment}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [history, isAdmin, currentUser, statusFilter, searchTerm]);

  const pendingCount = useMemo(
    () => visibleRecords.filter((i) => i.status === 'Pending Review').length,
    [visibleRecords]
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      {/* --- Page Header --- */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        padding: '28px',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ 
              backgroundColor: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
              color: isAdmin ? '#fca5a5' : '#93c5fd', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: '700',
              letterSpacing: '0.5px'
            }}>
              {isAdmin ? 'ADMINISTRATOR CONTROL' : `STUDENT PORTAL • ${currentUser.full_name.toUpperCase()}`}
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginTop: '10px', marginBottom: '6px' }}>
              💬 {isAdmin ? 'Laboratory Feedback Management' : 'Student Lab & Equipment Feedback'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              {isAdmin 
                ? 'Review, monitor, and resolve student feedback regarding laboratory hardware and operational facilities.' 
                : 'Submit operational feedback, report hardware anomalies, or rate overall laboratory resource availability.'}
            </p>
          </div>
          {currentUser.email && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#e2e8f0'
            }}>
              Signed in as <strong>{currentUser.full_name}</strong> ({currentUser.email})
            </div>
          )}
        </div>
      </div>

      {errorText && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          ⚠️ {errorText}
        </div>
      )}

      {/* --- Student Submit Form (Only for Students) --- */}
      {!isAdmin && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '28px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
            📝 Submit New Feedback
          </h3>

          {submitted && (
            <div style={{
              padding: '14px 18px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✅</span> Feedback successfully submitted under <strong>{currentUser.full_name}</strong>! Thank you for helping us improve our lab standards.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                  Target Equipment (Optional)
                </label>
                <select 
                  value={selectedEquipment} 
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' }}
                >
                  <option value="">-- General Laboratory Feedback --</option>
                  {equipmentOptions.length > 0 ? (
                    equipmentOptions.map((eq) => (
                      <option key={eq.id} value={eq.name}>
                        {eq.name} ({eq.serial_number})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="STM32F4 Discovery Board">STM32F4 Discovery Board</option>
                      <option value="Digital Oscilloscope">Digital Oscilloscope</option>
                      <option value="Function Generator">Function Generator</option>
                      <option value="DC Power Supply Unit">DC Power Supply Unit</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                  Feedback Category
                </label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' }}
                >
                  <option value="Equipment Condition">🔬 Equipment Condition & Hardware Defect</option>
                  <option value="Lab Environment">🏛️ Laboratory Facilities & Safety</option>
                  <option value="Technical Support">👨‍🏫 Technical Guidance & Support</option>
                </select>
              </div>

            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Operational Rating
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '26px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      onClick={() => setRating(star)}
                      style={{ 
                        color: star <= rating ? '#f59e0b' : '#cbd5e1', 
                        marginRight: '6px', 
                        transition: 'color 0.2s ease' 
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginLeft: '8px' }}>
                  ({rating} / 5 Stars)
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Detailed Observations or Comments
              </label>
              <textarea 
                rows="4" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe any technical issues, missing accessories, or operational feedback..."
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  outline: 'none', 
                  fontSize: '14px', 
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                padding: '12px 28px', 
                backgroundColor: submitting ? '#93c5fd' : '#2563eb', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: '600', 
                cursor: submitting ? 'not-allowed' : 'pointer', 
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* --- Feedback Records Table --- */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            {isAdmin ? '📋 Submitted Student Feedback Logs' : '📜 My Feedback History'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            {pendingCount > 0 && (
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                Pending: {pendingCount}
              </span>
            )}
            <span>
              Total Records: <strong>{visibleRecords.length}</strong>
            </span>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAdmin ? 'Search by student name, equipment, or comment...' : 'Search your feedback history...'}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              backgroundColor: '#f8fafc',
              outline: 'none'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Reviewed">Reviewed</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                {isAdmin && <th style={{ padding: '12px 16px', fontWeight: '600' }}>Student</th>}
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Target / Equipment</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Rating</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Observations</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                {isAdmin && <th style={{ padding: '12px 16px', fontWeight: '600' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Loading feedback records...
                  </td>
                </tr>
              ) : visibleRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    {isAdmin
                      ? 'No student feedback records found.'
                      : 'You have not submitted any feedback yet.'}
                  </td>
                </tr>
              ) : (
                visibleRecords.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' }}>
                    {isAdmin && (
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#0f172a' }}>
                        <div>{item.studentName}</div>
                        {item.userEmail && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>{item.userEmail}</div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '14px 16px', fontWeight: '500', color: '#334155' }}>
                      {item.target}
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.date}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#334155' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#f59e0b', fontSize: '15px', whiteSpace: 'nowrap' }}>
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '300px', lineHeight: '1.4' }}>
                      {item.comment}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        backgroundColor: item.status === 'Reviewed' ? '#dcfce7' : '#fef3c7', 
                        color: item.status === 'Reviewed' ? '#15803d' : '#b45309', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '700',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '14px 16px' }}>
                        {item.status === 'Pending Review' ? (
                          <button 
                            onClick={() => handleStatusChange(item.id, 'Reviewed')}
                            style={{ 
                              padding: '6px 14px', 
                              backgroundColor: '#16a34a', 
                              color: '#ffffff', 
                              border: 'none', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              cursor: 'pointer', 
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Mark Reviewed
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}