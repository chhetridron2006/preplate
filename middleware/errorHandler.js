/*
  middleware/errorHandler.js — Global error-handling middleware.

  Express recognises a function with four parameters (err, req, res, next)
  as an error handler. Any route that calls next(err) or throws inside
  an async wrapper will land here instead of crashing the server.

  This must be registered AFTER all routes in server.js.
*/

function errorHandler(err, req, res, next) {
  /* Log the full error on the server so we can debug it */
  console.error("Unhandled error:", err.message);

  /* Choose a status code — use the one attached to the error or default to 500 */
  const statusCode = err.statusCode || 500;

  /* Always return JSON so the frontend can read the message */
  res.status(statusCode).json({
    error: err.message || "An unexpected server error occurred."
  });
}

module.exports = errorHandler;
