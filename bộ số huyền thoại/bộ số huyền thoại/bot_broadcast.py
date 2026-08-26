"""
BỘ SỐ HUYỀN THOẠI - MODULE TELEGRAM VIP BROADCAST BOT
Tự động gửi Sổ Tay Chốt Số chuẩn vào Group/Channel Telegram lúc 18h32 hàng ngày
"""

import urllib.request
import urllib.parse
import json
import os
import sys

# Cấu hình Token Telegram chính thức của người dùng
DEFAULT_TELEGRAM_CONFIG = {
    "bot_token": os.environ.get("TELEGRAM_BOT_TOKEN", "8842976723:AAEucGhm6CpJLV59DK_x9HVkxLFOiXYcLAE"),
    "chat_id": os.environ.get("TELEGRAM_CHAT_ID", "-1004394483762")
}

def format_telegram_slip_message(slip_data):
    """
    Định dạng Sổ Tay Chốt Số thành tin nhắn Telegram chuẩn phong cách Hoàng Gia VIP
    """
    draw_date = slip_data.get("drawDate", "Hôm Nay")
    bao_lo = slip_data.get("baoLo", {})
    lo_xien = slip_data.get("loXien", {})
    dac_biet = slip_data.get("dacBiet", {})
    ba_cang = slip_data.get("baCang", {})

    btl = bao_lo.get("btl", "--")
    stl = " - ".join(bao_lo.get("stl", ["--", "--"]))
    dan4 = " - ".join(bao_lo.get("dan4", ["--"]))
    top_kep = ", ".join(bao_lo.get("topKep", ["00", "11"]))
    
    xien_quay_4 = ", ".join(lo_xien.get("xienQuay4", ["--"]))
    xien2_str = " | ".join(lo_xien.get("xienQuayPairs", ["--"])[:3])

    de_btl = dac_biet.get("deBTL", "--")
    cham_de = ", ".join(dac_biet.get("chamDe", ["--"]))
    dan_de_10 = ", ".join(dac_biet.get("danDe10", ["--"]))
    dan_de_36 = ", ".join(dac_biet.get("danDe36", ["--"])[:12]) + "..."

    cang_vip = " - ".join(ba_cang.get("baCangLoVIP", ["--"]))
    dan_3_cang = ", ".join(ba_cang.get("danBaCang", ["--"])[:6])

    msg = f"""👑 <b>BỘ SỐ HUYỀN THOẠI - SỔ TAY CHỐT SỐ NGÀY {draw_date}</b> 👑
<i>(Hệ thống AI Tự Học Tăng Cường • Đã Niêm Phong Cố Định)</i>
━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ <b>1. BAO LÔ TÔ CAO CẤP:</b>
• <b>Bạch Thủ Lô VIP:</b> <code>{btl}</code> 🔥
• <b>Song Thủ Lô VIP:</b> <code>{stl}</code>
• <b>Dàn Lô 4 Con:</b> <code>{dan4}</code>
• <b>Lô Kép Đẹp:</b> <code>{top_kep}</code>

🎯 <b>2. LÔ XIÊN & XIÊN QUAY:</b>
• <b>Dàn Xiên Quay 4 Con:</b> <code>[{xien_quay_4}]</code>
• <b>Cặp Xiên 2 Sáng:</b> <code>{xien2_str}</code>

👑 <b>3. GIẢI ĐẶC BIỆT & DÀN ĐỀ:</b>
• <b>Đề Bạch Thủ VIP:</b> <code>{de_btl}</code> 💎
• <b>Chạm Đề Chuẩn:</b> <code>Chạm [{cham_de}]</code>
• <b>Dàn Đề 10 Số Bất Bại:</b> <code>{dan_de_10}</code>
• <b>Dàn Đề 36 Số:</b> <code>{dan_de_36}</code>

🔮 <b>4. BA CÀNG ĐỈNH CAO:</b>
• <b>3 Càng Lô VIP:</b> <code>{cang_vip}</code>
• <b>Dàn 3 Càng Đẹp:</b> <code>{dan_3_cang}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <i>Chúc toàn thể anh em hôm nay rực rỡ và đại thắng!</i> 🍀"""
    return msg

def send_telegram_broadcast(slip_data, bot_token=None, chat_id=None):
    """
    Gửi tin nhắn qua Telegram Bot API
    """
    token = bot_token or DEFAULT_TELEGRAM_CONFIG["bot_token"]
    target_chat = chat_id or DEFAULT_TELEGRAM_CONFIG["chat_id"]

    message_text = format_telegram_slip_message(slip_data)

    if not token or not target_chat:
        print("\n=======================================================")
        print("📢 [BẢN XEM TRƯỚC TIN NHẮN TELEGRAM BOT SẼ GỬI LÚC 18H32]:")
        print("=======================================================")
        print(message_text.replace("<b>", "").replace("</b>", "").replace("<code>", "").replace("</code>", "").replace("<i>", "").replace("</i>", ""))
        print("=======================================================")
        print("ℹ️ Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.")
        print("💡 Để gửi thật vào nhóm, bạn chỉ cần điền Token và Chat ID vào file bot_broadcast.py!")
        return {"status": "preview_mode", "message": "Tin nhắn đã được tạo sẵn sàng"}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": target_chat,
        "text": message_text,
        "parse_mode": "HTML"
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode())
            if res_data.get("ok"):
                print("✅ [Telegram Bot] Đã bắn số thành công vào nhóm chat!")
                return {"status": "success", "result": res_data}
            else:
                print(f"❌ [Telegram Bot Lỗi]: {res_data}")
                return {"status": "error", "error": res_data}
    except Exception as e:
        print(f"❌ [Telegram Bot Exception]: {str(e)}")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    sample_slip = {
        "drawDate": "28/08/2026",
        "baoLo": {"btl": "34", "stl": ["34", "43"], "dan4": ["34", "89", "23", "06"], "topKep": ["33", "88"]},
        "loXien": {"xienQuay4": ["34", "89", "23", "06"], "xienQuayPairs": ["(34-89)", "(34-23)", "(89-23)"]},
        "dacBiet": {"deBTL": "23", "chamDe": ["2", "3", "7"], "danDe10": ["23", "32", "27", "72", "34", "43", "37", "73", "28", "82"], "danDe36": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]},
        "baCang": {"baCangLoVIP": ["834", "334"], "danBaCang": ["834", "334", "843", "343", "823", "323"]}
    }
    send_telegram_broadcast(sample_slip)

