# PlanIt

> Your AI study buddy for weekly learning plans.

PlanIt adalah aplikasi web full-stack untuk membantu pengguna membuat goal belajar, mengatur task mingguan, memecah goal besar menjadi task kecil, dan mendapatkan bantuan AI untuk task breakdown serta reschedule recommendation.

Aplikasi ini mendukung perencanaan belajar mingguan berdasarkan goal, availability, preferred time, target jam belajar, dan progress pengguna. PlanIt dirancang sebagai study planning assistant yang membantu pengguna mengubah goal jangka panjang menjadi langkah belajar yang lebih realistis, terjadwal, dan mudah dipantau.

![Screenshot Demo](docs/screenshots/dashboard.png)

---

## Fitur MVP

### 1. Autentikasi dan Profile Pengguna

* Register dan login pengguna.
* Proteksi halaman menggunakan JWT authentication.
* Profile pengguna mencakup:

  * Timezone
  * Preferred time
  * Weekly target hours
  * Availability mingguan

Profile digunakan sebagai konteks untuk membantu AI membuat task suggestion dan reschedule recommendation yang lebih sesuai dengan jadwal pengguna.

---

### 2. Goal Management

* Membuat goal belajar.
* Menampilkan daftar goal.
* Menambahkan deadline pada goal.
* Mengedit goal.
* Menghapus goal.
* Menampilkan status goal secara visual:

  * Gray: ongoing
  * Red: overdue
  * Green: finished

Jika goal dihapus, task di bawah goal tersebut juga ikut terhapus dan weekly progress akan dihitung ulang.

---

### 3. Task Management

* Membuat task manual berdasarkan goal.
* Task memiliki:

  * Title
  * Description
  * Duration estimate
  * Planned date
  * Planned slot
  * Source
  * Status
* Mengedit task.
* Menghapus task.
* Mark task as done.
* Drag-and-drop task pada weekly calendar.
* Menampilkan status task secara visual:

  * Gray: ongoing
  * Red: overdue
  * Green: finished

Task dianggap overdue jika planned date sudah lewat atau planned slot pada hari yang sama sudah terlewati.

---

### 4. AI Task Breakdown

* Pengguna dapat meminta AI untuk memberikan saran task berdasarkan goal.
* AI menggunakan konteks seperti:

  * Goal title
  * Goal description
  * Deadline
  * Availability pengguna
  * Preferred time
  * Weekly target hours
  * Existing tasks
* Pengguna dapat menerima atau menolak task dari AI.
* Task yang diterima akan disimpan ke database dengan `source: "ai"`.
* Output AI divalidasi sebelum disimpan ke database.
* Sensitive context seperti name, email, dan phone disanitasi sebelum dikirim ke LLM.

---

### 5. Weekly Calendar

* Menampilkan task dalam bentuk kalender mingguan.
* Task dikelompokkan berdasarkan:

  * Hari
  * Morning
  * Afternoon
  * Evening
* Pengguna dapat berpindah ke minggu sebelumnya atau minggu berikutnya.
* Task dalam kalender memiliki warna status:

  * Gray: ongoing
  * Red: overdue
  * Green: finished
* Ketika task diklik, popup detail task akan muncul.
* Task dapat dipindahkan menggunakan drag-and-drop.

---

### 6. Task Detail Popup

Pada halaman Calendar, pengguna dapat klik task untuk melihat detail seperti:

* Title
* Description
* Planned date
* Planned slot
* Duration estimate
* Status

Action button dalam popup berubah berdasarkan status task:

* Ongoing task: `Mark as Done`
* Overdue task: `Reschedule` dan `Mark as Done`
* Finished task: `Delete Task`

---

### 7. AI Reschedule

* Overdue task dapat dijadwalkan ulang menggunakan AI.
* AI mempertimbangkan:

  * Overdue task
  * Existing tasks pada minggu berjalan
  * Availability pengguna
  * Preferred time
  * Remaining weekly capacity
* AI memberikan beberapa opsi reschedule berupa:

  * Suggested date
  * Suggested slot
  * Rationale
* Pengguna dapat menerima atau menolak suggestion.
* Task hanya akan berubah jika pengguna menekan `Accept`.
* AI tidak otomatis mengubah jadwal tanpa persetujuan pengguna.

---

### 8. Weekly Progress Tracking

* Progress mingguan dihitung berdasarkan:

  * Planned hours
  * Completed hours
  * Completion rate
* Progress snapshot diperbarui ketika:

  * Task ditandai done
  * Task dihapus
  * Goal dihapus
  * Task dijadwalkan ulang
* Halaman Progress menampilkan:

  * Planned hours
  * Completed hours
  * Completion percentage
  * Progress bar
  * Navigasi previous week dan next week
* Empty state ditampilkan jika belum ada goal atau belum ada task pada minggu tertentu.

---

### 9. Audit dan AI Safety

* AI recommendation disimpan untuk audit.
* AI output divalidasi menggunakan schema sebelum digunakan.
* Context disanitasi sebelum dikirim ke LLM.
* Sensitive fields seperti `email`, `name`, dan `phone` dihapus dari AI context.
* AI tidak langsung mengubah data pengguna tanpa konfirmasi.

---

### 10. Calendar Export

* Pengguna dapat mengekspor task mingguan ke format `.ics`.
* File `.ics` dapat digunakan pada calendar app seperti Google Calendar, Apple Calendar, atau Outlook.
* Export juga tersedia dalam format JSON untuk kebutuhan debugging atau integrasi.

---

### 11. Performance dan Resilience

* Calendar dan Progress page menggunakan lazy loading agar initial frontend bundle lebih ringan.
* Weekly calendar task data menggunakan short-term API cache untuk mengurangi request berulang.
* Database index ditambahkan untuk query task aktif dan AI recommendation.
* Circuit breaker digunakan pada integrasi LLM agar kegagalan AI berulang tidak memperlambat fitur non-AI.
* Idempotent request handling mencegah duplicate task ketika pengguna menekan tombol `Accept` berkali-kali dengan cepat.

---

### 12. Production-Readiness

* Error Boundary ditambahkan untuk mencegah crash UI penuh.
* Empty state dan error state dibuat agar feedback ke user lebih jelas.
* Skeleton loading digunakan untuk pengalaman loading yang lebih baik.
* Modal focus trap ditambahkan untuk meningkatkan keyboard accessibility.
* GitHub Issues digunakan untuk bug tracking.
* Edge case regression tests ditambahkan untuk mencegah bug lama muncul kembali.
* Conventional commits digunakan agar commit history lebih rapi.

---

## Quick Start

### 1. Clone repository

```bash
git clone https://github.com/leejustin0107-ux/ai-learning-plan.git
cd ai-learning-plan
```

### 2. Jalankan database dengan Docker

Dari root project:

```bash
docker compose up db -d
```

### 3. Setup environment backend

Masuk ke folder server:

```bash
cd server
```

Copy file environment example:

```bash
cp .env.example .env
```

Isi file `.env` sesuai konfigurasi lokal.

Contoh:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5433/planner
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
GEMINI_API_KEY=your_gemini_api_key
LLM_PROVIDER=mock
```

Jika ingin menggunakan real Gemini API:

```env
LLM_PROVIDER=gemini
```

Jika ingin menggunakan mock AI tanpa memanggil Gemini API:

```env
LLM_PROVIDER=mock
```

### 4. Install dependency backend

```bash
npm install
```

### 5. Jalankan migration database

```bash
npm run migrate:up
```

### 6. Jalankan backend server

```bash
npm run dev
```

Backend akan berjalan di:

```text
http://localhost:3000
```

### 7. Install dependency frontend

Buka terminal baru dari root project:

```bash
cd client
npm install
```

### 8. Jalankan frontend

```bash
npm run dev
```

Frontend akan berjalan di URL yang diberikan Vite, biasanya:

```text
http://localhost:5173
```

---

## Tech Stack

| Area | Technology | Reason |
|---|---|---|
| Frontend | React | Digunakan untuk membangun UI berbasis komponen seperti Dashboard, Goals, Calendar, Progress, dan Profile |
| Frontend Build Tool | Vite | Memberikan development server yang cepat dan production build yang ringan |
| Routing | React Router | Digunakan untuk navigasi halaman dan protected routes |
| Styling | CSS | Dipilih agar styling tetap sederhana, mudah dikontrol, dan sesuai untuk portfolio project |
| Backend | Node.js + Express.js | Digunakan untuk membangun REST API yang ringan dan mudah diorganisir |
| Database | PostgreSQL | Menyimpan data user, profile, goals, tasks, progress snapshots, dan AI recommendations |
| Database Migration | node-pg-migrate | Mengelola perubahan schema database secara version-controlled |
| Authentication | JWT | Melindungi data user seperti goals, tasks, profile, dan progress |
| Validation | Zod | Memvalidasi request body dan output AI sebelum digunakan oleh sistem |
| AI Integration | Gemini API | Digunakan untuk menghasilkan task suggestion dan reschedule recommendation |
| Testing | Jest + Supertest | Digunakan untuk backend integration tests, edge case tests, dan regression tests |
| Logging | Pino Logger | Mendukung structured logging untuk debugging dan observability |
| Metrics | Prometheus-style metrics | Melacak health, request behavior, dan AI suggestion acceptance |
| Containerization | Docker Compose | Menyediakan setup PostgreSQL lokal yang konsisten |
| Performance | Lazy loading, API caching, database indexes | Mengurangi initial load dan repeated API/database work |
| Resilience | Circuit breaker, idempotency key | Mengurangi dampak error AI service dan mencegah duplicate request |

---

## Architecture

PlanIt menggunakan client-server architecture. React frontend berkomunikasi dengan Express backend melalui REST API. Backend bertanggung jawab untuk authentication, authorization, validation, database operations, progress calculation, AI integration, observability, dan export.

![Architecture Diagram](docs/architecture.png)

```text
User
 |
 v
React Frontend
 |
 | REST API + JWT
 v
Express Backend
 |
 |----------------------|
 |                      |
 v                      v
PostgreSQL Database     Gemini AI Service
 |
 v
Users, Profiles, Goals, Tasks, Progress, AI Recommendations
```

### Main Modules

| Module | Responsibility |
|---|---|
| Authentication | Register, login, JWT authentication, dan protected routes |
| Profile | Menyimpan timezone, preferred time, weekly target hours, dan availability |
| Goals | Membuat, menghapus, mengubah, dan menampilkan goal belajar |
| Tasks | Membuat task manual/AI, update schedule, mark as done, dan delete task |
| AI Suggestion | Membuat task breakdown berdasarkan goal dan profile user |
| AI Reschedule | Memberikan opsi jadwal baru untuk task overdue |
| Calendar | Menampilkan task mingguan dan mendukung drag-and-drop scheduling |
| Progress | Menghitung planned hours, completed hours, dan completion rate |
| Export | Mengekspor weekly plan dalam format JSON dan `.ics` calendar |
| Observability | Health check, metrics endpoint, structured logs |
| Resilience | Circuit breaker, idempotent task creation, dan edge case handling |

---

## Screenshot / Demo Fitur Utama

### Login Page

![Login Page](docs/images/login.png)

### Profile Page

![Profile Page](docs/images/profile.png)

### Goals Page

![Goals Page](docs/images/goals.png)

### AI Suggestion

![AI Suggestion](docs/images/ai-suggestion.png)

### Accepted AI Task

![Accepted AI Task](docs/images/accepted-task.png)

### Weekly Calendar

![Weekly Calendar](docs/images/weekly-calendar.png)

### AI Reschedule

![AI Reschedule](docs/images/ai-reschedule.png)

### Progress Page

![Progress Page](docs/images/progress.png)

---

## API Documentation

Base URL:

```text
http://localhost:3000/api
```

Untuk endpoint yang membutuhkan autentikasi, gunakan header:

```text
Authorization: Bearer <token>
```

---

## Auth

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| POST | `/auth/register` | Register user baru | Tidak |
| POST | `/auth/login` | Login user dan mendapatkan token | Tidak |
| GET | `/auth/me` | Mengambil profile user yang sedang login | Ya |
| PUT | `/auth/me` | Update profile user | Ya |

Contoh body `POST /auth/register`:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Contoh body `POST /auth/login`:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Contoh response login:

```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "userId": "user_id"
}
```

Contoh body `PUT /auth/me`:

```json
{
  "timezone": "Asia/Kuala_Lumpur",
  "preferred_time": "evening",
  "weekly_target_hours": 5,
  "availability": {
    "monday": {
      "available": true,
      "start": "18:00",
      "end": "20:00"
    },
    "tuesday": {
      "available": false,
      "start": "",
      "end": ""
    },
    "wednesday": {
      "available": true,
      "start": "19:00",
      "end": "21:00"
    },
    "thursday": {
      "available": false,
      "start": "",
      "end": ""
    },
    "friday": {
      "available": true,
      "start": "14:00",
      "end": "16:00"
    },
    "saturday": {
      "available": false,
      "start": "",
      "end": ""
    },
    "sunday": {
      "available": false,
      "start": "",
      "end": ""
    }
  }
}
```

---

## Goals

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| GET | `/goals` | Mengambil semua goal milik user | Ya |
| POST | `/goals` | Membuat goal baru | Ya |
| PATCH | `/goals/:id` | Update goal berdasarkan ID | Ya |
| DELETE | `/goals/:id` | Hapus goal dan task di bawahnya | Ya |

Contoh body `POST /goals`:

```json
{
  "title": "Belajar React Hooks",
  "description": "Memahami useState dan useEffect",
  "deadline": "2026-05-20"
}
```

Contoh body `PATCH /goals/:id`:

```json
{
  "title": "Belajar React Hooks dan Context",
  "deadline": "2026-05-30"
}
```

---

## Tasks

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| POST | `/tasks` | Membuat task manual atau task dari AI | Ya |
| GET | `/goals/:goalId/tasks` | Mengambil task berdasarkan goal | Ya |
| GET | `/tasks?week_start=YYYY-MM-DD` | Mengambil task untuk weekly calendar | Ya |
| PATCH | `/tasks/:taskId/status` | Mark task sebagai done | Ya |
| PATCH | `/tasks/:taskId/schedule` | Update planned date dan planned slot task | Ya |
| PATCH | `/tasks/:taskId` | Update detail atau schedule task | Ya |
| DELETE | `/tasks/:taskId` | Hapus task | Ya |

Contoh body `POST /tasks` untuk task manual:

```json
{
  "goal_id": "goal_uuid",
  "title": "Study React state",
  "description": "Practice useState and form handling",
  "duration_estimate": 45,
  "planned_date": "2026-05-13",
  "planned_slot": "evening",
  "source": "manual",
  "rationale": "This helps understand frontend state"
}
```

Contoh body `POST /tasks` untuk task dari AI:

```json
{
  "goal_id": "goal_uuid",
  "title": "Belajar useState",
  "description": "Pelajari konsep useState dan buat contoh form sederhana.",
  "duration_estimate": 45,
  "planned_date": "2026-05-13",
  "planned_slot": "evening",
  "source": "ai",
  "rationale": "useState adalah dasar penting untuk memahami state management di React.",
  "idempotency_key": "ai-task-goal_uuid-belajar-usestate-2026-05-13-evening-45"
}
```

Catatan: `idempotency_key` digunakan untuk mencegah duplicate task jika pengguna menekan tombol `Accept` lebih dari sekali dengan cepat.

Contoh response `GET /tasks?week_start=2026-05-25`:

```json
{
  "weekStart": "2026-05-25",
  "weekEnd": "2026-05-31",
  "tasks": {
    "2026-05-25": [
      {
        "id": "task_uuid",
        "goal_id": "goal_uuid",
        "title": "Study React state",
        "description": "Practice useState and form handling",
        "duration_estimate": 45,
        "planned_date": "2026-05-25",
        "planned_slot": "morning",
        "status": "todo",
        "source": "manual"
      }
    ]
  }
}
```

Contoh body `PATCH /tasks/:taskId/schedule`:

```json
{
  "planned_date": "2026-05-28",
  "planned_slot": "afternoon"
}
```

Contoh body `PATCH /tasks/:taskId/status`:

```json
{
  "status": "done"
}
```

---

## AI

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| POST | `/ai/plan/suggest` | Generate saran task mingguan dari AI berdasarkan goal dan profile user | Ya |
| POST | `/ai/plan/reschedule` | Generate saran reschedule untuk overdue task | Ya |

Contoh body `POST /ai/plan/suggest`:

```json
{
  "goal_id": "goal_uuid",
  "week_start": "2026-05-11"
}
```

Contoh response:

```json
{
  "summary": "Rencana minggu ini fokus pada fondasi React hooks.",
  "tasks": [
    {
      "title": "Belajar useState",
      "description": "Pelajari konsep useState dan buat contoh form sederhana.",
      "duration_estimate": 45,
      "planned_date": "2026-05-13",
      "planned_slot": "evening",
      "rationale": "useState adalah dasar penting untuk memahami state management di React."
    }
  ]
}
```

Contoh body `POST /ai/plan/reschedule`:

```json
{
  "task_ids": ["task_uuid"]
}
```

Contoh response:

```json
{
  "summary": "Suggested reschedule options based on availability and current weekly workload.",
  "options": [
    {
      "task_id": "task_uuid",
      "suggested_date": "2026-05-28",
      "suggested_slot": "afternoon",
      "rationale": [
        "This slot has fewer existing tasks.",
        "It fits the user's remaining weekly capacity."
      ]
    }
  ]
}
```

- [Estimasi Biaya Penggunaan AI](docs/ai-cost-estimation.md)

---

## Progress

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| GET | `/progress/weekly?week=YYYY-Wxx` | Mengambil progress snapshot mingguan | Ya |
| POST | `/progress/recalculate` | Development only: menghitung ulang progress berdasarkan date | Ya |

Contoh response `GET /progress/weekly?week=2026-W22`:

```json
{
  "id": "snapshot_uuid",
  "user_id": "user_uuid",
  "week": "2026-W22",
  "planned_hours": "6.8",
  "completed_hours": "5.3",
  "completion_rate": "0.78",
  "created_at": "2026-05-28T12:45:59.980Z"
}
```

Contoh body `POST /progress/recalculate`:

```json
{
  "date": "2026-05-29"
}
```

Catatan: endpoint `/progress/recalculate` digunakan untuk development/testing dan dapat dihapus atau dibatasi untuk admin pada versi production.

---

## Export

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| GET | `/export/weekly?week_start=YYYY-MM-DD` | Export task mingguan dalam format JSON | Ya |
| GET | `/export/weekly.ics?week_start=YYYY-MM-DD` | Export task mingguan dalam format `.ics` calendar file | Ya |

Contoh request:

```text
GET /api/export/weekly.ics?week_start=2026-06-29
Authorization: Bearer <token>
```

Response endpoint `.ics` akan mengembalikan file calendar yang dapat diimport ke aplikasi kalender seperti Google Calendar, Apple Calendar, atau Outlook.

---

## System

| Method | Endpoint | Deskripsi | Auth |
| ------ | -------- | --------- | ---- |
| GET | `/health` | Mengecek status backend service | Tidak |
| GET | `/metrics` | Menampilkan metrics untuk observability | Tidak |

---

## AI Context Sanitization

Sebelum context dikirim ke LLM, aplikasi menjalankan sanitasi untuk menghapus data sensitif yang tidak diperlukan.

Contoh field yang dihapus:

* `email`
* `name`
* `phone`

Hal ini dilakukan agar AI hanya menerima context yang relevan untuk task planning dan reschedule.

---

## Progress Calculation

Weekly progress dihitung ulang ketika terjadi perubahan yang memengaruhi task dalam minggu tersebut, seperti:

* Task ditandai done
* Task dihapus
* Goal dihapus
* Task dijadwalkan ulang

Progress dihitung menggunakan:

```text
planned_hours = total duration_estimate task dalam minggu tersebut / 60
completed_hours = total duration task yang selesai / 60
completion_rate = completed_hours / planned_hours
```

Jika tidak ada task pada minggu tersebut, progress akan bernilai 0.

---

## Testing, Coverage, and Accessibility

### Test Coverage

Backend tests dijalankan menggunakan Jest dengan coverage reporting.

```bash
cd server
npm test -- --coverage
```

Untuk menjalankan satu test file tanpa coverage:

```bash
npm test -- edge-cases.test.js --runInBand --coverage=false
```

Test suite mencakup:

* Authentication
* AI output validation
* Progress calculation
* Middleware handling
* Metrics endpoint behavior
* AI suggestion-to-task flow
* Task status transition edge cases
* Export endpoint behavior
* Circuit breaker behavior
* Idempotent task creation

Coverage evidence tersedia di:

```text
docs/TEST_COVERAGE.md
```

Screenshot hasil coverage tersedia di:

```text
docs/screenshots/test-coverage.png
```

---

### Accessibility Audit

Accessibility direview menggunakan Lighthouse dan axe-core melalui axe DevTools browser extension.

Audit dilakukan pada halaman utama seperti:

* Login
* Register
* Dashboard
* Goals
* Calendar
* Progress
* Profile

Accessibility improvements yang dibuat:

* Replaced generic loading text with skeleton loading screens.
* Added `aria-label` to icon-only buttons.
* Used semantic buttons for interactive controls.
* Added keyboard support for calendar task interaction.
* Added visible focus states using `:focus-visible`.
* Added EmptyState and ErrorState components for clearer feedback.
* Improved color contrast for buttons, cards, and text.
* Added accessible form labels and error messages.
* Added modal focus trap so keyboard focus does not escape active modals.

Full accessibility audit summary tersedia di:

```text
docs/ACCESSIBILITY_AUDIT.md
```

---

### AI Suggestion Acceptance Rate

Sistem melacak AI suggestion usefulness menggunakan metrics:

```text
ai_suggestions_generated_total
ai_suggestions_accepted_total
```

Acceptance rate dihitung sebagai:

```text
Accepted AI Suggestions / Generated AI Suggestions × 100
```

Metric ini membantu mengevaluasi apakah AI-generated learning tasks berguna bagi pengguna.

---

## Production-Readiness Summary

| Area | Improvement |
|---|---|
| Frontend Stability | Error Boundary, skeleton loading, empty state, error state |
| Accessibility | Keyboard support, focus states, accessible labels, modal focus trap |
| Performance | Lazy loading, weekly task cache, database indexes |
| Resilience | Circuit breaker for LLM API, idempotent task creation |
| Testing | Edge case tests, regression tests, AI flow tests, export tests |
| Observability | Health endpoint, metrics endpoint, structured logging |
| AI Safety | Context sanitization, schema validation, audit logging |
| GitHub Workflow | Issue labels, bug tracking, conventional commits |

---

## Deployment

### Frontend Deployment

Frontend dapat dideploy menggunakan Vercel.

```bash
cd client
npm run build
```

Recommended Vercel settings:

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

---

### Backend Deployment

Backend dapat dideploy menggunakan Render, Railway, atau platform Node.js lain.

Recommended backend settings:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` atau `node src/server.js` |
| Runtime | Node.js |
| Database | PostgreSQL |

Required environment variables:

```env
DATABASE_URL=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
GEMINI_API_KEY=
LLM_PROVIDER=real
PORT=
```

Sebelum menjalankan backend di production, jalankan migration:

```bash
npm run migrate:up
```

---

### Database Deployment

Database production dapat menggunakan hosted PostgreSQL seperti:

* Render PostgreSQL
* Railway PostgreSQL
* Supabase
* Neon

Setelah database production dibuat, update `DATABASE_URL` pada environment backend.

---

## Team

| Name | Role |
|---|---|
| Justin Lee | Full-stack development, AI planning feature, backend API, frontend UI, testing, accessibility, and production-readiness improvements |

---

## Documentation

- [Problem Framing](docs/problem-framing.md)
- [Portfolio Write-up](docs/portfolio-writeup.md)
- [AI Cost Estimation](docs/ai-cost-estimation.md)
- [Test Coverage](docs/TEST_COVERAGE.md)
- [Accessibility Audit](docs/ACCESSIBILITY_AUDIT.md)
- [ADR-001: Menggunakan Gemini API sebagai LLM](docs/adr/ADR-001-llm-provider.md)
- [ADR-002: Menggunakan PostgreSQL sebagai Database Utama](docs/adr/ADR-002-database.md)
- [ADR-003: Menggunakan Express.js sebagai Backend Framework](docs/adr/ADR-003-backend-framework.md)
- [ADR-004: State Management dan AI Reschedule Strategy](docs/adr/ADR-004-state-management-and-ai-reschedule.md)

---

## Release Notes

### v0.2 / release MVP

Fitur MVP yang tersedia:

* Goal management
* Manual task management
* AI task suggestion
* Weekly calendar
* Task detail popup
* Mark task as done
* Delete goal dan task
* AI reschedule untuk overdue task
* Weekly progress tracking
* AI context sanitization
* AI recommendation audit

### v1.0.0 / portfolio release

Planned final portfolio release:

* Rebranded application to PlanIt
* Improved login and register UI branding
* Added onboarding modal for new users
* Added password visibility toggle
* Added skeleton loading states
* Added empty and error states
* Added modal focus trap
* Added calendar export to `.ics`
* Added circuit breaker for LLM API
* Added idempotent task creation
* Added performance indexes and frontend caching
* Added edge case regression tests
* Added README and contribution documentation

---

## Conventional Commits

Repository ini menggunakan conventional commits agar commit history lebih mudah dibaca.

Contoh:

```bash
git commit -m "feat: add circuit breaker for LLM API"
git commit -m "fix: progress calculation edge case when no tasks"
git commit -m "docs: update README with architecture diagram"
git commit -m "test: add edge case tests for status transition"
git commit -m "refactor: rebrand app to PlanIt"
```

| Prefix | Meaning |
|---|---|
| `feat:` | Menambahkan fitur baru |
| `fix:` | Memperbaiki bug |
| `docs:` | Perubahan dokumentasi |
| `test:` | Menambahkan atau mengubah test |
| `refactor:` | Merapikan struktur kode tanpa mengubah behavior |
| `chore:` | Maintenance atau setup task |

---

## Release

Untuk membuat release final:

```bash
git tag -a v1.0.0 -m "Release v1.0.0 — PlanIt"
git push origin v1.0.0
```

Setelah tag dibuat, buat GitHub Release dari tag tersebut dan isi release notes dengan ringkasan fitur utama:

```text
- Goal management
- Manual task management
- AI task suggestion
- AI rescheduling
- Weekly calendar
- Progress tracking
- Calendar export
- Accessibility improvements
- Testing and edge case coverage
- Production-readiness improvements
```

---

## License

This project is developed for learning and portfolio purposes.