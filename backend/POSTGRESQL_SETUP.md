# PostgreSQL Connection – Implementation Plan

This project already uses **PostgreSQL** via the `pg` package. Below is how it works and how to set it up from scratch.

---

## 1. Current Implementation Overview

| Item | Location / Details |
|------|--------------------|
| **Driver** | `pg` (node-postgres) in `package.json` |
| **Config** | `src/config/db.js` – creates a connection pool |
| **Usage** | Controllers require `../../config/db` and use `pool.query()` or `pool.connect()` |
| **Env** | `dotenv` loads `.env`; DB credentials come from env vars |

---

## 2. Step-by-Step: Connect Your App to PostgreSQL

### Step 1 – Install PostgreSQL

- **Windows:** [PostgreSQL installer](https://www.postgresql.org/download/windows/)
- **macOS:** `brew install postgresql@16`
- **Linux:** `sudo apt install postgresql postgresql-contrib` (Ubuntu/Debian)

Start the service and ensure it’s listening (default port **5432**).

---

### Step 2 – Create Database and User (optional but recommended)

Using `psql` or pgAdmin:

```sql
-- Create a database for the app
CREATE DATABASE zen_db;

-- Create a dedicated user (optional)
CREATE USER zen_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zen_db TO zen_user;
\c zen_db
GRANT ALL ON SCHEMA public TO zen_user;
```

You can also use the default `postgres` user and an existing database.

---

### Step 3 – Environment Variables

In the **backend** folder, create or edit `.env` and set:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=zen_db
DB_USER=zen_user
DB_PASSWORD=your_secure_password
```

- **Local:** `DB_HOST=localhost`
- **Docker:** use the Postgres container name as `DB_HOST`
- **Cloud (e.g. AWS RDS):** use the instance endpoint as `DB_HOST`, and set `DB_SSL=true` if required

---

### Step 4 – Backend Config (Already in Place)

`src/config/db.js` uses these env vars and exports a **Pool**:

```js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
```

No code change needed for a basic connection.

---

### Step 5 – Install Dependencies and Test

```bash
cd backend
npm install
```

Test the connection:

```bash
node src/scripts/test_db.js
```

You should see something like: `Connect success!` and a timestamp from `SELECT NOW()`.

---

### Step 6 – Run the Application

```bash
npm run dev
```

`server.js` runs `initDB()` which creates/updates tables (e.g. reviews, enrollments). The app uses the same `pool` from `src/config/db.js` for all DB access.

---

## 3. Optional Improvements

### 3.1 Pool Options (recommended for production)

In `src/config/db.js` you can add:

```js
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

### 3.2 SSL (for cloud / managed PostgreSQL)

If your provider requires SSL:

```js
const pool = new Pool({
  // ... other options
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
});
```

### 3.3 Connection string (alternative)

You can use a single URL instead of separate fields:

```env
DATABASE_URL=postgresql://zen_user:your_secure_password@localhost:5432/zen_db
```

Then in `db.js`:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
});
```

---

## 4. Quick Checklist

| Step | Action |
|------|--------|
| 1 | Install PostgreSQL and start the service |
| 2 | Create database (and optionally user) |
| 3 | Add `DB_*` (or `DATABASE_URL`) to `backend/.env` |
| 4 | Run `npm install` in `backend` |
| 5 | Run `node src/scripts/test_db.js` to verify connection |
| 6 | Run `npm run dev` – tables are created/updated on startup |

---

## 5. Where the App Uses the DB

- **Config:** `src/config/db.js` → exports `pool`
- **Entry:** `server.js` → requires pool, runs `initDB()`
- **App:** `src/app.js` → uses pool for health/checks
- **Controllers:** e.g. `leadController.js`, `userController.js`, `authController.js`, etc. → `const pool = require("../../config/db")` and then `pool.query(...)` or `pool.connect()`

All DB access goes through this single pool, so configuring `db.js` and `.env` is enough to connect the app to PostgreSQL.
