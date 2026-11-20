require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// ==================== EMAIL OTP CONFIGURATION (MAX 2 MINUTES) ====================
const OTP_EXPIRY_MS = 2 * 60 * 1000;
const signupOtpStore = new Map();
const forgotPasswordOtpStore = new Map();

const mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ==================== ADMIN ACCESS CONTROL ====================
// මෙහි Admin ලෙස login වීමට අවසර ඇත්තේ මෙම නිශ්චිත ඊමේල් ලිපින දෙකට පමණි
const ALLOWED_ADMIN_EMAILS = ['chathura@gmail.com', 'admin2@gmail.com']; 

// ==================== PASSWORD VALIDATION HELPER ====================
const validatePasswordStrength = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/']/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
};

// ==================== AUTHENTICATION MIDDLEWARES ====================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = decodedUser;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ==================== AUTHENTICATION ROUTES ====================

// 0. SEND EMAIL VERIFICATION OTP ROUTE (Expires in 2 minutes)
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email service is not configured on the server (.env).' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    signupOtpStore.set(normalizedEmail, { code, expiresAt });

    await mailTransporter.sendMail({
      from: `"Lab.Flow Verification" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Lab.Flow Account Verification Code (Valid for 2 Minutes)',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <h3>Lab.Flow Email Verification</h3>
          <p>Use the verification code below to complete your account registration:</p>
          <div style="font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #0284c7; margin: 14px 0;">
            ${code}
          </div>
          <p style="color: #dc2626; font-weight: bold;">This code will expire in 2 minutes.</p>
        </div>
      `,
    });

    res.json({ message: 'Verification code sent to your email. Valid for 2 minutes.' });
  } catch (err) {
    console.error("SEND OTP ERROR:", err.message);
    res.status(500).json({ error: 'Failed to send verification email: ' + err.message });
  }
});

// 0B. FORGOT PASSWORD - SEND RESET OTP (Expires in 2 minutes)
app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid registered email address.' });
  }

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: 'Email service is not configured on the server (.env).' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    forgotPasswordOtpStore.set(normalizedEmail, { code, expiresAt });

    await mailTransporter.sendMail({
      from: `"Lab.Flow Password Reset" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'Lab.Flow Password Reset Code (Valid for 2 Minutes)',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
          <h3>Lab.Flow Password Reset</h3>
          <p>Use the 6-digit code below to reset your account password:</p>
          <div style="font-size: 26px; font-weight: bold; letter-spacing: 6px; color: #0284c7; margin: 14px 0;">
            ${code}
          </div>
          <p style="color: #dc2626; font-weight: bold;">This code will expire in 2 minutes.</p>
        </div>
      `,
    });

    res.json({ message: 'Password reset code sent to your email. Valid for 2 minutes.' });
  } catch (err) {
    console.error("FORGOT PASSWORD SEND OTP ERROR:", err.message);
    res.status(500).json({ error: 'Failed to send reset code: ' + err.message });
  }
});

// 0C. FORGOT PASSWORD - VERIFY OTP & RESET PASSWORD
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const submittedOtp = (otp || '').trim();

  try {
    const otpRecord = forgotPasswordOtpStore.get(normalizedEmail);
    if (!otpRecord) {
      return res.status(400).json({ error: 'Please request a password reset code first.' });
    }
    if (Date.now() > otpRecord.expiresAt) {
      forgotPasswordOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Reset code has expired (2-minute limit). Please request a new code.' });
    }
    if (!submittedOtp || submittedOtp !== otpRecord.code) {
      return res.status(400).json({ error: 'Invalid reset code. Please check your email and try again.' });
    }

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE LOWER(email) = $2', [hashedPassword, normalizedEmail]);
    forgotPasswordOtpStore.delete(normalizedEmail);

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    console.error("FORGOT PASSWORD RESET ERROR:", err.message);
    res.status(500).json({ error: 'Failed to reset password: ' + err.message });
  }
});

// 1. REGISTER ROUTE (Requires valid 2-minute OTP)
app.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role, otp } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const submittedOtp = (otp || '').trim();

  try {
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const otpRecord = signupOtpStore.get(normalizedEmail);
    if (!otpRecord) {
      return res.status(400).json({ error: 'Please request a verification code first.' });
    }
    if (Date.now() > otpRecord.expiresAt) {
      signupOtpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'Verification code has expired (2-minute limit). Please request a new code.' });
    }
    if (!submittedOtp || submittedOtp !== otpRecord.code) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [(full_name || '').trim(), normalizedEmail, hashedPassword, role || 'STUDENT']
    );

    signupOtpStore.delete(normalizedEmail);

    res.status(201).json({
      message: 'Registration successful!',
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// 2. LOGIN ROUTE (නිශ්චිත Admin Emails දෙක පරීක්ෂා කිරීමේ ආරක්ෂිත පාලනය සහිතව)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found. Please Sign Up first.' });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password. Try again.' });
    }

    // ⚠️ ආරක්ෂිත පියවර: කෙනෙක් ADMIN ලෙස role එක තබාගෙන login වීමට හැදුවද, 
    // ඔහු ඉහත සඳහන් කළ අනුමත ඊමේල් ලිපින දෙකෙන් එකකට අයත් විය යුතුමයි!
    if (user.role === 'ADMIN') {
      if (!ALLOWED_ADMIN_EMAILS.includes(user.email)) {
        return res.status(403).json({ 
          error: 'Access Denied: You are not authorized to log in as an Administrator.' 
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// 2B. GOOGLE LOGIN ROUTE (Database එකේ User නැත්නම් Register කර JWT Token ලබා දීම)
app.post('/api/auth/google', async (req, res) => {
  const { email, full_name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google login.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);

    let dbUser;

    if (userResult.rows.length > 0) {
      dbUser = userResult.rows[0];
    } else {
      const assignedRole = ALLOWED_ADMIN_EMAILS.includes(normalizedEmail) ? 'ADMIN' : 'STUDENT';
      const randomSecret = crypto.randomBytes(24).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomSecret, salt);
      const displayName = (full_name && full_name.trim()) || normalizedEmail.split('@')[0];

      const insertedUser = await pool.query(
        'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
        [displayName, normalizedEmail, hashedPassword, assignedRole]
      );
      dbUser = insertedUser.rows[0];
    }

    const token = jwt.sign(
      { id: dbUser.id, email: dbUser.email, role: dbUser.role, full_name: dbUser.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: dbUser.id,
        full_name: dbUser.full_name,
        email: dbUser.email,
        role: dbUser.role
      }
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// 3. CHANGE PASSWORD ROUTE
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newHashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err.message);
    res.status(500).json({ error: 'Failed to update password: ' + err.message });
  }
});

// ==================== EQUIPMENT ROUTES ====================

app.get('/api/equipment', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("EQUIPMENT FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipment', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, serial_number, quantity } = req.body;
    const qty = parseInt(quantity) || 5;
    const result = await pool.query(
      'INSERT INTO equipment (name, category, serial_number, status, quantity, available_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category, serial_number, 'AVAILABLE', qty, qty]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("ADD EQUIPMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// RETURN / ADJUST AVAILABLE EQUIPMENT STOCK (Admin Only - Supports both +add and -reduce, capped between 0 and total quantity)
app.patch('/api/equipment/:id/return', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_returned, available_quantity } = req.body;

    const eqResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [id]);
    if (eqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const eq = eqResult.rows[0];
    const totalQty = Number(eq.quantity) || 5;
    const currentAvail = Number(eq.available_quantity !== undefined ? eq.available_quantity : totalQty);

    let nextAvail;
    if (quantity_returned !== undefined) {
      const deltaQty = parseInt(quantity_returned, 10) || 0;
      nextAvail = Math.min(totalQty, Math.max(0, currentAvail + deltaQty));
    } else if (available_quantity !== undefined) {
      nextAvail = Math.min(totalQty, Math.max(0, parseInt(available_quantity, 10) || 0));
    } else {
      nextAvail = Math.min(totalQty, Math.max(0, currentAvail + 1));
    }

    const nextStatus = nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

    const updatedEq = await pool.query(
      'UPDATE equipment SET available_quantity = $1, status = $2 WHERE id = $3 RETURNING *',
      [nextAvail, nextStatus, id]
    );

    res.json(updatedEq.rows[0]);
  } catch (err) {
    console.error("RETURN EQUIPMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD NEW STOCK UNITS (Admin Only - Increases both quantity and available_quantity)
app.patch('/api/equipment/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { add_quantity } = req.body;
    const addUnits = Math.max(1, parseInt(add_quantity, 10) || 1);

    const eqResult = await pool.query('SELECT * FROM equipment WHERE id = $1', [id]);
    if (eqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const eq = eqResult.rows[0];
    const totalQty = Number(eq.quantity) || 5;
    const currentAvail = Number(eq.available_quantity !== undefined ? eq.available_quantity : totalQty);

    const nextTotal = totalQty + addUnits;
    const nextAvail = currentAvail + addUnits;
    const nextStatus = nextAvail > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';

    const updatedEq = await pool.query(
      'UPDATE equipment SET quantity = $1, available_quantity = $2, status = $3 WHERE id = $4 RETURNING *',
      [nextTotal, nextAvail, nextStatus, id]
    );

    res.json(updatedEq.rows[0]);
  } catch (err) {
    console.error("ADD STOCK ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipment/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM equipment WHERE id = $1', [id]);
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    console.error("DELETE EQUIPMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== BOOKINGS ROUTES ====================

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT b.id, b.user_id, u.full_name as student_name, e.name as equipment, 
             e.serial_number, b.start_time, b.end_time, b.status,
             COALESCE(b.handover_status, 'NONE') as handover_status
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN equipment e ON b.equipment_id = e.id
      ORDER BY b.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("BOOKINGS FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:userId/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT b.id, e.name as equipment, e.serial_number, b.start_time, b.end_time, b.status,
             COALESCE(b.handover_status, 'NONE') as handover_status
      FROM bookings b
      JOIN equipment e ON b.equipment_id = e.id
      WHERE b.user_id = $1
      ORDER BY b.id DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("USER BOOKINGS FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { user_id, equipment_id, start_time, end_time } = req.body;
  try {
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const maxDurationMs = 14 * 24 * 60 * 60 * 1000;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start or end time.' });
    }
    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }
    if (endDate.getTime() - startDate.getTime() > maxDurationMs) {
      return res.status(400).json({ error: 'Booking duration cannot exceed 2 weeks (14 days).' });
    }

    const eqCheck = await pool.query('SELECT available_quantity FROM equipment WHERE id = $1', [equipment_id]);
    if (eqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const currentQty = eqCheck.rows[0].available_quantity;
    if (currentQty <= 0) {
      return res.status(400).json({ error: 'Equipment is currently out of stock!' });
    }

    const newBooking = await pool.query(
      'INSERT INTO bookings (user_id, equipment_id, start_time, end_time, status, handover_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_id, equipment_id, start_time, end_time, 'PENDING', 'NONE']
    );

    await pool.query(
      'UPDATE equipment SET available_quantity = available_quantity - 1 WHERE id = $1',
      [equipment_id]
    );

    res.status(201).json(newBooking.rows[0]);
  } catch (err) {
    console.error("BOOKING CREATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// STUDENT HANDOVER: Student equipment එක ආපහු භාර දුන් බව Admin ට දැනුම් දීම (Stock වෙනස් නොවේ)
app.patch('/api/bookings/:id/handover', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingCheck.rows[0];
    if (Number(booking.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. You can only handover your own equipment.' });
    }

    const updated = await pool.query(
      `UPDATE bookings SET handover_status = 'HANDED_OVER' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("HANDOVER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADMIN CONFIRM RETURN: Admin භාරගත් බව තහවුරු කර අදාළ Student ට දැනුම් දීම (Stock වෙනස් නොවේ)
app.patch('/api/bookings/:id/confirm-return', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const updated = await pool.query(
      `UPDATE bookings SET handover_status = 'CONFIRMED' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error("CONFIRM RETURN ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingCheck.rows[0];

    if (req.user.role !== 'ADMIN') {
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only modify your own bookings.' });
      }
      if (status !== 'CANCELLED' && status !== 'RETURNED') {
        return res.status(403).json({ error: 'Access denied. Only admins can approve or reject bookings.' });
      }
    }

    if ((status === 'CANCELLED' || status === 'RETURNED' || status === 'REJECTED') && 
        booking.status !== 'CANCELLED' && booking.status !== 'RETURNED' && booking.status !== 'REJECTED') {
      await pool.query(
        'UPDATE equipment SET available_quantity = LEAST(quantity, available_quantity + 1) WHERE id = $1',
        [booking.equipment_id]
      );
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingCheck.rows[0];

    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }

    if (booking.status !== 'CANCELLED' && booking.status !== 'RETURNED' && booking.status !== 'REJECTED') {
      await pool.query(
        'UPDATE equipment SET available_quantity = LEAST(quantity, available_quantity + 1) WHERE id = $1',
        [booking.equipment_id]
      );
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ message: 'Booking deleted/cancelled successfully.' });
  } catch (err) {
    console.error("DELETE BOOKING ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== FEEDBACK ROUTES (NEWLY ADDED) ====================

// 1. GET ALL FEEDBACKS (With accurate user attribution)
app.get('/api/feedbacks', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT f.id,
             f.user_id,
             COALESCE(NULLIF(TRIM(f.student_name), ''), u.full_name, SPLIT_PART(u.email, '@', 1), 'Student') AS student_name,
             u.email AS user_email,
             f.target_equipment,
             f.category,
             f.rating,
             f.observations,
             f.status,
             f.created_at
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC, f.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("FEEDBACK FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE NEW FEEDBACK (Resolved from authenticated token + payload)
app.post('/api/feedbacks', authenticateToken, async (req, res) => {
  const { user_id, student_name, target_equipment, category, rating, observations } = req.body;
  try {
    const resolvedUserId = req.user?.id || user_id || null;
    const tokenName = req.user?.full_name || (req.user?.email ? req.user.email.split('@')[0] : null);
    const resolvedStudentName =
      (student_name && student_name.trim() && student_name.trim() !== 'Current Student')
        ? student_name.trim()
        : (tokenName || 'Student');

    const newFeedback = await pool.query(
      `INSERT INTO feedbacks (user_id, student_name, target_equipment, category, rating, observations, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending Review') RETURNING *`,
      [resolvedUserId, resolvedStudentName, target_equipment, category, rating, observations]
    );

    res.status(201).json({
      ...newFeedback.rows[0],
      user_email: req.user?.email || ''
    });
  } catch (err) {
    console.error("FEEDBACK CREATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. MARK FEEDBACK AS REVIEWED (Admin Only)
app.patch('/api/feedbacks/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateFeedback = await pool.query(
      `UPDATE feedbacks SET status = 'Reviewed' WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json({ message: 'Feedback marked as reviewed successfully', feedback: updateFeedback.rows[0] });
  } catch (err) {
    console.error("FEEDBACK UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS & PROFILE ROUTES ====================

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("USERS FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// TOGGLE USER STATUS (Suspend / Unblock - Master Admin ට පමණක් වෙනත් Admin ලාව Suspend කිරීමට ඉඩ දීම සඳහා)
app.patch('/api/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query('SELECT email, role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userCheck.rows[0];
    const MASTER_ADMIN_EMAIL = 'chathura@gmail.com';
    
    if (targetUser.role === 'ADMIN' && req.user.email !== MASTER_ADMIN_EMAIL) {
      return res.status(403).json({ 
        error: 'Access Denied: Only the Master Administrator can suspend another administrator!' 
      });
    }

    res.json({ message: 'User status updated successfully.' });
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin Only - ප්‍රධාන Admin ලා දෙදෙනා මක දැමීම වැළැක්වීම සඳහා ආරක්ෂිත පාලනය සහිතව)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetEmail = userCheck.rows.length > 0 ? userCheck.rows[0].email : '';
    const PROTECTED_ADMIN_EMAILS = ['chathura@gmail.com', 'admin2@gmail.com'];
    
    if (PROTECTED_ADMIN_EMAILS.includes(targetEmail)) {
      return res.status(403).json({ error: 'Action Denied: You cannot delete primary system administrators!' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error("DELETE USER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { full_name, email } = req.body;
  try {
    await pool.query(
      'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
      [full_name, email, req.user.id]
    );
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== REPORTS ROUTE ====================

app.get('/api/reports/daily', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT b.id, u.full_name, e.name as equipment, e.serial_number, 
             b.start_time, b.end_time, b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN equipment e ON b.equipment_id = e.id
      WHERE CURRENT_DATE IN (DATE(b.start_time), DATE(b.created_at))
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("REPORT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== MONTHLY REPORT API (Admin Only) ====================
app.get('/api/reports/monthly', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT b.id, u.full_name, e.name as equipment, e.serial_number, 
             b.start_time, b.end_time, b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN equipment e ON b.equipment_id = e.id
      WHERE EXTRACT(MONTH FROM b.start_time) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM b.start_time) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("MONTHLY REPORT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;

const ensureFeedbacksTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      student_name VARCHAR(255) NOT NULL,
      target_equipment VARCHAR(255) DEFAULT 'General Lab Feedback',
      category VARCHAR(150) NOT NULL,
      rating INTEGER DEFAULT 5,
      observations TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending Review',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const ensureHandoverColumn = async () => {
  await pool.query(`
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS handover_status VARCHAR(50) DEFAULT 'NONE'
  `);
};

const startServer = async () => {
  try {
    await ensureFeedbacksTable();
    await ensureHandoverColumn();
  } catch (err) {
    console.error("TABLE INIT WARNING:", err.message);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();