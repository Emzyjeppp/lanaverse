# Lanaverse 🌌
> **The Ultimate Lana JKT48 Fan Portal & Interactive Clicker Game**

Lanaverse adalah sebuah aplikasi web Single Page Application (SPA) interaktif yang dirancang khusus untuk para penggemar **Lana JKT48** (Aurhel Alana) dari Generasi 12 JKT48. Aplikasi ini mengintegrasikan portal fansite, game clicker bertema idol, sistem gacha kotak misteri (glowing chests), galeri kartu foto langka (Real Photocard), dan simulasi pembayaran iuran kas fansite bulanan via QRIS.

Aplikasi ini menggunakan foto asli hasil fansite (*real camera shots*) dari koleksi fansite Lana JKT48.

---

## ✨ Fitur Utama (Core Features)

1. **🔑 Autentikasi Instan & Otomatis (1 Member, 1 Akun)**
   - Klik satu tombol untuk mendaftarkan akun penggemar secara acak (misal: `LanaFans_7294`) secara instan.
   - Data akun, progres klik, upgrade, tiket, dan galeri tersimpan secara persisten di browser (`LocalStorage`).

2. **🎮 Game Clicker "Kumpulkan Cinta Lana"**
   - Klik avatar Lana JKT48 untuk menghasilkan koin cinta.
   - Dilengkapi mikro-animasi partikel hati melayang.
   - **Toko Peningkatan (Shop Upgrade)**: Beli item fansite (*Lana Lightstick*, *Lensa Kamera Tele*, *Spanduk Fansite*, *Sorakan Theater*, *Maskot*) menggunakan koin untuk meningkatkan koin per klik (CPC) atau koin pasif per detik (CPS).
   - Milestone Klik: Dapatkan 1 Tiket Gacha gratis setiap 200 klik!

3. **📦 Gacha Kotak Spesial (3 Box Chests)**
   - Buka 3 kotak misteri (Ungu, Emas, Pink) menggunakan Tiket Gacha untuk mendapatkan foto rare Lana.
   - Dilengkapi efek getar peti dan animasi buka kartu 3D flip card.
   - **Probabilitas Rarity**: Common (60%), Rare (30%), Ultra Rare (10%).

4. **💳 Portal Pembayaran Kas Bulanan (VIP Premium)**
   - Simulasi kontribusi dana kas fansite bulanan (iuran virtual) sebesar Rp 15.000,-.
   - Menampilkan kode QRIS simulasi yang dirancang estetis.
   - Area unggah bukti transfer (screenshot/foto) dengan fitur Drag & Drop berkas.
   - Simulasi verifikasi instan (waktu tunggu 3 detik dengan progress bar dan status transisi admin).
   - **Keuntungan VIP**: Multiplier koin klik 2x lipat, +10 Tiket Gacha gratis, dan membuka Kartu Eksklusif VIP di Galeri.

5. **🖼️ Galeri Koleksi Album Foto Rare**
   - Album koleksi kartu foto digital Lana JKT48.
   - Kartu yang terkunci ditampilkan sebagai siluet gelap bergembok dengan instruksi pembukaannya.
   - Kartu yang terbuka menampilkan detail resolusi tinggi, deskripsi momen foto Lana, dan tombol unduh kartu (High-Res download).

---

## 🛠️ Stack Teknologi (Tech Stack)

- **Frontend Core**: HTML5 Semantik & CSS3 Vanilla.
- **Interaksi & Logika**: Vanilla JavaScript (ES6+).
- **Penyimpanan**: LocalStorage API & SessionStorage API.
- **Desain & Estetika**: 
  - **Glassmorphism Premium** (efek blur, border transparan refraktif, bayangan halus).
  - Skema Warna HSL modern (Lavender, Deep Purple, Hot Pink, Gold, Emerald).
  - Tipografi: **Outfit** (Sans-serif) & **JetBrains Mono** (Monospace untuk statistik).
  - SVG internal untuk aset visual (seperti kode QRIS & ikon antarmuka).

---

## 🚀 Cara Menjalankan Secara Lokal

1. Clone repositori ini:
   ```bash
   git clone https://github.com/Emzyjeppp/lanaverse.git
   cd lanaverse
   ```
2. Jalankan server HTTP lokal. Anda bisa menggunakan Python:
   ```bash
   python -m http.server 8000
   ```
3. Buka browser dan kunjungi:
   **[http://localhost:8000](http://localhost:8000)**

---

## 📂 Struktur Berkas

```text
lanaverse/
├── index.html          # Struktur halaman web utama & SEO tags
├── index.css           # Desain visual, animasi keyframe, & tata letak bento
├── app.js              # Logika bisnis, game loop, gacha, & state manager
├── assets/             # Direktori aset foto asli Lana JKT48
│   ├── lana_avatar.png
│   ├── lana_stage.png
│   ├── lana_casual.png
│   ├── lana_seifuku.png
│   ├── lana_traditional.png
│   └── lana_gold.png
└── README.md           # Berkas panduan dokumentasi ini
```

---

## 📝 Lisensi & Kontribusi

Proyek ini dibuat murni untuk keperluan hiburan, pembelajaran, dan sebagai bentuk apresiasi penggemar (fansite) kepada Lana JKT48. Hak cipta foto sepenuhnya milik fotografer fansite asli.
