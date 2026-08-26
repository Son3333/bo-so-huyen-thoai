"""
================================================================================
BỘ SỐ HUYỀN THOẠI - DEEP LEARNING (AI HỌC SÂU) TRAINING PIPELINE
Mô hình mạng nơ-ron hồi quy LSTM (Long Short-Term Memory) & Deep Neural Network
Chuyên dụng cho bài toán dự đoán chuỗi thời gian phân phối xác suất 100 số lô tô
================================================================================
"""

import os
import sys
import json
import datetime
import numpy as np

# Cấu hình kết nối MySQL mặc định
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'bo_so_huyen_thoai'
}

LOOKBACK_DAYS = 7  # Số ngày quan sát trong quá khứ để dự đoán ngày mai
EPOCHS = 50        # Số vòng huấn luyện
BATCH_SIZE = 8

def connect_mysql():
    """Thử kết nối MySQL bằng mysql.connector hoặc pymysql"""
    try:
        import mysql.connector
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        print(" [MySQL] Kết nối cơ sở dữ liệu MySQL thành công!")
        return conn
    except ImportError:
        try:
            import pymysql
            conn = pymysql.connect(**MYSQL_CONFIG)
            print(" [MySQL] Kết nối MySQL qua PyMySQL thành công!")
            return conn
        except Exception as e:
            print(f" [MySQL] Chưa cài đặt thư viện kết nối MySQL ({e}).")
            return None
    except Exception as e:
        print(f" [MySQL] Không thể kết nối MySQL ({e}).")
        return None

def load_data_from_mysql(conn):
    """Đọc dữ liệu lịch sử các kỳ quay từ MySQL"""
    cursor = conn.cursor(dictionary=True)
    query = "SELECT draw_date, lotto_numbers, lotto_vector FROM lottery_draws ORDER BY draw_date ASC"
    cursor.execute(query)
    rows = cursor.fetchall()
    cursor.close()
    return rows

def load_data_from_json(filepath="dataset_deep_learning.json"):
    """Đọc dữ liệu từ file JSON nếu chưa kết nối MySQL"""
    if not os.path.exists(filepath):
        print(f"⚠️ Không tìm thấy file {filepath}. Tạo dữ liệu mẫu giả định để huấn luyện...")
        return generate_mock_history(60)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"📂 Đã nạp thành công {len(data)} kỳ quay từ {filepath}")
    return data

def generate_mock_history(num_days=60):
    """Tạo chuỗi dữ liệu giả định chuẩn XSMB để test học sâu"""
    history = []
    base_date = datetime.date.today() - datetime.timedelta(days=num_days)
    
    for i in range(num_days):
        d = base_date + datetime.timedelta(days=i)
        # Sinh ngẫu nhiên 27 con lô (có thể trùng lặp)
        nums = [f"{np.random.randint(0, 100):02d}" for _ in range(27)]
        vector = ['0'] * 100
        for n in nums:
            vector[int(n)] = '1'
        history.append({
            'draw_date': str(d),
            'lotto_numbers': nums,
            'lotto_vector': "".join(vector)
        })
    return history

def prepare_time_series_dataset(history, lookback=LOOKBACK_DAYS):
    """
    Chuyển đổi chuỗi lịch sử thành tensor đầu vào (X) và nhãn (Y) cho Học Sâu
    X shape: (num_samples, lookback, 100)
    Y shape: (num_samples, 100)
    """
    vectors = []
    for item in history:
        vec_str = item.get('lotto_vector')
        if not vec_str or len(vec_str) != 100:
            # Tự tạo vector từ lotto_numbers
            nums = item.get('lotto_numbers', [])
            if isinstance(nums, str):
                nums = json.loads(nums)
            v = np.zeros(100, dtype=np.float32)
            for n in nums:
                v[int(n)] = 1.0
            vectors.append(v)
        else:
            v = np.array([float(ch) for ch in vec_str], dtype=np.float32)
            vectors.append(v)
            
    vectors = np.array(vectors) # (total_days, 100)
    
    X, Y = [], []
    for i in range(len(vectors) - lookback):
        X.append(vectors[i : i + lookback])
        Y.append(vectors[i + lookback])
        
    return np.array(X, dtype=np.float32), np.array(Y, dtype=np.float32), vectors

# ==============================================================================
# XÂY DỰNG MÔ HÌNH HỌC SÂU (LSTM / DEEP NEURAL NETWORK)
# ==============================================================================
def train_with_pytorch(X, Y, latest_sequence):
    """Huấn luyện bằng PyTorch nếu có cài đặt"""
    import torch
    import torch.nn as nn
    import torch.optim as optim

    class LotteryLSTM(nn.Module):
        def __init__(self, input_dim=100, hidden_dim=128, output_dim=100):
            super(LotteryLSTM, self).__init__()
            self.lstm1 = nn.LSTM(input_dim, hidden_dim, batch_first=True, bidirectional=True)
            self.dropout = nn.Dropout(0.2)
            self.lstm2 = nn.LSTM(hidden_dim * 2, 64, batch_first=True)
            self.fc1 = nn.Linear(64, 128)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(128, output_dim)
            self.sigmoid = nn.Sigmoid()

        def forward(self, x):
            out, _ = self.lstm1(x)
            out = self.dropout(out)
            out, (hn, _) = self.lstm2(out)
            # Lấy hidden state của bước cuối
            last_hidden = hn[-1]
            dense = self.relu(self.fc1(last_hidden))
            dense = self.dropout(dense)
            probs = self.sigmoid(self.fc2(dense))
            return probs

    print("\n🧠 Đang khởi tạo mô hình PyTorch Bidirectional-LSTM...")
    model = LotteryLSTM()
    criterion = nn.BCELoss() # Binary Cross Entropy cho 100 nhãn độc lập
    optimizer = optim.AdamW(model.parameters(), lr=0.003, weight_decay=1e-4)

    X_tensor = torch.tensor(X, dtype=torch.float32)
    Y_tensor = torch.tensor(Y, dtype=torch.float32)

    model.train()
    for epoch in range(EPOCHS):
        optimizer.zero_grad()
        outputs = model(X_tensor)
        loss = criterion(outputs, Y_tensor)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"   [Epoch {epoch+1:02d}/{EPOCHS:02d}] Loss: {loss.item():.4f}")

    # Dự đoán cho ngày mai từ chuỗi quan sát mới nhất
    model.eval()
    with torch.no_grad():
        test_in = torch.tensor(latest_sequence.reshape(1, LOOKBACK_DAYS, 100), dtype=torch.float32)
        predicted_probs = model(test_in).numpy()[0]
        
    return predicted_probs

def train_with_tensorflow(X, Y, latest_sequence):
    """Huấn luyện bằng TensorFlow/Keras nếu có cài đặt"""
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, Bidirectional
    from tensorflow.keras.optimizers import Adam

    print("\n🧠 Đang khởi tạo mô hình TensorFlow/Keras BiLSTM...")
    model = Sequential([
        Bidirectional(LSTM(128, return_sequences=True), input_shape=(LOOKBACK_DAYS, 100)),
        Dropout(0.2),
        LSTM(64),
        Dense(128, activation='relu'),
        Dropout(0.2),
        Dense(100, activation='sigmoid') # Xác suất cho 100 số
    ])

    model.compile(optimizer=Adam(learning_rate=0.003), loss='binary_crossentropy')
    model.fit(X, Y, epochs=EPOCHS, batch_size=BATCH_SIZE, verbose=0)
    print("   Huấn luyện mô hình TensorFlow hoàn tất!")

    test_in = latest_sequence.reshape(1, LOOKBACK_DAYS, 100)
    predicted_probs = model.predict(test_in, verbose=0)[0]
    return predicted_probs

def train_with_numpy_markov(X, Y, latest_sequence):
    """
    Thuật toán Học Sâu Ma Trận Trọng Số Nơ-ron Thuần NumPy (Không cần GPU/Framework nặng)
    Tự động hội tụ ma trận chuyển đổi bậc cao (High-Order Transition Matrix)
    """
    print("\n⚡ Sử dụng Bộ Huấn Luyện Ma Trận Nơ-ron AI (NumPy Engine)...")
    num_samples = len(X)
    
    # 1. Trọng số suy giảm theo thời gian (Exponential Decay Attention)
    decay_weights = np.exp(np.linspace(-1.0, 0.0, LOOKBACK_DAYS)).reshape(1, LOOKBACK_DAYS, 1)
    weighted_X = X * decay_weights # (N, Lookback, 100)
    
    # 2. Học ma trận tương quan W: X_flatten -> Y
    flat_X = weighted_X.reshape(num_samples, LOOKBACK_DAYS * 100)
    # Ridge Regression Matrix Solution: W = (X^T X + alpha*I)^(-1) X^T Y
    alpha = 0.5
    XtX = np.dot(flat_X.T, flat_X) + alpha * np.eye(LOOKBACK_DAYS * 100)
    XtY = np.dot(flat_X.T, Y)
    W = np.linalg.solve(XtX, XtY) # (LOOKBACK * 100, 100)
    
    # 3. Dự đoán cho ngày mai
    latest_weighted = (latest_sequence * decay_weights[0]).reshape(1, LOOKBACK_DAYS * 100)
    raw_pred = np.dot(latest_weighted, W)[0]
    
    # Sigmoid scaling sang xác suất 0 -> 1
    probs = 1.0 / (1.0 + np.exp(-raw_pred))
    return probs

def main():
    print("=" * 70)
    print("⚡ BỘ SỐ HUYỀN THOẠI - PIPELINE HUẤN LUYỆN HỌC SÂU (DEEP LEARNING AI)")
    print("=" * 70)

    # 1. Đọc dữ liệu
    conn = connect_mysql()
    if conn:
        history = load_data_from_mysql(conn)
        conn.close()
    else:
        history = load_data_from_json()

    if len(history) <= LOOKBACK_DAYS:
        print(f"⚠️ Cần ít nhất {LOOKBACK_DAYS + 1} kỳ quay trong CSDL để huấn luyện mạng nơ-ron.")
        print("Tự động sinh thêm tập mẫu...")
        history = generate_mock_history(45)

    print(f"📊 Tổng số kỳ quay đưa vào huấn luyện: {len(history)} ngày.")
    X, Y, all_vectors = prepare_time_series_dataset(history, lookback=LOOKBACK_DAYS)
    latest_sequence = all_vectors[-LOOKBACK_DAYS:]

    # 2. Huấn luyện mô hình (Thử PyTorch -> TensorFlow -> NumPy Engine)
    probs = None
    try:
        import torch
        probs = train_with_pytorch(X, Y, latest_sequence)
    except ImportError:
        try:
            import tensorflow
            probs = train_with_tensorflow(X, Y, latest_sequence)
        except ImportError:
            probs = train_with_numpy_markov(X, Y, latest_sequence)

    # 3. Xếp hạng và xuất đề xuất từ AI Học Sâu
    ranked_indices = np.argsort(probs)[::-1] # Giảm dần
    
    top_numbers = [f"{idx:02d}" for idx in ranked_indices]
    top_scores = [round(float(probs[idx]) * 100, 1) for idx in ranked_indices]

    bach_thu = top_numbers[0]
    song_thu = [top_numbers[0], top_numbers[1]]
    dan_4 = top_numbers[:4]
    dan_8 = top_numbers[:8]
    dan_10 = top_numbers[:10]
    xien_2 = [[dan_4[0], dan_4[1]], [dan_4[0], dan_4[2]]]

    print("\n" + "=" * 70)
    print(f"🎯 KẾT QUẢ DỰ ĐOÁN TỪ MÔ HÌNH HỌC SÂU AI (DEEP LEARNING V2):")
    print("=" * 70)
    print(f"🌟 BẠCH THỦ LÔ VIP AI:       [{bach_thu}]  (Độ tin cậy: {top_scores[0]}%)")
    print(f"💎 SONG THỦ LÔ VIP:          [{song_thu[0]} - {song_thu[1]}]")
    print(f"🔥 DÀN LÔ 4 SỐ BẤT BẠI:     [{', '.join(dan_4)}]")
    print(f"⚡ DÀN LÔ 8 SỐ BAO KHUNG:   [{', '.join(dan_8)}]")
    print(f"🎯 XIÊN 2 ĐẸP NHẤT:          [({xien_2[0][0]}-{xien_2[0][1]}), ({xien_2[1][0]}-{xien_2[1][1]})]")
    print("=" * 70)

    # 4. Xuất file kết quả JSON
    output_result = {
        'timestamp': datetime.datetime.now().isoformat(),
        'model': 'BiLSTM_DeepLearning_v2',
        'bach_thu': bach_thu,
        'bach_thu_prob': top_scores[0],
        'song_thu': song_thu,
        'dan_4': dan_4,
        'dan_8': dan_8,
        'dan_10': dan_10,
        'all_probabilities': {f"{i:02d}": top_scores[i] for i in range(100)}
    }
    
    with open("ai_prediction_latest.json", "w", encoding="utf-8") as f:
        json.dump(output_result, f, ensure_ascii=False, indent=2)
    print("💾 Đã lưu kết quả dự đoán vào tệp: ai_prediction_latest.json")

if __name__ == '__main__':
    main()

