# ADR-001: Menggunakan Gemini API sebagai LLM untuk AI Suggestion Engine

## Status

Accepted

## Konteks

Aplikasi AI Learning Plan membutuhkan fitur AI suggestion engine yang dapat membantu pengguna memecah goal belajar menjadi task mingguan yang lebih kecil, realistis, dan sesuai dengan preferensi pengguna.

Fitur ini membutuhkan model AI yang dapat menerima konteks seperti goal, availability, preferred time, weekly target hours, dan existing tasks, lalu menghasilkan output berupa daftar task yang terstruktur.

Output AI harus dapat digunakan oleh sistem, sehingga format response perlu konsisten dan bisa divalidasi sebelum dikirim ke frontend.

## Keputusan

Kami memutuskan untuk menggunakan Gemini API sebagai LLM provider untuk menghasilkan saran task belajar mingguan.

Backend memanggil Gemini melalui service `llm.js`. Output dari LLM diminta dalam format JSON dan divalidasi menggunakan Zod schema sebelum digunakan oleh aplikasi.

Sistem juga menyediakan mode `mock` melalui konfigurasi `LLM_PROVIDER=mock` untuk development dan testing tanpa menggunakan quota API.

## Alasan

Gemini API dipilih karena mudah diintegrasikan dengan Node.js dan sesuai dengan kebutuhan proyek untuk menghasilkan rekomendasi berbasis teks.

Pendekatan schema-first digunakan agar output AI lebih aman dan konsisten. Dengan validasi schema, backend dapat menolak response AI yang tidak sesuai format, misalnya jika field task tidak lengkap, duration estimate di luar batas, atau planned slot tidak valid.

Mode mock digunakan agar proses development tetap cepat dan tidak selalu bergantung pada koneksi API eksternal.

## Konsekuensi

Keuntungan dari keputusan ini:

- Aplikasi dapat menghasilkan task suggestion berdasarkan konteks pengguna.
- Output AI divalidasi sebelum digunakan.
- Mode mock memudahkan testing tanpa memakai quota API.
- Human-in-the-loop tetap dipertahankan karena user harus menerima task sebelum disimpan.

Konsekuensi atau risiko:

- Response dari LLM tidak selalu konsisten, sehingga perlu validasi dan retry.
- Aplikasi bergantung pada ketersediaan Gemini API ketika mode real digunakan.
- Prompt perlu terus diperbaiki agar output lebih relevan dan sesuai dengan week_start.
- API key harus dikelola dengan aman melalui environment variable.
