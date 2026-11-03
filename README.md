# Online Certificate Generator - College Management System

A full-stack web application designed for colleges and universities to manage, issue, and authenticate academic certificates. The system generates print-ready landscape A4 PDF certificates with embedded QR codes for real-time, tamper-evident public verification without exposing sensitive student personal data.

---

## System Architecture & Tech Stack

- **Frontend**: React 18, Vite, JavaScript, HTML5, Plain Modern CSS, Axios, React Router v7, Lucide Icons
- **Backend**: Python 3.12+, Flask REST API, Flask-CORS, Flask-JWT-Extended, python-dotenv
- **Database**: MySQL 8.0 (`online_certificate_db`) with PyMySQL & mysql-connector-python
- **PDF Generation**: ReportLab (High-resolution Landscape A4 with custom ornamental borders & typography)
- **QR Codes**: `qrcode` + Pillow (direct URL to public verification)
- **Spreadsheets / Bulk Processing**: `openpyxl` + Python `csv` (row-by-row validation & error reporting)

---

## Folder Structure

```
online-certificate-generator/
├── backend/
│   ├── config/
│   ├── generated_certificates/     # Generated PDFs, QR codes, and bulk ZIP archives
│   ├── routes/
│   │   ├── auth_routes.py          # Admin JWT login and profile
│   │   ├── certificate_routes.py   # Single & bulk generation, history, PDF/ZIP download, revocation
│   │   ├── dashboard_routes.py     # Analytics & counts
│   │   ├── event_routes.py         # College events CRUD
│   │   ├── student_routes.py       # Student registry CRUD & search/filter
│   │   ├── template_routes.py      # 7 credential templates & logo/signature upload
│   │   └── verify_routes.py        # Public credential verification (no auth)
│   ├── services/
│   │   ├── excel_service.py        # Spreadsheet parser, row validator, and sample generator
│   │   ├── pdf_service.py          # ReportLab landscape A4 certificate engine
│   │   └── qr_service.py           # QR code generation
│   ├── uploads/                    # Uploaded institutional logos & authority signatures
│   ├── app.py                      # Flask application entry point (Port 5000)
│   ├── config.py                   # Configuration & environment variables loader
│   ├── database.py                 # MySQL database connection & query execution
│   ├── requirements.txt            # Python dependencies
│   ├── seed_admin.py               # Interactive CLI to seed administrator account
│   ├── .env                        # Local database credentials & secrets
│   └── .env.example                # Example environment template
├── database/
│   └── schema.sql                  # MySQL database schema & 7 template seed data
├── frontend/
│   ├── src/
│   │   ├── components/             # Sidebar, Navbar, Toast, LoadingSpinner, EmptyState, ConfirmModal
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Admin login with show/hide password
│   │   │   ├── DashboardPage.jsx   # Metrics, stat cards, quick actions, and recent activity
│   │   │   ├── StudentsPage.jsx    # Student directory with search, filter, and CRUD
│   │   │   ├── EventsPage.jsx      # College events CRUD
│   │   │   ├── TemplatesPage.jsx   # 7 template designs, live preview, color pickers, and asset uploads
│   │   │   ├── GenerateSinglePage.jsx # Single certificate generation with live preview
│   │   │   ├── BulkGeneratePage.jsx   # Excel/CSV bulk generator with row error reports & ZIP export
│   │   │   ├── HistoryPage.jsx     # Certificate audit log, re-download, and revocation
│   │   │   └── VerifyPage.jsx      # Public verification page (/verify/:certificateId)
│   │   ├── services/
│   │   │   └── api.js              # Axios HTTP client with JWT interceptor & auto-redirect on expiry
│   │   ├── App.jsx                 # Routing & protected layout
│   │   ├── App.css                 # Comprehensive styling (palette: blue, white, subtle purple)
│   │   ├── index.css               # Global typography & root CSS variables
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js              # Vite server configured on Port 5173
└── README.md
```

---

## 7 Specialized Certificate Templates

1. **Participation Certificate**: Classic double borders with Navy (`#1e3a8a`) and Gold (`#d97706`).
2. **Achievement Certificate**: Royal gold borders with Midnight Slate (`#0f172a`) and Amber Gold (`#b45309`).
3. **Workshop Completion**: Modern emerald styling with Dark Forest (`#065f46`) and Emerald (`#10b981`).
4. **Seminar Attendance**: Academic purple motif with Royal Violet (`#4c1d95`) and Purple (`#8b5cf6`).
5. **Hackathon Excellence**: Cyber-tech design with Onyx (`#111827`), Electric Indigo (`#6366f1`), and Cyan (`#06b6d4`).
6. **Internship Completion**: Corporate executive styling with Dark Navy (`#1e293b`) and Sapphire Blue (`#2563eb`).
7. **NSS Appreciation**: National Service Scheme emblem with Crimson Red (`#7f1d1d`) and Scarlet (`#dc2626`).

---

## Windows & PowerShell Setup Instructions

### 1. Database Initialization
Ensure your local MySQL Server service (`MySQL80`) is running. Execute `schema.sql` via PowerShell:

```powershell
# Navigate to project root
cd online-certificate-generator

# Import database schema (replace [YOUR_PASSWORD] with your MySQL root password)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p[YOUR_PASSWORD] < database\schema.sql
```

### 2. Configure Backend Environment
Navigate to the `backend/` directory and configure `.env`:

```powershell
cd backend
Copy-Item .env.example .env
```

Open `.env` in your editor and verify your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=online_certificate_db
DB_PORT=3306

JWT_SECRET_KEY=super-secret-jwt-key-online-certificate-generator-2026
FRONTEND_BASE_URL=http://localhost:5173
PORT=5000
```

### 3. Create Python Virtual Environment & Install Dependencies
```powershell
# Inside backend directory
python -m venv venv

# If execution policy blocks script execution, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate environment
.\venv\Scripts\Activate.ps1

# Install required packages
pip install -r requirements.txt
```

### 4. Seed the Admin User
Run the setup script to initialize the first administrator:
```powershell
python seed_admin.py
```
*Follow the interactive prompts or pass arguments:*
```powershell
python seed_admin.py --name "Administrator" --email "admin@college.edu" --password "Admin@123"
```

### 5. Start the Backend API Server
```powershell
python app.py
```
*The API will start at `http://localhost:5000`.*

### 6. Start the Frontend Application
Open a new PowerShell terminal:

```powershell
cd online-certificate-generator\frontend

# Install node dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
*The frontend will launch at `http://localhost:5173`.*

---

## Verification & Testing Workflow

1. **Sign In**: Navigate to `http://localhost:5173/login` using your admin credentials (`admin@college.edu` / `Admin@123`).
2. **Student Directory**: Go to **Students** &rarr; Add a new student record (validates email format and unique student ID).
3. **Generate Certificate**: Go to **Generate Single** &rarr; Choose a student and event &rarr; Preview the landscape layout &rarr; Click **Generate Certificate Now**.
4. **Download & Verify**: Click **Download PDF** to inspect the high-resolution ReportLab output. Click **Open Verification Page** or scan the QR code to verify `Valid` status.
5. **Revocation Test**: In **Certificate History**, click **Revoke** on any certificate. Refresh the public verification page to observe the tamper-proof `Revoked` alert banner.
6. **Bulk Generation & ZIP Export**: Go to **Bulk Generation** &rarr; Download the sample template &rarr; Upload `.xlsx` with valid/invalid rows &rarr; Review row-level validation reports &rarr; Download all generated PDFs together in a single ZIP archive.

---

## Troubleshooting & Common Windows Issues

### 1. `mysqlclient` C-extension compilation errors
- **Issue**: Installing `mysqlclient` on Windows fails with `Microsoft Visual C++ 14.0 or greater is required`.
- **Solution**: The application uses pure-Python `PyMySQL` and `mysql-connector-python`, pre-configured in `backend/database.py`. No C++ build tools are required.

### 2. PowerShell Script Execution Policy (`Activate.ps1` restricted)
- **Issue**: `File ...\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Solution**: Run this command in your PowerShell session before activating:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Alternatively, invoke the virtual environment python directly:
  ```powershell
  .\venv\Scripts\python.exe app.py
  ```

### 3. Cross-Origin Resource Sharing (CORS)
- **Issue**: Frontend requests blocked by CORS in the browser console.
- **Solution**: `backend/app.py` has CORS enabled for `http://localhost:5173` and `http://127.0.0.1:5173`. Ensure `FRONTEND_BASE_URL` in `backend/.env` matches your Vite client origin.
