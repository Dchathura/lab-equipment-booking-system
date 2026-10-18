import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import DynamicAnimationStyles from './components/DynamicAnimationStyles';
import FeaturesModal from './components/FeaturesModal';
import AboutModal from './components/AboutModal';
import { styles } from './components/DynamicStyles';

import LandingPage from './pages/LandingPage';
import DashboardTab from './pages/DashboardTab';
import EquipmentTab from './pages/EquipmentTab';
import ReservationsTab from './pages/ReservationsTab';
import ManageUsersTab from './pages/ManageUsersTab';
import ProfileTab from './pages/ProfileTab';

function App() {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const [eqSearch, setEqSearch] = useState('');
  const [eqCategoryFilter, setEqCategoryFilter]  = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userStatusMap, setUserStatusMap] = useState({});

  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');

  const [profileTab, setProfileTab] = useState('profile');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [bookingNotif, setBookingNotif] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('Electronics');
  const [eqSerial, setEqSerial] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loginSectionRef = useRef(null);

  useEffect(() => {
    fetchEquipment();
    if (token) {
      fetchBookings();
      if (user?.role === 'ADMIN') {
        fetchUsers();
      }
    }
  }, [token, user]);

  // Log wena User ge Email/ID eka anuwa wenama Profile Data load kirima
 useEffect(() => {
  if (user && user.email) {
    const userKey = `profile_data_${user.email}`;
    const savedData = localStorage.getItem(userKey);

    if (savedData) {
      const parsed = JSON.parse(savedData);
      setProfileName(parsed.name || user.full_name || '');
      setProfileEmail(parsed.email || user.email || '');
      setProfilePhone(parsed.phone || '+94 77 123 4567');
      setProfileBio(parsed.bio || 'Instrumentation & Automation Technology Student');
      setProfileImage(parsed.image || null);
      
      // Notifications ද අදාළ user ගෙන් load කරගැනීම
      if (parsed.emailNotif !== undefined) setEmailNotif(parsed.emailNotif);
      if (parsed.smsNotif !== undefined) setSmsNotif(parsed.smsNotif);
      if (parsed.bookingNotif !== undefined) setBookingNotif(parsed.bookingNotif);
    } else {
      setProfileName(user.full_name || '');
      setProfileEmail(user.email || '');
      setProfilePhone('+94 77 123 4567');
      setProfileBio('Instrumentation & Automation Technology Student');
      setProfileImage(null);
    }
  }
}, [user]);

  const fetchEquipment = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/equipment');
      setEquipment(res.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        full_name: fullName,
        email,
        password,
        role
      });
      setSuccessMsg('Registration successful! You can now log in.');
      setIsLoginView(true);
      setPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const handleLogout = () => {
  setToken('');
  setUser(null);
  localStorage.removeItem('token'); // ✅ Login session එක විතරක් clear කිරීම
  localStorage.removeItem('user');
};

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedEquipment || !startTime || !endTime) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/bookings', {
        user_id: user.id,
        equipment_id: selectedEquipment,
        start_time: startTime,
        end_time: endTime,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Reservation request submitted successfully!');
      setSelectedEquipment('');
      setStartTime('');
      setEndTime('');
      fetchBookings();
      fetchEquipment();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit reservation request.');
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch(`http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`Booking #${bookingId} status updated to ${newStatus}.`);
      fetchBookings();
      fetchEquipment();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update booking status.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`Booking #${bookingId} has been cancelled.`);
      fetchBookings();
      fetchEquipment();
    } catch (err) {
      console.warn('DELETE request failed, attempting status update fallback...', err);

      try {
        await axios.put(
          `http://localhost:5000/api/bookings/${bookingId}/status`,
          { status: 'CANCELLED' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMsg(`Booking #${bookingId} has been cancelled.`);
        fetchBookings();
        fetchEquipment();
      } catch (putErr) {
        try {
          await axios.patch(
            `http://localhost:5000/api/bookings/${bookingId}/status`,
            { status: 'CANCELLED' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSuccessMsg(`Booking #${bookingId} has been cancelled.`);
          fetchBookings();
          fetchEquipment();
        } catch (patchErr) {
          const serverError =
            patchErr.response?.data?.error ||
            putErr.response?.data?.error ||
            err.response?.data?.error ||
            'Failed to cancel the booking. Please contact the administrator.';
          
          setErrorMsg(serverError);
          console.error('All cancel attempts failed:', patchErr);
        }
      }
    }
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('http://localhost:5000/api/equipment', {
        name: eqName,
        category: eqCategory,
        serial_number: eqSerial
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('New equipment added successfully!');
      setEqName('');
      setEqSerial('');
      fetchEquipment();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to add new equipment.');
    }
  };

  const handleUserRoleChange = async (userId, newRole) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch(`http://localhost:5000/api/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`User #${userId} role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`User #${userId} deleted successfully.`);
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const toggleUserStatus = (userId) => {
    setUserStatusMap(prev => ({
      ...prev,
      [userId]: prev[userId] === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    }));
  };

  const handleDownloadReport = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/reports/daily', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.length === 0) return alert('No booking records found for today.');

      const headers = ['Booking ID,Student,Equipment,Serial Number,Start Time,End Time,Status\n'];
      const rows = res.data.map(r => `${r.id},"${r.full_name}","${r.equipment}",${r.serial_number},${r.start_time},${r.end_time},${r.status}`);
      const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daily_Report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to download report.');
    }
  };

  // Profile data adala user ge email key eka yata than thanama save wena widihata sakenia
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const updatedUser = { ...user, full_name: profileName, email: profileEmail };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    if (user && user.email) {
      const userKey = `profile_data_${user.email}`;
      const dataToSave = {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        bio: profileBio,
        image: profileImage
      };
      localStorage.setItem(userKey, JSON.stringify(dataToSave));
    }

    try {
      await axios.put('http://localhost:5000/api/users/profile', {
        full_name: profileName,
        email: profileEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Backend profile update warning:', err);
    }

    setSuccessMsg('Profile updated successfully for this account!');
  };

 const handleSaveNotifications = (e) => {
  e.preventDefault();
  
  if (user && user.email) {
    const userKey = `profile_data_${user.email}`;
    const existingData = JSON.parse(localStorage.getItem(userKey) || '{}');
    const updatedData = {
      ...existingData,
      emailNotif,
      smsNotif,
      bookingNotif
    };
    localStorage.setItem(userKey, JSON.stringify(updatedData));
  }

  setSuccessMsg('Notification preferences saved successfully for this account!');
};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match!');
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMsg('Password updated successfully! Please use your new password next time you log in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to change password. Please check your current password.');
    }
  };

  const getCategoryBadgeStyle = (category) => {
    const cat = category ? category.toLowerCase() : '';
    if (cat.includes('electronic')) return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
    if (cat.includes('measure') || cat.includes('meter')) return { backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
    if (cat.includes('source') || cat.includes('signal') || cat.includes('generator')) return { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
    if (cat.includes('plc') || cat.includes('automation') || cat.includes('control')) return { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
    if (cat.includes('sensor') || cat.includes('transducer')) return { backgroundColor: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' };
    return { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name?.toLowerCase().includes(eqSearch.toLowerCase()) || eq.serial_number?.toLowerCase().includes(eqSearch.toLowerCase());
    const matchesCategory = eqCategoryFilter === 'ALL' || eq.category === eqCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!token) {
    return (
      <>
        <LandingPage
          isLoginView={isLoginView}
          setIsLoginView={setIsLoginView}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          role={role}
          setRole={setRole}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          errorMsg={errorMsg}
          successMsg={successMsg}
          setErrorMsg={setErrorMsg}
          setSuccessMsg={setSuccessMsg}
          setShowFeaturesModal={setShowFeaturesModal}
          setShowAboutModal={setShowAboutModal}
          loginSectionRef={loginSectionRef}
        />
        {showFeaturesModal && <FeaturesModal onClose={() => setShowFeaturesModal(false)} />}
        {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      </>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const userBookings = isAdmin ? bookings : bookings.filter(b => b.user_id === user?.id || b.student_name === user?.full_name);
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const approvedCount = bookings.filter(b => b.status === 'APPROVED').length;

  return (
    <div style={styles.appContainer}>
      <DynamicAnimationStyles />
      <header style={styles.topNavbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={styles.navBrand}>
            <span style={styles.brandIcon}>🔬</span> <strong>Lab.Flow</strong>
          </div>
          {isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
        </div>
        <nav style={styles.navMenu}>
          <button onClick={() => setActiveTab('Dashboard')} style={activeTab === 'Dashboard' ? styles.navMenuItemActive : styles.navMenuItem}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('Equipment')} style={activeTab === 'Equipment' ? styles.navMenuItemActive : styles.navMenuItem}>🔬 Equipment</button>
          <button onClick={() => setActiveTab('Reservations')} style={activeTab === 'Reservations' ? styles.navMenuItemActive : styles.navMenuItem}>📅 Reservations</button>
          {isAdmin && (
            <button onClick={() => setActiveTab('ManageUsers')} style={activeTab === 'ManageUsers' ? styles.navMenuItemActive : styles.navMenuItem}>👥 Manage Users</button>
          )}
          <button onClick={() => setActiveTab('Profile')} style={activeTab === 'Profile' ? styles.navMenuItemActive : styles.navMenuItem}>👤 Account Settings</button>
        </nav>
        <button onClick={handleLogout} style={styles.logoutBtn}>➜ Logout</button>
      </header>

      <main style={styles.mainWrapper}>
        {isAdmin && activeTab === 'ManageUsers' && (
          <ManageUsersTab
            usersList={usersList}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            filteredUsers={filteredUsers}
            userStatusMap={userStatusMap}
            handleUserRoleChange={handleUserRoleChange}
            toggleUserStatus={toggleUserStatus}
            handleDeleteUser={handleDeleteUser}
            currentUser={user}
            errorMsg={errorMsg}
            successMsg={successMsg}
          />
        )}

        {activeTab === 'Profile' && (
          <ProfileTab
            profileName={profileName}
            setProfileName={setProfileName}
            profileEmail={profileEmail}
            setProfileEmail={setProfileEmail}
            profilePhone={profilePhone}
            setProfilePhone={setProfilePhone}
            profileBio={profileBio}
            setProfileBio={setProfileBio}
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            emailNotif={emailNotif}
            setEmailNotif={setEmailNotif}
            smsNotif={smsNotif}
            setSmsNotif={setSmsNotif}
            bookingNotif={bookingNotif}
            setBookingNotif={setBookingNotif}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleSaveProfile={handleSaveProfile}
            handleSaveNotifications={handleSaveNotifications}
            handleChangePassword={handleChangePassword}
            handleLogout={handleLogout}
            isAdmin={isAdmin}
            errorMsg={errorMsg}
            successMsg={successMsg}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
            profileImage={profileImage}
            setProfileImage={setProfileImage}
          />
        )}

        {activeTab !== 'Profile' && activeTab !== 'ManageUsers' && (
          <>
            <div style={styles.bannerCard}>
              <div>
                <div style={styles.bannerSubTitle}>{isAdmin ? 'ADMIN DASHBOARD' : 'STUDENT DASHBOARD'}</div>
                <h1 style={styles.bannerTitle}>{isAdmin ? 'Overview & Controls' : `Welcome, ${user?.full_name || 'User'}`}</h1>
                <p style={styles.bannerDesc}>
                  {isAdmin ? 'Manage laboratory equipment, review student reservation requests, and export reports.' : 'Search available hardware, reserve lab equipment, and track your active bookings.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={styles.userBadgePill}>👤 {user?.full_name}</span>
                {isAdmin && (
                  <button onClick={handleDownloadReport} style={styles.bannerActionBtn}>📥 Export CSV</button>
                )}
              </div>
            </div>

            <div style={styles.metricsGrid}>
              <div className="metric-card-hover" style={styles.metricCard1}>
                <div style={styles.metricHeader}><span>Total Equipment</span><span>🔬</span></div>
                <div style={styles.metricVal}>{equipment.length}</div>
                <div style={styles.metricSubText}>Registered Assets</div>
              </div>
              <div className="metric-card-hover" style={styles.metricCard2}>
                <div style={styles.metricHeader}><span>Approved Bookings</span><span>✅</span></div>
                <div style={styles.metricVal}>{approvedCount}</div>
                <div style={styles.metricSubText}>Confirmed Reservations</div>
              </div>
              <div className="metric-card-hover" style={styles.metricCard3}>
                <div style={styles.metricHeader}><span>Pending Requests</span><span>⏳</span></div>
                <div style={styles.metricVal}>{pendingCount}</div>
                <div style={styles.metricSubText}>Awaiting Review</div>
              </div>
              <div className="metric-card-hover" style={styles.metricCard4}>
                <div style={styles.metricHeader}><span>Total Records</span><span>📜</span></div>
                <div style={styles.metricVal}>{userBookings.length}</div>
                <div style={styles.metricSubText}>System Log Entries</div>
              </div>
            </div>

            {activeTab === 'Dashboard' && (
              <DashboardTab isAdmin={isAdmin} setActiveTab={setActiveTab} handleDownloadReport={handleDownloadReport} />
            )}

            {activeTab === 'Equipment' && (
              <EquipmentTab
                isAdmin={isAdmin}
                eqName={eqName}
                setEqName={setEqName}
                eqCategory={eqCategory}
                setEqCategory={setEqCategory}
                eqSerial={eqSerial}
                setEqSerial={setEqSerial}
                handleAddEquipment={handleAddEquipment}
                eqSearch={eqSearch}
                setEqSearch={setEqSearch}
                eqCategoryFilter={eqCategoryFilter}
                setEqCategoryFilter={setEqCategoryFilter}
                filteredEquipment={filteredEquipment}
                getCategoryBadgeStyle={getCategoryBadgeStyle}
                errorMsg={errorMsg}
                successMsg={successMsg}
              />
            )}

            {activeTab === 'Reservations' && (
              <ReservationsTab
                isAdmin={isAdmin}
                selectedEquipment={selectedEquipment}
                setSelectedEquipment={setSelectedEquipment}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                handleBookingSubmit={handleBookingSubmit}
                equipment={equipment}
                userBookings={userBookings}
                handleUpdateStatus={handleUpdateStatus}
                handleCancelBooking={handleCancelBooking}
                errorMsg={errorMsg}
                successMsg={successMsg}
              />
            )}
          </>
        )}
      </main>

      {showFeaturesModal && <FeaturesModal onClose={() => setShowFeaturesModal(false)} />}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
    </div>
  );
}

export default App;