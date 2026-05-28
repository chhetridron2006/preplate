/*
  middleware/auth.js — JWT authentication middleware.

  Checks that the request includes a valid token in the
  Authorization header before allowing access to protected routes.

  Usage: router.get("/protected", requireAuth, controllerFunction)
*/

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  /* Token is sent as: Authorization: Bearer <token> */
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    /* Verify the token and attach the decoded student info to the request */
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "preplate_secret_key");
    req.student = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

module.exports = requireAuth;
