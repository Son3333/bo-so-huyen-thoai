FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
ENV TELEGRAM_BOT_TOKEN="8842976723:AAEucGhm6CpJLV59DK_x9HVkxLFOiXYcLAE"
ENV TELEGRAM_CHAT_ID="-1004394483762"

EXPOSE 8080

CMD ["python", "api_server.py"]

