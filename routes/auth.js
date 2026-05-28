/*
  routes/auth.js — URL mappings for authentication endpoints.

  POST /api/auth/register — create a new student account
  POST /api/auth/login    — log in and receive a token
*/

const express = require("express");
const router  = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login",    login);

module.exports = router;
