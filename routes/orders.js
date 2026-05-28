/*
  routes/orders.js — URL mappings for the orders resource.
  All routes require authentication (requireAuth middleware).

  Base path: /api/orders

  GET    /api/orders        → getAllOrders  (student's own orders)
  GET    /api/orders/:id    → getOneOrder
  POST   /api/orders        → createOrder
  PUT    /api/orders/:id    → updateOrder
  DELETE /api/orders/:id    → deleteOrder
*/

const express     = require("express");
const router      = express.Router();
const requireAuth = require("../middleware/auth");
const { getAllOrders, getOneOrder, createOrder, updateOrder, deleteOrder } = require("../controllers/ordersController");

/* All order routes are protected — student must be logged in */
router.get("/",       requireAuth, getAllOrders);
router.post("/",      requireAuth, createOrder);
router.get("/:id",    requireAuth, getOneOrder);
router.put("/:id",    requireAuth, updateOrder);
router.delete("/:id", requireAuth, deleteOrder);

module.exports = router;
