# PROJECT MILESTONES

This document outlines the phased implementation plan for the **Inventor Client** project, from foundational scaffolding to the final production release. It serves as a master roadmap to ensure features are built iteratively, securely, and in logical dependency order according to the `SPEC.md`.

---

## 🟢 Phase 0: Foundational Scaffolding (COMPLETED)
**Goal:** Establish the enterprise-grade project architecture.
*   **Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Shadcn UI base.
*   **Routing & State:** React Router, React Query, global App Shell.
*   **Backend Connection:** Supabase singleton client and environment validation.
*   **Design System:** CSS variables, typography, and dark/light modes defined.
*   **Code Quality:** Strict TypeScript, ESLint rules, Prettier formatting.

---

## 🟢 Phase 1: Admin Authentication (COMPLETED)
**Goal:** Secure the application with strict Role-Based Access Control (RBAC).
*   **Database:** `auth.users` extension, `roles`, `admin_profiles`, `audit_logs`, and RLS policies.
*   **State Machine:** Multi-step login flow (`useLogin` hook).
*   **UI Forms:** Email/Password step, 6-digit OTP step, rate limiting/resend cooldowns.
*   **Route Guards:** `ProtectedRoute` (Admin only) and `PublicRoute` (Login).
*   **Session Management:** `AuthProvider` with token refresh handling.

---

## 🟢 Phase 2: Admin Dashboard Layout & Navigation (COMPLETED)
**Goal:** Build the structural UI frame for the Admin Interface.
*   **App Shell:** Responsive sidebar navigation, top header, user profile dropdown.
*   **Navigation:** Breadcrumbs, active route states, mobile drawer menu.
*   **Theme Control:** Dark/Light mode toggle.
*   **Dashboard View:** Skeleton of the main analytics dashboard (placeholder widgets).
*   **Routing:** Map out empty routes for Inventory, QR, Reports, and Settings.

---

## 🟢 Phase 3: Core Inventory Database Design (COMPLETED)
**Goal:** Establish the normalized PostgreSQL schema for physical inventory.
*   **Schema Design:** `categories`, `locations`, `inventory_items` (abstract), and `inventory_copies` (physical).
*   **Constraints:** Foreign keys, unique constraints, soft deletes (`deleted_at`).
*   **Security:** Row Level Security (RLS) policies allowing only admins to modify inventory.
*   **RPCs:** Supabase database functions for complex queries/aggregations.

---

## 🟢 Phase 4: Core Inventory Management (COMPLETED)
**Goal:** Build the CRUD interfaces for managing inventory.
*   **Data Tables:** Integrate TanStack Table with pagination, sorting, and server-side filtering.
*   **Forms:** React Hook Form + Zod for creating/editing Items and physical Copies.
*   **Views:** Detailed view pages showing item metadata and its associated copies.
*   **Categorization:** UI to manage Categories and Locations.

---

## 🟢 Phase 5: QR Code Management Engine (COMPLETED)
**Goal:** Implement the immutable QR identity system.
*   **Database:** `qr_codes` table linking a unique UID (e.g., `INV-0001`) to an `inventory_copy`.
*   **Generation:** Frontend/Edge Function logic to generate SVG/PNG QR codes.
*   **Storage:** Upload generated QR images to Supabase Storage permanently.
*   **Printing UI:** Generate printable A4 sheets or thermal labels (bulk selection).
*   **Audit:** Track `print_count` and `last_printed` dates.

---

## 🟢 Phase 6: Counter Terminal (COMPLETED)
**Goal:** Build the restricted, touch-friendly interface for checking items in/out.
*   **Admin Control:** Admin-gated terminal open/close with daily audit logging.
*   **Borrower Auth:** OTP-based temporary session via institutional email (configurable domain restriction via env).
*   **UI/UX:** Large, high-contrast, touch-optimized layout (Borrow & Return modes).
*   **Hardware Integration:** USB/Bluetooth QR scanner auto-focused keyboard input.
*   **Flow:** Admin Open -> Borrower OTP -> Scan item QR -> Verify availability -> Confirm borrow/return -> Auto-expire session -> Email receipt.

---

## 🟢 Phase 7: Transactions & Lifecycle Management (COMPLETED)
**Goal:** Track the movement of all inventory copies.
*   **Database:** `transactions` table recording checkout, check-in, lost, or damaged states.
*   **Logic:** Enforce business rules (e.g., cannot borrow an already borrowed item).
*   **Audit Logging:** Detailed logs of who authorized the transaction.
*   **Admin View:** Dedicated Transactions ledger (`/admin/transactions`) with filters and admin overrides (Mark as Lost, Mark as Damaged, Force Return).

---

## 🟢 Phase 8: Data Import/Export & Reports Engine (COMPLETED)
**Goal:** Support bulk enterprise onboarding, custom date range reporting, and analytics.
*   **Import UI:** Single-sheet unified CSV/XLSX uploader for items, categories, locations, and copies.
*   **Validation Engine:** Client-side parsing and strict Zod validation of rows before upload.
*   **Reports UI:** Tabbed reporting dashboard (`/admin/reports`) with custom date range pickers and presets.
*   **Export:** Multi-format export to CSV, multi-sheet formatted Excel (`.xlsx`), and clean Print/PDF layouts.
*   **Email Notifications:** Digital receipt dispatch on borrow/return and automated due date reminder engine.

---

## 🟢 Phase 9: QA, Polish & Production Release (COMPLETED)
**Goal:** Finalize the software for a 10-year maintenance lifecycle.
*   **Testing:** Vitest automated unit testing suite across utilities, validation schemas, and services.
*   **Performance & Type Safety:** Strict TypeScript compilation (`tsc -b --noEmit` with 0 errors).
*   **Documentation:** Comprehensive `README.md` with system architecture diagrams, database ERD, and deployment guides.

---

## ⚪ Phase 10: Open Source Distribution & Community
**Goal:** Package the software so anyone can easily deploy and use it (Self-Hosting).
*   **Deployment Guides:** Create `DEPLOYMENT.md` detailing how to fork, link to Vercel/Netlify, and set up a Supabase instance (One-click deploy buttons if possible).
*   **Open Source Readiness:** Add MIT/Apache license, Code of Conduct, and `CONTRIBUTING.md`.
*   **Demo Environment:** Set up a live demo instance with read-only admin credentials or isolated sandboxes.
*   **Project README:** Create a compelling `README.md` with screenshots, architecture diagrams, and a "Quick Start" guide.
*   **Dockerization (Optional):** Provide a `docker-compose.yml` for fully local self-hosting (frontend + Supabase local stack).
