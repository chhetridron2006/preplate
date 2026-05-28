/*
  controllers/ordersController.js — Business logic for order endpoints.

  Exported functions:
    getAllOrders      — GET    /api/orders        (all orders for logged-in student)
    getOneOrder       — GET    /api/orders/:id
    createOrder       — POST   /api/orders
    updateOrder       — PUT    /api/orders/:id
    deleteOrder       — DELETE /api/orders/:id
*/

const { pool } = require("../db");

/* ── GET all orders for the logged-in student ───────────────────────────── */
async function getAllOrders(req, res, next) {
  try {
    /* Only return orders belonging to this student */
    const result = await pool.query(
      `SELECT id, student_name, student_id, pickup_time, total_price, status, created_at
       FROM orders WHERE student_db_id = $1 ORDER BY created_at DESC`,
      [req.student.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

/* ── GET one order with its items ───────────────────────────────────────── */
async function getOneOrder(req, res, next) {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID." });
  }

  try {
    const orderResult = await pool.query(
      `SELECT id, student_name, student_id, pickup_time, total_price, status, created_at
       FROM orders WHERE id = $1 AND student_db_id = $2`,
      [orderId, req.student.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const itemsResult = await pool.query(
      `SELECT item_name, quantity, unit_price, row_total
       FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    next(err);
  }
}

/* ── POST create a new order ────────────────────────────────────────────── */
async function createOrder(req, res, next) {
  const { studentName, studentId, pickupTime, cart } = req.body;

  if (!studentName || typeof studentName !== "string" || studentName.trim() === "") {
    return res.status(400).json({ error: "studentName is required." });
  }
  if (!studentId || typeof studentId !== "string" || studentId.trim() === "") {
    return res.status(400).json({ error: "studentId is required." });
  }
  if (!pickupTime || typeof pickupTime !== "string" || pickupTime.trim() === "") {
    return res.status(400).json({ error: "pickupTime is required." });
  }
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "cart must be a non-empty array." });
  }

  for (const item of cart) {
    if (!item.name || typeof item.price !== "number" || typeof item.quantity !== "number") {
      return res.status(400).json({ error: "Each cart item must have a name, numeric price, and numeric quantity." });
    }
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    /* Link the order to the logged-in student's database id */
    const orderResult = await pool.query(
      `INSERT INTO orders (student_db_id, student_name, student_id, pickup_time, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING id`,
      [req.student.id, studentName.trim(), studentId.trim(), pickupTime.trim(), totalPrice]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cart) {
      const rowTotal = item.price * item.quantity;
      await pool.query(
        `INSERT INTO order_items (order_id, item_name, quantity, unit_price, row_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.name, item.quantity, item.price, rowTotal]
      );
    }

    res.status(201).json({ message: "Order placed successfully.", orderId, totalPrice });
  } catch (err) {
    next(err);
  }
}

/* ── PUT update an order's pickup time ──────────────────────────────────── */
async function updateOrder(req, res, next) {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID." });
  }

  const { pickupTime } = req.body;

  if (!pickupTime || typeof pickupTime !== "string" || pickupTime.trim() === "") {
    return res.status(400).json({ error: "pickupTime is required." });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET pickup_time = $1 WHERE id = $2 AND student_db_id = $3 RETURNING *`,
      [pickupTime.trim(), orderId, req.student.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order updated successfully.", order: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ── DELETE an order ────────────────────────────────────────────────────── */
async function deleteOrder(req, res, next) {
  const orderId = parseInt(req.params.id);

  if (isNaN(orderId)) {
    return res.status(400).json({ error: "Invalid order ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM orders WHERE id = $1 AND student_db_id = $2 RETURNING id",
      [orderId, req.student.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ message: "Order deleted successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllOrders, getOneOrder, createOrder, updateOrder, deleteOrder };
