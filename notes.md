# EquipSure Project Notes

## Current MVP

The halfway-review version currently includes:

- React/Vite frontend
- Login and JWT authentication
- Dashboard with equipment statistics and department summaries
- Equipment inventory listing and management
- Department data
- PostgreSQL database schema and seed data
- Core Express API and local development startup
- Basic shared layout, navigation, toast messages, and role-aware access

The MVP is intentionally reduced for review while keeping the foundational database, authentication, dashboard, and equipment workflows.

## Complete Project Scope

The full EquipSure project also includes the following modules, temporarily excluded from the review commit:

- Preventive maintenance and PPM checklists
- Calibration and metrology management
- Warranty and service contract tracking
- Service and breakdown requests
- Utilization tracking and analytics
- Compliance reports and CSV exports
- Staff and user directory management
- Notification drawer and notification API
- Redis caching and event publishing
- Docker and Docker Compose deployment files

These files remain available locally and can be restored for the complete project after the halfway review by removing the temporary entries from `.gitignore` and adding the files back to Git.
