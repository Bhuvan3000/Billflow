# BillFlow — MERN Stack Billing & Invoicing System

A full-stack GST-ready billing platform built with **MongoDB · Express · React · Node.js**.

---

## 📁 Project Structure

```
billflow/
├── backend/               ← Node.js / Express API
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── invoice.controller.js
│   │   ├── payment.controller.js
│   │   └── misc.controller.js   ← dashboard, reports, subscriptions
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Customer.model.js
│   │   ├── Invoice.model.js
│   │   ├── Payment.model.js
│   │   └── Subscription.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── invoice.routes.js
│   │   ├── payment.routes.js
│   │   ├── subscription.routes.js
│   │   ├── report.routes.js
│   │   └── dashboard.routes.js
│   ├── utils/
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/              ← React SPA
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   └── Sidebar.js
    │   │   └── shared/
    │   │       └── index.js     ← Card, Button, Modal, StatusBadge, etc.
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── Invoices.js
    │   │   ├── InvoiceForm.js
    │   │   ├── InvoiceView.js
    │   │   ├── Customers.js
    │   │   ├── CustomerView.js
    │   │   ├── Payments.js
    │   │   ├── Subscriptions.js
    │   │   ├── Reports.js
    │   │   └── Settings.js
    │   ├── services/
    │   │   └── api.js           ← Axios API layer
    │   ├── utils/
    │   │   └── helpers.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone & setup backend

```bash
cd billflow/backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and other keys
```

### 2. Seed demo data

```bash
npm run seed
# Creates: admin@billflow.in / Admin@123
# With sample customers, invoices, payments, subscriptions
```

### 3. Start backend

```bash
npm run dev      # Development (nodemon)
npm start        # Production
```
Backend runs on: **http://localhost:5000**

---

### 4. Setup frontend

```bash
cd billflow/frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Start frontend

```bash
npm start
```
Frontend runs on: **http://localhost:3000**

---

## 🔑 Demo Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | admin@billflow.in   |
| Password | Admin@123           |

---

## ✨ Features

### Invoice Management
- Create / edit / cancel invoices
- GST line items with HSN/SAC codes
- Intra-state (CGST + SGST) & inter-state (IGST) support
- PDF generation & download
- Invoice status workflow: Draft → Sent → Viewed → Paid

### Customer Management
- Full client database with GSTIN, PAN, state
- Per-customer invoice history
- Outstanding balance tracking

### Payments
- Manual payment recording
- Razorpay order creation & signature verification
- Stripe payment intents
- Webhook handling
- Payment transaction log

### Recurring Billing
- Subscription plans (Starter / Growth / Enterprise)
- Per-customer subscriptions with auto-renew
- Next billing date tracking

### Financial Reports
- Monthly revenue chart
- GST summary (CGST / SGST / IGST breakdown) — GSTR-1 ready
- Aging analysis (0–30, 31–60, 61–90, 90+ days)

### Settings
- Business profile & GSTIN
- Invoice prefix, numbering, default GST rate
- Password change

---

## 🔌 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password

GET    /api/dashboard

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
DELETE /api/invoices/:id
POST   /api/invoices/:id/send
POST   /api/invoices/:id/payment
GET    /api/invoices/:id/pdf

GET    /api/payments
POST   /api/payments/razorpay/create-order
POST   /api/payments/razorpay/verify
POST   /api/payments/stripe/create-intent
POST   /api/payments/webhook

GET    /api/subscriptions
POST   /api/subscriptions
PUT    /api/subscriptions/:id/cancel
GET    /api/subscriptions/plans
POST   /api/subscriptions/plans

GET    /api/reports?type=revenue|gst|aging
```

---

## 🛡 Security
- JWT authentication with 30-day expiry
- bcryptjs password hashing (12 salt rounds)
- Helmet.js HTTP headers
- Rate limiting (100 req/15 min)
- CORS restricted to frontend URL
- User-scoped data (all queries filter by `user` field)

---

## 🇮🇳 GST India Support
- GSTIN stored per customer & business
- Automatic CGST / SGST (intra-state) or IGST (inter-state) calculation
- HSN / SAC code per line item
- Multiple GST rates (0%, 5%, 12%, 18%, 28%)
- GSTR-1 ready data export
- State code support

---

## 🧰 Tech Stack

| Layer     | Technology                           |
|-----------|--------------------------------------|
| Backend   | Node.js, Express.js                  |
| Database  | MongoDB, Mongoose                    |
| Auth      | JWT, bcryptjs                        |
| PDF       | PDFKit                               |
| Payments  | Razorpay, Stripe                     |
| Frontend  | React 18, React Router v6            |
| State     | TanStack Query (React Query)         |
| Charts    | Recharts                             |
| HTTP      | Axios                                |
| Styling   | Pure CSS with CSS variables          |
| Icons     | Lucide React                         |

---

## 📦 Deployment

### Backend (Railway / Render / EC2)
```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_long_random_secret
```

### Frontend (Vercel / Netlify)
```bash
REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

## 🗺 Roadmap
- [ ] Email notifications via Nodemailer
- [ ] Recurring invoice auto-generation cron job
- [ ] GSTR-1 JSON export for GST portal
- [ ] Multi-currency support
- [ ] Role-based access (accountant, viewer)
- [ ] Expense tracking module
- [ ] Purchase orders
- [ ] WhatsApp invoice delivery

---

Made with ❤️ for Indian businesses.
