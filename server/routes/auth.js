import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'pakjai-secret-key-change-in-production';

// Helper to create email transporter
let transporter;
// Brevo API integration doesn't need an instance, just the key
const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function initMailer() {
  try {
    if (BREVO_API_KEY) {
      console.log('Using Brevo API for email delivery.');
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('Attempting to initialize Real Mailer (Port 465 SSL) for:', process.env.EMAIL_USER);
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.gmail.com',
        port: 587,
        secure: false, // port 587 uses STARTTLS
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false 
        },
        family: 4, // CRITICAL: Force IPv4 to prevent ENETUNREACH on Railway
        debug: true, 
        logger: true
      });

      // Verification to catch connection issues early
      transporter.verify((error, success) => {
        if (error) {
          console.error('SMTP Verification Error (Startup):', error.message);
        } else {
          console.log('Server is ready to take our messages (SMTP Verified)');
        }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Ethereal Mock Mailer initialized. (No EMAIL_USER found)');
    }
  } catch (err) {
    console.error('Failed to init Mailer', err);
  }
}
initMailer();

// Helper to read users
function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write users
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const users = getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code

    const newUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: false,
      otp
    };

    users.push(newUser);
    saveUsers(users);

    // LOG THE CODE TO CONSOLE (Backup for blocked SMTP)
    console.log('-------------------------------------------');
    console.log(`[VERIFICATION CODE for ${newUser.email}]: ${newUser.otp}`);
    console.log('-------------------------------------------');

    // Send email in background (don't block the response)
    if (BREVO_API_KEY) {
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PakJaiTravel', email: process.env.EMAIL_USER || 'elefteriacompany@gmail.com' },
          to: [{ email: newUser.email, name: newUser.name }],
          subject: 'Your Verification Code',
          htmlContent: `<b>Hello ${newUser.name}</b>,<br/>Your verification code is <h2>${newUser.otp}</h2>`
        })
      })
      .then(res => res.json())
      .then(data => console.log("Brevo API Email sent response:", data))
      .catch(err => console.error("Brevo API Network Error:", err));
    } else if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER ? `"PakJaiTravel" <${process.env.EMAIL_USER}>` : '"PakJaiTravel Admin" <no-reply@pakjaitravel.com>',
        to: newUser.email,
        subject: "Your Verification Code",
        text: `Hello ${newUser.name}, your verification code is ${newUser.otp}`,
        html: `<b>Hello ${newUser.name}</b>,<br/>Your verification code is <h2>${newUser.otp}</h2>`
      }).then(info => {
        if (!process.env.EMAIL_USER) {
          console.log("Mock Email sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
        } else {
          console.log("Real Email sent to:", newUser.email);
        }
      }).catch(mailErr => {
        console.error("Failed to send email in background:", mailErr.message);
      });
    }

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'Registration successful. Account created and logged in.',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, isVerified: newUser.isVerified }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify - Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark as verified
    user.isVerified = true;
    delete user.otp;
    saveUsers(users);

    // Issue token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified }
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/resend-otp - Resend verification code
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'User is already verified.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    saveUsers(users);

    // LOG THE CODE TO CONSOLE (Backup for blocked SMTP)
    console.log('-------------------------------------------');
    console.log(`[NEW VERIFICATION CODE for ${user.email}]: ${user.otp}`);
    console.log('-------------------------------------------');

    // Send email in background
    if (BREVO_API_KEY) {
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PakJaiTravel', email: process.env.EMAIL_USER || 'elefteriacompany@gmail.com' },
          to: [{ email: user.email, name: user.name }],
          subject: 'Your New Verification Code',
          htmlContent: `<b>Hello ${user.name}</b>,<br/>Your new verification code is <h2>${user.otp}</h2>`
        })
      })
      .then(res => res.json())
      .then(data => console.log("Brevo API Resend Email sent response:", data))
      .catch(err => console.error("Brevo API Network Error:", err));
    } else if (transporter) {
      transporter.sendMail({
        from: process.env.EMAIL_USER ? `"PakJaiTravel" <${process.env.EMAIL_USER}>` : '"PakJaiTravel Admin" <no-reply@pakjaitravel.com>',
        to: user.email,
        subject: "Your New Verification Code",
        text: `Hello ${user.name}, your new verification code is ${user.otp}`,
        html: `<b>Hello ${user.name}</b>,<br/>Your new verification code is <h2>${user.otp}</h2>`
      }).then(info => {
        if (!process.env.EMAIL_USER) {
          console.log("Mock Resend Email sent! Preview URL: %s", nodemailer.getTestMessageUrl(info));
        } else {
          console.log("Real Resend Email sent to:", user.email);
        }
      }).catch(mailErr => {
        console.error("Failed to resend email in background:", mailErr.message);
        console.log("Check the console log above for the new code!");
      });
    }

    res.json({ message: 'A new verification code has been sent to your email (Check logs if not received).' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me - Verify token & get user data
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, isVerified: user.isVerified } });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// GET /api/auth/users - Admin fetch all users
router.get('/users', (req, res) => {
  try {
    const users = getUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// DELETE /api/auth/users/:id - Admin delete user
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    let users = getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    users.splice(userIndex, 1);
    saveUsers(users);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// PATCH /api/auth/users/:id - Admin update user details
router.patch('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    let users = getUsers();
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    
    saveUsers(users);
    res.json({ message: 'User updated successfully.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

export default router;
