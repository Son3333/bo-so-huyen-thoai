/**
 * BỘ SỐ HUYỀN THOẠI - AUTHENTICATION & RBAC CONTROLLER (auth.js)
 * Quản lý phiên làm việc, Phân quyền Quản trị / Khách VIP, Cổng bảo mật & Đăng nhập/Đăng ký
 */

// --- SESSION STORAGE MANAGEMENT ---
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
    if (typeof checkDailyLockStatus === 'function') checkDailyLockStatus();
    if (typeof syncCanonicalSlipFromCloud === 'function') syncCanonicalSlipFromCloud();
}

function clearAuthSession() {
    try {
        localStorage.removeItem('bo_so_auth_session');
    } catch (e) {}
    applyAuthUIState();
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) {
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

// --- UI NOTICES & ERRORS ---
function showAuthError(msg) {
    const authErrorBox = document.getElementById('authErrorBox');
    const authErrorText = document.getElementById('authErrorText');
    if (!authErrorBox) return;
    if (authErrorText) authErrorText.textContent = msg;
    authErrorBox.classList.remove('hidden');
    authErrorBox.classList.add('flex');
    authErrorBox.style.display = 'flex';
}

function hideAuthError() {
    const authErrorBox = document.getElementById('authErrorBox');
    if (!authErrorBox) return;
    authErrorBox.classList.add('hidden');
    authErrorBox.classList.remove('flex');
    authErrorBox.style.display = 'none';
}

// --- APPLY ROLE & GATEKEEPER UI ---
function applyAuthUIState() {
    const session = getAuthSession();
    const appLayout = document.getElementById('appLayout');
    const authModal = document.getElementById('authModal');
    const btnLoginTrigger = document.getElementById('btnLoginTrigger');
    const btnGoToAdmin = document.getElementById('btnGoToAdmin');
    const userProfileBadge = document.getElementById('userProfileBadge');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const userRoleIcon = document.getElementById('userRoleIcon');
    const userFullNameText = document.getElementById('userFullNameText');
    const userVipWelcomeBanner = document.getElementById('userVipWelcomeBanner');
    const vipUsernameText = document.getElementById('vipUsernameText');
    const navPredictTitle = document.getElementById('navPredictTitle');
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    const adminOnlySections = document.querySelectorAll('.admin-only-section');

    if (!session || !session.user) {
        // Chưa đăng nhập: BẮT BUỘC KHÓA TOÀN BỘ GIAO DIỆN, CHỈ HIỆN MÀN HÌNH ĐĂNG NHẬP
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

    // ĐÃ ĐĂNG NHẬP: MỞ KHÓA GIAO DIỆN CHÍNH, ẨN MÀN HÌNH ĐĂNG NHẬP
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
        // GIAO DIỆN QUẢN TRỊ VIÊN ADMIN (TOÀN QUYỀN XEM VÀ THAO TÁC TẤT CẢ)
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
        // NẾU LÀ USER THƯỜNG MÀ ĐANG Ở TRANG ADMIN -> CHUYỂN VỀ TRANG KHÁCH VIP
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) {
            window.location.href = 'index.html';
            return;
        }

        // GIAO DIỆN THÀNH VIÊN VIP (USER - CHỈ HIỆN DUY NHẤT SỔ TAY CHỐT SỐ VIP TOÀN MÀN HÌNH)
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
        // ẨN TOÀN BỘ BẢNG NẠP, PHÂN TÍCH ĐIỂM, AI ĐỐI SOÁT, MA TRẬN...
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

// --- EXECUTE LOGIN FLOW ---
async function executeLoginFlow(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    hideAuthError();

    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
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

    // 1. KIỂM TRA NGAY TÀI KHOẢN MẶC ĐỊNH (TỨC THÌ 0ms, 100% THÀNH CÔNG)
    if (username === 'admin' && (password === 'sondeptrai2005@@@@' || password === 'admin')) {
        const session = {
            token: 'admin_token_' + Date.now(),
            user: { username: 'admin', role: 'admin', full_name: 'Quản Trị Viên Tối Cao' }
        };
        setAuthSession(session);
        if (typeof showToast === 'function') showToast("👑 Chào mừng Quản Trị Viên!", "success");
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
        }
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '') {
            setTimeout(() => { window.location.href = 'admin.html'; }, 300);
        }
        return;
    }

    if (username === 'loc889999' && (password === 'Hoa160881' || password === 'hoa160881')) {
        const session = {
            token: 'vip_token_' + Date.now(),
            user: { username: 'loc889999', role: 'user', full_name: 'Thành Viên VIP' }
        };
        setAuthSession(session);
        if (typeof showToast === 'function') showToast("⭐ Chào mừng Thành Viên VIP!", "success");
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
        }
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) {
            setTimeout(() => { window.location.href = 'index.html'; }, 300);
        }
        return;
    }

    // 2. Kiểm tra tài khoản đã đăng ký trên máy này
    const localUsers = getRegisteredLocalUsers();
    if (localUsers[username] && localUsers[username].password === password) {
        const session = {
            token: 'user_token_' + Date.now(),
            user: { username: username, role: localUsers[username].role || 'user', full_name: localUsers[username].full_name || username }
        };
        setAuthSession(session);
        if (typeof showToast === 'function') showToast(`⭐ Chào mừng ${session.user.full_name}!`, "success");
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
        }
        const currentPath = window.location.pathname.toLowerCase();
        if (session.user.role === 'admin' && (currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '')) {
            setTimeout(() => { window.location.href = 'admin.html'; }, 300);
        } else if (session.user.role !== 'admin' && (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/'))) {
            setTimeout(() => { window.location.href = 'index.html'; }, 300);
        }
        return;
    }

    // 3. Nếu là tài khoản khác: Gửi xác thực tới Server
    try {
        const apiBase = typeof getApiBase === 'function' ? getApiBase() : '/api';
        const res = await fetch(`${apiBase}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).catch(() => null);

        if (res && res.ok) {
            const data = await res.json();
            if (data.status === 'success' && data.token) {
                setAuthSession({ token: data.token, user: data.user });
                const userRole = data.user.role || 'user';
                if (typeof showToast === 'function') showToast(`👑 Chào mừng ${data.user.full_name || data.user.username}!`, "success");
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4"></i><span>Đăng Nhập Hệ Thống</span>`;
                }
                const currentPath = window.location.pathname.toLowerCase();
                if (userRole === 'admin' && (currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '')) {
                    setTimeout(() => { window.location.href = 'admin.html'; }, 300);
                } else if (userRole !== 'admin' && (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/'))) {
                    setTimeout(() => { window.location.href = 'index.html'; }, 300);
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

// --- EXECUTE REGISTER FLOW ---
async function executeRegisterFlow(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    hideAuthError();

    const regFullName = document.getElementById('regFullName');
    const regUsername = document.getElementById('regUsername');
    const regPassword = document.getElementById('regPassword');
    const regPasswordConfirm = document.getElementById('regPasswordConfirm');

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

    // Lưu tài khoản cục bộ tức thì
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
    if (typeof showToast === 'function') showToast(`🎉 Đăng ký thành công! Chào mừng ${session.user.full_name}!`, "success");

    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i data-lucide="user-plus" class="w-4 h-4"></i><span>Tạo Tài Khoản VIP</span>`;
    }

    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.endsWith('admin.html') || currentPath.endsWith('/admin') || currentPath.endsWith('/admin/')) {
        setTimeout(() => { window.location.href = 'index.html'; }, 300);
    }

    // Đồng bộ tài khoản mới lên Server ngầm
    const apiBase = typeof getApiBase === 'function' ? getApiBase() : '/api';
    fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, full_name: fullName })
    }).catch(() => null);
}

// --- INIT AUTH LISTENERS ---
function initAuthEventListeners() {
    const btnLoginTrigger = document.getElementById('btnLoginTrigger');
    const authModal = document.getElementById('authModal');
    const tabAuthLoginBtn = document.getElementById('tabAuthLoginBtn');
    const tabAuthRegisterBtn = document.getElementById('tabAuthRegisterBtn');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');
    const btnSubmitRegister = document.getElementById('btnSubmitRegister');
    const btnQuickLoginAdmin = document.getElementById('btnQuickLoginAdmin');
    const btnQuickLoginVip = document.getElementById('btnQuickLoginVip');
    const btnToggleLoginPwd = document.getElementById('btnToggleLoginPwd');
    const loginPassword = document.getElementById('loginPassword');

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

    if (formLogin) {
        formLogin.addEventListener('submit', executeLoginFlow);
    }
    if (btnSubmitLogin) {
        btnSubmitLogin.addEventListener('click', executeLoginFlow);
    }

    if (formRegister) {
        formRegister.addEventListener('submit', executeRegisterFlow);
    }
    if (btnSubmitRegister) {
        btnSubmitRegister.addEventListener('click', executeRegisterFlow);
    }

    const logoutButtons = document.querySelectorAll('#btnLogoutBtn, .btn-logout-action');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            clearAuthSession();
            if (typeof showToast === 'function') showToast("🚪 Đã đăng xuất an toàn khỏi hệ thống!", "info");
        });
    });
}
