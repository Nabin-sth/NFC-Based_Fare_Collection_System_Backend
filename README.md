# NFC-Based Fare Collection Backend

Backend API for an NFC-based public transport fare collection system. The API manages passenger, driver, operator, and admin users; NFC card registration and verification; card balance; tap-in and tap-out fare collection; Khalti recharge/payment flows; transaction history; vehicle management; bus GPS locations; and operator analytics.

## Project Overview

This backend is built for a public transportation system where passengers can use NFC cards to enter and exit buses. The server validates the NFC card, records trip activity, calculates the fare from route/location data, deducts balance when possible, and stores transactions for history and reporting.

The system also supports admin-side NFC card verification, NFC block requests, operator-side fleet and driver management, bus location updates, and Khalti payment integration for recharge or pending fare payment.

## Key Features

- Passenger, driver, operator, and admin registration/login
- JWT authentication through HTTP-only cookies or Bearer tokens
- Role-based access control for passenger, driver, operator, and admin routes
- NFC card registration, verification, blocking, unblocking, and block requests
- NFC card validation before tap processing
- Tap-in and tap-out trip handling
- Duplicate tap protection with a short cooldown window
- Distance/fare calculation using location and route utilities
- Balance deduction from verified NFC cards
- Pending payment flow when balance is insufficient
- Khalti payment initiation, callback, lookup, and verification
- Transaction history with filtering and summary totals
- Admin user, role, and NFC card management
- Operator vehicle, driver, assignment, and analytics APIs
- Driver recent tap-event API
- Bus location APIs for app and device updates
- MongoDB database storage with Mongoose models
- Request validation with Zod
- Request sanitization for basic NoSQL injection protection

## Tech Stack

- Node.js
- Express.js 5
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcrypt
- Zod
- Axios
- Khalti ePayment API
- CORS
- Morgan
- dotenv
- Nodemon
- Git/GitHub

## Folder Structure

```text
Major-Project/
  src/
    index.js                    # Server entry point
    app.js                      # Express app, middleware, and route mounting
    config/
      db.js                     # MongoDB connection
    controller/                 # Route handlers and business request logic
    middleware/                 # Auth, role checks, validation, sanitization, errors
    model/                      # Mongoose schemas and models
    router/                     # Express route definitions
    service/                    # Tap processing, payment, and Khalti services
    utils/                      # API helpers, NFC helpers, distance/fare utilities
    validation/                 # Zod validation schemas
  test/                         # Tap-service test/experiment files
  package.json                  # Dependencies and scripts
  .env-sample                   # Sample environment file
```

## Installation and Setup

1. Clone the repository.

```bash
git clone https://github.com/Nabin-sth/NFC-Based_Fare_Collection_System_Backend
cd NFC-Based_Fare_Collection_System_Backend
```

2. Install dependencies.

```bash
npm install
```

3. Create a `.env` file in the project root.

```bash
cp .env-sample .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env-sample .env
```

4. Update the environment variables with your local values.

## Environment Variables

Create a `.env` file with values similar to the example below.

```env
PORT=5000
NODE_ENV=development

MONGODB_URL=mongodb://127.0.0.1:27017/[Add database name here]
CORS_ORIGIN=http://localhost:[Add frontend port here]

ACCESS_TOKEN_SECRET=[Add access token secret here]
REFRESH_TOKEN_SECRET=[Add refresh token secret here]
ADMIN_EMAIL=admin@example.com

KHALTI_SECRET_KEY=[Add Khalti secret key here]
KHALTI_BASE_URL=https://a.khalti.com/api/v2/
KHALTI_RETURN_URL=http://localhost:5000/api/v1/users/payment/khalti/callback
WEBSITE_URL=http://localhost:[Add frontend port here]

```


## Database Setup

This project uses MongoDB through Mongoose.

1. Create a MongoDB database locally or in MongoDB Atlas.
2. Add the connection string to `MONGODB_URL`.
3. Start the backend. Mongoose will use the schemas in `src/model/` to store data in MongoDB collections.

No migration or seed script was found in the current codebase. Add one manually if you need predefined users, buses, cards, or test data.

## How to Run the Backend

Run in development mode with Nodemon:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

Default server port:

```text
http://localhost:5000
```

If `PORT` is not set, the code falls back to port `4000`.

## Authentication

Protected routes use JWT authentication. The middleware accepts the token from either:

- `accessToken` cookie
- `Authorization: Bearer <token>` header

Refresh tokens are stored on the user record and used by the refresh-token endpoint.

## API Endpoints

Base path:

```text
/api/v1
```

### Health

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | Check API health | No |

### User and Authentication

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/v1/users/register` | Register passenger user | No |
| POST | `/api/v1/users/login` | Login passenger or admin user | No |
| POST | `/api/v1/users/logout` | Logout current user | Yes |
| POST | `/api/v1/users/user/register` | Register passenger user | No |
| POST | `/api/v1/users/user/login` | Login passenger or admin user | No |
| POST | `/api/v1/users/user/logout` | Logout current user | Yes |
| POST | `/api/v1/users/driver/register` | Register driver | No |
| POST | `/api/v1/users/driver/login` | Login driver | No |
| GET | `/api/v1/users/driver/profile` | Get driver profile | Driver |
| POST | `/api/v1/users/driver/logout` | Logout driver | Yes |
| POST | `/api/v1/users/operator/register` | Register operator | No |
| POST | `/api/v1/users/operator/login` | Login operator | No |
| GET | `/api/v1/users/operator/profile` | Get operator profile | Operator |
| POST | `/api/v1/users/operator/logout` | Logout operator | Yes |
| POST | `/api/v1/users/auth/refresh-token` | Refresh access token | Refresh token |
| GET | `/api/v1/users/profile` | Get logged-in user profile and NFC card details | Yes |
| POST | `/api/v1/users/registerNfc` | Register NFC card for logged-in user | Yes |
| PATCH | `/api/v1/users/vehicle/:busId/location` | Update vehicle location | Yes |

### Tap and NFC

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/v1/user/tap` | Process NFC tap-in or tap-out using RFID, bus ID, latitude, and longitude | No |
| POST | `/api/v1/nfc/block-request` | Request NFC card blocking | Passenger |

### Payment and Transactions

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/api/v1/users/payment/initiate` | Initiate Khalti payment for a pending fare transaction | Passenger |
| POST | `/api/v1/users/payment/verify` | Verify Khalti payment by `pidx` | Passenger |
| GET | `/api/v1/users/payment/status` | Check Khalti payment status by `pidx` or `txnId` | No |
| GET | `/api/v1/users/payment/khalti/callback` | Khalti callback endpoint | No |
| POST | `/api/v1/users/payment/transaction` | Start Khalti wallet top-up transaction | Passenger |
| GET | `/api/v1/users/payment/transactions` | Get passenger transaction history and summary | Passenger |

### Admin

All admin routes require a valid admin JWT.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/get-all-data` | Get user/card/admin data | Admin |
| PATCH | `/api/v1/admin/update-role/:userId` | Add or update user role | Admin |
| PATCH | `/api/v1/admin/verify-user/:userId` | Verify a user | Admin |
| PATCH | `/api/v1/admin/remove-role/:userId` | Remove user role | Admin |
| DELETE | `/api/v1/admin/delete-user/:userId` | Delete user | Admin |
| GET | `/api/v1/admin/pending` | Get pending NFC card verification requests | Admin |
| PATCH | `/api/v1/admin/verify/:id` | Verify NFC card | Admin |
| DELETE | `/api/v1/admin/reject/:id` | Reject NFC card | Admin |
| GET | `/api/v1/admin/nfc/block-requests` | Get NFC block requests | Admin |
| PATCH | `/api/v1/admin/nfc/:cardId/block` | Block NFC card | Admin |
| PATCH | `/api/v1/admin/nfc/:cardId/reject-block` | Reject NFC block request | Admin |
| PATCH | `/api/v1/admin/nfc/:cardId/unblock` | Unblock NFC card | Admin |

### Operator

All operator routes require a valid operator JWT.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/operator/profile` | Get operator profile | Operator |
| POST | `/api/v1/operator/vehicle/register` | Register vehicle/bus | Operator |
| GET | `/api/v1/operator/vehicle/list` | List operator vehicles | Operator |
| GET | `/api/v1/operator/vehicle/unassigned` | List buses without assigned drivers | Operator |
| GET | `/api/v1/operator/vehicle/:busId` | Get vehicle details | Operator |
| DELETE | `/api/v1/operator/vehicle/:busId` | Delete vehicle | Operator |
| PATCH | `/api/v1/operator/vehicle/:busId/status` | Update vehicle status | Operator |
| PATCH | `/api/v1/operator/vehicle/:busId/location` | Update vehicle location | Operator |
| GET | `/api/v1/operator/driver/list` | List operator drivers | Operator |
| GET | `/api/v1/operator/driver/available` | List available drivers | Operator |
| POST | `/api/v1/operator/driver/add` | Add driver to operator | Operator |
| POST | `/api/v1/operator/driver/remove` | Remove driver from operator | Operator |
| POST | `/api/v1/operator/assignment/assign` | Assign driver to bus | Operator |
| POST | `/api/v1/operator/assignment/unassign` | Unassign driver from bus | Operator |
| POST | `/api/v1/operator/assignment/swap` | Swap driver on bus | Operator |
| GET | `/api/v1/operator/analytics/overview` | Get operator analytics overview | Operator |
| GET | `/api/v1/operator/analytics/revenue` | Get revenue trend | Operator |
| GET | `/api/v1/operator/analytics/buses` | Get bus analytics | Operator |
| GET | `/api/v1/operator/analytics/drivers` | Get driver analytics | Operator |
| GET | `/api/v1/operator/analytics/fleet-comparison` | Compare fleet revenue | Operator |
| GET | `/api/v1/operator/analytics/buses/:busId` | Get detailed bus analytics | Operator |
| GET | `/api/v1/operator/analytics/drivers/:driverId` | Get detailed driver analytics | Operator |

### Driver

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/driver/tap-events/recent` | Get recent tap events for the assigned bus | Driver |

### Bus Location

The bus location router is mounted at `/api/v1/bus`, `/api/v1/buses`, and legacy `/bus`.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | `/api/v1/bus/locations` | Get all bus locations | Yes |
| POST | `/api/v1/bus/update-location` | Update bus location from GPS/device payload | Optional device key |
| GET | `/api/v1/bus/:busId` | Get one bus location | No |
| GET | `/api/v1/buses/locations` | Get all bus locations | Yes |
| POST | `/api/v1/buses/update-location` | Update bus location from GPS/device payload | Optional device key |
| GET | `/api/v1/buses/:busId` | Get one bus location | No |

## Example API Flow

1. Register a passenger using `/api/v1/users/register`.
2. Login and receive JWT tokens.
3. Register an NFC card using `/api/v1/users/registerNfc`.
4. Admin verifies the pending NFC card using `/api/v1/admin/verify/:id`.
5. Operator registers buses and assigns drivers using operator routes.
6. A passenger taps the NFC card on entry using `/api/v1/user/tap`.
7. The passenger taps again on exit.
8. The backend calculates distance and fare, then deducts the amount from the NFC card balance if funds are available.
9. If the balance is insufficient, the transaction is marked for payment and can be paid through Khalti.
10. Passenger transaction history is available from `/api/v1/users/payment/transactions`.

## Testing

No `npm test` script was found in `package.json`.

There are tap-service files inside the `test/` folder, but they are not wired to a test runner. For now, test the API manually using Postman, Thunder Client, Insomnia, or cURL.

Recommended manual test areas:

- User registration and login
- NFC card registration and admin verification
- Tap-in and tap-out flow
- Insufficient balance flow
- Khalti payment initiation and verification
- Transaction history filters
- Operator vehicle and analytics APIs
- Bus GPS update endpoint

## Troubleshooting

### Database connection error

- Check that MongoDB is running or that your MongoDB Atlas cluster is reachable.
- Confirm `MONGODB_URL` is correct.
- If using Atlas, confirm your IP address is allowed.

### Missing environment variables

- Confirm `.env` exists in the project root.
- Confirm `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are set.
- Confirm `KHALTI_SECRET_KEY`, `KHALTI_RETURN_URL`, and `WEBSITE_URL` are set before testing Khalti.

### Unauthorized request

- Login again and use the latest access token.
- Send the token as `Authorization: Bearer <token>` or keep the `accessToken` cookie.
- Check that the user has the required role for the route.

### NFC card not working

- Confirm the NFC card exists in the database.
- Confirm the card is verified by admin.
- Confirm the card is active and not blocked.
- Confirm the RFID/card UID format matches the value stored in the database.

### Insufficient balance

- Recharge the NFC card through the Khalti top-up endpoint.
- Verify pending payments after completing Khalti payment.

### Khalti payment verification failure

- Confirm `KHALTI_SECRET_KEY` is valid.
- Confirm `KHALTI_BASE_URL` is correct.
- Confirm `KHALTI_RETURN_URL` is publicly accessible when testing real Khalti callbacks.
- Confirm the `pidx` belongs to a valid initiated payment.

### CORS error

- Set `CORS_ORIGIN` to your frontend URL.
- For local development, confirm the frontend is running on the same origin configured in `.env`.

## Future Improvements

- Add automated unit and integration tests
- Add Swagger/OpenAPI documentation
- Add strict environment validation during server startup
- Add QR ticket support
- Add offline NFC transaction sync
- Add exportable reports for admin/operator dashboards
- Add rate limiting and stronger production security middleware
- Add production logging, monitoring, and deployment documentation
- Add seed scripts for demo users, buses, drivers, and NFC cards

## Manual Updates Before Publishing

- Add the real GitHub repository URL.
- Add the correct frontend URL and production API URL.
- Add the final MongoDB database name or setup notes.
- Add real Khalti callback and website URLs for your deployment.
- Confirm whether the hardware tap endpoint should require a device API key.
- Add screenshots or API examples if you want the README to be more visual.
- Add a real test command after setting up a test runner.

## Author

Name: Nabin Shrestha

Role: Backend Developer / Software Developer
