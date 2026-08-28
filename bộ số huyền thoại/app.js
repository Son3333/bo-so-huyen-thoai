/**
 * ================================================================================
 * BỘ SỐ HUYỀN THOẠI - MASTER CONTROLLER (app.js)
 * Bộ điều khiển thống nhất 100%: Xác thực RBAC, Quản lý CSDL, AI Tự Học & Sổ Chốt Số
 * ================================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- GLOBAL STATE ---
    let currentMode = 'quick';
    let customRules = loadStoredRules();
    const engine = (typeof PredictionEngine !== 'undefined') ? new PredictionEngine(customRules) : null;
    let lastPredictionResult = null;
    let lastInputData = null;
    let lastFullBettingSlip = null;

    // --- CLOUD SERVER URL CONFIG ---
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

    // --- DOM ELEMENTS SELECTION ---
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
    const btnClearBoard = document.getElementById('btnClearBoard');
    const btnCopyFullSlip = document.getElementById('btnCopyFullSlip');
    const btnPrintSlip = document.getElementById('btnPrintSlip');
    const btnAutoFetchOnline = document.getElementById('btnAutoFetchOnline');
    const btnFetchLiveLottery = document.getElementById('btnFetchLiveLottery');
    const btnPasteClipboard = document.getElementById('btnPasteClipboard');

    // Auth Elements
    const authModal = document.getElementById('authModal');
    const btnLoginTrigger = document.getElementById('btnLoginTrigger');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const userRoleIcon = document.getElementById('userRoleIcon');
    const userFullNameText = document.getElementById('userFullNameText');
    const btnGoToAdmin = document.getElementById('btnGoToAdmin');
    const tabAuthLoginBtn = document.getElementById('tabAuthLoginBtn');
    const tabAuthRegisterBtn = document.getElementById('tabAuthRegisterBtn');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const authErrorBox = document.getElementById('authErrorBox');
    const authErrorText = document.getElementById('authErrorText');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const btnToggleLoginPwd = document.getElementById('btnToggleLoginPwd');
    const regFullName = document.getElementById('regFullName');
    const regUsername = document.getElementById('regUsername');
    const regPassword = document.getElementById('regPassword');
    const regPasswordConfirm = document.getElementById('regPasswordConfirm');
    const userVipWelcomeBanner = document.getElementById('userVipWelcomeBanner');
    const vipUsernameText = document.getElementById('vipUsernameText');
    const navPredictTitle = document.getElementById('navPredictTitle');
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminOnlySections = document.querySelectorAll('.admin-only-section');

    // Cloud Elements
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

    // AI Evaluation Elements
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

    // --- 1. AUTHENTICATION & RBAC ---
    function getAuthSession() {
        try {
            const s = localStorage.getItem('bo_so_auth_session');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return null;
    }

    function setAuthSession(session) {
        try {
            localStorage.setItem('bo_so_auth_session', JSON.stringify(session));
        } catch (e) {}
        applyAuthUIState();
        checkDailyLockStatus();
        syncCanonicalSlipFromCloud();
    }

    function clearAuthSession() {
        try {
            localStorage.removeItem('bo_so_auth_session');
        } catch (e) {}
        applyAuthUIState();
        const path = window.location.pathname.toLowerCase();
        if (path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/')) {
            setTimeout(() => { window.location.href = 'index.html'; }, 300);
        }
    }

    function getAuthToken() {
        const session = getAuthSession();
        return session ? session.token : '';
    }

    function isCurrentUserAdmin() {
        const session = getAuthSession();
        return session && session.user && session.user.role === 'admin';
    }

    function getRegisteredLocalUsers() {
        try {
            const s = localStorage.getItem('bo_so_registered_users');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return {};
    }

    function saveRegisteredLocalUser(username, userObj) {
        try {
            const users = getRegisteredLocalUsers();
            users[username] = userObj;
            localStorage.setItem('bo_so_registered_users', JSON.stringify(users));
        } catch (e) {}
    }

    function showAuthError(msg) {
        if (!authErrorBox) return;
        if (authErrorText) authErrorText.textContent = msg;
        authErrorBox.classList.remove('hidden');
        authErrorBox.classList.add('flex');
        authErrorBox.style.display = 'flex';
    }

    function hideAuthError() {
        if (!authErrorBox) return;
        authErrorBox.classList.add('hidden');
        authErrorBox.classList.remove('flex');
        authErrorBox.style.display = 'none';
    }

    function applyAuthUIState() {
        const session = getAuthSession();
        const appLayout = document.getElementById('appLayout');

        if (!session || !session.user) {
            if (appLayout) {
                appLayout.classList.add('hidden');
                appLayout.style.display = 'none';
            }
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.classList.add('flex');
                authModal.style.display = 'flex';
            }
            if (btnLoginTrigger) btnLoginTrigger.classList.remove('hidden');
            if (btnGoToAdmin) {
                btnGoToAdmin.classList.add('hidden');
                btnGoToAdmin.classList.remove('flex');
            }
            if (userProfileBadge) {
                userProfileBadge.classList.add('hidden');
                userProfileBadge.classList.remove('flex');
            }
            adminOnlySections.forEach(s => s.classList.add('hidden'));
            if (userVipWelcomeBanner) userVipWelcomeBanner.classList.add('hidden');
            if (vipUsernameText) vipUsernameText.textContent = '';
            if (userFullNameText) userFullNameText.textContent = '';
            adminTabBtns.forEach(t => t.classList.add('hidden'));
            return;
        }

        const user = session.user;
        const role = user.role || 'user';

        if (appLayout) {
            appLayout.classList.remove('hidden');
            appLayout.classList.add('flex');
            appLayout.style.display = 'flex';
        }
        if (authModal) {
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
            authModal.style.display = 'none';
        }
        if (btnLoginTrigger) btnLoginTrigger.classList.add('hidden');
        if (userProfileBadge) {
            userProfileBadge.classList.remove('hidden');
            userProfileBadge.classList.add('flex');
        }

        if (role === 'admin') {
            if (btnGoToAdmin) {
                btnGoToAdmin.classList.remove('hidden');
                btnGoToAdmin.classList.add('flex');
            }
            if (userRoleIcon) userRoleIcon.textContent = '👑';
            if (userFullNameText) userFullNameText.textContent = user.full_name || 'Admin';
            if (userRoleBadge) {
                userRoleBadge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1';
            }
            adminOnlySections.forEach(s => s.classList.remove('hidden'));
            if (userVipWelcomeBanner) userVipWelcomeBanner.classList.add('hidden');
            adminTabBtns.forEach(t => t.classList.remove('hidden'));
            if (navPredictTitle) navPredictTitle.textContent = 'Dự Đoán & AI Tự Học';
        } else {
            const currentPath = window.location.pathname.toLowerCase();
            if (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) {
                window.location.href = 'index.html';
                return;
            }
            if (btnGoToAdmin) {
                btnGoToAdmin.classList.add('hidden');
                btnGoToAdmin.classList.remove('flex');
            }
            if (userRoleIcon) userRoleIcon.textContent = '⭐';
            const displayName = user.full_name || user.username;
            if (userFullNameText) userFullNameText.textContent = displayName;
            if (userRoleBadge) {
                userRoleBadge.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1';
            }
            adminOnlySections.forEach(s => s.classList.add('hidden'));
            if (userVipWelcomeBanner) {
                userVipWelcomeBanner.classList.remove('hidden');
                if (vipUsernameText) vipUsernameText.textContent = `${user.username} (${displayName})`;
            }
            adminTabBtns.forEach(t => t.classList.add('hidden'));
            if (navPredictTitle) navPredictTitle.textContent = 'Sổ Tay Chốt Số VIP';
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function executeLoginFlow(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        hideAuthError();

        const username = loginUsername ? loginUsername.value.trim().toLowerCase() : '';
        const password = loginPassword ? loginPassword.value.trim() : '';

        if (!username || !password) {
            showAuthError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!");
            return;
        }

        const btnSubmit = document.getElementById('btnSubmitLogin');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="animate-spin mr-2">🔄</span> Đang đăng nhập...`;
        }

        // 1. Kiểm tra tài khoản cứng tức thì (0ms)
        if (username === 'admin' && (password === 'sondeptrai2005@@@@' || password === 'admin')) {
            const session = {
                token: 'admin_token_' + Date.now(),
                user: { username: 'admin', role: 'admin', full_name: 'Quản Trị Viên Tối Cao' }
            };
            setAuthSession(session);
            showToast("👑 Chào mừng Quản Trị Viên!", "success");
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
            }
            const path = window.location.pathname.toLowerCase();
            if (path.endsWith('index.html') || path === '/' || path === '') {
                setTimeout(() => { window.location.href = 'admin.html'; }, 200);
            }
            return;
        }

        if (username === 'loc889999' && (password === 'Hoa160881' || password === 'hoa160881')) {
            const session = {
                token: 'vip_token_' + Date.now(),
                user: { username: 'loc889999', role: 'user', full_name: 'Thành Viên VIP' }
            };
            setAuthSession(session);
            showToast("⭐ Chào mừng Thành Viên VIP!", "success");
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
            }
            const path = window.location.pathname.toLowerCase();
            if (path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/')) {
                setTimeout(() => { window.location.href = 'index.html'; }, 200);
            }
            return;
        }

        // 2. Kiểm tra tài khoản đã đăng ký cục bộ
        const localUsers = getRegisteredLocalUsers();
        if (localUsers[username] && localUsers[username].password === password) {
            const session = {
                token: 'user_token_' + Date.now(),
                user: { username: username, role: localUsers[username].role || 'user', full_name: localUsers[username].full_name || username }
            };
            setAuthSession(session);
            showToast(`⭐ Chào mừng ${session.user.full_name}!`, "success");
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
            }
            const path = window.location.pathname.toLowerCase();
            if (session.user.role === 'admin' && (path.endsWith('index.html') || path === '/' || path === '')) {
                setTimeout(() => { window.location.href = 'admin.html'; }, 200);
            } else if (session.user.role !== 'admin' && (path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/'))) {
                setTimeout(() => { window.location.href = 'index.html'; }, 200);
            }
            return;
        }

        // 3. Xác thực qua API Server
        try {
            const res = await fetch(`${getApiBase()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            }).catch(() => null);

            if (res && res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.token) {
                    setAuthSession({ token: data.token, user: data.user });
                    showToast(`👑 Chào mừng ${data.user.full_name || data.user.username}!`, "success");
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
                    }
                    const path = window.location.pathname.toLowerCase();
                    if (data.user.role === 'admin' && (path.endsWith('index.html') || path === '/' || path === '')) {
                        setTimeout(() => { window.location.href = 'admin.html'; }, 200);
                    } else if (data.user.role !== 'admin' && (path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/'))) {
                        setTimeout(() => { window.location.href = 'index.html'; }, 200);
                    }
                    return;
                }
            } else if (res) {
                const data = await res.json().catch(() => ({}));
                showAuthError(data.message || "Tài khoản hoặc mật khẩu không chính xác!");
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
                }
                return;
            }
        } catch (err) {}

        showAuthError("Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!");
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
        }
    }

    async function executeRegisterFlow(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        hideAuthError();

        const fullName = regFullName ? regFullName.value.trim() : '';
        const username = regUsername ? regUsername.value.trim().toLowerCase() : '';
        const password = regPassword ? regPassword.value : '';
        const confirm = regPasswordConfirm ? regPasswordConfirm.value : '';

        if (!username || !password) {
            showAuthError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu!");
            return;
        }

        if (password !== confirm) {
            showAuthError("Mật khẩu xác nhận không trùng khớp!");
            return;
        }

        if (password.length < 6) {
            showAuthError("Mật khẩu phải có ít nhất 6 ký tự!");
            return;
        }

        const btnSubmit = document.getElementById('btnSubmitRegister');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="animate-spin mr-2">🔄</span> Đang tạo tài khoản...`;
        }

        saveRegisteredLocalUser(username, {
            username: username,
            password: password,
            role: 'user',
            full_name: fullName || username,
            created_at: new Date().toISOString()
        });

        const session = {
            token: 'user_reg_token_' + Date.now(),
            user: { username, role: 'user', full_name: fullName || username }
        };
        setAuthSession(session);
        showToast(`🎉 Đăng ký thành công! Chào mừng ${session.user.full_name}!`, "success");

        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i><span>Tạo Tài Khoản VIP</span>`;
        }

        const path = window.location.pathname.toLowerCase();
        if (path.endsWith('admin.html') || path.endsWith('/admin') || path.endsWith('/admin/')) {
            setTimeout(() => { window.location.href = 'index.html'; }, 200);
        }

        fetch(`${getApiBase()}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, full_name: fullName })
        }).catch(() => null);
    }

    // Attach Auth Listeners
    if (btnLoginTrigger) {
        btnLoginTrigger.addEventListener('click', () => {
            hideAuthError();
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.classList.add('flex');
                authModal.style.display = 'flex';
            }
        });
    }

    if (tabAuthLoginBtn && tabAuthRegisterBtn) {
        tabAuthLoginBtn.addEventListener('click', () => {
            hideAuthError();
            tabAuthLoginBtn.className = 'flex-1 py-2 rounded-lg bg-amber-500 text-black shadow transition font-black';
            tabAuthRegisterBtn.className = 'flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 transition';
            if (formLogin) {
                formLogin.classList.remove('hidden');
                formLogin.style.display = 'block';
            }
            if (formRegister) {
                formRegister.classList.add('hidden');
                formRegister.style.display = 'none';
            }
        });

        tabAuthRegisterBtn.addEventListener('click', () => {
            hideAuthError();
            tabAuthRegisterBtn.className = 'flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow transition font-black';
            tabAuthLoginBtn.className = 'flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 transition';
            if (formRegister) {
                formRegister.classList.remove('hidden');
                formRegister.style.display = 'block';
            }
            if (formLogin) {
                formLogin.classList.add('hidden');
                formLogin.style.display = 'none';
            }
        });
    }

    if (btnToggleLoginPwd && loginPassword) {
        btnToggleLoginPwd.addEventListener('click', () => {
            const isPwd = loginPassword.type === 'password';
            loginPassword.type = isPwd ? 'text' : 'password';
            btnToggleLoginPwd.innerHTML = isPwd ? '<i data-lucide="eye-off" class="w-4 h-4"></i>' : '<i data-lucide="eye" class="w-4 h-4"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (formLogin) formLogin.addEventListener('submit', executeLoginFlow);
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');
    if (btnSubmitLogin) btnSubmitLogin.addEventListener('click', executeLoginFlow);

    if (formRegister) formRegister.addEventListener('submit', executeRegisterFlow);
    const btnSubmitRegister = document.getElementById('btnSubmitRegister');
    if (btnSubmitRegister) btnSubmitRegister.addEventListener('click', executeRegisterFlow);

    const logoutButtons = document.querySelectorAll('#btnLogoutBtn, .btn-logout-action');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            clearAuthSession();
            showToast("🚪 Đã đăng xuất an toàn khỏi hệ thống!", "info");
        });
    });

    // --- 2. STORAGE & PERSISTENCE ---
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
    }

    function getLatestLockedDay() {
        const lockedDays = getLockedDays();
        const dates = Object.keys(lockedDays).filter(Boolean).sort().reverse();
        if (dates.length > 0) {
            return lockedDays[dates[0]];
        }
        if (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays) {
            const cDates = Object.keys(CANONICAL_INITIAL_DATA.lockedDays).filter(Boolean).sort().reverse();
            if (cDates.length > 0) {
                return CANONICAL_INITIAL_DATA.lockedDays[cDates[0]];
            }
        }
        return null;
    }

    function getHistory() {
        try {
            const saved = localStorage.getItem('bo_so_history');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return [];
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
        try {
            localStorage.setItem('bo_so_history', JSON.stringify(history));
        } catch (e) {}
        populateQuickHistorySelect();
    }

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
                try {
                    localStorage.setItem('bo_so_locked_days', JSON.stringify(currentLocked));
                } catch (e) {}
            }

            const currentHistory = getHistory();
            let histChanged = false;
            Object.keys(CANONICAL_INITIAL_DATA.lockedDays).forEach(dateStr => {
                const item = CANONICAL_INITIAL_DATA.lockedDays[dateStr];
                if (!currentHistory.find(h => h.date === dateStr)) {
                    currentHistory.unshift({
                        id: Date.now() + Math.random(),
                        date: item.drawDate,
                        specialPrize: (item.inputData && item.inputData.specialPrize) || item.specialPrize || '',
                        prize1: (item.inputData && item.inputData.prize1) || item.prize1 || '',
                        rawPrizes: (item.inputData && item.inputData.rawPrizes) || item.rawPrizes || {},
                        inputNumbers: (item.inputData && item.inputData.lottoNumbers) || item.lottoNumbers || [],
                        recommendations: (item.predictionResult && item.predictionResult.recommendations) || null,
                        fullBettingSlip: item.fullBettingSlip
                    });
                    histChanged = true;
                }
            });
            if (histChanged) {
                try {
                    localStorage.setItem('bo_so_history', JSON.stringify(currentHistory));
                } catch (e) {}
            }
        }
    }

    function loadStoredRules() {
        try {
            const saved = localStorage.getItem('bo_so_custom_rules');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        if (typeof DEFAULT_RULES !== 'undefined') {
            return JSON.parse(JSON.stringify(DEFAULT_RULES));
        }
        return {};
    }

    function saveRulesToStorage(rules) {
        try {
            localStorage.setItem('bo_so_custom_rules', JSON.stringify(rules));
        } catch (e) {}
        if (engine) engine.setRules(rules);
        renderRulesList();
    }

    // --- 3. TOAST & NOTIFICATIONS ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto backdrop-blur-md';

        let icon = 'ℹ️';
        if (type === 'success') {
            toast.classList.add('bg-emerald-950/90', 'border-emerald-500/50', 'text-emerald-300', 'shadow-emerald-500/20');
            icon = '✅';
        } else if (type === 'warning') {
            toast.classList.add('bg-amber-950/90', 'border-amber-500/50', 'text-amber-300', 'shadow-amber-500/20');
            icon = '⚠️';
        } else if (type === 'error') {
            toast.classList.add('bg-rose-950/90', 'border-rose-500/50', 'text-rose-300', 'shadow-rose-500/20');
            icon = '❌';
        } else {
            toast.classList.add('bg-gray-900/90', 'border-cyan-500/50', 'text-cyan-300', 'shadow-cyan-500/20');
            icon = 'ℹ️';
        }

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');
        });

        setTimeout(() => {
            toast.classList.remove('translate-y-0', 'opacity-100');
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

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

        const handleOk = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            btnOk.removeEventListener('click', handleOk);
            btnCancel.removeEventListener('click', handleCancel);
            onConfirm();
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            btnOk.removeEventListener('click', handleOk);
            btnCancel.removeEventListener('click', handleCancel);
        };

        btnOk.addEventListener('click', handleOk);
        btnCancel.addEventListener('click', handleCancel);
    }

    // --- 4. DATE HELPERS ---
    function getNextDay(dateStr) {
        if (!dateStr) return '';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                d.setDate(d.getDate() + 1);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {}
        return dateStr;
    }

    function formatDateVN(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    function updateTargetPlayDateDisplay() {
        const baseDate = inputDrawDate ? inputDrawDate.value : '';
        const targetDate = getNextDay(baseDate);
        const targetBadge = document.getElementById('targetPlayDateBadge');
        if (targetBadge && targetDate) {
            targetBadge.textContent = formatDateVN(targetDate);
        }
    }

    function updateVietnamClock() {
        const now = new Date();
        const vnTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const h = String(vnTime.getHours()).padStart(2, '0');
        const m = String(vnTime.getMinutes()).padStart(2, '0');
        const s = String(vnTime.getSeconds()).padStart(2, '0');
        if (vnLiveClock) vnLiveClock.textContent = `${h}:${m}:${s}`;
    }
    setInterval(updateVietnamClock, 1000);
    updateVietnamClock();

    // --- 5. CLOUD COMMUNICATION ---
    async function syncCanonicalSlipFromCloud(selectedDate) {
        const targets = [];
        const queryParam = selectedDate ? `?date=${selectedDate}` : '';
        const primaryApi = `${getApiBase()}/canonical-slip${queryParam}`;
        targets.push(primaryApi);

        const cloudUrl = getCloudServerUrl();
        if (cloudUrl && !primaryApi.startsWith(cloudUrl)) {
            targets.push(`${cloudUrl}/api/canonical-slip${queryParam}`);
        }

        for (const url of targets) {
            try {
                const res = await fetch(url, { cache: 'no-cache' }).catch(() => null);
                if (res && res.ok) {
                    const json = await res.json();
                    if (json && json.data) {
                        const payload = json.data;
                        const slip = payload.full_betting_slip || payload.fullBettingSlip;
                        const actualDate = payload.drawDate || payload.draw_date || selectedDate || (slip && slip.drawDate);

                        if (slip && actualDate) {
                            const lockedDays = getLockedDays();
                            const canonData = {
                                drawDate: actualDate,
                                inputData: {
                                    date: actualDate,
                                    lottoNumbers: (payload.inputData && payload.inputData.lottoNumbers) || payload.lotto_numbers || [],
                                    specialPrize: (payload.inputData && payload.inputData.specialPrize) || payload.special_prize || '',
                                    prize1: (payload.inputData && payload.inputData.prize1) || payload.prize_1 || '',
                                    rawPrizes: (payload.inputData && payload.inputData.rawPrizes) || payload.raw_prizes || {}
                                },
                                predictionResult: payload.predictionResult || {
                                    recommendations: {
                                        bachThu: (slip.baoLo && slip.baoLo.btl) || '68',
                                        songThu: (slip.baoLo && slip.baoLo.stl) || ['68', '86'],
                                        dan4: (slip.baoLo && slip.baoLo.dan4) || [],
                                        chamDe: (slip.dacBiet && slip.dacBiet.chamDe) || []
                                    },
                                    fullBettingSlip: slip
                                },
                                fullBettingSlip: slip,
                                lockedAt: payload.lockedAt || new Date().toISOString()
                            };

                            saveLockedDay(actualDate, canonData);

                            if (!isCurrentUserAdmin() || (inputDrawDate && inputDrawDate.value === actualDate)) {
                                renderLockedPrediction(canonData);
                            }
                            return true;
                        }
                    }
                }
            } catch (e) {}
        }

        if (!isCurrentUserAdmin()) {
            const latestLocked = getLatestLockedDay();
            if (latestLocked) renderLockedPrediction(latestLocked);
        }
        return false;
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

        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        let sentSuccess = false;
        for (const ep of endpoints) {
            try {
                const res = await fetch(ep, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                }).catch(() => null);

                if (res && res.ok) sentSuccess = true;
            } catch (e) {}
        }

        if (sentSuccess) {
            showToast("🤖 Đã tự động bắn Sổ Tay Chốt Số VIP vào Telegram!", "success");
        }
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

    function initCloudStatusUI() {
        if (inputCloudServerUrl) inputCloudServerUrl.value = getCloudServerUrl();
        testCloudConnection(false);
    }

    if (btnOpenCloudModal && cloudConfigModal) {
        btnOpenCloudModal.addEventListener('click', () => {
            cloudConfigModal.classList.remove('hidden');
            cloudConfigModal.classList.add('flex');
            initCloudStatusUI();
        });
    }

    if (btnCloseCloudModal && cloudConfigModal) {
        btnCloseCloudModal.addEventListener('click', () => {
            cloudConfigModal.classList.add('hidden');
            cloudConfigModal.classList.remove('flex');
        });
    }

    if (btnTestAndSaveCloud) {
        btnTestAndSaveCloud.addEventListener('click', () => {
            if (inputCloudServerUrl) {
                const url = inputCloudServerUrl.value.trim().replace(/\/+$/, '');
                localStorage.setItem('bo_so_cloud_server_url', url);
                testCloudConnection(true);
            }
        });
    }

    if (btnSyncNowCloud) {
        btnSyncNowCloud.addEventListener('click', async () => {
            showToast("🔄 Đang đồng bộ sổ chốt từ Cloud Server...", "info");
            const ok = await syncCanonicalSlipFromCloud(inputDrawDate ? inputDrawDate.value : '');
            if (ok) showToast("🟢 Đồng bộ thành công bản chốt mới nhất!", "success");
            else showToast("Đã kiểm tra, bạn đang có bản số mới nhất!", "info");
        });
    }

    // --- 6. RENDERERS ---
    function updateWeightDisplay() {
        if (engine && engine.weights) {
            if (weightBacNho) weightBacNho.textContent = `${engine.weights.bac_nho}đ`;
            if (weightDauCam) weightDauCam.textContent = `${engine.weights.dau_cam}đ`;
            if (weightBongSo) weightBongSo.textContent = `${engine.weights.bong_so}đ`;
        }
    }

    function renderFullBettingSlip(slip) {
        if (!slip) return;

        const b = slip.baoLo || {};
        const x = slip.loXien || {};
        const d = slip.dacBiet || {};
        const c = slip.baCang || {};

        const baseDate = slip.drawDate || (inputDrawDate ? inputDrawDate.value : '');
        const targetPlayDate = getNextDay(baseDate);

        const slipTargetDateText = document.getElementById('slipTargetDateText');
        const slipTargetDateSub = document.getElementById('slipTargetDateSub');
        const slipBaseDateText = document.getElementById('slipBaseDateText');

        if (slipTargetDateText) slipTargetDateText.textContent = formatDateVN(targetPlayDate);
        if (slipTargetDateSub) slipTargetDateSub.textContent = formatDateVN(targetPlayDate);
        if (slipBaseDateText) slipBaseDateText.textContent = formatDateVN(baseDate);

        if (slipBTL) slipBTL.textContent = b.btl || '--';
        if (slipSTL) slipSTL.textContent = (b.stl && b.stl.join(' - ')) || '--';
        if (slipKep) slipKep.textContent = (b.topKep && b.topKep.join(', ')) || '00, 11';
        if (slipDan4) slipDan4.textContent = (b.dan4 && b.dan4.join(' - ')) || '--';
        if (slipDan8) slipDan8.textContent = (b.dan8 && b.dan8.join(' - ')) || '--';
        if (slipDan10) slipDan10.textContent = (b.dan10 && b.dan10.join(', ')) || '--';

        if (slipXien2) slipXien2.textContent = (x.xien2 && x.xien2.map(i => `(${i.join('-')})`).join('   ')) || '--';
        if (slipXien3) slipXien3.textContent = (x.xien3 && x.xien3.map(i => `(${i.join('-')})`).join('   ')) || '--';
        if (slipXien4) slipXien4.textContent = (x.xien4 && x.xien4.map(i => `(${i.join('-')})`).join('   ')) || '--';
        if (slipXQCore) slipXQCore.textContent = x.xienQuay4 ? `[${x.xienQuay4.join(', ')}]` : '--';

        if (slipXQDetails) {
            if (x.xienQuayPairs && x.xienQuayTriplets && x.xienQuay4) {
                let xqHTML = `<div class="font-bold text-amber-300 mb-1">• 6 Cặp Xiên 2:</div> ${x.xienQuayPairs.join(' | ')}<br>`;
                xqHTML += `<div class="font-bold text-purple-300 my-1">• 4 Bộ Xiên 3:</div> ${x.xienQuayTriplets.join(' | ')}<br>`;
                xqHTML += `<div class="font-bold text-pink-300 my-1">• 1 Bộ Xiên 4:</div> (${x.xienQuay4.join('-')})`;
                slipXQDetails.innerHTML = xqHTML;
            } else {
                slipXQDetails.textContent = '--';
            }
        }

        if (slipDeBTL) slipDeBTL.textContent = d.deBTL || '--';
        if (slipDeSTL) slipDeSTL.textContent = (d.deSTL && d.deSTL.join(' - ')) || '--';
        if (slipChamDe) slipChamDe.textContent = `Chạm [${(d.chamDe && d.chamDe.join(', ')) || '--'}] | Tổng [${(d.topSums && d.topSums.join(', ')) || '--'}]`;
        if (slipDanDe10) slipDanDe10.textContent = (d.danDe10 && d.danDe10.join(', ')) || '--';
        if (slipDanDe20) slipDanDe20.textContent = (d.danDe20 && d.danDe20.join(', ')) || '--';
        if (slipDanDe36) slipDanDe36.textContent = (d.danDe36 && d.danDe36.join(', ')) || '--';
        if (slipDanDe64) slipDanDe64.textContent = (d.danDe64 && d.danDe64.join(', ')) || '--';

        if (slipTopCangs) slipTopCangs.textContent = `Càng [${(c.topCangs && c.topCangs.join(', ')) || '--'}]`;
        if (slip3CangLo) slip3CangLo.textContent = (c.baCangLoVIP && c.baCangLoVIP.join(' - ')) || '--';
        if (slip3CangDe) slip3CangDe.textContent = (c.baCangDeVIP && c.baCangDeVIP.join(' - ')) || '--';
        if (slipDan3Cang) slipDan3Cang.textContent = (c.danBaCang && c.danBaCang.join(', ')) || '--';

        if (resDeBTL) resDeBTL.textContent = d.deBTL || '--';
        if (res3CangVIP) res3CangVIP.textContent = (c.baCangLoVIP && c.baCangLoVIP.slice(0, 2).join(', ')) || '--';
    }

    function renderPredictions(result) {
        if (!result) return;
        const rec = result.recommendations || {};
        const rankedList = result.rankedList || [];
        const inputSummary = result.inputSummary || { silentHeads: [], silentTails: [] };

        if (resBachThu) resBachThu.textContent = rec.bachThu || '--';
        if (btlScoreBadge) btlScoreBadge.textContent = `${rec.bachThuScore || 0}đ`;
        if (resSongThu) resSongThu.textContent = (rec.songThu && rec.songThu.join(' - ')) || '-- - --';

        if (silentHeadsList) {
            silentHeadsList.textContent = (inputSummary.silentHeads && inputSummary.silentHeads.length > 0)
                ? `Đầu ${inputSummary.silentHeads.join(', ')} câm`
                : 'Không có đầu câm';
        }
        if (silentTailsList) {
            silentTailsList.textContent = (inputSummary.silentTails && inputSummary.silentTails.length > 0)
                ? `Đuôi ${inputSummary.silentTails.join(', ')} câm`
                : 'Không có đuôi câm';
        }

        if (topRankedTable) {
            topRankedTable.innerHTML = '';
            const top10 = rankedList.slice(0, 10);
            const maxScore = top10.length > 0 ? Math.max(...top10.map(t => t.score), 1) : 1;

            top10.forEach((item, idx) => {
                const percent = Math.min(100, Math.round((item.score / maxScore) * 100));
                const mainReason = item.reasons && item.reasons.length > 0 ? item.reasons[0].desc : 'Thống kê xác suất tổng hợp';
                
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
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function renderHeadTails(inputSummary) {
        if (!inputSummary || !headsTable || !tailsTable) return;
        const heads = inputSummary.heads || {};
        const tails = inputSummary.tails || {};
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
        if (!heatmapGrid) return;
        heatmapGrid.innerHTML = '';
        const scoreValues = Object.values(scores || {});
        const maxScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;

        for (let i = 0; i < 100; i++) {
            const numStr = (engine && engine.formatNum) ? engine.formatNum(i) : (i < 10 ? '0' + i : String(i));
            const score = (scores && scores[numStr]) || 0;
            
            let heatClass = 'bg-gray-900 border-gray-800 text-gray-400';
            if (maxScore > 0 && score > 0) {
                const ratio = score / maxScore;
                if (ratio >= 0.8) heatClass = 'bg-red-950/80 border-red-500 text-red-300 font-bold shadow-red-500/20';
                else if (ratio >= 0.6) heatClass = 'bg-orange-950/80 border-orange-500 text-orange-300 font-bold';
                else if (ratio >= 0.4) heatClass = 'bg-amber-950/80 border-amber-500 text-amber-300';
                else if (ratio >= 0.2) heatClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
            }

            const cell = document.createElement('div');
            cell.className = `p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition hover:scale-105 ${heatClass}`;
            cell.title = `Số: ${numStr} - Điểm: ${score}đ`;
            cell.innerHTML = `
                <span class="font-mono font-bold text-sm">${numStr}</span>
                <span class="text-[9px] opacity-75">${score}đ</span>
            `;
            heatmapGrid.appendChild(cell);
        }
    }

    function renderEvaluationReport(evalResult, learningEntry) {
        if (!evalResult) return;
        if (evalAccuracyBadge) {
            evalAccuracyBadge.textContent = `${evalResult.totalHits || 0} Nháy Trúng`;
        }
        if (evalBTL) {
            evalBTL.innerHTML = evalResult.btlHit 
                ? `<span class="text-emerald-400 font-bold">🎯 Trúng Bạch Thủ ${evalResult.btlNum}</span>` 
                : `<span class="text-gray-400">Không về (${evalResult.btlNum || '--'})</span>`;
        }
        if (evalSTL) {
            evalSTL.innerHTML = evalResult.stlHits && evalResult.stlHits.length > 0 
                ? `<span class="text-emerald-400 font-bold">✨ Trúng STL: ${evalResult.stlHits.join(', ')}</span>` 
                : `<span class="text-gray-400">Trượt STL</span>`;
        }
        if (evalDanLotto) {
            evalDanLotto.innerHTML = `<span class="text-amber-300 font-bold">Ăn ${evalResult.dan4Hits || 0}/4 Dàn 4 • ${evalResult.dan8Hits || 0}/8 Dàn 8</span>`;
        }
        if (evalKep) {
            evalKep.innerHTML = evalResult.kepHits && evalResult.kepHits.length > 0
                ? `<span class="text-purple-300 font-bold">Trúng kép: ${evalResult.kepHits.join(', ')}</span>`
                : `<span class="text-gray-400">Trượt kép</span>`;
        }
        if (evalXien2) {
            evalXien2.innerHTML = evalResult.xien2Hits && evalResult.xien2Hits.length > 0
                ? `<span class="text-cyan-300 font-bold">Nổ ${evalResult.xien2Hits.length} Cặp Xiên 2</span>`
                : `<span class="text-gray-400">Trượt Xiên 2</span>`;
        }
        if (evalXienQuay) {
            evalXienQuay.innerHTML = `<span class="text-amber-300">Trục [${(evalResult.xqCore && evalResult.xqCore.join(',')) || '--'}] về ${evalResult.xqHitsCount || 0} con</span>`;
        }
        if (evalDeBTL) {
            evalDeBTL.innerHTML = evalResult.deBTLHit 
                ? `<span class="text-pink-400 font-bold">👑 NỔ ĐẶC BIỆT ${evalResult.deBTLNum}</span>` 
                : `<span class="text-gray-400">Trượt Đề BTL (${evalResult.deBTLNum || '--'})</span>`;
        }
        if (evalChamDe) {
            evalChamDe.innerHTML = evalResult.chamDeHit
                ? `<span class="text-pink-400 font-bold">Trúng chạm đề: ${evalResult.actualDe}</span>`
                : `<span class="text-gray-400">Trượt chạm đề</span>`;
        }
        if (evalDanDe) {
            evalDanDe.innerHTML = `<span class="text-emerald-300 font-bold">${evalResult.danDeHitType || 'Đã đối soát dàn đề'}</span>`;
        }
        if (eval3CangDe) {
            eval3CangDe.innerHTML = evalResult.cangDeHit 
                ? `<span class="text-purple-400 font-bold">💎 NỔ 3 CÀNG ĐỀ: ${evalResult.cangDeHit}</span>` 
                : `<span class="text-gray-400">Trượt 3 Càng Đề</span>`;
        }
        if (eval3CangLo) {
            eval3CangLo.innerHTML = evalResult.cangLoHit 
                ? `<span class="text-purple-300 font-bold">Nổ 3 Càng Lô: ${evalResult.cangLoHit}</span>` 
                : `<span class="text-gray-400">Trượt 3 Càng Lô</span>`;
        }
        if (evalDan3Cang) {
            evalDan3Cang.innerHTML = `<span class="text-gray-300">${evalResult.danCangNote || 'Đã đối soát 3 càng'}</span>`;
        }

        if (aiLessonsList) {
            if (learningEntry && learningEntry.lessons && learningEntry.lessons.length > 0) {
                aiLessonsList.innerHTML = learningEntry.lessons.map(l => `<div class="p-1.5 rounded bg-gray-800/80 font-mono text-[11px] text-amber-300">• ${l}</div>`).join('');
            } else {
                aiLessonsList.innerHTML = `<div class="text-gray-400 text-xs">Mô hình AI đã ghi nhận kết quả và tự động tối ưu hóa bộ trọng số!</div>`;
            }
        }
    }

    function renderInitialEvaluationState() {
        if (evalAccuracyBadge) evalAccuracyBadge.textContent = 'Mốc Chuẩn';
        if (aiLessonsList) {
            aiLessonsList.innerHTML = `<div class="text-gray-400 text-xs">Hệ thống AI đã nạp sẵn mốc lịch sử. Khi nạp kết quả kỳ mới, hệ thống sẽ tự động so khớp và học tăng cường!</div>`;
        }
    }

    function renderLockedPrediction(lockedData) {
        if (!lockedData) return;
        lastPredictionResult = lockedData.predictionResult;
        lastInputData = lockedData.inputData;
        lastFullBettingSlip = lockedData.fullBettingSlip;

        // Nếu có inputData nhưng thiếu predictionResult, tự động tính toán
        if (lastInputData && lastInputData.lottoNumbers && lastInputData.lottoNumbers.length > 0 && engine) {
            const analysis = engine.analyzeHeadsTails(lastInputData.lottoNumbers);
            if (!lastPredictionResult) {
                lastPredictionResult = engine.predict(lastInputData.lottoNumbers, lastInputData.specialPrize, lockedData.drawDate);
            }
            if (lastPredictionResult) {
                lastPredictionResult.inputSummary = analysis;
            }
        }

        // Fallback: nếu vẫn chưa có predictionResult nhưng có fullBettingSlip, tự tạo cấu trúc recommendations
        if (!lastPredictionResult && lastFullBettingSlip) {
            const b = lastFullBettingSlip.baoLo || {};
            const d = lastFullBettingSlip.dacBiet || {};
            lastPredictionResult = {
                recommendations: {
                    bachThu: b.btl || '68',
                    bachThuScore: b.btlScore || 125,
                    songThu: b.stl || ['68', '86'],
                    dan4: b.dan4 || [],
                    dan8: b.dan8 || [],
                    dan10: b.dan10 || [],
                    chamDe: d.chamDe || []
                },
                inputSummary: {
                    silentHeads: [],
                    silentTails: [],
                    heads: {},
                    tails: {}
                },
                scores: {},
                rankedList: []
            };
        }

        if (lockedData.evalResult) {
            renderEvaluationReport(lockedData.evalResult, lockedData.learningEntry);
        } else {
            renderInitialEvaluationState();
        }

        if (lastPredictionResult) {
            renderPredictions(lastPredictionResult);
            if (lastPredictionResult.inputSummary) renderHeadTails(lastPredictionResult.inputSummary);
            if (lastPredictionResult.scores) renderHeatmap(lastPredictionResult.scores);
        }
        if (lastFullBettingSlip) {
            renderFullBettingSlip(lastFullBettingSlip);
        }
    }

    function checkDailyLockStatus() {
        const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        const selectedDate = (inputDrawDate && inputDrawDate.value) ? inputDrawDate.value : todayVN;
        let lockedDays = getLockedDays();
        let lockedData = lockedDays[selectedDate];

        if (!lockedData) {
            if (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays && CANONICAL_INITIAL_DATA.lockedDays[selectedDate]) {
                lockedData = CANONICAL_INITIAL_DATA.lockedDays[selectedDate];
                saveLockedDay(selectedDate, lockedData);
            } else {
                const history = getHistory();
                const hist = history.find(h => h.date === selectedDate);
                if (hist && (hist.fullBettingSlip || hist.recommendations)) {
                    lockedData = {
                        drawDate: selectedDate,
                        inputData: {
                            date: selectedDate,
                            specialPrize: hist.specialPrize || '',
                            prize1: hist.prize1 || '',
                            rawPrizes: hist.rawPrizes || {},
                            lottoNumbers: hist.inputNumbers || []
                        },
                        predictionResult: {
                            recommendations: hist.recommendations || {
                                bachThu: (hist.fullBettingSlip && hist.fullBettingSlip.baoLo && hist.fullBettingSlip.baoLo.btl) || '68',
                                songThu: (hist.fullBettingSlip && hist.fullBettingSlip.baoLo && hist.fullBettingSlip.baoLo.stl) || ['68', '86']
                            },
                            fullBettingSlip: hist.fullBettingSlip
                        },
                        fullBettingSlip: hist.fullBettingSlip,
                        lockedAt: new Date().toISOString()
                    };
                    saveLockedDay(selectedDate, lockedData);
                }
            }
        }

        if (lockedData) {
            if (dailyLockBadge) dailyLockBadge.className = 'hidden md:flex px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-xs font-bold text-amber-300 items-center space-x-1.5';
            if (dailyLockStatusText) dailyLockStatusText.textContent = `🔒 Đã Chốt Ngày ${selectedDate}`;
            if (drawDateTag) drawDateTag.textContent = '🔒 Đã Chốt Số Cố Định';
            if (btnRunText) btnRunText.textContent = 'Xem Lại Bản Chốt Cố Định';

            renderLockedPrediction(lockedData);

            if (lockedData.inputData) {
                if (quickInputText && lockedData.inputData.lottoNumbers && lockedData.inputData.lottoNumbers.length > 0) {
                    quickInputText.value = lockedData.inputData.lottoNumbers.join(' ');
                    if (quickCountBadge) quickCountBadge.textContent = `Đã nhận: ${lockedData.inputData.lottoNumbers.length} số`;
                }
                if (lockedData.inputData.rawPrizes && fullBoardContainer) {
                    Object.keys(lockedData.inputData.rawPrizes).forEach(k => {
                        const inputEl = document.getElementById(`g_${k}`);
                        if (inputEl) inputEl.value = lockedData.inputData.rawPrizes[k];
                    });
                }
            }
        } else {
            const latestLocked = getLatestLockedDay();
            if (latestLocked) {
                if (dailyLockBadge) dailyLockBadge.className = 'hidden md:flex px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-xs font-bold text-amber-300 items-center space-x-1.5';
                if (dailyLockStatusText) dailyLockStatusText.textContent = `🔒 Sổ Chốt Ngày ${latestLocked.drawDate}`;
                if (drawDateTag) drawDateTag.textContent = `Bản chốt ${latestLocked.drawDate}`;
                if (btnRunText) btnRunText.textContent = 'Xem Lại Bản Chốt';
                renderLockedPrediction(latestLocked);
            } else {
                if (dailyLockBadge) dailyLockBadge.className = 'hidden md:flex px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-300 items-center space-x-1.5';
                if (dailyLockStatusText) dailyLockStatusText.textContent = `🟢 Sẵn sàng nhập kỳ ${selectedDate}`;
                if (drawDateTag) drawDateTag.textContent = 'Kỳ mới';
                if (btnRunText) btnRunText.textContent = 'Tự Học & Chốt Số Ngày Mai';
                renderInitialEvaluationState();
            }
        }
    }

    // --- 7. QUICK HISTORY SELECTOR POPULATION ---
    function populateQuickHistorySelect() {
        if (!quickHistorySelect) return;
        const lockedDays = getLockedDays();
        const history = getHistory();
        const canonicalDays = (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays) ? Object.keys(CANONICAL_INITIAL_DATA.lockedDays) : [];
        const allDates = Array.from(new Set([...Object.keys(lockedDays), ...history.map(h => h.date), ...canonicalDays])).filter(Boolean).sort().reverse();

        quickHistorySelect.innerHTML = '<option value="">-- Chọn ngày đã chốt để xem lại --</option>';
        allDates.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = `Kỳ ngày: ${d} (Đã chốt đầy đủ)`;
            quickHistorySelect.appendChild(opt);
        });
    }

    if (btnViewSelectedHistory) {
        btnViewSelectedHistory.addEventListener('click', () => {
            const chosen = quickHistorySelect ? quickHistorySelect.value : '';
            if (!chosen) {
                showToast("Vui lòng chọn 1 ngày trong danh sách!", "warning");
                return;
            }
            window.viewHistoricalDay(chosen);
        });
    }

    if (quickHistorySelect) {
        quickHistorySelect.addEventListener('change', () => {
            if (quickHistorySelect.value) {
                window.viewHistoricalDay(quickHistorySelect.value);
            }
        });
    }

    // --- 8. PREDICTION RUNNER ---
    if (btnRunPrediction) {
        btnRunPrediction.addEventListener('click', runPrediction);
    }

    function runPrediction() {
        if (!engine) return;
        const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
        const selectedDate = (inputDrawDate && inputDrawDate.value) ? inputDrawDate.value : todayVN;
        const lockedDays = getLockedDays();

        if (lockedDays[selectedDate]) {
            renderLockedPrediction(lockedDays[selectedDate]);
            showToast(`🔒 Ngày ${selectedDate} đã được chốt số cố định từ trước!`, "info");
            return;
        }

        let lottoNumbers = [];
        let specialPrize = '';
        let prize1 = '';
        let rawPrizes = {};

        if (currentMode === 'quick') {
            const txt = quickInputText ? quickInputText.value.trim() : '';
            if (!txt) {
                showToast("Vui lòng nhập hoặc dán dãy số lô đã về!", "warning");
                return;
            }
            lottoNumbers = engine.parseQuickInput(txt);
            if (lottoNumbers.length > 0) specialPrize = lottoNumbers[0];
        } else {
            const inputs = fullBoardContainer ? fullBoardContainer.querySelectorAll('input') : [];
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

        // Tự động đối chiếu hôm qua & học tăng cường
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

        // Dự đoán ngày mai & sinh sổ tay chốt số
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
        broadcastSlipToMasterServer(lastInputData, result, result.fullBettingSlip);

        renderPredictions(result);
        renderHeadTails(result.inputSummary);
        renderHeatmap(result.scores);
        renderFullBettingSlip(result.fullBettingSlip);

        if (vectorInspectorBox) vectorInspectorBox.textContent = lottoVector;
        showToast("🔒 Đã chốt số cố định & ghi vào Sổ Tay Chốt Số Toàn Diện!", "success");
    }

    function getActivePrediction(beforeDate) {
        try {
            const s = localStorage.getItem('bo_so_active_prediction');
            if (s) {
                const parsed = JSON.parse(s);
                if (!beforeDate || parsed.date < beforeDate) return parsed;
            }
        } catch (e) {}

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

    // --- 9. INPUT MODES & HELPERS ---
    if (modeQuickBtn && modeFullBtn) {
        modeQuickBtn.addEventListener('click', () => {
            currentMode = 'quick';
            modeQuickBtn.className = 'flex-1 py-2 rounded-lg bg-amber-500 text-black font-bold text-xs shadow transition';
            modeFullBtn.className = 'flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 font-semibold text-xs transition';
            if (quickInputContainer) quickInputContainer.classList.remove('hidden');
            if (fullBoardContainer) fullBoardContainer.classList.add('hidden');
        });

        modeFullBtn.addEventListener('click', () => {
            currentMode = 'full';
            modeFullBtn.className = 'flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold text-xs shadow transition';
            modeQuickBtn.className = 'flex-1 py-2 rounded-lg text-gray-400 hover:text-gray-200 font-semibold text-xs transition';
            if (fullBoardContainer) fullBoardContainer.classList.remove('hidden');
            if (quickInputContainer) quickInputContainer.classList.add('hidden');
        });
    }

    if (quickInputText && quickCountBadge) {
        quickInputText.addEventListener('input', () => {
            if (engine) {
                const nums = engine.parseQuickInput(quickInputText.value);
                quickCountBadge.textContent = `Đã nhận: ${nums.length} số`;
            }
        });
    }

    if (btnClearInput) {
        btnClearInput.addEventListener('click', () => {
            if (quickInputText) quickInputText.value = '';
            if (quickCountBadge) quickCountBadge.textContent = `Đã nhận: 0 số`;
            showToast("Đã xóa ô dán nhanh", "info");
        });
    }

    if (btnClearBoard) {
        btnClearBoard.addEventListener('click', () => {
            if (quickInputText) quickInputText.value = '';
            if (quickCountBadge) quickCountBadge.textContent = `Đã nhận: 0 số`;
            if (fullBoardContainer) {
                const inputs = fullBoardContainer.querySelectorAll('input');
                inputs.forEach(i => i.value = '');
            }
            showToast("Đã xóa trắng bảng nhập liệu", "info");
        });
    }

    if (btnPasteClipboard && quickInputText) {
        btnPasteClipboard.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    quickInputText.value = text;
                    if (engine) {
                        const nums = engine.parseQuickInput(text);
                        if (quickCountBadge) quickCountBadge.textContent = `Đã nhận: ${nums.length} số`;
                    }
                    showToast("📋 Đã dán nội dung từ Clipboard!", "success");
                }
            } catch (err) {
                showToast("Vui lòng cho phép quyền truy cập Clipboard!", "warning");
            }
        });
    }

    // --- 10. COPY, PRINT & MODAL ACTIONS ---
    window.copySection = function(section) {
        const s = lastFullBettingSlip || (getLatestLockedDay() && getLatestLockedDay().fullBettingSlip);
        if (!s) {
            showToast("Chưa có dữ liệu sổ chốt!");
            return;
        }
        const b = s.baoLo || {};
        const x = s.loXien || {};
        const d = s.dacBiet || {};
        const c = s.baCang || {};
        const baseDate = s.drawDate || (inputDrawDate ? inputDrawDate.value : '');
        const targetPlayDate = getNextDay(baseDate);
        const targetDateVN = formatDateVN(targetPlayDate);
        let text = '';

        if (section === 'baoLo') {
            text = `📌 [BAO LÔ VIP NGÀY ${targetDateVN}]\n• Bạch Thủ Lô VIP: ${b.btl || '--'}\n• Song Thủ Lô VIP: ${(b.stl && b.stl.join(' - ')) || '--'}\n• Lô Kép Đẹp: ${(b.topKep && b.topKep.join(', ')) || '--'}\n• Dàn Lô 4 Số: ${(b.dan4 && b.dan4.join(' - ')) || '--'}\n• Dàn Lô 8 Số: ${(b.dan8 && b.dan8.join(' - ')) || '--'}\n• Dàn Lô 10 Số: ${(b.dan10 && b.dan10.join(', ')) || '--'}`;
        } else if (section === 'loXien') {
            text = `🎯 [LÔ XIÊN & XIÊN QUAY NGÀY ${targetDateVN}]\n• Cặp Xiên 2: ${(x.xien2 && x.xien2.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n• Bộ Xiên 3: ${(x.xien3 && x.xien3.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n• Bộ Xiên 4: ${(x.xien4 && x.xien4.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n• Dàn Xiên Quay 4: [${(x.xienQuay4 && x.xienQuay4.join(', ')) || '--'}]`;
        } else if (section === 'dacBiet') {
            text = `👑 [GIẢI ĐẶC BIỆT & DÀN ĐỀ NGÀY ${targetDateVN}]\n• Đề Bạch Thủ: ${d.deBTL || '--'}\n• Đề Song Thủ: ${(d.deSTL && d.deSTL.join(' - ')) || '--'}\n• Chạm Đề: [${(d.chamDe && d.chamDe.join(', ')) || '--'}]\n• Dàn Đề 10 Số: ${(d.danDe10 && d.danDe10.join(', ')) || '--'}\n• Dàn Đề 20 Số: ${(d.danDe20 && d.danDe20.join(', ')) || '--'}\n• Dàn Đề 36 Số: ${(d.danDe36 && d.danDe36.join(', ')) || '--'}\n• Dàn Đề 64 Số: ${(d.danDe64 && d.danDe64.join(', ')) || '--'}`;
        } else if (section === 'baCang') {
            text = `💎 [BA CÀNG VIP NGÀY ${targetDateVN}]\n• Càng Sáng: [${(c.topCangs && c.topCangs.join(', ')) || '--'}]\n• 3 Càng Lô VIP: ${(c.baCangLoVIP && c.baCangLoVIP.join(' - ')) || '--'}\n• 3 Càng Đề VIP: ${(c.baCangDeVIP && c.baCangDeVIP.join(' - ')) || '--'}\n• Dàn 3 Càng: ${(c.danBaCang && c.danBaCang.join(', ')) || '--'}`;
        }

        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`📋 Đã sao chép ${section}!`, "success");
            }).catch(() => {
                showToast("Đã copy mục!", "info");
            });
        }
    };

    function formatSlipToText(s) {
        if (!s) return '';
        const b = s.baoLo || {};
        const x = s.loXien || {};
        const d = s.dacBiet || {};
        const c = s.baCang || {};

        const baseDate = s.drawDate || (inputDrawDate ? inputDrawDate.value : '');
        const targetPlayDate = getNextDay(baseDate);
        const targetDateVN = formatDateVN(targetPlayDate);
        const baseDateVN = formatDateVN(baseDate);

        return `======================================\n` +
            `👑 BỘ SỐ HUYỀN THOẠI - SỔ TAY CHỐT SỐ ĐÁNH NGÀY ${targetDateVN}\n` +
            `🎯 Mục tiêu đánh ngày: ${targetDateVN} (Căn cứ từ kỳ quay ngày ${baseDateVN})\n` +
            `======================================\n\n` +
            `⭐ 1. BAO LÔ TÔ (ĐÁNH NGÀY ${targetDateVN}):\n` +
            `• Bạch Thủ Lô VIP: ${b.btl || '--'}\n` +
            `• Song Thủ Lô VIP: ${(b.stl && b.stl.join(' - ')) || '--'}\n` +
            `• Lô Kép Đẹp: ${(b.topKep && b.topKep.join(', ')) || '--'}\n` +
            `• Dàn Lô 4 Số: ${(b.dan4 && b.dan4.join(' - ')) || '--'}\n` +
            `• Dàn Lô 8 Số: ${(b.dan8 && b.dan8.join(' - ')) || '--'}\n` +
            `• Dàn Lô 10 Số: ${(b.dan10 && b.dan10.join(', ')) || '--'}\n\n` +
            `🎯 2. LÔ XIÊN & XIÊN QUAY:\n` +
            `• Cặp Xiên 2: ${(x.xien2 && x.xien2.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n` +
            `• Bộ Xiên 3: ${(x.xien3 && x.xien3.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n` +
            `• Bộ Xiên 4: ${(x.xien4 && x.xien4.map(i => `(${i.join('-')})`).join(', ')) || '--'}\n` +
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
            `Chúc anh em đánh ngày ${targetDateVN} may mắn và thắng lớn!`;
    }

    if (btnCopyFullSlip) {
        btnCopyFullSlip.addEventListener('click', () => {
            const slip = lastFullBettingSlip || (getLatestLockedDay() && getLatestLockedDay().fullBettingSlip);
            if (!slip) {
                showToast("Chưa có sổ chốt số để copy!");
                return;
            }
            const text = formatSlipToText(slip);
            navigator.clipboard.writeText(text).then(() => {
                showToast("📋 Đã sao chép toàn bộ Sổ Tay Chốt Số vào Clipboard!", "success");
            }).catch(() => {
                showToast("Đã copy sổ chốt!", "info");
            });
        });
    }

    if (btnPrintSlip) {
        btnPrintSlip.addEventListener('click', () => {
            window.print();
        });
    }

    function openReasonModal(num, score, reasons) {
        if (!reasonModal) return;
        if (modalNumCircle) modalNumCircle.textContent = num;
        if (modalScoreText) modalScoreText.textContent = `${score} điểm`;
        if (modalReasonsList) {
            modalReasonsList.innerHTML = '';
            (reasons || []).forEach(r => {
                const item = document.createElement('div');
                item.className = 'p-2.5 rounded-xl bg-gray-800/80 border border-gray-700/80 flex items-center justify-between text-xs';
                item.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <span>${r.icon || '📌'}</span>
                        <span class="text-gray-200">${r.desc}</span>
                    </div>
                    <span class="text-amber-400 font-bold font-mono">+${r.points}đ</span>
                `;
                modalReasonsList.appendChild(item);
            });
        }
        reasonModal.classList.remove('hidden');
        reasonModal.classList.add('flex');
    }

    function closeModal() {
        if (reasonModal) {
            reasonModal.classList.add('hidden');
            reasonModal.classList.remove('flex');
        }
    }
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnDoneModal) btnDoneModal.addEventListener('click', closeModal);
    if (reasonModal) {
        reasonModal.addEventListener('click', (e) => {
            if (e.target === reasonModal) closeModal();
        });
    }

    // --- 11. TAB SWITCHING ---
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
        if (targetId === 'tab-matrix' && lastPredictionResult && lastPredictionResult.scores) renderHeatmap(lastPredictionResult.scores);
        if (targetId === 'tab-board' && lastPredictionResult && lastPredictionResult.inputSummary) renderHeadTails(lastPredictionResult.inputSummary);
        if (typeof lucide !== 'undefined') lucide.createIcons();

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

    // --- 12. DEDICATED HISTORY TAB ---
    function renderHistoryList() {
        if (!historyListContainer) return;
        const history = getHistory();
        const lockedDays = getLockedDays();
        const canonicalDays = (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays) ? Object.keys(CANONICAL_INITIAL_DATA.lockedDays) : [];
        const allDates = Array.from(new Set([...Object.keys(lockedDays), ...history.map(h => h.date), ...canonicalDays])).filter(Boolean).sort().reverse();

        historyListContainer.innerHTML = '';

        if (allDates.length === 0) {
            historyListContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500 text-sm space-y-2">
                    <div class="text-3xl">📭</div>
                    <div>Chưa có bản chốt số nào được lưu.</div>
                </div>
            `;
            return;
        }

        allDates.forEach((dateStr) => {
            const hist = history.find(h => h.date === dateStr);
            const locked = lockedDays[dateStr] || (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays && CANONICAL_INITIAL_DATA.lockedDays[dateStr]);
            const slip = (locked && locked.fullBettingSlip) || (hist && hist.fullBettingSlip);
            const rec = (locked && locked.predictionResult && locked.predictionResult.recommendations) || (hist && hist.recommendations) || (slip && slip.baoLo ? { bachThu: slip.baoLo.btl, songThu: slip.baoLo.stl } : null);
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

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">Bạch Thủ Lô:</span>
                        <span class="font-mono font-black text-base text-amber-300">${(rec && rec.bachThu) || (slip && slip.baoLo && slip.baoLo.btl) || '--'}</span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-gray-800/80">
                        <span class="text-gray-400 block text-[11px]">Song Thủ Lô:</span>
                        <span class="font-mono font-bold text-sm text-cyan-300">${(rec && rec.songThu && rec.songThu.join(' - ')) || (slip && slip.baoLo && slip.baoLo.stl && slip.baoLo.stl.join(' - ')) || '--'}</span>
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

    window.viewHistoricalDay = function(dateStr) {
        if (!dateStr) return;
        const lockedDays = getLockedDays();
        const history = getHistory();
        let targetData = lockedDays[dateStr];

        if (!targetData) {
            const hist = history.find(h => h.date === dateStr);
            if (hist && (hist.fullBettingSlip || hist.recommendations)) {
                targetData = {
                    drawDate: dateStr,
                    inputData: {
                        date: dateStr,
                        specialPrize: hist.specialPrize || '',
                        prize1: hist.prize1 || '',
                        rawPrizes: hist.rawPrizes || {},
                        lottoNumbers: hist.inputNumbers || []
                    },
                    predictionResult: {
                        recommendations: hist.recommendations || {
                            bachThu: (hist.fullBettingSlip && hist.fullBettingSlip.baoLo && hist.fullBettingSlip.baoLo.btl) || '68',
                            songThu: (hist.fullBettingSlip && hist.fullBettingSlip.baoLo && hist.fullBettingSlip.baoLo.stl) || ['68', '86']
                        },
                        fullBettingSlip: hist.fullBettingSlip
                    },
                    fullBettingSlip: hist.fullBettingSlip,
                    lockedAt: new Date().toISOString()
                };
                saveLockedDay(dateStr, targetData);
            } else if (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays && CANONICAL_INITIAL_DATA.lockedDays[dateStr]) {
                targetData = CANONICAL_INITIAL_DATA.lockedDays[dateStr];
                saveLockedDay(dateStr, targetData);
            }
        }

        if (inputDrawDate) {
            inputDrawDate.value = dateStr;
            updateTargetPlayDateDisplay();
        }

        if (targetData) {
            renderLockedPrediction(targetData);
            if (dailyLockBadge) dailyLockBadge.className = 'hidden md:flex px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-xs font-bold text-amber-300 items-center space-x-1.5';
            if (dailyLockStatusText) dailyLockStatusText.textContent = `🔒 Đã Chốt Ngày ${dateStr}`;
            if (drawDateTag) drawDateTag.textContent = '🔒 Đã Chốt Số Cố Định';
            if (btnRunText) btnRunText.textContent = 'Xem Lại Bản Chốt Cố Định';

            if (targetData.inputData) {
                if (quickInputText && targetData.inputData.lottoNumbers && targetData.inputData.lottoNumbers.length > 0) {
                    quickInputText.value = targetData.inputData.lottoNumbers.join(' ');
                    if (quickCountBadge) quickCountBadge.textContent = `Đã nhận: ${targetData.inputData.lottoNumbers.length} số`;
                }
                if (targetData.inputData.rawPrizes && fullBoardContainer) {
                    Object.keys(targetData.inputData.rawPrizes).forEach(k => {
                        const inputEl = document.getElementById(`g_${k}`);
                        if (inputEl) inputEl.value = targetData.inputData.rawPrizes[k];
                    });
                }
            }
        } else {
            checkDailyLockStatus();
        }

        switchTab('tab-predict');

        setTimeout(() => {
            const slipSection = document.getElementById('fullBettingSlipSection');
            if (slipSection) slipSection.scrollIntoView({ behavior: 'smooth' });
        }, 150);

        showToast(`📂 Đã mở trọn vẹn Sổ Tay Chốt Số ngày ${dateStr}!`, "success");
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
            showToast(`📋 Đã copy toàn bộ Sổ Tay Chốt Số ngày ${dateStr}!`, "success");
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

    // --- 13. RULES TAB ---
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
            const src = ruleSourceNum ? ruleSourceNum.value.trim() : '';
            const targetsRaw = ruleTargetNums ? ruleTargetNums.value.trim() : '';

            if (!src || !targetsRaw) {
                showToast("Vui lòng điền đầy đủ số nguồn và các số báo!", "warning");
                return;
            }

            const formattedSrc = engine ? engine.formatNum(src) : src;
            const formattedTargets = targetsRaw.split(/[^0-9]+/).filter(t => t.length > 0).map(t => engine ? engine.formatNum(t) : t);

            if (formattedTargets.length === 0) {
                showToast("Vui lòng nhập ít nhất một số báo hợp lệ!", "warning");
                return;
            }

            if (!customRules.numberMemory) customRules.numberMemory = {};
            customRules.numberMemory[formattedSrc] = formattedTargets;

            saveRulesToStorage(customRules);
            if (ruleSourceNum) ruleSourceNum.value = '';
            if (ruleTargetNums) ruleTargetNums.value = '';
            showToast(`Đã lưu quy tắc: ${formattedSrc} ➜ ${formattedTargets.join(', ')}`, "success");
        });
    }

    if (btnResetRules) {
        btnResetRules.addEventListener('click', () => {
            showCyberConfirm("Bạn có chắc chắn muốn khôi phục toàn bộ quy tắc bạc nhớ về mặc định không?", () => {
                if (typeof DEFAULT_RULES !== 'undefined') {
                    customRules = JSON.parse(JSON.stringify(DEFAULT_RULES));
                    saveRulesToStorage(customRules);
                    showToast("Đã khôi phục quy tắc gốc thành công!", "success");
                }
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

    // --- 14. MYSQL & DATASET ACTIONS ---
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

        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        fetch(`${getApiBase()}/save-draw`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        }).then(res => res.json())
          .then(data => {
              showToast(`💾 Đã lưu thành công kỳ ngày ${lastInputData.date} vào MySQL & Dataset AI!`, "success");
          })
          .catch(() => {
              showToast(`💾 Đã lưu dữ liệu kỳ ngày ${lastInputData.date} (Sẵn sàng xuất SQL & Dataset)!`, "info");
          });
    }

    if (btnSaveToMySQLTab) btnSaveToMySQLTab.addEventListener('click', handleSaveToMySQL);

    if (btnExportSQL) {
        btnExportSQL.addEventListener('click', () => {
            if (!engine) return;
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
                        item.inputNumbers || []
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
            showToast("📥 Đã tải file du_lieu_xsmb.sql thành công!", "success");
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
                        lotto_numbers: item.inputNumbers || [],
                        lotto_vector: engine ? engine.computeLottoVector(item.inputNumbers || []) : ''
                    });
                }
            });

            const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dataset_deep_learning_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("🧠 Đã tải file dataset_deep_learning.json thành công!", "success");
        });
    }

    function checkMySQLStatus() {
        if (!mysqlStatusBadge) return;
        fetch(`${getApiBase()}/status`, { method: 'GET' })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'connected') {
                    mysqlStatusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center space-x-1.5';
                    mysqlStatusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Đã kết nối MySQL: ${data.database}</span>`;
                }
            })
            .catch(() => {});
    }

    // --- 15. STARTUP INITIALIZATION SEQUENCE ---
    applyAuthUIState();
    syncInitialCanonicalData();

    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const latestLocked = getLatestLockedDay();
    const defaultDate = (latestLocked && latestLocked.drawDate) ? latestLocked.drawDate : todayVN;

    if (inputDrawDate) {
        inputDrawDate.value = defaultDate;
        updateTargetPlayDateDisplay();
        inputDrawDate.addEventListener('change', () => {
            checkDailyLockStatus();
            updateTargetPlayDateDisplay();
            syncCanonicalSlipFromCloud(inputDrawDate.value);
        });
    }

    updateWeightDisplay();
    populateQuickHistorySelect();
    if (quickHistorySelect && defaultDate) {
        quickHistorySelect.value = defaultDate;
    }
    checkDailyLockStatus();
    initCloudStatusUI();
    checkMySQLStatus();

    // Tải chốt số Cloud ngầm
    syncCanonicalSlipFromCloud();

    if (!isCurrentUserAdmin()) {
        setInterval(() => {
            syncCanonicalSlipFromCloud();
        }, 15000);
        window.addEventListener('focus', () => {
            syncCanonicalSlipFromCloud();
        });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
});
