# 🚀 Deployment & Production Hosting Guide (DEPLOYMENT.md)

This guide details how to deploy and self-host Inventor Client in production using **Vercel / Netlify** (frontend) and **Supabase** (database, authentication, storage, and edge functions).

---

## 📑 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Database & Backend Setup (Supabase)](#2-database--backend-setup-supabase)
3. [Storage Bucket Configuration](#3-storage-bucket-configuration)
4. [Edge Function Deployment (Email Notifications)](#4-edge-function-deployment-email-notifications)
5. [Frontend Deployment (Vercel / Netlify)](#5-frontend-deployment-vercel--netlify)
6. [Initial Admin Provisioning](#6-initial-admin-provisioning)
7. [Production Environment Variables Checklist](#7-production-environment-variables-checklist)

---

## 1. Prerequisites
- [Node.js](https://nodejs.org/) >= 20.x and `npm` >= 10.x
- A [Supabase](https://supabase.com) account & project
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account
- (Optional) A [Resend](https://resend.com) API key for production transactional emails

---

## 2. Database & Backend Setup (Supabase)

1. Create a new project in your Supabase dashboard.
2. Open the **SQL Editor** in Supabase and execute the migration files located in `supabase/migrations/` in numerical order:
   - `001_auth_foundation.sql` (Roles, admins, and RLS policies)
   - `002_inventory_schema.sql` (Items, copies, categories, locations)
   - `003_qr_schema.sql` (QR code ledger and storage references)
   - `004_counter_terminal.sql` (Terminal sessions and OTP logic)
   - `005_counter_terminal.sql` (Transactions ledger, item auto-resolution, active loans RPCs)

---

## 3. Storage Bucket Configuration

1. In your Supabase Dashboard, navigate to **Storage**.
2. Create a new public bucket named **`qrcodes`**:
   - Bucket Name: `qrcodes`
   - Public Bucket: **Enabled**
3. Ensure RLS policies allow authenticated administrators to upload/update QR images, and public users to read QR assets.

---

## 4. Edge Function Deployment (Email Notifications)

Deploy the `send-email` Supabase Edge Function to deliver borrow receipts, return confirmations, and due date reminders:

1. Install the Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```
2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-supabase-project-id
   ```
3. Set your email provider secret (e.g. Resend):
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key FROM_EMAIL=noreply@yourdomain.edu
   ```
4. Deploy the function:
   ```bash
   supabase functions deploy send-email
   ```

---

## 5. Frontend Deployment (Vercel / Netlify)

### Deploying to Vercel

1. Fork or push the repository to GitHub.
2. Import the repository into Vercel (**New Project > Import**).
3. Framework Preset: **Vite**.
4. Configure Build & Output:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Add Environment Variables (see checklist below) and click **Deploy**.

---

## 6. Initial Admin Provisioning

To access the Admin Dashboard on a new instance:

1. In Supabase Dashboard, go to **Authentication > Users > Add User > Create User**.
2. Enter your administrator email and password.
3. In **Table Editor > `admin_profiles`**, insert a new row setting `user_id` to the UUID of the newly created auth user.
4. Navigate to your deployment URL (`/login`) and sign in with your credentials.

---

## 7. Production Environment Variables Checklist

| Variable Name | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | **Yes** | Supabase Project API URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase Public Anonymous API Key | `eyJhbGciOi...` |
| `VITE_COUNTER_DUE_DAYS` | Optional | Default borrowing duration in days | `7` |
| `VITE_COUNTER_EMAIL_DOMAIN` | Optional | Restrict borrower emails to domain | `university.edu` |

---

## 8. Verification & Health Check

After deployment, perform the following verification checklist:
- [ ] Admin login succeeds at `/login` and navigates to `/admin`.
- [ ] Counter terminal opens at `/counter` when unlocked by admin.
- [ ] Single-sheet XLSX import successfully uploads sample data at `/admin/inventory`.
- [ ] Sticker sheets render at `/admin/qr/print`.
- [ ] Reports export to CSV and XLSX at `/admin/reports`.
