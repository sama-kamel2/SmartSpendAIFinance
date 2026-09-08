# SmartSpend AI

Intelligent personal finance manager with AI-powered spending predictions, anomaly detection, budget recommendations, and a multilingual interface.

![Tech Stack](https://img.shields.io/badge/React-18-61dafb) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![Supabase](https://img.shields.io/badge/Supabase-3ecf8e) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## Features

### AI-Powered Insights
- **Spending Prediction** — Forecasts next month's expenses using linear regression on your transaction history.
- **Expense Forecasting** — Visual line-chart projection of future spending trends.
- **Anomaly Detection** — Flags transactions that are unusually high for their category using z-score analysis.
- **Behavior Analysis** — Detects spending patterns and month-over-month changes by category.
- **Smart Budget Recommendations** — Suggests budget limits at 90% of your 3-month average to encourage savings.
- **Personalized Saving Tips** — Generates actionable tips based on your top spending categories.
- **AI Monthly Summary** — Auto-generated narrative report of your monthly financial activity.
- **AI Financial Assistant** — A chatbot that answers natural-language questions about your spending, budget, and savings.

### Personalized Setup Wizard
After creating an account, users are guided through a setup wizard that collects financial information based on their profile type:

| Profile | Intended User | Key Inputs |
|---|---|---|
| **Student** | Students managing allowance, scholarships, or part-time income | Monthly allowance, scholarship income, part-time income, fixed/daily expenses, budget, savings goal |
| **Employee** | Salaried employees with fixed monthly income | Monthly salary, additional income, fixed bills, transport, daily expenses, budget, savings goal |
| **Freelancer** | Freelancers with variable project-based income | Average monthly income, project income, client payments, business/personal expenses, budget, savings goal |
| **Business Owner** | Entrepreneurs and small business owners | Business revenue, business expenses, employee salaries, operating costs, personal income, budget, profit target |

This data is securely stored and used to customize the dashboard and power AI insights.

### Core Functionality
- **Dashboard** — At-a-glance overview with balance, income, expenses, savings, spending distribution pie chart, income vs. expense area chart, AI quick insights, spending prediction, recent transactions, and anomaly alerts.
- **Transactions** — Full CRUD for income and expense entries with search, type filters, month filters, auto-category classification from notes, and payment method tracking.
- **Budgets** — Set monthly category budgets with progress bars, over-limit warnings, and one-click AI recommendations.
- **Reports** — Visualize financial data across daily, weekly, monthly, and yearly periods with pie charts (expense distribution, income sources) and bar charts (period expenses) plus a monthly income vs. expense comparison.
- **Settings** — Manage display name, theme (light/dark), currency, language, notification preferences, password, and custom transaction categories.

### Multilingual Support
The entire interface is available in **4 languages** with full RTL (right-to-left) layout support:

| Language | Native | RTL |
|---|---|---|
| English | English | No |
| Arabic | العربية | Yes |
| Spanish | Español | No |
| French | Français | No |

Users can switch languages from the top bar, welcome page, login page, or settings. The preference is saved per user.

### Design
- Clean, modern UI with a green/teal brand palette.
- Light and dark themes with system-wide toggle.
- Responsive layout from mobile to desktop.
- Smooth animations and micro-interactions.
- 8px spacing system with consistent visual hierarchy.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Backend / Auth / DB | Supabase (PostgreSQL) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/smartspend-ai.git
cd smartspend-ai

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database Setup

The Supabase migrations are in `supabase/migrations/`. Apply them in order:

1. `20260729230518_create_smartspend_schema.sql` — Creates the core schema (profiles, categories, transactions, budgets) with RLS policies.
2. `20260729231549_add_language_to_profiles.sql` — Adds the `language` column to profiles.
3. `20260729232656_add_profile_type_and_wizard.sql` — Adds `profile_type`, `setup_completed`, and `wizard_data` columns for the setup wizard.

### Running the App

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

---

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Sidebar navigation + top bar (theme & language switchers)
│   └── ui.tsx              # Reusable UI components (StatCard, SectionCard, Modal, EmptyState)
├── context/
│   ├── AuthContext.tsx     # Supabase auth, profile loading, setup wizard completion
│   └── SettingsContext.tsx # Theme, currency, language state with persistence
├── lib/
│   ├── ai.ts               # AI logic: prediction, forecasting, anomalies, chatbot, tips
│   ├── format.ts           # Currency formatting, date helpers, month utilities
│   ├── i18n.ts             # Translation dictionaries for EN, AR, ES, FR
│   ├── supabase.ts         # Supabase client + TypeScript types
│   └── useData.ts           # Data hooks (transactions, budgets, categories CRUD)
├── pages/
│   ├── Welcome.tsx         # Landing page with feature showcase
│   ├── Login.tsx           # Sign in / Sign up
│   ├── SetupWizard.tsx     # Post-registration personalized setup
│   ├── Dashboard.tsx       # Financial overview
│   ├── Transactions.tsx    # Income & expense management
│   ├── Budgets.tsx         # Budget tracking with AI recommendations
│   ├── Reports.tsx         # Visual financial reports
│   ├── AIInsights.tsx      # AI predictions, analysis, chatbot
│   └── Settings.tsx        # User preferences & account management
├── App.tsx                 # Route definitions + auth gating
├── main.tsx                # App entry with providers
└── index.css               # Tailwind + custom styles
```

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `profiles` | User profile: display name, avatar, currency, theme, language, profile type, setup data, notification prefs |
| `categories` | Transaction categories (income/expense) with default and custom entries per user |
| `transactions` | Income and expense records linked to categories with payment method and notes |
| `budgets` | Monthly spending limits per category |

All tables have **Row Level Security (RLS)** enabled with per-user ownership policies (SELECT, INSERT, UPDATE, DELETE).

---

## Authentication

SmartSpend AI uses Supabase email/password authentication:
- New accounts are created via the sign-up form.
- After sign-up, users complete the setup wizard before reaching the dashboard.
- Sessions persist by default; "Remember me" can be toggled off for non-persistent sessions.
- Password changes are supported in Settings.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [Supabase](https://supabase.com/) — Backend, auth, and database
- [Recharts](https://recharts.org/) — Charting library
- [Lucide](https://lucide.dev/) — Icon library
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
