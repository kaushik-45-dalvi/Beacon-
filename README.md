# BEACON | Instant SSL Certificate Checker & Expiry Monitor

Beacon is a modern, premium web application built to monitor SSL/TLS certificate chains, verify installation accuracy, analyze security configurations (like HSTS and OCSP), and configure automated expiration alerts across multiple communication channels (Email, Slack, Webhooks).

---

## 🚀 Key Features

* **Instant SSL Check**: Query any domain to fetch the leaf, intermediate, and root certificate details in under 2 seconds.
* **Live TLS Handshakes**: Connects directly to port `443` on the target host to run real audits instead of relying solely on cached log files.
* **Certificate Chain Graph**: Visual interactive rendering of the certificate authority hierarchy (Root → Intermediate → Leaf).
* **Security & Compatibility**: Analyzes key sizes (RSA/ECDSA), signature algorithms, and checks for HSTS headers.
* **Monitoring Dashboard**: Authenticated user dashboard to save and monitor domains concurrently. Includes a fast batch check tool with CSV exports.
* **Automated Expiry Alerts**: Background cron scanner checks monitored domains daily and sends alert updates 30, 14, 7, and 1 day(s) before expiration.
* **Flexible Integrations**: Supports Email alerts, Slack webhooks, and generic JSON payload custom webhook posts.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, TypeScript, Vite, Custom HSL-tailored CSS layout, Lucide Icons
* **Authentication**: Clerk React SDK
* **Database & Serverless**: Supabase Database (`monitored_domains` table) and Deno-based Supabase Edge Functions:
  - `check-domain`: Server-side Node.js `tls` proxy socket connect and parser.
  - `check-certs-cron`: Daily scheduler that monitors certificate state updates and dispatches notifications.
* **Styling & Aesthetics**: Pure CSS styled with premium dark modes, glassmorphism layers, neon accents, and smooth micro-animations.

---

## 💻 Getting Started

### Prerequisites
1. Install [Node.js](https://nodejs.org) (v18+ recommended).
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli) to run or deploy Edge Functions.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kaushik-45-dalvi/Beacon-.git
   cd Beacon-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure local environment (`.env.local`):
   Create a `.env.local` file in the root directory and add:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deploying Supabase Backend & Functions

1. **Database Schema Setup**:
   Execute the migration SQL schema in your Supabase SQL editor (located in `supabase/migrations/schema.sql`).

2. **Deploying Edge Functions**:
   Login to the Supabase CLI and deploy:
   ```bash
   supabase login
   supabase functions deploy check-domain --project-ref <your-project-ref>
   supabase functions deploy check-certs-cron --project-ref <your-project-ref>
   ```

3. **Deploying Cron Daily Scan**:
   Set up standard pg_cron scheduling inside Supabase PostgreSQL database to run the alert function daily:
   ```sql
   select cron.schedule(
     'daily-cert-check',
     '0 0 * * *', -- Everyday at midnight
     $$ select net.http_post(
          url:='https://<your-project-ref>.supabase.co/functions/v1/check-certs-cron',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <your-anon-key>"}'::jsonb
        ); $$
   );
   ```

---

## 📄 License
This project is open-source and available under the MIT License.
