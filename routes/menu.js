/*
  routes/menu.js — URL mappings for the menu resource.

  Maps each HTTP method + path to the correct controller function.
  Keeping routes thin (no logic here) makes the code easy to read and test.

  Base path: /api/menu  (registered in server.js)

  GET    /api/menu        → getAllMenuItems
  GET    /api/menu/:id    → getOneMenuItem
  POST   /api/menu        → createMenuItem
  PUT    /api/menu/:id    → updateMenuItem
  DELETE /api/menu/:id    → deleteMenuItem
*/

const express = require("express");
const router  = express.Router();

const {
  getAllMenuItems,
  getOneMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require("../controllers/menuController");

/* Collection routes — no ID */
router.get("/",    getAllMenuItems);
router.post("/",   createMenuItem);

/* Item routes — require an :id parameter */
router.get("/:id",    getOneMenuItem);
router.put("/:id",    updateMenuItem);
router.delete("/:id", deleteMenuItem);

module.exports = router;
