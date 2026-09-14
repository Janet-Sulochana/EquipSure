# EquipSure – Biomedical Equipment Management System (PERN Stack)

**EquipSure** is a hospital-grade Biomedical Equipment Management System (BEMS / CMMS) designed for clinical engineering teams, healthcare administrators, and hospital nursing staff. It centralizes the complete lifecycle of clinical assets—from procurement, preventive maintenance (PPM), and calibration compliance to service contracts, breakdown work orders, and equipment utilization tracking.

---

## Technical Stack & Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts
- **Backend**: Node.js + Express.js + TypeScript/ESM
- **Database**: PostgreSQL (Relational schema with foreign keys, constraints, triggers & indexes)
- **Caching & Event Bus**: Redis (with automatic graceful in-memory fallback if Redis server is offline)
- **Authentication**: JWT with Role-Based Access Control (RBAC)
- **Containerization**: Docker & Docker Compose (`postgres`, `redis`, `backend`, `frontend`)
- **Version Control**: Git

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 18)                     │
│  Tailwind CSS • Recharts • Context API • Axios Interceptors │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON / Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Node.js + Express)              │
│      JWT Auth & RBAC • Redis Caching • REST Controllers     │
└──────────────┬───────────────────────────────┬──────────────┘
               │ SQL Queries (pg Pool)         │ Cache & PubSub
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   PostgreSQL 16/18 Database  │ │    Redis Cache & Pub/Sub    │
│  (Equipment, PPM, Calib, ...)│ │ (Dashboard Cache, Alerts)  │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## Core Modules & Features

1. **Role-Based Access Control (RBAC)**
   - **Admin**: Full control across equipment, user profiles, compliance audits, system logs, and settings.
   - **Biomedical Engineer**: Manage devices, conduct preventive maintenance, record calibrations, update work orders, track utilization.
   - **Hospital Staff (Doctors/Nurses)**: View department assets, report breakdowns and malfunction tickets, check operational readiness.
   - *1-Click Demo Quick Switcher* included on both the login page and the sidebar for paired review.

2. **Executive Healthcare Dashboard**
   - 6 KPI summary cards: Total Devices, Operational Devices, PPM Due (30d), Calibrations Due, Expiring Warranties, Open Breakdown Tickets.
   - Department Asset Distribution Bar Chart (Operational vs Needs Attention).
   - Device Status Breakdown Donut Chart (Operational, In Maintenance, Under Repair, Needs Calibration, Decommissioned).
   - Priority Clinical Attention list (Tasks requiring immediate action in next 14 days).
   - Live service & repair activity stream.

3. **Equipment Inventory (360° Lifecycle Registry)**
   - Searchable, filterable catalog by category, department, operational status, and criticality.
   - Add/Edit device modal with manufacturer, model, serial number, room, cost, and clinical notes.
   - **360° Device Drawer**: Deep inspection tabs for Specifications, PPM Schedules, Calibration History, Service History, and Utilization Logs.

4. **Preventive Maintenance (PPM)**
   - Recurrence schedules: Monthly, Quarterly, Semi-Annual, Annual.
   - Overdue vs Due Soon tracking.
   - **Interactive Checklist Verification**: Check off tasks (electrical safety, filter cleaning, sensor tests) with engineer notes and automatic next due date calculation.

5. **Calibration & Metrology Management**
   - ISO/IEC standards compliance (e.g., ISO 13485, IEC 60601-1, AAMI DF80, ACR MRI).
   - Tolerance & accuracy drift tracking.
   - Pass/Fail verification (automatically quarantines device if failed).

6. **Warranty & Service Contracts**
   - OEM, Annual Maintenance Contracts (AMC), Comprehensive Maintenance Contracts (CMC), and Extended Warranties.
   - Real-time countdown badges (`Expires in 11 days`, `Expired`, `Active`).
   - Annual maintenance commitment calculator.

7. **Service & Breakdown History (Work Orders)**
   - Clinical incident reporting for hospital staff with priority flags (`Critical - Life Support`, `High`, `Medium`, `Low`).
   - Engineer work order workflow (`Reported` → `Assigned` → `In Progress` → `Resolved` → `Closed`).
   - Spare parts used, repair cost tracking, and downtime hours calculator.
   - Restores equipment back to operational status upon resolution.

8. **Asset Utilization Tracking**
   - Daily operating hours, idle hours, and patient throughput logs.
   - Automatic classification:
     - **Underutilized (< 20% Load)**: Identifies idle capital assets for department reallocation.
     - **High Stress / Overused (> 80% Load)**: Flags fatigue and prevents sudden failures.
     - **Optimal (20% – 80%)**: Normal clinical workload.

9. **Compliance Reports & CSV Export**
   - Dedicated reports for Maintenance Compliance, Calibration Audits, Warranty Commitments, and Utilization.
   - Instant 1-Click CSV Export for all hospital reporting requirements.

10. **Notification & Alert Engine**
    - Notification drawer with unread counter badge.
    - Alerts for overdue maintenance, calibration expirations, warranty renewals, and emergency breakdown tickets.
    - Redis pub/sub integration.

---

## Pre-Configured Demo Accounts

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@equipsure.com` | `Password123!` | Full administrative access across all modules |
| **Biomedical Engineer** | `bme@equipsure.com` | `Password123!` | PPM schedules, calibrations, work orders, utilization |
| **Hospital Staff** | `staff@equipsure.com` | `Password123!` | Department devices, breakdown tickets |

*(Or click the 1-Click Demo buttons on the Login page!)*

---

## Quick Start Guide

### Option A: Running with Docker (Recommended)

Make sure Docker and Docker Compose are installed:

```bash
# 1. Clone or navigate to the project directory
cd equipsure

# 2. Start the entire PERN + Redis stack
docker-compose up --build -d

# 3. Access the application:
# Frontend:  http://localhost:3000
# REST API:  http://localhost:5000/api
```

Docker Compose will provision:
- PostgreSQL 16 on port `5432` with tables pre-migrated and seeded.
- Redis 7 on port `6379`.
- Backend Express API on port `5000`.
- Frontend React (Nginx) on port `3000`.

---

### Option B: Running Locally (Node.js & System PostgreSQL)

#### 1. Backend Setup
```bash
cd backend
npm install

# Configure environment (or use default .env)
# Start the PostgreSQL server on port 5433 (or standard 5432)
npm run build
npm start
# Server will run on http://localhost:5000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend will run on http://localhost:3000
```

---

## REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate and receive JWT | Public |
| `GET` | `/api/auth/me` | Current user profile | Authenticated |
| `GET` | `/api/system/status` | PostgreSQL & Redis healthcheck | Public |
| `GET` | `/api/dashboard/stats` | KPI counters (Cached in Redis) | Authenticated |
| `GET` | `/api/dashboard/departments` | Department readiness distribution | Authenticated |
| `GET` | `/api/dashboard/recent-activity` | Live service timeline | Authenticated |
| `GET` | `/api/dashboard/attention` | Priority tasks in next 14 days | Authenticated |
| `GET` | `/api/equipment` | Search & filter equipment catalog | Authenticated |
| `GET` | `/api/equipment/:id` | 360° detailed equipment record | Authenticated |
| `POST` | `/api/equipment` | Register new equipment | Admin, BME |
| `PUT` | `/api/equipment/:id` | Update equipment details | Admin, BME |
| `DELETE` | `/api/equipment/:id` | Remove equipment | Admin |
| `GET` | `/api/maintenance` | List PPM inspection schedules | Authenticated |
| `POST` | `/api/maintenance` | Create PPM recurrence schedule | Admin, BME |
| `PUT` | `/api/maintenance/:id/complete` | Complete checklist & set next due date | Admin, BME |
| `GET` | `/api/calibrations` | Calibration compliance history | Authenticated |
| `POST` | `/api/calibrations` | Record metrology test results | Admin, BME |
| `GET` | `/api/warranties` | Active warranty & AMC/CMC contracts | Authenticated |
| `POST` | `/api/warranties` | Add or renew warranty contract | Admin, BME |
| `GET` | `/api/service-requests` | List service & breakdown tickets | Authenticated |
| `POST` | `/api/service-requests` | Report equipment malfunction | Any Staff |
| `PUT` | `/api/service-requests/:id` | Resolve ticket, record parts & downtime | Admin, BME |
| `GET` | `/api/utilization` | Device duty-cycle logs | Authenticated |
| `GET` | `/api/utilization/analytics` | Underutilized vs overused analysis | Authenticated |
| `POST` | `/api/utilization` | Log daily operating & idle hours | Admin, BME |
| `GET` | `/api/reports/:type` | Maintenance, calibration, warranty reports | Authenticated |
| `GET` | `/api/reports/export?type=...` | Export reports as CSV | Authenticated |
| `GET` | `/api/notifications` | User alerts & system notifications | Authenticated |
| `PUT` | `/api/notifications/:id/read` | Mark alert as read | Authenticated |
| `PUT` | `/api/notifications/mark-all-read` | Mark all alerts read | Authenticated |

---

## License

MIT License. Designed for hospitals, biomedical engineers, and healthcare IT administrators.
