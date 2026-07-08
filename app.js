/* ==========================================================================
   LANAVERSE INTERACTIVE GAME & PORTAL LOGIC
   ========================================================================== */

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
    
    // Check session
    const sessionUser = sessionStorage.getItem("lanaverse_user");
    if (sessionUser) {
        loginUser(sessionUser);
    }

    btnAutoRegister.addEventListener("click", () => {
        // Auto register 1 member, 1 account automatically
        const randId = Math.floor(1000 + Math.random() * 9000);
        const username = `LanaFans_${randId}`;
        const password = "password"; // Default simplified password

        // Register in local database
        let accounts = JSON.parse(localStorage.getItem("lanaverse_accounts") || "[]");
        accounts.push({ username, password });
        localStorage.setItem("lanaverse_accounts", JSON.stringify(accounts));

        // Create empty initial state for this new user
        const initialState = {
            currentUser: username,
            coins: 10, // Small starting bonus
            tickets: 1, // Start with 1 free ticket
            clicks: 0,
            cpc: 1,
            cps: 0,
            isVip: false,
            upgrades: { lightstick: 0, camera: 0, banner: 0, cheer: 0, mascot: 0 },
            unlockedCards: []
        };
        localStorage.setItem(`lanaverse_state_${username}`, JSON.stringify(initialState));

        showToast(`Akun ${username} berhasil dibuat otomatis!`, "success");
        loginUser(username);
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
    } else {
        // Reset defaults
        state.currentUser = username;
        state.coins = 0;
        state.tickets = 1;
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
        case "lightstick": return "Lana Lightstick";
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
    
    const verifOverlay = document.getElementById("verification-overlay");
    const verifTitle = document.getElementById("verif-title");
    const verifDesc = document.getElementById("verif-desc");
    const verifProgress = document.getElementById("verif-progress");
    const successOverlay = document.getElementById("success-overlay");
    const btnCloseSuccess = document.getElementById("btn-close-success");

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
            showToast("Harap unggah berkas bukti pembayaran kas!", "error");
            return;
        }

        // Trigger simulation
        verifOverlay.classList.remove("hidden");
        simulateVerification();
    });

    function simulateVerification() {
        const steps = [
            { time: 0, title: "Mengunggah bukti...", desc: "Mentransfer berkas ke server fansite JKT48..." },
            { time: 800, title: "Memverifikasi nominal...", desc: "Mencocokkan jumlah transfer kas Rp 15.000,-" },
            { time: 1600, title: "Menghubungkan ke bank...", desc: "Melakukan kliring bukti bayar otomatis..." },
            { time: 2400, title: "Menyetujui transaksi...", desc: "Admin mengonfirmasi status keanggotaan..." }
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
            
            // VIP Exclusive card auto-unlocked
            if (!state.unlockedCards.includes(6)) {
                state.unlockedCards.push(6);
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
        
        // Redirect user to Clicker tab
        document.querySelector("[data-target='tab-clicker']").click();
    });
}

// 8. SPECIAL GACHA SYSTEM MODULE
function initGacha() {
    const btnCloseReward = document.getElementById("btn-close-reward");
    
    btnCloseReward.addEventListener("click", () => {
        const modal = document.getElementById("gacha-reward-modal");
        modal.classList.add("hidden");
        document.getElementById("reward-flip-card").classList.add("flipped"); // Reset card flip
        
        // Redirect to gallery to show collection
        document.querySelector("[data-target='tab-gallery']").click();
    });
}

window.openGacha = function(boxIndex) {
    if (state.tickets <= 0) {
        showToast("Tiket gacha Anda habis! Silakan dapatkan koin/kas untuk menambah tiket.", "error");
        return;
    }

    // Deduct ticket
    state.tickets -= 1;
    updateUI();
    saveState();

    // Trigger Box shake animation
    const chest = document.getElementById(`chest-${boxIndex}`).querySelector(".chest-box");
    chest.classList.add("shake");

    // After shaking for 1.2s, reveal the reward
    setTimeout(() => {
        chest.classList.remove("shake");
        rollCardReward();
    }, 1200);
};

function rollCardReward() {
    // Drop logic: Common (60%), Rare (30%), Ultra Rare (10%)
    const rand = Math.random();
    let raritySelected = "COMMON";
    
    if (rand < 0.6) {
        raritySelected = "COMMON";
    } else if (rand < 0.9) {
        raritySelected = "RARE";
    } else {
        raritySelected = "ULTRA RARE";
    }

    // Select candidate cards from available options
    const candidates = PHOTO_CARDS.filter(c => c.rarity === raritySelected && c.id !== 6);
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
    
    // Simulate Download Link
    btnDownload.href = cardData.image;
    btnDownload.download = `Lana_JKT48_${cardData.title.replace(/\s+/g, '_')}.png`;

    // Show Detail Modal
    document.getElementById("card-detail-modal").classList.remove("hidden");
}

// 10. REALTIME UI REFRESH MODULE
function updateUI() {
    // Header Stats
    document.getElementById("header-coins").textContent = formatNumber(state.coins);
    document.getElementById("header-tickets").textContent = state.tickets;
    
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
