# Estimasi Biaya Penggunaan AI per 100 Saran

## Tujuan

Dokumen ini menjelaskan estimasi biaya penggunaan AI untuk fitur PlanIt, khususnya fitur:

* AI task suggestion
* AI reschedule suggestion

Estimasi ini dibuat agar biaya penggunaan LLM dapat dipantau sejak tahap MVP, meskipun angka masih bersifat perkiraan dan dapat berubah sesuai harga resmi provider AI.

---

## Model yang Digunakan

Pada MVP ini, aplikasi menggunakan Gemini API melalui konfigurasi:

```env
LLM_PROVIDER=gemini
```

Model yang digunakan pada backend:

```js
gemini-2.5-flash
```

Untuk development dan testing, aplikasi juga menyediakan mode mock:

```env
LLM_PROVIDER=mock
```

Mode mock tidak memanggil Gemini API sehingga tidak menghasilkan biaya token.

---

## Asumsi Perhitungan

Estimasi biaya dihitung berdasarkan asumsi rata-rata token per satu permintaan AI.

### 1. AI Task Suggestion

Satu request AI task suggestion berisi context seperti:

* Goal title
* Goal description
* Deadline
* Availability
* Preferred time
* Weekly target hours
* Existing tasks

Estimasi rata-rata:

| Komponen                  | Estimasi Token |
| ------------------------- | -------------: |
| Input context dan prompt  |    2,000 token |
| Output AI task suggestion |      800 token |

### 2. AI Reschedule Suggestion

Satu request AI reschedule berisi context seperti:

* Overdue task
* Current week tasks
* Planned date dan planned slot
* Availability
* Preferred time
* Remaining weekly capacity

Estimasi rata-rata:

| Komponen                        | Estimasi Token |
| ------------------------------- | -------------: |
| Input context dan prompt        |    1,500 token |
| Output AI reschedule suggestion |      300 token |

---

## Harga Referensi

Berdasarkan dokumentasi harga Gemini Developer API, Gemini 2.5 Flash Standard paid tier memiliki harga:

| Jenis Token  |                        Harga |
| ------------ | ---------------------------: |
| Input token  | USD 0.30 per 1,000,000 token |
| Output token | USD 2.50 per 1,000,000 token |

Catatan: Harga dapat berubah sewaktu-waktu mengikuti pricing resmi Google Gemini API. Jika model diganti, estimasi biaya juga harus diperbarui.

---

## Estimasi Biaya per 100 AI Task Suggestions

Asumsi per request:

* Input: 2,000 token
* Output: 800 token

Untuk 100 request:

| Jenis Token | Perhitungan | Total Token |
| ----------- | ----------: | ----------: |
| Input       | 2,000 × 100 |     200,000 |
| Output      |   800 × 100 |      80,000 |

Estimasi biaya:

| Jenis Token |                    Perhitungan |    Biaya |
| ----------- | -----------------------------: | -------: |
| Input       | 200,000 / 1,000,000 × USD 0.30 | USD 0.06 |
| Output      |  80,000 / 1,000,000 × USD 2.50 | USD 0.20 |

Total estimasi biaya untuk 100 AI task suggestions:

```text
USD 0.06 + USD 0.20 = USD 0.26
```

Jadi, estimasi biaya untuk 100 AI task suggestions adalah sekitar:

```text
USD 0.26
```

---

## Estimasi Biaya per 100 AI Reschedule Suggestions

Asumsi per request:

* Input: 1,500 token
* Output: 300 token

Untuk 100 request:

| Jenis Token | Perhitungan | Total Token |
| ----------- | ----------: | ----------: |
| Input       | 1,500 × 100 |     150,000 |
| Output      |   300 × 100 |      30,000 |

Estimasi biaya:

| Jenis Token |                    Perhitungan |     Biaya |
| ----------- | -----------------------------: | --------: |
| Input       | 150,000 / 1,000,000 × USD 0.30 | USD 0.045 |
| Output      |  30,000 / 1,000,000 × USD 2.50 | USD 0.075 |

Total estimasi biaya untuk 100 AI reschedule suggestions:

```text
USD 0.045 + USD 0.075 = USD 0.12
```

Jadi, estimasi biaya untuk 100 AI reschedule suggestions adalah sekitar:

```text
USD 0.12
```

---

## Estimasi Gabungan

Jika 100 penggunaan terdiri dari:

* 50 AI task suggestions
* 50 AI reschedule suggestions

Maka estimasi biaya:

| Fitur                    | Estimasi Biaya untuk 50 Request |
| ------------------------ | ------------------------------: |
| AI task suggestion       |                        USD 0.13 |
| AI reschedule suggestion |                        USD 0.06 |

Total estimasi biaya gabungan:

```text
USD 0.19 per 100 mixed AI suggestions
```

---

## Strategi Pengendalian Biaya

Untuk menjaga biaya AI tetap rendah, MVP menggunakan beberapa strategi:

1. **Mock Mode untuk Development**

   Saat development, `LLM_PROVIDER=mock` digunakan agar tidak selalu memanggil Gemini API.

2. **Context Sanitization**

   Context disanitasi agar hanya data relevan yang dikirim ke LLM. Field seperti `email`, `name`, dan `phone` dihapus.

3. **Context Ringkas**

   Backend hanya mengirim data yang dibutuhkan, seperti goal, availability, existing tasks, overdue task, dan remaining capacity.

4. **Validasi Output AI**

   Output AI divalidasi. Jika output tidak valid, sistem hanya melakukan retry terbatas agar tidak boros token.

5. **Human-in-the-loop**

   AI hanya memberikan rekomendasi. Perubahan jadwal hanya terjadi jika user memilih Accept.

---

## Catatan

Estimasi ini menggunakan asumsi jumlah token rata-rata. Biaya aktual dapat berbeda tergantung:

* Panjang goal description
* Jumlah existing tasks
* Panjang availability context
* Panjang output AI
* Model Gemini yang digunakan
* Perubahan harga resmi dari provider AI

Dokumen ini perlu diperbarui jika model AI, prompt, atau pricing berubah.
