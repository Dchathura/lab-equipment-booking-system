import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import FeedbackTab from './pages/FeedbackTab';

const API_BASE = 'http://localhost:5000';

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
  const [eqCategoryFilter, setEqCategoryFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [userStatusMap, setUserStatusMap] = useState({});

  const [isLoginView, setIsLoginView] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  // LocalStorage එකෙන් Pending Feedbacks ගණන සොයා ගැනීමට State එකක්
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  // 🌟 Role & User-Isolated Notification Center State
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifContainerRef = useRef(null);
  const seenBookingStateRef = useRef({});
  const seenFeedbackStateRef = useRef({});
  const seenUsersRef = useRef(new Set());
  const usersInitializedRef = useRef(false);
  const remindedBookingsRef = useRef(new Set());

  const loginSectionRef = useRef(null);

  // Clear cross-page alerts whenever switching tabs
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [activeTab]);

  const getUserProfileKey = useCallback((targetUser) => {
    if (!targetUser) return null;
    const identity = (targetUser.email || '').toString().trim().toLowerCase();
    const idPart = targetUser.id !== undefined && targetUser.id !== null ? `id_${targetUser.id}` : '';
    if (identity && idPart) return `lab_flow_profile_${idPart}_${identity}`;
    if (identity) return `lab_flow_profile_${identity}`;
    if (idPart) return `lab_flow_profile_${idPart}`;
    return null;
  }, []);

  const getUserNotifStorageKey = useCallback((targetUser) => {
    if (!targetUser) return null;
    const identity = (targetUser.email || targetUser.id || '').toString().trim().toLowerCase();
    return identity ? `lab_flow_notifications_${identity}` : null;
  }, []);

  const getSeenUsersStorageKey = useCallback((targetUser) => {
    if (!targetUser) return null;
    const identity = (targetUser.email || targetUser.id || '').toString().trim().toLowerCase();
    return identity ? `lab_flow_seen_users_${identity}` : null;
  }, []);

  const getRemindedBookingsStorageKey = useCallback((targetUser) => {
    if (!targetUser) return null;
    const identity = (targetUser.email || targetUser.id || '').toString().trim().toLowerCase();
    return identity ? `lab_flow_reminded_bookings_${identity}` : null;
  }, []);

  // Reusable helper for adding unique, deduplicated notifications
  const pushNotification = useCallback((targetUserOrMatcher, newItem) => {
    const dedupKey = newItem.dedupKey || newItem.id || null;
    const entry = {
      id: newItem.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dedupKey,
      type: newItem.type || 'GENERAL',
      title: newItem.title || 'Notification',
      message: newItem.message || '',
      createdAt: newItem.createdAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    const currentIdentity = (user?.email || user?.id || '').toString().trim().toLowerCase();
    const isAdminUser = user?.role === 'ADMIN';

    const matchesCurrentUser = () => {
      if (!user) return false;
      if (targetUserOrMatcher === 'ALL_ADMINS') {
        return isAdminUser;
      }
      if (typeof targetUserOrMatcher === 'string') {
        return currentIdentity === targetUserOrMatcher.trim().toLowerCase();
      }
      if (targetUserOrMatcher && typeof targetUserOrMatcher === 'object') {
        const targetId = targetUserOrMatcher.id;
        const targetEmail = (targetUserOrMatcher.email || '').toString().trim().toLowerCase();
        return (
          (targetId !== undefined && targetId !== null && Number(user.id) === Number(targetId)) ||
          (targetEmail && currentIdentity === targetEmail)
        );
      }
      return false;
    };

    const isDuplicate = (list) => {
      if (!Array.isArray(list)) return false;
      return list.some(
        (n) =>
          n.id === entry.id ||
          (dedupKey && (n.dedupKey === dedupKey || n.id === dedupKey))
      );
    };

    // Save to target user's isolated localStorage bucket
    if (targetUserOrMatcher && typeof targetUserOrMatcher === 'object') {
      const key = getUserNotifStorageKey(targetUserOrMatcher);
      if (key) {
        try {
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          if (!isDuplicate(existing)) {
            const nextList = [entry, ...existing].slice(0, 40);
            localStorage.setItem(key, JSON.stringify(nextList));
          }
        } catch (err) {
          console.error('Failed saving target notification:', err);
        }
      }
    }

    if (matchesCurrentUser()) {
      setNotifications((prev) => {
        if (isDuplicate(prev)) return prev;
        const updated = [entry, ...prev].slice(0, 40);
        const key = getUserNotifStorageKey(user);
        if (key) {
          localStorage.setItem(key, JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [user, getUserNotifStorageKey]);

  // Load notifications & persisted watcher baselines for active user only
  useEffect(() => {
    const key = getUserNotifStorageKey(user);
    if (!key) {
      setNotifications([]);
      setShowNotifDropdown(false);
      seenUsersRef.current = new Set();
      usersInitializedRef.current = false;
      remindedBookingsRef.current = new Set();
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setNotifications(Array.isArray(saved) ? saved : []);
    } catch (err) {
      console.error('Failed loading user notifications:', err);
      setNotifications([]);
    }

    const seenUsersKey = getSeenUsersStorageKey(user);
    if (seenUsersKey) {
      try {
        const savedSeenUsers = JSON.parse(localStorage.getItem(seenUsersKey) || '[]');
        if (Array.isArray(savedSeenUsers) && savedSeenUsers.length > 0) {
          seenUsersRef.current = new Set(savedSeenUsers.map((id) => String(id)));
          usersInitializedRef.current = true;
        } else {
          seenUsersRef.current = new Set();
          usersInitializedRef.current = false;
        }
      } catch (err) {
        seenUsersRef.current = new Set();
        usersInitializedRef.current = false;
      }
    }

    const remindedKey = getRemindedBookingsStorageKey(user);
    if (remindedKey) {
      try {
        const savedReminded = JSON.parse(localStorage.getItem(remindedKey) || '[]');
        remindedBookingsRef.current = new Set(Array.isArray(savedReminded) ? savedReminded : []);
      } catch (err) {
        remindedBookingsRef.current = new Set();
      }
    }
  }, [user, getUserNotifStorageKey, getSeenUsersStorageKey, getRemindedBookingsStorageKey]);

  // Persist active user notifications whenever updated
  useEffect(() => {
    const key = getUserNotifStorageKey(user);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(notifications));
    } catch (err) {
      console.error('Failed persisting notifications:', err);
    }
  }, [notifications, user, getUserNotifStorageKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchEquipment();
    if (token) {
      fetchBookings();
      if (user?.role === 'ADMIN') {
        fetchUsers();
      }
    }
  }, [token, user]);

  // Pending Feedbacks ගණන & Feedback status/new item notifications (Admin & Owner Student only)
  useEffect(() => {
    const syncFeedbackNotifications = async () => {
      let rows = [];

      if (token) {
        try {
          const res = await axios.get(`${API_BASE}/api/feedbacks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (Array.isArray(res.data)) {
            rows = res.data;
          }
        } catch (err) {
          const saved = localStorage.getItem('lab_feedbacks_list');
          if (saved) {
            try {
              rows = JSON.parse(saved);
            } catch (e) {
              rows = [];
            }
          }
        }
      } else {
        const saved = localStorage.getItem('lab_feedbacks_list');
        if (saved) {
          try {
            rows = JSON.parse(saved);
          } catch (e) {
            rows = [];
          }
        }
      }

      const pending = rows.filter((item) => item.status === 'Pending Review').length;
      setPendingFeedbackCount(pending);

      if (!user) return;

      const isAdminUser = user.role === 'ADMIN';
      const currentEmail = (user.email || '').toLowerCase();

      rows.forEach((fb) => {
        const prevStatus = seenFeedbackStateRef.current[fb.id];
        const currStatus = fb.status || 'Pending Review';
        const fbOwnerId = fb.user_id;
        const fbOwnerEmail = (fb.user_email || fb.email || '').toLowerCase();
        const fbStudentName = fb.student_name || fb.studentName || 'A student';
        const fbTarget = fb.target_equipment || fb.target || 'General Lab Feedback';

        const isOwner =
          (fbOwnerId !== undefined && fbOwnerId !== null && Number(fbOwnerId) === Number(user.id)) ||
          (fbOwnerEmail && currentEmail && fbOwnerEmail === currentEmail);

        if (!prevStatus) {
          seenFeedbackStateRef.current[fb.id] = currStatus;
          return;
        }

        if (prevStatus !== currStatus) {
          seenFeedbackStateRef.current[fb.id] = currStatus;
          // User notification: Admin marked feedback as Reviewed / Seen
          if (!isAdminUser && isOwner && currStatus === 'Reviewed') {
            pushNotification(user, {
              id: `fb_reviewed_${fb.id}`,
              dedupKey: `fb_reviewed_${fb.id}`,
              type: 'FEEDBACK_REVIEWED',
              title: '💬 Feedback Reviewed by Admin',
              message: `Your feedback on "${fbTarget}" has been marked as Reviewed.`
            });
          }
        }
      });

      // Admin notification: New incoming feedback
      if (isAdminUser) {
        rows.forEach((fb) => {
          const notifId = `admin_new_fb_${fb.id}`;
          const alreadyTracked = seenFeedbackStateRef.current[`tracked_${fb.id}`];
          if (!alreadyTracked) {
            seenFeedbackStateRef.current[`tracked_${fb.id}`] = true;
            if (fb.status === 'Pending Review') {
              const fbStudentName = fb.student_name || fb.studentName || 'A student';
              const fbTarget = fb.target_equipment || fb.target || 'General Lab Feedback';
              pushNotification('ALL_ADMINS', {
                id: notifId,
                dedupKey: notifId,
                type: 'NEW_FEEDBACK',
                title: '📝 New Student Feedback',
                message: `${fbStudentName} submitted feedback for "${fbTarget}".`
              });
            }
          }
        });
      }
    };

    syncFeedbackNotifications();
    window.addEventListener('storage', syncFeedbackNotifications);
    const interval = setInterval(syncFeedbackNotifications, 8000);

    return () => {
      window.removeEventListener('storage', syncFeedbackNotifications);
      clearInterval(interval);
    };
  }, [token, user, pushNotification]);

  // Real-time Booking, Handover/Return Confirmation & 24-Hour End Time Reminder Watcher
  useEffect(() => {
    if (!user || !Array.isArray(bookings)) return;

    const isAdminUser = user.role === 'ADMIN';
    const currentEmail = (user.email || '').toLowerCase();
    const now = new Date();
    const remindedKey = getRemindedBookingsStorageKey(user);
    let remindedChanged = false;

    bookings.forEach((b) => {
      const prevStatus = seenBookingStateRef.current[b.id];
      const currStatus = b.status;
      const currHandover = b.handover_status || 'NONE';

      const isOwner =
        (b.user_id !== undefined && b.user_id !== null && Number(b.user_id) === Number(user.id)) ||
        (b.student_name && user.full_name && b.student_name === user.full_name) ||
        (b.email && currentEmail && b.email.toLowerCase() === currentEmail);

      if (prevStatus && prevStatus !== currStatus) {
        // User notification when Admin approves or rejects their booking
        if (!isAdminUser && isOwner && (currStatus === 'APPROVED' || currStatus === 'REJECTED')) {
          pushNotification(user, {
            id: `booking_status_${b.id}_${currStatus}`,
            dedupKey: `booking_status_${b.id}_${currStatus}`,
            type: 'BOOKING_STATUS',
            title: currStatus === 'APPROVED' ? '✅ Booking Approved!' : '❌ Booking Rejected',
            message: `Your reservation for "${b.equipment || 'equipment'}" (#${b.id}) was ${currStatus.toLowerCase()} by Admin.`
          });
        }
      }
      seenBookingStateRef.current[b.id] = currStatus;

      // Admin notification when a new booking is created/pending
      if (isAdminUser && currStatus === 'PENDING') {
        const pendingKey = `admin_pending_booking_${b.id}`;
        if (!seenBookingStateRef.current[pendingKey]) {
          seenBookingStateRef.current[pendingKey] = true;
          pushNotification('ALL_ADMINS', {
            id: pendingKey,
            dedupKey: pendingKey,
            type: 'NEW_BOOKING',
            title: '📅 New Equipment Booking',
            message: `${b.student_name || 'A student'} requested "${b.equipment || 'equipment'}" (#${b.id}).`
          });
        }
      }

      // 📦 Unique Admin Notification: Student handed over equipment for return
      if (isAdminUser && currHandover === 'HANDED_OVER') {
        const handoverKey = `admin_handover_${b.id}`;
        if (!seenBookingStateRef.current[handoverKey]) {
          seenBookingStateRef.current[handoverKey] = true;
          pushNotification('ALL_ADMINS', {
            id: handoverKey,
            dedupKey: handoverKey,
            type: 'EQUIPMENT_HANDOVER',
            title: '📦 Equipment Handed Over',
            message: `${b.student_name || 'Student'} handed over "${b.equipment || 'equipment'}" (Booking #${b.id}). Please confirm return.`
          });
        }
      }

      // ✅ Unique Student Notification: Admin confirmed return for THIS specific user only
      if (!isAdminUser && isOwner && currHandover === 'CONFIRMED') {
        const confirmedKey = `user_return_confirmed_${b.id}`;
        if (!seenBookingStateRef.current[confirmedKey]) {
          seenBookingStateRef.current[confirmedKey] = true;
          pushNotification(user, {
            id: confirmedKey,
            dedupKey: confirmedKey,
            type: 'RETURN_CONFIRMED',
            title: '✅ Return Confirmed by Admin',
            message: `Admin confirmed receiving your returned "${b.equipment || 'equipment'}" (Booking #${b.id}).`
          });
        }
      }

      // User notification: End time approaching within 24 hours (1 day or less) - persisted once per booking
      if (!isAdminUser && isOwner && currStatus === 'APPROVED' && b.end_time && bookingNotif) {
        const end = new Date(b.end_time);
        const hoursLeft = (end - now) / (1000 * 60 * 60);
        const reminderId = `end_reminder_${b.id}`;

        if (hoursLeft > 0 && hoursLeft <= 24 && !remindedBookingsRef.current.has(reminderId)) {
          remindedBookingsRef.current.add(reminderId);
          remindedChanged = true;
          const roundedHours = Math.max(1, Math.ceil(hoursLeft));
          pushNotification(user, {
            id: reminderId,
            dedupKey: reminderId,
            type: 'END_TIME_REMINDER',
            title: '⏰ Booking Ending Soon',
            message: `Your booking for "${b.equipment || 'equipment'}" ends in about ${roundedHours} hour(s). Please return it on time.`
          });
        }
      }
    });

    if (remindedChanged && remindedKey) {
      try {
        localStorage.setItem(remindedKey, JSON.stringify(Array.from(remindedBookingsRef.current)));
      } catch (err) {
        console.error('Failed saving reminded bookings:', err);
      }
    }
  }, [bookings, user, bookingNotif, pushNotification, getRemindedBookingsStorageKey]);

  // Admin notification ONLY when genuinely new users appear after baseline initialization
  useEffect(() => {
    if (!user || user.role !== 'ADMIN' || !Array.isArray(usersList) || usersList.length === 0) return;

    const seenUsersKey = getSeenUsersStorageKey(user);

    if (!usersInitializedRef.current) {
      usersList.forEach((u) => {
        if (u && u.id !== undefined && u.id !== null) {
          seenUsersRef.current.add(String(u.id));
        }
      });
      usersInitializedRef.current = true;
      if (seenUsersKey) {
        try {
          localStorage.setItem(seenUsersKey, JSON.stringify(Array.from(seenUsersRef.current)));
        } catch (err) {
          console.error('Failed saving initial seen users:', err);
        }
      }
      return;
    }

    let addedNew = false;
    usersList.forEach((u) => {
      if (!u || u.id === undefined || u.id === null) return;
      const idStr = String(u.id);
      if (!seenUsersRef.current.has(idStr)) {
        seenUsersRef.current.add(idStr);
        addedNew = true;
        if (u.email !== user.email) {
          pushNotification('ALL_ADMINS', {
            id: `new_user_${u.id}`,
            dedupKey: `new_user_${u.id}`,
            type: 'NEW_USER',
            title: '👤 New User Registered',
            message: `${u.full_name || u.email} (${u.email}) joined as ${u.role || 'STUDENT'}.`
          });
        }
      }
    });

    if (addedNew && seenUsersKey) {
      try {
        localStorage.setItem(seenUsersKey, JSON.stringify(Array.from(seenUsersRef.current)));
      } catch (err) {
        console.error('Failed updating seen users:', err);
      }
    }
  }, [usersList, user, pushNotification, getSeenUsersStorageKey]);

  // Load user-specific Profile Data (empty phone/bio for newly logged-in users until saved)
  useEffect(() => {
    if (!user) {
      setProfileName('');
      setProfileEmail('');
      setProfilePhone('');
      setProfileBio('');
      setProfileImage(null);
      return;
    }

    const primaryKey = getUserProfileKey(user);
    const legacyEmailKey = user.email ? `profile_data_${user.email.toLowerCase()}` : null;
    const rawSaved =
      (primaryKey && localStorage.getItem(primaryKey)) ||
      (legacyEmailKey && localStorage.getItem(legacyEmailKey)) ||
      null;

    if (rawSaved) {
      try {
        const parsed = JSON.parse(rawSaved);
        setProfileName(parsed.name ?? user.full_name ?? '');
        setProfileEmail(parsed.email ?? user.email ?? '');
        setProfilePhone(parsed.phone ?? '');
        setProfileBio(parsed.bio ?? '');
        setProfileImage(parsed.image ?? null);

        if (parsed.emailNotif !== undefined) setEmailNotif(parsed.emailNotif);
        if (parsed.smsNotif !== undefined) setSmsNotif(parsed.smsNotif);
        if (parsed.bookingNotif !== undefined) setBookingNotif(parsed.bookingNotif);
        return;
      } catch (err) {
        console.error('Failed parsing user profile data:', err);
      }
    }

    setProfileName(user.full_name || '');
    setProfileEmail(user.email || '');
    setProfilePhone('');
    setProfileBio('');
    setProfileImage(null);
  }, [user, getUserProfileKey]);

  const fetchEquipment = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/equipment`);
      setEquipment(res.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`, {
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
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSendingOtp(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/send-otp`, { email });
      setOtpSent(true);
      setSuccessMsg(res.data?.message || 'Verification code sent to your email. Valid for 2 minutes.');
      return true;
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to send verification code.');
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post(`${API_BASE}/api/auth/register`, {
        full_name: fullName,
        email,
        password,
        role,
        otp: otpCode
      });
      setSuccessMsg('Registration successful! You can now log in.');
      setIsLoginView(true);
      setPassword('');
      setOtpCode('');
      setOtpSent(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const handleGoogleLoginSuccess = async (googleUser, googleAccessToken) => {
    setErrorMsg('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google`, {
        email: googleUser.email,
        full_name: googleUser.name,
        google_id: googleUser.sub,
        picture: googleUser.picture
      });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setActiveTab('Dashboard');
    } catch (err) {
      const fallbackUser = {
        id: googleUser.sub,
        full_name: googleUser.name,
        email: googleUser.email,
        role: role || 'STUDENT'
      };
      setToken(googleAccessToken);
      setUser(fallbackUser);
      localStorage.setItem('token', googleAccessToken);
      localStorage.setItem('user', JSON.stringify(fallbackUser));
      setActiveTab('Dashboard');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setShowNotifDropdown(false);
    setErrorMsg('');
    setSuccessMsg('');
    localStorage.removeItem('token');
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

    const startObj = new Date(startTime);
    const endObj = new Date(endTime);
    const maxAllowedMs = 14 * 24 * 60 * 60 * 1000;

    if (Number.isNaN(startObj.getTime()) || Number.isNaN(endObj.getTime())) {
      setErrorMsg('Please select valid start and end date/time values.');
      return;
    }
    if (endObj <= startObj) {
      setErrorMsg('End time must be later than start time.');
      return;
    }
    if (endObj.getTime() - startObj.getTime() > maxAllowedMs) {
      setErrorMsg('Maximum booking duration is 2 weeks (14 days). Please choose an earlier end time.');
      return;
    }

    try {
      const createdRes = await axios.post(`${API_BASE}/api/bookings`, {
        user_id: user.id,
        equipment_id: selectedEquipment,
        start_time: startTime,
        end_time: endTime,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const createdBooking = createdRes.data || {};
      const bookingRefId = createdBooking.id || Date.now();
      const eqObj = equipment.find((item) => String(item.id) === String(selectedEquipment));
      const eqLabel = eqObj ? eqObj.name : `Equipment #${selectedEquipment}`;

      // Notify submitting user (confirmation)
      pushNotification(user, {
        id: `user_booking_sent_${bookingRefId}`,
        dedupKey: `user_booking_sent_${bookingRefId}`,
        type: 'BOOKING_SUBMITTED',
        title: '📨 Booking Request Sent',
        message: `Your request for "${eqLabel}" has been submitted and is pending Admin approval.`
      });

      // Notify Admin(s)
      pushNotification('ALL_ADMINS', {
        id: `admin_booking_req_${bookingRefId}`,
        dedupKey: `admin_booking_req_${bookingRefId}`,
        type: 'NEW_BOOKING',
        title: '📅 New Equipment Booking',
        message: `${user.full_name || user.email} requested "${eqLabel}".`
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

  // 📦 Student: Mark booked equipment as handed over back to Admin (Does NOT alter stock)
  const handleHandoverEquipment = async (bookingId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch(
        `${API_BASE}/api/bookings/${bookingId}/handover`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const targetBooking = bookings.find((b) => Number(b.id) === Number(bookingId));
      const eqNameLabel = targetBooking?.equipment || `Booking #${bookingId}`;
      const studentLabel = targetBooking?.student_name || user?.full_name || user?.email || 'Student';

      // Unique notification to Admins only
      pushNotification('ALL_ADMINS', {
        id: `admin_handover_${bookingId}`,
        dedupKey: `admin_handover_${bookingId}`,
        type: 'EQUIPMENT_HANDOVER',
        title: '📦 Equipment Handed Over',
        message: `${studentLabel} handed over "${eqNameLabel}" (Booking #${bookingId}). Please confirm return.`
      });

      seenBookingStateRef.current[`admin_handover_${bookingId}`] = true;
      setSuccessMsg(`Handover submitted for Booking #${bookingId}. Waiting for Admin confirmation.`);
      fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit equipment handover.');
    }
  };

  // ✅ Admin: Confirm return for a specific user's handed-over equipment (Does NOT alter stock)
  const handleConfirmReturn = async (bookingId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch(
        `${API_BASE}/api/bookings/${bookingId}/confirm-return`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const targetBooking = bookings.find((b) => Number(b.id) === Number(bookingId));
      if (targetBooking) {
        const matchedUser = usersList.find((u) => Number(u.id) === Number(targetBooking.user_id));
        const targetUserObj = {
          id: targetBooking.user_id,
          email: matchedUser?.email || targetBooking.email
        };

        // Unique notification to THIS specific student only
        pushNotification(targetUserObj, {
          id: `user_return_confirmed_${bookingId}`,
          dedupKey: `user_return_confirmed_${bookingId}`,
          type: 'RETURN_CONFIRMED',
          title: '✅ Return Confirmed by Admin',
          message: `Admin confirmed receiving your returned "${targetBooking.equipment || 'equipment'}" (Booking #${bookingId}).`
        });
      }

      setSuccessMsg(`Return confirmed for Booking #${bookingId}.`);
      fetchBookings();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to confirm return.');
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.patch(`${API_BASE}/api/bookings/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const targetBooking = bookings.find((b) => Number(b.id) === Number(bookingId));
      if (targetBooking && (newStatus === 'APPROVED' || newStatus === 'REJECTED')) {
        pushNotification(
          { id: targetBooking.user_id, email: targetBooking.email },
          {
            id: `status_msg_${bookingId}_${newStatus}_${Date.now()}`,
            dedupKey: `status_msg_${bookingId}_${newStatus}`,
            type: 'BOOKING_STATUS',
            title: newStatus === 'APPROVED' ? '✅ Booking Approved!' : '❌ Booking Rejected',
            message: `Your booking for "${targetBooking.equipment || 'equipment'}" (#${bookingId}) was ${newStatus.toLowerCase()} by Admin.`
          }
        );
      }

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
      await axios.delete(`${API_BASE}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg(`Booking #${bookingId} has been cancelled.`);
      fetchBookings();
      fetchEquipment();
    } catch (err) {
      console.warn('DELETE request failed, attempting status update fallback...', err);

      try {
        await axios.put(
          `${API_BASE}/api/bookings/${bookingId}/status`,
          { status: 'CANCELLED' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccessMsg(`Booking #${bookingId} has been cancelled.`);
        fetchBookings();
        fetchEquipment();
      } catch (putErr) {
        try {
          await axios.patch(
            `${API_BASE}/api/bookings/${bookingId}/status`,
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
      await axios.post(`${API_BASE}/api/equipment`, {
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
      await axios.patch(`${API_BASE}/api/users/${userId}/role`,
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
      await axios.delete(`${API_BASE}/api/users/${userId}`, {
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
      const res = await axios.get(`${API_BASE}/api/reports/daily`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.length === 0) return alert('No booking records found for today.');

      const headers = ['Booking ID,Student,Equipment,Serial Number,Start Time,End Time,Status\n'];
      const rows = res.data.map(r => `${r.id},"${r.full_name}","${r.equipment}",${r.serial_number},${r.start_time},${r.end_time},${r.status}`);
      const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Daily_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to download report.');
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const updatedUser = { ...user, full_name: profileName, email: profileEmail };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    const userKey = getUserProfileKey(updatedUser) || getUserProfileKey(user);
    if (userKey) {
      const existingData = JSON.parse(localStorage.getItem(userKey) || '{}');
      const dataToSave = {
        ...existingData,
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        bio: profileBio,
        image: profileImage
      };
      localStorage.setItem(userKey, JSON.stringify(dataToSave));
    }

    try {
      await axios.put(`${API_BASE}/api/users/profile`, {
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

    const userKey = getUserProfileKey(user);
    if (userKey) {
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
      await axios.put(`${API_BASE}/api/auth/change-password`, {
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

  const markSingleNotifRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotifsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifs = () => {
    setNotifications([]);
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
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          handleSendOtp={handleSendOtp}
          isSendingOtp={isSendingOtp}
          otpSent={otpSent}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          onGoogleSuccess={handleGoogleLoginSuccess}
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
  const displayName = profileName || user?.full_name || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

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
          <button onClick={() => setActiveTab('Feedback')} style={activeTab === 'Feedback' ? styles.navMenuItemActive : styles.navMenuItem}>💬 Feedback</button>
          {isAdmin && (
            <button onClick={() => setActiveTab('ManageUsers')} style={activeTab === 'ManageUsers' ? styles.navMenuItemActive : styles.navMenuItem}>👥 Manage Users</button>
          )}
          <button onClick={() => setActiveTab('Profile')} style={activeTab === 'Profile' ? styles.navMenuItemActive : styles.navMenuItem}>👤 Account Settings</button>
        </nav>

        {/* Top Navigation Right Corner: Notification Bell Pop-up & Logout */}
        <div style={{ display: 'flex', alignItems: 'center' }} ref={notifContainerRef}>
          <div style={{ position: 'relative', marginRight: '20px' }}>
            <div
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => setShowNotifDropdown((prev) => !prev)}
              title={isAdmin ? 'Admin Notifications' : 'My Notifications'}
            >
              <span style={{ fontSize: '20px' }}>🔔</span>
              {unreadNotifCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '50%',
                  border: '2px solid #0f172a'
                }}>
                  {unreadNotifCount}
                </span>
              )}
            </div>

            {showNotifDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  right: '-10px',
                  width: '340px',
                  maxHeight: '420px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  borderRadius: '14px',
                  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.28)',
                  border: '1px solid #e2e8f0',
                  zIndex: 2000,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700' }}>
                      {isAdmin ? '🛡️ Admin Notifications' : '🔔 My Notifications'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {unreadNotifCount} unread • {isAdmin ? 'Admin Alerts' : displayName}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotifsRead}
                        style={{
                          background: 'rgba(255,255,255,0.14)',
                          color: '#e2e8f0',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifs}
                        style={{
                          background: 'rgba(239,68,68,0.2)',
                          color: '#fca5a5',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ overflowY: 'auto', maxHeight: '340px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markSingleNotifRead(item.id)}
                        style={{
                          padding: '11px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: item.read ? '#ffffff' : '#f0f9ff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {item.createdAt}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: '1.35' }}>
                          {item.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} style={styles.logoutBtn}>➜ Logout</button>
        </div>
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
            errorMsg={activeTab === 'ManageUsers' ? errorMsg : ''}
            successMsg={activeTab === 'ManageUsers' ? successMsg : ''}
          />
        )}

        {activeTab === 'Feedback' && (
          <FeedbackTab isAdmin={isAdmin} />
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
            errorMsg={activeTab === 'Profile' ? errorMsg : ''}
            successMsg={activeTab === 'Profile' ? successMsg : ''}
            setErrorMsg={setErrorMsg}
            setSuccessMsg={setSuccessMsg}
            profileImage={profileImage}
            setProfileImage={setProfileImage}
          />
        )}

        {activeTab !== 'Profile' && activeTab !== 'ManageUsers' && activeTab !== 'Feedback' && (
          <>
            <div style={styles.bannerCard}>
              <div>
                <div style={styles.bannerSubTitle}>{isAdmin ? 'ADMIN DASHBOARD' : 'STUDENT DASHBOARD'}</div>
                <h1 style={styles.bannerTitle}>{isAdmin ? 'Overview & Controls' : `Welcome, ${displayName}`}</h1>
                <p style={styles.bannerDesc}>
                  {isAdmin ? 'Manage laboratory equipment, review student reservation requests, and export reports.' : 'Search available hardware, reserve lab equipment, and track your active bookings.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setSuccessMsg('');
                    setActiveTab('Profile');
                  }}
                  title="Open Account Settings"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 14px 8px 8px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.28)',
                    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.18)',
                    cursor: 'pointer',
                    color: '#ffffff',
                    textAlign: 'left',
                    transition: 'transform 0.15s ease, background-color 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '15px',
                      color: '#ffffff',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1.5px solid rgba(255, 255, 255, 0.45)'
                    }}
                  >
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={displayName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                  <div style={{ lineHeight: '1.25' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.82)' }}>
                      {isAdmin ? 'Lab Admin' : 'Student Account'}
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.85)', marginLeft: '2px' }}>
                    ›
                  </span>
                </button>
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
              <DashboardTab
                isAdmin={isAdmin}
                setActiveTab={setActiveTab}
                handleDownloadReport={handleDownloadReport}
                currentUser={user}
              />
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
                errorMsg={activeTab === 'Equipment' ? errorMsg : ''}
                successMsg={activeTab === 'Equipment' ? successMsg : ''}
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
                handleHandoverEquipment={handleHandoverEquipment}
                handleConfirmReturn={handleConfirmReturn}
                errorMsg={activeTab === 'Reservations' ? errorMsg : ''}
                successMsg={activeTab === 'Reservations' ? successMsg : ''}
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