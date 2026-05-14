# AI Learning Plan

AI Learning Plan adalah aplikasi web untuk membantu pengguna membuat goal belajar, mengatur task mingguan, dan mendapatkan saran task dari AI berdasarkan goal, availability, preferred time, dan target jam belajar pengguna.

## Fitur Utama

- Autentikasi pengguna: register dan login
- Profile pengguna dengan timezone, preferred time, weekly target hours, dan availability
- CRUD goals
- Membuat task manual berdasarkan goal
- AI suggestion engine untuk membuat breakdown task mingguan
- Human-in-the-loop: user bisa menerima atau menolak task dari AI
- Task yang diterima dari AI akan disimpan ke database dengan `source: "ai"`

---

## Tech Stack

### Frontend

- React
- React Router
- Vite
- CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- Zod validation
- Gemini API
- Pino logger
- Docker

---

## Cara Menjalankan Aplikasi

### 1. Clone repository

```bash
git clone <repository-url>
cd ai-learning-plan

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

### Auth

| Method | Endpoint | Deskripsi | Auth |

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

### Goals

| Method | Endpoint | Deskripsi | Auth |

| GET | `/goals` | Mengambil semua goal milik user | Ya |
| POST | `/goals` | Membuat goal baru | Ya |
| PATCH | `/goals/:id` | Update goal berdasarkan ID | Ya |
| DELETE | `/goals/:id` | Hapus goal berdasarkan ID | Ya |

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

### Tasks

| Method | Endpoint | Deskripsi | Auth |

| POST | `/tasks` | Membuat task manual atau task dari AI | Ya |

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

---

### AI

| Method | Endpoint | Deskripsi | Auth |

| POST | `/ai/plan/suggest` | Generate saran task mingguan dari AI berdasarkan goal dan profile user | Ya |

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
    

