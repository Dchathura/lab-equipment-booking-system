import React, { useState } from 'react';
import { styles } from '../components/DynamicStyles';

const ManageUsersTab = ({
  usersList,
  userSearch,
  setUserSearch,
  roleFilter,
  setRoleFilter,
  filteredUsers,
  userStatusMap,
  handleUserRoleChange,
  toggleUserStatus,
  handleDeleteUser,
  currentUser,
  errorMsg,
  successMsg
}) => {
  const [selectedUserBookings, setSelectedUserBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeUserName, setActiveUserName] = useState('');

  const handleUserClick = async (user) => {
    setActiveUserName(user.full_name);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/bookings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSelectedUserBookings(Array.isArray(data) ? data : []);
      setShowModal(true);
    } catch (err) {
      console.error("User bookings fetch error:", err);
    }
  };

  return (
    <div style={styles.lightTechCardSection}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ ...styles.cardTitleLight, margin: 0 }}>👥 System Users Management</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>
            Manage accounts, grant administrative privileges, and monitor student lab access permissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            Total Users: {usersList.length}
          </span>
          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecdd3', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            Admins: {usersList.filter(u => u.role === 'ADMIN').length}
          </span>
        </div>
      </div>

      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: '#f1f5f9', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '12px', color: '#0284c7' }}>🔍</span>
          <input type="text" placeholder="Search user by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ ...styles.lightInputField, paddingLeft: '36px' }} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...styles.lightInputField, width: '160px' }}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">ADMIN Only</option>
          <option value="STUDENT">STUDENT Only</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr style={styles.tableHeaderRowLight}>
            <th style={styles.thLight}>ID</th>
            <th style={styles.thLight}>Full Name</th>
            <th style={styles.thLight}>Email</th>
            <th style={styles.thLight}>Current Role</th>
            <th style={styles.thLight}>Account Status</th>
            <th style={styles.thLight}>Change Role</th>
            <th style={styles.thLight}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ ...styles.tdLight, textAlign: 'center' }}>No users match the criteria.</td>
            </tr>
          ) : (
            filteredUsers.map(u => {
              const isSuspended = userStatusMap[u.id] === 'SUSPENDED';
              return (
                <tr key={u.id} style={styles.tableRowLight}>
                  <td style={styles.tdLight}>#{u.id}</td>
                  <td style={styles.tdLight}>
                    <strong 
                      onClick={() => handleUserClick(u)} 
                      style={{ color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}
                      title="Click to view booking history"
                    >
                      {u.full_name}
                    </strong>
                    {u.id === currentUser?.id && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>You</span>}
                  </td>
                  <td style={styles.tdLight}>{u.email}</td>
                  <td style={styles.tdLight}>
                    <span style={u.role === 'ADMIN' ? styles.roleBadgeAdmin : styles.roleBadgeStudent}>{u.role}</span>
                  </td>
                  <td style={styles.tdLight}>
                    <span style={isSuspended ? styles.statusSuspended : styles.statusActive}>
                      {isSuspended ? '🔴 SUSPENDED' : '🟢 ACTIVE'}
                    </span>
                  </td>
                  <td style={styles.tdLight}>
                    <select value={u.role} onChange={(e) => handleUserRoleChange(u.id, e.target.value)} style={styles.lightRoleSelect} disabled={u.id === currentUser?.id}>
                      <option value="STUDENT">STUDENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td style={styles.tdLight}>
                    {u.id !== currentUser?.id && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => toggleUserStatus(u.id)} style={isSuspended ? styles.activateUserBtn : styles.suspendUserBtn}>
                          {isSuspended ? 'Unblock' : 'Suspend'}
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} style={styles.deleteUserBtn}>🗑️ Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Booking History Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '650px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>📦 Booking History for: {activeUserName}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {selectedUserBookings.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '14px' }}>This user has not made any equipment bookings yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', fontSize: '12px', color: '#475569' }}>
                    <th style={{ padding: '10px' }}>EQUIPMENT</th>
                    <th style={{ padding: '10px' }}>START TIME</th>
                    <th style={{ padding: '10px' }}>END TIME</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserBookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{b.equipment}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#334155' }}>{new Date(b.start_time).toLocaleString()}</td>
                      <td style={{ padding: '10px', fontSize: '12px', color: '#334155' }}>{new Date(b.end_time).toLocaleString()}</td>
                      <td style={{ padding: '10px', fontSize: '12px' }}>
                        <span style={{
                          fontWeight: 'bold',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          backgroundColor: b.status === 'APPROVED' ? '#dcfce7' : b.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                          color: b.status === 'APPROVED' ? '#16a34a' : b.status === 'REJECTED' ? '#dc2626' : '#d97706'
                        }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersTab;