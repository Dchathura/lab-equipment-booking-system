require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

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

// 1. REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role',
      [full_name, email, hashedPassword, role || 'STUDENT']
    );

    res.status(201).json({
      message: 'Registration successful!',
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// 2. LOGIN ROUTE
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

// 3. CHANGE PASSWORD ROUTE
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
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

// GET ALL EQUIPMENT
app.get('/api/equipment', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("EQUIPMENT FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ADD NEW EQUIPMENT (Admin Only)
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

// DELETE EQUIPMENT (Admin Only)
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

// GET ALL BOOKINGS
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT b.id, b.user_id, u.full_name as student_name, e.name as equipment, 
             e.serial_number, b.start_time, b.end_time, b.status
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
// GET BOOKINGS BY SPECIFIC USER ID (Admin Only)
app.get('/api/users/:userId/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT b.id, e.name as equipment, e.serial_number, b.start_time, b.end_time, b.status
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
// CREATE NEW BOOKING (Stock 1 කින් අඩු වේ)
app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { user_id, equipment_id, start_time, end_time } = req.body;
  try {
    // 1. Check stock availability
    const eqCheck = await pool.query('SELECT available_quantity FROM equipment WHERE id = $1', [equipment_id]);
    if (eqCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const currentQty = eqCheck.rows[0].available_quantity;
    if (currentQty <= 0) {
      return res.status(400).json({ error: 'Equipment is currently out of stock!' });
    }

    // 2. Create booking
    const newBooking = await pool.query(
      'INSERT INTO bookings (user_id, equipment_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, equipment_id, start_time, end_time, 'PENDING']
    );

    // 3. Decrease available quantity by 1
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

// UPDATE BOOKING STATUS (Cancel / Return / Reject වුණොත් Stock 1 කින් වැඩි වේ)
app.patch('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check existing booking
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingCheck.rows[0];

    // Security Check: If NOT admin, user can ONLY change status to 'CANCELLED' or 'RETURNED' on their OWN booking
    if (req.user.role !== 'ADMIN') {
      if (booking.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only modify your own bookings.' });
      }
      if (status !== 'CANCELLED' && status !== 'RETURNED') {
        return res.status(403).json({ error: 'Access denied. Only admins can approve or reject bookings.' });
      }
    }

    // Restore stock if status changed to CANCELLED, RETURNED, or REJECTED
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

// DELETE / CANCEL BOOKING ROUTE (Active එකක් delete කළොත් Stock එක නැවත වැඩි වේ)
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const booking = bookingCheck.rows[0];

    // Security Check: Admin OR owner of the booking
    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }

    // Restore quantity back if it was active
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

// ==================== USERS & PROFILE ROUTES ====================

// GET ALL USERS (Admin Only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("USERS FETCH ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER ROLE (Admin Only)
app.patch('/api/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    console.error("UPDATE ROLE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER (Admin Only)
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error("DELETE USER ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PROFILE ROUTE
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

// DAILY REPORT API (Admin Only)
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

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));