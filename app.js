/* ==========================================================================
   LANAVERSE INTERACTIVE GAME & PORTAL LOGIC
   ========================================================================== */

// 0. SITE CONFIGURATION — GANTI NILAI DI BAWAH DENGAN DATA ASLI FANSITE ANDA
const SITE_CONFIG = {
    // Link Google Form asli tempat fans mengunggah bukti transfer.
    GFORM_URL: "https://forms.gle/GANTI_DENGAN_LINK_GOOGLE_FORM_ANDA",

    // URL Web App Google Apps Script untuk mengirim bukti transfer ke Google Spreadsheet otomatis.
    // Petunjuk Setup Spreadsheet Otomatis:
    // 1. Buat Google Spreadsheet baru.
    // 2. Klik Ekstensi -> Apps Script.
    // 3. Tulis kode berikut di editor Apps Script:
    //    function doPost(e) {
    //      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    //      var data = JSON.parse(e.postData.contents);
    //      sheet.appendRow([data.timestamp, data.username, data.senderName, data.nominal, data.fileName]);
    //      return ContentService.createTextOutput("Success");
    //    }
    // 4. Klik Deploy -> Deployment Baru -> Pilih Tipe: Aplikasi Web.
    // 5. Ubah 'Akses' menjadi 'Siapa saja' (Anyone) agar web static bisa mengirim data.
    // 6. Klik Deploy, setujui izin, lalu salin URL Aplikasi Web yang diberikan. Tempel ke bawah ini:
    SPREADSHEET_WEBAPP_URL: "https://script.google.com/macros/s/GANTI_DENGAN_URL_WEB_APP_APPS_SCRIPT_ANDA/exec",

    // Path gambar QRIS/QR pembayaran asli (taruh file di folder assets/).
    QRIS_IMAGE: "assets/qris_real.png",

    // Nominal kas yang ditampilkan di halaman pembayaran.
    KAS_NOMINAL: "Rp 15.000,-",

    // Nama rekening/e-wallet tujuan yang ditampilkan sebagai info transfer manual.
    PAYMENT_TARGET_NAME: "Admin Lanaverse Fansite"
};

// 1. CARDS DATA DEFINITIONS
const PHOTO_CARDS = [
    {
        id: 1,
        title: "Theater Stage Perform",
        rarity: "COMMON",
        rate: "60%",
        image: "assets/lana_stage.png",
        description: "Foto perform perdana Lana di panggung Theater JKT48 dengan senyuman energetiknya yang memukau penonton."
    },
    {
        id: 2,
        title: "Cozy Casual Cafe",
        rarity: "COMMON",
        rate: "60%",
        image: "assets/lana_casual.png",
        description: "Momen santai Lana di akhir pekan saat berkunjung ke cafe favoritnya dengan gaya kasual yang manis."
    },
    {
        id: 3,
        title: "Seifuku School Uniform",
        rarity: "COMMON",
        rate: "60%",
        image: "assets/lana_seifuku.png",
        description: "Keceriaan Lana saat mengenakan seragam sekolah JKT48 (seifuku) lengkap dengan dasi pita merah ikonik."
    },
    {
        id: 4,
        title: "Batik Kebaya Traditional",
        rarity: "RARE",
        rate: "30%",
        image: "assets/lana_traditional.png",
        description: "Keanggunan luar biasa Lana dibalut kebaya batik modern dalam sesi pemotretan bertema budaya tradisional Indonesia."
    },
    {
        id: 5,
        title: "Golden Princess Dress",
        rarity: "ULTRA RARE",
        rate: "10%",
        image: "assets/lana_gold.png",
        description: "Foto langka Lana mengenakan gaun konser berhias payet emas berkilau layaknya putri kerajaan di panggung megah."
    },
    {
        id: 6,
        title: "Lana Exclusive VIP Shot",
        rarity: "VIP EXCLUSIVE",
        rate: "0% (Khusus VIP Kas)",
        image: "assets/lana_stage.png", // Fallback but stylized via class in VIP state
        description: "Foto eksklusif bulanan khusus yang hanya bisa didapatkan dengan mendukung fansite melalui pembayaran Kas Bulanan."
    }
];

// 2. SHOP UPGRADE DEFINITIONS
const UPGRADE_PRICES = {
    lightstick: { base: 50, factor: 1.3, cpcBonus: 1, cpsBonus: 0 },
    camera: { base: 250, factor: 1.35, cpcBonus: 5, cpsBonus: 0 },
    banner: { base: 1000, factor: 1.4, cpcBonus: 20, cpsBonus: 0 },
    cheer: { base: 200, factor: 1.25, cpcBonus: 0, cpsBonus: 2 },
    mascot: { base: 800, factor: 1.3, cpcBonus: 0, cpsBonus: 10 }
};

// 3. GLOBAL APPLICATION STATE
let state = {
    currentUser: null,
    coins: 0,
    tickets: 0,
    tokens: 0, // Token download foto rare
    clicks: 0,
    cpc: 1,
    cps: 0,
    isVip: false,
    upgrades: {
        lightstick: 0,
        camera: 0,
        banner: 0,
        cheer: 0,
        mascot: 0
    },
    unlockedCards: []
};

// 4. INITIALIZATION & SESSION MANAGEMENT
document.addEventListener("DOMContentLoaded", () => {
    initAuth();
    initTabs();
    initClicker();
    initPayment();
    initGacha();
    initGallery();
    
    // Start Game Idle Loop
    setInterval(gameLoop, 1000);
});

// Initialize Authentication
function initAuth() {
    const btnAutoRegister = document.getElementById("btn-auto-register");
    const loginForm = document.getElementById("login-form");
    const btnLogout = document.getElementById("btn-logout");

    // Seed akun uji coba (khusus testing lokal, hapus baris ini saat go-live)
    seedTestAccount("atmin", "atmin");

    // Check session
    const sessionUser = sessionStorage.getItem("lanaverse_user");
    if (sessionUser) {
        loginUser(sessionUser);
    }

    btnAutoRegister.addEventListener("click", () => {
        // Auto register 1 member, 1 akun otomatis dengan kredensial unik
        const randId = Math.floor(1000 + Math.random() * 9000);
        const username = `LanaFans_${randId}`;
        const password = generateRandomPassword();

        // Register in local database
        let accounts = JSON.parse(localStorage.getItem("lanaverse_accounts") || "[]");
        accounts.push({ username, password });
        localStorage.setItem("lanaverse_accounts", JSON.stringify(accounts));

        // Create empty initial state for this new user
        const initialState = {
            currentUser: username,
            coins: 10, // Small starting bonus
            tickets: 1, // Start with 1 free ticket
            tokens: 0, // 0 download tokens
            clicks: 0,
            cpc: 1,
            cps: 0,
            isVip: false,
            upgrades: { lightstick: 0, camera: 0, banner: 0, cheer: 0, mascot: 0 },
            unlockedCards: []
        };
        localStorage.setItem(`lanaverse_state_${username}`, JSON.stringify(initialState));

        // Tampilkan kredensial ke user SEBELUM masuk, karena tidak ada cara
        // pemulihan akun (semua data hanya tersimpan di browser ini).
        showCredentialsModal(username, password);
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById("login-username").value.trim();
        const passwordInput = document.getElementById("login-password").value;
        const errorMsg = document.getElementById("auth-error-msg");

        let accounts = JSON.parse(localStorage.getItem("lanaverse_accounts") || "[]");
        const found = accounts.find(acc => acc.username === usernameInput && acc.password === passwordInput);

        if (found) {
            errorMsg.classList.add("hidden");
            loginUser(usernameInput);
        } else {
            errorMsg.classList.remove("hidden");
        }
    });

    btnLogout.addEventListener("click", () => {
        saveState();
        sessionStorage.removeItem("lanaverse_user");
        document.getElementById("dashboard-section").classList.add("hidden");
        document.getElementById("auth-section").classList.remove("hidden");
        
        // Reset login form
        loginForm.reset();
        showToast("Anda telah keluar dari portal.", "info");
    });
}

// Generate password acak sederhana (huruf+angka) untuk akun auto-register
function generateRandomPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

// Tampilkan modal berisi username & password hasil auto-register
// supaya fans bisa menyimpannya (login manual di lain waktu/device).
function showCredentialsModal(username, password) {
    const modal = document.getElementById("credentials-modal");
    document.getElementById("cred-username").textContent = username;
    document.getElementById("cred-password").textContent = password;
    modal.classList.remove("hidden");

    document.getElementById("btn-copy-credentials").onclick = () => {
        const text = `Username: ${username}\nPassword: ${password}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast("Kredensial disalin ke clipboard!", "success");
        }).catch(() => {
            showToast("Gagal menyalin otomatis, silakan catat manual.", "error");
        });
    };

    document.getElementById("btn-continue-credentials").onclick = () => {
        modal.classList.add("hidden");
        showToast(`Akun ${username} berhasil dibuat otomatis!`, "success");
        loginUser(username);
    };
}

// Buat akun uji coba lokal jika belum ada, dengan saldo & tiket berlimpah
// supaya memudahkan testing semua fitur (klik, gacha, kas, galeri).
function seedTestAccount(username, password) {
    let accounts = JSON.parse(localStorage.getItem("lanaverse_accounts") || "[]");
    const exists = accounts.find(acc => acc.username === username);

    if (!exists) {
        accounts.push({ username, password });
        localStorage.setItem("lanaverse_accounts", JSON.stringify(accounts));
    }

    // Hanya inisialisasi state kalau akun ini belum pernah punya progress
    if (!localStorage.getItem(`lanaverse_state_${username}`)) {
        const testState = {
            currentUser: username,
            coins: 999999,
            tickets: 50,
            tokens: 15, // Test account starts with 15 tokens
            clicks: 0,
            cpc: 10,
            cps: 5,
            isVip: true,
            upgrades: { lightstick: 3, camera: 2, banner: 1, cheer: 2, mascot: 1 },
            unlockedCards: [1, 2, 3, 4, 5, 6]
        };
        localStorage.setItem(`lanaverse_state_${username}`, JSON.stringify(testState));
    }
}

function loginUser(username) {
    state.currentUser = username;
    sessionStorage.setItem("lanaverse_user", username);
    
    // Load state
    loadState(username);
    
    // Show dashboard
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("dashboard-section").classList.remove("hidden");
    
    // Update headers
    document.getElementById("header-username").textContent = username;
    
    updateUI();
    showToast(`Selamat datang kembali, ${username}!`, "success");
}

function loadState(username) {
    const saved = localStorage.getItem(`lanaverse_state_${username}`);
    if (saved) {
        state = JSON.parse(saved);
        // Fallback for missing keys
        if (!state.unlockedCards) state.unlockedCards = [];
        if (!state.clicks) state.clicks = 0;
        if (state.tokens === undefined) state.tokens = 0;
    } else {
        // Reset defaults
        state.currentUser = username;
        state.coins = 0;
        state.tickets = 1;
        state.tokens = 0;
        state.clicks = 0;
        state.cpc = 1;
        state.cps = 0;
        state.isVip = false;
        state.upgrades = { lightstick: 0, camera: 0, banner: 0, cheer: 0, mascot: 0 };
        state.unlockedCards = [];
    }
}

function saveState() {
    if (state.currentUser) {
        localStorage.setItem(`lanaverse_state_${state.currentUser}`, JSON.stringify(state));
    }
}

// 5. TAB NAVIGATION SYSTEM
function initTabs() {
    const tabs = document.querySelectorAll(".nav-tab");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.getAttribute("data-target");
            
            tabs.forEach(t => t.classList.remove("active"));
            contents.forEach(c => c.classList.add("hidden"));
            
            tab.classList.add("active");
            document.getElementById(target).classList.remove("hidden");
            
            // Redraw gallery lock state specifically when switching to gallery tab
            if (target === "tab-gallery") {
                renderGallery();
            }
        });
    });
}

// 6. CLICKER GAME MODULE
function initClicker() {
    const clickerTarget = document.getElementById("clicker-target");
    const clickArea = document.getElementById("click-effect-area");

    clickerTarget.addEventListener("click", (e) => {
        // Calculate click value
        const multiplier = state.isVip ? 2 : 1;
        const currentCpc = state.cpc * multiplier;
        
        state.coins += currentCpc;
        state.clicks += 1;
        
        // Gacha ticket drops on milestones
        if (state.clicks > 0 && state.clicks % 200 === 0) {
            state.tickets += 1;
            showToast(`Hebat! Klik ke-${state.clicks} memberi Anda 1 Tiket Gacha gratis!`, "success");
        }
        
        // Spawn floating particle animation
        createFloatingParticle(e, currentCpc);
        
        updateUI();
        saveState();
    });

    // Mulai siklus kemunculan gimmick "Lana Langka"
    scheduleRareSpawn();
}

// 6b. GIMMICK "TANGKAP LANA LANGKA" (ala encounter Pokémon liar)
// Secara acak, sesosok "Lana Langka" berkilau muncul sebentar di area klik.
// Fans harus mengetuknya cepat sebelum menghilang untuk dapat bonus besar.
let rareSpawnTimer = null;

function scheduleRareSpawn() {
    clearTimeout(rareSpawnTimer);
    // Muncul acak setiap 25-55 detik
    const delay = 25000 + Math.random() * 30000;
    rareSpawnTimer = setTimeout(spawnRareLana, delay);
}

function spawnRareLana() {
    // Jangan spawn kalau user sedang tidak di tab clicker / belum login
    const clickerTab = document.getElementById("tab-clicker");
    if (!state.currentUser || clickerTab.classList.contains("hidden")) {
        scheduleRareSpawn();
        return;
    }

    const clickArea = document.getElementById("click-effect-area");
    const rect = clickArea.getBoundingClientRect();

    const spawn = document.createElement("div");
    spawn.className = "rare-spawn";
    spawn.innerHTML = `
        <img src="assets/lana_stage.png" alt="Lana Langka Muncul!" class="rare-spawn-img">
        <span class="rare-spawn-label">✨ Lana Langka! Tangkap!</span>
    `;

    // Posisi acak di dalam area klik (dengan margin agar tidak terpotong)
    const maxX = Math.max(rect.width - 90, 20);
    const maxY = Math.max(rect.height - 90, 20);
    spawn.style.left = `${20 + Math.random() * maxX}px`;
    spawn.style.top = `${20 + Math.random() * maxY}px`;

    let caught = false;
    const lifeTime = 4000; // 4 detik untuk menangkap sebelum hilang

    spawn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (caught) return;
        caught = true;
        catchRareLana(spawn);
    });

    clickArea.appendChild(spawn);

    setTimeout(() => {
        if (!caught && spawn.parentElement) {
            spawn.classList.add("rare-spawn-missed");
            setTimeout(() => spawn.remove(), 400);
            showToast("Yah, momen langka Lana keburu pergi! Coba lagi nanti~", "info");
        }
    }, lifeTime);

    // Jadwalkan kemunculan berikutnya
    scheduleRareSpawn();
}

function catchRareLana(spawnEl) {
    const bonusCoins = Math.max(50, state.cpc * 15);
    state.coins += bonusCoins;
    state.tickets += 1;

    // 20% peluang langsung dapat 1 kartu foto acak yang belum terbuka
    let bonusCardMsg = "";
    const locked = PHOTO_CARDS.filter(c => c.id !== 6 && !state.unlockedCards.includes(c.id));
    if (locked.length > 0 && Math.random() < 0.2) {
        const bonusCard = locked[Math.floor(Math.random() * locked.length)];
        state.unlockedCards.push(bonusCard.id);
        bonusCardMsg = ` Bonus kartu "${bonusCard.title}" langsung masuk galeri!`;
    }

    saveState();
    updateUI();

    spawnEl.classList.add("rare-spawn-caught");
    setTimeout(() => spawnEl.remove(), 400);

    showToast(`Berhasil menangkap Lana Langka! +${bonusCoins} koin & +1 tiket gacha.${bonusCardMsg}`, "success");
}

function createFloatingParticle(e, clickVal) {
    const clickArea = document.getElementById("click-effect-area");
    const rect = clickArea.getBoundingClientRect();
    
    // Relative coordinates inside clickArea
    let x, y;
    if (e.clientX && e.clientY) {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    } else {
        // Center fallback if triggered programmatically
        x = rect.width / 2;
        y = rect.height / 2;
    }
    
    const p = document.createElement("div");
    p.classList.add("floating-particle");
    p.innerHTML = `❤️ +${clickVal}`;
    
    // Random angle for floating direction
    const angle = (Math.random() * 40 - 20) * Math.PI / 180;
    const distance = 80 + Math.random() * 40;
    const destX = Math.sin(angle) * distance;
    const destY = -Math.cos(angle) * distance;
    
    p.style.left = `${x - 20}px`;
    p.style.top = `${y - 10}px`;
    p.style.setProperty("--x", `${destX}px`);
    p.style.setProperty("--y", `${destY}px`);
    
    clickArea.appendChild(p);
    
    // Remove element after animation completes
    setTimeout(() => {
        p.remove();
    }, 800);
}

// Game loop for idle clicker koin (CPS)
function gameLoop() {
    if (state.currentUser && state.cps > 0) {
        state.coins += state.cps;
        updateUI();
        saveState();
    }
}

// Purchase clicker upgrade
window.buyUpgrade = function(type) {
    const upg = UPGRADE_PRICES[type];
    const currentLvl = state.upgrades[type];
    const cost = Math.floor(upg.base * Math.pow(upg.factor, currentLvl));
    
    if (state.coins >= cost) {
        state.coins -= cost;
        state.upgrades[type] += 1;
        
        // Apply bonuses
        state.cpc += upg.cpcBonus;
        state.cps += upg.cpsBonus;
        
        showToast(`Berhasil membeli upgrade ${getUpgradeName(type)}!`, "success");
        updateUI();
        saveState();
    } else {
        showToast("Koin Anda tidak mencukupi!", "error");
    }
};

function getUpgradeName(type) {
    switch (type) {
        case "lightstick": return "Lana Love Lightstick";
        case "camera": return "Lensa Kamera";
        case "banner": return "Spanduk Fansite";
        case "cheer": return "Sorakan Theater";
        case "mascot": return "Maskot Fansite";
        default: return "Peningkatan";
    }
}

// 7. BAYAR KAS (VIP SUBSCRIPTION) MODULE
function initPayment() {
    const paymentForm = document.getElementById("payment-form");
    const dropzone = document.getElementById("upload-dropzone");
    const fileInput = document.getElementById("proof-file");
    const previewContainer = document.getElementById("file-preview-container");
    const previewFilename = document.getElementById("preview-filename");
    const btnRemoveFile = document.getElementById("btn-remove-file");
    const gformCheckbox = document.getElementById("gform-confirm-checkbox");
    const btnOpenGform = document.getElementById("btn-open-gform");

    const verifOverlay = document.getElementById("verification-overlay");
    const verifTitle = document.getElementById("verif-title");
    const verifDesc = document.getElementById("verif-desc");
    const verifProgress = document.getElementById("verif-progress");
    const successOverlay = document.getElementById("success-overlay");
    const btnCloseSuccess = document.getElementById("btn-close-success");

    // Isi gambar QRIS & link Google Form dari konfigurasi situs
    const qrisImg = document.getElementById("qris-image");
    if (qrisImg) qrisImg.src = SITE_CONFIG.QRIS_IMAGE;
    document.getElementById("qris-nominal-label").textContent = SITE_CONFIG.KAS_NOMINAL;
    document.getElementById("qris-target-label").textContent = SITE_CONFIG.PAYMENT_TARGET_NAME;

    btnOpenGform.addEventListener("click", () => {
        window.open(SITE_CONFIG.GFORM_URL, "_blank", "noopener");
    });

    // File input selection event
    fileInput.addEventListener("change", (e) => {
        if (fileInput.files.length > 0) {
            handleFileSelect(fileInput.files[0]);
        }
    });

    // Drag & Drop event bindings
    ["dragenter", "dragover"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = "hsl(var(--color-secondary))";
            dropzone.style.backgroundColor = "hsl(var(--color-bg-card) / 0.7)";
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.style.borderColor = "hsl(var(--color-text-primary) / 0.15)";
            dropzone.style.backgroundColor = "hsl(var(--color-bg-card) / 0.3)";
        }, false);
    });

    dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files; // Assign files to input
            handleFileSelect(files[0]);
        }
    });

    btnRemoveFile.addEventListener("click", (e) => {
        e.stopPropagation(); // Avoid triggering file selection
        fileInput.value = "";
        previewContainer.classList.add("hidden");
        document.querySelector(".dropzone-content").classList.remove("hidden");
    });

    function handleFileSelect(file) {
        previewFilename.textContent = file.name;
        previewContainer.classList.remove("hidden");
        document.querySelector(".dropzone-content").classList.add("hidden");
    }

    // Submit payment form
    paymentForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!fileInput.files || fileInput.files.length === 0) {
            showToast("Harap pilih berkas bukti pembayaran kas (untuk arsip lokal Anda)!", "error");
            return;
        }

        if (!gformCheckbox.checked) {
            showToast("Harap konfirmasi bahwa Anda sudah mengirim bukti transfer lewat Google Form Admin!", "error");
            return;
        }

        const senderName = document.getElementById("sender-name").value.trim();

        // Trigger simulation
        verifOverlay.classList.remove("hidden");
        simulateVerification(senderName);
    });

    function simulateVerification(senderName) {
        // Catatan kejujuran: situs statis ini tidak punya server, sehingga tidak bisa
        // benar-benar mengecek mutasi bank/e-wallet. Status "VIP" di bawah aktif secara
        // LOKAL di perangkat ini sebagai preview instan begitu Anda mengonfirmasi sudah
        // mengirim bukti lewat Google Form. Persetujuan final tetap ada di tangan Admin
        // yang meninjau isian Google Form / folder Google Drive Anda.
        const steps = [
            { time: 0, title: "Menyiapkan permintaan...", desc: "Mencatat data pengajuan kas Anda di perangkat ini..." },
            { time: 800, title: "Mengecek kelengkapan...", desc: `Nominal kas: ${SITE_CONFIG.KAS_NOMINAL}` },
            { time: 1600, title: "Menghubungkan ke Spreadsheet...", desc: "Mengirimkan data bukti pembayaran ke database Admin..." },
            { time: 2400, title: "Mengaktifkan preview VIP...", desc: "Status final tetap menunggu konfirmasi Admin." }
        ];

        let progress = 0;
        const totalDuration = 3000;
        const intervalTime = 50;
        
        // Progress bar increase
        const progressTimer = setInterval(() => {
            progress += (intervalTime / totalDuration) * 100;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressTimer);
            }
            verifProgress.style.width = `${progress}%`;
        }, intervalTime);

        // Text updates
        steps.forEach(step => {
            setTimeout(() => {
                verifTitle.textContent = step.title;
                verifDesc.textContent = step.desc;
            }, step.time);
        });

        // Completion
        setTimeout(() => {
            // Success upgrade VIP
            state.isVip = true;
            state.tickets += 10;
            state.tokens += 5; // Dapatkan 5 Token Premium untuk download
            
            // VIP Exclusive card auto-unlocked
            if (!state.unlockedCards.includes(6)) {
                state.unlockedCards.push(6);
            }
            
            // Kirim data transaksi ke Google Spreadsheet jika URL dikonfigurasi
            if (SITE_CONFIG.SPREADSHEET_WEBAPP_URL && !SITE_CONFIG.SPREADSHEET_WEBAPP_URL.includes("GANTI_DENGAN")) {
                const payload = {
                    username: state.currentUser,
                    senderName: senderName,
                    nominal: SITE_CONFIG.KAS_NOMINAL,
                    timestamp: new Date().toLocaleString("id-ID"),
                    fileName: fileInput.files[0] ? fileInput.files[0].name : "tidak_ada_file"
                };

                fetch(SITE_CONFIG.SPREADSHEET_WEBAPP_URL, {
                    method: "POST",
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }).catch(err => {
                    console.error("Gagal mengirim data ke Google Sheet:", err);
                });
            }

            saveState();
            updateUI();

            // Hide loading verification
            verifOverlay.classList.add("hidden");
            
            // Show Success Overlay
            successOverlay.classList.remove("hidden");
        }, totalDuration);
    }

    btnCloseSuccess.addEventListener("click", () => {
        successOverlay.classList.add("hidden");
        // Clear payment form fields
        paymentForm.reset();
        previewContainer.classList.add("hidden");
        document.querySelector(".dropzone-content").classList.remove("hidden");
        gformCheckbox.checked = false;

        // Redirect user to Clicker tab
        document.querySelector("[data-target='tab-clicker']").click();
    });
}

// 8. SPECIAL GACHA SYSTEM MODULE
function initGacha() {
    const btnCloseReward = document.getElementById("btn-close-reward");
    const btnCloseRewardX = document.getElementById("btn-close-reward-x");
    
    btnCloseReward.addEventListener("click", () => {
        const modal = document.getElementById("gacha-reward-modal");
        modal.classList.add("hidden");
        document.getElementById("reward-flip-card").classList.add("flipped"); // Reset card flip
        
        // Redirect to gallery to show collection
        document.querySelector("[data-target='tab-gallery']").click();
    });

    if (btnCloseRewardX) {
        btnCloseRewardX.addEventListener("click", () => {
            const modal = document.getElementById("gacha-reward-modal");
            modal.classList.add("hidden");
            document.getElementById("reward-flip-card").classList.add("flipped"); // Reset card flip
        });
    }

    // Tampilkan harga tiket & ringkasan peluang di tiap kotak
    Object.entries(GACHA_BOXES).forEach(([idx, box]) => {
        const costLabel = document.getElementById(`chest-${idx}-cost`);
        const oddsLabel = document.getElementById(`chest-${idx}-odds`);
        if (costLabel) costLabel.textContent = `${box.cost} 🎟️`;
        if (oddsLabel) {
            const parts = Object.entries(box.odds)
                .filter(([, chance]) => chance > 0)
                .map(([rarity, chance]) => `${rarity} ${Math.round(chance * 100)}%`);
            oddsLabel.textContent = parts.join(" · ");
        }
    });
}

// Definisi 3 kotak gacha — masing-masing punya harga tiket & peluang berbeda
// supaya memilih kotak jadi keputusan strategis, bukan sekadar kosmetik.
const GACHA_BOXES = {
    1: { name: "Kotak Ungu", cost: 1, odds: { COMMON: 0.6, RARE: 0.3, "ULTRA RARE": 0.1 } },
    2: { name: "Kotak Emas", cost: 3, odds: { COMMON: 0.2, RARE: 0.5, "ULTRA RARE": 0.3 } },
    3: { name: "Kotak Pink", cost: 2, odds: { COMMON: 0, RARE: 0.7, "ULTRA RARE": 0.3 } }
};

window.openGacha = function(boxIndex) {
    const boxConfig = GACHA_BOXES[boxIndex];
    if (!boxConfig) return;

    if (state.tickets < boxConfig.cost) {
        showToast(`Tiket tidak cukup! ${boxConfig.name} butuh ${boxConfig.cost} tiket gacha.`, "error");
        return;
    }

    // Deduct ticket sesuai harga kotak yang dipilih
    state.tickets -= boxConfig.cost;
    updateUI();
    saveState();

    // Trigger Box shake animation
    const chest = document.getElementById(`chest-${boxIndex}`).querySelector(".chest-box");
    chest.classList.add("shake");

    // After shaking for 1.2s, reveal the reward
    setTimeout(() => {
        chest.classList.remove("shake");
        rollCardReward(boxConfig);
    }, 1200);
};

function rollCardReward(boxConfig) {
    // Drop logic ditentukan oleh odds kotak yang dipilih pemain
    const rand = Math.random();
    let raritySelected = "COMMON";
    let cumulative = 0;

    for (const [rarity, chance] of Object.entries(boxConfig.odds)) {
        cumulative += chance;
        if (rand < cumulative) {
            raritySelected = rarity;
            break;
        }
    }

    // Select candidate cards from available options
    let candidates = PHOTO_CARDS.filter(c => c.rarity === raritySelected && c.id !== 6);
    if (candidates.length === 0) {
        candidates = PHOTO_CARDS.filter(c => c.id !== 6);
    }
    // Pick random candidate
    const selectedCard = candidates[Math.floor(Math.random() * candidates.length)];

    // Add card to unlocked collection if not already there
    if (!state.unlockedCards.includes(selectedCard.id)) {
        state.unlockedCards.push(selectedCard.id);
    }
    
    saveState();

    // Prepare reward modal UI elements
    const rewardImg = document.getElementById("reward-img");
    const rewardTag = document.getElementById("reward-tag");
    const rewardTitle = document.getElementById("reward-title");
    const rewardDesc = document.getElementById("reward-desc");
    
    rewardImg.src = selectedCard.image;
    rewardTag.textContent = selectedCard.rarity;
    rewardTag.className = `card-tag tag-${selectedCard.rarity.toLowerCase().replace(" ", "")}`;
    rewardTitle.textContent = selectedCard.title;
    rewardDesc.textContent = selectedCard.description;

    // Show reward modal
    const modal = document.getElementById("gacha-reward-modal");
    modal.classList.remove("hidden");
    
    // Play flip card animation after modal visible
    setTimeout(() => {
        document.getElementById("reward-flip-card").classList.remove("flipped");
    }, 300);
}

// 9. GALLERY COLLECTION SYSTEM
function initGallery() {
    const btnCloseDetail = document.getElementById("btn-close-detail");
    const detailModal = document.getElementById("card-detail-modal");

    // Close detail modal events
    btnCloseDetail.addEventListener("click", () => {
        detailModal.classList.add("hidden");
    });

    detailModal.addEventListener("click", (e) => {
        if (e.target === detailModal) {
            detailModal.classList.add("hidden");
        }
    });

    // Binding click for cards
    const cards = document.querySelectorAll(".gallery-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const cardId = parseInt(card.getAttribute("data-id"));
            
            // Check if card is unlocked
            const isUnlocked = state.unlockedCards.includes(cardId) || (cardId === 6 && state.isVip);
            
            if (isUnlocked) {
                openCardDetail(cardId);
            } else {
                // Shake locked card for feedback
                card.classList.add("shake");
                setTimeout(() => card.classList.remove("shake"), 500);
                showToast("Kartu ini masih terkunci! Cari melalui gacha atau bayar kas.", "info");
            }
        });
    });
}

function renderGallery() {
    const cards = document.querySelectorAll(".gallery-card");
    let countUnlocked = 0;
    
    cards.forEach(card => {
        const id = parseInt(card.getAttribute("data-id"));
        const inner = card.querySelector(".card-inner");
        const isUnlocked = state.unlockedCards.includes(id) || (id === 6 && state.isVip);
        
        if (isUnlocked) {
            card.classList.remove("locked");
            countUnlocked++;
            
            // Remove grayscale sepia filter from VIP monthly card
            if (id === 6) {
                card.querySelector(".card-img").classList.remove("sepia-effect");
            }
        } else {
            card.classList.add("locked");
            
            if (id === 6) {
                card.querySelector(".card-img").classList.add("sepia-effect");
            }
        }
    });

    document.getElementById("gallery-ratio").textContent = `${countUnlocked}/${PHOTO_CARDS.length}`;
}

function openCardDetail(cardId) {
    const cardData = PHOTO_CARDS.find(c => c.id === cardId);
    if (!cardData) return;

    const detailImg = document.getElementById("detail-img");
    const detailTag = document.getElementById("detail-tag");
    const detailTitle = document.getElementById("detail-title");
    const detailDesc = document.getElementById("detail-desc");
    const detailCardId = document.getElementById("detail-card-id");
    const detailRarityRate = document.getElementById("detail-rarity-rate");
    const btnDownload = document.getElementById("btn-download-card");

    // Populate data
    detailImg.src = cardData.image;
    detailTag.textContent = cardData.rarity;
    detailTag.className = `card-tag tag-${cardData.rarity.toLowerCase().replace(" ", "")}`;
    detailTitle.textContent = cardData.title;
    detailDesc.textContent = cardData.description;
    detailCardId.textContent = `#0${cardData.id}`;
    detailRarityRate.textContent = cardData.rate;
    
    // Set download cost display
    const isPremium = cardData.rarity !== "COMMON";
    const downloadCostEl = document.getElementById("detail-download-cost");
    if (downloadCostEl) {
        downloadCostEl.innerHTML = isPremium ? `<span class="text-highlight">1 💎 (Token Premium)</span>` : "Gratis";
    }

    // Set button text
    const btnDownloadText = document.getElementById("btn-download-text");
    if (btnDownloadText) {
        btnDownloadText.textContent = isPremium ? "Unduh Kartu (Butuh 1 💎)" : "Unduh Kartu (Gratis)";
    }

    // Overwrite click event handler to verify and consume tokens for downloads
    btnDownload.onclick = (e) => {
        e.preventDefault();
        const filename = `Lana_JKT48_${cardData.title.replace(/\s+/g, '_')}.png`;

        if (!isPremium) {
            // Free download
            triggerDownload(cardData.image, filename);
            showToast("Berhasil mengunduh foto Lana!", "success");
        } else {
            // Premium download checking
            if (state.tokens >= 1) {
                state.tokens -= 1;
                updateUI();
                saveState();
                triggerDownload(cardData.image, filename);
                showToast(`Berhasil mengunduh foto rare! Terpotong 1 Token. Sisa token: ${state.tokens} 💎`, "success");
            } else {
                showToast("Token tidak cukup! Silakan dukung kas bulanan untuk mendapatkan 5 Token Premium.", "error");
            }
        }
    };

    // Show Detail Modal
    document.getElementById("card-detail-modal").classList.remove("hidden");
}

// Programmatic file download helper
function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// 10. REALTIME UI REFRESH MODULE
function updateUI() {
    // Header Stats
    document.getElementById("header-coins").textContent = formatNumber(state.coins);
    document.getElementById("header-tickets").textContent = state.tickets;
    document.getElementById("header-tokens").textContent = state.tokens;
    
    // Clicker Stats
    document.getElementById("clicker-coins").textContent = formatNumber(state.coins);
    document.getElementById("clicker-cpc").textContent = state.cpc * (state.isVip ? 2 : 1);
    document.getElementById("clicker-cps").textContent = state.cps;
    
    // Gacha ticket stats
    document.getElementById("gacha-tickets-count").textContent = state.tickets;

    // VIP state changes
    const vipBadge = document.getElementById("vip-badge");
    if (state.isVip) {
        vipBadge.classList.remove("hidden");
        document.querySelector(".vip-benefits").style.borderColor = "gold";
    } else {
        vipBadge.classList.add("hidden");
    }

    // Refresh upgrade costs and shop state
    updateShopButtons();
    
    // Refresh gallery counter ratio
    renderGallery();
}

function updateShopButtons() {
    Object.keys(UPGRADE_PRICES).forEach(type => {
        const upg = UPGRADE_PRICES[type];
        const currentLvl = state.upgrades[type];
        const cost = Math.floor(upg.base * Math.pow(upg.factor, currentLvl));
        
        const upgradeElement = document.getElementById(`shop-${type}`);
        if (!upgradeElement) return;
        
        const costLabel = upgradeElement.querySelector(".upgrade-cost");
        costLabel.textContent = cost;

        const button = upgradeElement.querySelector(".btn-shop");
        if (state.coins < cost) {
            upgradeElement.classList.add("disabled");
            button.setAttribute("disabled", "true");
        } else {
            upgradeElement.classList.remove("disabled");
            button.removeAttribute("disabled");
        }
    });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

// 11. TOAST NOTIFICATION UTILITY
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    const timer = setTimeout(() => {
        toast.style.animation = "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    toast.querySelector(".toast-close").addEventListener("click", () => {
        clearTimeout(timer);
        toast.remove();
    });
}
