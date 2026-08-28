/**
 * BỘ SỐ HUYỀN THOẠI - CLOUD & SYNC CONTROLLER (cloud.js)
 * Quản lý kết nối Render Master Cloud Server, Đồng bộ Sổ Chốt Số & Cào kết quả trực tuyến
 */

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
                        const lockedDays = typeof getLockedDays === 'function' ? getLockedDays() : {};
                        const currentLocked = lockedDays[actualDate];

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
                                    bachThu: (slip.baoLo && slip.baoLo.btl) || '34',
                                    songThu: (slip.baoLo && slip.baoLo.stl) || ['34', '43'],
                                    dan4: (slip.baoLo && slip.baoLo.dan4) || [],
                                    chamDe: (slip.dacBiet && slip.dacBiet.chamDe) || []
                                },
                                fullBettingSlip: slip
                            },
                            fullBettingSlip: slip,
                            lockedAt: payload.lockedAt || new Date().toISOString()
                        };

                        const isNewOrUpdated = !currentLocked || JSON.stringify(currentLocked.fullBettingSlip) !== JSON.stringify(slip);
                        if (isNewOrUpdated && typeof saveLockedDay === 'function') {
                            saveLockedDay(actualDate, canonData);
                        }

                        // Render ngay lập tức cho người dùng
                        const inputDrawDate = document.getElementById('inputDrawDate');
                        if (typeof isCurrentUserAdmin === 'function' && (!isCurrentUserAdmin() || (inputDrawDate && inputDrawDate.value === actualDate))) {
                            if (typeof renderLockedPrediction === 'function') {
                                renderLockedPrediction(canonData);
                            }
                        }
                        return true;
                    }
                }
            }
        } catch (e) {}
    }

    // Fallback Offline: Nạp ngày mới nhất trong bộ nhớ
    if (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin()) {
        const latestLocked = typeof getLatestLockedDay === 'function' ? getLatestLockedDay() : null;
        if (latestLocked && typeof renderLockedPrediction === 'function') {
            renderLockedPrediction(latestLocked);
        }
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

    const token = typeof getAuthToken === 'function' ? getAuthToken() : '';
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

            if (res && res.ok) {
                sentSuccess = true;
            }
        } catch (e) {}
    }

    if (sentSuccess && typeof showToast === 'function') {
        showToast("🤖 Đã tự động bắn Sổ Tay Chốt Số VIP vào nhóm Telegram!", "success");
    }
}

async function testCloudConnection(showFeedback = false) {
    const cloudUrl = getCloudServerUrl();
    const cloudPingText = document.getElementById('cloudPingText');
    const cloudStatusDot = document.getElementById('cloudStatusDot');
    const cloudStatusText = document.getElementById('cloudStatusText');
    const cloudServerTimeText = document.getElementById('cloudServerTimeText');

    if (cloudPingText) cloudPingText.textContent = "Đang kiểm tra...";
    
    try {
        const res = await fetch(`${cloudUrl}/api/status`, { cache: 'no-cache' }).catch(() => null);
        if (res && res.ok) {
            const data = await res.json();
            if (cloudStatusDot) cloudStatusDot.className = "w-2 h-2 rounded-full bg-emerald-400";
            if (cloudStatusText) cloudStatusText.textContent = "☁️ Cloud Live";
            if (cloudPingText) cloudPingText.innerHTML = `<span class="text-emerald-400 font-bold">🟢 Kết nối Tốt (${data.service || 'Render Master'})</span>`;
            if (cloudServerTimeText) cloudServerTimeText.textContent = `Giờ máy chủ: ${data.server_time_vn || '--'}`;
            if (showFeedback && typeof showToast === 'function') showToast("🟢 Kết nối Máy chủ Cloud thành công!", "success");
            return true;
        }
    } catch (e) {}

    if (cloudStatusDot) cloudStatusDot.className = "w-2 h-2 rounded-full bg-amber-400";
    if (cloudStatusText) cloudStatusText.textContent = "☁️ Cào Trực Tuyến";
    if (cloudPingText) cloudPingText.innerHTML = `<span class="text-amber-400 font-semibold">🟡 Cào trực tiếp từ mạng (Đã kích hoạt)</span>`;
    if (showFeedback && typeof showToast === 'function') showToast("Đã kích hoạt chế độ cào mạng trực tiếp!", "info");
    return false;
}

function initCloudStatusUI() {
    const inputCloudServerUrl = document.getElementById('inputCloudServerUrl');
    if (inputCloudServerUrl) {
        inputCloudServerUrl.value = getCloudServerUrl();
    }
    testCloudConnection(false);
}
