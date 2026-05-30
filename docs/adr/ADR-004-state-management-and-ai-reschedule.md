# ADR-004: State Management, AI Reschedule Strategy, and Progress Snapshot Recalculation

## Status

Accepted

## Konteks

AI Learning Plan saat ini sudah berkembang menjadi aplikasi MVP yang memiliki beberapa fitur utama, yaitu goal management, task management, AI task suggestion, weekly calendar, AI reschedule, dan progress tracking.

Pada frontend, beberapa state perlu dikelola, seperti daftar goals, daftar tasks, task yang dipilih di calendar popup, AI suggestion, AI reschedule suggestion, refresh calendar, dan weekly progress. Namun, sebagian besar state masih digunakan secara lokal pada halaman tertentu seperti Goals page, Calendar page, dan Progress page.

Pada fitur AI reschedule, sistem perlu menentukan bagaimana task overdue dijadwalkan ulang. AI dapat memberikan saran tanggal dan slot baru, tetapi ada kemungkinan slot yang disarankan sudah memiliki task lain. Oleh karena itu, perlu ada strategi untuk menangani konflik slot.

Pada fitur progress tracking, sistem perlu menghitung ulang progress mingguan ketika ada perubahan task, seperti task ditandai done, task dihapus, goal dihapus, atau task dijadwalkan ulang. Untuk MVP, jumlah pengguna dan data masih kecil, sehingga pendekatan real-time masih memungkinkan.

## Keputusan

### 1. State Management

Untuk MVP, aplikasi menggunakan React local state dengan `useState` dan `useEffect`, bukan Redux, Zustand, atau global state management library lainnya.

State dikelola dekat dengan halaman atau komponen yang membutuhkan state tersebut:

* Goals page mengelola goals, tasks per goal, task modal, AI suggestion modal, dan reschedule suggestion pada task.
* Calendar page mengelola selected task, task detail popup, AI reschedule suggestion, dan refresh key.
* Progress page mengelola selected week dan weekly progress data.

Untuk kebutuhan refresh data antar komponen, aplikasi menggunakan pendekatan `refreshKey`. Ketika terjadi perubahan seperti mark as done, delete task, atau accept reschedule, nilai `refreshKey` dinaikkan agar komponen terkait dapat melakukan fetch ulang data.

### 2. AI Reschedule Conflict Strategy

Untuk MVP, aplikasi memilih **Opsi A**, yaitu mengirim daftar task dan slot yang sudah terisi ke LLM sebagai constraint.

Backend mengirim context ke AI yang berisi:

* Overdue task yang ingin dijadwalkan ulang
* Current week tasks
* Planned date
* Planned slot
* Duration estimate
* User availability
* Preferred time
* Remaining weekly capacity

Dengan pendekatan ini, AI dapat mempertimbangkan slot yang sudah digunakan sebelum memberikan rekomendasi tanggal dan slot baru.

Namun, hasil AI tetap tidak langsung diterapkan. Sistem menggunakan strategi recommendation-first:

1. User menekan tombol Reschedule.
2. AI memberikan suggested date, suggested slot, dan reason.
3. User dapat memilih Accept atau Decline.
4. Task hanya diperbarui jika user memilih Accept.

### 3. Progress Snapshot Recalculation

Untuk MVP, progress snapshot dihitung ulang **per event** atau real-time setiap kali ada perubahan yang memengaruhi progress.

Progress akan dihitung ulang ketika:

* Task ditandai done
* Task dihapus
* Goal dihapus
* Task dijadwalkan ulang

Perhitungan ulang dilakukan melalui service `recalculateProgress`, yang menghitung ulang planned hours, completed hours, dan completion rate berdasarkan minggu dari task yang terdampak.

Batch recalculation di akhir hari tidak digunakan untuk MVP.

## Alasan

### 1. State Management

React local state dipilih karena kompleksitas aplikasi saat ini masih dapat dikelola pada level halaman. Sebagian besar state hanya digunakan di satu halaman tertentu, sehingga penggunaan global state library seperti Redux atau Zustand belum diperlukan.

Menggunakan library tambahan terlalu awal dapat menambah kompleksitas dan boilerplate. Untuk MVP, `useState`, `useEffect`, dan `refreshKey` sudah cukup untuk menjaga fitur tetap berjalan dan mudah dipahami.

Jika ke depannya lebih dari 3 sampai 4 komponen utama perlu mengakses dan mengubah state yang sama secara aktif, maka penggunaan React Context, Zustand, atau TanStack Query dapat dipertimbangkan.

### 2. AI Reschedule Conflict Strategy

Opsi A dipilih karena memberikan rekomendasi yang lebih akurat. Dengan mengirim daftar slot yang sudah terisi ke LLM, AI dapat menghindari saran yang bertabrakan dengan task lain.

Meskipun pendekatan ini menambah jumlah token yang dikirim ke LLM, jumlah data pada MVP masih kecil sehingga overhead tersebut masih dapat diterima. Pendekatan ini juga menghasilkan UX yang lebih baik dibandingkan membiarkan frontend mendeteksi konflik setelah rekomendasi dibuat.

Frontend tetap mempertahankan user control karena rekomendasi AI tidak langsung mengubah database. User harus menekan Accept sebelum task benar-benar dijadwalkan ulang.

### 3. Progress Snapshot Recalculation

Recalculate per event dipilih karena progress page perlu menampilkan data yang cukup real-time setelah user melakukan perubahan. Jika progress hanya dihitung secara batch di akhir hari, user dapat melihat progress yang tidak sesuai setelah mark task as done, delete task, atau reschedule task.

Untuk MVP, jumlah pengguna dan data masih kecil, sehingga overhead database dari recalculation per event masih dapat diterima. Pendekatan ini juga lebih sederhana dibandingkan membuat background job atau scheduler untuk batch processing.

## Konsekuensi

### Konsekuensi Positif

* State management tetap sederhana dan mudah dipahami.
* Tidak perlu menambah dependency seperti Redux atau Zustand pada MVP.
* Calendar, Goals, dan Progress page dapat berjalan dengan local state dan refresh key.
* AI reschedule lebih akurat karena menerima informasi task dan slot yang sudah terisi.
* User tetap memiliki kontrol karena AI hanya memberikan rekomendasi, bukan langsung mengubah task.
* Progress page lebih akurat karena snapshot dihitung ulang setiap ada perubahan penting.

### Konsekuensi Negatif

* Beberapa logic frontend dapat menjadi duplikat, seperti task status calculation pada Goals dan Calendar.
* Jika aplikasi bertambah besar, local state dapat menjadi sulit dikelola.
* `refreshKey` sederhana tetapi tidak sekuat state management atau server-state caching library.
* Mengirim current week tasks ke LLM menambah penggunaan token.
* Recalculate progress per event menambah query database setiap kali task berubah.
* Jika jumlah pengguna dan task meningkat, strategi recalculation perlu dievaluasi ulang.

### Revisit Plan

Keputusan ini akan ditinjau ulang ketika:

* Lebih dari 3 sampai 4 komponen perlu berbagi state yang sama secara aktif.
* Calendar, Goals, Progress, dan AI panels mulai membutuhkan sinkronisasi data yang lebih kompleks.
* Jumlah task per user meningkat dan recalculation per event mulai menyebabkan overhead database.
* AI reschedule perlu menangani banyak overdue tasks sekaligus.
* Aplikasi membutuhkan caching, optimistic update, atau background recalculation.

Pada tahap berikutnya, opsi yang dapat dipertimbangkan adalah:

* Memindahkan shared logic seperti task status calculation ke `client/src/utils`.
* Menggunakan React Context atau Zustand untuk shared UI state.
* Menggunakan TanStack Query untuk server-state fetching dan caching.
* Menggunakan background job untuk progress recalculation jika jumlah data meningkat.
