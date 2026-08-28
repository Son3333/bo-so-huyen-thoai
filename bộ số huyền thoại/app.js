/**
 * BỘ SỐ HUYỀN THOẠI - APPLICATION CONTROLLER
 * Quản lý vòng lặp AI tự học, khóa chốt số theo ngày (5h sáng VN) và Tra Cứu Sổ Chốt Lịch Sử
 */

document.addEventListener('DOMContentLoaded', () => {
    let currentMode = 'quick';
    let customRules = loadStoredRules();
    const engine = new PredictionEngine(customRules);
    let lastPredictionResult = null;
    let lastInputData = null;
    let lastFullBettingSlip = null;

    function getCloudServerUrl() {
        return (localStorage.getItem('bo_so_cloud_server_url') || 'https://bo-so-huyen-thoai.onrender.com').trim().replace(/\/+$/, '');
    }

    function getApiBase() {
        if (window.location.protocol.startsWith('http') && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
            return `${window.location.origin}/api`;
        }
        const cloud = getCloudServerUrl();
        if (cloud) return `${cloud}/api`;
        return 'http://localhost:8080/api';
    }

    // --- DOM ELEMENTS ---
    const vnLiveClock = document.getElementById('vnLiveClock');
    const dailyLockBadge = document.getElementById('dailyLockBadge');
    const dailyLockStatusText = document.getElementById('dailyLockStatusText');
    const inputDrawDate = document.getElementById('inputDrawDate');
    const drawDateTag = document.getElementById('drawDateTag');
    const modeQuickBtn = document.getElementById('modeQuickBtn');
    const modeFullBtn = document.getElementById('modeFullBtn');
    const quickInputContainer = document.getElementById('quickInputContainer');
    const fullBoardContainer = document.getElementById('fullBoardContainer');
    const quickInputText = document.getElementById('quickInputText');
    const quickCountBadge = document.getElementById('quickCountBadge');
    const btnRunPrediction = document.getElementById('btnRunPrediction');
    const btnRunText = document.getElementById('btnRunText');
    const btnClearInput = document.getElementById('btnClearInput');
    const btnCopyFullSlip = document.getElementById('btnCopyFullSlip');
    const btnPrintSlip = document.getElementById('btnPrintSlip');

    // Cloud Sync Elements
    const btnOpenCloudModal = document.getElementById('btnOpenCloudModal');
    const cloudStatusDot = document.getElementById('cloudStatusDot');
    const cloudStatusText = document.getElementById('cloudStatusText');
    const cloudConfigModal = document.getElementById('cloudConfigModal');
    const btnCloseCloudModal = document.getElementById('btnCloseCloudModal');
    const inputCloudServerUrl = document.getElementById('inputCloudServerUrl');
    const cloudPingText = document.getElementById('cloudPingText');
    const cloudServerTimeText = document.getElementById('cloudServerTimeText');
    const btnTestAndSaveCloud = document.getElementById('btnTestAndSaveCloud');
    const btnSyncNowCloud = document.getElementById('btnSyncNowCloud');

    // Quick History Selector
    const quickHistorySelect = document.getElementById('quickHistorySelect');
    const btnViewSelectedHistory = document.getElementById('btnViewSelectedHistory');

    // AI Evaluation Elements (4 Hạng Mục Đối Soát Toàn Diện)
    const evalAccuracyBadge = document.getElementById('evalAccuracyBadge');
    const evalBTL = document.getElementById('evalBTL');
    const evalSTL = document.getElementById('evalSTL');
    const evalDanLotto = document.getElementById('evalDanLotto');
    const evalKep = document.getElementById('evalKep');
    const evalXien2 = document.getElementById('evalXien2');
    const evalXienQuay = document.getElementById('evalXienQuay');
    const evalDeBTL = document.getElementById('evalDeBTL');
    const evalChamDe = document.getElementById('evalChamDe');
    const evalDanDe = document.getElementById('evalDanDe');
    const eval3CangDe = document.getElementById('eval3CangDe');
    const eval3CangLo = document.getElementById('eval3CangLo');
    const evalDan3Cang = document.getElementById('evalDan3Cang');
    const aiLessonsList = document.getElementById('aiLessonsList');
    const weightBacNho = document.getElementById('weightBacNho');
    const weightDauCam = document.getElementById('weightDauCam');
    const weightBongSo = document.getElementById('weightBongSo');

    // VIP Badges
    const resBachThu = document.getElementById('resBachThu');
    const btlScoreBadge = document.getElementById('btlScoreBadge');
    const resSongThu = document.getElementById('resSongThu');
    const resDeBTL = document.getElementById('resDeBTL');
    const res3CangVIP = document.getElementById('res3CangVIP');

    // Slip Elements (Bao Lô)
    const slipBTL = document.getElementById('slipBTL');
    const slipSTL = document.getElementById('slipSTL');
    const slipKep = document.getElementById('slipKep');
    const slipDan4 = document.getElementById('slipDan4');
    const slipDan8 = document.getElementById('slipDan8');
    const slipDan10 = document.getElementById('slipDan10');

    // Slip Elements (Xiên & Xiên Quay)
    const slipXien2 = document.getElementById('slipXien2');
    const slipXien3 = document.getElementById('slipXien3');
    const slipXien4 = document.getElementById('slipXien4');
    const slipXQCore = document.getElementById('slipXQCore');
    const slipXQDetails = document.getElementById('slipXQDetails');

    // Slip Elements (Đặc Biệt & Dàn Đề)
    const slipDeBTL = document.getElementById('slipDeBTL');
    const slipDeSTL = document.getElementById('slipDeSTL');
    const slipChamDe = document.getElementById('slipChamDe');
    const slipDanDe10 = document.getElementById('slipDanDe10');
    const slipDanDe20 = document.getElementById('slipDanDe20');
    const slipDanDe36 = document.getElementById('slipDanDe36');
    const slipDanDe64 = document.getElementById('slipDanDe64');

    // Slip Elements (Ba Càng)
    const slipTopCangs = document.getElementById('slipTopCangs');
    const slip3CangLo = document.getElementById('slip3CangLo');
    const slip3CangDe = document.getElementById('slip3CangDe');
    const slipDan3Cang = document.getElementById('slipDan3Cang');

    // Tables & Matrix
    const topRankedTable = document.getElementById('topRankedTable');
    const silentHeadsList = document.getElementById('silentHeadsList');
    const silentTailsList = document.getElementById('silentTailsList');
    const heatmapGrid = document.getElementById('heatmapGrid');
    const headsTable = document.getElementById('headsTable');
    const tailsTable = document.getElementById('tailsTable');
    const historyListContainer = document.getElementById('historyListContainer');
    const rulesListContainer = document.getElementById('rulesListContainer');

    // MySQL Buttons
    const btnSaveToMySQLTab = document.getElementById('btnSaveToMySQLTab');
    const btnExportSQL = document.getElementById('btnExportSQL');
    const btnExportAIDataset = document.getElementById('btnExportAIDataset');
    const mysqlStatusBadge = document.getElementById('mysqlStatusBadge');
    const vectorInspectorBox = document.getElementById('vectorInspectorBox');

    // Modal
    const reasonModal = document.getElementById('reasonModal');
    const modalNumCircle = document.getElementById('modalNumCircle');
    const modalScoreText = document.getElementById('modalScoreText');
    const modalReasonsList = document.getElementById('modalReasonsList');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnDoneModal = document.getElementById('btnDoneModal');

    // --- VIETNAM LIVE CLOCK (UTC+7) ---
    function updateVietnamClock() {
        const now = new Date();
        const vnTimeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
        if (vnLiveClock) vnLiveClock.textContent = `${vnTimeStr} (VN)`;
    }
    setInterval(updateVietnamClock, 1000);
    updateVietnamClock();

    // Setup initial draw date (Today VN)
    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    // Đồng bộ dữ liệu lịch sử chuẩn (26/08/2026) vào bộ nhớ App
    syncInitialCanonicalData();

    if (inputDrawDate) {
        inputDrawDate.value = todayVN;
        inputDrawDate.addEventListener('change', () => {
            checkDailyLockStatus();
            syncCanonicalSlipFromCloud(inputDrawDate.value);
        });
    }

    updateWeightDisplay();
    populateQuickHistorySelect();
    checkDailyLockStatus();
    initCloudStatusUI();
    syncCanonicalSlipFromCloud(todayVN);

    function syncInitialCanonicalData() {
        if (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays) {
            const currentLocked = getLockedDays();
            let changed = false;
            Object.keys(CANONICAL_INITIAL_DATA.lockedDays).forEach(dateStr => {
                if (!currentLocked[dateStr]) {
                    currentLocked[dateStr] = CANONICAL_INITIAL_DATA.lockedDays[dateStr];
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('bo_so_locked_days', JSON.stringify(currentLocked));
            }

            const currentHistory = getHistory();
            let histChanged = false;
            Object.keys(CANONICAL_INITIAL_DATA.lockedDays).forEach(dateStr => {
                const item = CANONICAL_INITIAL_DATA.lockedDays[dateStr];
                if (!currentHistory.find(h => h.date === dateStr)) {
                    currentHistory.unshift({
                        id: Date.now() + Math.random(),
                        date: item.drawDate,
                        specialPrize: item.inputData.specialPrize,
                        prize1: item.inputData.prize1,
                        rawPrizes: item.inputData.rawPrizes,
                        inputNumbers: item.inputData.lottoNumbers,
                        recommendations: item.predictionResult.recommendations,
                        fullBettingSlip: item.fullBettingSlip
                    });
                    histChanged = true;
                }
            });
            if (histChanged) {
                localStorage.setItem('bo_so_history', JSON.stringify(currentHistory));
            }

            // Tự động mở khóa ngày hôm nay nếu bị khóa nhầm trước 18h30
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
            if (currentLocked[todayStr] && !isDrawTimeReached(todayStr)) {
                delete currentLocked[todayStr];
                localStorage.setItem('bo_so_locked_days', JSON.stringify(currentLocked));
                const filteredHist = getHistory().filter(h => h.date !== todayStr);
                localStorage.setItem('bo_so_history', JSON.stringify(filteredHist));
            }
        }

        // Tự động kiểm tra và đồng bộ từ Master Cloud Server
        syncFromMasterServer();
    }

    async function syncFromMasterServer() {
        try {
            const res = await fetch(`${getApiBase()}/canonical-slip`);
            if (res.ok) {
                const json = await res.json();
                if (json && json.data && json.data.drawDate) {
                    const masterDay = json.data;
                    const locked = getLockedDays();
                    if (!locked[masterDay.drawDate] && isDrawTimeReached(masterDay.drawDate)) {
                        locked[masterDay.drawDate] = masterDay;
                        localStorage.setItem('bo_so_locked_days', JSON.stringify(locked));
                        saveDrawToLocalStorage(masterDay.inputData, null, masterDay.fullBettingSlip);
                        populateQuickHistorySelect();
                        checkDailyLockStatus();
                    }
                }
            }
        } catch (e) {
            // Chạy an toàn với bộ nhớ cục bộ
        }
    }

    function updateWeightDisplay() {
        if (weightBacNho) weightBacNho.textContent = `${engine.weights.bac_nho}đ`;
        if (weightDauCam) weightDauCam.textContent = `${engine.weights.dau_cam}đ`;
        if (weightBongSo) weightBongSo.textContent = `${engine.weights.bong_so}đ`;
    }

    // --- QUICK HISTORY SELECTOR POPULATION ---
    function populateQuickHistorySelect() {
        if (!quickHistorySelect) return;
        const lockedDays = getLockedDays();
        const dates = Object.keys(lockedDays).sort().reverse();

        quickHistorySelect.innerHTML = '<option value="">-- Chọn ngày đã chốt để xem lại --</option>';
        dates.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = `Kỳ ngày: ${d} (Đã chốt đầy đủ)`;
            quickHistorySelect.appendChild(opt);
        });
    }

    if (btnViewSelectedHistory) {
        btnViewSelectedHistory.addEventListener('click', () => {
            const chosen = quickHistorySelect.value;
            if (!chosen) {
                showToast("Vui lòng chọn 1 ngày trong danh sách!");
                return;
            }
            inputDrawDate.value = chosen;
            checkDailyLockStatus();
            showToast(`📂 Đã mở lại Sổ Tay Chốt Số ngày ${chosen}!`);
        });
    }

    if (quickHistorySelect) {
        quickHistorySelect.addEventListener('change', () => {
            if (quickHistorySelect.value) {
                inputDrawDate.value = quickHistorySelect.value;
                checkDailyLockStatus();
            }
        });
    }

    // --- DAILY LOCK & VIETNAM TIME LOGIC ---
    function getLockedDays() {
        try {
            const s = localStorage.getItem('bo_so_locked_days');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return {};
    }

    function saveLockedDay(dateStr, data) {
        const locked = getLockedDays();
        locked[dateStr] = data;
        try {
            localStorage.setItem('bo_so_locked_days', JSON.stringify(locked));
        } catch (e) {}
        populateQuickHistorySelect();
        checkDailyLockStatus();
    }

    function checkDailyLockStatus() {
        const selectedDate = inputDrawDate.value || todayVN;
        const lockedDays = getLockedDays();
        const lockedData = lockedDays[selectedDate];

        if (lockedData) {
            dailyLockBadge.className = 'px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-xs font-bold text-amber-300 flex items-center space-x-1.5';
            dailyLockStatusText.textContent = `🔒 Đã Chốt Ngày ${selectedDate}`;
            if (drawDateTag) drawDateTag.textContent = '🔒 Đã Chốt Số Cố Định';
            if (btnRunText) btnRunText.textContent = 'Xem Lại Bản Chốt Cố Định';

            renderLockedPrediction(lockedData);
        } else {
            dailyLockBadge.className = 'px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center space-x-1.5';
            dailyLockStatusText.textContent = `🟢 Sẵn sàng nhập kỳ ${selectedDate}`;
            if (drawDateTag) drawDateTag.textContent = 'Kỳ mới';
            if (btnRunText) btnRunText.textContent = 'Tự Học & Chốt Số Ngày Mai';
            
            // Reset mốc hiển thị sẵn sàng cho kỳ mới
            renderInitialEvaluationState();
            resetPredictionDisplay();
        }
    }

    function resetPredictionDisplay() {
        resBachThu.textContent = '--';
        btlScoreBadge.textContent = '0đ';
        resSongThu.textContent = '-- - --';
        if (resDeBTL) resDeBTL.textContent = '--';
        if (res3CangVIP) res3CangVIP.textContent = '--';
        
        slipBTL.textContent = '--';
        slipSTL.textContent = '--';
        slipKep.textContent = '--';
        slipDan4.textContent = '--';
        slipDan8.textContent = '--';
        slipDan10.textContent = '--';
        slipXien2.textContent = '--';
        slipXien3.textContent = '--';
        slipXien4.textContent = '--';
        slipXQCore.textContent = '--';
        slipXQDetails.textContent = '--';
        slipDeBTL.textContent = '--';
        slipDeSTL.textContent = '--';
        slipChamDe.textContent = '--';
        slipDanDe10.textContent = '--';
        slipDanDe20.textContent = '--';
        slipDanDe36.textContent = '--';
        slipDanDe64.textContent = '--';
        slipTopCangs.textContent = '--';
        slip3CangLo.textContent = '--';
        slip3CangDe.textContent = '--';
        slipDan3Cang.textContent = '--';
    }

    function renderLockedPrediction(lockedData) {
        lastPredictionResult = lockedData.predictionResult;
        lastInputData = lockedData.inputData;
        lastFullBettingSlip = lockedData.fullBettingSlip;

        if (lockedData.evalResult) {
            renderEvaluationReport(lockedData.evalResult, lockedData.learningEntry);
        }
        if (lastPredictionResult) {
            renderPredictions(lastPredictionResult);
            renderHeadTails(lastPredictionResult.inputSummary);
            renderHeatmap(lastPredictionResult.scores);
        }
        if (lastFullBettingSlip) {
            renderFullBettingSlip(lastFullBettingSlip);
        }
    }

    // --- CHECK MYSQL STATUS ---
    checkMySQLStatus();
    function checkMySQLStatus() {
        fetch(`${getApiBase()}/status`, { method: 'GET' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'connected') {
                    if (mysqlStatusBadge) {
                        mysqlStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center space-x-1.5';
                        mysqlStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Đã kết nối MySQL: ${data.database}</span>`;
                    }
                }
            })
            .catch(() => {
                if (mysqlStatusBadge) {
                    mysqlStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1.5';
                    mysqlStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span><span>Chế độ: Sẵn sàng lưu & Xuất SQL</span>`;
                }
            });
    }

    // --- MOBILE DETECTION & ADAPTIVE LAYOUT ---
    function detectMobileAndApplyLayout() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobile) {
            document.documentElement.classList.add('is-mobile');
            document.body.classList.add('is-mobile-device');
        } else {
            document.documentElement.classList.remove('is-mobile');
            document.body.classList.remove('is-mobile-device');
        }
    }
    window.addEventListener('resize', detectMobileAndApplyLayout);
    detectMobileAndApplyLayout();

    // --- TAB SWITCHING (SYNC DESKTOP & MOBILE BOTTOM NAV) ---
    const navTabs = document.querySelectorAll('.nav-tab');
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        navTabs.forEach(t => {
            if (t.getAttribute('data-target') === targetId) {
                t.classList.add('active', 'text-amber-400', 'bg-amber-500/10', 'border', 'border-amber-500/30');
                t.classList.remove('text-gray-400');
            } else {
                t.classList.remove('active', 'text-amber-400', 'bg-amber-500/10', 'border', 'border-amber-500/30');
                t.classList.add('text-gray-400');
            }
        });

        mobileNavBtns.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.className = 'mobile-nav-btn active flex flex-col items-center py-1 px-2.5 text-amber-400 font-bold transition scale-105';
            } else {
                btn.className = 'mobile-nav-btn flex flex-col items-center py-1 px-2.5 text-gray-400 hover:text-amber-300 transition';
            }
        });

        tabContents.forEach(c => c.classList.add('hidden'));
        const activeContent = document.getElementById(targetId);
        if (activeContent) activeContent.classList.remove('hidden');

        if (targetId === 'tab-rules') renderRulesList();
        if (targetId === 'tab-history') renderHistoryList();
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Cuộn mượt lên đầu trang khi chuyển tab trên điện thoại
        if (window.innerWidth < 768) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // --- INPUT MODE TOGGLE ---
    modeQuickBtn.addEventListener('click', () => {
        currentMode = 'quick';
        modeQuickBtn.className = 'flex-1 py-1.5 rounded-lg bg-amber-500 font-semibold text-black transition shadow';
        modeFullBtn.className = 'flex-1 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 font-medium transition';
        quickInputContainer.classList.remove('hidden');
        fullBoardContainer.classList.add('hidden');
    });

    modeFullBtn.addEventListener('click', () => {
        currentMode = 'full';
        modeFullBtn.className = 'flex-1 py-1.5 rounded-lg bg-amber-500 font-semibold text-black transition shadow';
        modeQuickBtn.className = 'flex-1 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 font-medium transition';
        fullBoardContainer.classList.remove('hidden');
        quickInputContainer.classList.add('hidden');
    });

    // --- QUICK PASTE FROM CLIPBOARD (TIỆN LỢI CHO ĐIỆN THOẠI) ---
    const btnPasteClipboard = document.getElementById('btnPasteClipboard');
    if (btnPasteClipboard) {
        btnPasteClipboard.addEventListener('click', async () => {
            try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const text = await navigator.clipboard.readText();
                    if (text && text.trim()) {
                        quickInputText.value = text.trim();
                        const lottoNums = engine.parseQuickInput(text);
                        quickCountBadge.textContent = `Đã nhận: ${lottoNums.length} số`;
                        showToast(`📋 Đã dán nhanh ${lottoNums.length} số từ bộ nhớ tạm!`, "success");
                        return;
                    }
                }
            } catch (e) {}
            quickInputText.focus();
            showToast("Hãy nhấn giữ vào ô nhập và chọn 'Dán' (Paste)", "info");
        });
    }

    quickInputText.addEventListener('input', () => {
        const lottoNums = engine.parseQuickInput(quickInputText.value);
        quickCountBadge.textContent = `Đã nhận: ${lottoNums.length} số`;
    });

    // --- DRAW TIME NOTICE MODAL & AUTO-FETCH ---
    const drawTimeNoticeModal = document.getElementById('drawTimeNoticeModal');
    const modalCurrentVNTime = document.getElementById('modalCurrentVNTime');
    const modalSelectedDate = document.getElementById('modalSelectedDate');
    const btnCloseTimeNoticeModal = document.getElementById('btnCloseTimeNoticeModal');

    function showDrawTimeNoticeModal(selectedDate) {
        if (!drawTimeNoticeModal) return;
        const now = new Date();
        const vnTimeString = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
        if (modalCurrentVNTime) modalCurrentVNTime.textContent = `${vnTimeString} (VN)`;
        if (modalSelectedDate) modalSelectedDate.textContent = selectedDate;

        drawTimeNoticeModal.classList.remove('hidden');
        drawTimeNoticeModal.classList.add('flex');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeDrawTimeNoticeModal() {
        if (!drawTimeNoticeModal) return;
        drawTimeNoticeModal.classList.add('hidden');
        drawTimeNoticeModal.classList.remove('flex');
    }

    if (btnCloseTimeNoticeModal) {
        btnCloseTimeNoticeModal.addEventListener('click', closeDrawTimeNoticeModal);
    }
    if (drawTimeNoticeModal) {
        drawTimeNoticeModal.addEventListener('click', (e) => {
            if (e.target === drawTimeNoticeModal) closeDrawTimeNoticeModal();
        });
    }

    function isDrawTimeReached(dateStr) {
        const now = new Date();
        const vnDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        
        // Nếu là ngày hôm nay hoặc tương lai
        if (dateStr >= vnDateStr) {
            const vnTimeString = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
            const parts = vnTimeString.split(':');
            const hour = parseInt(parts[0], 10);
            const minute = parseInt(parts[1], 10);
            // Chưa đến 18h30
            if (hour < 18 || (hour === 18 && minute < 30)) {
                return false;
            }
        }
        return true;
    }

    function parseXSMBHTML(html) {
        if (!html) return null;
        function extract(pattern) {
            const m = html.match(new RegExp(pattern));
            return m ? m[1].trim() : '';
        }
        const gdb = extract('class="v-gdb\\s*">([^<]+)<');
        if (!gdb || gdb.length < 5) return null;

        const rawPrizes = {
            gdb: gdb,
            g1: extract('class="v-g1\\s*">([^<]+)<'),
            g2_1: extract('class="v-g2-0\\s*">([^<]+)<'),
            g2_2: extract('class="v-g2-1\\s*">([^<]+)<'),
            g3_1: extract('class="v-g3-0\\s*">([^<]+)<'),
            g3_2: extract('class="v-g3-1\\s*">([^<]+)<'),
            g3_3: extract('class="v-g3-2\\s*">([^<]+)<'),
            g3_4: extract('class="v-g3-3\\s*">([^<]+)<'),
            g3_5: extract('class="v-g3-4\\s*">([^<]+)<'),
            g3_6: extract('class="v-g3-5\\s*">([^<]+)<'),
            g4_1: extract('class="v-g4-0\\s*">([^<]+)<'),
            g4_2: extract('class="v-g4-1\\s*">([^<]+)<'),
            g4_3: extract('class="v-g4-2\\s*">([^<]+)<'),
            g4_4: extract('class="v-g4-3\\s*">([^<]+)<'),
            g5_1: extract('class="v-g5-0\\s*">([^<]+)<'),
            g5_2: extract('class="v-g5-1\\s*">([^<]+)<'),
            g5_3: extract('class="v-g5-2\\s*">([^<]+)<'),
            g5_4: extract('class="v-g5-3\\s*">([^<]+)<'),
            g5_5: extract('class="v-g5-4\\s*">([^<]+)<'),
            g5_6: extract('class="v-g5-5\\s*">([^<]+)<'),
            g6_1: extract('class="v-g6-0\\s*">([^<]+)<'),
            g6_2: extract('class="v-g6-1\\s*">([^<]+)<'),
            g6_3: extract('class="v-g6-2\\s*">([^<]+)<'),
            g7_1: extract('class="v-g7-0\\s*">([^<]+)<'),
            g7_2: extract('class="v-g7-1\\s*">([^<]+)<'),
            g7_3: extract('class="v-g7-2\\s*">([^<]+)<'),
            g7_4: extract('class="v-g7-3\\s*">([^<]+)<')
        };

        const orderedKeys = ['gdb', 'g1', 'g2_1', 'g2_2', 'g3_1', 'g3_2', 'g3_3', 'g3_4', 'g3_5', 'g3_6',
                            'g4_1', 'g4_2', 'g4_3', 'g4_4', 'g5_1', 'g5_2', 'g5_3', 'g5_4', 'g5_5', 'g5_6',
                            'g6_1', 'g6_2', 'g6_3', 'g7_1', 'g7_2', 'g7_3', 'g7_4'];
        const lottoNumbers = [];
        for (const k of orderedKeys) {
            const val = String(rawPrizes[k] || '').trim();
            if (val.length >= 2) {
                lottoNumbers.push(val.slice(-2));
            }
        }

        if (lottoNumbers.length >= 27) {
            return { rawPrizes, lottoNumbers };
        }
        return null;
    }

    async function fetchLiveLotteryPrizes(selectedDate) {
        // 1. Thử qua API Server chính (Cloud hoặc Local)
        const primaryApi = `${getApiBase()}/latest-draw?date=${selectedDate}`;
        try {
            const res = await fetch(primaryApi, { cache: 'no-cache' }).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (data && data.raw_prizes && Object.keys(data.raw_prizes).length >= 27) {
                    return { rawPrizes: data.raw_prizes, lottoNumbers: data.lotto_numbers, source: 'primary_api' };
                }
            }
        } catch (e) {}

        // 2. Thử Cloud Render URL nếu đang chạy Desktop App (file:// hoặc localhost)
        const cloudUrl = getCloudServerUrl();
        if (cloudUrl && !primaryApi.startsWith(cloudUrl)) {
            try {
                const res = await fetch(`${cloudUrl}/api/latest-draw?date=${selectedDate}`, { cache: 'no-cache' }).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data && data.raw_prizes && Object.keys(data.raw_prizes).length >= 27) {
                        return { rawPrizes: data.raw_prizes, lottoNumbers: data.lotto_numbers, source: 'cloud_render' };
                    }
                }
            } catch (e) {}
        }

        // 3. Thử qua Localhost:8080 nếu API chính là Cloud
        if (!primaryApi.includes('localhost:8080')) {
            try {
                const res = await fetch(`http://localhost:8080/api/latest-draw?date=${selectedDate}`).catch(() => null);
                if (res && res.ok) {
                    const data = await res.json();
                    if (data && data.raw_prizes && Object.keys(data.raw_prizes).length >= 27) {
                        return { rawPrizes: data.raw_prizes, lottoNumbers: data.lotto_numbers, source: 'localhost' };
                    }
                }
            } catch (e) {}
        }

        // 4. Thử Cào Trực Tiếp qua các cổng CORS Proxy mở tốc độ cao
        const dateParts = selectedDate ? selectedDate.split('-') : [];
        let dateUrl = 'https://xsmb.me';
        if (dateParts.length === 3) {
            dateUrl = `https://xsmb.me/kqxsmb-ngay-${dateParts[2]}-${dateParts[1]}-${dateParts[0]}.html`;
        }

        const proxyUrls = [
            'https://api.allorigins.win/raw?url=' + encodeURIComponent(dateUrl),
            'https://corsproxy.io/?' + encodeURIComponent(dateUrl),
            'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(dateUrl),
            'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://xsmb.me')
        ];

        for (const pUrl of proxyUrls) {
            try {
                const res = await fetch(pUrl).catch(() => null);
                if (res && res.ok) {
                    const html = await res.text();
                    const parsed = parseXSMBHTML(html);
                    if (parsed) {
                        return { rawPrizes: parsed.rawPrizes, lottoNumbers: parsed.lottoNumbers, source: 'direct_cors_scraper' };
                    }
                }
            } catch (e) {}
        }

        // 5. Fallback tầng 5: Kho lưu trữ Master hoặc Lịch sử chuẩn
        const history = getHistory();
        const hist = history.find(h => h.date === selectedDate);
        if (hist && hist.rawPrizes) {
            return { rawPrizes: hist.rawPrizes, lottoNumbers: hist.lottoNumbers, source: 'storage_cache' };
        }

        return null;
    }

    const btnAutoFetchOnline = document.getElementById('btnAutoFetchOnline');
    if (btnAutoFetchOnline) {
        btnAutoFetchOnline.addEventListener('click', async () => {
            const selectedDate = inputDrawDate.value || todayVN;

            // 1. Kiểm tra thời gian thực tế xem đã quay thưởng chưa
            if (!isDrawTimeReached(selectedDate)) {
                showDrawTimeNoticeModal(selectedDate);
                return;
            }

            showToast("🌐 Đang kết nối máy chủ cào kết quả XSMB trực tuyến...", "info");

            const fetched = await fetchLiveLotteryPrizes(selectedDate);
            if (fetched && fetched.rawPrizes) {
                applyOnlinePrizes(fetched.rawPrizes, fetched.lottoNumbers);
                runPrediction();
                showToast(`✅ Đã tự động cào đủ 27 giải và AI đã chốt số ngày ${selectedDate}!`, "success");
                return;
            }

            showToast("Chưa thể kết nối tới nguồn cào trực tiếp lúc này. Bạn vui lòng thử lại hoặc dán kết quả 27 giải vào ô nhập.", "warning");
        });
    }

    function applyOnlinePrizes(rawPrizes, lottoNums) {
        Object.keys(rawPrizes).forEach(k => {
            const el = document.getElementById('g_' + k);
            if (el) el.value = rawPrizes[k];
        });
        if (lottoNums && lottoNums.length > 0) {
            quickInputText.value = lottoNums.join(', ');
            quickCountBadge.textContent = `Đã nhận: ${lottoNums.length} số`;
        }
    }

    btnClearInput.addEventListener('click', () => {
        quickInputText.value = '';
        quickCountBadge.textContent = `Đã nhận: 0 số`;
        const inputs = fullBoardContainer.querySelectorAll('input');
        inputs.forEach(i => i.value = '');
        showToast("Đã xóa trắng bảng nhập liệu", "info");
    });

    // --- MAIN PREDICTION & IDEMPOTENT LOCK HANDLER ---
    btnRunPrediction.addEventListener('click', runPrediction);

    function runPrediction() {
        const selectedDate = inputDrawDate.value || todayVN;
        const lockedDays = getLockedDays();

        if (lockedDays[selectedDate]) {
            renderLockedPrediction(lockedDays[selectedDate]);
            showToast(`🔒 Ngày ${selectedDate} đã được chốt số cố định từ trước! Hiển thị lại bản chốt.`, "info");
            return;
        }

        let lottoNumbers = [];
        let specialPrize = '';
        let prize1 = '';
        let rawPrizes = {};

        if (currentMode === 'quick') {
            const txt = quickInputText.value.trim();
            if (!txt) {
                showToast("Vui lòng nhập hoặc dán dãy số lô đã về!", "warning");
                return;
            }
            lottoNumbers = engine.parseQuickInput(txt);
            if (lottoNumbers.length > 0) specialPrize = lottoNumbers[0];
        } else {
            const inputs = fullBoardContainer.querySelectorAll('input');
            inputs.forEach(i => {
                const key = i.id.replace('g_', '');
                rawPrizes[key] = i.value;
            });
            const parsed = engine.parseFullBoard(rawPrizes);
            lottoNumbers = parsed.lottoNumbers;
            specialPrize = parsed.specialPrize;
            prize1 = rawPrizes.g1 || '';
        }

        if (lottoNumbers.length === 0) {
            showToast("Không nhận diện được số lô hợp lệ. Vui lòng kiểm tra lại!", "error");
            return;
        }

        // TỰ ĐỘNG ĐỐI CHIẾU HÔM QUA & HỌC TĂNG CƯỜNG
        let evalResult = null;
        let learningEntry = null;
        const activePastPred = getActivePrediction(selectedDate);
        if (activePastPred) {
            evalResult = engine.evaluatePastPrediction(lottoNumbers, specialPrize, activePastPred, rawPrizes);
            if (evalResult) {
                learningEntry = engine.adaptWeightsAndLearn(evalResult);
                renderEvaluationReport(evalResult, learningEntry);
            }
        } else {
            renderInitialEvaluationState();
        }

        updateWeightDisplay();

        // DỰ ĐOÁN NGÀY MAI & SINH SỔ TAY CHỐT SỐ TOÀN DIỆN
        const result = engine.predict(lottoNumbers, specialPrize, selectedDate);
        lastPredictionResult = result;
        lastFullBettingSlip = result.fullBettingSlip;
        const lottoVector = engine.computeLottoVector(lottoNumbers);

        lastInputData = {
            date: selectedDate,
            specialPrize,
            prize1,
            rawPrizes,
            lottoNumbers,
            lottoVector
        };

        saveActivePrediction({
            date: selectedDate,
            recommendations: result.recommendations,
            fullBettingSlip: result.fullBettingSlip,
            reasons: result.reasons
        });

        // KHÓA CỐ ĐỊNH KỲ NÀY
        saveLockedDay(selectedDate, {
            drawDate: selectedDate,
            inputData: lastInputData,
            predictionResult: result,
            fullBettingSlip: result.fullBettingSlip,
            evalResult,
            learningEntry,
            lockedAt: new Date().toISOString()
        });

        saveDrawToLocalStorage(lastInputData, result, result.fullBettingSlip);

        // TỰ ĐỘNG BẮN SỐ QUA TELEGRAM BOT VÀ LƯU LÊN CLOUD MASTER SERVER
        broadcastSlipToMasterServer(lastInputData, result, result.fullBettingSlip);

        renderPredictions(result);
        renderHeadTails(result.inputSummary);
        renderHeatmap(result.scores);
        renderFullBettingSlip(result.fullBettingSlip);

        if (vectorInspectorBox) {
            vectorInspectorBox.textContent = lottoVector;
        }

        showToast("🔒 Đã chốt số cố định & ghi vào Sổ Tay Chốt Số Toàn Diện!");
    }

    async function broadcastSlipToMasterServer(inputData, predictionResult, fullSlip) {
        const payload = {
            draw_date: inputData.date,
            special_prize: inputData.specialPrize,
            prize_1: inputData.prize1,
            raw_prizes: inputData.rawPrizes,
            lotto_numbers: inputData.lottoNumbers,
            full_betting_slip: fullSlip
        };

        const endpoints = [];
        const primaryApi = `${getApiBase()}/save-draw`;
        endpoints.push(primaryApi);

        const cloudUrl = getCloudServerUrl();
        if (cloudUrl && !primaryApi.startsWith(cloudUrl)) {
            endpoints.push(`${cloudUrl}/api/save-draw`);
        }

        let sentSuccess = false;
        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => null);

                if (res && res.ok) {
                    sentSuccess = true;
                }
            } catch (e) {}
        }

        if (sentSuccess) {
            showToast("🤖 Đã tự động bắn Sổ Tay Chốt Số VIP vào nhóm Telegram!", "success");
        }
    }

    async function syncCanonicalSlipFromCloud(selectedDate) {
        const targets = [];
        const primaryApi = `${getApiBase()}/canonical-slip?date=${selectedDate}`;
        targets.push(primaryApi);

        const cloudUrl = getCloudServerUrl();
        if (cloudUrl && !primaryApi.startsWith(cloudUrl)) {
            targets.push(`${cloudUrl}/api/canonical-slip?date=${selectedDate}`);
        }

        for (const url of targets) {
            try {
                const res = await fetch(url, { cache: 'no-cache' }).catch(() => null);
                if (res && res.ok) {
                    const json = await res.json();
                    if (json && json.data && json.data.full_betting_slip) {
                        const lockedDays = getLockedDays();
                        const currentLocked = lockedDays[selectedDate];

                        const canonData = {
                            drawDate: selectedDate,
                            inputData: {
                                date: selectedDate,
                                lottoNumbers: json.data.lotto_numbers || [],
                                specialPrize: json.data.special_prize || '',
                                prize1: json.data.prize_1 || '',
                                rawPrizes: json.data.raw_prizes || {}
                            },
                            predictionResult: {
                                recommendations: {
                                    bachThu: json.data.full_betting_slip.baoLo.btl,
                                    songThu: json.data.full_betting_slip.baoLo.stl,
                                    dan4: json.data.full_betting_slip.baoLo.dan4,
                                    chamDe: json.data.full_betting_slip.dacBiet.chamDe
                                },
                                fullBettingSlip: json.data.full_betting_slip
                            },
                            fullBettingSlip: json.data.full_betting_slip,
                            lockedAt: new Date().toISOString()
                        };

                        if (!currentLocked || JSON.stringify(currentLocked.fullBettingSlip) !== JSON.stringify(canonData.fullBettingSlip)) {
                            saveLockedDay(selectedDate, canonData);
                            if (inputDrawDate && inputDrawDate.value === selectedDate) {
                                renderLockedPrediction(canonData);
                                showToast(`☁️ Đã tự động đồng bộ Sổ Chốt ngày ${selectedDate} từ Cloud!`, "info");
                            }
                            return true;
                        }
                    }
                }
            } catch (e) {}
        }
        return false;
    }

    function initCloudStatusUI() {
        if (inputCloudServerUrl) {
            inputCloudServerUrl.value = getCloudServerUrl();
        }
        testCloudConnection(false);
    }

    async function testCloudConnection(showFeedback = false) {
        const cloudUrl = getCloudServerUrl();
        if (cloudPingText) cloudPingText.textContent = "Đang kiểm tra...";
        
        try {
            const res = await fetch(`${cloudUrl}/api/status`, { cache: 'no-cache' }).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (cloudStatusDot) cloudStatusDot.className = "w-2 h-2 rounded-full bg-emerald-400";
                if (cloudStatusText) cloudStatusText.textContent = "☁️ Cloud Live";
                if (cloudPingText) cloudPingText.innerHTML = `<span class="text-emerald-400 font-bold">🟢 Kết nối Tốt (${data.service || 'Render Master'})</span>`;
                if (cloudServerTimeText) cloudServerTimeText.textContent = `Giờ máy chủ: ${data.server_time_vn || '--'}`;
                if (showFeedback) showToast("🟢 Kết nối Máy chủ Cloud thành công!", "success");
                return true;
            }
        } catch (e) {}

        if (cloudStatusDot) cloudStatusDot.className = "w-2 h-2 rounded-full bg-amber-400";
        if (cloudStatusText) cloudStatusText.textContent = "☁️ Cào Trực Tuyến";
        if (cloudPingText) cloudPingText.innerHTML = `<span class="text-amber-400 font-semibold">🟡 Cào trực tiếp từ mạng (Đã kích hoạt)</span>`;
        if (showFeedback) showToast("Đã kích hoạt chế độ cào mạng trực tiếp!", "info");
        return false;
    }

    if (btnOpenCloudModal) {
        btnOpenCloudModal.addEventListener('click', () => {
            if (inputCloudServerUrl) inputCloudServerUrl.value = getCloudServerUrl();
            testCloudConnection(false);
            if (cloudConfigModal) {
                cloudConfigModal.classList.remove('hidden');
                cloudConfigModal.classList.add('flex');
            }
        });
    }

    if (btnCloseCloudModal) {
        btnCloseCloudModal.addEventListener('click', () => {
            if (cloudConfigModal) {
                cloudConfigModal.classList.add('hidden');
                cloudConfigModal.classList.remove('flex');
            }
        });
    }

    if (btnTestAndSaveCloud) {
        btnTestAndSaveCloud.addEventListener('click', async () => {
            const val = (inputCloudServerUrl.value || '').trim();
            if (val) {
                localStorage.setItem('bo_so_cloud_server_url', val);
            }
            await testCloudConnection(true);
            const curDate = inputDrawDate.value || todayVN;
            syncCanonicalSlipFromCloud(curDate);
        });
    }

    if (btnSyncNowCloud) {
        btnSyncNowCloud.addEventListener('click', async () => {
            const curDate = inputDrawDate.value || todayVN;
            showToast("🔄 Đang đồng bộ dữ liệu từ Cloud...", "info");
            const synced = await syncCanonicalSlipFromCloud(curDate);
            if (synced) {
                showToast(`✅ Đã đồng bộ thành công ngày ${curDate} từ Cloud!`, "success");
            } else {
                showToast("Dữ liệu trên máy và Cloud đã đồng nhất!", "info");
            }
        });
    }

    // --- RENDER FULL BETTING SLIP ---
    function renderFullBettingSlip(slip) {
        if (!slip) return;

        const b = slip.baoLo || {};
        const x = slip.loXien || {};
        const d = slip.dacBiet || {};
        const c = slip.baCang || {};

        slipBTL.textContent = b.btl || '--';
        slipSTL.textContent = (b.stl && b.stl.join(' - ')) || '--';
        slipKep.textContent = (b.topKep && b.topKep.join(', ')) || '00, 11';
        slipDan4.textContent = (b.dan4 && b.dan4.join(' - ')) || '--';
        slipDan8.textContent = (b.dan8 && b.dan8.join(' - ')) || '--';
        slipDan10.textContent = (b.dan10 && b.dan10.join(', ')) || '--';

        slipXien2.textContent = (x.xien2 && x.xien2.map(i => `(${i.join('-')})`).join('   ')) || '--';
        slipXien3.textContent = (x.xien3 && x.xien3.map(i => `(${i.join('-')})`).join('   ')) || '--';
        slipXien4.textContent = (x.xien4 && x.xien4.map(i => `(${i.join('-')})`).join('   ')) || '--';
        slipXQCore.textContent = x.xienQuay4 ? `[${x.xienQuay4.join(', ')}]` : '--';

        if (x.xienQuayPairs && x.xienQuayTriplets && x.xienQuay4) {
            let xqHTML = `<div class="font-bold text-amber-300 mb-1">• 6 Cặp Xiên 2:</div> ${x.xienQuayPairs.join(' | ')}<br>`;
            xqHTML += `<div class="font-bold text-purple-300 my-1">• 4 Bộ Xiên 3:</div> ${x.xienQuayTriplets.join(' | ')}<br>`;
            xqHTML += `<div class="font-bold text-pink-300 my-1">• 1 Bộ Xiên 4:</div> (${x.xienQuay4.join('-')})`;
            slipXQDetails.innerHTML = xqHTML;
        } else {
            slipXQDetails.textContent = '--';
        }

        slipDeBTL.textContent = d.deBTL || '--';
        slipDeSTL.textContent = (d.deSTL && d.deSTL.join(' - ')) || '--';
        slipChamDe.textContent = `Chạm [${(d.chamDe && d.chamDe.join(', ')) || '--'}] | Tổng [${(d.topSums && d.topSums.join(', ')) || '--'}]`;
        slipDanDe10.textContent = (d.danDe10 && d.danDe10.join(', ')) || '--';
        slipDanDe20.textContent = (d.danDe20 && d.danDe20.join(', ')) || '--';
        slipDanDe36.textContent = (d.danDe36 && d.danDe36.join(', ')) || '--';
        slipDanDe64.textContent = (d.danDe64 && d.danDe64.join(', ')) || '--';

        slipTopCangs.textContent = `Càng [${(c.topCangs && c.topCangs.join(', ')) || '--'}]`;
        slip3CangLo.textContent = (c.baCangLoVIP && c.baCangLoVIP.join(' - ')) || '--';
        slip3CangDe.textContent = (c.baCangDeVIP && c.baCangDeVIP.join(' - ')) || '--';
        slipDan3Cang.textContent = (c.danBaCang && c.danBaCang.join(', ')) || '--';

        if (resDeBTL) resDeBTL.textContent = d.deBTL || '--';
        if (res3CangVIP) res3CangVIP.textContent = (c.baCangLoVIP && c.baCangLoVIP.slice(0, 2).join(', ')) || '--';
    }

    // --- COPY & PRINT FULL SLIP ---
    btnCopyFullSlip.addEventListener('click', () => {
        if (!lastFullBettingSlip) {
            showToast("Chưa có sổ chốt số để copy!");
            return;
        }
        const text = formatSlipToText(lastFullBettingSlip);
        navigator.clipboard.writeText(text).then(() => {
            showToast("📋 Đã sao chép toàn bộ Sổ Tay Chốt Số vào Clipboard!");
        }).catch(() => {
            showToast("Đã copy sổ chốt!");
        });
    });

    function formatSlipToText(s) {
        if (!s) return '';
        const b = s.baoLo || {};
        const x = s.loXien || {};
        const d = s.dacBiet || {};
        const c = s.baCang || {};

        return `======================================\n` +
            `⚡ SỔ TAY CHỐT SỐ TOÀN DIỆN - NGÀY ${s.drawDate || ''}\n` +
            `======================================\n\n` +
            `⭐ 1. BAO LÔ TÔ:\n` +
            `• Bạch Thủ Lô VIP: ${b.btl || '--'}\n` +
            `• Song Thủ Lô VIP: ${(b.stl && b.stl.join(' - ')) || '--'}\n` +
            `• Lô Kép Đẹp: ${(b.topKep && b.topKep.join(', ')) || '--'}\n` +
            `• Dàn Lô 4 Số: ${(b.dan4 && b.dan4.join(' - ')) || '--'}\n` +
            `• Dàn Lô 8 Số: ${(b.dan8 && b.dan8.join(' - ')) || '--'}\n` +
            `• Dàn Lô 10 Số: ${(b.dan10 && b.dan10.join(', ')) || '--'}\n\n` +
            `🎯 2. LÔ XIÊN & XIÊN QUAY:\n` +
            `• Cặp Xiên 2: ${(x.xien2 && x.xien2.map(i => i.join('-')).join(', ')) || '--'}\n` +
            `• Bộ Xiên 3: ${(x.xien3 && x.xien3.map(i => i.join('-')).join(', ')) || '--'}\n` +
            `• Bộ Xiên 4: ${(x.xien4 && x.xien4[0] && `(${x.xien4[0].join('-')})`) || '--'}\n` +
            `• Dàn Xiên Quay 4: [${(x.xienQuay4 && x.xienQuay4.join(', ')) || '--'}]\n\n` +
            `👑 3. ĐẶC BIỆT & DÀN ĐỀ:\n` +
            `• Đề Bạch Thủ: ${d.deBTL || '--'}\n` +
            `• Đề Song Thủ: ${(d.deSTL && d.deSTL.join(' - ')) || '--'}\n` +
            `• Chạm Đề: [${(d.chamDe && d.chamDe.join(', ')) || '--'}]\n` +
            `• Dàn Đề 10 Số: ${(d.danDe10 && d.danDe10.join(', ')) || '--'}\n` +
            `• Dàn Đề 20 Số: ${(d.danDe20 && d.danDe20.join(', ')) || '--'}\n` +
            `• Dàn Đề 36 Số: ${(d.danDe36 && d.danDe36.join(', ')) || '--'}\n` +
            `• Dàn Đề 64 Số: ${(d.danDe64 && d.danDe64.join(', ')) || '--'}\n\n` +
            `🔮 4. BA CÀNG CÁC LOẠI:\n` +
            `• Càng Sáng: [${(c.topCangs && c.topCangs.join(', ')) || '--'}]\n` +
            `• 3 Càng Lô VIP: ${(c.baCangLoVIP && c.baCangLoVIP.join(' - ')) || '--'}\n` +
            `• 3 Càng Đề VIP: ${(c.baCangDeVIP && c.baCangDeVIP.join(' - ')) || '--'}\n` +
            `• Dàn 3 Càng: ${(c.danBaCang && c.danBaCang.join(', ')) || '--'}\n\n` +
            `Chúc bạn may mắn và thắng lớn hôm nay!`;
    }

    window.copySection = function(section) {
        if (!lastFullBettingSlip) {
            showToast("Chưa có dữ liệu!");
            return;
        }
        const s = lastFullBettingSlip;
        const b = s.baoLo || {};
        const x = s.loXien || {};
        const d = s.dacBiet || {};
        const c = s.baCang || {};
        let text = '';

        if (section === 'baoLo') {
            text = `[BAO LÔ NGÀY ${s.drawDate || ''}]\nBTL: ${b.btl || '--'} | STL: ${(b.stl && b.stl.join('-')) || '--'} | Dàn 4: ${(b.dan4 && b.dan4.join('-')) || '--'} | Dàn 8: ${(b.dan8 && b.dan8.join('-')) || '--'}`;
        } else if (section === 'loXien') {
            text = `[LÔ XIÊN NGÀY ${s.drawDate || ''}]\nXiên 2: ${(x.xien2 && x.xien2.map(i => i.join('-')).join(', ')) || '--'}\nXiên 3: ${(x.xien3 && x.xien3.map(i => i.join('-')).join(', ')) || '--'}\nXiên Quay: [${(x.xienQuay4 && x.xienQuay4.join(', ')) || '--'}]`;
        } else if (section === 'dacBiet') {
            text = `[ĐẶC BIỆT & DÀN ĐỀ NGÀY ${s.drawDate || ''}]\nĐề BTL: ${d.deBTL || '--'} | Đề STL: ${(d.deSTL && d.deSTL.join('-')) || '--'}\nChạm: ${(d.chamDe && d.chamDe.join(',')) || '--'}\nDàn 10: ${(d.danDe10 && d.danDe10.join(', ')) || '--'}\nDàn 36: ${(d.danDe36 && d.danDe36.join(', ')) || '--'}`;
        } else if (section === 'baCang') {
            text = `[3 CÀNG NGÀY ${s.drawDate || ''}]\n3 Càng Lô: ${(c.baCangLoVIP && c.baCangLoVIP.join(' - ')) || '--'}\n3 Càng Đề: ${(c.baCangDeVIP && c.baCangDeVIP.join(' - ')) || '--'}`;
        }

        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast("📋 Đã copy mục này vào Clipboard!");
            });
        }
    };

    btnPrintSlip.addEventListener('click', () => {
        window.print();
    });

    // --- RENDER EVALUATION & LEARNING REPORT ---
    function renderEvaluationReport(evalResult, learningEntry) {
        if (!evalResult) return;

        // Điểm đánh giá tổng hợp
        if (evalAccuracyBadge) {
            const score = evalResult.totalScorePoints;
            if (score >= 80) {
                evalAccuracyBadge.className = 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black animate-pulse';
                evalAccuracyBadge.textContent = `${score}đ • ĐẠI THẮNG 🔥`;
            } else if (score >= 40) {
                evalAccuracyBadge.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black';
                evalAccuracyBadge.textContent = `${score}đ • THẮNG LÔ TÔ ✨`;
            } else {
                evalAccuracyBadge.className = 'px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black';
                evalAccuracyBadge.textContent = `${score}đ • ĐANG HỌC HỎI 🧠`;
            }
        }

        // 1. BAO LÔ & LÔ KÉP
        const b = evalResult.baoLo || {};
        if (evalBTL && b.btl) {
            evalBTL.innerHTML = b.btl.success
                ? `<span class="text-emerald-400 font-bold">[${b.btl.num}] ➜ TRÚNG ${b.btl.hits} NHÁY 🎯</span>`
                : `<span class="text-gray-400">[${b.btl.num}] ➜ Chưa về</span>`;
        }
        if (evalSTL && b.stl) {
            evalSTL.innerHTML = b.stl.hits.length > 0
                ? `<span class="text-cyan-300 font-bold">[${b.stl.list.join('-')}] ➜ Trúng ${b.stl.hits.join(', ')} 💎</span>`
                : `<span class="text-gray-400">[${b.stl.list.join('-')}] ➜ Chưa về</span>`;
        }
        if (evalDanLotto && b.dan4) {
            evalDanLotto.innerHTML = b.dan4.hits.length > 0
                ? `<span class="text-amber-300 font-bold">Ăn ${b.dan4.hits.length}/4 con (${b.dan4.hits.join(', ')})</span>`
                : `<span class="text-gray-400">Ăn 0/4 con</span>`;
        }
        if (evalKep && b.topKep) {
            evalKep.innerHTML = b.topKep.hits.length > 0
                ? `<span class="text-emerald-300 font-bold">Nổ Kép: ${b.topKep.hits.join(', ')} ⚡</span>`
                : `<span class="text-gray-400">[${b.topKep.list.join(', ')}] ➜ Chưa về</span>`;
        }

        // 2. XIÊN & XIÊN QUAY
        const x = evalResult.loXien || {};
        if (evalXien2 && x.xien2) {
            evalXien2.innerHTML = x.xien2.won.length > 0
                ? `<span class="text-cyan-300 font-bold">Ăn ${x.xien2.won.length} cặp (${x.xien2.won.map(p => p.join('-')).join(', ')}) 🔥</span>`
                : `<span class="text-gray-400">Chưa ăn cặp xiên</span>`;
        }
        if (evalXienQuay && x.xienQuay4) {
            evalXienQuay.innerHTML = x.xienQuay4.hits.length >= 2
                ? `<span class="text-emerald-300 font-bold">Xiên Quay về ${x.xienQuay4.hits.length}/4 con (${x.xienQuay4.hits.join(', ')}) 🎯</span>`
                : `<span class="text-gray-400">Về ${x.xienQuay4.hits.length}/4 con</span>`;
        }

        // 3. ĐẶC BIỆT & DÀN ĐỀ
        const d = evalResult.dacBiet || {};
        if (evalDeBTL && d.deBTL) {
            evalDeBTL.innerHTML = d.deBTL.success
                ? `<span class="text-pink-400 font-black">TRÚNG ĐỀ BTL ${d.deBTL.num} (ĐB: ${evalResult.actualGDB}) 👑</span>`
                : `<span class="text-gray-400">[${d.deBTL.num}] ➜ ĐB về ${evalResult.actualGDB}</span>`;
        }
        if (evalChamDe && d.chamDe) {
            evalChamDe.innerHTML = d.chamDe.success
                ? `<span class="text-pink-300 font-bold">Trúng Chạm [${d.chamDe.hitChams.join(',')}] (ĐB: ${evalResult.actualGDB}) 👑</span>`
                : `<span class="text-gray-400">Lệch Chạm (ĐB: ${evalResult.actualGDB})</span>`;
        }
        if (evalDanDe && d.danDe10) {
            if (d.danDe10.success) {
                evalDanDe.innerHTML = `<span class="text-emerald-400 font-bold">Ăn Đề trong Dàn 10 Số 💎</span>`;
            } else if (d.danDe20.success) {
                evalDanDe.innerHTML = `<span class="text-cyan-300 font-bold">Ăn Đề trong Dàn 20 Số ✨</span>`;
            } else if (d.danDe36.success) {
                evalDanDe.innerHTML = `<span class="text-amber-300 font-bold">Ăn Đề trong Dàn 36 Số ✨</span>`;
            } else if (d.danDe64.success) {
                evalDanDe.innerHTML = `<span class="text-purple-300 font-bold">Ăn Đề trong Dàn 64 Số</span>`;
            } else {
                evalDanDe.innerHTML = `<span class="text-gray-400">Chưa nổ trong dàn</span>`;
            }
        }

        // 4. BA CÀNG
        const c = evalResult.baCang || {};
        if (eval3CangDe && c.deVIP) {
            eval3CangDe.innerHTML = c.deVIP.success
                ? `<span class="text-purple-300 font-black">TRÚNG 3 CÀNG ĐỀ (${evalResult.actual3CangDe}) 🔮</span>`
                : `<span class="text-gray-400">3 Càng ĐB về ${evalResult.actual3CangDe || '--'}</span>`;
        }
        if (eval3CangLo && c.loVIP) {
            eval3CangLo.innerHTML = c.loVIP.hits.length > 0
                ? `<span class="text-purple-300 font-bold">Trúng 3 Càng Lô: ${c.loVIP.hits.join(', ')} 🔥</span>`
                : `<span class="text-gray-400">[${c.loVIP.list.join(', ')}] ➜ Chưa về</span>`;
        }
        if (evalDan3Cang && c.danBaCang) {
            evalDan3Cang.innerHTML = c.danBaCang.count > 0
                ? `<span class="text-purple-300 font-bold">Trúng ${c.danBaCang.count} con (${c.danBaCang.hits.join(', ')})</span>`
                : `<span class="text-gray-400">Chưa nổ dàn 3 càng</span>`;
        }

        // Danh sách bài học AI
        if (aiLessonsList) {
            aiLessonsList.innerHTML = '';
            if (learningEntry && learningEntry.lessons) {
                learningEntry.lessons.forEach(l => {
                    const item = document.createElement('div');
                    item.className = 'text-gray-200 flex items-start space-x-1.5 text-xs';
                    item.innerHTML = `<span class="text-amber-400 font-bold">✔</span><span>${l}</span>`;
                    aiLessonsList.appendChild(item);
                });
            }
        }
    }

    function renderInitialEvaluationState() {
        const lockedDays = getLockedDays();
        const dates = Object.keys(lockedDays).sort().reverse();
        const lastLockedDate = dates[0];
        const lastLocked = lastLockedDate ? lockedDays[lastLockedDate] : null;

        if (lastLocked && lastLocked.fullBettingSlip) {
            const slip = lastLocked.fullBettingSlip;
            if (evalAccuracyBadge) evalAccuracyBadge.textContent = `MỐC: NGÀY ${lastLockedDate}`;
            if (evalBTL && slip.baoLo) evalBTL.innerHTML = `<span class="text-amber-300 font-bold font-mono text-xs">${slip.baoLo.btl} (Đã chốt)</span>`;
            if (evalSTL && slip.baoLo) evalSTL.innerHTML = `<span class="text-cyan-300 font-mono text-xs">${slip.baoLo.stl.join(' - ')}</span>`;
            if (evalDanLotto && slip.baoLo) evalDanLotto.innerHTML = `<span class="text-yellow-300 font-mono text-xs">${slip.baoLo.dan4.join(' - ')}</span>`;
            if (evalKep && slip.baoLo) evalKep.innerHTML = `<span class="text-gray-300 font-mono text-xs">${slip.baoLo.topKep.join(', ')}</span>`;
            if (evalXien2 && slip.loXien) evalXien2.innerHTML = `<span class="text-cyan-300 font-mono text-xs">${slip.loXien.xien2.map(i => i.join('-')).join(', ')}</span>`;
            if (evalXienQuay && slip.loXien) evalXienQuay.innerHTML = `<span class="text-gray-300 font-mono text-xs">[${slip.loXien.xienQuay4.join(',')}]</span>`;
            if (evalDeBTL && slip.dacBiet) evalDeBTL.innerHTML = `<span class="text-pink-300 font-mono text-xs">${slip.dacBiet.deBTL}</span>`;
            if (evalChamDe && slip.dacBiet) evalChamDe.innerHTML = `<span class="text-pink-300 font-mono text-xs">Chạm [${slip.dacBiet.chamDe.join(',')}]</span>`;
            if (evalDanDe) evalDanDe.innerHTML = `<span class="text-gray-300 font-mono text-xs">Dàn 10, 20, 36, 64 số</span>`;
            if (eval3CangDe && slip.baCang) eval3CangDe.innerHTML = `<span class="text-purple-300 font-mono text-xs">${slip.baCang.baCangDeVIP.slice(0, 3).join(', ')}</span>`;
            if (eval3CangLo && slip.baCang) eval3CangLo.innerHTML = `<span class="text-purple-300 font-mono text-xs">${slip.baCang.baCangLoVIP.join(' - ')}</span>`;
            if (evalDan3Cang) evalDan3Cang.innerHTML = `<span class="text-gray-300 font-mono text-xs">Dàn 3 Càng ghép</span>`;
            if (aiLessonsList) aiLessonsList.innerHTML = `<div>⚡ Bản chốt số ngày <strong>${lastLockedDate}</strong> đã được nạp làm mốc đối chiếu. Khi bạn nạp kết quả kỳ mới, hệ thống sẽ tự động so khớp tất cả 4 hạng mục Lô, Xiên, Đề, 3 Càng và rút bài học kinh nghiệm!</div>`;
        }
    }

    function getActivePrediction(beforeDate) {
        try {
            const s = localStorage.getItem('bo_so_active_prediction');
            if (s) {
                const parsed = JSON.parse(s);
                if (!beforeDate || parsed.date < beforeDate) {
                    return parsed;
                }
            }
        } catch (e) {}

        // Fallback: Tìm ngày đã khóa gần nhất TRƯỚC ngày được chọn
        const lockedDays = getLockedDays();
        const dates = Object.keys(lockedDays).filter(d => !beforeDate || d < beforeDate).sort().reverse();
        if (dates.length > 0) {
            const last = lockedDays[dates[0]];
            if (last) {
                return {
                    date: last.drawDate,
                    recommendations: last.predictionResult ? last.predictionResult.recommendations : (last.recommendations || {}),
                    fullBettingSlip: last.fullBettingSlip || (last.predictionResult ? last.predictionResult.fullBettingSlip : null),
                    reasons: last.predictionResult ? last.predictionResult.reasons : (last.reasons || {})
                };
            }
        }
        return null;
    }

    function saveActivePrediction(pred) {
        try {
            localStorage.setItem('bo_so_active_prediction', JSON.stringify(pred));
        } catch (e) {}
    }

    // --- RENDER PREDICTIONS ---
    function renderPredictions(result) {
        const { recommendations, rankedList, inputSummary } = result;

        resBachThu.textContent = recommendations.bachThu;
        btlScoreBadge.textContent = `${recommendations.bachThuScore}đ`;
        resSongThu.textContent = recommendations.songThu.join(' - ');

        silentHeadsList.textContent = inputSummary.silentHeads.length > 0 
            ? `Đầu ${inputSummary.silentHeads.join(', ')} câm` 
            : 'Không có đầu câm';
        silentTailsList.textContent = inputSummary.silentTails.length > 0 
            ? `Đuôi ${inputSummary.silentTails.join(', ')} câm` 
            : 'Không có đuôi câm';

        topRankedTable.innerHTML = '';
        const top10 = rankedList.slice(0, 10);
        const maxScore = Math.max(...top10.map(t => t.score), 1);

        top10.forEach((item, idx) => {
            const percent = Math.min(100, Math.round((item.score / maxScore) * 100));
            const mainReason = item.reasons.length > 0 ? item.reasons[0].desc : 'Thống kê xác suất tổng hợp';
            
            const row = document.createElement('div');
            row.className = 'p-3 rounded-xl bg-gray-900/90 border border-gray-800 hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between space-x-3';
            row.onclick = () => openReasonModal(item.num, item.score, item.reasons);

            row.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-6 text-center font-bold text-xs ${idx === 0 ? 'text-amber-400 font-black' : idx < 3 ? 'text-cyan-400' : 'text-gray-500'}">
                        #${idx + 1}
                    </span>
                    <div class="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center font-black font-mono text-lg text-amber-300">
                        ${item.num}
                    </div>
                    <div>
                        <div class="text-xs font-semibold text-gray-200 flex items-center space-x-2">
                            <span>Số <strong>${item.num}</strong></span>
                            ${item.hitToday > 0 ? `<span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px]">Hôm nay về ${item.hitToday} nháy</span>` : ''}
                        </div>
                        <p class="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-xs">${mainReason}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <div class="w-24 hidden sm:block">
                        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full" style="width: ${percent}%"></div>
                        </div>
                    </div>
                    <span class="text-xs font-black font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ${item.score}đ
                    </span>
                </div>
            `;
            topRankedTable.appendChild(row);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderHeadTails(inputSummary) {
        const { heads, tails } = inputSummary;
        headsTable.innerHTML = '';
        tailsTable.innerHTML = '';

        for (let i = 0; i <= 9; i++) {
            const key = String(i);
            const headNums = heads[key] || [];
            const isHeadSilent = headNums.length === 0;
            const hRow = document.createElement('div');
            hRow.className = `p-2.5 rounded-xl border flex items-center justify-between ${isHeadSilent ? 'bg-red-950/30 border-red-500/50 text-red-300' : 'bg-gray-900/80 border-gray-800'}`;
            hRow.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-amber-400 font-mono">Đầu ${key}</span>
                    <span class="font-mono text-sm tracking-wider ${isHeadSilent ? 'font-bold text-red-400' : 'text-gray-200'}">
                        ${isHeadSilent ? '🛑 CÂM (Không về con nào)' : headNums.join(', ')}
                    </span>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">${headNums.length} con</span>
            `;
            headsTable.appendChild(hRow);

            const tailNums = tails[key] || [];
            const isTailSilent = tailNums.length === 0;
            const tRow = document.createElement('div');
            tRow.className = `p-2.5 rounded-xl border flex items-center justify-between ${isTailSilent ? 'bg-orange-950/30 border-orange-500/50 text-orange-300' : 'bg-gray-900/80 border-gray-800'}`;
            tRow.innerHTML = `
                <div class="flex items-center space-x-3">
                    <span class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-cyan-400 font-mono">Đuôi ${key}</span>
                    <span class="font-mono text-sm tracking-wider ${isTailSilent ? 'font-bold text-orange-400' : 'text-gray-200'}">
                        ${isTailSilent ? '⛔ CÂM (Không về con nào)' : tailNums.join(', ')}
                    </span>
                </div>
                <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">${tailNums.length} con</span>
            `;
            tailsTable.appendChild(tRow);
        }
    }

    function renderHeatmap(scores) {
        heatmapGrid.innerHTML = '';
        const scoreValues = Object.values(scores || {});
        const maxScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;

        for (let i = 0; i < 100; i++) {
            const numStr = engine.formatNum(i);
            const score = (scores && scores[numStr]) || 0;
            
            let heatClass = 'heat-cold';
            if (maxScore > 0 && score > 0) {
                const ratio = score / maxScore;
                if (ratio >= 0.8) heatClass = 'heat-hot';
                else if (ratio >= 0.6) heatClass = 'heat-warm';
                else if (ratio >= 0.4) heatClass = 'heat-medium';
                else if (ratio >= 0.2) heatClass = 'heat-mild';
            }

            const cell = document.createElement('div');
            cell.className = `heatmap-cell rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer transition aspect-square ${heatClass}`;
            cell.innerHTML = `
                <span class="font-mono font-black text-sm sm:text-base">${numStr}</span>
                <span class="text-[10px] font-semibold opacity-90">${score}đ</span>
            `;
            cell.onclick = () => {
                const reasons = (lastPredictionResult && lastPredictionResult.reasons[numStr]) || [];
                openReasonModal(numStr, score, reasons);
            };
            heatmapGrid.appendChild(cell);
        }
    }

    renderHeatmap({});

    // --- REASON INSPECTOR MODAL ---
    function openReasonModal(numStr, score, reasons) {
        modalNumCircle.textContent = numStr;
        modalScoreText.textContent = `Tổng điểm tín hiệu: ${score}đ`;
        modalReasonsList.innerHTML = '';

        if (!reasons || reasons.length === 0) {
            modalReasonsList.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    Số ${numStr} không có tín hiệu mạnh từ bạc nhớ hoặc đầu đuôi câm hôm nay.
                </div>
            `;
        } else {
            reasons.forEach(r => {
                const item = document.createElement('div');
                item.className = 'p-2.5 rounded-xl bg-gray-900 border border-gray-800 flex items-start space-x-2.5';
                item.innerHTML = `
                    <span class="text-base">${r.icon || '📌'}</span>
                    <div class="flex-1">
                        <p class="text-gray-200 font-medium">${r.desc}</p>
                        <span class="text-[10px] text-amber-400 font-bold">+${r.points} điểm</span>
                    </div>
                `;
                modalReasonsList.appendChild(item);
            });
        }

        reasonModal.classList.remove('hidden');
        reasonModal.classList.add('flex');
    }

    function closeModal() {
        reasonModal.classList.add('hidden');
        reasonModal.classList.remove('flex');
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnDoneModal.addEventListener('click', closeModal);
    reasonModal.addEventListener('click', (e) => {
        if (e.target === reasonModal) closeModal();
    });

    // --- MYSQL & DEEP LEARNING ACTIONS ---
    function handleSaveToMySQL() {
        if (!lastInputData || !lastPredictionResult) {
            runPrediction();
        }
        if (!lastInputData) {
            showToast("Vui lòng nhập kết quả xổ số trước khi lưu!", "warning");
            return;
        }

        saveDrawToLocalStorage(lastInputData, lastPredictionResult, lastFullBettingSlip);

        const payload = {
            draw_date: lastInputData.date,
            special_prize: lastInputData.specialPrize,
            prize_1: lastInputData.prize1,
            raw_prizes: lastInputData.rawPrizes,
            lotto_numbers: lastInputData.lottoNumbers
        };

        fetch(`${getApiBase()}/save-draw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json())
          .then(data => {
              showToast(`💾 Đã lưu thành công kỳ ngày ${lastInputData.date} vào MySQL & Dataset AI!`);
          })
          .catch(() => {
              showToast(`💾 Đã lưu dữ liệu kỳ ngày ${lastInputData.date} (Sẵn sàng xuất SQL & Dataset)!`);
          });
    }

    if (btnSaveToMySQLTab) btnSaveToMySQLTab.addEventListener('click', handleSaveToMySQL);

    if (btnExportSQL) {
        btnExportSQL.addEventListener('click', () => {
            const history = getHistory();
            let sqlContent = `-- BỘ SỐ HUYỀN THOẠI - DỮ LIỆU CÁC KỲ QUAY ĐÃ LƯU\nUSE \`bo_so_huyen_thoai\`;\n\n`;

            if (lastInputData) {
                sqlContent += engine.generateSQLInsert(
                    lastInputData.date,
                    lastInputData.specialPrize,
                    lastInputData.prize1,
                    lastInputData.rawPrizes,
                    lastInputData.lottoNumbers
                ) + "\n\n";
            }

            history.forEach(item => {
                if (!lastInputData || item.date !== lastInputData.date) {
                    sqlContent += engine.generateSQLInsert(
                        item.date,
                        item.specialPrize || '',
                        item.prize1 || '',
                        item.rawPrizes || {},
                        item.inputNumbers
                    ) + "\n";
                }
            });

            const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `du_lieu_xsmb_${Date.now()}.sql`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("📥 Đã tải file du_lieu_xsmb.sql thành công!");
        });
    }

    if (btnExportAIDataset) {
        btnExportAIDataset.addEventListener('click', () => {
            const history = getHistory();
            const dataset = [];

            if (lastInputData) {
                dataset.push({
                    draw_date: lastInputData.date,
                    special_prize: lastInputData.specialPrize,
                    lotto_numbers: lastInputData.lottoNumbers,
                    lotto_vector: lastInputData.lottoVector
                });
            }

            history.forEach(item => {
                if (!lastInputData || item.date !== lastInputData.date) {
                    dataset.push({
                        draw_date: item.date,
                        special_prize: item.specialPrize || '',
                        lotto_numbers: item.inputNumbers,
                        lotto_vector: engine.computeLottoVector(item.inputNumbers)
                    });
                }
            });

            const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dataset_deep_learning.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("📦 Đã tải dataset_deep_learning.json cho AI!");
        });
    }

    // --- RULES & HISTORY STORAGE ---
    function loadStoredRules() {
        try {
            const saved = localStorage.getItem('bo_so_custom_rules');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading rules from localStorage", e);
        }
        return JSON.parse(JSON.stringify(DEFAULT_RULES));
    }

    function saveRulesToStorage(rules) {
        localStorage.setItem('bo_so_custom_rules', JSON.stringify(rules));
        engine.setRules(rules);
        renderRulesList();
    }

    function renderRulesList() {
        if (!rulesListContainer) return;
        rulesListContainer.innerHTML = '';
        const numMem = customRules.numberMemory || {};

        Object.keys(numMem).forEach(src => {
            const targets = numMem[src];
            const card = document.createElement('div');
            card.className = 'p-3 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between';
            card.innerHTML = `
                <div>
                    <span class="text-xs text-gray-400">Về <strong class="text-amber-300 font-mono text-sm">${src}</strong></span>
                    <span class="text-gray-500 mx-1">➜</span>
                    <span class="text-xs text-cyan-300 font-mono font-bold">${targets.join(', ')}</span>
                </div>
                <button class="text-gray-500 hover:text-red-400 transition p-1" onclick="window.deleteRule('${src}')">
                    ✕
                </button>
            `;
            rulesListContainer.appendChild(card);
        });
    }

    window.deleteRule = function(src) {
        if (customRules.numberMemory && customRules.numberMemory[src]) {
            delete customRules.numberMemory[src];
            saveRulesToStorage(customRules);
            showToast(`Đã xóa quy tắc cho số ${src}`);
        }
    };

    const btnAddRule = document.getElementById('btnAddRule');
    const ruleSourceNum = document.getElementById('ruleSourceNum');
    const ruleTargetNums = document.getElementById('ruleTargetNums');
    const btnResetRules = document.getElementById('btnResetRules');
    const btnExportRules = document.getElementById('btnExportRules');

    if (btnAddRule) {
        btnAddRule.addEventListener('click', () => {
            const src = ruleSourceNum.value.trim();
            const targetsRaw = ruleTargetNums.value.trim();

            if (!src || !targetsRaw) {
                showToast("Vui lòng điền đầy đủ số nguồn và các số báo!", "warning");
                return;
            }

            const formattedSrc = engine.formatNum(src);
            const formattedTargets = targetsRaw.split(/[^0-9]+/).filter(t => t.length > 0).map(t => engine.formatNum(t));

            if (formattedTargets.length === 0) {
                showToast("Vui lòng nhập ít nhất một số báo hợp lệ!", "warning");
                return;
            }

            if (!customRules.numberMemory) customRules.numberMemory = {};
            customRules.numberMemory[formattedSrc] = formattedTargets;

            saveRulesToStorage(customRules);
            ruleSourceNum.value = '';
            ruleTargetNums.value = '';
            showToast(`Đã lưu quy tắc: ${formattedSrc} ➜ ${formattedTargets.join(', ')}`);
        });
    }

    if (btnResetRules) {
        btnResetRules.addEventListener('click', () => {
            showCyberConfirm("Bạn có chắc chắn muốn khôi phục toàn bộ quy tắc bạc nhớ về mặc định không?", () => {
                customRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                saveRulesToStorage(customRules);
                showToast("Đã khôi phục quy tắc gốc thành công!", "success");
            });
        });
    }

    if (btnExportRules) {
        btnExportRules.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(customRules, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bo_so_quy_tac_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function saveDrawToLocalStorage(inputData, predictionResult, fullBettingSlip) {
        const historyItem = {
            id: Date.now(),
            date: inputData.date,
            specialPrize: inputData.specialPrize,
            prize1: inputData.prize1,
            rawPrizes: inputData.rawPrizes,
            inputNumbers: inputData.lottoNumbers,
            recommendations: predictionResult ? predictionResult.recommendations : null,
            fullBettingSlip: fullBettingSlip || (predictionResult ? predictionResult.fullBettingSlip : null)
        };

        const history = getHistory().filter(h => h.date !== inputData.date);
        history.unshift(historyItem);
        localStorage.setItem('bo_so_history', JSON.stringify(history));
        populateQuickHistorySelect();
    }

    function getHistory() {
        try {
            const saved = localStorage.getItem('bo_so_history');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Error reading history", e);
        }
        return [];
    }

    // --- RENDER DEDICATED HISTORY TAB ---
    function renderHistoryList() {
        const history = getHistory();
        const lockedDays = getLockedDays();
        if (!historyListContainer) return;
        historyListContainer.innerHTML = '';

        const allDates = Array.from(new Set([...history.map(h => h.date), ...Object.keys(lockedDays)])).sort().reverse();

        if (allDates.length === 0) {
            historyListContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500 text-sm space-y-2">
                    <div class="text-3xl">📭</div>
                    <div>Chưa có bản chốt số nào được lưu.</div>
                    <p class="text-xs text-gray-600">Khi bạn bấm "Tự Học & Chốt Số Ngày Mai", bản chốt sẽ tự động lưu vĩnh viễn ở đây.</p>
                </div>
            `;
            return;
        }

        allDates.forEach((dateStr) => {
            const hist = history.find(h => h.date === dateStr);
            const locked = lockedDays[dateStr];
            const slip = (locked && locked.fullBettingSlip) || (hist && hist.fullBettingSlip);
            const rec = (locked && locked.predictionResult && locked.predictionResult.recommendations) || (hist && hist.recommendations);
            const inputCount = (hist && hist.inputNumbers && hist.inputNumbers.length) || (locked && locked.inputData && locked.inputData.lottoNumbers && locked.inputData.lottoNumbers.length) || 27;

            const card = document.createElement('div');
            card.className = 'p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 transition space-y-4 shadow-lg';
            
            card.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                    <div class="flex items-center space-x-2.5">
                        <span class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm">
                            ${dateStr}
                        </span>
                        <div>
                            <h3 class="font-bold text-gray-100 text-sm flex items-center space-x-2">
                                <span>Bản Chốt Số Ngày ${dateStr}</span>
                                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">🔒 Đã Chốt Cố Định</span>
                            </h3>
                            <p class="text-[11px] text-gray-400">Đã nạp ${inputCount} số kết quả</p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center space-x-2">
                        <button class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition flex items-center space-x-1" onclick="window.viewHistoricalDay('${dateStr}')">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                            <span>Xem Trọn Vẹn Sổ Chốt</span>
                        </button>
                        <button class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition flex items-center space-x-1" onclick="window.copyHistoricalDay('${dateStr}')">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy Sổ Chốt</span>
                        </button>
                    </div>
                </div>

                <!-- Quick Summary Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">Bạch Thủ Lô:</span>
                        <span class="font-mono font-black text-base text-amber-300">${(rec && rec.bachThu) || (slip && slip.baoLo && slip.baoLo.btl) || '--'}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">Song Thủ Lô:</span>
                        <span class="font-mono font-bold text-sm text-cyan-300">${(rec && rec.songThu && rec.songThu.join(' - ')) || (slip && slip.baoLo && slip.baoLo.stl.join(' - ')) || '--'}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">Đề Bạch Thủ:</span>
                        <span class="font-mono font-bold text-sm text-pink-300">${(slip && slip.dacBiet && slip.dacBiet.deBTL) || '--'}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">3 Càng VIP:</span>
                        <span class="font-mono font-bold text-sm text-purple-300">${(slip && slip.baCang && slip.baCang.baCangLoVIP && slip.baCang.baCangLoVIP.slice(0, 2).join(', ')) || '--'}</span>
                    </div>
                </div>
            `;
            historyListContainer.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Window helper functions for history actions
    window.viewHistoricalDay = function(dateStr) {
        inputDrawDate.value = dateStr;
        checkDailyLockStatus();
        
        // Switch to Tab 1
        const tabPredictBtn = document.querySelector('button[data-target="tab-predict"]');
        if (tabPredictBtn) tabPredictBtn.click();
        
        // Scroll to full betting slip
        const slipSection = document.getElementById('fullBettingSlipSection');
        if (slipSection) {
            slipSection.scrollIntoView({ behavior: 'smooth' });
        }
        showToast(`📂 Đã mở trọn vẹn Sổ Tay Chốt Số ngày ${dateStr}!`);
    };

    window.copyHistoricalDay = function(dateStr) {
        const lockedDays = getLockedDays();
        const history = getHistory();
        const hist = history.find(h => h.date === dateStr);
        const locked = lockedDays[dateStr];
        const slip = (locked && locked.fullBettingSlip) || (hist && hist.fullBettingSlip);

        if (!slip) {
            showToast("Không tìm thấy dữ liệu sổ chốt!");
            return;
        }

        const text = formatSlipToText(slip);
        navigator.clipboard.writeText(text).then(() => {
            showToast(`📋 Đã copy toàn bộ Sổ Tay Chốt Số ngày ${dateStr}!`);
        });
    };

    const btnClearHistory = document.getElementById('btnClearHistory');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            showCyberConfirm("Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử không? Hành động này không thể hoàn tác.", () => {
                localStorage.removeItem('bo_so_history');
                localStorage.removeItem('bo_so_locked_days');
                populateQuickHistorySelect();
                renderHistoryList();
                checkDailyLockStatus();
                showToast("Đã xóa toàn bộ lịch sử!", "info");
            });
        });
    }

    // --- CYBER CONFIRM MODAL DIALOG ---
    function showCyberConfirm(message, onConfirm) {
        const modal = document.getElementById('cyberConfirmModal');
        const msgEl = document.getElementById('cyberConfirmMessage');
        const btnOk = document.getElementById('btnCyberConfirmOk');
        const btnCancel = document.getElementById('btnCyberConfirmCancel');
        
        if (!modal || !msgEl || !btnOk || !btnCancel) {
            if (window.confirm(message)) onConfirm();
            return;
        }

        msgEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        function cleanup() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            btnOk.removeEventListener('click', handleOk);
            btnCancel.removeEventListener('click', handleCancel);
        }

        function handleOk() {
            cleanup();
            if (typeof onConfirm === 'function') onConfirm();
        }

        function handleCancel() {
            cleanup();
        }

        btnOk.addEventListener('click', handleOk);
        btnCancel.addEventListener('click', handleCancel);
    }

    // --- UNIFIED CYBER TOAST NOTIFICATION SYSTEM ---
    function showToast(msg, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        let iconHtml = '⚡';
        let typeClass = 'toast-info';
        let iconBg = 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';

        if (type === 'warning') {
            iconHtml = '⚠️';
            typeClass = 'toast-warning';
            iconBg = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
        } else if (type === 'error') {
            iconHtml = '❌';
            typeClass = 'toast-error';
            iconBg = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
        } else if (type === 'success') {
            iconHtml = '✅';
            typeClass = 'toast-success';
            iconBg = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
        }

        toast.className = `cyber-toast ${typeClass}`;
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-xl border flex items-center justify-center text-sm shrink-0 shadow-inner ${iconBg}">
                ${iconHtml}
            </div>
            <div class="flex-1 text-xs text-gray-100 font-bold leading-snug">
                ${msg}
            </div>
        `;
        
        if (container) {
            container.appendChild(toast);
        } else {
            document.body.appendChild(toast);
        }

        setTimeout(() => {
            toast.classList.add('show');
        }, 15);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }

    // Ghi đè alert mặc định của trình duyệt để 100% popup đều dùng Cyber Toast hiện đại
    window.alert = function(msg) {
        showToast(msg, 'warning');
    };
});
