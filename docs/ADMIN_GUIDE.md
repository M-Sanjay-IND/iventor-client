# 📘 Inventor Client — Administrator Manual (ADMIN_GUIDE.md)

This guide provides end-to-end operational instructions for inventory administrators managing catalog assets, physical copies, counter terminal operations, lifecycle overrides, and automated reporting.

---

## 📑 Table of Contents
1. [Admin Authentication & Access](#1-admin-authentication--access)
2. [Inventory Catalog & Physical Copies Management](#2-inventory-catalog--physical-copies-management)
3. [Single-Sheet Unified XLSX Bulk Import](#3-single-sheet-unified-xlsx-bulk-import)
4. [Counter Terminal Management](#4-counter-terminal-management)
5. [Transaction Lifecycle & Admin Overrides](#5-transaction-lifecycle--admin-overrides)
6. [Reports Engine & Custom Date Range Analytics](#6-reports-engine--custom-date-range-analytics)
7. [Email Receipts & Due Date Reminders](#7-email-receipts--due-date-reminders)

---

## 1. Admin Authentication & Access
- **Login URL**: `/login` (auto-redirects to `/admin` upon verification).
- **Authentication Flow**:
  1. Enter your registered administrator email and password.
  2. Complete email OTP verification (if 2FA is enabled).
  3. Session auto-locks after 8 hours of inactivity or upon explicit logout.

---

## 2. Inventory Catalog & Physical Copies Management
The system cleanly separates **Catalog Items** from **Physical Copies**:
- **Catalog Item (`/admin/inventory/new` or `/admin/inventory/:id`)**:
  - Defines product metadata: Item Name, Category, Manufacturer, Brand, Model, SKU, Unit Monetary Value, and Description.
  - Automatically receives a **Shared Item-Level QR Code** (`INV-ITEM-...`) for bulk scanning.
- **Physical Copy**:
  - Represents an individual physical asset unit with a sequential copy number (`Copy #1`, `Copy #2`).
  - Tracks specific storage location (e.g., *Main Lab - Rack A*), physical condition (`new`, `good`, `fair`, `poor`, `damaged`, `lost`), and availability status (`available`, `borrowed`, `maintenance`, `retired`, `lost`).
  - Receives a **Unique Physical Copy QR Code** (`INV-000000001`).

---

## 3. Single-Sheet Unified XLSX Bulk Import
Admins can onboard entire facility inventories using a **single Excel (.xlsx) or CSV spreadsheet**:

1. Navigate to `/admin/inventory` and click **"Bulk Import (Single XLSX)"**.
2. Download the template or populate your spreadsheet with the following columns:
   - `Item Name` *(Mandatory)*: Product title.
   - `Category Name`: Auto-creates category if not yet registered.
   - `Description`: Item description.
   - `Location Name`: Auto-creates storage rack/location.
   - `Quantity`: Number of physical copies to create (default `1`).
   - `Condition` & `Status`: Defaults to `good` and `available`.
   - `Manufacturer`, `Brand`, `Model`, `SKU`, `Unit Value`, `Notes`.
3. Click **"Start Unified Import"**. The system will create all items, categories, locations, physical copies, and vector QR codes in a single operation.

---

## 4. Counter Terminal Management
The **Counter Terminal (`/counter`)** is a dedicated touch-friendly kiosk interface for lab desks and checkout counters:

1. **Opening a Terminal Session**:
   - Go to `/counter` or click **"Launch Counter Terminal"** on the Dashboard.
   - If closed, an administrator unlocks the terminal by entering their password.
2. **Borrower Checkout Flow**:
   - Borrower enters their institutional email (e.g. `student@university.edu`).
   - Borrower enters the transient 6-digit OTP sent to their email.
   - Borrower selects **Borrow** or **Return** mode and scans the physical items using a USB/Bluetooth barcode scanner.
   - Upon confirmation, borrower receives an instant digital email receipt with item details and return due dates.
   - Session auto-expires after 10 minutes of inactivity.

---

## 5. Transaction Lifecycle & Admin Overrides
Admins can monitor and override asset states at `/admin/transactions`:

- **Status Badges**:
  - `Borrow` (Active checkout)
  - `Return` (Completed check-in)
  - `Overdue` (Current date is past loan due date)
  - `Lost` & `Damaged` (Write-offs)
- **Admin Overrides**:
  - **Force Return**: Click the three-dot menu on any active borrow to check back in an item without requiring borrower OTP.
  - **Mark as Lost**: Sets copy status to `lost` and records write-off transaction with custom audit notes.
  - **Mark as Damaged**: Sets copy status to `maintenance` and condition to `damaged` with maintenance notes.
- **Exporting Transactions**:
  - **Export XLSX (Single Date Col)**: Combines Borrow and Return dates into a single unified column (`Borrowed: 15/08/2026 → Returned: 16/08/2026`).
  - **Export CSV**: Full multi-column raw ledger.

---

## 6. Reports Engine & Custom Date Range Analytics
Navigate to `/admin/reports` to access granular reports across arbitrary date windows:

- **Date Range Filters**:
  - Choose quick presets (*Today*, *Last 7 Days*, *Last 30 Days*, *This Month*, *All Time*) or select a **Custom Start & End Date**.
- **Report Modules**:
  1. **Inventory Valuation & Stock (Item-Level)**: Item-by-item breakdown showing SKU, Brand/Model, Unit Price, Total/Available/Borrowed/Lost copies, Storage Locations, and Total Item Valuation.
  2. **Category & Location Summaries**: High-level valuation by category and storage allocation.
  3. **Borrowing Activity Log**: All checkouts and returns within the selected date window.
  4. **Overdue Loans & Action Center**: List of active loans exceeding return windows with borrower emails and days overdue.
  5. **Lost & Damaged Write-offs**: Asset write-off log with financial loss calculations.
- **Export Formats**:
  - **Multi-Sheet XLSX**: Comprehensive workbook containing Item-level inventory, Category valuation, and Location breakdown sheets.
  - **CSV**: Filtered data in tabular CSV format.
  - **Print / PDF**: Clean enterprise print layout.

---

## 7. Email Receipts & Due Date Reminders
- **Instant Receipts**: Automatically emailed to borrowers upon completing checkout or check-in.
- **Due Date & Overdue Reminders**:
  - On the **Overdue Loans** tab (`/admin/reports`), click **"Send Due Reminders Now"** to dispatch automated reminder emails to all borrowers with loans due today or overdue.
  - Configurable via `VITE_COUNTER_DUE_DAYS` in your environment settings.
