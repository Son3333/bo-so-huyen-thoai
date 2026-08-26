/**
 * BỘ SỐ HUYỀN THOẠI - CORE PREDICTION & ADAPTIVE CONTINUAL LEARNING ENGINE
 * Bộ máy tính toán, phân tích bạc nhớ, tự học tăng cường và sinh Sổ Tay Chốt Số Toàn Diện
 */

class PredictionEngine {
    constructor(customRules = null) {
        this.rules = customRules || (typeof DEFAULT_RULES !== 'undefined' ? DEFAULT_RULES : {});
        this.weights = this.loadAdaptiveWeights();
        this.learningHistory = this.loadLearningHistory();
    }

    /**
     * Khởi tạo hoặc tải trọng số tự thích ứng từ LocalStorage
     */
    loadAdaptiveWeights() {
        const defaultWeights = {
            bac_nho: 28,
            dau_cam: 32,
            duoi_cam: 32,
            bong_so: 22,
            lo_roi: 16,
            di_cung: 20,
            dau_cam_kep: 20,
            duoi_cam_kep: 20,
            ruleBoosts: {}
        };

        if (typeof localStorage !== 'undefined') {
            try {
                const saved = localStorage.getItem('bo_so_adaptive_weights');
                if (saved) return { ...defaultWeights, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Error reading adaptive weights", e);
            }
        }
        return defaultWeights;
    }

    saveAdaptiveWeights() {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('bo_so_adaptive_weights', JSON.stringify(this.weights));
            } catch (e) {}
        }
    }

    loadLearningHistory() {
        if (typeof localStorage !== 'undefined') {
            try {
                const saved = localStorage.getItem('bo_so_learning_history');
                if (saved) return JSON.parse(saved);
            } catch (e) {}
        }
        return [];
    }

    saveLearningHistory(entry) {
        this.learningHistory.unshift(entry);
        if (this.learningHistory.length > 50) this.learningHistory.pop();
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('bo_so_learning_history', JSON.stringify(this.learningHistory));
            } catch (e) {}
        }
    }

    setRules(newRules) {
        this.rules = newRules;
    }

    formatNum(n) {
        const str = String(n).trim();
        return str.length === 1 ? '0' + str : str.slice(-2);
    }

    parseQuickInput(text) {
        if (!text || typeof text !== 'string') return [];
        const tokens = text.split(/[^0-9]+/).filter(t => t.length > 0);
        const lottoNumbers = [];

        tokens.forEach(tok => {
            if (tok.length >= 2) {
                lottoNumbers.push(tok.slice(-2));
            } else if (tok.length === 1) {
                lottoNumbers.push('0' + tok);
            }
        });

        return lottoNumbers;
    }

    parseFullBoard(board) {
        const lottoNumbers = [];
        let specialPrize = '';

        if (board.gdb) {
            specialPrize = String(board.gdb).trim();
            if (specialPrize.length >= 2) lottoNumbers.push(specialPrize.slice(-2));
        }

        const prizeKeys = ['g1', 'g2_1', 'g2_2', 'g3_1', 'g3_2', 'g3_3', 'g3_4', 'g3_5', 'g3_6',
            'g4_1', 'g4_2', 'g4_3', 'g4_4', 'g5_1', 'g5_2', 'g5_3', 'g5_4', 'g5_5', 'g5_6',
            'g6_1', 'g6_2', 'g6_3', 'g7_1', 'g7_2', 'g7_3', 'g7_4'];

        prizeKeys.forEach(k => {
            if (board[k]) {
                const s = String(board[k]).trim();
                if (s.length >= 2) lottoNumbers.push(s.slice(-2));
            }
        });

        return { lottoNumbers, specialPrize };
    }

    computeLottoVector(lottoNumbers) {
        const vec = new Array(100).fill('0');
        lottoNumbers.forEach(n => {
            const idx = parseInt(this.formatNum(n), 10);
            if (!isNaN(idx) && idx >= 0 && idx < 100) {
                vec[idx] = '1';
            }
        });
        return vec.join('');
    }

    generateSQLInsert(drawDate, specialPrize, prize1, rawPrizes, lottoNumbers) {
        const gdbLotto = specialPrize.length >= 2 ? specialPrize.slice(-2) : (lottoNumbers[0] || '');
        const lottoVector = this.computeLottoVector(lottoNumbers);
        const lottoArrJSON = JSON.stringify(lottoNumbers.map(n => this.formatNum(n)));
        const rawPrizesJSON = JSON.stringify(rawPrizes || {});

        return `INSERT INTO \`lottery_draws\` (\`draw_date\`, \`special_prize\`, \`gdb_lotto\`, \`prize_1\`, \`raw_prizes\`, \`lotto_numbers\`, \`lotto_vector\`, \`total_lotto_count\`)\n` +
               `VALUES ('${drawDate}', '${specialPrize}', '${gdbLotto}', '${prize1}', '${rawPrizesJSON}', '${lottoArrJSON}', '${lottoVector}', ${lottoNumbers.length})\n` +
               `ON DUPLICATE KEY UPDATE \`special_prize\` = VALUES(\`special_prize\`), \`gdb_lotto\` = VALUES(\`gdb_lotto\`), \`lotto_numbers\` = VALUES(\`lotto_numbers\`), \`lotto_vector\` = VALUES(\`lotto_vector\`);`;
    }

    analyzeHeadsTails(lottoNumbers) {
        const heads = { '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': [] };
        const tails = { '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': [] };
        const frequency = {};

        for (let i = 0; i < 100; i++) {
            const numStr = this.formatNum(i);
            frequency[numStr] = 0;
        }

        lottoNumbers.forEach(n => {
            const numStr = this.formatNum(n);
            const head = numStr[0];
            const tail = numStr[1];

            if (heads[head]) heads[head].push(numStr);
            if (tails[tail]) tails[tail].push(numStr);
            frequency[numStr] = (frequency[numStr] || 0) + 1;
        });

        const silentHeads = Object.keys(heads).filter(h => heads[h].length === 0);
        const silentTails = Object.keys(tails).filter(t => tails[t].length === 0);

        return { heads, tails, silentHeads, silentTails, frequency };
    }

    calculateShadows(numStr) {
        const s = this.formatNum(numStr);
        const d1 = s[0], d2 = s[1];
        const shadowRules = this.rules.shadows || { duong: {}, am: {} };

        const duong1 = shadowRules.duong[d1] || d1;
        const duong2 = shadowRules.duong[d2] || d2;
        const bóngDương = `${duong1}${duong2}`;
        const bóngDươngLộn = `${duong2}${duong1}`;

        const am1 = shadowRules.am[d1] || d1;
        const am2 = shadowRules.am[d2] || d2;
        const bóngÂm = `${am1}${am2}`;
        const bóngÂmLộn = `${am2}${am1}`;

        return { bóngDương, bóngDươngLộn, bóngÂm, bóngÂmLộn };
    }

    // =========================================================================
    // 🧠 TỰ ĐỘNG ĐỐI CHIẾU & HỌC TĂNG CƯỜNG (REINFORCEMENT LEARNING)
    // =========================================================================

    evaluatePastPrediction(actualLottoNumbers, actualSpecialPrize, pastPrediction) {
        if (!pastPrediction || !pastPrediction.recommendations) return null;

        const actualFormatted = actualLottoNumbers.map(n => this.formatNum(n));
        const rec = pastPrediction.recommendations;
        const actualGDB = actualSpecialPrize.length >= 2 ? actualSpecialPrize.slice(-2) : (actualFormatted[0] || '');

        // 1. Kiểm tra Bạch Thủ Lô
        const btl = rec.bachThu;
        const btlHits = actualFormatted.filter(n => n === btl).length;
        const btlSuccess = btlHits > 0;

        // 2. Kiểm tra Song Thủ Lô
        const stl = rec.songThu || [];
        const stlHits = stl.filter(n => actualFormatted.includes(n));

        // 3. Kiểm tra Dàn 4 & Dàn 8
        const dan4Hits = (rec.dan4 || []).filter(n => actualFormatted.includes(n));
        const dan8Hits = (rec.dan8 || []).filter(n => actualFormatted.includes(n));

        // 4. Kiểm tra Chạm Đề
        const chamDeHits = (rec.chamDe || []).filter(c => actualGDB.includes(c));
        const chamDeSuccess = chamDeHits.length > 0;

        // 5. Thống kê lý do
        const winningReasons = [];
        const pastReasons = pastPrediction.reasons || {};

        actualFormatted.forEach(hitNum => {
            if (pastReasons[hitNum] && pastReasons[hitNum].length > 0) {
                pastReasons[hitNum].forEach(r => {
                    winningReasons.push({ num: hitNum, ...r });
                });
            }
        });

        let totalScorePoints = 0;
        if (btlSuccess) totalScorePoints += 40 * btlHits;
        totalScorePoints += (stlHits.length / (stl.length || 1)) * 25;
        totalScorePoints += (dan4Hits.length / 4) * 20;
        totalScorePoints += (dan8Hits.length / 8) * 15;

        return {
            drawDate: pastPrediction.date || 'Hôm qua',
            btl: { num: btl, success: btlSuccess, hits: btlHits },
            stl: { list: stl, hits: stlHits, count: stlHits.length },
            dan4: { list: rec.dan4, hits: dan4Hits, count: dan4Hits.length },
            dan8: { list: rec.dan8, hits: dan8Hits, count: dan8Hits.length },
            chamDe: { list: rec.chamDe, success: chamDeSuccess, actualGDB },
            totalScorePoints: Math.min(100, Math.round(totalScorePoints)),
            winningReasons
        };
    }

    adaptWeightsAndLearn(evalResult) {
        if (!evalResult) return null;

        const lessons = [];
        const w = this.weights;
        const triggerCounts = {};

        evalResult.winningReasons.forEach(r => {
            const type = r.type;
            triggerCounts[type] = (triggerCounts[type] || 0) + 1;
        });

        if (triggerCounts['bac_nho']) {
            w.bac_nho = Math.min(50, w.bac_nho + triggerCounts['bac_nho'] * 2);
            lessons.push(`⚡ Bạc nhớ ma trận đoán trúng ${triggerCounts['bac_nho']} lần ➜ Tăng trọng số lên ${w.bac_nho}đ`);
        } else {
            w.bac_nho = Math.max(15, w.bac_nho - 1);
        }

        if (triggerCounts['dau_cam'] || triggerCounts['dau_cam_kep']) {
            w.dau_cam = Math.min(50, w.dau_cam + 4);
            lessons.push(`🛑 Bạc nhớ Đầu câm báo chuẩn xác ➜ Tăng trọng số lên ${w.dau_cam}đ`);
        } else {
            w.dau_cam = Math.max(18, w.dau_cam - 1);
        }

        if (triggerCounts['duoi_cam'] || triggerCounts['duoi_cam_kep']) {
            w.duoi_cam = Math.min(50, w.duoi_cam + 4);
            lessons.push(`⛔ Bạc nhớ Đuôi câm báo chuẩn xác ➜ Tăng trọng số lên ${w.duoi_cam}đ`);
        } else {
            w.duoi_cam = Math.max(18, w.duoi_cam - 1);
        }

        if (triggerCounts['bong_so']) {
            w.bong_so = Math.min(45, w.bong_so + 3);
            lessons.push(`✨ Cầu bóng âm dương GĐB nổ ➜ Tăng trọng số lên ${w.bong_so}đ`);
        } else {
            w.bong_so = Math.max(12, w.bong_so - 1);
        }

        if (triggerCounts['lo_roi']) {
            w.lo_roi = Math.min(35, w.lo_roi + 3);
            lessons.push(`🔥 Tín hiệu lô rơi nhiều nháy chính xác ➜ Tăng trọng số lên ${w.lo_roi}đ`);
        }

        if (lessons.length === 0) {
            lessons.push(`🔄 Đã cân bằng lại trọng số ma trận để tìm kiếm các nhịp cầu mới cho ngày mai.`);
        }

        this.saveAdaptiveWeights();

        const learningEntry = {
            date: evalResult.drawDate,
            accuracy: evalResult.totalScorePoints,
            lessons,
            updatedWeights: { ...w }
        };
        this.saveLearningHistory(learningEntry);

        return learningEntry;
    }

    // =========================================================================
    // 📋 BỘ SINH SỔ TAY CHỐT SỐ TOÀN DIỆN (BAO LÔ, XIÊN QUAY, DÀN ĐỀ, BA CÀNG)
    // =========================================================================
    generateFullBettingSlip(rankedList, rawRecommendations, inputSummary, drawDate) {
        const topNums = rankedList.map(item => item.num);
        
        // 1. BAO LÔ
        const btl = rawRecommendations.bachThu;
        const stl = rawRecommendations.songThu;
        const topKep = rawRecommendations.topKep;
        const dan4 = rawRecommendations.dan4;
        const dan8 = rawRecommendations.dan8;
        const dan10 = rawRecommendations.dan10;

        // 2. LÔ XIÊN & XIÊN QUAY
        const xien2 = rawRecommendations.xien2;
        const xien3 = rawRecommendations.xien3;
        const xien4 = [dan4.slice(0, 4)];
        
        // Xiên quay 4 con: tổ hợp 6 cặp xiên 2, 4 cặp xiên 3, 1 cặp xiên 4
        const xq = dan4.slice(0, 4);
        const xienQuayPairs = [];
        for (let i = 0; i < xq.length; i++) {
            for (let j = i + 1; j < xq.length; j++) {
                xienQuayPairs.push(`${xq[i]}-${xq[j]}`);
            }
        }
        const xienQuayTriplets = [];
        for (let i = 0; i < xq.length; i++) {
            for (let j = i + 1; j < xq.length; j++) {
                for (let k = j + 1; k < xq.length; k++) {
                    xienQuayTriplets.push(`${xq[i]}-${xq[j]}-${xq[k]}`);
                }
            }
        }

        // 3. ĐỀ ĐẶC BIỆT & DÀN ĐỀ
        const deBTL = topNums[0];
        const deSTL = [topNums[0], topNums[1]];
        const chamDe = rawRecommendations.chamDe;
        const topSums = rawRecommendations.topSums;

        // Dàn Đề 10 Số
        const danDe10 = topNums.slice(0, 10);

        // Dàn Đề 20 Số
        const danDe20 = topNums.slice(0, 20);

        // Dàn Đề 36 Số (Sinh từ các đầu và đuôi mạnh nhất)
        const topHeads = Array.from(new Set(topNums.slice(0, 25).map(n => n[0]))).slice(0, 6);
        const topTails = Array.from(new Set(topNums.slice(0, 25).map(n => n[1]))).slice(0, 6);
        const danDe36Set = new Set();
        topHeads.forEach(h => {
            topTails.forEach(t => {
                danDe36Set.add(`${h}${t}`);
            });
        });
        const danDe36 = Array.from(danDe36Set).slice(0, 36);

        // Dàn Đề 64 Số (Bộ khung an toàn 8 đầu x 8 đuôi)
        const danDe64Set = new Set();
        const top8Heads = Array.from(new Set(topNums.map(n => n[0]))).slice(0, 8);
        const top8Tails = Array.from(new Set(topNums.map(n => n[1]))).slice(0, 8);
        top8Heads.forEach(h => {
            top8Tails.forEach(t => {
                danDe64Set.add(`${h}${t}`);
            });
        });
        const danDe64 = Array.from(danDe64Set).slice(0, 64);

        // 4. BA CÀNG (3 CÀNG LÔ & 3 CÀNG ĐỀ)
        // Lấy càng sáng từ GĐB, bóng GĐB và ngày quay
        const dateObj = new Date(drawDate || new Date());
        const dayDigit = String(dateObj.getDate()).slice(-1);
        const gdbCang = inputSummary.specialPrize.length >= 3 ? inputSummary.specialPrize.slice(-3, -2) : '3';
        const shadowRules = this.rules.shadows || { duong: {} };
        const gdbCangBong = (shadowRules.duong && shadowRules.duong[gdbCang]) || '8';
        const dayDigitBong = (shadowRules.duong && shadowRules.duong[dayDigit]) || '5';

        const topCangs = Array.from(new Set([gdbCang, gdbCangBong, dayDigit, dayDigitBong, '3', '7'])).slice(0, 4);

        // 3 Càng Lô VIP: Ghép càng sáng với Bạch Thủ Lô
        const baCangLoVIP = topCangs.map(c => `${c}${btl}`);

        // 3 Càng Đề VIP: Ghép càng sáng với Đề Bạch Thủ & Đề Song Thủ
        const baCangDeVIP = [];
        topCangs.forEach(c => {
            baCangDeVIP.push(`${c}${deBTL}`);
            if (deSTL[1] && deSTL[1] !== deBTL) {
                baCangDeVIP.push(`${c}${deSTL[1]}`);
            }
        });

        // Dàn 3 Càng Đẹp (Ghép 2 càng sáng nhất với Dàn Đề 10 số)
        const danBaCang = [];
        topCangs.slice(0, 2).forEach(c => {
            danDe10.slice(0, 6).forEach(n => {
                danBaCang.push(`${c}${n}`);
            });
        });

        return {
            drawDate,
            baoLo: {
                btl,
                btlScore: rawRecommendations.bachThuScore,
                stl,
                topKep,
                dan4,
                dan8,
                dan10
            },
            loXien: {
                xien2,
                xien3,
                xien4,
                xienQuay4: xq,
                xienQuayPairs,
                xienQuayTriplets
            },
            dacBiet: {
                deBTL,
                deSTL,
                chamDe,
                topSums,
                danDe10,
                danDe20,
                danDe36,
                danDe64
            },
            baCang: {
                topCangs,
                baCangLoVIP,
                baCangDeVIP,
                danBaCang
            }
        };
    }

    /**
     * BỘ MÁY CHẤM ĐIỂM DỰ ĐOÁN TỔNG HỢP (AI SCORING ENGINE CÓ HỌC TĂNG CƯỜNG)
     */
    predict(lottoNumbers, specialPrize = '', drawDate = '') {
        if (!lottoNumbers || lottoNumbers.length === 0) {
            return null;
        }

        const analysis = this.analyzeHeadsTails(lottoNumbers);
        const { heads, tails, silentHeads, silentTails, frequency } = analysis;
        const lottoVector = this.computeLottoVector(lottoNumbers);
        const w = this.weights;

        const scores = {};
        const reasons = {};

        for (let i = 0; i < 100; i++) {
            const numStr = this.formatNum(i);
            scores[numStr] = 0;
            reasons[numStr] = [];
        }

        const addPoint = (targetNum, pts, type, desc, icon = '📌') => {
            const t = this.formatNum(targetNum);
            scores[t] += pts;
            reasons[t].push({ type, points: pts, desc, icon });
        };

        // 1. THUẬT TOÁN BẠC NHỚ MA TRẬN
        const uniqueLotto = Array.from(new Set(lottoNumbers.map(n => this.formatNum(n))));
        const numMem = this.rules.numberMemory || {};

        uniqueLotto.forEach(num => {
            if (numMem[num] && Array.isArray(numMem[num])) {
                numMem[num].forEach(target => {
                    addPoint(target, w.bac_nho, 'bac_nho', `Bạc nhớ ma trận (Trọng số ${w.bac_nho}đ): ${num} về báo ${target}`, '⚡');
                });
            }
        });

        // 2. THUẬT TOÁN ĐẦU CÂM
        const silHeadsRules = this.rules.silentHeads || {};
        silentHeads.forEach(head => {
            if (silHeadsRules[head]) {
                silHeadsRules[head].forEach(target => {
                    addPoint(target, w.dau_cam, 'dau_cam', `Đầu ${head} câm (Trọng số ${w.dau_cam}đ) báo ${target}`, '🛑');
                });
            }
            addPoint(`${head}${head}`, w.dau_cam_kep, 'dau_cam_kep', `Đầu ${head} câm nuôi kép ${head}${head}`, '🎯');
        });

        // 3. THUẬT TOÁN ĐUÔI CÂM
        const silTailsRules = this.rules.silentTails || {};
        silentTails.forEach(tail => {
            if (silTailsRules[tail]) {
                silTailsRules[tail].forEach(target => {
                    addPoint(target, w.duoi_cam, 'duoi_cam', `Đuôi ${tail} câm (Trọng số ${w.duoi_cam}đ) báo ${target}`, '⛔');
                });
            }
            addPoint(`${tail}${tail}`, w.duoi_cam_kep, 'duoi_cam_kep', `Đuôi ${tail} câm nuôi kép ${tail}${tail}`, '🎯');
        });

        // 4. THUẬT TOÁN BÓNG SỐ GIẢI ĐẶC BIỆT
        let gdbLotto = '';
        if (specialPrize && specialPrize.length >= 2) {
            gdbLotto = specialPrize.slice(-2);
        } else if (lottoNumbers.length > 0) {
            gdbLotto = lottoNumbers[0];
        }

        if (gdbLotto) {
            const shadows = this.calculateShadows(gdbLotto);
            addPoint(shadows.bóngDương, w.bong_so, 'bong_so', `Bóng dương GĐB (${gdbLotto}) -> ${shadows.bóngDương}`, '✨');
            addPoint(shadows.bóngDươngLộn, Math.round(w.bong_so * 0.85), 'bong_so', `Bóng dương lộn GĐB (${gdbLotto}) -> ${shadows.bóngDươngLộn}`, '✨');
            addPoint(shadows.bóngÂm, Math.round(w.bong_so * 0.9), 'bong_so', `Bóng âm GĐB (${gdbLotto}) -> ${shadows.bóngÂm}`, '🌙');
            addPoint(shadows.bóngÂmLộn, Math.round(w.bong_so * 0.75), 'bong_so', `Bóng âm lộn GĐB (${gdbLotto}) -> ${shadows.bóngÂmLộn}`, '🌙');

            const gdbReverse = gdbLotto[1] + gdbLotto[0];
            addPoint(gdbReverse, 15, 'lon_gdb', `Số đảo lộn của GĐB (${gdbLotto})`, '🔄');
        }

        // 5. CẶP SỐ ĐI CÙNG NHAU (CO-OCCURRENCE)
        const coOccur = this.rules.coOccurrences || [];
        coOccur.forEach(item => {
            const hasPair = item.pair.some(p => lottoNumbers.includes(p));
            if (hasPair) {
                item.friends.forEach(f => {
                    addPoint(f, w.di_cung, 'di_cung', `Cặp số đi cùng nhau kích hoạt bởi [${item.pair.join(',')}]`, '🤝');
                });
            }
        });

        // 6. THUẬT TOÁN LÔ NHIỀU NHÁY & LÔ RƠI
        Object.keys(frequency).forEach(num => {
            const count = frequency[num];
            if (count >= 2) {
                const rev = num[1] + num[0];
                addPoint(num, w.lo_roi * count, 'lo_roi', `Lô ${num} về ${count} nháy (tỷ lệ rơi lại)`, '🔥');
                addPoint(rev, Math.round(w.lo_roi * 0.85) * count, 'lo_lon', `Lô đảo của ${num} (${count} nháy)`, '🔄');
            }
        });

        // 7. XẾP HẠNG VÀ PHÂN LOẠI DANH MỤC ĐỀ XUẤT
        let rankedList = Object.keys(scores).map(num => ({
            num,
            score: scores[num],
            reasons: reasons[num],
            hitToday: frequency[num] || 0
        })).sort((a, b) => b.score - a.score);

        if (rankedList.length < 10) {
            const used = new Set(rankedList.map(r => r.num));
            for (let i = 0; i < 100 && rankedList.length < 10; i++) {
                const s = this.formatNum(i);
                if (!used.has(s)) {
                    rankedList.push({ num: s, score: 10, reasons: [], hitToday: 0 });
                    used.add(s);
                }
            }
        }

        const bachThu = rankedList[0] || { num: '00', score: 10 };

        let songThu = null;
        let maxPairScore = -1;

        for (let i = 0; i < Math.min(15, rankedList.length); i++) {
            const a = rankedList[i].num;
            const b = a[1] + a[0];
            if (a !== b) {
                const scoreA = scores[a] || 0;
                const scoreB = scores[b] || 0;
                const pairScore = scoreA + scoreB;
                if (pairScore > maxPairScore) {
                    maxPairScore = pairScore;
                    songThu = [a, b];
                }
            }
        }
        if (!songThu && rankedList.length >= 2) {
            songThu = [rankedList[0].num, rankedList[1].num];
        } else if (!songThu) {
            songThu = ['00', '55'];
        }

        const kepList = rankedList.filter(item => item.num[0] === item.num[1]);
        const topKep = (kepList.length > 0 ? kepList.slice(0, 3).map(k => k.num) : ['00', '11', '88']);

        const dan4 = rankedList.slice(0, 4).map(i => i.num);
        const dan8 = rankedList.slice(0, 8).map(i => i.num);
        const dan10 = rankedList.slice(0, 10).map(i => i.num);

        const xien2 = [
            [dan4[0], dan4[1]],
            [dan4[0], dan4[2]],
            [dan4[1], dan4[2]]
        ];
        const xien3 = [
            [dan4[0], dan4[1], dan4[2]],
            [dan4[0], dan4[1], dan4[3]]
        ];

        const headFreq = {};
        const tailFreq = {};
        const sumFreq = {};

        rankedList.slice(0, 15).forEach(item => {
            const h = item.num[0];
            const t = item.num[1];
            const sum = (parseInt(h, 10) + parseInt(t, 10)) % 10;

            headFreq[h] = (headFreq[h] || 0) + item.score;
            tailFreq[t] = (tailFreq[t] || 0) + item.score;
            sumFreq[sum] = (sumFreq[sum] || 0) + item.score;
        });

        const topHeads = Object.keys(headFreq).sort((a, b) => headFreq[b] - headFreq[a]).slice(0, 2);
        const topTails = Object.keys(tailFreq).sort((a, b) => tailFreq[b] - tailFreq[a]).slice(0, 2);
        const topSums = Object.keys(sumFreq).sort((a, b) => sumFreq[b] - sumFreq[a]).slice(0, 3);
        const chamDe = Array.from(new Set([...topHeads, ...topTails])).slice(0, 3);

        const rawRecommendations = {
            bachThu: bachThu.num,
            bachThuScore: bachThu.score,
            songThu,
            topKep,
            dan4,
            dan8,
            dan10,
            xien2,
            xien3,
            chamDe,
            topSums
        };

        const inputSummary = {
            totalNumbers: lottoNumbers.length,
            uniqueNumbers: uniqueLotto.length,
            specialPrize: gdbLotto,
            silentHeads,
            silentTails,
            heads,
            tails,
            lottoVector
        };

        // Sinh Sổ Tay Chốt Số Toàn Diện (Full Betting Slip)
        const fullBettingSlip = this.generateFullBettingSlip(rankedList, rawRecommendations, inputSummary, drawDate);

        return {
            inputSummary,
            rankedList,
            recommendations: rawRecommendations,
            fullBettingSlip,
            scores,
            reasons,
            activeWeights: { ...w }
        };
    }
}

// Export to window if in browser environment
if (typeof window !== 'undefined') {
    window.PredictionEngine = PredictionEngine;
}
