import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, documentText, customApiKey } = body;

    if (!documentText || typeof documentText !== "string" || documentText.trim() === "") {
      return NextResponse.json(
        { error: "Teks dokumen sumber tidak boleh kosong untuk memulai sesi tanya jawab." },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Riwayat chat (messages) tidak boleh kosong." },
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

    // Buat System Instruction untuk Gemini agar bertindak sebagai pakar dokumen tersebut
    const systemInstruction = `
Anda adalah AI Asisten Dokumen yang cerdas, jujur, dan membantu. Tugas utama Anda adalah menjawab pertanyaan pengguna HANYA berdasarkan informasi yang terdapat dalam Dokumen Sumber di bawah ini.

DOKUMEN SUMBER:
"""
${documentText}
"""

ATURAN PENTING:
1. Jawablah pertanyaan pengguna secara jelas, ramah, dan mendalam berdasarkan informasi dari Dokumen Sumber.
2. Jika jawaban atau informasi tidak tersedia di dalam Dokumen Sumber, Anda HARUS menjawab secara jujur dan sopan dengan memberi tahu pengguna bahwa informasi tersebut tidak ditemukan dalam dokumen (jangan mengada-ada atau berhalusinasi). Contoh: "Maaf, informasi tersebut tidak dibahas di dalam dokumen ini. Apakah ada hal lain tentang isi dokumen ini yang ingin Anda tanyakan?"
3. Jangan menjawab pertanyaan menggunakan pengetahuan eksternal Anda yang bertentangan atau tidak didukung oleh isi Dokumen Sumber.
4. Gunakan Markdown untuk memformat jawaban agar rapi (gunakan cetak tebal, list, atau paragraf terpisah).
5. Secara otomatis, tanggapi dalam bahasa yang sama dengan pertanyaan pengguna (default: Bahasa Indonesia).
`;

    // Map format pesan ke format yang diharapkan Gemini SDK
    // Format Klien: { role: 'user' | 'assistant', content: string }
    // Format Gemini: { role: 'user' | 'model', parts: [{ text: string }] }
    const geminiMessages = messages.map((msg: any) => {
      const role = msg.role === "assistant" ? "model" : "user";
      return {
        role: role,
        parts: [{ text: msg.content }]
      };
    });

    // Inisialisasi Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Gunakan gemini-2.5-flash untuk respon chat cepat dan kontekstual
    const modelInstance = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    // Lakukan pemanggilan generateContent dengan seluruh riwayat chat
    const result = await modelInstance.generateContent({
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.5,
      }
    });

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Gagal menerima balasan dari AI.");
    }

    return NextResponse.json({ reply: responseText });
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal pada server saat memproses chat." },
      { status: 500 }
    );
  }
}
