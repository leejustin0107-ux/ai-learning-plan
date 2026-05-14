# ADR-002: Menggunakan PostgreSQL sebagai Database Utama

## Status

Accepted

## Konteks

Aplikasi AI Learning Plan membutuhkan penyimpanan data yang terstruktur untuk user, profile, goals, tasks, dan AI recommendations.

Data tersebut saling berhubungan. Contohnya, satu user memiliki banyak goals, satu goal memiliki banyak tasks, dan AI recommendations perlu disimpan untuk kebutuhan audit atau evaluasi output AI.

Selain itu, beberapa data seperti availability dan AI output memiliki bentuk semi-terstruktur yang cocok disimpan sebagai JSON.

## Keputusan

Kami memutuskan untuk menggunakan PostgreSQL sebagai database utama.

PostgreSQL digunakan untuk menyimpan data berikut:

- users
- profiles
- goals
- tasks
- AI recommendations

Relasi antar data dibuat menggunakan foreign key, misalnya goals terhubung ke users, dan tasks terhubung ke goals.

Untuk data yang lebih fleksibel seperti availability dan output AI, digunakan tipe `jsonb`.

## Alasan

PostgreSQL dipilih karena mendukung data relasional dengan baik dan cocok untuk aplikasi yang membutuhkan konsistensi data.

Relasi antar tabel membantu menjaga struktur data agar lebih aman dan jelas. Misalnya, task hanya dapat terhubung ke goal yang sudah ada.

PostgreSQL juga mendukung tipe `jsonb`, sehingga data seperti availability pengguna dan output AI dapat disimpan tanpa harus membuat terlalu banyak kolom tambahan.

Selain itu, PostgreSQL mudah dijalankan secara lokal menggunakan Docker, sehingga memudahkan setup untuk anggota tim.

## Konsekuensi

Keuntungan dari keputusan ini:

- Struktur data lebih jelas dan konsisten.
- Relasi antar tabel dapat dijaga menggunakan foreign key.
- Mendukung penyimpanan JSON melalui `jsonb`.
- Cocok untuk fitur seperti progress tracking, task history, dan audit AI di tahap berikutnya.
- Mudah dijalankan dengan Docker untuk development lokal.

Konsekuensi atau risiko:

- Membutuhkan migration agar perubahan schema dapat dikelola dengan baik.
- Query perlu dirancang dengan benar agar user hanya dapat mengakses data miliknya sendiri.
- Beberapa data JSON seperti availability membutuhkan validasi tambahan di backend agar formatnya tetap konsisten.