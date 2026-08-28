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
import hashlib
import hmac
import secrets
import time
import base64

# Import bot module
try:
    from bot_broadcast import send_telegram_broadcast
except ImportError:
    def send_telegram_broadcast(data):
        print("Bot broadcast module not found.")

PORT = int(os.environ.get("PORT", 8080))
MASTER_STORAGE_FILE = "master_canonical_data.json"
SERVER_SECRET_KEY = os.environ.get("SERVER_SECRET_KEY", "b0_s0_huy3n_th04i_s3cur3_k3y_2026_@#$%_vip")

# ==============================================================================
# 🛡️ SECURITY & AUTHENTICATION MANAGER (BẢO MẬT CẤP CAO & CHỐNG DÒ BRUTE-FORCE)
# ==============================================================================
LOGIN_ATTEMPTS = {}  # { ip_or_username: { "count": int, "locked_until": float, "reset_at": float } }

def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(stored_hash, password):
    try:
        if not stored_hash or '$' not in stored_hash:
            return False
        salt, hash_val = stored_hash.split('$')
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return hmac.compare_digest(key.hex(), hash_val)
    except Exception:
        return False

def generate_session_token(username, role, full_name=""):
    timestamp = int(time.time())
    data = f"{username}|{role}|{full_name}|{timestamp}"
    sig = hmac.new(SERVER_SECRET_KEY.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()
    token_payload = f"{data}|{sig}"
    return base64.urlsafe_b64encode(token_payload.encode('utf-8')).decode('utf-8')

def verify_session_token(token_str, max_age_days=30):
    try:
        if not token_str:
            return None
        raw = base64.urlsafe_b64decode(token_str.encode('utf-8')).decode('utf-8')
        parts = raw.split('|')
        if len(parts) != 5:
            return None
        username, role, full_name, ts_str, sig = parts
        ts = int(ts_str)
        if time.time() - ts > max_age_days * 86400:
            return None  # Token hết hạn
        data = f"{username}|{role}|{full_name}|{ts_str}"
        expected_sig = hmac.new(SERVER_SECRET_KEY.encode('utf-8'), data.encode('utf-8'), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected_sig):
            return {"username": username, "role": role, "full_name": full_name, "created_at": ts}
    except Exception:
        pass
    return None

def check_rate_limit(key):
    now = time.time()
    record = LOGIN_ATTEMPTS.get(key)
    if record:
        if record.get("locked_until", 0) > now:
            remaining = int(record["locked_until"] - now)
            return False, f"Tài khoản/IP tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau {remaining} giây."
        if now > record.get("reset_at", 0):
            LOGIN_ATTEMPTS[key] = {"count": 0, "reset_at": now + 900}
    return True, None

def record_login_failure(key):
    now = time.time()
    record = LOGIN_ATTEMPTS.setdefault(key, {"count": 0, "reset_at": now + 900})
    record["count"] += 1
    if record["count"] >= 5:
        record["locked_until"] = now + 900  # Khóa IP/User 15 phút nếu sai 5 lần
        return True
    return False

def record_login_success(key):
    LOGIN_ATTEMPTS.pop(key, None)

def ensure_default_users(storage):
    """Khởi tạo và bảo mật tài khoản admin và user VIP mặc định"""
    if "users" not in storage:
        storage["users"] = {}
    
    # 1. Tài khoản Admin tối cao
    if "admin" not in storage["users"]:
        storage["users"]["admin"] = {
            "username": "admin",
            "password_hash": hash_password("sondeptrai2005@@@@"),
            "role": "admin",
            "full_name": "Quản Trị Viên Tối Cao",
            "created_at": datetime.datetime.now().isoformat()
        }
    
    # 2. Tài khoản Khách VIP
    if "loc889999" not in storage["users"]:
        storage["users"]["loc889999"] = {
            "username": "loc889999",
            "password_hash": hash_password("Hoa160881"),
            "role": "user",
            "full_name": "Thành Viên VIP",
            "created_at": datetime.datetime.now().isoformat()
        }
    return storage

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
    storage = None
    if os.path.exists(MASTER_STORAGE_FILE):
        try:
            with open(MASTER_STORAGE_FILE, "r", encoding="utf-8") as f:
                storage = json.load(f)
        except Exception:
            pass
    
    if not storage:
        storage = {
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
    
    storage = ensure_default_users(storage)
    return storage

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

    # Định dạng URL theo ngày
    url = "https://xsmb.me"
    if date_str:
        try:
            parts = date_str.split('-')
            if len(parts) == 3:
                url = f"https://xsmb.me/kqxsmb-ngay-{parts[2]}-{parts[1]}-{parts[0]}.html"
        except Exception:
            pass

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=7) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            # Bóc tách 27 giải bằng regex
            prize_order = [
                ('gdb', 1), ('g1', 1), ('g2_1', 1), ('g2_2', 1),
                ('g3_1', 1), ('g3_2', 1), ('g3_3', 1), ('g3_4', 1), ('g3_5', 1), ('g3_6', 1),
                ('g4_1', 1), ('g4_2', 1), ('g4_3', 1), ('g4_4', 1),
                ('g5_1', 1), ('g5_2', 1), ('g5_3', 1), ('g5_4', 1), ('g5_5', 1), ('g5_6', 1),
                ('g6_1', 1), ('g6_2', 1), ('g6_3', 1),
                ('g7_1', 1), ('g7_2', 1), ('g7_3', 1), ('g7_4', 1)
            ]

            num_matches = re.findall(r'<span class="v-g\w+[^>]*>(\d+)</span>|<strong class="v-g\w+[^>]*>(\d+)</strong>', html)
            nums = [m[0] or m[1] for m in num_matches if (m[0] or m[1])]

            if len(nums) >= 27:
                raw_prizes = {}
                lotto_numbers = []
                for i, (key, _) in enumerate(prize_order):
                    val = nums[i]
                    raw_prizes[key] = val
                    if len(val) >= 2:
                        lotto_numbers.append(val[-2:])
                
                return {
                    "status": "success",
                    "source": "live_xsmb_me",
                    "draw_date": date_str or datetime.datetime.now().strftime("%Y-%m-%d"),
                    "raw_prizes": raw_prizes,
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
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def get_authenticated_user(self):
        auth_header = self.headers.get('Authorization', '')
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        if not token:
            parsed = urllib.parse.urlparse(self.path)
            q = urllib.parse.parse_qs(parsed.query)
            token = q.get('token', [''])[0]
        if token:
            return verify_session_token(token)
        return None

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

        elif path == '/api/auth/me':
            user = self.get_authenticated_user()
            if user:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'authenticated', 'user': user}, ensure_ascii=False).encode('utf-8'))
            else:
                self.send_response(401)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'unauthenticated', 'message': 'Chưa đăng nhập hoặc phiên đã hết hạn'}, ensure_ascii=False).encode('utf-8'))
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

        if path == '/admin' or path == '/admin/':
            self.path = '/admin.html'

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

        if path == '/api/auth/login':
            client_ip = self.client_address[0] if self.client_address else "unknown_ip"
            username = (body_json.get('username') or '').strip().lower()
            password = body_json.get('password') or ''

            rate_limit_key = f"{client_ip}_{username}"
            allowed, limit_msg = check_rate_limit(rate_limit_key)
            if not allowed:
                self.send_response(429)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': limit_msg}, ensure_ascii=False).encode('utf-8'))
                return

            if not username or not password:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu'}, ensure_ascii=False).encode('utf-8'))
                return

            storage = load_master_canonical_storage()
            users = storage.get("users", {})
            user_data = users.get(username)

            if not user_data or not verify_password(user_data.get('password_hash'), password):
                is_locked = record_login_failure(rate_limit_key)
                self.send_response(401)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                msg = "Tài khoản hoặc mật khẩu không chính xác."
                if is_locked:
                    msg = "Bạn đã nhập sai quá 5 lần. Tài khoản và IP đã bị tạm khóa 15 phút để bảo vệ hệ thống!"
                self.wfile.write(json.dumps({'status': 'error', 'message': msg}, ensure_ascii=False).encode('utf-8'))
                return

            # Đăng nhập thành công
            record_login_success(rate_limit_key)
            role = user_data.get('role', 'user')
            full_name = user_data.get('full_name', username)
            token = generate_session_token(username, role, full_name)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'token': token,
                'user': {
                    'username': username,
                    'role': role,
                    'full_name': full_name
                },
                'message': 'Đăng nhập thành công'
            }, ensure_ascii=False).encode('utf-8'))
            return

        elif path == '/api/auth/register':
            username = (body_json.get('username') or '').strip().lower()
            password = body_json.get('password') or ''
            full_name = (body_json.get('full_name') or username).strip()

            if not username or len(username) < 3:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Tên đăng nhập phải có ít nhất 3 ký tự (chữ hoặc số)'}, ensure_ascii=False).encode('utf-8'))
                return

            if not password or len(password) < 6:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Mật khẩu phải có ít nhất 6 ký tự'}, ensure_ascii=False).encode('utf-8'))
                return

            storage = load_master_canonical_storage()
            if "users" not in storage:
                storage["users"] = {}

            if username in storage["users"]:
                self.send_response(409)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': 'Tên tài khoản này đã tồn tại. Vui lòng chọn tên khác!'}, ensure_ascii=False).encode('utf-8'))
                return

            # Tạo user mới với quyền user
            storage["users"][username] = {
                "username": username,
                "password_hash": hash_password(password),
                "role": "user",
                "full_name": full_name,
                "created_at": datetime.datetime.now().isoformat()
            }
            save_master_canonical_storage(storage)

            token = generate_session_token(username, "user", full_name)
            self.send_response(201)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'success',
                'token': token,
                'user': {
                    'username': username,
                    'role': 'user',
                    'full_name': full_name
                },
                'message': 'Đăng ký tài khoản thành viên VIP thành công!'
            }, ensure_ascii=False).encode('utf-8'))
            return

        elif path == '/api/save-draw':
            # BẢO VỆ ENDPOINT: Bắt buộc quyền Admin
            user = self.get_authenticated_user()
            if not user or user.get('role') != 'admin':
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': '⛔ Từ chối truy cập: Yêu cầu quyền Quản Trị Viên (Admin) để thực hiện thao tác này!'
                }, ensure_ascii=False).encode('utf-8'))
                return

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
            # BẢO VỆ ENDPOINT: Bắt buộc quyền Admin
            user = self.get_authenticated_user()
            if not user or user.get('role') != 'admin':
                self.send_response(403)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'error',
                    'message': '⛔ Từ chối truy cập: Yêu cầu quyền Quản Trị Viên (Admin) để bắn Telegram!'
                }, ensure_ascii=False).encode('utf-8'))
                return

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
    print(f"🛡️ Phân Quyền & Bảo Mật: RBAC (Admin & User VIP) Đã Sẵn Sàng")
    print(f"==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐang dừng máy chủ...")
        httpd.server_close()
