"""
================================================================================
BỘ SỐ HUYỀN THOẠI - MASTER REST API SERVER & SINGLE SOURCE OF TRUTH
Trung tâm phát hành Bản Chốt Số Chuẩn Duy Nhất & Điều Khiển Bot Telegram/Zalo
================================================================================
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import datetime
import sys

# Import bot module
try:
    from bot_broadcast import send_telegram_broadcast
except ImportError:
    def send_telegram_broadcast(data):
        print("Bot broadcast module not found.")

PORT = int(os.environ.get("PORT", 8080))
MASTER_STORAGE_FILE = "master_canonical_data.json"

# MySQL Config (Tùy chọn nếu có database)
MYSQL_CONFIG = {
    'host': os.environ.get("DB_HOST", "localhost"),
    'port': int(os.environ.get("DB_PORT", 3306)),
    'user': os.environ.get("DB_USER", "root"),
    'password': os.environ.get("DB_PASSWORD", ""),
    'database': os.environ.get("DB_NAME", "bo_so_huyen_thoai")
}

def get_mysql_connection():
    try:
        import mysql.connector
        return mysql.connector.connect(**MYSQL_CONFIG)
    except Exception:
        return None

def load_master_canonical_storage():
    """Đọc kho dữ liệu chuẩn từ file JSON Master (Đảm bảo chạy độc lập trên mọi Cloud)"""
    if os.path.exists(MASTER_STORAGE_FILE):
        try:
            with open(MASTER_STORAGE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    
    # Dữ liệu khởi tạo chuẩn
    return {
        "locked_days": {
            "2026-08-26": {
                "drawDate": "2026-08-26",
                "specialPrize": "84723",
                "fullBettingSlip": {
                    "drawDate": "2026-08-26",
                    "baoLo": {"btl": "34", "stl": ["34", "43"], "topKep": ["33", "88"], "dan4": ["34", "89", "23", "06"], "dan8": ["34", "89", "23", "06", "79", "14", "60", "88"], "dan10": ["34", "43", "89", "23", "06", "79", "14", "60", "88", "12"]},
                    "loXien": {"xien2": [["34", "89"], ["34", "23"], ["89", "23"]], "xien3": [["34", "89", "23"], ["34", "89", "06"]], "xien4": [["34", "89", "23", "06"]], "xienQuay4": ["34", "89", "23", "06"], "xienQuayPairs": ["(34-89)", "(34-23)", "(34-06)", "(89-23)", "(89-06)", "(23-06)"], "xienQuayTriplets": ["(34-89-23)", "(34-89-06)", "(34-23-06)", "(89-23-06)"]},
                    "dacBiet": {"deBTL": "23", "deSTL": ["23", "32"], "chamDe": ["2", "3", "7"], "danDe10": ["23", "32", "27", "72", "34", "43", "37", "73", "28", "82"], "danDe20": ["23", "32", "27", "72", "34", "43", "37", "73", "28", "82", "20", "02", "30", "03", "70", "07", "29", "92", "39", "93"], "danDe36": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "02", "12", "42", "52", "62", "82"], "danDe64": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "02", "12", "42", "52", "62", "82", "03", "13", "43", "53", "63", "83", "07", "17", "47", "57", "67", "87", "00", "11", "44", "55", "66", "88", "99", "08", "80", "18", "81", "48", "84", "58", "85", "68"], "topSums": ["5", "0", "9"]},
                    "baCang": {"topCangs": ["8", "3", "7"], "baCangLoVIP": ["834", "334", "734"], "baCangDeVIP": ["823", "323", "723"], "danBaCang": ["834", "334", "734", "843", "343", "743", "823", "323", "723", "832", "332", "732"]}
                }
            }
        }
    }

def save_master_canonical_storage(data):
    try:
        with open(MASTER_STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Lỗi ghi Master storage: {e}")

def fetch_live_xsmb_prizes(date_str=None):
    """
    Cào kết quả 27 giải XSMB từ nguồn dữ liệu trực tiếp thực tế
    """
    import urllib.request
    import re

    # 1. Quét trực tiếp từ xsmb.me
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    try:
        req = urllib.request.Request("https://xsmb.me", headers=headers)
        with urllib.request.urlopen(req, timeout=6) as response:
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

                    ordered_keys = ['gdb', 'g1', 'g2_1', 'g2_2', 'g3_1', 'g3_2', 'g3_3', 'g3_4', 'g3_5', 'g3_6',
                                    'g4_1', 'g4_2', 'g4_3', 'g4_4', 'g5_1', 'g5_2', 'g5_3', 'g5_4', 'g5_5', 'g5_6',
                                    'g6_1', 'g6_2', 'g6_3', 'g7_1', 'g7_2', 'g7_3', 'g7_4']
                    lotto_numbers = [prizes[k][-2:] for k in ordered_keys if len(prizes.get(k, '')) >= 2]
                    
                    if len(lotto_numbers) >= 27:
                        return {
                            "status": "success",
                            "source": "live_xsmb_me",
                            "draw_date": date_str or datetime.datetime.now().strftime('%Y-%m-%d'),
                            "raw_prizes": prizes,
                            "lotto_numbers": lotto_numbers
                        }
    except Exception as e:
        print(f"Lỗi cào xsmb.me: {e}")

    # Fallback to storage
    storage = load_master_canonical_storage()
    locked_days = storage.get("locked_days", {})
    if date_str and date_str in locked_days:
        day_data = locked_days[date_str]
        raw = day_data.get("rawPrizes") or day_data.get("raw_prizes") or (day_data.get("inputData", {}).get("rawPrizes"))
        lotto = day_data.get("lottoNumbers") or day_data.get("lotto_numbers") or (day_data.get("inputData", {}).get("lottoNumbers"))
        if raw and lotto:
            return {"status": "success", "source": "master_storage", "draw_date": date_str, "raw_prizes": raw, "lotto_numbers": lotto}

    return None

class MasterAPIRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == '/api/status':
            conn = get_mysql_connection()
            status = 'connected' if conn else 'standalone_cloud_mode'
            if conn: conn.close()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'online',
                'database_mode': status,
                'server_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'master_authority': True
            }).encode('utf-8'))
            return

        elif path == '/api/canonical-slip':
            storage = load_master_canonical_storage()
            locked_days = storage.get("locked_days", {})
            date_param = query.get('date', [None])[0]

            if date_param and date_param in locked_days:
                res_data = locked_days[date_param]
            else:
                # Trả về bản chốt số của ngày mới nhất
                dates = sorted(list(locked_days.keys()), reverse=True)
                latest_date = dates[0] if dates else None
                res_data = locked_days.get(latest_date, None) if latest_date else None

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'data': res_data
            }, ensure_ascii=False).encode('utf-8'))
            return

        elif path == '/api/latest-draw':
            date_param = query.get('date', [None])[0]
            live_data = fetch_live_xsmb_prizes(date_param)
            
            if live_data:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps(live_data, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': 'Chưa có kết quả hoặc máy chủ đang quét'
                }, ensure_ascii=False).encode('utf-8'))
            return

        elif path == '/api/history':
            storage = load_master_canonical_storage()
            locked_days = storage.get("locked_days", {})
            history_list = []
            for d in sorted(list(locked_days.keys()), reverse=True):
                history_list.append(locked_days[d])

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'count': len(history_list),
                'history': history_list
            }, ensure_ascii=False).encode('utf-8'))
            return

        # Phục vụ các file tĩnh (HTML, CSS, JS) cho Web Client
        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        
        try:
            body_json = json.loads(post_body)
        except Exception:
            body_json = {}

        if path == '/api/save-draw':
            draw_date = body_json.get('draw_date')
            raw_prizes = body_json.get('raw_prizes', {})
            lotto_numbers = body_json.get('lotto_numbers', [])
            full_slip = body_json.get('full_betting_slip', None)

            if not draw_date:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Thiếu draw_date'}).encode('utf-8'))
                return

            storage = load_master_canonical_storage()
            if "locked_days" not in storage:
                storage["locked_days"] = {}

            storage["locked_days"][draw_date] = {
                "drawDate": draw_date,
                "inputData": {
                    "date": draw_date,
                    "specialPrize": body_json.get("special_prize", ""),
                    "rawPrizes": raw_prizes,
                    "lottoNumbers": lotto_numbers
                },
                "fullBettingSlip": full_slip or {
                    "drawDate": draw_date,
                    "baoLo": {"btl": "34", "stl": ["34", "43"]},
                },
                "lockedAt": datetime.datetime.now().isoformat()
            }
            save_master_canonical_storage(storage)

            # Tự động bắn số qua Telegram Bot nếu có slip
            if full_slip:
                print(f"🤖 [Auto-Broadcast] Đang tự động bắn số ngày {draw_date} vào Telegram...")
                send_telegram_broadcast(full_slip)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'message': f'Đã lưu và khóa cố định bản số chuẩn ngày {draw_date} trên Master Server!'
            }, ensure_ascii=False).encode('utf-8'))
            return

        elif path == '/api/broadcast-telegram':
            slip = body_json.get('slip')
            if not slip:
                storage = load_master_canonical_storage()
                locked_days = storage.get("locked_days", {})
                dates = sorted(list(locked_days.keys()), reverse=True)
                if dates:
                    slip = locked_days[dates[0]].get("fullBettingSlip")

            if slip:
                result = send_telegram_broadcast(slip)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'broadcast_completed', 'details': result}, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Không có bản chốt số để gửi'}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, MasterAPIRequestHandler)
    print(f"==================================================================")
    print(f"👑 BỘ SỐ HUYỀN THOẠI - MASTER CLOUD SERVER ĐANG HOẠT ĐỘNG...")
    print(f"🌐 Cổng API: http://localhost:{PORT}")
    print(f"📡 Chế độ: SINGLE SOURCE OF TRUTH (Một Nguồn Chân Lý Duy Nhất)")
    print(f"🤖 Telegram Broadcast Bot: Sẵn Sàng Bắn Số Lúc 18h32")
    print(f"==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐang dừng máy chủ...")
        httpd.server_close()
