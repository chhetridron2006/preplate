/*
  controllers/menuController.js — Business logic for menu item endpoints.

  Controllers handle the actual database work and response building.
  The route files just map URLs to these functions, keeping code clean and separated.

  Exported functions:
    getAllMenuItems   — GET  /api/menu
    getOneMenuItem   — GET  /api/menu/:id
    createMenuItem   — POST /api/menu
    updateMenuItem   — PUT  /api/menu/:id
    deleteMenuItem   — DELETE /api/menu/:id
*/

const { pool } = require("../db");

/* ── GET all menu items ─────────────────────────────────────────────────── */
async function getAllMenuItems(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY category, name"
    );
    res.json(result.rows);
  } catch (err) {
    /* Pass error to the global error handler middleware */
    next(err);
  }
}

/* ── GET one menu item by ID ────────────────────────────────────────────── */
async function getOneMenuItem(req, res, next) {
  const itemId = parseInt(req.params.id);

  /* Validate that the ID is a real number */
  if (isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM menu_items WHERE id = $1",
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/* ── POST create a new menu item ────────────────────────────────────────── */
async function createMenuItem(req, res, next) {
  const { name, description, price, category, available, img } = req.body;

  /* Validate required fields */
  if (!name || !description || price === undefined) {
    return res.status(400).json({
      error: "name, description, and price are required fields."
    });
  }

  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({ error: "price must be a positive number." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO menu_items (name, description, price, category, available, img)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        name,
        description,
        price,
        category  || "main",
        available !== undefined ? available : true,
        img       || "default.jpg"
      ]
    );

    /* 201 Created — return the newly created item */
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/* ── PUT update an existing menu item ───────────────────────────────────── */
async function updateMenuItem(req, res, next) {
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  const { name, description, price, category, available, img } = req.body;

  /* At least one field must be provided to update */
  if (!name && !description && price === undefined && !category && available === undefined && !img) {
    return res.status(400).json({ error: "Please provide at least one field to update." });
  }

  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    return res.status(400).json({ error: "price must be a positive number." });
  }

  try {
    /* Check the item exists first */
    const existing = await pool.query(
      "SELECT * FROM menu_items WHERE id = $1", [itemId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    const current = existing.rows[0];

    /* Use existing values for any field not included in the request body */
    const updatedName        = name        !== undefined ? name        : current.name;
    const updatedDescription = description !== undefined ? description : current.description;
    const updatedPrice       = price       !== undefined ? price       : current.price;
    const updatedCategory    = category    !== undefined ? category    : current.category;
    const updatedAvailable   = available   !== undefined ? available   : current.available;
    const updatedImg         = img         !== undefined ? img         : current.img;

    const result = await pool.query(
      `UPDATE menu_items
       SET name=$1, description=$2, price=$3, category=$4, available=$5, img=$6
       WHERE id=$7 RETURNING *`,
      [updatedName, updatedDescription, updatedPrice, updatedCategory, updatedAvailable, updatedImg, itemId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

/* ── DELETE a menu item ─────────────────────────────────────────────────── */
async function deleteMenuItem(req, res, next) {
  const itemId = parseInt(req.params.id);

  if (isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid menu item ID." });
  }

  try {
    const result = await pool.query(
      "DELETE FROM menu_items WHERE id = $1 RETURNING id",
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Menu item not found." });
    }

    res.json({ message: "Menu item deleted successfully." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllMenuItems,
  getOneMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
