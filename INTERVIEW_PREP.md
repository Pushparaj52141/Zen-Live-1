# ZEN ERP System: Technical Breakdown for MERN Interview

This document provides a comprehensive technical analysis of the **ZEN ERP** project, structured for a MERN-stack technical interview.

---

## 1. Project Overview
*   **Business Problem:** ZEN addresses the operational inefficiencies and data silos in a high-volume training and consultancy business. Before ZEN, lead management, student tracking, and employee attendance were handled via manual spreadsheets and WhatsApp, leading to data loss, lack of accountability, and delayed reporting.
*   **Core Users:**
    *   **Admins:** Manage system settings, financial reporting, and user roles.
    *   **Counselors/Sales:** Track the lead pipeline from initial inquiry to enrollment.
    *   **IT Teams:** Manage internal software dev tasks and project timelines.
    *   **Trainers:** Control student batches and curriculum progress.
    *   **Employees:** Daily HR operations (Check-in/out, leave requests).
*   **The Solution:** A centralized MERN-based ERP that integrates real-time Meta Lead Ads, automated attendance tracking, and a Kanban-style CRM.

---

## 2. Frontend (React) Architecture
*   **Modular Organization:** Uses a **Feature-based directory structure** (`src/features/`). Each module (CRM, IT Updates, Attendance) is self-contained with its own components, services, and state logic.
*   **Dynamic Dashboards:** Implements **Role-Based Access Control (RBAC)** at the UI level. The `DashboardMain.jsx` uses the `role_id` from the auth state to conditionally render widgets and navigation items.
*   **State Management Strategy:**
    *   **Complex State:** Uses Redux (RTK) for shared application state (user profile, global settings).
    *   **Local UI State:** `useState` and `useReducer` for form handling and modal toggles.
    *   **Communication:** Custom `window` events (e.g., `zen:leadUpdated`) decouple the board refresh logic from individual modal actions.
*   **API Interception:** A centralized `apiClient` (Axios) automatically attaches the JWT `Authorization` header to every request and handles global 401 (Unauthorized) redirects.
*   **Performance Optimization:** 
    *   **Component Memoization:** `React.memo` with custom comparison functions on `LeadCard` components to prevent unnecessary re-renders of the large Kanban board.
    *   **Code Splitting:** `React.lazy` and `Suspense` for heavy routes and modals like `AddLeadModal` and `EditLeadForm`.
    *   **Debouncing:** Search functionality is debounced to 300ms to reduce API load during typing.

---

## 3. Backend (Node.js + Express)
*   **Architecture:** Follows a standard Controller-Service pattern.
    *   **Controllers:** Purely manage request parsing and response formatting.
    *   **Services:** Handle core business logic (e.g., Calculating attendance late marks or fetching Facebook lead data).
*   **Authentication & Security:**
    *   **JWT Strategy:** Dual-token system with short-lived **Access Tokens** and long-lived **Refresh Tokens** stored in HTTP-only cookies.
    *   **RBAC Middleware:** A robust `authorizeRoles` middleware ensures that API endpoints (e.g., `DELETE /leads`) are only accessible to specific `role_id`s.
    *   **Self-Healing Database:** The server includes an `initDb` routine that verifies the PostgreSQL schema and applies missing columns/indexes on startup, ensuring environment parity.
*   **Error Handling:** Global error-handling middleware catches all async errors, logs them using Winston, and returns standardized JSON responses.

---

## 4. Database Design (PostgreSQL)
*   **Justification:** While built as a MERN project, the data is highly relational (Users $\rightarrow$ Tasks $\rightarrow$ Projects; Leads $\rightarrow$ Courses $\rightarrow$ Batches). PostgreSQL was chosen for its strong relational integrity, ACID compliance, and advanced indexing.
*   **Optimization:**
    *   **Indexing:** B-Tree indexes on `status`, `user_id`, and `created_at` in the `leads` table to ensure sub-100ms response times for the Kanban board.
    *   **Relational Logic:** Uses `ON DELETE CASCADE` for tasks and comments to maintain data cleanliness.
*   **Complex Queries:** Heavy use of SQL aggregations for dashboards, such as calculating project completion percentages via `LEFT JOIN` and `COUNT(CASE WHEN...)`.

---

## 5. Core Modules Detail
### **CRM & Lead Management**
*   **Flow:** Leads enter via Meta Webhook $\rightarrow$ Saved to `meta_leads` $\rightarrow$ Counselors move them through Kanban stages (Enquiry $\rightarrow$ Prospect $\rightarrow$ Enrollment).
*   **Drag-and-Drop:** Built using `@hello-pangea/dnd` with an optimistic UI update approach.

### **HRMS (Attendance & Leave)**
*   **Implementation:** Employees check in with a live photo and GPS coordinates.
*   **Business Logic:** Logic in `attendanceService.js` automatically marks an employee as "Late" if check-in is after 09:40 AM.

### **IT Projects (Task Management)**
*   **Implementation:** A project dashboard tracking `it_tasks`. 
*   **Features:** Task status tracking (`in_progress`, `review`, `completed`), priority levels, and developer-specific activity logs.

---

## 6. Security & Compliance
*   **Token Rotation:** Refresh tokens are rotated on every manual refresh to prevent replay attacks.
*   **Webhooks Security:** Facebook Webhook requests are verified using `x-hub-signature-256` hashing to ensure requests only come from Meta's servers.
*   **Data Masking:** Sensitive user information like passwords are hashed using `bcryptjs` with a salt factor of 10.

---

## 7. Performance & Scalability
*   **Bottleneck:** Rendering hundreds of lead cards on the board simultaneously.
*   **Fix:** Implementation of `React.memo` and ensuring the `columns` state update logic doesn't trigger a full board re-mount.
*   **Backend Scaling:** Used `compression` middleware to reduce payload size and `pg.Pool` for efficient database connection management.

---

## 8. Deployment & Challenges
*   **Real Bug:** Encountered issues with Facebook Webhook verification failing in production.
*   **Fix:** Traced it to the root path `/` missing a response for validation pings; added a health-check endpoint.
*   **Refactor Goal:** If refactoring today, I would implement **React Query (TanStack Query)** for more efficient server-state caching and synchronization.

---

## 9. Interviewer Cheat Sheet (Quick Answers)
*   **"How do you handle real-time updates?"** - We use custom window events for local state sync and plan to migrate to WebSockets for multi-user real-time board updates.
*   **"Why Postgres over MongoDB?"** - The business logic depends heavily on structured relationships (Enrollments must link to Users and Courses). Postgres ensures this integrity at the database level.
*   **"How did you secure the API?"** - JWT for authentication, RBAC middleware for authorization, and CORS whitelisting for domain security.
