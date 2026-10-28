# Mr. Chai Restaurant — Backend API

Node.js + Express + MySQL backend for the Food Ordering Management System.

## Setup

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your MySQL credentials (matches your phpMyAdmin/XAMPP setup)
   ```bash
   cp .env.example .env
   ```

3. **Make sure the database is imported**
   - You should already have the `mr_chai_restaurant` database imported via phpMyAdmin
     (see `database/restaurant.sql`)

4. **Seed a working admin login**
   The SQL file has a placeholder admin password hash. Run this once to create a real one:
   ```bash
   npm run seed:admin
   ```
   Default login (change in `.env` if you want different values):
   - Email: `admin@mrchai.com`
   - Password: `Admin@123`

5. **Start the server**
   ```bash
   npm run dev      # with nodemon (auto-restart on changes)
   # or
   npm start        # plain node
   ```

   Server runs on `http://localhost:5000` by default.

6. **Test it's working**
   Visit `http://localhost:5000/api/health` — you should see:
   ```json
   { "success": true, "message": "Mr. Chai Restaurant API is running." }
   ```

## API Overview

| Area       | Base path         | Notes |
|------------|--------------------|-------|
| Auth       | `/api/auth`        | register, login, forgot/reset password, profile |
| Categories | `/api/categories`  | public GET, admin-only create/update/delete |
| Foods      | `/api/foods`       | public GET/search, admin-only create/update/delete (image upload) |
| Cart       | `/api/cart`        | all routes require customer login |
| Orders     | `/api/orders`      | checkout + history (customer), manage (admin) |
| Payments   | `/api/payments`    | demo payment confirmation |
| Admin      | `/api/admin`       | admin login, dashboard stats, customers, sales report |

Full endpoint list is in `ENDPOINTS.md`.

## Auth model

- Customers and admins have **separate JWTs** signed with different secrets
  (`JWT_SECRET` vs `ADMIN_JWT_SECRET`), so a customer token can never be used
  to access admin routes.
- Send the token as: `Authorization: Bearer <token>`

## Notes

- **Payments** run in demo mode — no real card is charged, no external API keys
  needed. See the comment at the top of `controllers/paymentController.js` for
  how to swap in real Stripe later.
- **SMS notifications** run in demo mode by default too — see below.
- **Image uploads** (food images) are stored in `server/uploads/` and served
  at `http://localhost:5000/uploads/<filename>`.
- **Checkout** runs inside a MySQL transaction — if anything fails partway,
  the whole order is rolled back so you never get a half-created order.

## SMS notifications

The system sends SMS at three points:

1. **Order confirmed + paid** → texts the customer, and separately texts the
   restaurant owner with the order number, customer name/phone, and total.
2. **Admin updates order status** (confirmed / preparing / out for delivery /
   delivered / cancelled) → texts the customer. For "out for delivery", the
   admin can enter an estimated delivery time (minutes) which gets included
   in the message.

### Demo mode (default, no setup needed)
If `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are
left blank in `.env`, no real SMS is sent — messages are just printed to the
server console (prefixed `📱 [DEMO SMS]`) so you can see exactly what would
have been sent. This is enough for demoing/grading the feature without a paid
SMS account.

### Sending real SMS
1. Create a free trial account at [twilio.com](https://www.twilio.com)
2. Get your Account SID, Auth Token, and a Twilio phone number from the console
3. Fill these into `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ADMIN_PHONE_NUMBER=+94771234567
   ```
4. Restart the server (`npm run dev`) — it'll log "Twilio configured" on startup
   instead of "running in DEMO mode"

Note: Twilio trial accounts can only send SMS to phone numbers you've verified
in the Twilio console — this is a Twilio restriction, not a bug in this project.
