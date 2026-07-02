# ADR-003: Menggunakan Express.js sebagai Backend Framework

## Status

Accepted

## Konteks

Aplikasi PlanIt membutuhkan backend API untuk menangani autentikasi, profile, goals, tasks, dan AI suggestion engine.

Backend harus dapat menerima request dari frontend React, mengakses PostgreSQL, melakukan validasi input, memverifikasi JWT, dan memanggil layanan LLM.

Karena proyek ini dikerjakan sebagai aplikasi web full-stack, framework backend yang digunakan perlu sederhana, fleksibel, dan mudah dipahami oleh tim.

## Keputusan

Kami memutuskan untuk menggunakan Express.js sebagai backend framework.

Express.js digunakan untuk membuat REST API seperti:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me`
- `/api/goals`
- `/api/tasks`
- `/api/ai/plan/suggest`

Middleware digunakan untuk autentikasi JWT, parsing JSON request, error handling, logging, dan validasi input.

Validasi input dilakukan menggunakan Zod agar request body memiliki format yang sesuai sebelum diproses lebih lanjut.

## Alasan

Express.js dipilih karena ringan, fleksibel, dan umum digunakan dalam ekosistem Node.js.

Framework ini memudahkan pembuatan route secara modular, misalnya memisahkan route auth, goals, tasks, dan AI ke file yang berbeda.

Express juga mudah diintegrasikan dengan PostgreSQL, JWT authentication, logger, dan service LLM.

Karena tim masih dalam tahap membangun aplikasi full-stack dari dasar, Express.js juga membantu tim memahami alur request-response secara jelas.

## Konsekuensi

Keuntungan dari keputusan ini:

- Struktur API mudah dibuat dan dipahami.
- Route dapat dipisahkan berdasarkan domain fitur.
- Mudah diintegrasikan dengan middleware autentikasi dan validasi.
- Cocok untuk REST API sederhana hingga menengah.
- Memudahkan debugging karena alur request-response eksplisit.

Konsekuensi atau risiko:

- Express tidak memberikan struktur aplikasi secara default, sehingga tim harus menjaga konsistensi folder dan pattern sendiri.
- Error handling perlu dibuat dengan benar agar server tidak crash.
- Validasi dan keamanan perlu ditambahkan secara eksplisit, misalnya menggunakan Zod dan JWT middleware.
- Jika aplikasi semakin besar, struktur service/model perlu dijaga agar route tidak menjadi terlalu penuh.