# Trasaction System Backend

A robust Node.js/Express backend application for managing financial transactions with ledger-based accounting, user authentication, and secure transaction handling.


##  Overview

Trasaction System Backend is a backend service designed to handle secure financial transactions with strong consistency guarantees. It uses MongoDB transactions with ACID properties to ensure data integrity, implements idempotency for transaction safety, and maintains a double-entry ledger system for accurate balance tracking.

The system supports:
- User registration and authentication
- Account management
- Peer-to-peer transactions
- Initial funds allocation from a system user
- Email notifications
- Complete audit trail via ledger entries

##  Features

### Authentication & Authorization
- JWT-based authentication with secure token management
- Token blacklisting for logout functionality
- System user middleware for administrative operations
- Password hashing with bcrypt

### Transaction Management
- **Idempotency Support**: Prevents duplicate transactions using idempotency keys
- **Transaction States**: PENDING → COMPLETED (or FAILED/REVERSE)
- **Atomic Operations**: MongoDB session-based transactions ensure all-or-nothing execution
- **Status Tracking**: Real-time transaction status updates
- **Email Notifications**: Automatic email alerts on transaction completion

### Ledger System
- Double-entry bookkeeping (DEBIT/CREDIT)
- Real-time balance calculation via aggregation pipeline
- Complete transaction history
- Account-level ledger entries

### Account Management
- Multiple account status states (ACTIVE, FROZEN, CLOSED)
- Currency support (default: NPR)
- User-account association with indexing for fast queries
- Balance derivation from ledger entries

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB |
| **ODM** | Mongoose |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Hashing** | bcrypt |
| **Email Service** | Custom email service |
| **Environment** | dotenv |
| **Session Management** | MongoDB Sessions |

##  Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.2 or higher)
- npm or yarn

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ADBEND
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

5. **Start the server**
   ```bash
   npm start
   ```

The server will start on the port specified in your `.env` file (default: 3000).

##  Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=**************************
MONGODB_TIMEOUT=10000

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@test.com

# Application
APP_NAME=****
APP_URL=http://localhost:3000
```

### Important Notes
- Keep `JWT_SECRET` secure and generate a strong random string
- Use environment-specific configuration (development, staging, production)
- Never commit `.env` file to version control

##  Database Setup

### MongoDB Connection
The application connects to MongoDB using Mongoose. Ensure MongoDB is running and accessible.

### Creating a System User

The system needs a special "system user" account for operations like initial fund allocation. To create one:

1. **Via MongoDB Shell:**
   ```javascript
   db.users.insertOne({
     username: "SYSTEM",
     email: "system@test.com",
     password: "$2b$10$...", // bcrypt hashed password
     systemUser: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

2. **Create System User Account:**
   ```javascript
   db.accounts.insertOne({
     user: ObjectId("system_user_id"),
     status: "Active",
     currency: "NPR",
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

### Collections

The database contains the following collections:

- **users**: User accounts with authentication credentials
- **accounts**: User financial accounts
- **transactions**: Transaction records
- **ledgers**: Ledger entries for balance tracking
- **blacklists**: Blacklisted JWT tokens
- **sessions**: MongoDB transaction sessions (auto-managed)

## 📁 Project Structure

```
ADBEND/
├── src/
│   ├── app.js                          # Express app configuration
│   ├── config/
│   │   └── db.js                       # Database connection
│   ├── controller/
│   │   ├── auth.controller.js          # Authentication logic
│   │   ├── account.controller.js       # Account management
│   │   └── transaction.controller.js   # Transaction processing
│   ├── middleware/
│   │   └── auth.middleware.js          # JWT verification & auth
│   ├── models/
│   │   ├── user.model.js               # User schema
│   │   ├── account.model.js            # Account schema
│   │   ├── transaction.model.js        # Transaction schema
│   │   ├── ledger.model.js             # Ledger schema
│   │   └── blacklist.model.js          # Token blacklist schema
│   ├── routes/
│   │   ├── auth.routes.js              # Auth endpoints
│   │   ├── account.routes.js           # Account endpoints
│   │   └── transaction.routes.js       # Transaction endpoints
│   └── services/
│       └── email.service.js            # Email notification service
├── server.js                           # Application entry point
├── package.json                        # Dependencies
├── .env.example                        # Environment template
└── README.md                           # This file
```

##  API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/register` | Register a new user | No |
| POST | `/login` | User login, returns JWT token | No |
| POST | `/logout` | Logout and blacklist token | Yes |

### Account Routes (`/api/accounts`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/create` | Create a new account | Yes |
| GET | `/` | Get all user's accounts | Yes |
| GET | `/balance/:accountId` | Get account balance by ID | Yes |

### Transaction Routes (`/api/transactions`)

| Method | Endpoint | Description | Auth Required | Special |
|--------|----------|-------------|----------------|---------|
| POST | `/` | Create peer-to-peer transaction | Yes | Regular User |
| POST | `/system/initial-fund` | Allocate initial funds | Yes | System User Only |


## 💳 Transaction Flow

The transaction processing follows a 10-step atomic process:

```
1. Validate Request
   ├─ Check required fields (fromAccount, toAccount, amount, idempotencyKey)
   └─ Verify both accounts exist

2. Validate Idempotency Key
   ├─ Check if transaction with same key exists
   ├─ If COMPLETED → return success with existing transaction
   ├─ If PENDING → return "please wait"
   └─ If FAILED/REVERSE → return error with retry message

3. Check Account Status
   └─ Ensure both accounts are ACTIVE

4. Derive Sender Balance
   ├─ Query ledger entries for sender account
   ├─ Calculate: balance = totalCredit - totalDebit
   └─ Verify sufficient balance

5. Create Transaction Record
   └─ Insert transaction with status: PENDING

6. Create DEBIT Ledger Entry
   └─ Record money leaving sender's account

7. Create CREDIT Ledger Entry
   └─ Record money entering receiver's account

8. Mark Transaction as COMPLETED
   └─ Update transaction status

9. Commit MongoDB Session
   ├─ All operations succeed together
   └─ Or all rollback on any failure

10. Send Email Notification
    └─ Notify user of transaction completion
```

All steps 5-9 execute within a MongoDB transaction session for ACID compliance.

## 👥 System User Account

The system user is a special administrative account used for operations like:
- Initial fund allocation to new users
- System-level transactions
- Administrative operations

### Key Characteristics
- `systemUser: true` in the database
- Requires `authSystemUserMiddleware` for protected routes
- Must have an associated account for transactions
- Not selectable by default (requires `.select("+systemUser")`)

### Identifying System User
Query with explicit field selection:
```javascript
const systemUser = await userModel.findOne({ systemUser: true }).select("+systemUser")
```


### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Successful operation |
| 201 | Resource created successfully |
| 400 | Bad request, validation failed |
| 401 | Unauthorized, authentication required |
| 403 | Forbidden, insufficient permissions |
| 500 | Server error, operation failed |



##  Transaction Idempotency

Idempotency ensures that the same transaction request produces the same result even if called multiple times. This is critical for financial systems.

**How it works:**
- Client generates a unique `idempotencyKey` (UUID recommended)
- Server stores this key with transaction
- Duplicate requests with same key return cached response
- Network failures or retries won't create duplicate transactions

##  Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Last Updated**: March 2026
**Version**: 1.0.0
