# One-Pager Case Study: PlanIt MVP

## Ringkasan

PlanIt adalah aplikasi web yang membantu pengguna mengubah goal belajar besar menjadi task-task kecil yang lebih mudah dikerjakan. Aplikasi ini mendukung pembuatan task manual, AI task suggestion, weekly calendar, AI reschedule untuk task overdue, dan progress tracking mingguan.

MVP ini dibuat untuk membantu mahasiswa atau self-learner yang sering kesulitan menentukan langkah belajar berikutnya, mengatur jadwal belajar, dan melihat progress secara terukur.

---

## Problem

Banyak pengguna memiliki goal belajar yang besar, seperti “belajar React” atau “meningkatkan kemampuan backend”, tetapi kesulitan memecah goal tersebut menjadi task yang spesifik dan realistis. Selain itu, jadwal belajar pengguna sering berubah, sehingga task dapat menjadi overdue dan progress sulit dipantau.

Masalah utama yang diselesaikan MVP ini adalah:

* Goal belajar terlalu besar dan tidak langsung actionable.
* Task belajar sulit dijadwalkan sesuai availability pengguna.
* Task overdue sering tidak ditangani ulang.
* Progress belajar mingguan sulit diukur secara jelas.

---

## Approach

MVP dibangun menggunakan React, Node.js, Express.js, PostgreSQL, dan Gemini API. Pengguna dapat membuat goal, menambahkan task manual, atau meminta AI untuk memberikan task breakdown berdasarkan goal, availability, preferred time, dan weekly target hours.

Aplikasi menggunakan pendekatan human-in-the-loop. AI hanya memberikan rekomendasi, sedangkan pengguna tetap menentukan apakah task atau reschedule suggestion akan diterima.

Pendekatan teknis utama:

* React local state digunakan untuk MVP karena state masih dominan page-specific.
* Weekly calendar menampilkan task berdasarkan hari dan slot waktu.
* AI reschedule menggunakan context task overdue, existing tasks, availability, dan remaining weekly capacity.
* Progress snapshot dihitung ulang setiap event penting seperti mark as done, delete task, delete goal, dan reschedule task.
* AI context disanitasi sebelum dikirim ke LLM untuk menghapus field sensitif seperti name, email, dan phone.

---

## Key Screenshots

### 1. Weekly Calendar View

![Weekly Calendar View](docs/images/weekly-calendar.png)

Weekly Calendar menampilkan task berdasarkan hari dan slot waktu seperti morning, afternoon, dan evening. Warna task menunjukkan status: ongoing, overdue, atau finished. Pengguna dapat membuka detail task langsung dari kalender.

---

### 2. AI Suggestion / AI Reschedule Flow

![AI Suggestion Flow](docs/images/ai-suggestion.png)

AI membantu pengguna membuat task breakdown dari goal belajar. Untuk task overdue, AI juga dapat memberikan saran reschedule berdasarkan availability, task yang sudah ada, dan kapasitas belajar mingguan. Suggestion tidak langsung diterapkan; pengguna dapat memilih Accept atau Decline.

---

### 3. Progress Dashboard

![Progress Dashboard](docs/images/progress.png)

Progress Dashboard menampilkan planned hours, completed hours, dan completion rate mingguan. Progress akan diperbarui saat task selesai, task dihapus, goal dihapus, atau task dijadwalkan ulang.

---

## Impact

MVP ini menghasilkan workflow belajar yang lebih lengkap dan terukur:

* Pengguna dapat membuat goal dan task belajar secara terstruktur.
* AI membantu mempercepat proses task breakdown.
* Weekly calendar membantu pengguna melihat jadwal belajar dengan lebih jelas.
* AI reschedule membantu menangani task overdue tanpa harus menjadwalkan ulang secara manual dari awal.
* Progress dashboard memberikan feedback visual terhadap pencapaian mingguan.

Dampak yang dapat diukur:

* Planned hours dihitung dari total estimasi durasi task dalam satu minggu.
* Completed hours dihitung dari task yang sudah selesai.
* Completion rate dihitung sebagai persentase progress mingguan.
* Contoh: jika pengguna memiliki 6.8 planned hours dan menyelesaikan 5.3 completed hours, sistem menampilkan completion rate sekitar 78%.

---

## Result

PlanIt MVP berhasil mendukung alur belajar end-to-end:

**Goal → Task Breakdown → Weekly Calendar → AI Reschedule → Progress Tracking**

Dengan kombinasi manual task management, AI assistance, dan progress measurement, MVP ini membantu pengguna mengatur proses belajar secara lebih terarah, fleksibel, dan terukur.
