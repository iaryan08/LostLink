# LostLink 🔍 • Full-Stack Campus Lost & Found System

LostLink is an elegant, full-stack Lost & Found application tailored for college campuses, residential hostels, and student organizations. It introduces safety frameworks, real-time database matching scores, anonymous communication, printable QRs, and administrators safety tools to provide an institutional-grade security framework out of the box.

The architecture of this project is tailored explicitly for **1-2 students as their final final year/semester ITI or Engineering Diploma / Bachelor dissertation project**, allowing them to demonstrate high proficiency in React, TypeScript, database querying, full-stack endpoints, security policies, and mobile responsive UI in under a week.

---

## ⚡ Tech Stack & Architectural Map

- **Frontend:** React (TypeScript) with Tailwind CSS v4 layout engines.
- **Backend Server:** Node.js with Express, tsx routing, and esbuild asset bundling.
- **Local Persistence Store:** `db.json` local file database allowing multi-user simulations directly in sandbox previews.
- **Production Pipeline Standard:** Fully engineered to link with **Vercel** + **Supabase Database & Auth (PostgreSQL)** for free web hosting.
- **Design Paradigm:** Swiss Modern Minimalist featuring a high-contrast slate layout, fluid spacing, and legible monospace code elements.

---

## 🚀 Key Features Built-in

### 1. Unified Search Feed & Multi-Filters
Students can instantly search active listings by inputting title, description, or status keywords. Results can be processed using three simultaneous filters: Category, Location, and Status (Lost/Found/Claimed).

### 2. Database Matching Score Engine
When a student views their item, they can click `Possible Matches`. Our backend executes a matching algorithm, factoring:
- **Category overlap:** Weight = `50 points`
- **Location keyword overlap:** Weight = `15 - 30 points`
- **Title term alignment:** Weight = `10 points per common word`
This produces high-confidence pairs automatically!

### 3. Verification Questionnaire & Claim Safeguards
To claim an item, students must write detailed answers for verification questions (e.g., wallet contents, interior keychains, wallpaper setups). Item creators manually check these descriptions before marking an item as solved.

### 4. Anonymous Mode and Handshake Decoupling
Students can toggle "Anonymous Mode" on their bulletins. This hides their real name and avatar from public feeds. A secure custom 1-to-1 chat is established between participants, and they can click "Reveal Student Identity" only after trust is built.

### 5. Suspicious Flags Moderation
A dedicated flag system is nested directly within user dashboards. If a user receives a fake,duplicate, or extortion-based claim, they can instantly flag it as "Suspicious". This transfers the listing to the administrative audit queue.

### 6. Campus Safe Exchange Coordinates
To discourage students from meeting in secluded environments, LostLink integrates a safe-zones dashboard listing vetted, monitored, and CCTV-protected areas (cafeterias, warden posts, lobbies) for physical exchanges.

### 7. Valuables Printable QR Sticker Generator
Users can generate a custom CSS-drawn QR sticker with unique identifiers to print and attach to laptops, wallets, or books. Scan redirects finder straight to a secure anonymous contact portal.

---

## 📚 Step-by-Step Supabase Setup & Deployment Guide

This workspace is designed to work fully in-memory and persist into `db.json` inside this Cloud Run preview environment. However, when migrating to Vercel and Supabase for your final submission, follow these exact steps:

### Phase A: Setup Supabase Backend
1. Sign up on [Supabase](https://supabase.com) and click **New Project** (Free Tier).
2. Go to the **SQL Editor** in your Supabase Dashboard sidebar.
3. Open the `/supabase-setup.sql` file in this project, copy its entire contents, paste it into the Supabase editor, and click **Run**. This establishes your tables (`profiles`, `items`, `messages`, `claims`, `reports`), locks down Row Level Security (RLS), and sets up automatic profile synchronization triggers!

### Phase B: Deploy to Vercel (Free)
1. Push this project code to a public/private repository on **GitHub**.
2. Create a Free Account on [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Define the following Environment Variables under the project settings configuration panel:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase Project URL (found in Settings -> API).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Anon Public Key.
5. Click **Deploy**. Vercel will bundle your static web bundle, publish it to a custom URL, and synchronize automatically with your Supabase database in real time!

---

## 🛡️Tips 
When presenting this project to external examiners, prepare to answer these core questions:

1. **How is user data protected?**
   - **Answer:** We enforce complete data privacy by routing all communication through our secure internal message tables. We never expose phone numbers or emails publicly, and users can communicate in "Anonymous Mode" until they initiate a mutual identity release trigger.

2. **Can users abuse the platform with fake postings or spam?**
   - **Answer:** We have introduced two safeguards. First, a manual verification questionnaire. Second, a "Report Suspicious Claim" tool that flags malicious claims directly into an administrative queue, enabling moderators to suspend accounts instantly.

3. **How does the matching logic work? Does it use AI?**
   - **Answer:** To prevent slow queries and expensive API charges, we built a lightweight, deterministic, high-speed matching controller in our backend. It computes score matrices based on hierarchical categories, location matches, and split title token matches.

---

## 🖥️ Local Command Line Operations

Run development server locally:
```bash
npm run dev
```

Build full stack assets for optimal web deployment:
```bash
npm run build
```

Clear cached reports and reload local simulation models:
```bash
npm run clean
```

---

*LostLink is fully aligned with academic syllabus requirements representing solid CRUD structures, security best-practices, clean files modularity, and lightweight, high-performance database querying.*
