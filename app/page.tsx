"use client";

import React, { useState, useEffect, useRef } from "react";

// Struktur data Riwayat Ringkasan
interface HistoryItem {
  id: string;
  title: string;
  text: string;
  summary: string;
  timestamp: string;
  mode: string;
  tone: string;
  length: string;
  language: string;
}

// Struktur pesan Chat
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Teks contoh untuk kemudahan pengujian
const SAMPLE_TEXTS = [
  {
    title: "Teknologi AI & Masa Depan Pekerjaan",
    text: `Artificial Intelligence (AI) atau Kecerdasan Buatan telah mengalami lompatan perkembangan yang luar biasa dalam beberapa tahun terakhir. Kehadiran Generative AI seperti model bahasa besar (LLM) telah mengubah cara kerja di berbagai sektor industri, mulai dari kepenulisan, pemrograman, desain grafis, hingga analisis data keuangan. 

Banyak pihak mengkhawatirkan dampak otomatisasi ini terhadap pasar tenaga kerja manusia. Pekerjaan administratif yang repetitif terancam hilang digantikan oleh sistem AI yang lebih efisien dan murah. Namun, para ahli ekonomi dan teknologi berpendapat sebaliknya; AI tidak akan sepenuhnya menggantikan manusia, melainkan menjadi asisten pintar yang melipatgandakan produktivitas individu (copilot). Keterampilan baru seperti "Prompt Engineering" (seni memandu AI) kini menjadi sangat dicari. 

Tantangan terbesar di masa depan bukanlah ketiadaan lapangan kerja, melainkan kesenjangan keterampilan. Tenaga kerja dituntut untuk terus belajar (upskilling) dan beradaptasi agar mampu bekerja berdampingan secara harmonis dengan AI. Perusahaan yang sukses di masa depan adalah mereka yang mampu mengintegrasikan kecerdasan buatan untuk memberdayakan karyawan manusia mereka, bukan sekadar memangkas biaya operasional.`
  },
  {
    title: "Manfaat Tidur Berkualitas bagi Kesehatan",
    text: `Tidur bukan sekadar waktu istirahat pasif bagi tubuh, melainkan proses biologis aktif yang sangat krusial bagi kelangsungan fungsi kognitif dan kesehatan fisik seseorang. Berbagai penelitian ilmiah menunjukkan bahwa selama tidur, otak kita melakukan aktivitas pembersihan (glymphatic system) untuk membuang racun dan protein sisa metabolisme yang menumpuk sepanjang hari.

Secara kognitif, tidur berkualitas sangat berperan dalam konsolidasi ingatan atau memori. Informasi baru yang dipelajari pada siang hari akan disusun dan dipindahkan dari penyimpanan jangka pendek (hippocampus) ke penyimpanan jangka panjang (neocortex). Kekurangan tidur kronis terbukti menurunkan kemampuan konsentrasi, memperlambat waktu reaksi, serta meningkatkan risiko gangguan kesehatan mental seperti kecemasan dan depresi.

Bagi kesehatan fisik, tidur yang cukup (7-9 jam untuk dewasa) membantu menjaga stabilitas sistem kekebalan tubuh, regulasi hormon nafsu makan (leptin dan ghrelin), dan kesehatan kardiovaskular. Kurang tidur berkepanjangan dikaitkan dengan peningkatan risiko obesitas, diabetes tipe 2, dan penyakit jantung koroner. Oleh karena itu, investasi pada tidur berkualitas yang konsisten adalah pilar kesehatan yang setara pentingnya dengan nutrisi seimbang dan olahraga teratur.`
  }
];

export default function Home() {
  // States Utama
  const [text, setText] = useState("");
  const [mode, setMode] = useState("bullet_points");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState("Indonesian");
  
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State API Key Kustom (Client-side)
  const [customApiKey, setCustomApiKey] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);

  // State Riwayat (History)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // State Chat dengan Dokumen
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // State Tema (Dark/Light)
  const [isLightMode, setIsLightMode] = useState(false);

  // State Text-to-Speech (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Ref untuk mengotomatiskan scroll ke bawah pada chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Data dari LocalStorage saat mounted
  useEffect(() => {
    // API Key
    const savedKey = localStorage.getItem("gemini_summarizer_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
      setIsApiKeySaved(true);
    }

    // Riwayat
    const savedHistory = localStorage.getItem("gemini_summarizer_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Gagal memuat riwayat:", e);
      }
    }

    // Tema
    const isLight = localStorage.getItem("gemini_summarizer_theme") === "light";
    setIsLightMode(isLight);
    if (isLight) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  // Scroll otomatis pada chat saat pesan baru ditambahkan
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Hentikan suara TTS jika berpindah halaman atau ringkasan berubah
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [summary]);

  // Fungsi toggle tema
  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("light");
      localStorage.setItem("gemini_summarizer_theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("gemini_summarizer_theme", "dark");
    }
  };

  // Fungsi menyimpan API Key
  const saveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim() !== "") {
      localStorage.setItem("gemini_summarizer_key", key);
      setIsApiKeySaved(true);
    } else {
      localStorage.removeItem("gemini_summarizer_key");
      setIsApiKeySaved(false);
    }
    setShowSettingsModal(false);
  };

  // Pembacaan file (.txt, .md, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setText(content);
    };
    reader.onerror = () => {
      setError("Gagal membaca file tersebut.");
    };
    reader.readAsText(file);
  };

  // Handler Kirim Request Meringkas
  const handleSummarize = async () => {
    if (!text.trim()) {
      setError("Masukkan teks terlebih dahulu sebelum meringkas.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary("");
    // Reset chat
    setChatMessages([]);
    setActiveTab("summary");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          mode,
          length,
          tone,
          language,
          customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan saat meringkas dokumen.");
      }

      setSummary(data.summary);

      // Simpan riwayat baru
      const newTitle = text.trim().slice(0, 35) + (text.trim().length > 35 ? "..." : "");
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        title: newTitle,
        text: text,
        summary: data.summary,
        timestamp: new Date().toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short"
        }),
        mode,
        tone,
        length,
        language
      };

      const updatedHistory = [newItem, ...history].slice(0, 30); // Simpan maksimal 30 riwayat terakhir
      setHistory(updatedHistory);
      localStorage.setItem("gemini_summarizer_history", JSON.stringify(updatedHistory));
      setActiveHistoryId(newItem.id);

      // Inisialisasi percakapan chat baru dengan konteks dokumen tersebut
      const initialGreeting: ChatMessage = {
        role: "assistant",
        content: `Halo! Saya sudah membaca dan menganalisis dokumen Anda ("${newTitle}"). Silakan tanyakan hal apa pun yang ingin Anda ketahui dari isi dokumen ini secara detail.`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages([initialGreeting]);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Koneksi terputus. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  // Memuat item riwayat yang dipilih
  const loadHistoryItem = (item: HistoryItem) => {
    setText(item.text);
    setSummary(item.summary);
    setMode(item.mode);
    setTone(item.tone);
    setLength(item.length);
    setLanguage(item.language);
    setActiveHistoryId(item.id);
    setError(null);
    
    // Inisialisasi percakapan chat baru berdasarkan item riwayat tersebut
    const initialGreeting: ChatMessage = {
      role: "assistant",
      content: `Halo! Saya memuat ulang dokumen Anda ("${item.title}"). Silakan tanyakan poin khusus atau mintalah penjelasan mengenai isi dokumen ini.`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages([initialGreeting]);
    setActiveTab("summary");
    setShowHistorySidebar(false);
  };

  // Menghapus item riwayat tertentu
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("gemini_summarizer_history", JSON.stringify(updatedHistory));
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
  };

  // Menghapus seluruh riwayat
  const clearAllHistory = () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat pencarian?")) {
      setHistory([]);
      localStorage.removeItem("gemini_summarizer_history");
      setActiveHistoryId(null);
    }
  };

  // Salin ringkasan ke clipboard
  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
    alert("Ringkasan berhasil disalin ke papan klip!");
  };

  // Ekspor ringkasan sebagai file teks
  const handleExportText = (type: "md" | "txt") => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `summary-${activeHistoryId || "doc"}.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fungsi Chat (Tanya Jawab Dokumen)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const messagesHistory = [...chatMessages, userMsg].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesHistory,
          documentText: text, // Kirim seluruh dokumen asli sebagai konteks
          customApiKey,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mendapatkan balasan dari AI.");
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `⚠️ Kesalahan: ${err?.message || "Koneksi bermasalah saat memproses pesan Anda."}`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Text-To-Speech (Membacakan Ringkasan)
  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Browser Anda tidak mendukung fitur Text-to-Speech.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Bersihkan penanda tag Markdown dari teks agar dibaca dengan natural
    const cleanText = summary
      .replace(/[#*`>_\-]/g, "") // Hapus karakter markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // Ubah link markdown menjadi teks saja

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Pilih suara bahasa Indonesia jika tersedia, atau sesuaikan dengan target bahasa
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(voice => voice.lang.includes("id") || voice.lang.includes("ID"));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    } else {
      // Atur bahasa umum sesuai target ringkasan
      if (language === "English") utterance.lang = "en-US";
      else utterance.lang = "id-ID";
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechUtteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Fungsi Parser Markdown Kustom ke Elemen React JSX
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    
    const lines = md.split("\n");
    const elements: React.ReactNode[] = [];
    
    let inList = false;
    let listType: "ul" | "ol" | null = null;
    let currentListItems: React.ReactNode[] = [];
    
    const flushList = (key: number) => {
      if (listType === "ul") {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 mb-4 space-y-2 text-foreground/90">
            {...currentListItems}
          </ul>
        );
      } else if (listType === "ol") {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 mb-4 space-y-2 text-foreground/90">
            {...currentListItems}
          </ol>
        );
      }
      currentListItems = [];
      inList = false;
      listType = null;
    };
    
    const formatInlineText = (textStr: string) => {
      const parts: React.ReactNode[] = [];
      const regex = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
      let match;
      let lastIndex = 0;
      
      while ((match = regex.exec(textStr)) !== null) {
        if (match.index > lastIndex) {
          parts.push(textStr.substring(lastIndex, match.index));
        }
        
        if (match[1]) {
          // Inline Code
          parts.push(
            <code key={`code-${match.index}`} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-blue-500 dark:text-blue-400">
              {match[1]}
            </code>
          );
        } else if (match[2]) {
          // Bold
          parts.push(
            <strong key={`bold-${match.index}`} className="font-bold text-foreground">
              {match[2]}
            </strong>
          );
        } else if (match[3]) {
          // Italic
          parts.push(
            <em key={`em-${match.index}`} className="italic">
              {match[3]}
            </em>
          );
        }
        
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < textStr.length) {
        parts.push(textStr.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : textStr;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === "") {
        if (inList) flushList(i);
        continue;
      }
      
      if (line.startsWith("# ")) {
        if (inList) flushList(i);
        elements.push(
          <h1 key={i} className="text-2xl font-bold mt-6 mb-3 text-foreground tracking-tight">
            {formatInlineText(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        if (inList) flushList(i);
        elements.push(
          <h2 key={i} className="text-xl font-bold mt-5 mb-3 border-b border-border pb-1 text-foreground tracking-tight">
            {formatInlineText(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        if (inList) flushList(i);
        elements.push(
          <h3 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {formatInlineText(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith("> ")) {
        if (inList) flushList(i);
        elements.push(
          <blockquote key={i} className="border-l-4 border-blue-500 pl-4 py-1.5 my-4 italic text-muted-foreground bg-muted/30 rounded-r-md">
            {formatInlineText(line.slice(2))}
          </blockquote>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        if (!inList || listType !== "ul") {
          if (inList) flushList(i);
          inList = true;
          listType = "ul";
        }
        currentListItems.push(
          <li key={`li-${i}`} className="leading-relaxed">
            {formatInlineText(line.slice(2))}
          </li>
        );
      } else if (/^\d+\.\s/.test(line)) {
        if (!inList || listType !== "ol") {
          if (inList) flushList(i);
          inList = true;
          listType = "ol";
        }
        const match = line.match(/^\d+\.\s/);
        const itemText = line.slice(match![0].length);
        currentListItems.push(
          <li key={`li-${i}`} className="leading-relaxed">
            {formatInlineText(itemText)}
          </li>
        );
      } else if (line.startsWith("```")) {
        if (inList) flushList(i);
        let codeText = "";
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeText += lines[i] + "\n";
          i++;
        }
        elements.push(
          <pre key={i} className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-xs font-mono my-4 border border-zinc-800 text-zinc-300">
            <code>{codeText.trim()}</code>
          </pre>
        );
      } else {
        if (inList) flushList(i);
        elements.push(
          <p key={i} className="mb-4 leading-relaxed text-foreground/90 text-justify sm:text-left">
            {formatInlineText(line)}
          </p>
        );
      }
    }
    
    if (inList) flushList(lines.length);
    
    return <div className="prose-custom">{elements}</div>;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* HEADER UTAMA */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistorySidebar(true)}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors md:hidden"
              title="Lihat Riwayat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                G
              </div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent sm:text-xl">
                Gemini Summarizer Hub
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status API Key Indicator */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isApiKeySaved 
                  ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isApiKeySaved ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}></span>
              <span className="hidden sm:inline">{isApiKeySaved ? "API Key Kustom Tersimpan" : "Gunakan API Key Server"}</span>
              <span className="sm:hidden">API</span>
            </button>

            {/* Toggle Riwayat Desktop */}
            <button 
              onClick={() => setShowHistorySidebar(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Riwayat ({history.length})
            </button>

            {/* Tombol Pengaturan (API Key) */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              title="Pengaturan API Key"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Tombol Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
              title={isLightMode ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
            >
              {isLightMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.07 7.07m2.828 2.828l-.707.707M6.343 6.343l-.707.707" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD UTAMA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* KOLOM KIRI: INPUT & SETTINGS */}
        <section className="flex flex-col gap-5 h-full">
          <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col flex-1 gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dokumen Sumber
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setText(SAMPLE_TEXTS[0].text)}
                  className="text-xs text-blue-500 hover:underline hover:text-blue-600 font-medium"
                >
                  Contoh 1
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  onClick={() => setText(SAMPLE_TEXTS[1].text)}
                  className="text-xs text-blue-500 hover:underline hover:text-blue-600 font-medium"
                >
                  Contoh 2
                </button>
              </div>
            </div>

            {/* Input Text Area & Upload */}
            <div className="relative flex-1 flex flex-col min-h-[300px]">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tempelkan teks dokumen panjang Anda di sini atau gunakan berkas unggahan di bawah..."
                className="w-full flex-1 p-4 rounded-xl bg-background/50 border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm leading-relaxed"
              />
              {text.trim() === "" && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 opacity-50 p-6 text-center">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Drag & Drop file di sini atau klik tombol "Unggah File" di bawah
                  </p>
                </div>
              )}
            </div>

            {/* Kontrol di bawah textarea */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40">
              {/* Jumlah Kata/Karakter */}
              <div className="text-xs text-muted-foreground">
                <span>{text.trim() === "" ? 0 : text.trim().split(/\s+/).length} kata</span>
                <span className="mx-2">•</span>
                <span>{text.length} karakter</span>
              </div>
              
              {/* Unggah Berkas */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Unggah Berkas (.txt, .md, .json)
                <input
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Panel Setelan Ringkasan */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Mode Ringkasan</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="bullet_points">Poin Penting (Bullet Points)</option>
                  <option value="executive">Ringkasan Eksekutif</option>
                  <option value="study_guide">Panduan Belajar</option>
                  <option value="eli5">Penjelasan Sederhana (ELI5)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Panjang Ringkasan</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="short">Singkat (50-100 kata)</option>
                  <option value="medium">Sedang (150-300 kata)</option>
                  <option value="long">Panjang & Detail</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nada Bahasa</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="professional">Profesional & Formal</option>
                  <option value="casual">Kasual & Friendly</option>
                  <option value="academic">Akademis & Analitis</option>
                  <option value="creative">Kreatif & Menarik</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Bahasa Output</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  <option value="Indonesian">Bahasa Indonesia</option>
                  <option value="English">Bahasa Inggris (English)</option>
                  <option value="Spanish">Bahasa Spanyol (Español)</option>
                  <option value="Japanese">Bahasa Jepang (日本語)</option>
                  <option value="Arabic">Bahasa Arab (العربية)</option>
                </select>
              </div>
            </div>

            {/* Tombol Aksi */}
            <button
              onClick={handleSummarize}
              disabled={isLoading || text.trim() === ""}
              className="w-full py-3.5 px-6 rounded-xl font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menganalisis & Meringkas Dokumen...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Buat Ringkasan AI
                </>
              )}
            </button>
          </div>
        </section>

        {/* KOLOM KANAN: WORKSPACE OUTPUT (RINGKASAN ATAU CHAT) */}
        <section className="flex flex-col gap-5 h-full">
          <div className="glass-panel rounded-2xl shadow-xl flex flex-col flex-1 h-full min-h-[450px]">
            
            {/* Header Tabs */}
            <div className="flex border-b border-border bg-muted/20 p-2 rounded-t-2xl">
              <button
                onClick={() => setActiveTab("summary")}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === "summary"
                    ? "bg-background shadow text-blue-500 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Hasil Ringkasan
              </button>
              
              <button
                onClick={() => setActiveTab("chat")}
                disabled={chatMessages.length === 0}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:pointer-events-none ${
                  activeTab === "chat"
                    ? "bg-background shadow text-blue-500 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Diskusi dengan AI
                {chatMessages.length > 1 && (
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {chatMessages.length - 1}
                  </span>
                )}
              </button>
            </div>

            {/* Isi Konten Tab */}
            <div className="flex-1 p-5 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-320px)] flex flex-col">
              {error && (
                <div className="p-4 mb-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-start gap-2.5 animate-fadeIn">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-bold">Gagal memproses</h4>
                    <p className="mt-1 opacity-90 leading-relaxed text-xs sm:text-sm">{error}</p>
                  </div>
                </div>
              )}

              {activeTab === "summary" ? (
                /* TAB RINGKASAN */
                summary ? (
                  <div className="flex flex-col flex-1 gap-5">
                    {/* Header Ringkasan Aksi */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-2">
                        {/* Tombol TTS */}
                        <button
                          onClick={handleToggleSpeech}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                            isSpeaking 
                              ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20" 
                              : "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                              </svg>
                              Hentikan Suara
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              Dengarkan Ringkasan
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {/* Salin */}
                        <button
                          onClick={handleCopySummary}
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Salin ke Clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                        {/* Download MD */}
                        <button
                          onClick={() => handleExportText("md")}
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold flex items-center gap-1"
                          title="Ekspor sebagai Markdown (.md)"
                        >
                          MD
                        </button>
                        {/* Download TXT */}
                        <button
                          onClick={() => handleExportText("txt")}
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold flex items-center gap-1"
                          title="Ekspor sebagai Teks (.txt)"
                        >
                          TXT
                        </button>
                      </div>
                    </div>

                    {/* Ringkasan Markdown Ter-render */}
                    <div className="flex-1 bg-background/30 rounded-xl p-4 border border-border/40 shadow-inner">
                      {renderMarkdown(summary)}
                    </div>
                  </div>
                ) : (
                  /* KONDISI AWAL KOSONG */
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-65 p-8 my-auto">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 mb-4 animate-pulse-slow">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.07-7.07l2.828 2.828M12 21v-1m6.364-1.636l-.707-.707M6.343 6.343l-.707-.707" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">Menunggu Ringkasan</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
                      Masukkan teks di sebelah kiri lalu klik tombol <strong>"Buat Ringkasan AI"</strong> untuk menampilkan ringkasan dokumen.
                    </p>
                  </div>
                )
              ) : (
                /* TAB CHAT */
                <div className="flex flex-col flex-1 h-full min-h-[350px]">
                  {/* Daftar Pesan Chat */}
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 pb-4">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col max-w-[85%] ${
                          msg.role === "user" ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        {/* Pengirim */}
                        <span className="text-[10px] text-muted-foreground font-semibold mb-1 px-1">
                          {msg.role === "user" ? "Anda" : "Gemini AI"} • {msg.timestamp}
                        </span>
                        
                        {/* Balon Pesan */}
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-muted text-foreground rounded-tl-none border border-border/60"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            renderMarkdown(msg.content)
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Indikator Chat Sedang Berpikir */}
                    {isChatLoading && (
                      <div className="self-start flex flex-col max-w-[85%] items-start">
                        <span className="text-[10px] text-muted-foreground font-semibold mb-1 px-1">
                          Gemini AI sedang mengetik...
                        </span>
                        <div className="bg-muted p-4 rounded-2xl rounded-tl-none border border-border/60 flex items-center justify-center min-w-[70px] min-h-[40px]">
                          <div className="dot-typing"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Form Pengiriman Pesan */}
                  <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-border flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatLoading}
                      placeholder="Tanyakan sesuatu tentang dokumen ini..."
                      className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isChatLoading}
                      className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border/60 bg-muted/10 py-4 text-center mt-auto">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AI Summarizer & Chat Hub. Ditenagai oleh Google Gemini API.
        </p>
      </footer>

      {/* MODAL SETTINGS (API KEY) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative bg-card animate-scaleUp">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m0-4a2 2 0 01-2-2m0 2a2 2 0 012-2m3 5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pengaturan API Key
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Secara default, aplikasi akan mencoba menggunakan API Key yang dikonfigurasi di server (file `.env.local`). Jika tidak ada atau ingin menggunakan API Key milik Anda sendiri secara aman, silakan masukkan di bawah (disimpan secara lokal di peramban Anda).
            </p>

            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-semibold text-muted-foreground">Google Gemini API Key</label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Masukkan API Key Gemini Anda (AIzaSy...)"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => saveApiKey("")}
                className="px-4 py-2 border border-border hover:bg-muted rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Hapus Key Kustom
              </button>
              <button
                onClick={() => saveApiKey(customApiKey)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR RIWAYAT (PANEL GESER) */}
      {showHistorySidebar && (
        <div className="fixed inset-0 z-50 flex justify-start bg-zinc-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-80 h-full border-r border-border bg-card shadow-2xl relative flex flex-col p-5 animate-slideRight">
            
            {/* Header Sidebar */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Riwayat Ringkasan
              </h3>
              <button
                onClick={() => setShowHistorySidebar(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* List Riwayat */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
              {history.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground opacity-75">
                  Belum ada riwayat dokumen yang diringkas.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={`group p-3 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start gap-2 ${
                      activeHistoryId === item.id
                        ? "bg-blue-500/5 border-blue-500/30"
                        : "bg-muted/40 border-border/60 hover:bg-muted hover:border-border"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate group-hover:text-blue-500 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <span>{item.timestamp}</span>
                        <span>•</span>
                        <span className="capitalize">{item.mode.replace("_", " ")}</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      title="Hapus dari riwayat"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Tombol Clear All */}
            {history.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="w-full mt-4 py-2 bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 text-destructive text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Hapus Semua Riwayat
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
