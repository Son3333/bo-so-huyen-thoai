# 🌐 HƯỚNG DẪN 3 BƯỚC ĐƯA HỆ THỐNG LÊN CLOUD 24/7 (MIỄN PHÍ 0Đ)

> **Mục tiêu:** Đưa Master Server lên nền tảng Cloud để hệ thống tự động chạy 24/7, cào kết quả và bắn số vào Telegram **kể cả khi bạn tắt máy tính đi ngủ**.  
> **Thời gian thực hiện:** **3 phút**.

---

### 🚀 BƯỚC 1: Tạo Tài Khoản Cloud Miễn Phí (1 Phút)
1. Truy cập trang web: **https://render.com**
2. Bấm nút **`Get Started for Free`** (hoặc `Sign In`).
3. Đăng nhập nhanh bằng tài khoản **Google** hoặc **GitHub** của bạn.

---

### 🚀 BƯỚC 2: Tạo Dịch Vụ Mới (New Web Service)
1. Trên giao diện Render, bấm nút màu xanh: **`+ New`** (ở góc trên bên phải) $\to$ Chọn **`Web Service`**.
2. Chọn **`Build and deploy from a Git repository`** (hoặc kéo thả mã nguồn).
3. Điền các thông tin đơn giản như sau:
   - **Name:** `bo-so-huyen-thoai`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python api_server.py`
   - **Instance Type:** Chọn gói **`Free ($0/month)`**
4. Kéo xuống mục **Environment Variables** (Biến môi trường), thêm 2 dòng:
   - `TELEGRAM_BOT_TOKEN`: `8842976723:AAEucGhm6CpJLV59DK_x9HVkxLFOiXYcLAE`
   - `TELEGRAM_CHAT_ID`: `-1004394483762`
5. Bấm nút **`Create Web Service`**.

---

### 🚀 BƯỚC 3: Hoàn Tất & Nhận Đường Link Cloud 24/7
1. Chờ Render khởi động trong khoảng **1 - 2 phút**.
2. Khi màn hình hiện chữ **`Live`** màu xanh, bạn sẽ nhận được một đường link chính thức dạng:  
   👉 `https://bo-so-huyen-thoai.onrender.com`
3. **Từ thời điểm này:**
   - Hệ thống của bạn đã chính thức chạy trên Cloud 24/7/365 ngày.
   - Bạn có thể **tắt máy tính đi ngủ**, đúng **18h15 - 18h30** Cloud sẽ tự cào và **18h32 tự bắn số vào nhóm Telegram "Test App"** của bạn!
   - Bạn mở đường link trên điện thoại là xem được giao diện Web mọi lúc mọi nơi!

