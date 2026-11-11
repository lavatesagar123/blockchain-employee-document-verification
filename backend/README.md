# TrustDoc — Employee Panel Backend (Django REST Framework + MySQL)

Backend REST API powering the **Employee Panel** of the TrustDoc Blockchain Employee Document Verification System.

---

## 1. Architecture & Directory Layout

```text
backend/
├── manage.py
├── requirements.txt
├── .env.example
├── config/
│   ├── settings.py          # Environment-driven Django, DRF, SimpleJWT, CORS & MySQL config
│   └── urls.py              # Root API routing
└── apps/
    ├── accounts/            # Custom User model, JWT auth, RBAC permissions, AuthService
    ├── employees/           # Company & EmployeeProfile models, registration, profile APIs
    ├── hr/                  # HRProfile, Company registration/profiles, workforce directory, HR stats
    └── documents/           # IssuedDocument, DocumentAuditLog, issuance, revocation, multi-page QR PDFs
```

---

## 2. Prerequisites

- Python 3.10+ (tested on Python 3.11.9)
- MySQL Server 8.0+
- `pip`

---

## 3. Environment Setup

1. Create and activate a virtual environment (optional if packages are already installed globally):
   ```bash
   cd backend
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `backend/.env` with your MySQL database credentials:
   ```env
   DJANGO_SECRET_KEY=your-strong-random-secret
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

   DB_ENGINE=django.db.backends.mysql
   DB_NAME=trustdoc_db
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_HOST=127.0.0.1
   DB_PORT=3306

   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

---

## 4. MySQL Database Initialization & Migrations

Create the database in MySQL if it does not already exist:

```sql
CREATE DATABASE IF NOT EXISTS trustdoc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run Django migrations:

```bash
python manage.py migrate
```

Optionally create a Super Admin account:

```bash
python manage.py createsuperuser
```

Start the API server:

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 5. Employee Panel API Endpoints

### Authentication & Authorization (`/api/auth/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Public | Authenticate via `email` or `employee_id`, returns JWT `{ access, refresh, token, user }` |
| `POST` | `/api/auth/logout/` | Authenticated | Blacklists supplied refresh token (`204 No Content`) |
| `POST` | `/api/auth/refresh/` | Public | Refreshes JWT access token |
| `GET` | `/api/auth/me/` | Authenticated | Returns current user and role profile |

### Employee Profile Management (`/api/employees/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/employees/register/` | Public | Creates `User` (`role='employee'`) and `EmployeeProfile` atomically |
| `GET` | `/api/employees/me/` | Employee Role | Retrieves authenticated employee profile details |
| `PATCH` / `PUT` | `/api/employees/me/` | Employee Role | Updates editable profile fields (`name`, `phone`, `designation`, `department`, `location`, `bio`, `linkedin_url`) |

### Issued Documents, Issuance, Revocation & Secure Downloads (`/api/employee/documents/` & `/api/documents/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employee/documents/` | Employee Role | Lists documents belonging strictly to the authenticated employee (`?type=`, `?status=`, `?search=`) |
| `GET` | `/api/employee/documents/{id}/` | Owner / HR / Admin | Inspects full document metadata and logs a `viewed` audit entry |
| `GET` | `/api/employee/documents/{id}/download/` | Owner / HR / Admin | Authenticated, ownership-verified PDF download (`Content-Disposition: attachment`) |
| `GET` | `/api/documents/` | Approved HR Role | Lists company issued documents (`?type=`, `?status=`, `?search=`) |
| `POST` | `/api/documents/` | Approved HR Role | Issues Offer/LOI/Experience/Relieving letters with custom descriptions, QR URL, SHA-256 & multi-page PDF |
| `GET` | `/api/documents/{id}/` | Owner / Issuing HR / Admin | Shared alias for document inspection |
| `GET` | `/api/documents/{id}/download/` | Owner / Issuing HR / Admin | Streams stored file or dynamically generated multi-page QR PDF certificate |
| `POST` | `/api/documents/{id}/revoke/` | Approved Issuing HR | Revokes an issued document with mandatory audit reason |

### HR & Company Management (`/api/companies/` & `/api/hr/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/companies/register/` | Public | Multipart/JSON organization registration + primary HR admin (starts `pending`) |
| `GET` | `/api/companies/status/?query=` | Public | Checks registration audit status by CIN, ID, or tracking ref |
| `GET` / `PATCH` | `/api/companies/me/` | HR Role | Views or updates HR's organization profile |
| `GET` / `PATCH` | `/api/hr/profile/` | HR Role | Views or updates HR administrator's personal profile |
| `GET` | `/api/hr/dashboard/stats/` | HR Role | Returns real database metrics (`total_employees`, `total_documents`, `verified_documents`, `revoked_documents`, `recent_documents`) |
| `GET` / `POST` | `/api/hr/employees/` | Approved HR Role | Searches, filters (`?department=`, `?search=`, `?employment_type=`, `?status=`), and onboards company employees |
| `GET` / `PATCH` / `DELETE` | `/api/hr/employees/{id}/` | Approved HR Role | Inspects, updates, or suspends a company employee |

---

## 6. Running Automated Tests

With MySQL configured and running:

```bash
python manage.py test -v 2
```

For isolated in-memory test execution without a running MySQL server:

```powershell
$env:DB_ENGINE="django.db.backends.sqlite3"
$env:DB_NAME=":memory:"
python manage.py test -v 2
```
