-- ====================================================================
-- BỘ SỐ HUYỀN THOẠI - LƯỢC ĐỒ CƠ SỞ DỮ LIỆU MYSQL CHO HỌC SÂU (AI DEEP LEARNING)
-- Thiết kế tối ưu hóa cho bài toán dự đoán chuỗi thời gian (Time-Series)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `bo_so_huyen_thoai` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bo_so_huyen_thoai`;

-- --------------------------------------------------------------------
-- 1. Bảng lưu trữ kết quả các kỳ quay thưởng gốc (Raw Draws)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lottery_draws` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `draw_date` DATE NOT NULL UNIQUE COMMENT 'Ngày mở thưởng',
    `special_prize` VARCHAR(10) DEFAULT NULL COMMENT 'Giải đặc biệt đầy đủ (ví dụ: 84723)',
    `gdb_lotto` VARCHAR(2) DEFAULT NULL COMMENT '2 số cuối GĐB (ví dụ: 23)',
    `prize_1` VARCHAR(10) DEFAULT NULL COMMENT 'Giải nhất (ví dụ: 59389)',
    `raw_prizes` JSON DEFAULT NULL COMMENT 'JSON lưu toàn bộ 27 giải',
    `lotto_numbers` JSON NOT NULL COMMENT 'Danh sách 27 số lô tô 2 chữ số',
    `lotto_vector` VARCHAR(100) NOT NULL COMMENT 'Vector nhị phân 100 chiều (0/1) từ 00 đến 99',
    `total_lotto_count` INT DEFAULT 27 COMMENT 'Tổng số lô về trong ngày',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_draw_date` (`draw_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng kết quả xổ số và vector hóa 100 số';

-- --------------------------------------------------------------------
-- 2. Bảng đặc trưng thống kê số học (Feature Engineering for ML/AI)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lottery_features` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `draw_date` DATE NOT NULL UNIQUE COMMENT 'Ngày mở thưởng',
    `silent_heads` JSON DEFAULT NULL COMMENT 'Mảng các đầu câm [0..9]',
    `silent_tails` JSON DEFAULT NULL COMMENT 'Mảng các đuôi câm [0..9]',
    `heads_distribution` JSON DEFAULT NULL COMMENT 'Phân bố tần suất theo đầu 0-9',
    `tails_distribution` JSON DEFAULT NULL COMMENT 'Phân bố tần suất theo đuôi 0-9',
    `shadows_gdb` JSON DEFAULT NULL COMMENT 'Bóng âm dương của giải Đặc Biệt',
    `appearance_gaps` JSON DEFAULT NULL COMMENT 'Số ngày gan chưa về của từng số 00-99',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`draw_date`) REFERENCES `lottery_draws`(`draw_date`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đặc trưng kỹ thuật phục vụ nạp vào mô hình AI';

-- --------------------------------------------------------------------
-- 3. Bảng lưu trữ lịch sử dự đoán của AI và đánh giá độ chính xác (Predictions Log)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_predictions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `draw_date` DATE NOT NULL COMMENT 'Ngày chạy phân tích (ngày hôm nay)',
    `predict_for_date` DATE NOT NULL COMMENT 'Ngày dự đoán kết quả sẽ ra (ngày mai)',
    `model_name` VARCHAR(50) DEFAULT 'HYBRID_AI_V2' COMMENT 'Tên mô hình AI / Thuật toán',
    `bach_thu` VARCHAR(2) NOT NULL COMMENT 'Bạch thủ lô VIP',
    `song_thu` JSON DEFAULT NULL COMMENT 'Song thủ lô [AB, BA]',
    `dan_4` JSON DEFAULT NULL COMMENT 'Dàn 4 số',
    `dan_8` JSON DEFAULT NULL COMMENT 'Dàn 8 số',
    `dan_10` JSON DEFAULT NULL COMMENT 'Dàn 10 số',
    `xien_2` JSON DEFAULT NULL COMMENT 'Cặp xiên 2',
    `xien_3` JSON DEFAULT NULL COMMENT 'Cặp xiên 3',
    `cham_de` JSON DEFAULT NULL COMMENT 'Dự đoán chạm đề',
    `scores_json` JSON DEFAULT NULL COMMENT 'Điểm số chi tiết của 100 số',
    `is_evaluated` TINYINT(1) DEFAULT 0 COMMENT 'Đã so khớp với kết quả thực tế chưa (0=chưa, 1=rồi)',
    `hits_count` INT DEFAULT 0 COMMENT 'Số lượng con số dự đoán trúng thực tế',
    `evaluation_notes` TEXT DEFAULT NULL COMMENT 'Ghi chú đánh giá chi tiết',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_predict_date` (`predict_for_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nhật ký dự đoán và tỷ lệ thắng';

-- --------------------------------------------------------------------
-- 4. Bảng tập dữ liệu huấn luyện Deep Learning (Time-Series Lookback Dataset)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_training_dataset` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sample_date` DATE NOT NULL COMMENT 'Ngày kết thúc chuỗi quan sát X_t',
    `target_date` DATE NOT NULL COMMENT 'Ngày nhãn kết quả thực tế Y_t+1',
    `lookback_days` INT DEFAULT 7 COMMENT 'Số ngày nhìn lại trong quá khứ',
    `feature_matrix_x` LONGTEXT NOT NULL COMMENT 'Ma trận đầu vào X (Lookback * 100 chiều)',
    `target_vector_y` VARCHAR(100) NOT NULL COMMENT 'Vector nhãn Y (100 chiều 0/1 ngày mai)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sample_date` (`sample_date`),
    INDEX `idx_target_date` (`target_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tập dữ liệu chuẩn hóa cho TensorFlow / PyTorch';

-- --------------------------------------------------------------------
-- Dữ liệu mẫu ban đầu (Sample Data Seed)
-- --------------------------------------------------------------------
INSERT IGNORE INTO `lottery_draws` (`draw_date`, `special_prize`, `gdb_lotto`, `prize_1`, `lotto_numbers`, `lotto_vector`, `total_lotto_count`)
VALUES (
    '2026-08-25',
    '84723',
    '23',
    '59389',
    '["23","89","45","10","27","48","14","56","68","79","34","65","41","92","16","38","75","02","69","11","42","90","78","24","86","05","37"]',
    '0010010000110010100000011001000000100110011001001000100100000000010001000010101000000001000001000010',
    27
);

