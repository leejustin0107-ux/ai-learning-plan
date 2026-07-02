# Portfolio Write-up: PlanIt MVP

## Problem

Banyak mahasiswa mengalami kesulitan ketika harus mengubah goal belajar yang besar menjadi langkah-langkah kecil yang jelas dan dapat dikerjakan setiap minggu. Goal seperti “belajar React”, “memahami backend development”, atau “mempersiapkan internship” masih terlalu luas jika tidak dipecah menjadi task yang lebih spesifik.

Masalah ini menjadi lebih sulit ketika pengguna memiliki waktu belajar yang terbatas. Setiap pengguna bisa memiliki availability yang berbeda, preferred time yang berbeda, serta target jam belajar mingguan yang berbeda. Tanpa sistem perencanaan yang terstruktur, task mudah menjadi overdue, progress sulit dipantau, dan pengguna dapat kehilangan motivasi karena tidak melihat perkembangan yang jelas.

MVP PlanIt dibuat untuk menyelesaikan masalah tersebut dengan menyediakan aplikasi web yang membantu pengguna:

* Membuat goal belajar.
* Membuat task secara manual.
* Mendapatkan saran task breakdown dari AI.
* Menjadwalkan task ke kalender mingguan.
* Melihat status task seperti ongoing, overdue, dan finished.
* Menjadwalkan ulang task overdue menggunakan AI.
* Melacak progress mingguan berdasarkan planned hours dan completed hours.

Tujuan utama MVP ini bukan hanya membuat task, tetapi mendukung alur belajar yang lebih lengkap dari goal creation, weekly planning, execution, rescheduling, hingga progress tracking.

---

## Approach

PlanIt MVP dibangun sebagai aplikasi full-stack menggunakan React, Node.js, Express.js, PostgreSQL, dan Gemini API. Aplikasi menggunakan arsitektur client-server, di mana frontend menangani interaksi pengguna dan backend menangani autentikasi, pengelolaan data, validasi, AI context building, serta progress calculation.

### Frontend Approach

Frontend dibangun menggunakan React dan Vite. Untuk MVP, aplikasi menggunakan local component state dengan `useState` dan `useEffect`, bukan global state management library seperti Redux atau Zustand.

Keputusan ini dipilih karena sebagian besar state masih spesifik pada halaman tertentu:

* Goals page mengelola daftar goals, task per goal, modal task, modal AI suggestion, dan AI reschedule suggestion.
* Calendar page mengelola selected task, task detail popup, AI reschedule suggestion, dan refresh state.
* Progress page mengelola selected week dan weekly progress data.

Untuk melakukan refresh data antar komponen, aplikasi menggunakan pola `refreshKey`. Ketika terjadi perubahan seperti mark task as done, delete task, accept reschedule, atau update schedule, nilai `refreshKey` dinaikkan agar komponen terkait melakukan fetch ulang data.

Trade-off dari pendekatan ini adalah beberapa logic dapat menjadi duplikat, seperti perhitungan status task pada Goals page dan Calendar page. Namun, untuk tahap MVP, pendekatan ini menjaga aplikasi tetap sederhana, mudah dipahami, dan tidak menambah dependency yang belum diperlukan. Jika aplikasi berkembang dan lebih banyak komponen membutuhkan shared state, maka React Context, Zustand, atau TanStack Query dapat dipertimbangkan.

### Backend Approach

Backend dibangun menggunakan Node.js dan Express.js. PostgreSQL digunakan sebagai database utama karena data aplikasi bersifat relasional, seperti users, profiles, goals, tasks, AI recommendations, dan progress snapshots.

Backend menyediakan API untuk:

* Authentication dan profile management.
* Goal creation, update, deletion, dan retrieval.
* Task creation, deletion, status update, dan schedule update.
* AI task suggestion.
* AI reschedule suggestion.
* Weekly calendar data.
* Weekly progress tracking.

JWT authentication digunakan untuk melindungi route yang membutuhkan login. Ownership check juga dilakukan pada backend agar pengguna hanya dapat mengakses dan mengubah goals serta tasks miliknya sendiri.

### AI Task Suggestion

Fitur AI task suggestion menggunakan data goal, profile pengguna, availability, preferred time, weekly target hours, dan existing tasks sebagai context. AI kemudian memberikan task suggestion yang berisi title, description, duration estimate, planned date, planned slot, dan rationale.

Output AI tidak langsung dipercaya oleh sistem. Backend melakukan validasi output AI menggunakan schema sebelum data digunakan. Selain itu, pengguna harus menerima task suggestion terlebih dahulu sebelum task disimpan ke database. Dengan pendekatan ini, sistem tetap menggunakan human-in-the-loop, sehingga keputusan akhir tetap berada pada pengguna.

### AI Reschedule Strategy

MVP juga memiliki fitur AI reschedule untuk task yang overdue. Ketika task overdue, pengguna dapat meminta saran jadwal baru dari AI. Backend membangun context yang berisi:

* Task overdue yang ingin dijadwalkan ulang.
* Task lain pada minggu berjalan.
* Planned date dan planned slot yang sudah digunakan.
* Availability pengguna.
* Preferred time pengguna.
* Remaining weekly capacity.

Strategi yang dipilih adalah mengirim daftar task dan slot yang sudah terisi ke LLM sebagai constraint. Pendekatan ini menggunakan token lebih banyak, tetapi membantu AI memberikan rekomendasi yang lebih relevan dan mengurangi kemungkinan konflik jadwal.

Alternatif lainnya adalah membiarkan frontend mendeteksi konflik setelah AI memberi saran. Namun, pendekatan tersebut dapat mengganggu user experience karena pengguna bisa menerima rekomendasi yang ternyata tidak cocok atau bertabrakan dengan jadwal lain.

AI reschedule tidak langsung mengubah database. Sistem menggunakan pendekatan recommendation-first:

1. Pengguna menekan tombol Reschedule.
2. AI memberikan suggested date, suggested slot, dan reason.
3. Pengguna dapat memilih Accept atau Decline.
4. Task hanya diperbarui jika pengguna memilih Accept.

### Progress Tracking Approach

MVP menggunakan progress snapshot untuk menghitung progress mingguan. Progress dihitung berdasarkan:

* Planned hours: total estimasi durasi task dalam satu minggu.
* Completed hours: total durasi task yang sudah selesai.
* Completion rate: completed hours dibagi planned hours.

Progress dihitung ulang setiap kali ada event penting yang memengaruhi task, seperti:

* Task ditandai done.
* Task dihapus.
* Goal dihapus.
* Task dijadwalkan ulang.

Untuk MVP, recalculation per event dipilih karena jumlah pengguna dan task masih kecil. Keuntungannya adalah progress yang ditampilkan selalu cukup real-time setelah pengguna melakukan perubahan. Trade-off dari pendekatan ini adalah adanya tambahan query database setiap kali task berubah. Jika aplikasi berkembang dan jumlah data meningkat, pendekatan ini dapat diganti dengan batch recalculation atau background job.

### AI Safety dan Audit

Sebelum context dikirim ke LLM, aplikasi melakukan sanitasi untuk menghapus data sensitif yang tidak diperlukan, seperti name, email, dan phone. AI recommendation juga disimpan untuk kebutuhan audit. Hal ini membantu meningkatkan transparansi, mempermudah debugging, dan mengurangi risiko pengiriman data pribadi yang tidak relevan ke AI provider.

---

## Impact

MVP ini berhasil menyediakan alur lengkap untuk membantu pengguna merencanakan dan memantau proses belajar. Pengguna dapat memulai dari goal besar, memecahnya menjadi task mingguan, menjadwalkannya di kalender, menyelesaikan task, menjadwalkan ulang task overdue, dan melihat progress mingguan.

### Functional Impact

MVP mendukung workflow berikut:

1. Pengguna dapat membuat goal belajar.
2. Pengguna dapat membuat task manual di bawah goal.
3. Pengguna dapat meminta AI membuat task suggestion.
4. Pengguna dapat menerima atau menolak task dari AI.
5. Task yang diterima dari AI disimpan ke database.
6. Pengguna dapat melihat task dalam weekly calendar.
7. Pengguna dapat membuka detail task dari kalender.
8. Pengguna dapat menandai task sebagai done.
9. Pengguna dapat meminta AI reschedule untuk task overdue.
10. Pengguna dapat menerima atau menolak AI reschedule suggestion.
11. Pengguna dapat menghapus task dan goal.
12. Pengguna dapat melihat progress mingguan berdasarkan planned hours dan completed hours.

### Technical Impact

MVP menghasilkan beberapa peningkatan teknis yang membuat aplikasi lebih aman dan terstruktur:

* Protected API routes menggunakan JWT authentication.
* Ownership check untuk goals dan tasks.
* Validasi input dan output menggunakan schema.
* AI output validation sebelum data digunakan.
* AI context sanitization sebelum LLM call.
* AI recommendation audit log.
* Weekly progress recalculation setelah task-related events.
* Calendar refresh setelah task update, delete, atau reschedule.
* Status-based UI untuk ongoing, overdue, dan finished tasks.

### Measurable Impact

MVP menyediakan progress yang dapat diukur melalui weekly progress snapshots. Sistem menghitung:

* Total planned hours dalam minggu tertentu.
* Total completed hours dalam minggu tertentu.
* Completion rate dalam bentuk persentase.
* Progress bar berdasarkan completion rate.

Sebagai contoh, jika pengguna memiliki 6.8 planned hours dan menyelesaikan 5.3 completed hours, sistem menghitung completion rate sekitar 78%. Angka ini memberikan pengguna gambaran yang jelas tentang seberapa jauh progress belajar mereka dalam minggu tersebut.

Selain itu, status task juga membantu pengguna melihat kondisi task secara langsung:

* Ongoing task menunjukkan task yang masih dapat dikerjakan.
* Overdue task menunjukkan task yang sudah melewati planned date atau planned slot.
* Finished task menunjukkan task yang sudah selesai.

### User Experience Impact

MVP mengurangi beban pengguna dalam merencanakan proses belajar. Pengguna tidak perlu menentukan seluruh task secara manual dari awal karena AI dapat membantu memberikan task breakdown. Namun, pengguna tetap memiliki kontrol karena semua AI suggestion harus diterima terlebih dahulu sebelum disimpan atau diterapkan.

Weekly calendar membantu pengguna melihat distribusi task berdasarkan hari dan slot waktu. AI reschedule membantu pengguna menangani task yang overdue tanpa harus memikirkan ulang jadwal dari awal. Progress page memberikan feedback visual terhadap pencapaian mingguan pengguna.

Dengan kombinasi fitur ini, MVP membantu pengguna menjalankan proses belajar yang lebih terstruktur, fleksibel, dan terukur.

---

## Summary

PlanIt MVP menyelesaikan masalah utama dalam mengubah goal belajar yang besar menjadi task mingguan yang lebih kecil, terjadwal, dan dapat dipantau. Aplikasi ini menggabungkan manual task management, AI task suggestion, weekly calendar, AI reschedule, dan progress tracking dalam satu workflow.

Pendekatan teknis yang dipilih meliputi React local state untuk menjaga kompleksitas frontend tetap sederhana, Express.js dan PostgreSQL untuk backend dan data relasional, Gemini API untuk fitur AI, validasi schema untuk menjaga kualitas output AI, serta progress snapshot untuk mengukur pencapaian mingguan.

Trade-off utama dalam MVP ini adalah penggunaan local state dibanding global state library, pengiriman context yang lebih lengkap ke LLM untuk meningkatkan kualitas reschedule suggestion, dan recalculation progress per event untuk mendapatkan data yang real-time. Keputusan tersebut sesuai untuk tahap MVP dan dapat ditinjau kembali ketika jumlah pengguna, data, dan kompleksitas aplikasi meningkat.

Secara keseluruhan, MVP ini menunjukkan kemampuan aplikasi untuk mendukung alur belajar end-to-end: mulai dari goal, task planning, AI assistance, calendar execution, rescheduling, hingga progress measurement.
