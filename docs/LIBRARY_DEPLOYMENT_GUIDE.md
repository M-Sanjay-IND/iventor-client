# iVentor Library System — Complete Deployment & Security Lockdown Manual

> **Department Library Edition**  
> *Target Scale: 700–800 Books | 300 Students | 1 Dedicated Counter Terminal Workstation*  
> *Platform: React 19, TypeScript, Tailwind CSS, Supabase PostgreSQL, Edge Functions*

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Hardware & Software Prerequisites](#2-hardware--software-prerequisites)
3. [Step 1: Repository Cloning & Local Configuration](#3-step-1-repository-cloning--local-configuration)
4. [Step 2: Backend & Database Setup (Supabase)](#4-step-2-backend--database-setup-supabase)
5. [Step 3: Initial Catalog & Inventory Onboarding](#5-step-3-initial-catalog--inventory-onboarding)
6. [Step 4: QR Code Sticker Generation & Physical Labeling](#6-step-4-qr-code-sticker-generation--physical-labeling)
7. [Step 5: Workstation Hardening & Kiosk Lockdown (Alternative to Windows Assigned Access)](#7-step-5-workstation-hardening--kiosk-lockdown)
8. [Step 6: Hardware Barcode/QR Scanner Security Configuration](#8-step-6-hardware-barcodeqr-scanner-security-configuration)
9. [Step 7: Production Hosting & Network Deployment](#9-step-7-production-hosting--network-deployment)
10. [Step 8: Daily Operational Procedures & Librarian Runbook](#10-step-8-daily-operational-procedures--librarian-runbook)
11. [Troubleshooting & Maintenance FAQ](#11-troubleshooting--maintenance-faq)

---

## 1. Executive Summary & System Architecture

**iVentor** is designed to operate a zero-friction, anti-tamper library circulation counter in a collegiate department environment. The platform employs a **Dual-Topology Architecture**:

```
                                  +---------------------------------------+
                                  |         Supabase Cloud Backend        |
                                  |  - PostgreSQL 15 Database (RLS)       |
                                  |  - Edge Functions (Brevo / Email)     |
                                  |  - Vector QR Storage Bucket           |
                                  +---------------------------------------+
                                                     ▲
                                                     │ HTTPS / WSS / REST
                                                     ▼
                  +---------------------------------------------------------------------+
                  |                   Department Library Workstation                    |
                  |                                                                     |
                  |  +---------------------------------+  +--------------------------+  |
                  |  |      Admin Command Console      |  |  Counter Kiosk Terminal  |  |
                  |  |             (/admin)            |  |         (/counter)       |  |
                  |  |  - Inventory & Stock Valuation  |  |  - Fullscreen Kiosk Mode |  |
                  |  |  - Bulk XLSX Data Onboarding    |  |  - Transient Student OTP |  |
                  |  |  - Sticker Sheet Batch Printing |  |  - Optical Scanner Guard |  |
                  |  |  - Transaction Overrides        |  |  - Hotkey & DevTools Ban |  |
                  |  +---------------------------------+  +--------------------------+  |
                  |                                                     ▲               |
                  +-----------------------------------------------------┼---------------+
                                                                        │ USB HID Input
                                                                        ▼
                                                         [ 2D Optical QR/Barcode Scanner ]
```

### Key Security Safeguards
1. **Hardware-Only Optical Scanner Filter**: Keystroke arrival intervals are monitored at the microsecond level. Optical scanners emit bursts at $<30\text{ms}$ per character. Manual typing ($>70\text{ms}$ interval) and direct clipboard pasting are strictly blocked to prevent students from typing arbitrary codes.
2. **Kiosk Lockdown**: The application operates in borderless fullscreen mode without address bars, navigation controls, or browser tabs. Key combinations (`F12`, `Ctrl+Shift+I`, `Ctrl+U`, `Ctrl+P`, `F5`, `Ctrl+R`) and right-click context menus are intercepted and disabled.
3. **Transient Student OTP Auth**: Students do not need permanent passwords. They input their student email, receive a one-time passcode (valid for 5 minutes), perform self-checkout or return, receive an automated digital receipt, and the session automatically clears.

---

## 2. Hardware & Software Prerequisites

### Workstation Hardware
* **Computer**: Any standard desktop or laptop running Windows 10 or Windows 11 (Home, Pro, or Enterprise).
* **RAM & CPU**: Minimum 4 GB RAM, dual-core Intel/AMD processor.
* **Handheld Scanner**: Standard 2D USB/Bluetooth Barcode & QR Scanner (e.g., Netum, Honeywell, Zebra, Inateck, or generic USB HID barcode scanner).
* **Printer**: Standard office laser or inkjet printer for printing QR sticker sheets (standard A4 sticker sheets or Avery 5160 labels).

### Software Requirements
* **Node.js**: Version 20 LTS or higher (`node -v` >= 20.0.0).
* **Git**: Installed on the machine (`git -v`).
* **Web Browser**: Microsoft Edge (preinstalled on Windows 10/11) or Google Chrome.
* **Cloud Services**:
  * **Supabase Account**: Free tier is more than sufficient for 800 books and 300 students.
  * **Brevo (formerly Sendinblue) or Resend**: For transactional emails (free tier allows 300 emails/day, plenty for daily library circulation).

---

## 3. Step 1: Repository Cloning & Local Configuration

Open **PowerShell** or **Command Prompt** on the target library workstation:

```powershell
# 1. Clone the repository
git clone https://github.com/M-Sanjay-IND/iventor-client.git
cd iventor-client

# 2. Install production dependencies
npm install

# 3. Create your production environment configuration file
copy .env.example .env
```

Edit `.env` using Notepad or VS Code and set your credentials:

```ini
# Supabase Project Credentials
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...your_supabase_anon_key

# Library Circulation Policies
VITE_COUNTER_DUE_DAYS=14
VITE_COUNTER_EMAIL_DOMAIN=college.edu
```

---

## 4. Step 2: Backend & Database Setup (Supabase)

### A. Apply Database Migrations
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project -> **SQL Editor**.
3. Sequentially execute the migration scripts located in `supabase/migrations/`:
   * `001_initial_schema.sql` (Creates core tables: `inventory_items`, `inventory_copies`, `transactions`, `qr_codes`, `terminal_sessions`).
   * `002_rls_policies.sql` (Enforces Row Level Security and RPC functions).
   * `003_storage_setup.sql` (Configures the `qr-codes` storage bucket).
   * `004_bulk_operations.sql` (Enables high-throughput bulk onboarding).
   * `005_audit_and_overrides.sql` (Adds admin overrides and financial valuation audit logs).

### B. Configure Transactional Email Edge Function
To send digital borrow/return receipts and student OTPs:
1. In Supabase Dashboard, navigate to **Project Settings -> Secrets**.
2. Add your secrets:
   * `BREVO_API_KEY`: Your API key from [Brevo.com](https://app.brevo.com/settings/keys/api).
   * `FROM_EMAIL`: Your verified department email address (e.g., `library@college.edu`).
3. Deploy the Edge Function using Supabase CLI:
   ```bash
   supabase functions deploy send-email --no-verify-jwt
   ```

---

## 5. Step 3: Initial Catalog & Inventory Onboarding

To onboard the department's 700–800 books without manual data entry:

1. Prepare your book list in Excel (`.xlsx`) or CSV with the following headers:
   * `title` (Book Title)
   * `author` (Author / Editor)
   * `category` (e.g., Computer Science, Mathematics, Mechanical, Electronics)
   * `quantity` (Number of physical copies in the library)
   * `location` (Shelf / Cupboard / Rack identifier, e.g., `Rack B-04`)
   * `unit_value` (Book price in INR / USD for replacement valuation)
   * `isbn` (Optional ISBN-10 / ISBN-13 number)

2. Open the Admin Console at `http://localhost:5173/admin/inventory`.
3. Click **"Bulk Import Spreadsheet"**.
4. Drag and drop your `.xlsx` file.
5. The unified importer will:
   * Auto-create all Catalog Items.
   * Auto-assign Categories and Storage Locations.
   * Generate individual copy records (`Copy #1`, `Copy #2`, etc.).
   * Auto-mint unique QR code identifiers (`BK-CS-001-C1`, etc.).

---

## 6. Step 4: QR Code Sticker Generation & Physical Labeling

1. Navigate to **Admin Console -> QR Management** (`/admin/qr`).
2. Click **"Print Sticker Sheet"**.
3. Select your sheet format:
   * **A4 Standard 24-Up Grid** (3 columns x 8 rows).
   * **Compact 30-Up Grid** (3 columns x 10 rows).
4. Each sticker includes:
   * High-contrast vector QR code.
   * Department Name & Book Title.
   * Unique Copy Number & Alphanumeric UID.
5. Load self-adhesive sticker paper into your printer and print.
6. Stick each QR label on the **inside front cover** or **top-right back cover** of the corresponding physical book.

---

## 7. Step 5: Workstation Hardening & Kiosk Lockdown

### Why Avoid Windows "Dedicated Kiosk Account" (Assigned Access)?
* **Windows Edition Lock**: Assigned Access is disabled on Windows Home and requires complex Group Policy configs on Windows Pro/Enterprise.
* **Maintenance Headaches**: Switching between Kiosk and Admin mode requires logging out, restarting, or entering complex administrator key combos.
* **Driver Complications**: Windows Assigned Access frequently interrupts USB/Bluetooth barcode scanner HID drivers.

### The Superior Alternative: Microsoft Edge Fullscreen Kiosk Launcher
Microsoft Edge (built on Chromium) is preinstalled on **every** Windows 10 and 11 PC. It features a native kiosk engine that strips the address bar, navigation tabs, download shelf, dev tools, and right-click menus without creating extra Windows accounts.

#### How to Set Up:
1. Open the `scripts/` folder in the project.
2. Run `scripts/setup-autostart-kiosk.bat` as Administrator.
   * This automatically registers a Windows Startup shortcut.
   * Whenever the library workstation boots up, it launches directly into the fullscreen Counter Terminal at `http://localhost:5173/counter` (or your production URL).
3. (Optional) Run `scripts/toggle-taskmgr-lock.bat`:
   * Select Option `[1]` to lock Task Manager (`Ctrl+Alt+Del -> Task Manager` will be disabled for students).
   * Select Option `[2]` anytime staff needs to perform system maintenance.

#### React-Level Kiosk Guard (Already Built-in)
The counter terminal interface automatically blocks:
* `F12` (Developer Tools)
* `Ctrl + Shift + I` / `Ctrl + Shift + J` / `Ctrl + Shift + C` (Element Inspector)
* `Ctrl + U` (View Source)
* `Ctrl + P` (Print Dialog)
* `Ctrl + S` (Save HTML)
* `F5` / `Ctrl + R` (Accidental page reload)
* Right-click Context Menu

---

### Workstation Topologies: 3 Supported Counter Setups

Because iVentor strictly decouples the `/counter` kiosk route from the authenticated `/admin` console and synchronizes live data via Supabase Cloud, **all three physical setups below work out-of-the-box with zero code changes**:

```
+-------------------------------------------------------------------------------------------------------+
|                                    CHOOSE YOUR COUNTER SETUP                                          |
+------------------------------------+----------------------------------+-------------------------------+
| Setup 1: Single PC (Role-Switched) | Setup 2: Dual-Monitor on 1 PC    | Setup 3: Dedicated Kiosk +    |
|                                    |                                  | Remote Laptop / Mobile        |
+------------------------------------+----------------------------------+-------------------------------+
| - 1 PC Tower / Laptop              | - 1 PC Tower with 2 Video Ports  | - 1 Counter PC (Student only) |
| - 1 Monitor                        | - 2 Monitors (Student + Staff)   | - 1 Staff Laptop / Phone      |
| - 1 USB Scanner                    | - 1 USB Scanner                  | - 1 USB Scanner               |
| - Zero extra hardware cost         | - Simultaneous student & staff   | - Maximum physical security   |
+------------------------------------+----------------------------------+-------------------------------+
```

#### Setup 1: Single PC (Role-Switched / Single Monitor)
* **Best for:** Departments with only one computer and one monitor on the counter desk.
* **Physical Hardware:** 1 PC, 1 Monitor, 1 Handheld Barcode/QR Scanner.
* **Step-by-Step Implementation:**
  1. Place the PC and monitor on the library counter with the scanner accessible to students.
  2. Set your production Vercel link in `scripts/launch-kiosk-edge.bat`:
     ```cmd
     SET TARGET_URL=https://your-domain.vercel.app/counter
     ```
  3. Run `scripts/setup-autostart-kiosk.bat` so the machine launches directly into your Vercel counter on boot.
  4. Run `scripts/toggle-taskmgr-lock.bat` and select `[1]` to disable Task Manager tampering.
  5. **During Circulation Hours:** The PC stays locked in fullscreen `/counter`. Students enter email, receive OTP, scan books, and receive receipts.
  6. **When Librarian Needs Admin Access:** Click **"Admin Console"** at the top right (or press `Alt + F4`).
     * When `Alt + F4` is pressed, the script prompts for the **Staff PIN** (`8821`). The librarian types `8821` to exit to Windows, or logs in directly at `/admin` within the browser.
     * If a student presses `Alt + F4`, they cannot guess the PIN, and the kiosk automatically relaunches back to fullscreen!
  7. **Return to Student Mode:** Click **"Launch Counter Terminal"** in the admin header. The PC returns to the locked student kiosk.
* **Security Check:** Even if a student tries navigating to `/admin`, Supabase authentication blocks them with an admin login wall.

#### Setup 2: Dual-Monitor on Single PC (The Bank / Circulation Counter Model)
* **Best for:** Departments with a desktop PC that has two video outputs (e.g. HDMI + VGA/DisplayPort) and a spare monitor.
* **Physical Hardware:** 1 PC, 2 Monitors, 1 Handheld Barcode/QR Scanner.
* **Step-by-Step Implementation:**
  1. Position **Monitor 1** facing the librarian behind the desk.
  2. Position **Monitor 2** facing outward toward the student counter.
  3. Plug both monitors into the PC. In Windows:
     * Right-click Desktop -> **Display Settings**.
     * Under "Multiple displays", select **"Extend these displays"** (do NOT choose duplicate).
  4. Plug the handheld barcode scanner into the PC and position it next to Monitor 2.
  5. **On Monitor 1 (Staff Screen):** Open a normal browser window (Edge or Chrome) and navigate to `http://localhost:5173/admin`. Log in as Librarian.
  6. **On Monitor 2 (Student Screen):** Launch the fullscreen kiosk window:
     ```cmd
     start msedge.exe --kiosk http://localhost:5173/counter --edge-kiosk-type=fullscreen --no-first-run
     ```
     (Drag the kiosk window to Monitor 2 if needed).
  7. **Daily Workflow:** Students scan and borrow books independently on Monitor 2, while the librarian catalogs new arrivals, audits overdue loans, or prints stickers on Monitor 1 simultaneously.

#### Setup 3: Dedicated Counter PC + Remote Admin on Librarian Laptop / Mobile
* **Best for:** Departments that want complete physical isolation between student checkout and administrative controls.
* **Physical Hardware:** 1 Counter PC (dedicated to students), 1 Librarian Laptop/Tablet/Smartphone.
* **Step-by-Step Implementation:**
  1. Place the Counter PC on the circulation desk. Plug in the handheld optical scanner.
  2. Configure the Counter PC with `scripts/setup-autostart-kiosk.bat` and `scripts/toggle-taskmgr-lock.bat`.
  3. The Counter PC boots straight into `/counter` and runs in locked kiosk mode 24/7. Students never see desktop icons, address bars, or admin controls.
  4. The librarian connects their personal or department laptop/smartphone to the college Wi-Fi.
  5. The librarian navigates to your production domain (e.g. `https://dept-library.vercel.app/admin`) and logs in.
  6. **Remote Control Capabilities:**
     * The librarian can click **"Open Terminal Session"** or **"Close Terminal Session"** from their laptop, and the Counter PC on the desk locks or unlocks in real time.
     * Every book scanned by a student appears in real-time on the librarian's laptop dashboard.
     * High security: Students never see the librarian entering administrator credentials on the counter PC.

---

## 8. Step 6: Hardware Barcode/QR Scanner Security Configuration

### A. Set Scanner to USB HID Mode with Enter Suffix
Most 2D optical barcode scanners ship with a quick configuration manual containing barcodes. Scan the following setup codes from your scanner's manual:
1. **Restore Factory Defaults**
2. **USB HID Keyboard Mode**
3. **Add Suffix: Carriage Return / Line Feed (CR/LF / Enter)**

### B. How the Timing Guard Protects Inventory
* **Optical Scanner Input**: Scanners blast an entire 12-character barcode in $<100\text{ms}$ ($<15\text{ms}$ between keystrokes).
* **Manual Keyboard Input**: A human typing requires $100\text{ms}$ to $300\text{ms}$ per character.
* **The Guard**: If someone attempts to manually type a code on the keyboard, the system detects an average keystroke interval $>70\text{ms}$ and **rejects the entry immediately**.
* **Pasting**: Right-click paste and `Ctrl+V` are completely disabled on scan inputs.
* **Staff Override with PIN Protection**: If a physical sticker is torn or scratched, the librarian can click **"Staff Override"** at the top right of the scan box. A modal prompts for the **4-digit Staff PIN** (default: `8821`, configurable via `VITE_STAFF_PIN`). Students cannot bypass the scanner because they do not know the PIN. Once authenticated, manual entry is temporarily enabled, and auto-relocks afterwards.

---

## 9. Step 7: Production Hosting & Network Deployment

You have two primary deployment topologies:

### Topology A: Cloud Hosted (Recommended)
1. **Frontend**: Deploy `iventor-client` on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) connected to your GitHub repository.
2. **Environment Variables**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project settings.
3. **Kiosk Target**: In `scripts/launch-kiosk-edge.bat`, update the target URL:
   ```cmd
   SET TARGET_URL=https://dept-library.vercel.app/counter
   ```

### Topology B: Local Station Server (Completely Offline Intranet)
If you prefer running purely on the local college intranet:
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Serve using a lightweight HTTP server (e.g., `serve`):
   ```bash
   npm install -g serve
   serve -s dist -l 5173
   ```
3. Use PM2 or Windows Task Scheduler to run `serve` on workstation startup.

---

## 10. Step 8: Daily Operational Procedures & Librarian Runbook

### Morning Opening Routine (1 Minute)
1. Turn on the Library Counter PC.
2. The computer automatically launches into the iVentor Counter Terminal in fullscreen kiosk mode.
3. The librarian logs in to the Admin Console on a secondary tab or phone/laptop (`/admin`).
4. Click **"Open Terminal Session"** (this activates circulation for the day).

### Student Borrow Flow (Self-Service or Librarian-Assisted)
1. Student enters their college email (e.g., `sanjay@college.edu`).
2. A 6-digit OTP is delivered to the student's email inbox within 2 seconds.
3. Student enters the OTP on screen.
4. Student selects **"Borrow Books"**.
5. Student points the handheld scanner at the book's QR code.
6. The book name, copy number, and stock status are added to the live cart.
7. Click **"Confirm Borrow"**.
8. Both the screen displays a receipt and an itemized digital receipt email is dispatched to the student with the due date.

### Student Return Flow
1. Student enters email and OTP.
2. Student selects **"Return Books"**.
3. A checklist of **"Currently Borrowed Items"** is shown.
4. Student scans the physical book QR code.
5. The system confirms the physical copy matches the active loan and turns green.
6. Click **"Confirm Return"**. Book is returned to stock immediately.

### Evening Closing Routine
1. Go to **Admin Console -> Terminal Management**.
2. Click **"Close Terminal Session"**. (The public counter locks immediately, preventing after-hours checkout).
3. Click **"Reports -> Export Daily Ledger"** to download the day's borrow/return activity spreadsheet (`.xlsx`).

---

## 11. Troubleshooting & Maintenance FAQ

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **Scanner beeps but does not add item** | Scanner is not sending `Enter` key after barcode | Scan the "Add CR/LF Suffix" barcode in the scanner's user manual. |
| **"Manual keyboard typing blocked" error** | Inter-keystroke timing exceeded 70ms | Ensure you are scanning with the optical reader. For damaged codes, click "Staff Override". |
| **Student did not receive OTP email** | Brevo API key missing or spam filter | Check Brevo dashboard logs. Librarian can also view active OTP code in the terminal logs. |
| **How to exit Kiosk Mode for maintenance?** | Kiosk is locked fullscreen | Press `Alt + F4` or use the "Admin Console" button at the top right. |
| **Workstation restarted unexpectedly** | Power outage | Upon reboot, Edge Kiosk auto-starts via `shell:startup`. Terminal resumes normal state. |

---

*Manual prepared for College Department Library Deployments. Certified for production readiness.*
