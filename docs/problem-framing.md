# Problem Framing — AI Learning Plan
> Lihat modul Cycle 1 — sub modul "Problem Framing Document".

## Problem

Banyak pelajar memiliki tujuan belajar yang besar, seperti “belajar React”, “menguasai JavaScript”, atau “menyelesaikan materi bootcamp”, tetapi kesulitan mengubah tujuan tersebut menjadi tugas mingguan yang jelas dan realistis.

Masalah spesifik yang ingin diselesaikan dalam proyek ini adalah: pengguna sering membuat goal belajar, tetapi tidak tahu bagaimana memecah goal tersebut menjadi tugas-tugas kecil, memperkirakan durasi belajar, dan menyesuaikannya dengan jadwal serta ketersediaan waktu mereka.

## Approach

Solusi yang dibangun adalah aplikasi web perencanaan belajar berbasis AI. Aplikasi ini membantu pengguna mengelola goal, membuat task manual, dan menghasilkan saran task mingguan menggunakan LLM.

Secara teknis, aplikasi menggunakan arsitektur full-stack:

- React digunakan untuk membangun frontend.
- Express.js digunakan untuk backend API.
- PostgreSQL digunakan untuk menyimpan data user, profile, goals, tasks, dan rekomendasi AI.
- JWT authentication digunakan agar setiap user hanya dapat mengakses data miliknya sendiri.
- Gemini API digunakan sebagai LLM untuk menghasilkan saran rencana belajar.

AI suggestion engine bekerja dengan mengambil konteks pengguna dari database, seperti:

- goal yang dipilih,
- preferensi profile pengguna,
- target jam belajar mingguan,
- availability atau ketersediaan waktu,
- dan task yang sudah ada pada minggu tersebut.

Konteks tersebut dikirim ke LLM melalui prompt yang terstruktur. LLM diminta menghasilkan output dalam format JSON yang berisi ringkasan rencana dan daftar task yang disarankan. Setiap task memiliki title, description, duration estimate, planned date, planned slot, dan rationale.

Untuk mengurangi risiko output AI yang tidak sesuai format, backend melakukan validasi terhadap hasil AI menggunakan schema validation. Jika output AI tidak sesuai struktur yang diharapkan, sistem dapat melakukan retry atau menolak response tersebut. Pendekatan schema-first ini membantu memastikan bahwa output AI dapat digunakan oleh aplikasi secara aman dan konsisten.

Aplikasi juga menggunakan pola human-in-the-loop. Saran AI tidak langsung disimpan sebagai task. Pengguna tetap harus meninjau saran tersebut dan memilih apakah ingin menerima atau menolaknya. Hanya saran yang diterima pengguna yang akan disimpan ke tabel tasks.

## Impact

Dampak yang ingin dicapai adalah membantu pengguna membuat rencana belajar mingguan yang lebih jelas, realistis, dan mudah dijalankan.

Pada akhir Cycle 1, keberhasilan fitur ini akan diukur dari apakah pengguna dapat menggunakan AI suggestion engine untuk menghasilkan dan menyimpan task belajar yang relevan.

Target yang ingin dicapai:

- Minimal 50% saran task dari AI diterima oleh pengguna selama uji coba internal.
- Pengguna dapat membuat goal dan menghasilkan saran task AI dalam waktu kurang dari 2 menit.
- Minimal 80% task AI yang diterima berhasil melewati validasi backend dan tersimpan di database.
- Setiap task AI memiliki rationale yang menjelaskan alasan task tersebut disarankan.
- Pengguna tetap dapat membuat task secara manual jika tidak ingin menggunakan saran AI.

Keberhasilan Cycle 1 berarti AI suggestion engine bekerja secara end-to-end: pengguna dapat login, membuat goal, menghasilkan saran AI, meninjau saran tersebut, menerima task yang relevan, dan menyimpan task tersebut ke dalam sistem.