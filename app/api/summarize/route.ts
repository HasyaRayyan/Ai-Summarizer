import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, mode, length, tone, language, customApiKey } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Teks sumber tidak boleh kosong." },
        { status: 400 }
      );
    }

    // Ambil API Key dari customApiKey (klien) atau dari environment variable (server)
    const apiKey = (customApiKey && customApiKey.trim() !== "") 
      ? customApiKey 
      : process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      return NextResponse.json(
        { 
          error: "API Key Gemini tidak ditemukan atau tidak valid. Silakan masukkan API Key Gemini Anda sendiri di menu Pengaturan (ikon roda gigi) di pojok kanan atas." 
        },
        { status: 401 }
      );
    }

    // Definisikan instruksi berdasarkan mode
    let modeInstruction = "";
    switch (mode) {
      case "bullet_points":
        modeInstruction = "Berikan poin-poin penting dan kesimpulan utama dalam daftar poin (bullet points) yang terstruktur, rapi, dan mudah dibaca.";
        break;
      case "executive":
        modeInstruction = "Berikan Ringkasan Eksekutif (Executive Summary). Mulailah dengan paragraf ringkasan tingkat tinggi, diikuti oleh analisis singkat tentang implikasi atau temuan utama.";
        break;
      case "study_guide":
        modeInstruction = "Buat panduan belajar (Study Guide) yang terperinci. Bagi menjadi beberapa bagian: Istilah Kunci (Vocabulary), Konsep Utama, Penjelasan Mendalam, dan Pertanyaan Evaluasi singkat.";
        break;
      case "eli5":
        modeInstruction = "Jelaskan isi teks seperti menjelaskan kepada anak berusia 5 tahun (Explain Like I'm 5). Gunakan bahasa yang sangat sederhana, analogi sehari-hari, dan kalimat yang pendek.";
        break;
      default:
        modeInstruction = "Berikan ringkasan umum yang mencakup semua aspek penting dari teks tersebut.";
    }

    // Definisikan instruksi berdasarkan panjang ringkasan
    let lengthInstruction = "";
    switch (length) {
      case "short":
        lengthInstruction = "Ringkasan harus sangat singkat dan padat (sekitar 50-100 kata).";
        break;
      case "medium":
        lengthInstruction = "Ringkasan harus berukuran sedang (sekitar 150-300 kata).";
        break;
      case "long":
        lengthInstruction = "Ringkasan harus detail, komprehensif, dan menyeluruh (sekitar 400-600 kata).";
        break;
      default:
        lengthInstruction = "Ringkasan berukuran sedang.";
    }

    // Definisikan instruksi berdasarkan nada/tone
    let toneInstruction = "";
    switch (tone) {
      case "professional":
        toneInstruction = "Gunakan nada bahasa yang profesional, formal, sopan, dan berorientasi bisnis.";
        break;
      case "casual":
        toneInstruction = "Gunakan nada bahasa yang ramah, kasual, santai, dan mudah dipahami.";
        break;
      case "academic":
        toneInstruction = "Gunakan nada bahasa yang objektif, akademis, analitis, dan menggunakan terminologi yang tepat.";
        break;
      case "creative":
        toneInstruction = "Gunakan nada bahasa yang menarik, kreatif, hidup, dan imajinatif.";
        break;
      default:
        toneInstruction = "Gunakan nada bahasa yang netral.";
    }

    // Gabungkan ke dalam satu sistem prompt
    const prompt = `
Anda adalah AI asisten perangkum dokumen yang sangat ahli dan profesional. Tugas Anda adalah menganalisis teks sumber di bawah ini dan menghasilkan ringkasan berkualitas tinggi berdasarkan kriteria berikut:

- Format/Mode Ringkasan: ${modeInstruction}
- Panjang Ringkasan: ${lengthInstruction}
- Nada/Gaya Bahasa: ${toneInstruction}
- Bahasa Output: Tulis seluruh hasil ringkasan strictly dalam bahasa: ${language || "Bahasa Indonesia"}

PENTING: Pastikan untuk mempertahankan fakta penting, angka, nama, dan detail krusial dari teks asli. Jangan menambahkan informasi luar atau asumsi yang tidak ada di teks sumber. Format output harus menggunakan Markdown yang indah, rapi, dan mudah dibaca (gunakan judul, tebal, list jika diperlukan).

Teks Sumber:
"""
${text}
"""

Hasil Ringkasan (Markdown):
`;

    // Inisialisasi Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Menggunakan gemini-2.5-flash sebagai model default
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await modelInstance.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4, // Suhu agak rendah untuk menjaga akurasi fakta
      }
    });

    const response = result.response;
    const summaryText = response.text();

    if (!summaryText) {
      throw new Error("Gagal menerima respons dari Gemini AI.");
    }

    return NextResponse.json({ summary: summaryText });
  } catch (error: any) {
    console.error("Error in summarize route:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal pada server saat meringkas dokumen." },
      { status: 500 }
    );
  }
}
