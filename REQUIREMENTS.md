# Project Installation & Requirements Guide

This file provides system requirements, package dependencies, environment configuration, and instructions to install all packages and run the **Support Studio Technologies (SST) Website** project.

---

## 💻 System Prerequisites

Before installing the packages, make sure you have the following installed on your machine:

| Prerequisite | Recommended Version | Verify Command |
| :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x` (LTS) | `node -v` |
| **npm** | `v10.x` or higher | `npm -v` |
| **Git** | `v2.x` or higher | `git --version` |

---

## 🛠️ Step-by-Step Package Installation

To install all required packages defined in `package.json`, follow these commands:

### 1. Clone & Navigate to Project Directory
Navigate to the root directory where the project is located:
```bash
cd "d:\SST job\sst_website_current_anti"
```

### 2. Install Project Dependencies
Run the standard package installer:
```bash
npm install
```

> [!TIP]
> **React 19 Compatibility & Peer Dependencies:**
> Since this project uses **Next.js 15** and **React 19**, some older packages (such as UI/styling libraries) may trigger strict version flags. If you encounter peer dependency errors during installation, run:
> ```bash
> npm install --legacy-peer-deps
> ```

---

## 📦 Key Dependencies List

Here is an overview of the primary packages configured for this project:

### Development & UI Core
* **Next.js** (`15.5.0`): The core React framework with server-side rendering and static site generation.
* **React** & **React DOM** (`19.1.0`): The UI base rendering engine.

### styling, Themes & Icons
* **Tailwind CSS** (`v4`): Utility-first CSS framework for custom, high-fidelity responsive layouts.
* **MUI Material** (`^7.3.4`): Component library providing pre-styled material design UI elements.
* **Emotion** (`@emotion/react`, `@emotion/styled`): Underlying peer dependency engine for MUI styles.
* **Lucide React** & **React Icons**: Icon packs for UI illustrations and control flows.
* **Framer Motion** (`^12.23.12`): Production-ready visual animation library for fluid transitions.
* **Swiper** (`^12.2.0`): Touch-enabled carousel system for sliders and testimonials grids.

### Localization & Integrations
* **i18next** & **React-i18next**: Multi-language translation routing and interpolation.
* **Locize** (CLI / backend): Dynamic translation management and sync service.
* **React Calendly** (`^4.4.0`): Synchronized embeds for scheduling call/integrations.

### Database, Network & Utilities
* **Supabase Client** (`@supabase/supabase-js`): Relational PostgreSQL client engine & user interactions tracking.
* **SWR** (`^2.4.2`): Lightweight React Hook library for data fetching, caching, and revalidation.
* **Nodemailer** (`^7.0.9`): Backend mail delivery utility.
* **MongoDB** (`^7.3.0`): Legacy database connection options.

---

## ⚙️ Environment Configuration

The application requires a `.env` file at the root level. Create a `.env` file and populate it with the following configuration schemas:

```env
# Environment Level
WORKSPACE360=dev

# Database Configuration (Development - Local)
DB_HOST=localhost:27017/
DB_NAME=BMS

# Database Configuration (Production / Staging)
# WORKSPACE360=prod
# DB_HOST=192.168.0.20:27017/
# DB_USER=admin
# DB_PASSWORD=ssT@2024
# DB_NAME=BMS

# SMTP Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Calendly Scheduling Integration
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/<yourcalendly_link>

# Supabase PostgreSQL Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🚀 Running the Application

Once installation is complete, use the following control scripts defined in `package.json` to operate the application:

| Command | Action | Use Case |
| :--- | :--- | :--- |
| `npm run dev` | Runs the Next.js development server | Local development with Hot Module Replacement status. |
| `npm run build` | Compiles the production application bundle | Validating build structures and code compilation before deployment. |
| `npm run start` | Boots the compiled production code | Running the optimized app in production servers. |
| `npm run lint` | Analyzes code for stylistic and linting issues | Ensuring code purity and catching errors early. |
