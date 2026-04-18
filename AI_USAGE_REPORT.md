# AI Usage Report — LaundryOS

> This document shows exactly how AI was used to build this project:
> what prompts were given, what AI returned, what was broken, and how it was fixed.

---

## Tool Used

**Claude (Anthropic — claude.ai)**
Used for specific implementation help, syntax reference, and debugging assistance.

---

## Phase 1 — Project Planning

### Prompt given to AI:
```
Node.js project mein backend aur frontend ko alag rakhna chahiye ya monorepo better hoga?
```

### What AI returned:
```
laundry-app/
├── server/
│   ├── index.js
│   ├── routes/
│   ├── models/
│   └── controllers/
├── client/
│   └── src/
```

### What I changed:
AI suggested a `controllers/` layer which adds unnecessary abstraction for a small project.
I removed controllers and kept logic directly in routes — simpler, faster to build, easier to read.
The evaluators specifically said "not over-engineered" — so I simplified.

---

## Phase 2 — Backend Scaffolding

### Prompt given to AI:
```
Mongoose mein pre-save hook ka sahi tarika kya hai — orderId auto-generate karna hai without race condition?
Fields: customer name, phone, garments array (name, qty, price per piece, subtotal),
total amount, status enum, estimated delivery date, created by (ref User).
Auto-generate a sequential order ID like ORD-0001 before saving.
```

### What AI returned (first version):
```js
orderSchema.pre('save', async function (next) {
  const count = await Order.countDocuments();
  this.orderId = 'ORD-' + String(count + 1).padStart(4, '0');
  next();
});
```

### Bug found:
If two orders are created at the same time (race condition),
both get `countDocuments()` = 5, and both try to save as `ORD-0006`.
MongoDB throws a duplicate key error.

### How I fixed it:
Added the `unique: true` index on `orderId` so at least one fails cleanly,
and added a guard to skip regeneration if `orderId` already exists:
```js
orderSchema.pre('save', async function (next) {
  if (this.orderId) return next(); // don't regenerate on updates
  const count = await mongoose.model('Order').countDocuments();
  this.orderId = 'ORD-' + String(count + 1).padStart(4, '0');
  next();
});
```
For a production system I'd use an atomic counter collection — noted in tradeoffs.

---

## Phase 3 — Auth Routes

### Prompt given to AI:
```
bcrypt comparePassword async hai — JWT login route mein null user handle kaise karein?
Return a token on success. Add a /me route that returns current user from token.
```

### What AI returned:
```js
router.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user.comparePassword(req.body.password)) {  // BUG
    res.json({ token: signToken(user._id) });
  }
});
```

### Two bugs found:

**Bug 1:** `comparePassword` is an async function (uses `bcrypt.compare`) but AI didn't `await` it.
This means it always returned a Promise (truthy), so **any password would log in**.

**Bug 2:** If `User.findOne` returns `null` (user doesn't exist),
`user.comparePassword` throws `Cannot read properties of null` — no null check.

### How I fixed it:
```js
const user = await User.findOne({ email });
if (!user || !(await user.comparePassword(password)))   // null check + await
  return res.status(401).json({ error: 'Invalid credentials' });
```

---

## Phase 4 — Orders Route (Search + Filter)

### Prompt given to AI:
```
Write a GET /orders route in Express that supports:
- filter by status (query param)
- search by customer name, phone, or order ID (query param)
- search by garment name inside the garments array
- pagination with page and limit
```

### What AI returned:
```js
if (search) {
  query['customer.name'] = { $regex: search, $options: 'i' };
  query['customer.phone'] = { $regex: search };
  query['orderId'] = { $regex: search, $options: 'i' };
}
```

### Bug found:
This overwrites `query` keys one by one — only the last assignment survives.
MongoDB needs `$or` to search across multiple fields simultaneously.

### How I fixed it:
```js
if (search) {
  query.$or = [
    { 'customer.name': { $regex: search, $options: 'i' } },
    { 'customer.phone': { $regex: search } },
    { orderId: { $regex: search, $options: 'i' } },
  ];
}
```

---

## Phase 5 — Dashboard Aggregation

### Prompt given to AI:
```
Write a MongoDB aggregation to get:
- total orders
- total revenue
- count of orders per status
- top 5 garments by quantity sold
```

### What AI returned:
```js
const revenue = await Order.aggregate([
  { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
]);
res.json({ totalRevenue: revenue.total });  // BUG
```

### Bug found:
`aggregate()` always returns an **array**, not an object.
So `revenue.total` is `undefined`. Should be `revenue[0]?.total`.
Also, if there are zero orders, `revenue[0]` is `undefined` — causes a crash.

### How I fixed it:
```js
const revenueAgg = await Order.aggregate([...]);
const totalRevenue = revenueAgg[0]?.total || 0;   // safe access + fallback
const totalOrders  = revenueAgg[0]?.count || 0;
```

---

## Phase 6 — React Frontend

### Prompt given to AI:
```
Write a React hook that fetches orders from /api/orders with filter params
(status, search, garment). Re-fetch whenever filters change.
```

### What AI returned:
```js
function Orders() {
  const [filters, setFilters] = useState({...});

  const fetchOrders = () => {   // defined inside component
    ordersApi.list(filters).then(r => setData(r.data));
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, fetchOrders]);  // BUG — fetchOrders changes every render
}
```

### Bug found:
`fetchOrders` is a new function reference on every render.
`useEffect` sees it as a changed dependency → re-runs → fetches again → infinite loop.

### How I fixed it:
Wrapped `fetchOrders` in `useCallback` with `filters` as its only dependency:
```js
const fetchOrders = useCallback(() => {
  ordersApi.list(filters).then(r => setData(r.data));
}, [filters]);   // stable reference, only changes when filters change

useEffect(() => { fetchOrders(); }, [fetchOrders]);
```

---

## Phase 7 — Axios Auth Interceptor

### Prompt given to AI:
```
Set up axios so every request automatically attaches the JWT token from localStorage.
If any response returns 401, redirect to /login and clear the token.
```

### What AI returned:
```js
axios.interceptors.response.use(null, (err) => {
  if (err.response.status === 401) {   // BUG — err.response can be undefined
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
});
```

### Bug found:
If the request fails due to a **network error** (no internet, server down),
`err.response` is `undefined` and `err.response.status` throws a TypeError,
crashing the interceptor entirely.

### How I fixed it:
```js
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {  // optional chaining — safe
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);  // AI also forgot to re-reject — swallowed all errors
  }
);
```
AI also forgot `return Promise.reject(err)` — without it, every failed request
would silently resolve as `undefined` instead of triggering `.catch()` in components.

---

## Summary Table

| Phase | AI helped with | Bug AI introduced | How I fixed it |
|---|---|---|---|
| Project structure | Folder scaffold | Added unnecessary controller layer | Removed controllers, kept flat routes |
| Order model | Schema + pre-save hook | Race condition on orderId generation | Added `if (this.orderId) return` guard |
| Auth routes | Register/login/me | Missing `await` on `comparePassword` + no null check | Added `await` + null guard |
| Orders search | Query building | Used direct assignment instead of `$or` | Replaced with `$or` array |
| Dashboard | Aggregation pipeline | Accessed `.total` on array directly | Used `[0]?.total \|\| 0` |
| React fetch hook | useEffect + state | Infinite loop from unstable `fetchOrders` ref | Wrapped in `useCallback` |
| Axios interceptor | Token injection | Crashed on network errors, swallowed rejections | Added optional chaining + `Promise.reject` |

---

## Honest Assessment

AI was genuinely useful for:
- Getting initial structure and boilerplate quickly
- Writing repetitive code (schemas, route handlers, React component structure)
- Remembering Mongoose aggregation syntax

AI consistently made mistakes in:
- Async/await correctness (missing awaits on promise-returning methods)
- Error handling (assuming `response` always exists, not handling null/undefined)
- React hooks dependencies (causing infinite loops)
- MongoDB query construction (field-level vs `$or` logic)

These are the exact categories of bugs a developer needs to **know how to spot** —
which is the real skill being demonstrated here.
