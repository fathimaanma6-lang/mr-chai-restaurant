# API Endpoint Reference

🔓 = public   🔒 = customer login required   🛡️ = admin login required

## Auth — `/api/auth`
| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/register` | 🔓 | `full_name, email, phone, password, address` |
| POST | `/login` | 🔓 | `email, password` |
| POST | `/forgot-password` | 🔓 | `email` |
| POST | `/reset-password` | 🔓 | `token, newPassword` |
| GET | `/profile` | 🔒 | — |
| PUT | `/profile` | 🔒 | `full_name, phone, address` |

## Categories — `/api/categories`
| Method | Path | Access | Body |
|--------|------|--------|------|
| GET | `/` | 🔓 | — |
| POST | `/` | 🛡️ | `name, description` |
| PUT | `/:id` | 🛡️ | `name, description, status` |
| DELETE | `/:id` | 🛡️ | — |

## Foods — `/api/foods`
| Method | Path | Access | Body |
|--------|------|--------|------|
| GET | `/?category=ID` | 🔓 | — |
| GET | `/search?q=term` | 🔓 | — |
| GET | `/:id` | 🔓 | — |
| GET | `/admin/all` | 🛡️ | — (includes unavailable items) |
| POST | `/` | 🛡️ | form-data: `category_id, name, description, price, is_featured, image (file)` |
| PUT | `/:id` | 🛡️ | form-data: same fields, `image` optional |
| DELETE | `/:id` | 🛡️ | — |

## Cart — `/api/cart`
| Method | Path | Access | Body |
|--------|------|--------|------|
| GET | `/` | 🔒 | — |
| POST | `/` | 🔒 | `food_id, quantity` |
| PUT | `/:cartId` | 🔒 | `quantity` |
| DELETE | `/:cartId` | 🔒 | — |
| DELETE | `/` | 🔒 | — (clears whole cart) |

## Orders — `/api/orders`
| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/checkout` | 🔒 | `delivery_address, phone, notes` |
| GET | `/my-orders` | 🔒 | — |
| GET | `/my-orders/:id` | 🔒 | — |
| GET | `/admin/all?status=pending` | 🛡️ | — |
| GET | `/admin/:id` | 🛡️ | — |
| PUT | `/admin/:id/status` | 🛡️ | `status` |

## Payments — `/api/payments`
| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/confirm` | 🔒 | `order_id, card_number, card_expiry, card_cvv` |
| GET | `/status/:orderId` | 🔒 | — |

## Admin — `/api/admin`
| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/login` | 🔓 | `email, password` |
| GET | `/dashboard` | 🛡️ | — |
| GET | `/customers` | 🛡️ | — |
| PUT | `/customers/:id/status` | 🛡️ | `status` (active/blocked) |
| GET | `/sales-report?startDate=&endDate=` | 🛡️ | — |
