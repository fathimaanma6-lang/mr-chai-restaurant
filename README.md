# Mr. Chai Restaurant - Food Ordering Management System

A full-stack web application for a restaurant to take online orders. Customers browse the menu, manage a cart, check out and track orders. The restaurant owner manages the menu, orders, customers and sales reports from an admin panel.

## Features

**Customer**
- Register / login, profile management, forgot and reset password
- Browse menu by category, search dishes, featured items
- Cart (add, update quantity, remove, clear) and checkout
- Demo card payment flow and order confirmation
- Order history and order details
- SMS notifications on order confirmation and status changes

**Admin**
- Separate admin login and dashboard with key stats
- Menu management: categories and food items with image upload
- Order management: filter by status and update status (confirmed, preparing, out for delivery, delivered, cancelled)
- Customer management: block / unblock accounts
- Sales report by date range

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | HTML5, CSS3, Bootstrap, Vanilla JavaScript (Fetch API) |
| Backend  | Node.js, Express.js (REST API) |
| Database | MySQL (mysql2) |
| Auth     | JWT, bcryptjs |
| Uploads  | Multer |
| SMS      | Twilio (demo mode by default) |

## Architecture Highlights

- Separate JWT secrets for customers and admins, so a customer token can never access admin routes
- Transactional checkout: order creation runs inside a MySQL transaction and rolls back on failure
- Role-based middleware protecting customer and admin routes
- Passwords hashed with bcrypt and parameterised SQL queries
- Payment and SMS run in demo mode with no API keys and can be swapped for Stripe / Twilio

## Project Structure

- client/ - customer-facing site (menu, cart, checkout, orders, profile)
- admin/ - admin panel (dashboard, menu, orders, customers, sales report)
- server/ - Express REST API (controllers, routes, middleware, services, config, seed)
- database/restaurant.sql - schema and sample data

Database tables: users, admins, categories, foods, cart, orders, order_items, payments.

## Getting Started

Prerequisites: Node.js 18+ and MySQL (for example XAMPP + phpMyAdmin)

1. Create a database named `mr_chai_restaurant` and import `database/restaurant.sql`.
2. Set up the backend:
   ```bash
   cd server
   npm install
   cp .env.example .env     # edit DB credentials and JWT secrets
   npm run seed:admin       # creates the admin account
   npm run dev              # http://localhost:5000
   ```
3. Open `client/index.html` (customer site) or `admin/login.html` (admin panel) with a static server such as the VS Code Live Server extension. The API URL is set in `client/js/config.js` and `admin/js/config.js`.

Default admin (change after first login): `admin@mrchai.com` / `Admin@123`

## API

Base URL `http://localhost:5000/api` with modules: auth, categories, foods, cart, orders, payments, admin.
See [server/ENDPOINTS.md](server/ENDPOINTS.md) for every endpoint, access level and request body.

## Notes

This is a learning / portfolio project:
- Payments are simulated. No card data is stored or sent anywhere.
- SMS prints to the console unless Twilio credentials are set in `.env`.
- The forgot-password endpoint returns the reset token in the response for demo purposes. In production it should be emailed.

## Future Improvements

- Real payment gateway (Stripe) and email-based password reset
- Rate limiting and input validation middleware
- Deployment and automated tests
- Real-time order tracking

## Author

**Your Name** - [GitHub](https://github.com/fathimaanma6-lang) | [LinkedIn](https://linkedin.com/in/your-profile)
