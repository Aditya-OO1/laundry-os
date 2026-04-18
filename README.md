## Live Demo
- Frontend: https://laundry-os-ui.onrender.com
- Backend API: https://laundry-os-api.onrender.com

# LaundryOS — Mini Laundry Order Management System

A full-stack order management system for dry cleaning stores.  
**Stack:** Node.js + Express + MongoDB (backend) · React (frontend) · JWT auth

---

## Features

| Feature | Status |
|---|---|
| Create orders with garments, qty, auto-billing | ✅ |
| Unique Order ID generation (ORD-0001, ORD-0002…) | ✅ |
| Estimated delivery date (configurable days) | ✅ |
| Order status: RECEIVED → PROCESSING → READY → DELIVERED | ✅ |
| Update status inline | ✅ |
| List & filter by status | ✅ |
| Search by name, phone, order ID, garment type | ✅ |
| Dashboard: total orders, revenue, avg value, orders-per-status | ✅ |
| Top garments report | ✅ |
| JWT Authentication (register/login) | ✅ |
| React frontend with sidebar nav | ✅ |
| MongoDB persistence | ✅ |
| Postman collection | ✅ |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works) or local MongoDB

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/laundry-os.git
cd laundry-os

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/laundry-os
JWT_SECRET=any_long_random_string_here
FRONTEND_URL=http://localhost:3000
```

### 3. Configure frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

App opens at `http://localhost:3000`.  
Register a new account to get started.

---

## API Reference

All routes except `/api/auth/login` and `/api/auth/register` require:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password, role? }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/auth/me` | — |

### Orders
| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | List (query: `status`, `search`, `garment`, `page`, `limit`) |
| GET | `/api/orders/:id` | Get by orderId or MongoDB `_id` |
| PATCH | `/api/orders/:id/status` | `{ status: "PROCESSING" }` |
| DELETE | `/api/orders/:id` | Delete order |
| GET | `/api/orders/meta/garments` | Get all garment prices |

### Dashboard
| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/dashboard` | Total orders, revenue, status breakdown, top garments, recent orders |

### Create Order — example request
```json
POST /api/orders
{
  "customer": { "name": "Rahul Sharma", "phone": "9812345678" },
  "garments": [
    { "name": "Shirt", "qty": 3 },
    { "name": "Saree", "qty": 1 }
  ],
  "estimatedDeliveryDays": 2
}
```

Response:
```json
{
  "order": {
    "orderId": "ORD-0001",
    "totalAmount": 240,
    "status": "RECEIVED",
    "estimatedDelivery": "2025-01-20T...",
    ...
  }
}
```

### Garment prices (hardcoded, configurable in `models/Order.js`)
| Garment | Price/pc |
|---|---|
| Shirt | ₹40 |
| T-Shirt | ₹30 |
| Pants | ₹60 |
| Jeans | ₹70 |
| Kurta | ₹50 |
| Dress | ₹100 |
| Saree | ₹120 |
| Jacket | ₹150 |
| Suit | ₹200 |
| Blanket | ₹180 |

---

## Deploy to Render (free)

### Backend
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo → set root dir to `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`

### Frontend
1. Go to Render → New Static Site
2. Connect repo → set root dir to `frontend`
3. Build command: `npm run build`
4. Publish directory: `build`
5. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

---

## AI Usage Report

### Tools used
- **Claude (Anthropic)** — primary tool for scaffolding and iteration

### Sample prompts used
- *"Node.js project mein backend aur frontend alag rakhna chahiye ya monorepo better hoga?"*
- *"Mongoose pre-save hook mein race condition kaise avoid karein sequential IDs ke liye?"*
- *"React mein JWT token localStorage se auto-restore kaise karein page refresh pe?"*
- *"React mein multiple filters simultaneously API pe bhejne ka sahi pattern kya hai?"*
- *"Postman mein login response se token automatically save kaise karein next requests ke liye?"*

### What AI got right
- Full Express route structure with proper error handling and middleware chain
- Mongoose schema with validation, pre-save hooks, and static methods
- React context + interceptor pattern for token injection
- Aggregation pipeline for dashboard stats (groupBy status, top garments)
- CSS layout with sidebar + main content area

### What needed fixing
- AI used `req.params.id` directly in MongoDB `findById` without checking if it's a valid ObjectId — fixed with regex guard to prevent CastError crashes
- AI generated `Promise.all` in the dashboard but missed that `revenueAgg[0]` could be undefined on empty DB — added `|| 0` fallback
- Frontend `useEffect` for fetching orders caused infinite re-render loop when `fetchOrders` was defined inside component without `useCallback` — restructured with `useCallback` and correct deps array
- Auth route had no check for duplicate email on register — added `findOne` pre-check with 409 response
- Postman collection auto-token script used wrong variable scope — corrected to `pm.collectionVariables.set`

---

## Tradeoffs

### What was skipped
- **Role-based access control** on individual routes (admin vs staff) — auth middleware exists but route-level guards not applied to every endpoint
- **Pagination UI** in frontend — API supports `page`/`limit` but frontend loads first 20 results
- **Unit tests** — would add Jest + supertest for API routes with more time
- **Receipt / PDF generation** per order
- **SMS / WhatsApp notification** on status change (Twilio integration)

### What I'd add with more time
- Protected admin routes for deleting orders and managing users
- Date range filter on dashboard
- Bulk status update
- Export orders to CSV
- Dark mode toggle in frontend
- Rate limiting on auth routes (express-rate-limit)
- Input sanitization (express-validator)

---

## Project Structure

```
laundry-os/
├── backend/
│   ├── models/
│   │   ├── User.js          # bcrypt password hashing, role
│   │   └── Order.js         # garment schema, auto orderId, price map
│   ├── routes/
│   │   ├── auth.js          # register, login, me
│   │   ├── orders.js        # CRUD + search/filter
│   │   └── dashboard.js     # aggregation stats
│   ├── middleware/
│   │   └── auth.js          # JWT verify, requireAdmin
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── api.js           # axios instance + interceptors
│   │   ├── App.js           # routing, auth guards
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── components/
│   │   │   └── Layout.js    # sidebar nav
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Orders.js
│   │   │   └── NewOrder.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── LaundryOS.postman_collection.json
├── .gitignore
└── README.md
```
