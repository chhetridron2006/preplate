# PrePlate — Canteen Pre-Order System

A full-stack web application built with Node.js, Express, and PostgreSQL (Neon).

## Project Structure

```
preplate/
  controllers/
    menuController.js     — CRUD logic for menu items
    ordersController.js   — CRUD logic for orders
  middleware/
    errorHandler.js       — Global error handling middleware
  routes/
    menu.js               — API routes for /api/menu
    orders.js             — API routes for /api/orders
  public/
    index.html            — Frontend HTML
    app.js                — Frontend JavaScript
    style.css             — Styles (responsive for mobile + desktop)
  db.js                   — PostgreSQL connection and table setup
  server.js               — Express app entry point
  .env                    — Environment variables (not committed to Git)
  vercel.json             — Vercel deployment config
```

## API Endpoints

### Menu — /api/menu
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/menu | Get all menu items |
| GET | /api/menu/:id | Get one menu item |
| POST | /api/menu | Create a menu item |
| PUT | /api/menu/:id | Update a menu item |
| DELETE | /api/menu/:id | Delete a menu item |

### Orders — /api/orders
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/orders | Get all orders |
| GET | /api/orders/:id | Get one order with items |
| POST | /api/orders | Place a new order |
| PUT | /api/orders/:id | Update pickup time |
| DELETE | /api/orders/:id | Delete an order |

## Running Locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Images Required

Place these images in the `public/` folder:
- cst.jpg (login background)
- ema.jpg, phaksha.jpg, kewa.jpg, jasha.jpg
- vmomo.jpg, momo.jpg, red.jpg, butter_tea.jpg, water.jpg
