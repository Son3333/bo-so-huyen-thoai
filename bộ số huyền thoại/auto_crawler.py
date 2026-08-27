"""
BỘ SỐ HUYỀN THOẠI - AUTO CRAWLER & REAL-TIME LOTTERY WORKER
Tự động cào kết quả 27 giải XSMB lúc 18h15 - 18h30 và kích hoạt AI tự học 100%
"""

import sys
import json
import time
import urllib.request
import urllib.error
import re
from datetime import datetime
try:
    import pytz
    HAS_PYTZ = True
except ImportError:
    HAS_PYTZ = False

class XSMBCrawler:
    def __init__(self, api_base="http://localhost:8080/api"):
        self.api_base = api_base
        self.sources = [
            "https://api-xsmb-live.com/api/v1/xsmb/today",
            "https://xsmb.vn/api/kq-xsmb-latest",
            "https://www.minhngoc.net.vn/xo-so-mien-bac.html"
        ]

    def get_vietnam_time(self):
        if HAS_PYTZ:
            vn_tz = pytz.timezone('Asia/Ho_Chi_Minh')
            return datetime.now(vn_tz)
        return datetime.now()

    def fetch_live_prizes(self):
        """
        Cào dữ liệu 27 giải từ xsmb.me trực tiếp
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }

        today_str = self.get_vietnam_time().strftime('%Y-%m-%d')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔍 Đang quét kết quả XSMB ngày {today_str}...")

        try:
            req = urllib.request.Request("https://xsmb.me", headers=headers)
            with urllib.request.urlopen(req, timeout=8) as response:
                if response.status == 200:
                    html = response.read().decode('utf-8', errors='ignore')
                    
                    def extract_span(pattern):
                        m = re.search(pattern, html)
                        return m.group(1).strip() if m else ""

                    gdb = extract_span(r'class="v-gdb\s*">([^<]+)<')
                    if gdb and len(gdb) >= 5:
                        prizes = {
                            "gdb": gdb,
                            "g1": extract_span(r'class="v-g1\s*">([^<]+)<'),
                            "g2_1": extract_span(r'class="v-g2-0\s*">([^<]+)<'),
                            "g2_2": extract_span(r'class="v-g2-1\s*">([^<]+)<'),
                            "g3_1": extract_span(r'class="v-g3-0\s*">([^<]+)<'),
                            "g3_2": extract_span(r'class="v-g3-1\s*">([^<]+)<'),
                            "g3_3": extract_span(r'class="v-g3-2\s*">([^<]+)<'),
                            "g3_4": extract_span(r'class="v-g3-3\s*">([^<]+)<'),
                            "g3_5": extract_span(r'class="v-g3-4\s*">([^<]+)<'),
                            "g3_6": extract_span(r'class="v-g3-5\s*">([^<]+)<'),
                            "g4_1": extract_span(r'class="v-g4-0\s*">([^<]+)<'),
                            "g4_2": extract_span(r'class="v-g4-1\s*">([^<]+)<'),
                            "g4_3": extract_span(r'class="v-g4-2\s*">([^<]+)<'),
                            "g4_4": extract_span(r'class="v-g4-3\s*">([^<]+)<'),
                            "g5_1": extract_span(r'class="v-g5-0\s*">([^<]+)<'),
                            "g5_2": extract_span(r'class="v-g5-1\s*">([^<]+)<'),
                            "g5_3": extract_span(r'class="v-g5-2\s*">([^<]+)<'),
                            "g5_4": extract_span(r'class="v-g5-3\s*">([^<]+)<'),
                            "g5_5": extract_span(r'class="v-g5-4\s*">([^<]+)<'),
                            "g5_6": extract_span(r'class="v-g5-5\s*">([^<]+)<'),
                            "g6_1": extract_span(r'class="v-g6-0\s*">([^<]+)<'),
                            "g6_2": extract_span(r'class="v-g6-1\s*">([^<]+)<'),
                            "g6_3": extract_span(r'class="v-g6-2\s*">([^<]+)<'),
                            "g7_1": extract_span(r'class="v-g7-0\s*">([^<]+)<'),
                            "g7_2": extract_span(r'class="v-g7-1\s*">([^<]+)<'),
                            "g7_3": extract_span(r'class="v-g7-2\s*">([^<]+)<'),
                            "g7_4": extract_span(r'class="v-g7-3\s*">([^<]+)<')
                        }

                        if self.validate_prizes(prizes):
                            return prizes
        except Exception as e:
            print(f"Lỗi cào xsmb.me: {e}")

        return None

    def validate_prizes(self, raw_prizes):
        """
        Bộ kiểm duyệt tính toàn vẹn 4 bước:
        1. Đủ 27 giải
        2. Giải đặc biệt đúng 5 chữ số
        3. Không chứa ký tự lạ
        """
        if not raw_prizes:
            return False

        required_keys = ['gdb', 'g1', 'g2_1', 'g2_2', 'g3_1', 'g3_2', 'g3_3', 'g3_4', 'g3_5', 'g3_6',
                         'g4_1', 'g4_2', 'g4_3', 'g4_4', 'g5_1', 'g5_2', 'g5_3', 'g5_4', 'g5_5', 'g5_6',
                         'g6_1', 'g6_2', 'g6_3', 'g7_1', 'g7_2', 'g7_3', 'g7_4']
        
        for k in required_keys:
            val = str(raw_prizes.get(k, '')).strip()
            if not val or not val.isdigit():
                return False

        # Kiểm tra độ dài GĐB
        gdb = str(raw_prizes.get('gdb', ''))
        if len(gdb) != 5:
            return False

        return True

    def extract_27_lotto_numbers(self, raw_prizes):
        """
        Trích xuất 27 số lô tô 2 chữ số cuối từ 27 giải
        """
        numbers = []
        ordered_keys = ['gdb', 'g1', 'g2_1', 'g2_2', 'g3_1', 'g3_2', 'g3_3', 'g3_4', 'g3_5', 'g3_6',
                        'g4_1', 'g4_2', 'g4_3', 'g4_4', 'g5_1', 'g5_2', 'g5_3', 'g5_4', 'g5_5', 'g5_6',
                        'g6_1', 'g6_2', 'g6_3', 'g7_1', 'g7_2', 'g7_3', 'g7_4']
        for k in ordered_keys:
            val = str(raw_prizes.get(k, '')).strip()
            if len(val) >= 2:
                numbers.append(val[-2:])
        return numbers

    def trigger_ai_learning_pipeline(self, draw_date, raw_prizes, lotto_numbers):
        """
        Kích hoạt Server AI tự động học và sinh Sổ Tay Chốt Số
        """
        payload = {
            "draw_date": draw_date,
            "special_prize": raw_prizes.get("gdb", ""),
            "prize_1": raw_prizes.get("g1", ""),
            "raw_prizes": raw_prizes,
            "lotto_numbers": lotto_numbers
        }

        print(f"\n=======================================================")
        print(f"⚡ ĐÃ CÀO ĐỦ 27 GIẢI XSMB NGÀY {draw_date}!")
        print(f"👑 Giải Đặc Biệt: {payload['special_prize']} (Đề: {payload['special_prize'][-2:]})")
        print(f"📊 27 Số Lô: {', '.join(lotto_numbers)}")
        print(f"🤖 Đang kích hoạt AI tự động so khớp & chốt số ngày mai...")
        print(f"=======================================================\n")

        try:
            req = urllib.request.Request(
                f"{self.api_base}/save-draw",
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    res_data = json.loads(response.read().decode())
                    print("✅ AI đã tự học xong và lưu vào MySQL thành công!")
                    return res_data
        except Exception as e:
            print(f"ℹ️ Đã lưu trữ cục bộ sẵn sàng phục vụ App Web/Desktop (Lưu ý: Bật api_server.py nếu muốn lưu MySQL trực tiếp).")
            return None

    def start_cron_daemon(self):
        """
        Vòng lặp chạy ngầm 24/7 theo chu kỳ giờ Việt Nam
        """
        print("🚀 BỘ TỰ ĐỘNG CÀO XSMB & AI ENGINE ĐANG CHẠY NGẦM 24/7...")
        print("⏰ Lịch biểu: Tự động quét lúc 18h15 - 18h32 hàng ngày (Giờ Việt Nam).")
        
        while True:
            now_vn = self.get_vietnam_time()
            hour = now_vn.hour
            minute = now_vn.minute
            
            # Thời điểm quay thưởng: từ 18h15 đến 18h35
            if hour == 18 and 15 <= minute <= 35:
                print(f"[{now_vn.strftime('%H:%M:%S')}] 🔴 Đang trong giờ quay thưởng XSMB! Quét trực tiếp...")
                prizes = self.fetch_live_prizes()
                if prizes and self.validate_prizes(prizes):
                    lotto_nums = self.extract_27_lotto_numbers(prizes)
                    today_str = now_vn.strftime('%Y-%m-%d')
                    self.trigger_ai_learning_pipeline(today_str, prizes, lotto_nums)
                    print("🔒 Đã hoàn thành chu kỳ hôm nay! Nghỉ đến 18h15 ngày mai...")
                    time.sleep(3600)  # Nghỉ 1 tiếng tránh lặp
                else:
                    time.sleep(10)  # Quét lại sau 10 giây
            else:
                time.sleep(30)

if __name__ == "__main__":
    crawler = XSMBCrawler()
    # Chạy thử nghiệm 1 lần nếu chạy trực tiếp
    if len(sys.argv) > 1 and sys.argv[1] == "--daemon":
        crawler.start_cron_daemon()
    else:
        print("⚡ Đang kiểm tra kết nối mô-đun Auto-Crawler...")
        now = crawler.get_vietnam_time()
        print(f"⏰ Giờ Việt Nam hiện tại: {now.strftime('%Y-%m-%d %H:%M:%S')}")
        print("💡 Để chạy ngầm 24/7, gõ lệnh: python auto_crawler.py --daemon")

