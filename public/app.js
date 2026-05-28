/*
  app.js — PrePlate frontend logic.

  Features:
    1. Register / Login with JWT token stored in localStorage
    2. Menu loaded from backend API
    3. Cart management with collapse/expand toggle
    4. Order placement via POST /api/orders
    5. Order tracking screen showing past orders with status
*/


/* ── App State ──────────────────────────────────────────────────────────── */

var menuItems      = [];  /* populated from GET /api/menu */
var cart           = [];  /* current cart items */
var currentStudent = { name: "", id: "" };  /* logged-in student info */
var authToken      = "";  /* JWT token for API requests */
var cartVisible    = true; /* tracks whether cart panel is expanded */


/* ── Screen Switching ───────────────────────────────────────────────────── */

/*
  showScreen(id)
  Hides all screens then shows only the one with the given id.
*/
function showScreen(id) {
  var screens = document.querySelectorAll(".screen");
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.add("hidden");
  }
  document.getElementById(id).classList.remove("hidden");
}


/* ── Auth Tab Switching ─────────────────────────────────────────────────── */

/*
  switchTab(tab)
  Toggles between the login and register forms on the login screen.
*/
function switchTab(tab) {
  var loginForm    = document.getElementById("form-login");
  var registerForm = document.getElementById("form-register");
  var tabLogin     = document.getElementById("tab-login");
  var tabRegister  = document.getElementById("tab-register");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
  }

  /* Clear error messages when switching tabs */
  document.getElementById("error-login").textContent    = "";
  document.getElementById("error-register").textContent = "";
}


/* ── Registration ───────────────────────────────────────────────────────── */

/*
  handleRegister()
  Reads the registration form, validates inputs, then calls POST /api/auth/register.
  On success, saves the token and moves to the menu screen.
*/
function handleRegister() {
  var fullName = document.getElementById("reg-name").value.trim();
  var studentId = document.getElementById("reg-id").value.trim();
  var email    = document.getElementById("reg-email").value.trim();
  var password = document.getElementById("reg-password").value;
  var errorEl  = document.getElementById("error-register");

  errorEl.textContent = "";

  /* Client-side validation before sending to API */
  if (!fullName)   { errorEl.textContent = "Please enter your full name."; return; }
  if (!studentId)  { errorEl.textContent = "Please enter your Student ID."; return; }
  if (!email)      { errorEl.textContent = "Please enter your email."; return; }
  if (password.length < 6) { errorEl.textContent = "Password must be at least 6 characters."; return; }

  var btn = document.getElementById("btn-register");
  btn.disabled    = true;
  btn.textContent = "Creating account…";

  fetch("/api/auth/register", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ fullName, studentId, email, password })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      return data;
    });
  })
  .then(function(data) {
    /* Save token and student info then go to the menu */
    saveSession(data.token, data.student.fullName || fullName, data.student.studentId || studentId);
    fetchMenu();
    showScreen("screen-menu");
  })
  .catch(function(err) {
    errorEl.textContent = err.message;
  })
  .finally(function() {
    btn.disabled    = false;
    btn.textContent = "Create Account →";
  });
}


/* ── Login ──────────────────────────────────────────────────────────────── */

/*
  handleLogin()
  Reads the login form and calls POST /api/auth/login.
  On success, saves the token and moves to the menu screen.
*/
function handleLogin() {
  var studentId = document.getElementById("login-id").value.trim();
  var password  = document.getElementById("login-password").value;
  var errorEl   = document.getElementById("error-login");

  errorEl.textContent = "";

  if (!studentId) { errorEl.textContent = "Please enter your Student ID."; return; }
  if (!password)  { errorEl.textContent = "Please enter your password."; return; }

  var btn = document.getElementById("btn-login");
  btn.disabled    = true;
  btn.textContent = "Logging in…";

  fetch("/api/auth/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ studentId, password })
  })
  .then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || "Login failed.");
      return data;
    });
  })
  .then(function(data) {
    saveSession(data.token, data.student.fullName, data.student.studentId);
    fetchMenu();
    showScreen("screen-menu");
  })
  .catch(function(err) {
    errorEl.textContent = err.message;
  })
  .finally(function() {
    btn.disabled    = false;
    btn.textContent = "Login →";
  });
}

/*
  saveSession(token, name, id)
  Stores the JWT and student info so it persists across page refreshes.
*/
function saveSession(token, name, id) {
  authToken = token;
  currentStudent.name = name;
  currentStudent.id   = id;
  localStorage.setItem("preplate_token", token);
  localStorage.setItem("preplate_name",  name);
  localStorage.setItem("preplate_id",    id);
  document.getElementById("nav-student-name").textContent        = "👤 " + name;
  document.getElementById("nav-student-name-orders").textContent = "👤 " + name;
}

/*
  checkExistingSession()
  On page load, checks if a token is already saved and skips the login screen.
*/
function checkExistingSession() {
  var savedToken = localStorage.getItem("preplate_token");
  var savedName  = localStorage.getItem("preplate_name");
  var savedId    = localStorage.getItem("preplate_id");

  if (savedToken && savedName && savedId) {
    saveSession(savedToken, savedName, savedId);
    fetchMenu();
    showScreen("screen-menu");
  }
}


/* ── Authenticated Fetch Helper ─────────────────────────────────────────── */

/*
  authFetch(url, options)
  Wrapper around fetch that automatically adds the Authorization header.
  All protected API calls use this instead of plain fetch.
*/
function authFetch(url, options) {
  options = options || {};
  options.headers = options.headers || {};
  options.headers["Authorization"] = "Bearer " + authToken;
  options.headers["Content-Type"]  = options.headers["Content-Type"] || "application/json";
  return fetch(url, options);
}


/* ── Menu ───────────────────────────────────────────────────────────────── */

/*
  fetchMenu()
  Calls GET /api/menu to load all food items from the database.
  No auth required for viewing the menu.
*/
function fetchMenu() {
  var loadingMsg = document.getElementById("menu-loading");
  var grid       = document.getElementById("menu-grid");

  loadingMsg.textContent   = "Loading menu…";
  loadingMsg.style.display = "block";
  grid.textContent         = "";

  fetch("/api/menu")
    .then(function(res) {
      if (!res.ok) throw new Error("Could not load menu.");
      return res.json();
    })
    .then(function(items) {
      menuItems                = items;
      loadingMsg.style.display = "none";
      renderMenu();
    })
    .catch(function(err) {
      loadingMsg.textContent = "⚠️ " + err.message;
    });
}

/*
  renderMenu()
  Builds a card element for each menu item using createElement.
  No innerHTML used for DOM construction.
*/
function renderMenu() {
  var grid = document.getElementById("menu-grid");
  grid.textContent = "";

  for (var i = 0; i < menuItems.length; i++) {
    var item = menuItems[i];

    var card = document.createElement("div");
    card.classList.add("menu-card");
    if (!item.available) { card.classList.add("unavailable"); }

    var img = document.createElement("img");
    img.classList.add("item-img");
    img.src = item.img;
    img.alt = item.name;

    var badge = document.createElement("span");
    badge.classList.add("item-badge");
    badge.textContent = item.category;

    var name = document.createElement("div");
    name.classList.add("item-name");
    name.textContent = item.name;

    var desc = document.createElement("div");
    desc.classList.add("item-desc");
    desc.textContent = item.description;

    var price = document.createElement("div");
    price.classList.add("item-price");
    price.textContent = "Nu. " + item.price;

    var btn = document.createElement("button");
    btn.classList.add("btn-add");
    btn.textContent = item.available ? "Add to Cart" : "Unavailable";
    btn.disabled    = !item.available;

    /* IIFE captures correct item.id for each button's click handler */
    btn.addEventListener("click", function(id) {
      return function() { addToCart(id); };
    }(item.id));

    card.appendChild(img);
    card.appendChild(badge);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(price);
    card.appendChild(btn);
    grid.appendChild(card);
  }
}


/* ── Cart Management ────────────────────────────────────────────────────── */

/*
  toggleCart()
  Collapses or expands the cart panel when the toggle button is clicked.
*/
function toggleCart() {
  var cartBody   = document.getElementById("cart-body");
  var toggleBtn  = document.getElementById("btn-cart-toggle");
  cartVisible    = !cartVisible;

  if (cartVisible) {
    cartBody.style.display  = "block";
    toggleBtn.textContent   = "▲ Hide";
  } else {
    cartBody.style.display  = "none";
    toggleBtn.textContent   = "▼ Show Cart";
  }
}

/*
  addToCart(itemId)
  Adds one of the chosen item to the cart. Increments quantity if already present.
*/
function addToCart(itemId) {
  var found = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].itemId === itemId) { found = cart[i]; break; }
  }

  if (found !== null) {
    found.quantity = found.quantity + 1;
  } else {
    var menuItem = findMenuItem(itemId);
    cart.push({ itemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 });
  }

  /* Auto-expand the cart when an item is added */
  if (!cartVisible) { toggleCart(); }
  updateCartDisplay();
}

/*
  changeQuantity(itemId, change)
  Adds or subtracts 1 from an item's quantity. Removes item if quantity hits zero.
*/
function changeQuantity(itemId, change) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].itemId === itemId) {
      cart[i].quantity = cart[i].quantity + change;
      if (cart[i].quantity <= 0) { cart.splice(i, 1); }
      break;
    }
  }
  updateCartDisplay();
}

/*
  updateCartDisplay()
  Redraws the cart panel to match the current cart array.
*/
function updateCartDisplay() {
  var container = document.getElementById("cart-items");
  var emptyMsg  = document.getElementById("cart-empty-msg");

  container.textContent = "";

  if (cart.length === 0) {
    container.appendChild(emptyMsg);
    document.getElementById("cart-total-price").textContent = "Nu. 0";
    return;
  }

  var total = 0;

  for (var i = 0; i < cart.length; i++) {
    var entry    = cart[i];
    var rowTotal = entry.price * entry.quantity;
    total        = total + rowTotal;

    var row = document.createElement("div");
    row.classList.add("cart-row");

    var nameSpan = document.createElement("span");
    nameSpan.classList.add("cart-item-name");
    nameSpan.textContent = entry.name;

    var minus = document.createElement("button");
    minus.classList.add("qty-btn");
    minus.textContent = "−";
    minus.addEventListener("click", function(id) {
      return function() { changeQuantity(id, -1); };
    }(entry.itemId));

    var qty = document.createElement("span");
    qty.classList.add("qty-num");
    qty.textContent = entry.quantity;

    var plus = document.createElement("button");
    plus.classList.add("qty-btn");
    plus.textContent = "+";
    plus.addEventListener("click", function(id) {
      return function() { changeQuantity(id, +1); };
    }(entry.itemId));

    var priceSpan = document.createElement("span");
    priceSpan.classList.add("cart-row-price");
    priceSpan.textContent = "Nu. " + rowTotal;

    row.appendChild(nameSpan);
    row.appendChild(minus);
    row.appendChild(qty);
    row.appendChild(plus);
    row.appendChild(priceSpan);
    container.appendChild(row);
  }

  document.getElementById("cart-total-price").textContent = "Nu. " + total;
}


/* ── Order Placement ────────────────────────────────────────────────────── */

/*
  handlePlaceOrder()
  Validates cart and pickup time, then sends POST /api/orders with the auth token.
*/
function handlePlaceOrder() {
  document.getElementById("error-order").textContent = "";
  var pickupTime = document.getElementById("pickup-time").value;

  if (cart.length === 0) {
    document.getElementById("error-order").textContent = "Please add at least one item to your cart.";
    return;
  }
  if (pickupTime === "") {
    document.getElementById("error-order").textContent = "Please select a pickup time.";
    return;
  }

  var payload = {
    studentName: currentStudent.name,
    studentId:   currentStudent.id,
    pickupTime:  pickupTime,
    cart: cart.map(function(entry) {
      return { name: entry.name, price: entry.price, quantity: entry.quantity };
    })
  };

  var btn = document.getElementById("btn-place-order");
  btn.disabled    = true;
  btn.textContent = "Placing order…";

  /* Use authFetch so the JWT token is included in the request */
  authFetch("/api/orders", {
    method: "POST",
    body:   JSON.stringify(payload)
  })
  .then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error || "Server error.");
      return data;
    });
  })
  .then(function(data) {
    showConfirmation(pickupTime, data.orderId);
  })
  .catch(function(err) {
    document.getElementById("error-order").textContent = err.message;
  })
  .finally(function() {
    btn.disabled    = false;
    btn.textContent = "Place Pre-Order";
  });
}

/*
  showConfirmation(pickupTime, orderId)
  Builds the summary table and switches to the confirmation screen.
*/
function showConfirmation(pickupTime, orderId) {
  document.getElementById("confirm-intro").textContent =
    "Hi " + currentStudent.name + " (ID: " + currentStudent.id + "), your pre-order has been received." +
    (orderId ? " Order ref: #" + orderId : "");

  var container = document.getElementById("confirm-summary");
  container.textContent = "";

  var table  = document.createElement("table");
  table.classList.add("summary-table");
  var thead  = document.createElement("thead");
  var hRow   = document.createElement("tr");
  var labels = ["Item", "Qty", "Price"];

  for (var h = 0; h < labels.length; h++) {
    var th = document.createElement("th");
    th.textContent = labels[h];
    hRow.appendChild(th);
  }
  thead.appendChild(hRow);
  table.appendChild(thead);

  var tbody = document.createElement("tbody");
  var total = 0;

  for (var i = 0; i < cart.length; i++) {
    var entry    = cart[i];
    var rowTotal = entry.price * entry.quantity;
    total        = total + rowTotal;

    var tr      = document.createElement("tr");
    var tdName  = document.createElement("td");
    var tdQty   = document.createElement("td");
    var tdPrice = document.createElement("td");

    tdName.textContent  = entry.name;
    tdQty.textContent   = entry.quantity;
    tdPrice.textContent = "Nu. " + rowTotal;

    tr.appendChild(tdName);
    tr.appendChild(tdQty);
    tr.appendChild(tdPrice);
    tbody.appendChild(tr);
  }

  var totalRow = document.createElement("tr");
  totalRow.classList.add("summary-total-row");
  var tdLabel  = document.createElement("td");
  var tdValue  = document.createElement("td");
  tdLabel.textContent = "Total";
  tdLabel.colSpan     = 2;
  tdValue.textContent = "Nu. " + total;
  totalRow.appendChild(tdLabel);
  totalRow.appendChild(tdValue);
  tbody.appendChild(totalRow);

  table.appendChild(tbody);
  container.appendChild(table);

  document.getElementById("confirm-pickup").textContent = "🕐 Pickup Time: " + pickupTime;
  showScreen("screen-confirm");
}


/* ── Order Tracking ─────────────────────────────────────────────────────── */

/*
  showMyOrders()
  Fetches and displays all past orders for the logged-in student.
*/
function showMyOrders() {
  document.getElementById("orders-loading").textContent  = "Loading your orders…";
  document.getElementById("orders-loading").style.display = "block";
  document.getElementById("orders-list").textContent     = "";
  showScreen("screen-orders");

  /* requireAuth protects this endpoint — send the JWT token */
  authFetch("/api/orders")
    .then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || "Could not load orders.");
        return data;
      });
    })
    .then(function(orders) {
      document.getElementById("orders-loading").style.display = "none";
      renderOrders(orders);
    })
    .catch(function(err) {
      document.getElementById("orders-loading").textContent = "⚠️ " + err.message;
    });
}

/*
  renderOrders(orders)
  Builds an order card for each past order showing items, total, and status badge.
*/
function renderOrders(orders) {
  var container = document.getElementById("orders-list");
  container.textContent = "";

  if (orders.length === 0) {
    var emptyMsg = document.createElement("p");
    emptyMsg.classList.add("orders-empty");
    emptyMsg.textContent = "You haven't placed any orders yet.";
    container.appendChild(emptyMsg);
    return;
  }

  for (var i = 0; i < orders.length; i++) {
    var order = orders[i];

    var card = document.createElement("div");
    card.classList.add("order-card");

    /* Order header: ref number, date, status badge */
    var header = document.createElement("div");
    header.classList.add("order-card-header");

    var ref = document.createElement("span");
    ref.classList.add("order-ref");
    ref.textContent = "Order #" + order.id;

    var date = document.createElement("span");
    date.classList.add("order-date");
    /* Format the timestamp to a readable date and time */
    var dateObj = new Date(order.created_at);
    date.textContent = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    /* Status badge — colour changes based on status value */
    var statusBadge = document.createElement("span");
    statusBadge.classList.add("order-status");
    statusBadge.classList.add("status-" + order.status.toLowerCase());
    statusBadge.textContent = order.status;

    header.appendChild(ref);
    header.appendChild(date);
    header.appendChild(statusBadge);

    /* Order details: pickup time and total */
    var details = document.createElement("div");
    details.classList.add("order-details");

    var pickup = document.createElement("span");
    pickup.textContent = "🕐 Pickup: " + order.pickup_time;

    var total = document.createElement("span");
    total.classList.add("order-total");
    total.textContent = "Total: Nu. " + order.total_price;

    details.appendChild(pickup);
    details.appendChild(total);

    card.appendChild(header);
    card.appendChild(details);
    container.appendChild(card);
  }
}


/* ── Navigation ─────────────────────────────────────────────────────────── */

/*
  handleNewOrder()
  Clears the cart and returns to the menu for a fresh order.
*/
function handleNewOrder() {
  showScreen("screen-menu");
  cart = [];
  updateCartDisplay();
  document.getElementById("pickup-time").value       = "";
  document.getElementById("error-order").textContent = "";
}

/*
  handleExit()
  Clears the session and returns to the login screen.
*/
function handleExit() {
  cart = [];
  authToken = "";
  currentStudent.name = "";
  currentStudent.id   = "";
  localStorage.removeItem("preplate_token");
  localStorage.removeItem("preplate_name");
  localStorage.removeItem("preplate_id");
  document.getElementById("login-id").value       = "";
  document.getElementById("login-password").value = "";
  showScreen("screen-login");
}


/* ── Helper ─────────────────────────────────────────────────────────────── */

/*
  findMenuItem(itemId)
  Returns the menu item object matching the given id.
*/
function findMenuItem(itemId) {
  for (var i = 0; i < menuItems.length; i++) {
    if (menuItems[i].id === itemId) { return menuItems[i]; }
  }
}


/* ── Event Listeners ────────────────────────────────────────────────────── */

document.getElementById("btn-login").addEventListener("click", handleLogin);
document.getElementById("btn-register").addEventListener("click", handleRegister);
document.getElementById("btn-exit").addEventListener("click", handleExit);
document.getElementById("btn-exit-orders").addEventListener("click", handleExit);
document.getElementById("btn-place-order").addEventListener("click", handlePlaceOrder);
document.getElementById("btn-new-order").addEventListener("click", handleNewOrder);
document.getElementById("btn-my-orders").addEventListener("click", showMyOrders);
document.getElementById("btn-my-orders-confirm").addEventListener("click", showMyOrders);
document.getElementById("btn-back-menu").addEventListener("click", function() { showScreen("screen-menu"); });

/* Allow pressing Enter in login fields */
document.getElementById("login-id").addEventListener("keydown", function(e) {
  if (e.key === "Enter") { handleLogin(); }
});
document.getElementById("login-password").addEventListener("keydown", function(e) {
  if (e.key === "Enter") { handleLogin(); }
});

/* Check for existing session on page load — skip login if already logged in */
checkExistingSession();
