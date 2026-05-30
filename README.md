# AI Learning Plan

AI Learning Plan adalah aplikasi web untuk membantu pengguna membuat goal belajar, mengatur task mingguan, memecah goal besar menjadi task kecil, dan mendapatkan bantuan AI untuk membuat task breakdown serta menjadwalkan ulang task yang overdue.

Aplikasi ini mendukung perencanaan belajar mingguan berdasarkan goal, availability, preferred time, target jam belajar, dan progress pengguna.

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
* Menghapus task.
* Mark task as done.
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
* Overdue task: `Reschedule`
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
* AI memberikan suggestion berupa:

  * Suggested date
  * Suggested slot
  * Reason
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

---

### 9. Audit dan AI Safety

* AI recommendation disimpan untuk audit.
* AI output divalidasi menggunakan schema sebelum digunakan.
* Context disanitasi sebelum dikirim ke LLM.
* Sensitive fields seperti `email`, `name`, dan `phone` dihapus dari AI context.

---

## Tech Stack

### Frontend

* React
* React Router
* Vite
* CSS
* Local component state menggunakan `useState` dan `useEffect`

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Zod validation
* Gemini API
* Pino logger
* Docker

---

## Cara Menjalankan Aplikasi

### 1. Clone repository

```bash
git clone <repository-url>
cd ai-learning-plan
```

### 2. Setup environment backend

Masuk ke folder server:

```bash
cd server
```

Copy file environment example:

```bash
cp .env.example .env
```

Isi file `.env` sesuai konfigurasi lokal kamu.

Contoh:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/ai_learning_plan
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
LLM_PROVIDER=gemini
```

Jika ingin menggunakan mock AI tanpa memanggil Gemini API:

```env
LLM_PROVIDER=mock
```

### 3. Jalankan database dengan Docker

Dari root project:

```bash
docker compose up db -d
```

### 4. Install dependency backend

```bash
cd server
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

## API Endpoints

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

| Method | Endpoint         | Deskripsi                                | Auth  |
| ------ | ---------------- | ---------------------------------------- | ----- |
| POST   | `/auth/register` | Register user baru                       | Tidak |
| POST   | `/auth/login`    | Login user dan mendapatkan token         | Tidak |
| GET    | `/auth/me`       | Mengambil profile user yang sedang login | Ya    |
| PUT    | `/auth/me`       | Update profile user                      | Ya    |

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

| Method | Endpoint     | Deskripsi                       | Auth |
| ------ | ------------ | ------------------------------- | ---- |
| GET    | `/goals`     | Mengambil semua goal milik user | Ya   |
| POST   | `/goals`     | Membuat goal baru               | Ya   |
| PATCH  | `/goals/:id` | Update goal berdasarkan ID      | Ya   |
| DELETE | `/goals/:id` | Hapus goal dan task di bawahnya | Ya   |

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

| Method | Endpoint                       | Deskripsi                                 | Auth |
| ------ | ------------------------------ | ----------------------------------------- | ---- |
| POST   | `/tasks`                       | Membuat task manual atau task dari AI     | Ya   |
| GET    | `/goals/:goalId/tasks`         | Mengambil task berdasarkan goal           | Ya   |
| GET    | `/tasks?week_start=YYYY-MM-DD` | Mengambil task untuk weekly calendar      | Ya   |
| PATCH  | `/tasks/:taskId/status`        | Mark task sebagai done                    | Ya   |
| PATCH  | `/tasks/:taskId/schedule`      | Update planned date dan planned slot task | Ya   |
| DELETE | `/tasks/:taskId`               | Hapus task                                | Ya   |

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
  "rationale": "useState adalah dasar penting untuk memahami state management di React."
}
```

Contoh response `GET /tasks?week_start=2026-05-25`:

```json
{
  "week_start": "2026-05-25",
  "week_end": "2026-05-31",
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

---

## AI

| Method | Endpoint              | Deskripsi                                                              | Auth |
| ------ | --------------------- | ---------------------------------------------------------------------- | ---- |
| POST   | `/ai/plan/suggest`    | Generate saran task mingguan dari AI berdasarkan goal dan profile user | Ya   |
| POST   | `/ai/plan/reschedule` | Generate saran reschedule untuk overdue task                           | Ya   |

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
  "recommendation": {
    "task_id": "task_uuid",
    "suggested_date": "2026-05-28",
    "suggested_slot": "afternoon",
    "reason": "This slot has fewer existing tasks and fits the user's remaining weekly capacity."
  }
}
```

---

## Progress

| Method | Endpoint                         | Deskripsi                                                    | Auth |
| ------ | -------------------------------- | ------------------------------------------------------------ | ---- |
| GET    | `/progress/weekly?week=YYYY-Wxx` | Mengambil progress snapshot mingguan                         | Ya   |
| POST   | `/progress/recalculate`          | Development only: menghitung ulang progress berdasarkan date | Ya   |

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

## Architecture Decision Records

Dokumentasi keputusan arsitektur dapat dilihat di:

* [ADR-001: Menggunakan Gemini API sebagai LLM](docs/adr/ADR-001-llm-provider.md)
* [ADR-002: Menggunakan PostgreSQL sebagai Database Utama](docs/adr/ADR-002-database.md)
* [ADR-003: Menggunakan Express.js sebagai Backend Framework](docs/adr/ADR-003-backend-framework.md)
* [ADR-004: State Management dan AI Reschedule Strategy](docs/adr/ADR-004-state-management-and-ai-reschedule.md)

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
