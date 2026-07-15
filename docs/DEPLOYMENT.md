# Deployment Guide

Inventor Client is designed to be easily self-hosted. The application consists of two main pieces:
1. **Frontend:** A React + Vite SPA (Single Page Application)
2. **Backend:** Supabase (Database, Auth, Storage)

## Prerequisites

- A GitHub account.
- A free [Vercel](https://vercel.com) account for frontend hosting.
- A free [Supabase](https://supabase.com) account for the backend.

## Step 1: Set up the Backend (Supabase)

1. Create a new project in Supabase.
2. Go to **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `supabase/migrations/001_auth_foundation.sql` file and run it. This will create the necessary tables, roles, and Row Level Security (RLS) policies.
4. Go to **Project Settings > API** and copy your `Project URL` and `anon public` key. You will need these for the frontend.

## Step 2: Set up the Frontend (Vercel)

1. Fork this repository to your GitHub account.
2. Log into Vercel and click **Add New > Project**.
3. Import your forked repository.
4. Open the **Environment Variables** section and add the following keys:
   - `VITE_SUPABASE_URL`: (Paste your Supabase Project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Paste your Supabase anon key)
5. Click **Deploy**.

## Step 3: Create your First Admin Account

By default, the application is locked down. To log into the Admin Dashboard, you need an admin profile.

1. Go to your Supabase Dashboard -> **Authentication** -> **Add User** -> **Create New User**.
2. Enter your email and a secure password.
3. Go to the **Table Editor** -> `admin_profiles` table.
4. Add a new row. Set the `user_id` to the ID of the user you just created.
5. Go to your Vercel deployment URL and log in with your email and password.

---

*(Note: Docker Compose setup for fully local environments is planned for a future release).*
