/**
 * BỘ SỐ HUYỀN THOẠI - UI & RENDERING CONTROLLER (ui.js)
 * Quản lý vẽ giao diện Bảng số, Sổ Tay VIP, Ma Trận Heatmap, Đối Soát & Toast Thông Báo
 */

// --- TOAST NOTIFICATION SYSTEM ---
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
    if (typeof onConfirm === 'function') {
        onConfirm();
    }
}

// --- DATE HELPERS ---
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
    const inputDrawDate = document.getElementById('inputDrawDate');
    const baseDate = inputDrawDate ? inputDrawDate.value : '';
    const targetDate = getNextDay(baseDate);
    const targetBadge = document.getElementById('targetPlayDateBadge');
    if (targetBadge && targetDate) {
        targetBadge.textContent = formatDateVN(targetDate);
    }
}

// --- RENDER FULL BETTING SLIP ---
function renderFullBettingSlip(slip) {
    if (!slip) return;

    const b = slip.baoLo || {};
    const x = slip.loXien || {};
    const d = slip.dacBiet || {};
    const c = slip.baCang || {};

    const inputDrawDate = document.getElementById('inputDrawDate');
    const baseDate = slip.drawDate || (inputDrawDate ? inputDrawDate.value : '');
    const targetPlayDate = getNextDay(baseDate);

    const slipTargetDateText = document.getElementById('slipTargetDateText');
    const slipTargetDateSub = document.getElementById('slipTargetDateSub');
    const slipBaseDateText = document.getElementById('slipBaseDateText');

    if (slipTargetDateText) slipTargetDateText.textContent = formatDateVN(targetPlayDate);
    if (slipTargetDateSub) slipTargetDateSub.textContent = formatDateVN(targetPlayDate);
    if (slipBaseDateText) slipBaseDateText.textContent = formatDateVN(baseDate);

    const slipBTL = document.getElementById('slipBTL');
    const slipSTL = document.getElementById('slipSTL');
    const slipKep = document.getElementById('slipKep');
    const slipDan4 = document.getElementById('slipDan4');
    const slipDan8 = document.getElementById('slipDan8');
    const slipDan10 = document.getElementById('slipDan10');

    if (slipBTL) slipBTL.textContent = b.btl || '--';
    if (slipSTL) slipSTL.textContent = (b.stl && b.stl.join(' - ')) || '--';
    if (slipKep) slipKep.textContent = (b.topKep && b.topKep.join(', ')) || '00, 11';
    if (slipDan4) slipDan4.textContent = (b.dan4 && b.dan4.join(' - ')) || '--';
    if (slipDan8) slipDan8.textContent = (b.dan8 && b.dan8.join(' - ')) || '--';
    if (slipDan10) slipDan10.textContent = (b.dan10 && b.dan10.join(', ')) || '--';

    const slipXien2 = document.getElementById('slipXien2');
    const slipXien3 = document.getElementById('slipXien3');
    const slipXien4 = document.getElementById('slipXien4');
    const slipXQCore = document.getElementById('slipXQCore');
    const slipXQDetails = document.getElementById('slipXQDetails');

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

    const slipDeBTL = document.getElementById('slipDeBTL');
    const slipDeSTL = document.getElementById('slipDeSTL');
    const slipChamDe = document.getElementById('slipChamDe');
    const slipDanDe10 = document.getElementById('slipDanDe10');
    const slipDanDe20 = document.getElementById('slipDanDe20');
    const slipDanDe36 = document.getElementById('slipDanDe36');
    const slipDanDe64 = document.getElementById('slipDanDe64');

    if (slipDeBTL) slipDeBTL.textContent = d.deBTL || '--';
    if (slipDeSTL) slipDeSTL.textContent = (d.deSTL && d.deSTL.join(' - ')) || '--';
    if (slipChamDe) slipChamDe.textContent = (d.chamDe && d.chamDe.join(', ')) || '--';
    if (slipDanDe10) slipDanDe10.textContent = (d.danDe10 && d.danDe10.join(', ')) || '--';
    if (slipDanDe20) slipDanDe20.textContent = (d.danDe20 && d.danDe20.join(', ')) || '--';
    if (slipDanDe36) slipDanDe36.textContent = (d.danDe36 && d.danDe36.join(', ')) || '--';
    if (slipDanDe64) slipDanDe64.textContent = (d.danDe64 && d.danDe64.join(', ')) || '--';

    const slipTopCangs = document.getElementById('slipTopCangs');
    const slip3CangLo = document.getElementById('slip3CangLo');
    const slip3CangDe = document.getElementById('slip3CangDe');
    const slipDan3Cang = document.getElementById('slipDan3Cang');

    if (slipTopCangs) slipTopCangs.textContent = (c.topCangs && c.topCangs.join(', ')) || '--';
    if (slip3CangLo) slip3CangLo.textContent = (c.baCangLoVIP && c.baCangLoVIP.join(', ')) || '--';
    if (slip3CangDe) slip3CangDe.textContent = (c.baCangDeVIP && c.baCangDeVIP.join(', ')) || '--';
    if (slipDan3Cang) slipDan3Cang.textContent = (c.danBaCang && c.danBaCang.join(', ')) || '--';
}

// --- RENDER PREDICTIONS SUMMARY ---
function renderPredictions(result) {
    if (!result || !result.recommendations) return;
    const rec = result.recommendations;

    const resBachThu = document.getElementById('resBachThu');
    const btlScoreBadge = document.getElementById('btlScoreBadge');
    const resSongThu = document.getElementById('resSongThu');
    const resDeBTL = document.getElementById('resDeBTL');
    const res3CangVIP = document.getElementById('res3CangVIP');

    if (resBachThu) resBachThu.textContent = rec.bachThu || '--';
    if (btlScoreBadge) btlScoreBadge.textContent = `${rec.bachThuScore || 0}đ`;
    if (resSongThu) resSongThu.textContent = (rec.songThu && rec.songThu.join(' - ')) || '-- - --';

    if (result.fullBettingSlip && result.fullBettingSlip.dacBiet) {
        if (resDeBTL) resDeBTL.textContent = result.fullBettingSlip.dacBiet.deBTL || '--';
    }
    if (result.fullBettingSlip && result.fullBettingSlip.baCang) {
        const top3C = result.fullBettingSlip.baCang.baCangDeVIP;
        if (res3CangVIP) res3CangVIP.textContent = (top3C && top3C.slice(0, 3).join(', ')) || '--';
    }
}

// --- RENDER LOCKED PREDICTION ENTRY ---
function renderLockedPrediction(lockedData) {
    if (!lockedData) return;
    if (lockedData.predictionResult) {
        renderPredictions(lockedData.predictionResult);
    }
    if (lockedData.fullBettingSlip) {
        renderFullBettingSlip(lockedData.fullBettingSlip);
    }
}

// --- COPY SECTION & FULL SLIP ---
window.copySection = function(sectionType) {
    let textToCopy = '';
    const slip = typeof getLatestLockedDay === 'function' ? (getLatestLockedDay() && getLatestLockedDay().fullBettingSlip) : null;
    const dateText = document.getElementById('slipTargetDateText') ? document.getElementById('slipTargetDateText').textContent : '';

    if (sectionType === 'baolo') {
        const btl = document.getElementById('slipBTL') ? document.getElementById('slipBTL').textContent : '';
        const stl = document.getElementById('slipSTL') ? document.getElementById('slipSTL').textContent : '';
        const kep = document.getElementById('slipKep') ? document.getElementById('slipKep').textContent : '';
        const d4 = document.getElementById('slipDan4') ? document.getElementById('slipDan4').textContent : '';
        const d8 = document.getElementById('slipDan8') ? document.getElementById('slipDan8').textContent : '';
        const d10 = document.getElementById('slipDan10') ? document.getElementById('slipDan10').textContent : '';
        textToCopy = `📌 [BAO LÔ VIP NGÀY ${dateText}]\n• Bạch Thủ Lô: ${btl}\n• Song Thủ Lô: ${stl}\n• Lô Kép: ${kep}\n• Dàn 4 Số: ${d4}\n• Dàn 8 Số: ${d8}\n• Dàn 10 Số: ${d10}`;
    } else if (sectionType === 'loxien') {
        const x2 = document.getElementById('slipXien2') ? document.getElementById('slipXien2').textContent : '';
        const x3 = document.getElementById('slipXien3') ? document.getElementById('slipXien3').textContent : '';
        const x4 = document.getElementById('slipXien4') ? document.getElementById('slipXien4').textContent : '';
        const xqCore = document.getElementById('slipXQCore') ? document.getElementById('slipXQCore').textContent : '';
        textToCopy = `🎯 [LÔ XIÊN & XIÊN QUAY NGÀY ${dateText}]\n• Xiên 2: ${x2}\n• Xiên 3: ${x3}\n• Xiên 4: ${x4}\n• Trục Xiên Quay: ${xqCore}`;
    } else if (sectionType === 'dacbiet') {
        const deBTL = document.getElementById('slipDeBTL') ? document.getElementById('slipDeBTL').textContent : '';
        const deSTL = document.getElementById('slipDeSTL') ? document.getElementById('slipDeSTL').textContent : '';
        const chamDe = document.getElementById('slipChamDe') ? document.getElementById('slipChamDe').textContent : '';
        const d10 = document.getElementById('slipDanDe10') ? document.getElementById('slipDanDe10').textContent : '';
        const d20 = document.getElementById('slipDanDe20') ? document.getElementById('slipDanDe20').textContent : '';
        const d36 = document.getElementById('slipDanDe36') ? document.getElementById('slipDanDe36').textContent : '';
        const d64 = document.getElementById('slipDanDe64') ? document.getElementById('slipDanDe64').textContent : '';
        textToCopy = `👑 [GIẢI ĐẶC BIỆT & DÀN ĐỀ NGÀY ${dateText}]\n• Đề Bạch Thủ: ${deBTL}\n• Đề Song Thủ: ${deSTL}\n• Chạm Đề: ${chamDe}\n• Dàn Đề 10s: ${d10}\n• Dàn Đề 20s: ${d20}\n• Dàn Đề 36s: ${d36}\n• Dàn Đề 64s: ${d64}`;
    } else if (sectionType === 'bacang') {
        const cang = document.getElementById('slipTopCangs') ? document.getElementById('slipTopCangs').textContent : '';
        const cLo = document.getElementById('slip3CangLo') ? document.getElementById('slip3CangLo').textContent : '';
        const cDe = document.getElementById('slip3CangDe') ? document.getElementById('slip3CangDe').textContent : '';
        const d3C = document.getElementById('slipDan3Cang') ? document.getElementById('slipDan3Cang').textContent : '';
        textToCopy = `💎 [BA CÀNG VIP NGÀY ${dateText}]\n• Càng Đẹp: ${cang}\n• 3 Càng Lô: ${cLo}\n• 3 Càng Đề: ${cDe}\n• Dàn 3 Càng: ${d3C}`;
    }

    if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast("📋 Đã copy mục vào bộ nhớ tạm!", "success");
        }).catch(() => {
            showToast("Đã chọn nội dung để copy!", "info");
        });
    }
};
