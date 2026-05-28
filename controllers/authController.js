/*
  controllers/authController.js — Registration and login logic.

  Uses bcrypt to hash passwords before storing them.
  Uses jsonwebtoken to issue a token on successful login.
  The token is stored in the browser and sent with each API request
  to prove the student is logged in.

  Exported functions:
    register — POST /api/auth/register
    login    — POST /api/auth/login
*/

const bcrypt = require("bcrypt");
const jwt    = require("jsonwebtoken");
const { pool } = require("../db");

/* Number of bcrypt salt rounds — higher = slower but more secure */
const SALT_ROUNDS = 10;

/* Secret key used to sign JWT tokens — read from .env */
function getSecret() {
  return process.env.JWT_SECRET || "preplate_secret_key";
}

/* ── POST /api/auth/register ────────────────────────────────────────────── */
async function register(req, res, next) {
  const { fullName, studentId, email, password } = req.body;

  /* Validate all required fields */
  if (!fullName || !studentId || !email || !password) {
    return res.status(400).json({ error: "All fields are required: fullName, studentId, email, password." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    /* Check if student ID or email is already registered */
    const existing = await pool.query(
      "SELECT id FROM students WHERE student_id = $1 OR email = $2",
      [studentId, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "An account with this Student ID or email already exists." });
    }

    /* Hash the password before saving — never store plain text passwords */
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO students (full_name, student_id, email, password_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, full_name, student_id, email`,
      [fullName, studentId, email, passwordHash]
    );

    const student = result.rows[0];

    /* Issue a JWT token so the student is logged in immediately after registering */
    const token = jwt.sign(
      { id: student.id, studentId: student.student_id, name: student.full_name },
      getSecret(),
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Account created successfully.", token, student });
  } catch (err) {
    next(err);
  }
}

/* ── POST /api/auth/login ───────────────────────────────────────────────── */
async function login(req, res, next) {
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: "studentId and password are required." });
  }

  try {
    /* Find the student account by student ID */
    const result = await pool.query(
      "SELECT * FROM students WHERE student_id = $1",
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid Student ID or password." });
    }

    const student = result.rows[0];

    /* Compare the submitted password against the stored hash */
    const passwordMatch = await bcrypt.compare(password, student.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid Student ID or password." });
    }

    /* Issue a JWT token valid for 7 days */
    const token = jwt.sign(
      { id: student.id, studentId: student.student_id, name: student.full_name },
      getSecret(),
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful.",
      token,
      student: { id: student.id, fullName: student.full_name, studentId: student.student_id, email: student.email }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
