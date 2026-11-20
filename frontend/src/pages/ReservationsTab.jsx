import React from 'react';
import { styles } from '../components/DynamicStyles';

const toLocalInputValue = (dateObj) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
};

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

const ReservationsTab = ({
  isAdmin,
  selectedEquipment,
  setSelectedEquipment,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  handleBookingSubmit,
  equipment,
  userBookings,
  handleUpdateStatus,
  handleCancelBooking,
  handleHandoverEquipment,
  handleConfirmReturn,
  errorMsg,
  successMsg
}) => {
  const nowDate = new Date();
  const minStartStr = toLocalInputValue(nowDate);

  const parsedStart = startTime ? new Date(startTime) : nowDate;
  const validStart = Number.isNaN(parsedStart.getTime()) ? nowDate : parsedStart;
  const minEndStr = toLocalInputValue(validStart);
  const maxEndStr = toLocalInputValue(new Date(validStart.getTime() + TWO_WEEKS_MS));

  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    if (!newStart || !endTime) return;

    const sDate = new Date(newStart);
    const eDate = new Date(endTime);
    if (!Number.isNaN(sDate.getTime()) && !Number.isNaN(eDate.getTime())) {
      if (eDate <= sDate || eDate.getTime() - sDate.getTime() > TWO_WEEKS_MS) {
        setEndTime('');
      }
    }
  };

  return (
    <>
      {!isAdmin && (
        <div style={styles.lightTechCardSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <h3 style={{ ...styles.cardTitleLight, margin: 0 }}>📅 Reserve Equipment</h3>
            <span style={{ fontSize: '12px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '4px 10px', borderRadius: '12px', fontWeight: '600' }}>
              Max Duration: 2 Weeks (14 Days)
            </span>
          </div>
          {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
          {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

          <form onSubmit={handleBookingSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr', gap: '15px' }}>
            <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)} required style={styles.lightInputField}>
              <option value="">Select Equipment...</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={startTime}
              min={minStartStr}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
              style={styles.lightInputField}
            />
            <input
              type="datetime-local"
              value={endTime}
              min={minEndStr}
              max={maxEndStr}
              onChange={(e) => setEndTime(e.target.value)}
              required
              style={styles.lightInputField}
            />
            <button type="submit" style={styles.primaryBtn}>Submit Request</button>
          </form>
        </div>
      )}

      <div style={styles.lightTechCardSection}>
        <h3 style={styles.cardTitleLight}>
          {isAdmin ? '📋 All Student Booking Requests' : '📋 My Reservation Requests'}
        </h3>
        {isAdmin && errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
        {isAdmin && successMsg && <div style={styles.successAlert}>{successMsg}</div>}
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRowLight}>
              <th style={styles.thLight}>ID</th>
              {isAdmin && <th style={styles.thLight}>STUDENT</th>}
              <th style={styles.thLight}>EQUIPMENT</th>
              <th style={styles.thLight}>START TIME</th>
              <th style={styles.thLight}>END TIME</th>
              <th style={styles.thLight}>STATUS</th>
              <th style={styles.thLight}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {userBookings.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} style={{ ...styles.tdLight, textAlign: 'center' }}>No booking records found.</td>
              </tr>
            ) : (
              userBookings.map(b => {
                const handoverState = b.handover_status || 'NONE';

                return (
                  <tr key={b.id} style={styles.tableRowLight}>
                    <td style={styles.tdLight}>#{b.id}</td>
                    {isAdmin && <td style={styles.tdLight}><strong style={{ color: '#0f172a' }}>{b.student_name}</strong></td>}
                    <td style={styles.tdLight}>{b.equipment_name || b.equipment}</td>
                    <td style={styles.tdLight}>{new Date(b.start_time).toLocaleString()}</td>
                    <td style={styles.tdLight}>{new Date(b.end_time).toLocaleString()}</td>
                    <td style={styles.tdLight}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span style={
                          b.status === 'APPROVED' ? styles.statusApproved : 
                          b.status === 'REJECTED' || b.status === 'CANCELLED' ? styles.statusRejected : styles.statusPending
                        }>
                          {b.status}
                        </span>
                        {handoverState === 'HANDED_OVER' && (
                          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            📦 Handed Over
                          </span>
                        )}
                        {handoverState === 'CONFIRMED' && (
                          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            ✅ Return Confirmed
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tdLight}>
                      {isAdmin ? (
                        b.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateStatus(b.id, 'APPROVED')} style={styles.approveBtn}>Approve</button>
                            <button onClick={() => handleUpdateStatus(b.id, 'REJECTED')} style={styles.rejectBtn}>Reject</button>
                          </div>
                        ) : handoverState === 'HANDED_OVER' ? (
                          <button
                            type="button"
                            onClick={() => handleConfirmReturn && handleConfirmReturn(b.id)}
                            style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            ✅ Confirm Return
                          </button>
                        ) : handoverState === 'CONFIRMED' ? (
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Return Confirmed</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                        )
                      ) : (
                        b.status === 'PENDING' ? (
                          <button onClick={() => handleCancelBooking(b.id)} style={styles.cancelBookingBtn}>🚫 Cancel Request</button>
                        ) : b.status === 'APPROVED' && handoverState === 'NONE' ? (
                          <button
                            type="button"
                            onClick={() => handleHandoverEquipment && handleHandoverEquipment(b.id)}
                            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            📦 Handover Equipment
                          </button>
                        ) : handoverState === 'HANDED_OVER' ? (
                          <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>⏳ Awaiting Admin Confirm</span>
                        ) : handoverState === 'CONFIRMED' ? (
                          <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>✅ Return Confirmed</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Completed</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReservationsTab;