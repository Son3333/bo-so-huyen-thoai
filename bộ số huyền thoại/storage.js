/**
 * BỘ SỐ HUYỀN THOẠI - STORAGE CONTROLLER (storage.js)
 * Quản lý cơ sở dữ liệu Client LocalStorage, Khóa chốt số theo ngày và Lịch sử
 */

function getLockedDays() {
    try {
        const saved = localStorage.getItem('bo_so_locked_days');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
}

function saveLockedDay(dateStr, data) {
    const locked = getLockedDays();
    locked[dateStr] = data;
    try {
        localStorage.setItem('bo_so_locked_days', JSON.stringify(locked));
    } catch (e) {}
    if (typeof populateQuickHistorySelect === 'function') populateQuickHistorySelect();
    if (typeof checkDailyLockStatus === 'function') checkDailyLockStatus();
}

function getLatestLockedDay() {
    const lockedDays = getLockedDays();
    const dates = Object.keys(lockedDays).sort().reverse();
    if (dates.length > 0) {
        return lockedDays[dates[0]];
    }
    if (typeof CANONICAL_INITIAL_DATA !== 'undefined' && CANONICAL_INITIAL_DATA.lockedDays) {
        const cDates = Object.keys(CANONICAL_INITIAL_DATA.lockedDays).sort().reverse();
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
    } catch (e) {
        console.error("Error reading history", e);
    }
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
    if (typeof populateQuickHistorySelect === 'function') populateQuickHistorySelect();
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
    }
}

function loadStoredRules() {
    try {
        const saved = localStorage.getItem('bo_so_custom_rules');
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error("Error loading rules from localStorage", e);
    }
    if (typeof DEFAULT_RULES !== 'undefined') {
        return JSON.parse(JSON.stringify(DEFAULT_RULES));
    }
    return {};
}

function saveRulesToStorage(rules, engineInstance) {
    try {
        localStorage.setItem('bo_so_custom_rules', JSON.stringify(rules));
    } catch (e) {}
    if (engineInstance && typeof engineInstance.setRules === 'function') {
        engineInstance.setRules(rules);
    }
    if (typeof renderRulesList === 'function') renderRulesList();
}
