# ✨ AI Text Summarizer

Aplikasi web cerdas untuk merangkum teks panjang atau artikel menjadi ringkasan yang padat, jelas, dan profesional secara otomatis.

## 🤖 Integrasi AI (Artificial Intelligence)

Aplikasi ini ditenagai oleh **Google Gemini API**, menggunakan model terbaru yaitu `gemini-1.5-flash`. Model ini dipilih karena:
- **Kecepatan Tinggi:** Sangat cepat dalam memproses dan mengembalikan hasil ringkasan teks.
- **Pemahaman Konteks:** Mampu memahami konteks teks panjang dan mengekstrak poin-poin utama dengan akurat.
- **Format Respons yang Rapih:** Diprogram (*prompting*) untuk mengembalikan hasil yang mudah dibaca.

**Cara Kerja AI di Aplikasi Ini:**
1. Pengguna memasukkan teks panjang di *frontend* (React/Next.js).
2. Teks dikirim ke *backend* (Next.js API Route) secara aman.
3. *Backend* menyisipkan *prompt* instruksi khusus dan mengirimkannya ke server Google Gemini.
4. Gemini memproses teks, menghasilkan ringkasan, dan mengembalikannya ke layar pengguna.

## 🚀 Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI SDK:** `@google/generative-ai`

## 🛠️ Cara Menjalankan Secara Lokal (Local Setup)
Jika kamu ingin menjalankan project ini di komputermu sendiri:
1. Clone repository ini.
2. Jalankan `npm install` untuk menginstal semua *library*.
3. Buat file `.env.local` di *root folder* dan tambahkan API Key dari Google AI Studio:
   `GEMINI_API_KEY=api_key_kamu_disini`
4. Jalankan `npm run dev` dan buka `http://localhost:3000`.
