import React, { useState } from 'react';
import { styles } from '../components/DynamicStyles';

const ProfileTab = ({
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileBio,
  setProfileBio,
  profileImage,
  setProfileImage,
  profileTab,
  setProfileTab,
  emailNotif,
  setEmailNotif,
  smsNotif,
  setSmsNotif,
  bookingNotif,
  setBookingNotif,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleSaveProfile,
  handleSaveNotifications,
  handleChangePassword,
  handleLogout,
  isAdmin,
  errorMsg,
  successMsg,
  setErrorMsg,
  setSuccessMsg
}) => {

  // Password Visibility (Show/Hide) සඳහා states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Photo එක Select කළ පසු Save කරගැනීමේ Handler එක
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);

        if (profileEmail) {
          const userKey = `profile_data_${profileEmail}`;
          const existingData = JSON.parse(localStorage.getItem(userKey) || '{}');
          const updatedData = {
            ...existingData,
            name: profileName,
            email: profileEmail,
            phone: profilePhone,
            bio: profileBio,
            image: imageData
          };
          localStorage.setItem(userKey, JSON.stringify(updatedData));
        }

        if (setSuccessMsg) setSuccessMsg('Photo updated & saved successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Avatar එක අයින් කිරීමේ Handler එක
  const handleRemoveImage = () => {
    setProfileImage(null);
    if (profileEmail) {
      const userKey = `profile_data_${profileEmail}`;
      const existingData = JSON.parse(localStorage.getItem(userKey) || '{}');
      const updatedData = { ...existingData, image: null };
      localStorage.setItem(userKey, JSON.stringify(updatedData));
    }
    if (setSuccessMsg) setSuccessMsg('Avatar reset to default.');
  };

  return (
    <div style={styles.lightTechCardSection}>
      <div style={styles.lightProfileHeaderBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ ...styles.profileHeaderAvatar, overflow: 'hidden' }}>
            {profileImage ? (
              <img 
                src={profileImage} 
                alt="Profile Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              profileName ? profileName.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a', fontWeight: '800' }}>
              {profileName || 'User Profile'}
            </h2>
            <p style={{ margin: 0, color: '#0284c7', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✉️ {profileEmail}</span>
              <span>•</span>
              <span style={styles.roleBadgePill}>
                {isAdmin ? '🛡️ Lab Admin' : '🎓 Student Account'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}
      {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

      <div style={styles.settingsGrid}>
        <div style={styles.lightSettingsSidebar}>
          <div style={styles.sidebarHeading}>SETTINGS MENU</div>
          <div onClick={() => { setProfileTab('profile'); setErrorMsg(''); setSuccessMsg(''); }} style={profileTab === 'profile' ? styles.lightSidebarItemActive : styles.lightSidebarItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.sidebarIcon}>👤</span>
              <span>Profile Details</span>
            </div>
            <span style={{ fontSize: '12px' }}>›</span>
          </div>
          <div onClick={() => { setProfileTab('notifications'); setErrorMsg(''); setSuccessMsg(''); }} style={profileTab === 'notifications' ? styles.lightSidebarItemActive : styles.lightSidebarItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.sidebarIcon}>🔔</span>
              <span>Notifications</span>
            </div>
            <span style={{ fontSize: '12px' }}>›</span>
          </div>
          <div onClick={() => { setProfileTab('password'); setErrorMsg(''); setSuccessMsg(''); }} style={profileTab === 'password' ? styles.lightSidebarItemActive : styles.lightSidebarItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.sidebarIcon}>🔒</span>
              <span>Security & Password</span>
            </div>
            <span style={{ fontSize: '12px' }}>›</span>
          </div>
          <div onClick={handleLogout} style={{ ...styles.lightSidebarItem, color: '#dc2626', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ ...styles.sidebarIcon, backgroundColor: '#fee2e2', color: '#dc2626' }}>🚪</span>
              <span>Log Out</span>
            </div>
            <span style={{ fontSize: '12px' }}>›</span>
          </div>
        </div>

        <div style={styles.settingsMainContent}>
          {profileTab === 'profile' && (
            <>
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #e2e8f0', pb: '10px' }}>
                <h3 style={styles.contentHeadingLight}>Personal Details</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Update your personal identification and laboratory contact details.</p>
              </div>
              <div style={styles.profileEditContainer}>
                <form onSubmit={handleSaveProfile} style={styles.profileForm}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelLight}>Full Name</label>
                    <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={styles.lightInputField} placeholder="e.g. Dilshan Dayarathna" />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelLight}>Email Address</label>
                    <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={styles.lightInputField} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelLight}>Phone Number</label>
                    <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={styles.lightInputField} />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.fieldLabelLight}>Bio / Technical Specialization</label>
                    <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Instrumentation & Automation Technology Student" rows="3" style={{ ...styles.lightInputField, resize: 'none' }} />
                  </div>
                  <button type="submit" style={styles.modernSaveBtn}>💾 Save Profile Changes</button>
                </form>

                <div style={styles.lightAvatarSection}>
                  <div style={{ ...styles.avatarBoxLight, overflow: 'hidden' }}>
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile Avatar" 
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }} 
                      />
                    ) : (
                      <div style={styles.avatarCircleLight}>
                        {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <label style={styles.changeAvatarBtnLight}>
                    📷 Upload New Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleImageChange} 
                    />
                  </label>
                  <button type="button" style={styles.deleteAvatarBtn} onClick={handleRemoveImage}>
                    🗑️ Remove Avatar
                  </button>
                </div>
              </div>
            </>
          )}

          {profileTab === 'notifications' && (
            <>
              <h3 style={styles.contentHeadingLight}>Notification Preferences</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Manage how you receive booking approvals, equipment maintenance alerts, and system notifications.</p>
              <form onSubmit={handleSaveNotifications} style={styles.profileForm}>
                <div style={styles.lightCheckboxCard}>
                  <input type="checkbox" id="emailNotif" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} style={styles.checkboxInput} />
                  <div>
                    <label htmlFor="emailNotif" style={{ ...styles.fieldLabelLight, cursor: 'pointer', color: '#0f172a' }}>Email Reservation Status</label>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Receive instant emails when your equipment booking is approved or rejected.</p>
                  </div>
                </div>
                <div style={styles.lightCheckboxCard}>
                  <input type="checkbox" id="smsNotif" checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} style={styles.checkboxInput} />
                  <div>
                    <label htmlFor="smsNotif" style={{ ...styles.fieldLabelLight, cursor: 'pointer', color: '#0f172a' }}>SMS Overdue Reminders</label>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Get text reminders 15 minutes before your scheduled lab session ends.</p>
                  </div>
                </div>
                <div style={styles.lightCheckboxCard}>
                  <input type="checkbox" id="bookingNotif" checked={bookingNotif} onChange={(e) => setBookingNotif(e.target.checked)} style={styles.checkboxInput} />
                  <div>
                    <label htmlFor="bookingNotif" style={{ ...styles.fieldLabelLight, cursor: 'pointer', color: '#0f172a' }}>Weekly Lab Updates</label>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Receive weekly reports on newly calibrated hardware and equipment availability.</p>
                  </div>
                </div>
                <button type="submit" style={styles.modernSaveBtn}>💾 Save Preferences</button>
              </form>
            </>
          )}

          {profileTab === 'password' && (
            <>
              <h3 style={styles.contentHeadingLight}>Security & Password</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Ensure your account is using a strong password to protect your bookings and permissions.</p>
              <form onSubmit={handleChangePassword} style={{ ...styles.profileForm, maxWidth: '420px' }}>
                
                {/* Current Password Field with Eye Icon */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabelLight}>Current Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      required 
                      style={{ ...styles.lightInputField, paddingRight: '40px' }} 
                      placeholder="••••••••" 
                    />
                    <span 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ position: 'absolute', right: '14px', cursor: 'pointer', fontSize: '16px', userSelect: 'none' }}
                      title={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                </div>

                {/* New Password Field with Eye Icon */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabelLight}>New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                      style={{ ...styles.lightInputField, paddingRight: '40px' }} 
                      placeholder="••••••••" 
                    />
                    <span 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '14px', cursor: 'pointer', fontSize: '16px', userSelect: 'none' }}
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                </div>

                {/* Confirm New Password Field with Eye Icon */}
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabelLight}>Confirm New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      style={{ ...styles.lightInputField, paddingRight: '40px' }} 
                      placeholder="••••••••" 
                    />
                    <span 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ position: 'absolute', right: '14px', cursor: 'pointer', fontSize: '16px', userSelect: 'none' }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                </div>

                <button type="submit" style={styles.modernSaveBtn}>🔒 Update Password Fields</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;