import React from 'react';
import { styles } from '../components/DynamicStyles';

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
  errorMsg,
  successMsg
}) => (
  <>
    {!isAdmin && (
      <div style={styles.lightTechCardSection}>
        <h3 style={styles.cardTitleLight}>📅 Reserve Equipment</h3>
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
        {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

        <form onSubmit={handleBookingSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr', gap: '15px' }}>
          <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)} required style={styles.lightInputField}>
            <option value="">Select Equipment...</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
            ))}
          </select>
          <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required style={styles.lightInputField} />
          <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required style={styles.lightInputField} />
          <button type="submit" style={styles.primaryBtn}>Submit Request</button>
        </form>
      </div>
    )}

    <div style={styles.lightTechCardSection}>
      <h3 style={styles.cardTitleLight}>
        {isAdmin ? '📋 All Student Booking Requests' : '📋 My Reservation Requests'}
      </h3>
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
            userBookings.map(b => (
              <tr key={b.id} style={styles.tableRowLight}>
                <td style={styles.tdLight}>#{b.id}</td>
                {isAdmin && <td style={styles.tdLight}><strong style={{ color: '#0f172a' }}>{b.student_name}</strong></td>}
                <td style={styles.tdLight}>{b.equipment_name || b.equipment}</td>
                <td style={styles.tdLight}>{new Date(b.start_time).toLocaleString()}</td>
                <td style={styles.tdLight}>{new Date(b.end_time).toLocaleString()}</td>
                <td style={styles.tdLight}>
                  <span style={
                    b.status === 'APPROVED' ? styles.statusApproved : 
                    b.status === 'REJECTED' || b.status === 'CANCELLED' ? styles.statusRejected : styles.statusPending
                  }>
                    {b.status}
                  </span>
                </td>
                <td style={styles.tdLight}>
                  {isAdmin ? (
                    b.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleUpdateStatus(b.id, 'APPROVED')} style={styles.approveBtn}>Approve</button>
                        <button onClick={() => handleUpdateStatus(b.id, 'REJECTED')} style={styles.rejectBtn}>Reject</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                    )
                  ) : (
                    b.status === 'PENDING' ? (
                      <button onClick={() => handleCancelBooking(b.id)} style={styles.cancelBookingBtn}>🚫 Cancel Request</button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{b.status === 'APPROVED' ? 'Active' : 'Completed'}</span>
                    )
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </>
);

export default ReservationsTab;