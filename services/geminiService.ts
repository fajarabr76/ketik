import { GoogleGenAI, Chat } from "@google/genai";
import { SessionConfig } from "../types";

let chatSession: Chat | null = null;

export const initializeChat = async (config: SessionConfig) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing from environment variables.");
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Aggregate all images from all selected scenarios
  const allImages = config.scenarios.flatMap(s => s.images || []);
  const hasImages = allImages.length > 0;
  
  // Construct dynamic scenario descriptions for the AI
  let imageIndexOffset = 0;
  const scenarioDescriptions = config.scenarios.map((s, index) => {
      const imgCount = s.images?.length || 0;
      const imgIndices = imgCount > 0 
        ? Array.from({length: imgCount}, (_, k) => imageIndexOffset + k).join(', ')
        : 'Tidak ada';
      
      const desc = `
      MASALAH KE-${index + 1}:
      Kategori: ${s.category}
      Judul: ${s.title}
      Detail: ${s.description}
      ${s.script ? `Skrip Referensi (Improvisasi Diizinkan sesuai karakter): ${s.script}` : ''}
      ${imgCount > 0 ? `Bukti Gambar tersedia pada index: [${imgIndices}]` : ''}
      `;
      
      imageIndexOffset += imgCount;
      return desc;
  }).join('\n\n----------------\n\n');

  const imageInstructions = hasImages 
    ? `
    INSTRUKSI KHUSUS UNTUK GAMBAR/BUKTI:
    Total ada ${allImages.length} gambar bukti yang tersimpan di sistem untuk sesi ini.
    Jika agen meminta bukti foto atau jika konteks masalah mengharuskan Anda mengirim gambar,
    Gunakan tag khusus ini dalam respons Anda: [SEND_IMAGE: nomor_index].
    
    Contoh: "Ini bukti transfernya [SEND_IMAGE: 0]"
    Pastikan Anda mengirim gambar yang sesuai dengan MASALAH yang sedang dibahas (lihat daftar index gambar di atas).
    ` 
    : "Tidak ada gambar bukti yang tersedia untuk sesi ini.";

  const systemInstruction = `
    Anda adalah simulator konsumen untuk pelatihan agen Contact Center di Kontak OJK 157 layanan Chat Whatsapp.
    
    INFORMASI IDENTITAS ANDA (WAJIB DIGUNAKAN):
    Nama Profil: ${config.identity.name}
    ${config.identity.signatureName ? `Nama Panggilan/Singkat (Gunakan ini saat memperkenalkan diri): ${config.identity.signatureName}` : ''}
    Kota: ${config.identity.city}
    Nomor HP: ${config.identity.phone}

    PERAN ANDA:
    Tipe Konsumen: ${config.consumerType.name}
    Deskripsi Karakter: ${config.consumerType.description}
    
    ANDA MEMILIKI ${config.scenarios.length} PERMASALAHAN YANG INGIN DIADUKAN HARI INI.
    BERIKUT DAFTARNYA:
    
    ${scenarioDescriptions}

    ${imageInstructions}

    ATURAN URUTAN & PENYAMPAIAN MASALAH (PENTING):
    1. Mulai percakapan dengan membahas MASALAH KE-1.
    2. Fokus selesaikan Masalah ke-1 terlebih dahulu. JANGAN mencampuradukkan dengan masalah lain di awal.
    3. Setelah Agen memberikan solusi untuk Masalah ke-1 atau bertanya "Ada lagi yang bisa dibantu?", BARU Anda sampaikan MASALAH KE-2 (dan seterusnya secara berurutan).
    4. Lakukan transisi yang natural antar masalah. Contoh: "Oh iya mbak/mas, ada satu lagi kendala saya..."
    5. JANGAN memulai percakapan di awal sesi (chat pertama). Tunggu agen menyapa Anda.
    
    ATURAN UMUM:
    - PADA RESPONS PERTAMA (setelah disapa): Perkenalkan diri (Nama Panggilan/Singkat jika ada) dan sampaikan keluhan pertama.
    - GAYA BICARA: Natural seperti chat WhatsApp orang Indonesia (singkatan, emotikon, sesuai karakter).
    - FORMAT PESAN: Bagi respon panjang menjadi pesan-pesan pendek dengan pemisah "[BREAK]".
    - Tetap dalam karakter hingga semua masalah tersampaikan atau sesi diakhiri agen.
    - JIKA ADA SKRIP: Gunakan sebagai panduan alur, namun Anda harus membahasakannya kembali (parafrase/improvisasi) sesuai gaya bicara karakter Anda.
  `;

  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });
  } catch (error) {
    console.error("Failed to create chat session:", error);
    throw error;
  }
};

export const sendMessageToAI = async (message: string): Promise<string> => {
  if (!chatSession) {
    console.warn("Attempted to send message without initialized session.");
    return "[SISTEM] Sesi belum siap. Silakan mulai ulang latihan.";
  }

  try {
    const response = await chatSession.sendMessage({ message });
    return response.text || "Konsumen tidak memberikan respons.";
  } catch (error: any) {
    console.error("Error during Gemini API call:", error);
    
    // Check for specific error codes or messages
    // Error object from GoogleGenAI usually contains details in a structured format or message string
    let errorMessage = "";
    try {
        errorMessage = JSON.stringify(error);
    } catch {
        errorMessage = String(error);
    }

    if (errorMessage.includes("API_KEY_INVALID")) {
      return "[SISTEM] Kunci API tidak valid. Periksa konfigurasi sistem.";
    }
    
    // Check for 429 Resource Exhausted (Quota exceeded)
    if (
        errorMessage.includes("429") || 
        errorMessage.includes("quota") || 
        errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
        return "[SISTEM] ⚠️ Kuota API Terlampaui (Error 429). Batas penggunaan harian atau per menit telah habis. Mohon tunggu beberapa saat atau periksa billing Google AI Studio Anda.";
    }

    // Check for 503 Service Unavailable (Overloaded)
    if (errorMessage.includes("503") || errorMessage.includes("overloaded")) {
        return "[SISTEM] ⚠️ Server Google AI sedang sibuk. Mohon kirim ulang pesan Anda.";
    }
    
    return "[SISTEM] Maaf, terjadi gangguan koneksi ke AI. Silakan coba lagi.";
  }
};