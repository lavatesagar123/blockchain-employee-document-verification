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
    └── documents/           # IssuedDocument, DocumentAuditLog, ownership checks, secure PDF downloads
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

### Issued Documents & Secure Downloads (`/api/employee/documents/` & `/api/documents/`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employee/documents/` | Employee Role | Lists documents belonging strictly to the authenticated employee (`?type=`, `?status=`, `?search=`) |
| `GET` | `/api/employee/documents/{id}/` | Owner / HR / Admin | Inspects full document metadata and logs a `viewed` audit entry |
| `GET` | `/api/documents/{id}/` | Owner / HR / Admin | Shared alias for document inspection |
| `GET` | `/api/employee/documents/{id}/download/` | Owner / HR / Admin | Authenticated, ownership-verified PDF download (`Content-Disposition: attachment`) with path-traversal protection and `downloaded` audit log |
| `GET` | `/api/documents/{id}/download/` | Owner / HR / Admin | Shared alias for secure document download |

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
